const { Router } = require('express');

const router = Router();

// Placeholder route; will implement pipeline later
router.post('/', (req, res) => {
	res.status(501).json({ message: 'Processing pipeline not implemented yet' });
});

module.exports = router;
