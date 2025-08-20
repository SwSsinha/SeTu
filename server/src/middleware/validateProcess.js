module.exports = (req, res, next) => {
  const { url, lang } = req.body || {};
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Invalid or missing "url"' });
  }
  try {
    const u = new URL(url);
    if (!u.protocol.startsWith('http')) {
      return res.status(400).json({ error: 'URL must be http(s)' });
    }
  } catch {
    return res.status(400).json({ error: 'Malformed URL' });
  }

  const normalizedLang = (lang || 'hi').toLowerCase().trim();
  if (!/^[a-z-]{2,5}$/.test(normalizedLang)) {
    return res.status(400).json({ error: 'Invalid "lang" code' });
  }

  req.processInput = { url, lang: normalizedLang };
  next();
};
