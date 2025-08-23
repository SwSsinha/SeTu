const { Router } = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const { scrapeArticle } = require('../services/portia.service');
const { translateText } = require('../services/translate.service');
const { synthesizeToMp3Stream } = require('../services/tts.service');
const { generateRunId } = require('../utils/id');
const { summarize } = require('../utils/summary');
const { getCached, setCached } = require('../utils/cache');
const { pushRun } = require('../utils/history');
const { Readable } = require('stream');
const { recordRun } = require('../utils/metricsLite');

// Simple middleware for validating batch input
function validateMulti(req, res, next) {
  const { url, langs, voice } = req.body || {};
  if (!url || typeof url !== 'string') return res.status(400).json({ error: 'Invalid or missing "url"' });
  try { const u = new URL(url); if (!u.protocol.startsWith('http')) return res.status(400).json({ error: 'URL must be http(s)' }); } catch { return res.status(400).json({ error: 'Malformed URL' }); }
  if (!Array.isArray(langs) || langs.length === 0) return res.status(400).json({ error: 'langs[] required' });
  const norm = [];
  for (const l of langs) {
    if (typeof l !== 'string') return res.status(400).json({ error: 'Invalid lang entry' });
    const lc = l.toLowerCase().trim();
    if (!/^[a-z-]{2,5}$/.test(lc)) return res.status(400).json({ error: `Invalid lang code: ${l}` });
    norm.push(lc);
  }
  req.multiInput = { url, langs: Array.from(new Set(norm)), voice: voice || null };
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

const router = Router();

// POST /api/process-multi { url, langs:["hi","es"], voice? }
// Returns: { url, items:[ { lang, cacheHit, resultId, partial, retries, summary, audio: { url, base64 } } ] }
router.post('/', validateMulti, asyncHandler(async (req, res) => {
  const { url, langs, voice } = req.multiInput;
  const runId = generateRunId();
  req.lastRunId = runId;

  // Shared scrape once
  let articleText; let summaryText = '';
  const scrapeMetrics = {};
  try {
    articleText = await scrapeArticle({ url, metrics: scrapeMetrics });
    summaryText = summarize(articleText);
  } catch (e) {
    return res.status(e.status || 500).json({ error: 'scrape_failed', detail: e.message, runId });
  }

  // Sequential with tiny concurrency (cap=2) to avoid API hammering
  const concurrency = 2;
  const queue = [...langs];
  const results = [];

  async function processLang(lang) {
    const metrics = {}; // per-lang metrics (translation + tts + reused scrape retries aggregated later)
    // Cache check
    const { hit, entry } = getCached({ url, lang, voice });
    if (hit) {
      const m = entry.meta?.metrics || {};
  pushRun({ runId, resultId: entry.id, url, lang, voice, cacheHit: true, partial: entry.meta.partial || false, retries: { portia: m.portiaRetries || 0, translation: m.translationRetries || 0, tts: m.ttsRetries || 0 }, summaryLen: (entry.meta.summary || '').length, durationMs: 0 });
  recordRun({ cacheHit: true, partial: entry.meta.partial || false, audioBytes: entry.audioBuffer.length, phases: [] });
      return {
        lang,
        cacheHit: true,
        resultId: entry.id,
        partial: entry.meta.partial || false,
        retries: { portia: m.portiaRetries || 0, translation: m.translationRetries || 0, tts: m.ttsRetries || 0 },
        summary: entry.meta.summary || '',
        audio: { url: `/api/result/${entry.id}/audio`, base64: entry.audioBuffer.toString('base64') }
      };
    }
    // Translate
    const translationResult = await translateText({ text: articleText, targetLang: lang, allowPartial: true, metrics });
    let ttsText = translationResult.text;
    if (!ttsText || ttsText.trim().length < 5) ttsText = articleText.slice(0, 400);
    let audioStream;
    try {
      audioStream = await synthesizeToMp3Stream({ text: ttsText, voiceId: voice, metrics });
    } catch (e) {
      if (!translationResult.partial) throw e;
      const fallback = ttsText.slice(0, 800);
      audioStream = await synthesizeToMp3Stream({ text: fallback, voiceId: voice, metrics });
    }
    const audioBuffer = await streamToBuffer(audioStream);
    const { id } = setCached({ url, lang, voice }, { audioBuffer, meta: { url, lang, voice, textChars: ttsText.length, summary: summaryText, partial: translationResult.partial, metrics: { ...metrics, portiaRetries: scrapeMetrics.portiaRetries || 0 } } });
  pushRun({ runId, resultId: id, url, lang, voice, cacheHit: false, partial: translationResult.partial || false, retries: { portia: scrapeMetrics.portiaRetries || 0, translation: metrics.translationRetries || 0, tts: metrics.ttsRetries || 0 }, summaryLen: summaryText.length, durationMs: 0 });
  recordRun({ cacheHit: false, partial: translationResult.partial || false, audioBytes: audioBuffer.length, phases: [] });
    return {
      lang,
      cacheHit: false,
      resultId: id,
      partial: translationResult.partial || false,
      retries: { portia: scrapeMetrics.portiaRetries || 0, translation: metrics.translationRetries || 0, tts: metrics.ttsRetries || 0 },
      summary: summaryText,
      audio: { url: `/api/result/${id}/audio`, base64: audioBuffer.toString('base64') }
    };
  }

  const workers = Array.from({ length: Math.min(concurrency, queue.length) }, async () => {
    while (queue.length) {
      const lang = queue.shift();
      try {
        const r = await processLang(lang);
        results.push(r);
      } catch (e) {
        results.push({ lang, error: e.message, partial: false });
      }
    }
  });
  await Promise.all(workers);

  // Sort results by requested order
  const ordered = langs.map(l => results.find(r => r.lang === l) || { lang: l, error: 'missing' });
  res.json({ url, runId, items: ordered });
}));

module.exports = router;