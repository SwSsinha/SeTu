const { Router } = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const { generateRunId } = require('../utils/id');
const { scrapeArticle } = require('../services/portia.service');
const { translateText } = require('../services/translate.service');
const { generateTts } = require('../services/ttsOrchestrator.service');
const { summarize } = require('../utils/summary');
const { setCached, getCached } = require('../utils/cache');
const { pushRun } = require('../utils/history');
const { recordRun } = require('../utils/metricsLite');
const { Readable } = require('stream');

const router = Router();

function validateBundle(req, res, next) {
  const { urls, lang, voice } = req.body || {};
  if (!Array.isArray(urls) || urls.length === 0) return res.status(400).json({ error: 'urls[] required' });
  if (urls.length > 5) return res.status(413).json({ error: 'Too many URLs (max 5)' });
  const clean = [];
  for (const u of urls) {
    if (typeof u !== 'string') return res.status(400).json({ error: 'Invalid url entry' });
    if (u.length > 1500) return res.status(413).json({ error: 'URL too long', url: u });
    try { const parsed = new URL(u); if (!/^https?:/.test(parsed.protocol)) return res.status(400).json({ error: 'URL must be http(s)' }); }
    catch { return res.status(400).json({ error: 'Malformed URL', url: u }); }
    clean.push(u);
  }
  const normalizedLang = (lang || 'hi').toLowerCase().trim();
  if (!/^[a-z-]{2,5}$/.test(normalizedLang)) return res.status(400).json({ error: 'Invalid "lang" code' });
  req.bundleInput = { urls: clean, lang: normalizedLang, voice: voice || null };
  next();
}

async function streamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (c) => chunks.push(c));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

router.post('/', validateBundle, asyncHandler(async (req, res) => {
  const { urls, lang, voice } = req.bundleInput;
  const runId = generateRunId();
  req.lastRunId = runId;

  // Cache key: concatenated urls with marker
  const syntheticUrl = `bundle::${urls.join('|')}`;
  const cacheProbe = getCached({ url: syntheticUrl, lang, voice });
  if (cacheProbe.hit) {
    const { entry } = cacheProbe;
    const meta = entry.meta || {}; const m = meta.metrics || {}; const bundle = meta.bundle || {};
    pushRun({ runId, resultId: entry.id, url: syntheticUrl, lang, voice, cacheHit: true, partial: meta.partial || false, retries: { portia: m.portiaRetries || 0, translation: m.translationRetries || 0, tts: m.ttsRetries || 0 }, summaryLen: (meta.summary || '').length, durationMs: 0 });
    recordRun({ cacheHit: true, partial: meta.partial || false, audioBytes: entry.audioBuffer.length, phases: [] });
    return res.json({
      runId,
      cacheHit: true,
      resultId: entry.id,
      ttsProvider: meta.ttsProvider || 'elevenlabs',
      bundle,
      summary: meta.summary || '',
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
  }

  const startTs = Date.now();
  const scraped = [];
  const failed = [];
  let totalPortiaRetries = 0;
  for (const u of urls) {
    const perMetrics = {};
    try {
      const text = await scrapeArticle({ url: u, metrics: perMetrics });
      scraped.push({ url: u, text });
      totalPortiaRetries += perMetrics.portiaRetries || 0;
    } catch (e) {
      failed.push({ url: u, error: e.message });
    }
  }
  if (scraped.length === 0) {
    return res.status(502).json({ error: 'All scrapes failed', runId, failed });
  }
  const partialScrape = failed.length > 0;

  const separator = '\n\n---\n\n';
  const combinedOriginal = scraped.map(s => s.text).join(separator);
  const combinedSummary = summarize(combinedOriginal) || '';

  const translationMetrics = {};
  let translationResult;
  try {
    translationResult = await translateText({ text: combinedOriginal, targetLang: lang, allowPartial: true, metrics: translationMetrics });
  } catch (e) {
    return res.status(e.status || 500).json({ error: 'translation_failed', detail: e.message, runId, partialScrape });
  }

  let ttsText = translationResult.text;
  if (!ttsText || ttsText.trim().length < 5) ttsText = combinedOriginal.slice(0, 800);
  // Guard extremely large TTS input (pragmatic limit)
  const MAX_TTS_CHARS = 12000;
  let truncated = false;
  if (ttsText.length > MAX_TTS_CHARS) { ttsText = ttsText.slice(0, MAX_TTS_CHARS); truncated = true; }

  const ttsMetrics = {};
  let audioStream; let ttsProvider = 'elevenlabs';
  try {
    const gen = await generateTts({ text: ttsText, voiceId: voice, metrics: ttsMetrics });
    audioStream = gen.stream; ttsProvider = gen.provider;
  } catch (e) {
    if (!translationResult.partial) {
      return res.status(502).json({ error: 'tts_failed', detail: e.message, runId, partialScrape, partialTranslation: translationResult.partial });
    }
    // try fallback path again on truncated subset
    const fallback = ttsText.slice(0, 800);
    const gen2 = await generateTts({ text: fallback, voiceId: voice, metrics: ttsMetrics });
    audioStream = gen2.stream; ttsProvider = gen2.provider;
    truncated = true;
  }

  const audioBuffer = await streamToBuffer(audioStream);
  const metrics = { portiaRetries: totalPortiaRetries, translationRetries: translationMetrics.translationRetries || 0, ttsRetries: ttsMetrics.ttsRetries || 0 };
  const { id } = setCached({ url: syntheticUrl, lang, voice }, { audioBuffer, meta: { url: syntheticUrl, lang, voice, textChars: ttsText.length, summary: combinedSummary, partial: translationResult.partial || partialScrape, ttsProvider, metrics, bundle: { count: urls.length, failed: failed.length, partialScrape, truncated, originalChars: combinedOriginal.length, translatedChars: translationResult.text.length } } });

  pushRun({ runId, resultId: id, url: syntheticUrl, lang, voice, cacheHit: false, partial: translationResult.partial || partialScrape, retries: { portia: metrics.portiaRetries, translation: metrics.translationRetries, tts: metrics.ttsRetries }, summaryLen: combinedSummary.length, durationMs: Date.now() - startTs });
  recordRun({ cacheHit: false, partial: translationResult.partial || partialScrape, audioBytes: audioBuffer.length, phases: [] });

  res.setHeader('X-Result-Id', id);
  res.setHeader('X-Run-Id', runId);
  if (translationResult.partial || partialScrape) res.setHeader('X-Partial', '1');
  res.setHeader('X-Retries-Portia', String(metrics.portiaRetries));
  res.setHeader('X-Retries-Translation', String(metrics.translationRetries));
  res.setHeader('X-Retries-TTS', String(metrics.ttsRetries));
  res.json({
    runId,
    cacheHit: false,
    resultId: id,
    ttsProvider,
    bundle: { count: urls.length, failed, partialScrape, truncated, originalChars: combinedOriginal.length, translatedChars: translationResult.text.length },
  summary: combinedSummary,
    retries: { portia: metrics.portiaRetries, translation: metrics.translationRetries, tts: metrics.ttsRetries },
    partial: translationResult.partial || partialScrape,
    audio: { mime: 'audio/mpeg', base64: audioBuffer.toString('base64'), dataUri: `data:audio/mpeg;base64,${audioBuffer.toString('base64')}`, url: `/api/result/${id}/audio` },
  });
}));

module.exports = router;