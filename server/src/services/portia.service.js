const axios = require('axios');
const { getEnv } = require('../config/env');
const { generateRunId } = require('../utils/id');

// Simple delay helper for retry backoff
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Decide whether an error is transient and worth retrying
function isTransient(err) {
  const status = err?.response?.status;
  const code = err?.code;
  if ([408, 429, 500, 502, 503, 504].includes(status)) return true;
  if (['ECONNABORTED', 'ETIMEDOUT', 'ECONNRESET', 'EAI_AGAIN', 'ENOTFOUND', 'EPIPE'].includes(code)) return true;
  return false;
}

/**
 * Extract the longest string found anywhere in a JSON payload.
 * Fallback when the exact content path is unknown.
 */
function extractLongestString(root) {
  let longest = '';
  const visit = (v) => {
    if (v == null) return;
    if (typeof v === 'string') {
      const s = v.trim();
      if (s.length > longest.length) longest = s;
    } else if (Array.isArray(v)) {
      v.forEach(visit);
    } else if (typeof v === 'object') {
      Object.values(v).forEach(visit);
    }
  };
  visit(root);
  return longest;
}

/**
 * scrapeArticle
 * Input: { url: string }
 * Output: string (article text)
 */
async function scrapeArticle({ url, metrics }) {
  if (!url) {
    const err = new Error('Missing url');
    err.status = 400;
    throw err;
  }

  const { cfg, missing } = getEnv();
  if (missing.includes('PORTIA_API_KEY') || missing.includes('PORTIA_TOOL_ID')) {
    const err = new Error('Server missing Portia configuration');
    err.status = 500;
    throw err;
  }
  const newPlanRunId = generateRunId();
  const baseUrl = cfg.PORTIA_BASE_URL?.replace(/\/$/, '') || 'https://api.portialabs.ai';
  const toolIdRaw = cfg.PORTIA_TOOL_ID;
  const toolIdEncoded = encodeURIComponent(toolIdRaw);
  const versions = ['v0', 'v1'];
  const withApi = (v, f) => `${baseUrl}/api/${v}${f}`;
  const noApi = (v, f) => `${baseUrl}/${v}${f}`;
  const patterns = [
    (v) => withApi(v, `/tools/${toolIdEncoded}/run`),
    (v) => withApi(v, `/tools/run/${toolIdEncoded}`),
    // fallbacks without /api segment
    (v) => noApi(v, `/tools/${toolIdEncoded}/run`),
    (v) => noApi(v, `/tools/run/${toolIdEncoded}`),
  ];
  const bases = versions.flatMap((v) => patterns.map((p) => p(v)));
  const endpoints = bases.flatMap((b) => [b, `${b}/`]);
  const body = {
    arguments: { url },
    execution_context: { plan_run_id: newPlanRunId },
  };

  let lastErr;
  const attempted = [];
  let portiaRetries = 0;
  for (const endpoint of endpoints) {
    attempted.push(endpoint);
    const headers = {
      Authorization: `Api-Key ${cfg.PORTIA_API_KEY}`,
      'X-Api-Key': cfg.PORTIA_API_KEY, // optional alt header some setups use
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
    if (cfg.PORTIA_ORG_ID) {
      headers['X_PORTIA_ORG_ID'] = cfg.PORTIA_ORG_ID;
      headers['X-Portia-Org-Id'] = cfg.PORTIA_ORG_ID; // compatibility variant
    }

  const maxRetries = 3;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const resp = await axios.post(endpoint, body, { headers, timeout: 60000 });
        // If we got here, request succeeded
        const text = extractLongestString(resp.data);
        if (!text || text.trim().length < 50) {
          const err = new Error('Could not extract article text from the URL');
          err.status = 422;
          throw err;
        }
    if (metrics) metrics.portiaRetries = portiaRetries; // count of failed attempts before success
        return text.trim();
      } catch (err) {
        lastErr = err;
        const code = err?.response?.status;
        const msg = err?.response?.data?.error || err?.message;
        if (msg && /X_PORTIA_ORG_ID/i.test(msg) && !cfg.PORTIA_ORG_ID) {
          const hint = new Error('Portia requires X_PORTIA_ORG_ID header. Set PORTIA_ORG_ID in your server .env');
          hint.status = 400;
          hint.detail = { serverMessage: msg };
          hint.attempted = attempted;
          throw hint;
        }
        // For 404/405, move to next endpoint variant immediately
        if (code === 404 || code === 405) {
          break;
        }
        // For transient/network errors, retry this endpoint with backoff
        if (isTransient(err) && attempt < maxRetries) {
          const backoff = 400 * attempt + Math.floor(Math.random() * 200);
          await delay(backoff);
          portiaRetries += 1;
          continue;
        }
        // Non-retryable or retries exhausted: try next endpoint
        break;
      }
    }
  }

  // If we reach here, all attempts failed
  const status = lastErr?.response?.status || 500;
  const detail = lastErr?.response?.data || lastErr?.message || 'Unknown error';
  const err = new Error(
    `Portia request failed (status ${status}). Check PORTIA_TOOL_ID, API key, and base URL (${baseUrl}).`
  );
  err.status = status;
  err.detail = {
    server: detail,
    toolIdRaw,
    toolIdEncoded,
    headersSent: {
      authorization: Boolean(cfg.PORTIA_API_KEY),
      xApiKey: Boolean(cfg.PORTIA_API_KEY),
      xPortiaOrgId: Boolean(cfg.PORTIA_ORG_ID),
    },
  };
  err.attempted = attempted;
  if (metrics) metrics.portiaRetries = portiaRetries;
  throw err;

}

module.exports = { scrapeArticle };