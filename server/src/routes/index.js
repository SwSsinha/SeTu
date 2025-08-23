const { Router } = require('express');
const processRouter = require('./process.route');
const resultsRouter = require('./results.route');

const router = Router();

// Health
router.get('/', (req, res) => {
	res.send('Setu backend is running!');
});

// Feature routes
router.use('/api/process', processRouter);
router.use('/api/result', resultsRouter);

module.exports = router;
