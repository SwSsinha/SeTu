const { Router } = require('express');
const { getById } = require('../utils/cache');
const { Readable } = require('stream');

const router = Router();

// Return metadata + (optionally) base64 audio if query ?embed=1
router.get('/:id', (req, res) => {
  const { id } = req.params;
  const found = getById(id);
  if (!found) return res.status(404).json({ error: 'Not found' });
  const { entry } = found;
  const { meta, audioBuffer, createdAt, lastAccess, ttl } = entry;
  const ageMs = Date.now() - createdAt;
  const ttlRemaining = ttl ? Math.max(0, ttl - ageMs) : null;
  const base = {
    id,
    meta,
    sizeBytes: audioBuffer.length,
    createdAt,
    lastAccess,
    ageMs,
    ttlRemaining,
    audioUrl: `/api/result/${id}/audio`,
  };
  if (req.query.embed === '1') {
    return res.json({ ...base, audio: { mime: 'audio/mpeg', base64: audioBuffer.toString('base64') } });
  }
  res.json(base);
});

// Stream raw audio
router.get('/:id/audio', (req, res) => {
  const { id } = req.params;
  const found = getById(id);
  if (!found) return res.status(404).json({ error: 'Not found' });
  const { entry } = found;
  res.setHeader('Content-Type', 'audio/mpeg');
  res.setHeader('Content-Disposition', `inline; filename="${id}.mp3"`);
  // Since result id is derived from (url,lang,voice) hash and immutable for its content window,
  // we can instruct aggressive caching for PWA/service worker layer.
  res.setHeader('Cache-Control', 'public, max-age=3600, immutable');
  Readable.from(entry.audioBuffer).pipe(res);
});

module.exports = router;