function summarize(text, { sentences = 3, maxChars = 500 } = {}) {
  if (!text) return '';
  const clean = text.replace(/\s+/g, ' ').trim();
  if (!clean) return '';
  const parts = clean.split(/(?<=[.!?])\s+/);
  const out = [];
  for (const p of parts) {
    if (!p) continue;
    out.push(p.trim());
    if (out.length >= sentences) break;
    if (out.join(' ').length >= maxChars) break;
  }
  let summary = out.join(' ');
  if (!summary) summary = clean.slice(0, maxChars);
  if (summary.length > maxChars) summary = summary.slice(0, maxChars - 3).trimEnd() + '...';
  return summary;
}

module.exports = { summarize };