// In-memory ring buffer for recent runs (last 20)
// Each entry: { ts, runId, resultId, url, lang, voice, cacheHit, partial, retries, summaryLen, durationMs }

const MAX_HISTORY = 20;
const history = [];

function pushRun(entry) {
  try {
    const record = { ...entry, ts: entry.ts || Date.now() };
    history.push(record);
    if (history.length > MAX_HISTORY) history.splice(0, history.length - MAX_HISTORY);
  } catch (e) {
    // swallow – history is best-effort
  }
}

function getHistory(limit) {
  const reversed = [...history].reverse();
  if (!limit || limit >= reversed.length) return reversed;
  return reversed.slice(0, limit);
}

module.exports = { pushRun, getHistory };
