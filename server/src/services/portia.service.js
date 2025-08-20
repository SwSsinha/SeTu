const axios = require('axios');
const { getEnv } = require('../config/env');
const { generateRunId } = require('../utils/id');

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
async function scrapeArticle({ url }) {
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
  const base = `https://api.portialabs.ai/v0/tools/${cfg.PORTIA_TOOL_ID}/run`;
  const endpoints = [base, `${base}/`];
  const body = {
    arguments: { url },
    execution_context: { plan_run_id: newPlanRunId },
  };

  let lastErr;
  for (const endpoint of endpoints) {
    try {
      const resp = await axios.post(endpoint, body, {
        headers: {
          Authorization: `Api-Key ${cfg.PORTIA_API_KEY}`,
          'X-Api-Key': cfg.PORTIA_API_KEY, // optional alt header some setups use
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        timeout: 60000,
      });
      // If we got here, request succeeded
      const text = extractLongestString(resp.data);
      if (!text || text.trim().length < 50) {
        const err = new Error('Could not extract article text from the URL');
        err.status = 422;
        throw err;
      }
      return text.trim();
    } catch (err) {
      lastErr = err;
      // Retry with next endpoint only for 404/405 variations
      const code = err?.response?.status;
      if (!(code === 404 || code === 405)) break;
    }
  }

  // If we reach here, all attempts failed
  const status = lastErr?.response?.status || 500;
  const detail = lastErr?.response?.data || lastErr?.message || 'Unknown error';
  const err = new Error(
    `Portia request failed (status ${status}). Check PORTIA_TOOL_ID and endpoint availability.`
  );
  err.status = status;
  err.detail = detail;
  throw err;
  
}

module.exports = { scrapeArticle };