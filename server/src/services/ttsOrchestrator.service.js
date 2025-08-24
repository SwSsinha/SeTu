const { synthesizeToMp3Stream } = require('./tts.service');
const { fallbackTts } = require('./ttsFallback.service');
const { getEnv } = require('../config/env');

function isEligibleError(e) {
  if (!e) return false;
  const msg = (e.message || '').toLowerCase();
  // Network, quota, server errors trigger fallback
  return /timeout|network|401|403|502|503|504|quota|rate|unauthorized|forbidden|missing.*elevenlabs|elevenlabs.*configuration|tts failed/i.test(msg);
}

async function generateTts({ text, voiceId, metrics }) {
  // If ElevenLabs not configured, directly return fallback to avoid 5xx bubbling
  try {
    const { cfg, missing } = getEnv();
    if (missing.includes('ELEVENLABS_API_KEY')) {
      if (metrics) metrics.ttsProvider = 'fallback';
      return { stream: fallbackTts({ text }), provider: 'fallback', fallback: true, error: 'missing-elevenlabs-key' };
    }
  } catch { /* ignore and continue normal flow */ }
  try {
    const primary = await synthesizeToMp3Stream({ text, voiceId, metrics });
    return { stream: primary, provider: 'elevenlabs', fallback: false };
  } catch (e) {
    if (!isEligibleError(e)) throw e;
    const fb = fallbackTts({ text });
    if (metrics) metrics.ttsProvider = 'fallback';
    return { stream: fb, provider: 'fallback', fallback: true, error: e.message };
  }
}

module.exports = { generateTts };