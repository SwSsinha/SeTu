const { Router } = require('express');
const { getHistory } = require('../utils/history');

const router = Router();

// Simple gating: only allow if NODE_ENV !== 'production' OR header X-Debug-History: 1
router.get('/', (req, res) => {
  const env = process.env.NODE_ENV;
  const allowed = env !== 'production' || req.header('X-Debug-History') === '1';
  if (!allowed) return res.status(403).json({ error: 'History disabled' });
  const limit = parseInt(req.query.limit, 10) || 20;
  const data = getHistory(limit);
  res.json({ count: data.length, entries: data });
});

module.exports = router;
