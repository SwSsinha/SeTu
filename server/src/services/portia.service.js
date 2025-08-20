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
  const endpoint = `https://api.portialabs.ai/v0/tools/${cfg.PORTIA_TOOL_ID}/run/`;
  const body = {
    arguments: { url },
    execution_context: { plan_run_id: newPlanRunId },
  };

  const resp = await axios.post(endpoint, body, {
    headers: {
      Authorization: `Api-Key ${cfg.PORTIA_API_KEY}`,
      'Content-Type': 'application/json',
    },
    timeout: 60000,
  });

  // If you know the exact path from Postman, prefer that (e.g., resp.data.output.markdown)
  const text = extractLongestString(resp.data);
  if (!text || text.trim().length < 50) {
    const err = new Error('Could not extract article text from the URL');
    err.status = 422;
    throw err;
  }

  return text.trim();
}

module.exports = { scrapeArticle };