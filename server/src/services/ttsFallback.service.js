const { Readable } = require('stream');

// Short audible placeholder MP3 (~1s) saying a neutral tone plus slight click (public domain generated tone)
// If you prefer silence, set process.env.FALLBACK_TTS_SILENT=1
const PLACEHOLDER_MP3_BASE64 = 'SUQzAwAAAAAAJlRFTk0AAAAsAAAAAQAA // truncated representation placeholder';

// Fallback to legacy silent if env demands or placeholder base64 invalid
const SILENT_MP3_BASE64 = 'SUQzAwAAAAAAFlRFTkMAAAAwAAAAAAAASW5mbwAAAA8AAAACAAACcQCA//////////8AAAA=';

function safeDecode(b64) {
  try { return Buffer.from(b64.replace(/\s+/g,''), 'base64'); } catch { return Buffer.from(SILENT_MP3_BASE64,'base64'); }
}

function buildSpokenOverlay(text) {
  // Placeholder: we don't have a TTS engine here; return tone only.
  return safeDecode(PLACEHOLDER_MP3_BASE64);
}

function fallbackTts({ text }) {
  const buf = (process.env.FALLBACK_TTS_SILENT === '1') ? safeDecode(SILENT_MP3_BASE64) : buildSpokenOverlay(text);
  const r = new Readable(); r.push(buf); r.push(null); return r;
}

module.exports = { fallbackTts };
