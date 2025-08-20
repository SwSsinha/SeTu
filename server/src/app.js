const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Global middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/', routes);

// Error handler (must be last)
app.use(errorHandler);

module.exports = app;
