// eslint-disable-next-line no-unused-vars
module.exports = (err, req, res, next) => {
	const status = err.status || err.statusCode || 500;
	const payload = {
		error: err.name || 'Error',
		message: err.message || 'Internal Server Error',
		runId: req.lastRunId || undefined,
	};
	if (process.env.NODE_ENV !== 'production') {
		payload.stack = err.stack;
		if (err.detail) payload.detail = err.detail;
		if (err.attempted) payload.attempted = err.attempted;
	}
	// Basic logging
	console.error('Error handler:', payload);
	res.status(status).json(payload);
};
