const MAX_URL_LENGTH = 1500; // conservative practical limit
const MAX_TEXT_LENGTH = 20000; // safeguard to avoid runaway translation size

module.exports = (req, res, next) => {
  const { url, lang, text, voice } = req.body || {};
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Invalid or missing "url"' });
  }
  if (url.length > MAX_URL_LENGTH) {
    return res.status(413).json({ error: 'URL too long', max: MAX_URL_LENGTH });
  }
  try {
    const u = new URL(url);
    if (!u.protocol.startsWith('http')) {
      return res.status(400).json({ error: 'URL must be http(s)' });
    }
  } catch {
    return res.status(400).json({ error: 'Malformed URL' });
  }

  let cleanedText;
  if (text !== undefined) {
    if (typeof text !== 'string') return res.status(422).json({ error: 'text must be a string' });
    cleanedText = text.trim();
    if (!cleanedText) return res.status(422).json({ error: 'text empty' });
    if (cleanedText.length > MAX_TEXT_LENGTH) {
      return res.status(413).json({ error: 'text too long', max: MAX_TEXT_LENGTH });
    }
  }

  const normalizedLang = (lang || 'hi').toLowerCase().trim();
  if (!/^[a-z-]{2,5}$/.test(normalizedLang)) {
    return res.status(400).json({ error: 'Invalid "lang" code' });
  }

  req.processInput = { url, lang: normalizedLang, text: cleanedText, voice };
  next();
};
