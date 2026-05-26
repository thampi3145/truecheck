require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const logger = require('./utils/logger');
const routes = require('./routes/index');

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Security Middleware ──────────────────────────────────────────────────────
app.use(helmet());

app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));

// ─── Rate Limiting ────────────────────────────────────────────────────────────
// Limits: 20 requests per minute per IP to protect Gemini API quota
const limiter = rateLimit({
  windowMs: 60 * 1000,      // 1 minute
  max: 20,
  message: { detail: 'Too many requests. Please wait a moment before trying again.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// ─── Body Parser ──────────────────────────────────────────────────────────────
// 10MB limit to handle base64 screenshots
app.use(express.json({ limit: '10mb' }));

// ─── Request Logger ───────────────────────────────────────────────────────────
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/', routes);

// ─── Root ─────────────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    name: 'TrueCheck API',
    version: '1.0.0',
    description: 'AI-powered product authenticity checker for Indian e-commerce',
    endpoints: {
      'POST /analyze': 'Analyze product by URL',
      'POST /analyze-image': 'Analyze product screenshot (base64)',
      'POST /chat': 'Chat with AI about a product',
      'GET /health': 'Health check',
    },
  });
});

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ detail: 'Endpoint not found.' });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  logger.error(`Unhandled error: ${err.message}`);
  res.status(500).json({ detail: 'Internal server error.' });
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  logger.info(`TrueCheck API running on port ${PORT}`);
  logger.info(`Gemini API: ${process.env.GEMINI_API_KEY ? '✓ Configured' : '✗ NOT SET — add to .env'}`);
});

module.exports = app;
