function generateRunId() {
  try {
    const c = require('node:crypto');
    if (typeof c.randomUUID === 'function') return c.randomUUID();
    if (typeof c.randomBytes === 'function') return c.randomBytes(16).toString('hex');
  } catch (e) {
    // ignore and fallback
  }
  const ts = Date.now().toString(36);
  const rnd = Math.random().toString(36).slice(2, 10);
  return `${ts}-${rnd}`;
}

module.exports = { generateRunId };
