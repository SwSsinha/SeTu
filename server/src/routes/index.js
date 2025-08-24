const { Router } = require('express');
const processRouter = require('./process.route');
const resultsRouter = require('./results.route');
const historyRouter = require('./history.route');
const processMultiRouter = require('./processMulti.route');
const metricsLiteRouter = require('./metricsLite.route');
const processBundleRouter = require('./processBundle.route');
const voicesRouter = require('./voices.route');

const router = Router();

// Health
router.get('/', (req, res) => {
	res.send('Setu backend is running!');
});

// Feature routes
router.use('/api/process', processRouter);
router.use('/api/result', resultsRouter);
router.use('/api/history', historyRouter);
router.use('/api/process-multi', processMultiRouter);
router.use('/api/metrics-lite', metricsLiteRouter);
router.use('/api/process-bundle', processBundleRouter);
router.use('/api/voices', voicesRouter);

module.exports = router;
