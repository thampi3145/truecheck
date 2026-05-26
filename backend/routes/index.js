const express = require('express');
const router = express.Router();
const { scrapeProduct } = require('../services/scraper');
const { analyzeProductWithAI, analyzeImageWithAI, chatAboutProduct } = require('../services/gemini');
const { getCached, setCache } = require('../utils/cache');
const logger = require('../utils/logger');

// ─── POST /analyze ────────────────────────────────────────────────────────────
// Accepts: { url: string }
// Returns: AnalysisResult
router.post('/analyze', async (req, res) => {
  const { url } = req.body;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ detail: 'URL is required.' });
  }

  const trimmedUrl = url.trim();

  // Check cache first — avoid re-scraping the same product
  const cached = getCached(trimmedUrl);
  if (cached) {
    logger.info(`Cache hit: ${trimmedUrl.substring(0, 60)}`);
    return res.json({ ...cached, fromCache: true });
  }

  try {
    // Step 1: Scrape product data
    logger.info(`Starting analysis for: ${trimmedUrl.substring(0, 60)}`);
    const productData = await scrapeProduct(trimmedUrl);

    // Step 2: AI analysis
    const aiResult = await analyzeProductWithAI(productData);

    // Step 3: Merge and return
    const result = {
      productName: productData.productName,
      platform: productData.platform,
      price: productData.price,
      originalPrice: productData.originalPrice,
      seller: productData.seller,
      rating: productData.rating,
      reviewCount: productData.reviewCount,
      imageUrl: productData.imageUrl,
      authenticityScore: aiResult.authenticityScore,
      verdict: aiResult.verdict,
      signals: aiResult.signals,
      aiSummary: aiResult.aiSummary,
      recommendation: aiResult.recommendation,
      checkedAt: new Date().toISOString(),
      url: trimmedUrl,
    };

    setCache(trimmedUrl, result);
    logger.info(`Analysis complete. Score: ${result.authenticityScore}, Verdict: ${result.verdict}`);
    return res.json(result);

  } catch (err) {
    logger.error(`Analysis error: ${err.message}`);

    if (err.message.includes('GEMINI_API_KEY')) {
      return res.status(500).json({ detail: 'AI API key not configured. Please set GEMINI_API_KEY in .env' });
    }
    if (err.message.includes('Unsupported platform')) {
      return res.status(400).json({ detail: err.message });
    }
    if (err.message.includes('timeout') || err.message.includes('Navigation')) {
      return res.status(408).json({ detail: 'Product page took too long to load. Please try again.' });
    }

    return res.status(500).json({ detail: 'Analysis failed. The product page may be blocked or unavailable.' });
  }
});

// ─── POST /analyze-image ──────────────────────────────────────────────────────
// Accepts: { image: base64string }
// Returns: AnalysisResult (from screenshot)
router.post('/analyze-image', async (req, res) => {
  const { image } = req.body;

  if (!image || typeof image !== 'string') {
    return res.status(400).json({ detail: 'Base64 image is required.' });
  }

  if (image.length > 10 * 1024 * 1024) {
    return res.status(400).json({ detail: 'Image too large. Please use a smaller screenshot.' });
  }

  try {
    logger.info('Starting screenshot analysis...');
    const aiResult = await analyzeImageWithAI(image);

    const result = {
      productName: aiResult.productName || 'Unknown Product',
      platform: aiResult.platform || 'Unknown',
      price: aiResult.price || 'N/A',
      originalPrice: aiResult.originalPrice || null,
      seller: aiResult.seller || 'Unknown',
      rating: aiResult.rating || 0,
      reviewCount: aiResult.reviewCount || 0,
      imageUrl: null,
      authenticityScore: aiResult.authenticityScore,
      verdict: aiResult.verdict,
      signals: aiResult.signals,
      aiSummary: aiResult.aiSummary,
      recommendation: aiResult.recommendation,
      checkedAt: new Date().toISOString(),
      url: null,
      fromScreenshot: true,
    };

    logger.info(`Screenshot analysis complete. Score: ${result.authenticityScore}`);
    return res.json(result);

  } catch (err) {
    logger.error(`Screenshot analysis error: ${err.message}`);
    if (err.message.includes('GEMINI_API_KEY')) {
      return res.status(500).json({ detail: 'AI API key not configured.' });
    }
    if (err instanceof SyntaxError) {
      return res.status(422).json({ detail: 'Could not extract product info from this screenshot. Please try a clearer image.' });
    }
    return res.status(500).json({ detail: 'Screenshot analysis failed. Please try again.' });
  }
});

// ─── POST /chat ───────────────────────────────────────────────────────────────
// Accepts: { messages: [{role, content}], productContext?: AnalysisResult }
// Returns: { reply: string }
router.post('/chat', async (req, res) => {
  const { messages, productContext } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ detail: 'Messages array is required.' });
  }

  if (messages.length > 30) {
    return res.status(400).json({ detail: 'Too many messages. Please start a new conversation.' });
  }

  try {
    const reply = await chatAboutProduct(messages, productContext);
    return res.json({ reply });
  } catch (err) {
    logger.error(`Chat error: ${err.message}`);
    return res.status(500).json({ detail: 'Chat failed. Please try again.' });
  }
});

// ─── GET /health ──────────────────────────────────────────────────────────────
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'TrueCheck API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    geminiConfigured: !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here'),
  });
});

module.exports = router;
