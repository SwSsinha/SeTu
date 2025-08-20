const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const compression = require('compression');
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

// Routes
app.use('/', routes);

// 404 handler must be after routes
app.use(notFound);

// Error handler (must be last)
app.use(errorHandler);

module.exports = app;
