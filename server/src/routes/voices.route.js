const { Router } = require('express');
const { getEnv } = require('../config/env');

const router = Router();

// List available voices (from env allow list or fallback to single default)
router.get('/', (req, res) => {
  const { cfg } = getEnv();
  const list = (cfg.ELEVENLABS_VOICES && cfg.ELEVENLABS_VOICES.length > 0)
    ? cfg.ELEVENLABS_VOICES
    : [cfg.ELEVENLABS_VOICE_ID];
  res.json({ voices: list });
});

module.exports = router;