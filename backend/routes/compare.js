const express = require('express');
const router = express.Router();
const { 
  searchAllPlatforms, 
  analyzePrices, 
  analyzeReviewPatterns 
} = require('../services/multiSearch');
const { analyzeProductWithAI } = require('../services/gemini');
const { getCached, setCache } = require('../utils/cache');
const logger = require('../utils/logger');

// ─── POST /compare ────────────────────────────────────────────────────────────
// Accepts: { productName: string }
// Returns: full comparison across all platforms
router.post('/compare', async (req, res) => {
  const { productName } = req.body;
  
  if (!productName || typeof productName !== 'string') {
    return res.status(400).json({ detail: 'Product name is required.' });
  }

  const cacheKey = `compare:${productName.toLowerCase().trim()}`;
  
  // Check cache first
  const cached = getCached(cacheKey);
  if (cached) {
    logger.info(`Cache hit for compare: ${productName}`);
    return res.json({ ...cached, fromCache: true });
  }

  try {
    // ── STEP 1: Search all platforms simultaneously ──
    logger.info(`Starting comparison for: ${productName}`);
    let allResults = await searchAllPlatforms(productName);
    
    if (allResults.length === 0) {
      return res.status(404).json({ 
        detail: 'No products found. Try a different search term.' 
      });
    }

    // ── STEP 2: Price Intelligence ──
    allResults = analyzePrices(allResults);
    
    // ── STEP 3: Review Pattern Analysis ──
    allResults = analyzeReviewPatterns(allResults);

    // ── STEP 4: AI Analysis for each result ──
    // Run AI analysis for all results in parallel
    const aiAnalyzed = await Promise.allSettled(
      allResults.map(async (product) => {
        try {
          const aiResult = await analyzeProductWithAI(product);
          return { ...product, ...aiResult };
        } catch (err) {
          // If AI fails for one product, still return basic data
          logger.error(`AI analysis failed for ${product.platform}: ${err.message}`);
          return {
            ...product,
            authenticityScore: product.isSuspiciousPrice ? 30 : 60,
            verdict: product.isSuspiciousPrice ? 'suspicious' : 'unknown',
            aiSummary: 'AI analysis unavailable for this listing.',
            recommendation: 'Please check manually.',
            signals: [],
          };
        }
      })
    );

    // Collect all analyzed results
    const analyzedResults = aiAnalyzed
      .filter(r => r.status === 'fulfilled')
      .map(r => r.value);

    // ── STEP 5: Find Best Buy ──
    const bestBuy = findBestBuy(analyzedResults);
    
    // ── STEP 6: Generate Comparison Summary ──
    const summary = generateComparisonSummary(analyzedResults, bestBuy);

    // ── STEP 7: Group by platform ──
    const byPlatform = groupByPlatform(analyzedResults);

    const response = {
      searchTerm: productName,
      totalResults: analyzedResults.length,
      results: analyzedResults,
      byPlatform,
      bestBuy,
      summary,
      priceRange: {
        min: Math.min(...analyzedResults.map(r => r.priceNum).filter(p => p > 0)),
        max: Math.max(...analyzedResults.map(r => r.priceNum).filter(p => p > 0)),
        avg: analyzedResults.reduce((sum, r) => sum + (r.priceNum || 0), 0) / analyzedResults.length,
      },
      checkedAt: new Date().toISOString(),
    };

    setCache(cacheKey, response);
    logger.info(`Comparison complete. Found ${analyzedResults.length} results.`);
    return res.json(response);

  } catch (err) {
    logger.error(`Comparison error: ${err.message}`);
    return res.status(500).json({ 
      detail: 'Comparison failed. Please try again.' 
    });
  }
});

// ─── Helper: Find Best Buy ────────────────────────────────────────────────────
function findBestBuy(results) {
  if (results.length === 0) return null;
  
  // Filter out fake/suspicious with very low scores
  const genuine = results.filter(r => r.authenticityScore >= 50);
  const pool = genuine.length > 0 ? genuine : results;
  
  // Score = 70% authenticity + 30% price fairness
  const scored = pool.map(r => {
    // Price score: closer to average = better
    const priceScore = r.priceDeviation > 40 
      ? 10  // suspiciously cheap = bad
      : r.priceDeviation > 15 
      ? 80  // good deal
      : 60; // fair price
    
    const buyScore = (r.authenticityScore * 0.7) + (priceScore * 0.3);
    return { ...r, buyScore: Math.round(buyScore) };
  });
  
  // Sort by buy score
  scored.sort((a, b) => b.buyScore - a.buyScore);
  
  return scored[0];
}

// ─── Helper: Generate Summary ─────────────────────────────────────────────────
function generateComparisonSummary(results, bestBuy) {
  const fakeCount = results.filter(r => r.authenticityScore < 40).length;
  const genuineCount = results.filter(r => r.authenticityScore >= 70).length;
  const suspiciousCount = results.filter(r => 
    r.authenticityScore >= 40 && r.authenticityScore < 70
  ).length;

  const prices = results.map(r => r.priceNum).filter(p => p > 0);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceDiff = maxPrice - minPrice;

  return {
    totalAnalyzed: results.length,
    genuineCount,
    suspiciousCount,
    fakeRiskCount: fakeCount,
    priceSpread: `₹${minPrice.toLocaleString()} - ₹${maxPrice.toLocaleString()}`,
    priceDifference: priceDiff,
    bestPlatform: bestBuy?.platform || 'N/A',
    bestPrice: bestBuy?.price || 'N/A',
    bestScore: bestBuy?.authenticityScore || 0,
    warning: fakeCount > 0 
      ? `⚠️ ${fakeCount} listing(s) show fake product indicators` 
      : null,
    tip: priceDiff > 2000 
      ? `💡 Price varies by ₹${priceDiff.toLocaleString()} across platforms. Buy from ${bestBuy?.platform}.`
      : `✅ Prices are consistent across platforms.`,
  };
}

// ─── Helper: Group by Platform ────────────────────────────────────────────────
function groupByPlatform(results) {
  const platforms = {};
  results.forEach(r => {
    if (!platforms[r.platform]) platforms[r.platform] = [];
    platforms[r.platform].push(r);
  });
  return platforms;
}

module.exports = router;
