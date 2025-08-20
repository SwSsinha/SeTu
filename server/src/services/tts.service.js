const axios = require('axios');
const { getEnv } = require('../config/env');

const MAX_RETRIES = 2;
const SLEEP = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * synthesizeToMp3Stream
 * Input: { text: string, voiceId?: string }
 * Output: Readable stream (audio/mpeg)
 */
async function synthesizeToMp3Stream({ text, voiceId }) {
  if (!text || !text.trim()) {
    const err = new Error('Missing text for TTS');
    err.status = 400;
    throw err;
  }

  const { cfg, missing } = getEnv();
  if (missing.includes('ELEVENLABS_API_KEY')) {
    const err = new Error('Server missing ElevenLabs configuration');
    err.status = 500;
    throw err;
  }

  const finalVoiceId = voiceId || cfg.ELEVENLABS_VOICE_ID;

  let lastErr;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const resp = await axios.post(
        `https://api.elevenlabs.io/v1/text-to-speech/${finalVoiceId}`,
        {
          text,
          model_id: 'eleven_multilingual_v2',
        },
        {
          headers: {
            'xi-api-key': cfg.ELEVENLABS_API_KEY,
            'Content-Type': 'application/json',
            Accept: 'audio/mpeg',
          },
          responseType: 'stream',
          timeout: 120000,
        }
      );
      return resp.data; // readable stream
    } catch (e) {
      lastErr = e;
      if (attempt < MAX_RETRIES) await SLEEP(500 * (attempt + 1));
    }
  }

  const err = new Error('TTS failed');
  err.status = 502;
  err.detail = { lastErr: lastErr?.message };
  throw err;
}

module.exports = { synthesizeToMp3Stream };