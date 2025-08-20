const { Router } = require('express');
const processRouter = require('./process.route');

const router = Router();

// Health
router.get('/', (req, res) => {
	res.send('Setu backend is running!');
});

// Feature routes
router.use('/api/process', processRouter);

module.exports = router;
