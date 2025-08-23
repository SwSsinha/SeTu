const axios = require('axios');

const MAX_CHARS = 4000;
const MAX_CHUNK = 3500; // leave room for URL encoding and safety
const MAX_RETRIES = 2;
const SLEEP = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * translateText
 * Input: { text: string, targetLang?: string, allowPartial?: boolean }
 * Output: { text: string, partial: boolean, chunks: number, failedChunk?: number }
 */
async function translateText({ text, targetLang = 'hi', allowPartial = false, metrics }) {
  if (!text || !text.trim()) {
    const err = new Error('Missing text to translate');
    err.status = 400;
    throw err;
  }

  // Short texts: single call with small retry
  if (text.length <= MAX_CHARS) {
    let lastErr;
    let retriesForThis = 0;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const resp = await axios.get('https://api.mymemory.translated.net/get', {
          params: { q: text, langpair: `en|${targetLang}` },
          timeout: 60000,
        });
        const translated = resp?.data?.responseData?.translatedText;
        if (!translated) throw new Error('Empty translation');
        if (metrics) metrics.translationRetries = (metrics.translationRetries || 0) + retriesForThis;
        return { text: String(translated).trim(), partial: false, chunks: 1 };
      } catch (e) {
        lastErr = e;
        if (attempt < MAX_RETRIES) {
          await SLEEP(300 * (attempt + 1));
          retriesForThis += 1;
        }
      }
    }
    if (allowPartial) {
      if (metrics) metrics.translationRetries = (metrics.translationRetries || 0) + retriesForThis;
      return { text: '', partial: true, chunks: 0, failedChunk: 0, error: lastErr?.message };
    }
    const err = new Error('Translation failed');
    err.status = 502;
    err.detail = { lastErr: lastErr?.message };
    throw err;
  }

  // Long texts: chunk by sentence-ish boundaries
  const chunks = [];
  let remaining = text;
  while (remaining.length > 0) {
    if (remaining.length <= MAX_CHUNK) {
      chunks.push(remaining);
      break;
    }
    // try to split at nearest period or newline before MAX_CHUNK
    const cut = remaining.lastIndexOf('.', MAX_CHUNK) > 0
      ? remaining.lastIndexOf('.', MAX_CHUNK) + 1
      : remaining.lastIndexOf('\n', MAX_CHUNK) > 0
        ? remaining.lastIndexOf('\n', MAX_CHUNK) + 1
        : MAX_CHUNK;
    chunks.push(remaining.slice(0, cut));
    remaining = remaining.slice(cut);
  }

  const outputs = [];
  let totalRetries = 0;
  for (const part of chunks) {
    let lastErr;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const resp = await axios.get('https://api.mymemory.translated.net/get', {
          params: { q: part, langpair: `en|${targetLang}` },
          timeout: 60000,
        });
        const translated = resp?.data?.responseData?.translatedText;
        if (!translated) throw new Error('Empty translation');
        outputs.push(String(translated).trim());
        break;
      } catch (e) {
        lastErr = e;
        if (attempt < MAX_RETRIES) {
          await SLEEP(300 * (attempt + 1));
          totalRetries += 1;
        }
        else {
          if (allowPartial) {
            if (metrics) metrics.translationRetries = (metrics.translationRetries || 0) + totalRetries;
            return { text: outputs.join(' '), partial: true, chunks: chunks.length, failedChunk: outputs.length, error: lastErr?.message };
          } else {
            const err = new Error('Translation failed on a chunk');
            err.status = 502;
            err.detail = { lastErr: lastErr?.message };
            throw err;
          }
        }
      }
    }
  }
  if (metrics) metrics.translationRetries = (metrics.translationRetries || 0) + totalRetries;
  return { text: outputs.join(' '), partial: false, chunks: chunks.length };
}
module.exports = { translateText };