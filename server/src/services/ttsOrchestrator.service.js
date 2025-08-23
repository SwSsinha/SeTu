const { synthesizeToMp3Stream } = require('./tts.service');
const { fallbackTts } = require('./ttsFallback.service');

function isEligibleError(e) {
  if (!e) return false;
  const msg = (e.message || '').toLowerCase();
  // Network, quota, server errors trigger fallback
  return /timeout|network|502|503|504|quota|rate/i.test(msg);
}

async function generateTts({ text, voiceId, metrics }) {
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