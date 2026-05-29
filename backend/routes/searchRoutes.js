const express = require('express');
const router = express.Router();
const { smartSearch, analyzePrices, analyzeReviewPatterns, scrapeGeneric } = require('../services/multiSearch');
const { analyzeProductWithAI } = require('../services/gemini');
const { detectCategory, getCategoryInfo } = require('../services/categoryDetector');
const { addCustomPlatform, togglePlatform, getAllPlatforms, getPlatformsForCategory } = require('../config/platforms');
const { getCached, setCache } = require('../utils/cache');
const logger = require('../utils/logger');

// ─── POST /search ─────────────────────────────────────────────────────────────
// Smart search — auto detects category and routes to right platforms
// Accepts: { query: string, category?: string }
router.post('/search', async (req, res) => {
  const { query, category: categoryOverride } = req.body;

  if (!query || typeof query !== 'string') {
    return res.status(400).json({ detail: 'Search query is required.' });
  }

  const cacheKey = `search:${query.toLowerCase().trim()}:${categoryOverride || 'auto'}`;
  const cached = getCached(cacheKey);
  if (cached) {
    logger.info(`Cache hit for search: ${query}`);
    return res.json({ ...cached, fromCache: true });
  }

  try {
    // Step 1: Smart search with category detection
    const { results: rawResults, category, platforms } = await smartSearch(query, categoryOverride);

    if (rawResults.length === 0) {
      return res.status(404).json({
        detail: `No results found for "${query}". Try a different search term.`,
        category,
        categoryInfo: getCategoryInfo(category),
      });
    }

    // Step 2: Price analysis
    let results = analyzePrices(rawResults);

    // Step 3: Review analysis
    results = analyzeReviewPatterns(results);

    // Step 4: AI analysis (only for products category — for others just return raw)
    if (category === 'products') {
      const aiAnalyzed = await Promise.allSettled(
        results.map(async (product) => {
          try {
            const aiResult = await analyzeProductWithAI(product);
            return { ...product, ...aiResult };
          } catch {
            return {
              ...product,
              authenticityScore: product.isSuspiciousPrice ? 30 : 60,
              verdict: product.isSuspiciousPrice ? 'suspicious' : 'unknown',
              aiSummary: 'AI analysis unavailable.',
              recommendation: 'Check manually.',
              signals: [],
            };
          }
        })
      );
      results = aiAnalyzed.filter(r => r.status === 'fulfilled').map(r => r.value);
    }

    // Step 5: Find best deal
    const bestDeal = findBestDeal(results, category);

    // Step 6: Build response
    const response = {
      query,
      category,
      categoryInfo: getCategoryInfo(category),
      platformsSearched: platforms.map(p => p.name),
      totalResults: results.length,
      results,
      bestDeal,
      summary: buildSummary(results, category, bestDeal),
      priceRange: getPriceRange(results),
      checkedAt: new Date().toISOString(),
    };

    setCache(cacheKey, response);
    return res.json(response);

  } catch (err) {
    logger.error(`Search error: ${err.message}`);
    return res.status(500).json({ detail: 'Search failed. Please try again.' });
  }
});

// ─── POST /compare (backward compatible) ─────────────────────────────────────
router.post('/compare', async (req, res) => {
  req.body.query = req.body.productName || req.body.query;
  req.body.category = 'products'; // compare always searches products
  return router.handle(req, res, () => {});
});

// ─── GET /platforms ───────────────────────────────────────────────────────────
// Returns all platforms organized by category
router.get('/platforms', (req, res) => {
  res.json(getAllPlatforms());
});

// ─── POST /platforms/toggle ───────────────────────────────────────────────────
// Enable or disable a platform
router.post('/platforms/toggle', (req, res) => {
  const { id, enabled } = req.body;
  const result = togglePlatform(id, enabled);
  if (!result) return res.status(404).json({ detail: 'Platform not found.' });
  res.json({ success: true, platform: result });
});

// ─── POST /platforms/add ──────────────────────────────────────────────────────
// Add a custom domain/platform
router.post('/platforms/add', async (req, res) => {
  const { name, domain, category, searchUrl, color } = req.body;

  if (!name || !domain || !category) {
    return res.status(400).json({ detail: 'name, domain and category are required.' });
  }

  const platform = addCustomPlatform({
    id: domain.replace(/\./g, '_') + '_' + Date.now(),
    name,
    domain,
    category,
    color: color || '#888780',
    searchUrl: searchUrl || `https://${domain}/search?q={q}`,
    buyUrl: `https://${domain}/search?q={q}`,
    scraper: 'generic',
    enabled: true,
    builtIn: false,
    addedAt: new Date().toISOString(),
  });

  // Test it immediately
  try {
    const testResults = await scrapeGeneric(platform, 'test');
    platform.verified = testResults.length > 0;
  } catch {
    platform.verified = false;
  }

  res.json({ success: true, platform });
});

// ─── POST /platforms/test ─────────────────────────────────────────────────────
// Test a domain before adding
router.post('/platforms/test', async (req, res) => {
  const { domain, query = 'test product' } = req.body;

  if (!domain) return res.status(400).json({ detail: 'domain is required.' });

  try {
    const platform = {
      id: 'test',
      name: domain,
      domain,
      searchUrl: `https://${domain}/search?q={q}`,
      buyUrl: `https://${domain}`,
      scraper: 'generic',
    };

    const results = await scrapeGeneric(platform, query);

    res.json({
      success: results.length > 0,
      domain,
      resultsFound: results.length,
      sample: results.slice(0, 2),
    });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

// ─── GET /categories ──────────────────────────────────────────────────────────
router.get('/categories', (req, res) => {
  const categories = ['products', 'hotels', 'flights', 'food', 'jobs'];
  res.json(categories.map(cat => ({
    id: cat,
    ...require('../services/categoryDetector').getCategoryInfo(cat),
    platforms: getPlatformsForCategory(cat).map(p => p.name),
  })));
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
function findBestDeal(results, category) {
  if (results.length === 0) return null;

  if (category === 'products') {
    // For products: highest authenticity score + fair price
    const genuine = results.filter(r => (r.authenticityScore || 60) >= 50);
    const pool = genuine.length > 0 ? genuine : results;
    const scored = pool.map(r => ({
      ...r,
      dealScore: ((r.authenticityScore || 60) * 0.7) + (r.priceDeviation > 40 ? 10 : 60) * 0.3,
    }));
    scored.sort((a, b) => b.dealScore - a.dealScore);
    return scored[0];
  } else {
    // For hotels/flights/food: lowest price with decent rating
    const withPrice = results.filter(r => r.priceNum > 0);
    if (withPrice.length === 0) return results[0];
    withPrice.sort((a, b) => {
      const aScore = a.priceNum - (a.rating * 100);
      const bScore = b.priceNum - (b.rating * 100);
      return aScore - bScore;
    });
    return withPrice[0];
  }
}

function buildSummary(results, category, bestDeal) {
  const prices = results.map(r => r.priceNum).filter(p => p > 0);
  return {
    totalResults: results.length,
    category,
    priceSpread: prices.length > 0
      ? `₹${Math.min(...prices).toLocaleString()} - ₹${Math.max(...prices).toLocaleString()}`
      : 'N/A',
    bestPlatform: bestDeal?.platform || 'N/A',
    bestPrice: bestDeal?.price || 'N/A',
    fakeRiskCount: results.filter(r => (r.authenticityScore || 100) < 40).length,
    tip: bestDeal
      ? `Best deal found on ${bestDeal.platform} at ${bestDeal.price}`
      : 'Compare all options above',
  };
}

function getPriceRange(results) {
  const prices = results.map(r => r.priceNum).filter(p => p > 0);
  if (prices.length === 0) return { min: 0, max: 0, avg: 0 };
  return {
    min: Math.min(...prices),
    max: Math.max(...prices),
    avg: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
  };
}

module.exports = router;
