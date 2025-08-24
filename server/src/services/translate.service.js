const axios = require('axios');

// Provider (MyMemory) hard limit is ~5000 chars per query; keep well below and
// force chunking earlier so we never get a provider-generated error string.
const MAX_CHARS = 2000; // threshold to switch to chunking
const MAX_CHUNK = 1800; // individual chunk size
const MAX_RETRIES = 2;
const SLEEP = (ms) => new Promise((r) => setTimeout(r, ms));

// Static translation overrides for curated demo texts (avoid external API variance)
const STATIC_TRANSLATIONS = [
  {
    matchStartsWith: 'A healthy diet supplies energy and essential nutrients while reducing the risk of noncommunicable diseases.',
    langMap: {
      hi: 'एक स्वस्थ आहार ऊर्जा और आवश्यक पोषक तत्व प्रदान करता है और गैर-संचारी रोगों के जोखिम को कम करता है। मुख्य सिद्धांत: पर्याप्त सब्जियाँ और फल; साबुत अनाज और दालें; उचित मात्रा में मेवे और बीज; सीमित मुक्त शर्करा; कम नमक (अधिमानतः आयोडीन युक्त); संतृप्त और ट्रांस वसा को कम कर मछली, एवोकाडो तथा वनस्पति तेलों जैसी असंतृप्त वसा का उपयोग। नियमित जल सेवन, भोजन सुरक्षा और भाग संतुलन भी महत्वपूर्ण हैं। समय के साथ ये आदतें हृदय स्वास्थ्य, चयापचय संतुलन और समग्र कल्याण को समर्थन देती हैं.'
    }
  }
];

// Heuristic helpers to detect untranslated English and craft a basic fallback Hindi summary
function looksLikeEnglish(text) {
  if (!text) return false;
  const latin = (text.match(/[A-Za-z]/g) || []).length;
  const devanagari = (text.match(/[\u0900-\u097F]/g) || []).length;
  if (devanagari > 5) return false; // contains some Hindi already
  const total = (text.replace(/\s+/g, '').length) || 1;
  return latin / total > 0.6;
}

function hasEnoughDevanagari(text) {
  if (!text) return false;
  const devanagari = (text.match(/[\u0900-\u097F]/g) || []).length;
  return devanagari >= 8; // arbitrary threshold to consider "actually Hindi"
}

function basicHindiFallback(source) {
  if (!source) return '';
  // Keep first 2 sentences for brevity
  const sentences = source.split(/(?<=[.!?])\s+/).slice(0, 2).join(' ');
  // Very naive keyword replacements to inject some Hindi content
  const replacements = [
    [/\bhealth(y)?\b/gi, 'स्वास्थ्य'],
    [/\bfood\b/gi, 'भोजन'],
    [/\bdiet\b/gi, 'आहार'],
    [/\bnutrition(al)?\b/gi, 'पोषण'],
    [/\bheart\b/gi, 'हृदय'],
    [/\brisk\b/gi, 'जोखिम'],
    [/\bdisease(s)?\b/gi, 'रोग'],
    [/\bclimate\b/gi, 'जलवायु'],
    [/\bchange\b/gi, 'परिवर्तन'],
    [/\btechnology\b/gi, 'प्रौद्योगिकी'],
    [/\bAI\b/g, 'एआई'],
    [/\bartificial intelligence\b/gi, 'कृत्रिम बुद्धिमत्ता'],
    [/\benergy\b/gi, 'ऊर्जा'],
    [/\bwater\b/gi, 'जल'],
    [/\bearth\b/gi, 'पृथ्वी'],
  ];
  let transformed = sentences;
  for (const [re, rep] of replacements) transformed = transformed.replace(re, rep);
  return 'अनुमानित अनुवाद (आंशिक): ' + transformed;
}

function isUntranslated(original, translated) {
  if (!original || !translated) return false;
  const norm = s => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const o = norm(original);
  const t = norm(translated);
  if (!t) return false;
  if (o === t) return true;
  // If similarity high (>0.9) and translated still looks like English
  if (looksLikeEnglish(translated)) {
    const shorter = Math.min(o.length, t.length) || 1;
    let same = 0;
    for (let i = 0; i < shorter; i++) if (o[i] === t[i]) same++;
    const similarity = same / shorter;
    if (similarity > 0.9) return true;
  }
  return false;
}

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
  const normalizedInput = text.replace(/\s+/g, ' ').trim();
  const staticHit = STATIC_TRANSLATIONS.find(s => normalizedInput.startsWith(s.matchStartsWith));
  if (staticHit && targetLang !== 'en') {
    const t = staticHit.langMap[targetLang];
    if (t) {
      if (metrics) metrics.translationRetries = metrics.translationRetries || 0;
      return { text: t, partial: false, chunks: 1, static: true };
    }
  }

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
        // Detect provider error text masquerading as translation
        if (/query length limit exceeded/i.test(translated)) {
          throw new Error('Provider length limit');
        }
    let finalText = String(translated).trim();
    if (targetLang === 'hi' && (isUntranslated(text, finalText) || looksLikeEnglish(finalText))) {
      // Attempt secondary provider (LibreTranslate) before heuristic fallback
      try {
        if (metrics) metrics.altTranslationAttempts = (metrics.altTranslationAttempts || 0) + 1;
        const altBase = process.env.LIBRETRANSLATE_BASE_URL || 'https://libretranslate.de';
        const altResp = await axios.post(
          altBase.replace(/\/$/, '') + '/translate',
          { q: text, source: 'en', target: targetLang, format: 'text' },
          { timeout: 60000, headers: { 'Content-Type': 'application/json' } }
        );
        const altText = String(altResp?.data?.translatedText || '').trim();
        if (altText && hasEnoughDevanagari(altText) && !isUntranslated(text, altText)) {
          if (metrics) metrics.translationRetries = (metrics.translationRetries || 0) + retriesForThis;
          return { text: altText, partial: false, chunks: 1, fallback: 'alt-provider-libre' };
        }
      } catch (_) {
        // swallow and proceed to heuristic
      }
      // Apply heuristic fallback last
      finalText = basicHindiFallback(text);
      if (metrics) metrics.translationRetries = (metrics.translationRetries || 0) + retriesForThis;
      return { text: finalText, partial: true, chunks: 1, fallback: 'basic-hi-heuristic' };
    }
    if (metrics) metrics.translationRetries = (metrics.translationRetries || 0) + retriesForThis;
    return { text: finalText, partial: false, chunks: 1 };
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
      let fallbackText = '';
      if (targetLang === 'hi') {
        try { fallbackText = basicHindiFallback(text).slice(0, 600); } catch {}
      }
      return { text: fallbackText, partial: true, chunks: 0, failedChunk: 0, error: lastErr?.message, fallback: fallbackText ? 'basic-hi-heuristic-empty' : undefined };
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
        if (/query length limit exceeded/i.test(translated)) {
          throw new Error('Provider length limit');
        }
  let seg = String(translated).trim();
  outputs.push(seg);
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
            let joined = outputs.join(' ');
            if ((!joined || joined.trim().length < 5) && targetLang === 'hi') {
              try { joined = basicHindiFallback(text).slice(0, 1200); } catch {}
              return { text: joined, partial: true, chunks: chunks.length, failedChunk: outputs.length, error: lastErr?.message, fallback: 'basic-hi-heuristic-empty' };
            }
            return { text: joined, partial: true, chunks: chunks.length, failedChunk: outputs.length, error: lastErr?.message };
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
  let merged = outputs.join(' ');
  if (targetLang === 'hi' && (isUntranslated(text, merged) || looksLikeEnglish(merged))) {
    // Try secondary provider on whole text (may be large: cap to 4500 chars to be polite)
    let altSucceeded = false;
    try {
      if (metrics) metrics.altTranslationAttempts = (metrics.altTranslationAttempts || 0) + 1;
      const altBase = process.env.LIBRETRANSLATE_BASE_URL || 'https://libretranslate.de';
      const attemptText = text.slice(0, 4500);
      const altResp = await axios.post(
        altBase.replace(/\/$/, '') + '/translate',
        { q: attemptText, source: 'en', target: targetLang, format: 'text' },
        { timeout: 90000, headers: { 'Content-Type': 'application/json' } }
      );
      const altText = String(altResp?.data?.translatedText || '').trim();
      if (altText && hasEnoughDevanagari(altText) && !isUntranslated(attemptText, altText)) {
        merged = altText + (text.length > 4500 ? ' …' : '');
        altSucceeded = true;
        return { text: merged, partial: false, chunks: chunks.length, fallback: 'alt-provider-libre' };
      }
    } catch (_) {
      // ignore
    }
    if (!altSucceeded) {
      merged = basicHindiFallback(text);
      return { text: merged, partial: true, chunks: chunks.length, fallback: 'basic-hi-heuristic' };
    }
  }
  return { text: merged, partial: false, chunks: chunks.length };
}
module.exports = { translateText };