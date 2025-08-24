const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');
const rateLimiter = require('./middleware/rateLimiter');
const requestId = require('./middleware/requestId');

const app = express();

// Global middleware
app.use(cors());
app.use(requestId());
app.use(helmet());
app.use(compression());
// Add morgan token for request id
morgan.token('reqid', (req) => req.id || '-');
app.use(morgan(':method :url :status :res[content-length] - :response-time ms id=:reqid'));
app.use(express.json({ limit: '256kb' }));
app.use(rateLimiter());

// Health check (Render or other platforms can ping this)
app.get('/healthz', (req, res) => {
	res.json({ ok: true, ts: Date.now() });
});

// API routes
app.use('/', routes);

// In production serve built client (single-service deployment pattern)
if (process.env.NODE_ENV === 'production') {
	const distPath = path.join(__dirname, '../../client/dist');
	app.use(express.static(distPath));
	// SPA fallback – exclude API paths
	app.get('*', (req, res, next) => {
		if (req.path.startsWith('/api/')) return next();
		res.sendFile(path.join(distPath, 'index.html'));
	});
}

// 404 handler must be after routes
app.use(notFound);

// Error handler (must be last)
app.use(errorHandler);

module.exports = app;
