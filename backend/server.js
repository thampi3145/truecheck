require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const logger = require('./utils/logger');
const routes = require('./routes/index');
const compareRoutes = require('./routes/compare');
const searchRoutes = require('./routes/searchRoutes'); // ← NEW

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors({ origin: process.env.ALLOWED_ORIGIN || '*' }));

// Rate limiting — 10 requests/min for compare (it's heavy)
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { detail: 'Too many requests. Please wait.' },
});
app.use(limiter);

// 10MB limit for images
app.use(express.json({ limit: '10mb' }));

app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/', routes);
app.use('/', compareRoutes);
app.use('/', searchRoutes); // ← NEW: adds /compare endpoint

app.get('/', (req, res) => {
  res.json({
    name: 'TrueCheck API',
    version: '2.0.0',
    endpoints: {
      'POST /analyze': 'Analyze product by URL',
      'POST /compare': 'Compare product across all platforms', // ← NEW
      'POST /analyze-image': 'Analyze screenshot',
      'POST /chat': 'Chat with AI',
      'GET /health': 'Health check',
    },
  });
});

app.use((req, res) => {
  res.status(404).json({ detail: 'Endpoint not found.' });
});

app.use((err, req, res, next) => {
  logger.error(`Unhandled error: ${err.message}`);
  res.status(500).json({ detail: 'Internal server error.' });
});

app.listen(PORT, () => {
  logger.info(`TrueCheck API v2.0 running on port ${PORT}`);
  logger.info(`Gemini API: ${process.env.GEMINI_API_KEY ? '✓ Configured' : '✗ NOT SET'}`);
});

module.exports = app;
