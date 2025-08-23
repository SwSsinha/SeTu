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

const router = Router();

router.post(
	'/',
	validateProcess,
	asyncHandler(async (req, res) => {
		const { url, lang, voice } = req.processInput;

		// Cache lookup
		const { hit, key, entry } = getCached({ url, lang, voice });
			if (hit) {
			res.setHeader('X-Cache-Hit', '1');
			res.setHeader('Content-Type', 'audio/mpeg');
				res.setHeader('Content-Disposition', `attachment; filename="setu_${lang}.mp3"`);
				if (entry.id) res.setHeader('X-Result-Id', entry.id);
			return Readable.from(entry.audioBuffer).pipe(res);
		}

		const articleText = await scrapeArticle({ url });
		const translated = await translateText({ text: articleText, targetLang: lang });
		const audioStream = await synthesizeToMp3Stream({ text: translated, voiceId: voice });

		// Buffer audio to cache & send
		const buf = await streamToBuffer(audioStream);
		const { id } = setCached(
			{ url, lang, voice },
			{
				audioBuffer: buf,
				meta: { url, lang, voice, textChars: translated.length },
			}
		);
		res.setHeader('X-Cache-Hit', '0');
		if (id) res.setHeader('X-Result-Id', id);
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

		// Cache check phase (virtual)
		const cachePhase = tracker.start('cache');
		const { hit, key, entry } = getCached({ url, lang, voice });
		if (hit) {
			tracker.succeed(cachePhase, { key, bytes: entry.audioBuffer.length, voice: entry.meta.voice });
			const summary = tracker.summary();
			return res.json({
				...summary,
				status: 'success',
				cacheHit: true,
				resultId: entry.id,
				url,
				lang,
				voice: entry.meta.voice || null,
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
			articleText = await scrapeArticle({ url });
			tracker.succeed(scrapePhase, { length: articleText.length });
		} catch (e) {
			tracker.fail(scrapePhase, e);
			return res.status(e.status || 500).json({ ...tracker.summary(), status: 'error' });
		}

		let translatePhase = tracker.start('translate');
		let translated;
		try {
			translated = await translateText({ text: articleText, targetLang: lang });
			tracker.succeed(translatePhase, { length: translated.length });
		} catch (e) {
			tracker.fail(translatePhase, e);
			return res.status(e.status || 500).json({ ...tracker.summary(), status: 'error' });
		}

		let ttsPhase = tracker.start('tts');
		let audioBuffer;
		try {
			const audioStream = await synthesizeToMp3Stream({ text: translated, voiceId: voice });
			if (!(audioStream instanceof Readable)) {
				const r = new Readable();
				r.push(audioStream); r.push(null);
				audioBuffer = await streamToBuffer(r);
			} else {
				audioBuffer = await streamToBuffer(audioStream);
			}
			tracker.succeed(ttsPhase, { bytes: audioBuffer.length, voice: voice || null });
		} catch (e) {
			tracker.fail(ttsPhase, e);
			return res.status(e.status || 500).json({ ...tracker.summary(), status: 'error' });
		}

		// Store in cache
		const { id } = setCached(
			{ url, lang, voice },
			{
				audioBuffer,
				meta: { url, lang, voice, textChars: translated.length },
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
