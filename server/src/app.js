const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');

const app = express();

// Global middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/', routes);

// 404 handler must be after routes
app.use(notFound);

// Error handler (must be last)
app.use(errorHandler);

module.exports = app;
