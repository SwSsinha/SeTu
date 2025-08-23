const { Router } = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const validateProcess = require('../middleware/validateProcess');
const { scrapeArticle } = require('../services/portia.service');
const { translateText } = require('../services/translate.service');
const { synthesizeToMp3Stream } = require('../services/tts.service');
const { generateRunId } = require('../utils/id');
const { createPhaseTracker } = require('../utils/phaseTracker');
const { Readable } = require('stream');
const { getCached, setCached } = require('../utils/cache');
const { summarize } = require('../utils/summary');

const router = Router();

router.post(
	'/',
	validateProcess,
	asyncHandler(async (req, res) => {
			const { url, lang, voice } = req.processInput;
			const runId = generateRunId();
			req.lastRunId = runId;

		// Cache lookup
		const { hit, key, entry } = getCached({ url, lang, voice });
			if (hit) {
			res.setHeader('X-Cache-Hit', '1');
			res.setHeader('Content-Type', 'audio/mpeg');
				res.setHeader('Content-Disposition', `attachment; filename="setu_${lang}.mp3"`);
				if (entry.id) res.setHeader('X-Result-Id', entry.id);
				res.setHeader('X-Run-Id', runId);
				const m = entry.meta?.metrics || {};
				res.setHeader('X-Retries-Portia', String(m.portiaRetries || 0));
				res.setHeader('X-Retries-Translation', String(m.translationRetries || 0));
				res.setHeader('X-Retries-TTS', String(m.ttsRetries || 0));
			return Readable.from(entry.audioBuffer).pipe(res);
		}

		const metrics = {};
		const articleText = await scrapeArticle({ url, metrics });
		const summaryText = summarize(articleText);
		const translationResult = await translateText({ text: articleText, targetLang: lang, allowPartial: true, metrics });
		let ttsText = translationResult.text;
		if (!ttsText || ttsText.trim().length < 5) {
			// fallback: small slice of original article if translation empty
			ttsText = articleText.slice(0, 400);
		}
		let audioStream;
		try {
			audioStream = await synthesizeToMp3Stream({ text: ttsText, voiceId: voice, metrics });
		} catch (e) {
			if (!translationResult.partial) throw e; // full failure if translation wasn't partial
			// If TTS fails after partial translation, fall back to smaller chunk
			const fallback = ttsText.slice(0, 800);
			audioStream = await synthesizeToMp3Stream({ text: fallback, voiceId: voice, metrics });
		}

		// Buffer audio to cache & send
		const buf = await streamToBuffer(audioStream);
		const { id } = setCached(
			{ url, lang, voice },
			{
				audioBuffer: buf,
				meta: { url, lang, voice, textChars: ttsText.length, summary: summaryText, partial: translationResult.partial, metrics },
			}
		);
		res.setHeader('X-Cache-Hit', '0');
		if (id) res.setHeader('X-Result-Id', id);
		res.setHeader('X-Run-Id', runId);
		if (summaryText) {
			const preview = encodeURIComponent(summaryText.slice(0, 120));
			res.setHeader('X-Summary-Preview', preview);
		}
		if (translationResult.partial) res.setHeader('X-Partial', '1');
		res.setHeader('X-Retries-Portia', String(metrics.portiaRetries || 0));
		res.setHeader('X-Retries-Translation', String(metrics.translationRetries || 0));
		res.setHeader('X-Retries-TTS', String(metrics.ttsRetries || 0));
		res.setHeader('Content-Type', 'audio/mpeg');
		res.setHeader('Content-Disposition', `attachment; filename="setu_${lang}.mp3"`);
		return Readable.from(buf).pipe(res);
	})
);

// Helper to collect a stream into a single Buffer (for small hackathon-size payloads)
async function streamToBuffer(stream) {
	return new Promise((resolve, reject) => {
		const chunks = [];
		stream.on('data', (c) => chunks.push(c));
		stream.on('error', reject);
		stream.on('end', () => resolve(Buffer.concat(chunks)));
	});
}

// Timeline / phases endpoint (JSON response including phases + base64 audio)
router.post(
	'/timeline',
	validateProcess,
	asyncHandler(async (req, res) => {
		const runId = generateRunId();
		const tracker = createPhaseTracker(runId);
		const { url, lang, voice } = req.processInput;
		const metrics = {};

		// Cache check phase (virtual)
		const cachePhase = tracker.start('cache');
		const { hit, key, entry } = getCached({ url, lang, voice });
		if (hit) {
			tracker.succeed(cachePhase, { key, bytes: entry.audioBuffer.length, voice: entry.meta.voice });
			const summary = tracker.summary();
			const m = entry.meta?.metrics || {};
			return res.json({
				...summary,
				status: 'success',
				cacheHit: true,
				resultId: entry.id,
				url,
				lang,
				voice: entry.meta.voice || null,
				retries: {
					portia: m.portiaRetries || 0,
					translation: m.translationRetries || 0,
					tts: m.ttsRetries || 0,
				},
				audio: {
					mime: 'audio/mpeg',
					base64: entry.audioBuffer.toString('base64'),
					dataUri: `data:audio/mpeg;base64,${entry.audioBuffer.toString('base64')}`,
					url: `/api/result/${entry.id}/audio`,
				},
			});
		} else {
			tracker.succeed(cachePhase, { key, hit: false, voice: voice || null });
		}

		let scrapePhase = tracker.start('scrape');
		let articleText;
		try {
			articleText = await scrapeArticle({ url, metrics });
			tracker.succeed(scrapePhase, { length: articleText.length, retries: metrics.portiaRetries || 0 });
		} catch (e) {
			tracker.fail(scrapePhase, e);
			return res.status(e.status || 500).json({ ...tracker.summary(), status: 'error' });
		}

		// Summary phase (after scrape, before translation)
		let summaryPhase = tracker.start('summary');
		let summaryText = '';
		try {
			summaryText = summarize(articleText);
			tracker.succeed(summaryPhase, { length: summaryText.length });
		} catch (e) {
			tracker.fail(summaryPhase, e);
		}

		let translatePhase = tracker.start('translate');
		let translated;
		let translationResult;
		try {
			translationResult = await translateText({ text: articleText, targetLang: lang, allowPartial: true, metrics });
			translated = translationResult.text;
			tracker.succeed(translatePhase, { length: translated.length, partial: translationResult.partial, retries: metrics.translationRetries || 0 });
		} catch (e) {
			// If translation threw without partial data, hard fail
			tracker.fail(translatePhase, e);
			return res.status(e.status || 500).json({ ...tracker.summary(), status: 'error', partial: false });
		}

		let ttsPhase = tracker.start('tts');
		let audioBuffer;
		try {
			let ttsText = translated;
			if (!ttsText || ttsText.trim().length < 5) {
				ttsText = articleText.slice(0, 400);
			}
			let audioStream;
			try {
				audioStream = await synthesizeToMp3Stream({ text: ttsText, voiceId: voice, metrics });
			} catch (e) {
				if (!translationResult.partial) throw e;
				const fallback = ttsText.slice(0, 800);
				audioStream = await synthesizeToMp3Stream({ text: fallback, voiceId: voice, metrics });
			}
			if (!(audioStream instanceof Readable)) {
				const r = new Readable();
				r.push(audioStream); r.push(null);
				audioBuffer = await streamToBuffer(r);
			} else {
				audioBuffer = await streamToBuffer(audioStream);
			}
			tracker.succeed(ttsPhase, { bytes: audioBuffer.length, voice: voice || null, partial: translationResult.partial || false, retries: metrics.ttsRetries || 0 });
		} catch (e) {
			tracker.fail(ttsPhase, e);
			return res.status(e.status || 500).json({ ...tracker.summary(), status: 'error', partial: translationResult?.partial || false });
		}

		// Store in cache
		const { id } = setCached(
			{ url, lang, voice },
			{
				audioBuffer,
				meta: { url, lang, voice, textChars: translated.length, summary: summaryText, partial: translationResult.partial, metrics },
			}
		);

		const summary = tracker.summary();
		res.json({
			...summary,
			status: 'success',
			cacheHit: false,
			resultId: id,
			url,
			lang,
			voice: voice || null,
			summary: summaryText,
			partial: translationResult.partial || false,
			retries: {
				portia: metrics.portiaRetries || 0,
				translation: metrics.translationRetries || 0,
				tts: metrics.ttsRetries || 0,
			},
			audio: {
				mime: 'audio/mpeg',
				base64: audioBuffer.toString('base64'),
				dataUri: `data:audio/mpeg;base64,${audioBuffer.toString('base64')}`,
				url: `/api/result/${id}/audio`,
			},
		});
	})
);

module.exports = router;
