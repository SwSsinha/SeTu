const { Readable } = require('stream');

// Tiny 0.5s silent MP3 (public domain) base64
// Generated silence – safe to embed.
const SILENT_MP3_BASE64 = 'SUQzAwAAAAAAFlRFTkMAAAAwAAAAAAAASW5mbwAAAA8AAAACAAACcQCA//////////8AAAA=';

function fallbackTts({ text }) {
  // We ignore text; could later map length->duration.
  const buf = Buffer.from(SILENT_MP3_BASE64, 'base64');
  const r = new Readable();
  r.push(buf);
  r.push(null);
  return r;
}

module.exports = { fallbackTts };
