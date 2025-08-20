const axios = require('axios');

const MAX_CHARS = 4000;

/**
 * translateText
 * Input: { text: string, targetLang?: string }  // default 'hi'
 * Output: string (translated text)
 */
async function translateText({ text, targetLang = 'hi' }) {
  if (!text || !text.trim()) {
    const err = new Error('Missing text to translate');
    err.status = 400;
    throw err;
  }

  const q = text.length > MAX_CHARS ? text.slice(0, MAX_CHARS) : text;

  const resp = await axios.get('https://api.mymemory.translated.net/get', {
    params: { q, langpair: `en|${targetLang}` },
    timeout: 60000,
  });

  const translated = resp?.data?.responseData?.translatedText;
  if (!translated) {
    const err = new Error('Translation failed');
    err.status = 502;
    throw err;
  }

  return String(translated).trim();
}

module.exports = { translateText };