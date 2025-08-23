const { Router } = require('express');
const { snapshot } = require('../utils/metricsLite');

const router = Router();

router.get('/', (req, res) => {
  // Simple gating optional: allow always for now (could add header check)
  res.json({ ts: Date.now(), ...snapshot() });
});

module.exports = router;
