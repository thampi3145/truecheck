const { chromium } = require('playwright');
const cheerio = require('cheerio');
const logger = require('../utils/logger');
const { getPlatformsForCategory } = require('../config/platforms');
const { detectCategory } = require('./categoryDetector');
const { callGemini } = require('./gemini');

// ─── Common Browser ───────────────────────────────────────────────────────────
async function launchBrowser() {
  return chromium.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    ],
  });
}

// ─── Helper: Parse Price ──────────────────────────────────────────────────────
function parsePrice(priceStr) {
  if (!priceStr) return 0;
  const cleaned = priceStr.replace(/[₹,\s]/g, '').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

// ─── Helper: Detect Repetitive Reviews ───────────────────────────────────────
function detectRepetitiveReviews(reviews) {
  if (!reviews || reviews.length < 3) return false;
  const wordCounts = {};
  reviews.forEach(review => {
    const words = review.toLowerCase().split(/\s+/);
    words.forEach(word => {
      if (word.length > 3) wordCounts[word] = (wordCounts[word] || 0) + 1;
    });
  });
  const threshold = reviews.length * 0.6;
  return Object.values(wordCounts).some(count => count > threshold);
}

// ─── AMAZON ───────────────────────────────────────────────────────────────────
async function searchAmazon(productName) {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  try {
    const searchUrl = `https://www.amazon.in/s?k=${encodeURIComponent(productName)}`;
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);
    const html = await page.content();
    const $ = cheerio.load(html);
    const results = [];

    $('[data-component-type="s-search-result"]').each((i, el) => {
      if (i >= 3) return false;
      const name = $(el).find('h2 span').text().trim() || $(el).find('h2 a span').text().trim();
      const priceWhole = $(el).find('.a-price-whole').first().text().trim();
      const rating = $(el).find('.a-icon-alt').first().text().trim();
      const href = $(el).find('h2 a').attr('href');
      const url = href ? `https://www.amazon.in${href}` : '';
      const imageUrl = $(el).find('img.s-image').attr('src');

      if (name && priceWhole) {
        results.push({
          productName: name.substring(0, 100),
          platform: 'Amazon India',
          price: `₹${priceWhole.replace(/[₹,]/g, '')}`,
          priceNum: parsePrice(priceWhole),
          rating: parseFloat(rating?.match(/[\d.]+/)?.[0] || '0'),
          reviewCount: 0,
          url,
          imageUrl,
          seller: 'Amazon Seller',
          reviews: [],
          buyUrl: url, // direct buy link
        });
      }
    });

    logger.info(`Amazon search found ${results.length} results for: ${productName}`);
    return results;
  } catch (err) {
    logger.error(`Amazon search error: ${err.message}`);
    return [];
  } finally {
    await browser.close();
  }
}

// ─── FLIPKART (FIXED) ─────────────────────────────────────────────────────────
async function searchFlipkart(productName) {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  try {
    const searchUrl = `https://www.flipkart.com/search?q=${encodeURIComponent(productName)}&otracker=search`;
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);
    const html = await page.content();
    const $ = cheerio.load(html);
    const results = [];

    // Flipkart uses multiple possible card formats — try all
    const cards = $('div[data-id]').length > 0
      ? $('div[data-id]')
      : $('div._1AtVbE, div.tUxRFH, div._2kHMtA');

    cards.each((i, el) => {
      if (i >= 3) return false;

      // Try multiple name selectors
      const name = $(el).find('div.KzDlHZ').text().trim()
        || $(el).find('div._4rR01T').text().trim()
        || $(el).find('a.IRpwTa').text().trim()
        || $(el).find('div.syl9yP').text().trim()
        || $(el).find('a[title]').first().attr('title')
        || '';

      // Try multiple price selectors
      const price = $(el).find('div.Nx9bqj').text().trim()
        || $(el).find('div._30jeq3').text().trim()
        || $(el).find('div._3I9_wc').text().trim()
        || $(el).find('div.hl05eU div.Nx9bqj').text().trim()
        || '';

      const href = $(el).find('a[href*="/p/"]').first().attr('href')
        || $(el).find('a').first().attr('href')
        || '';

      const url = href ? `https://www.flipkart.com${href.split('?')[0]}` : '';
      const imageUrl = $(el).find('img').first().attr('src') || '';

      if (name.length > 3 && price.length > 0) {
        results.push({
          productName: name.substring(0, 100),
          platform: 'Flipkart',
          price,
          priceNum: parsePrice(price),
          rating: 0,
          reviewCount: 0,
          url,
          imageUrl,
          seller: 'Flipkart Seller',
          reviews: [],
          buyUrl: url,
        });
      }
    });

    logger.info(`Flipkart search found ${results.length} results for: ${productName}`);
    return results;
  } catch (err) {
    logger.error(`Flipkart search error: ${err.message}`);
    return [];
  } finally {
    await browser.close();
  }
}

// ─── MYNTRA (FIXED) ───────────────────────────────────────────────────────────
async function searchMyntra(productName) {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  try {
    // Fixed URL — use search query endpoint instead of path
    const searchUrl = `https://www.myntra.com/search?rawQuery=${encodeURIComponent(productName)}`;
    
    await page.setExtraHTTPHeaders({
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
    });

    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(4000);
    const html = await page.content();
    const $ = cheerio.load(html);
    const results = [];

    $('li.product-base').each((i, el) => {
      if (i >= 3) return false;
      const brand = $(el).find('h3.product-brand').text().trim();
      const name = $(el).find('h4.product-product').text().trim();
      const price = $(el).find('span.product-discountedPrice').text().trim()
        || $(el).find('span.product-price').text().trim();
      const href = $(el).find('a').first().attr('href');
      const url = href ? `https://www.myntra.com/${href}` : '';
      const imageUrl = $(el).find('img.img-responsive').attr('src')
        || $(el).find('img').first().attr('src');

      if ((brand || name) && price) {
        results.push({
          productName: `${brand} ${name}`.trim().substring(0, 100),
          platform: 'Myntra',
          price,
          priceNum: parsePrice(price),
          rating: 0,
          reviewCount: 0,
          url,
          imageUrl,
          seller: 'Myntra Partner',
          reviews: [],
          buyUrl: url,
        });
      }
    });

    logger.info(`Myntra search found ${results.length} results for: ${productName}`);
    return results;
  } catch (err) {
    logger.error(`Myntra search error: ${err.message}`);
    return [];
  } finally {
    await browser.close();
  }
}

// ─── AJIO (FIXED) ─────────────────────────────────────────────────────────────
async function searchAjio(productName) {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  try {
    const searchUrl = `https://www.ajio.com/search/?text=${encodeURIComponent(productName)}`;
    await page.goto(searchUrl, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    const html = await page.content();
    const $ = cheerio.load(html);
    const results = [];

    // Try multiple Ajio card selectors
    const cards = $('div.item.rilrtl-products-list__item').length > 0
      ? $('div.item.rilrtl-products-list__item')
      : $('div[class*="product"]').filter((i, el) => $(el).find('img').length > 0);

    cards.each((i, el) => {
      if (i >= 3) return false;
      const name = $(el).find('div.nameCls').text().trim()
        || $(el).find('strong.brand').text().trim()
        || $(el).find('div[class*="brand"]').first().text().trim();
      const price = $(el).find('span.price strong').text().trim()
        || $(el).find('div.price').text().trim()
        || $(el).find('[class*="price"]').first().text().trim();
      const href = $(el).find('a').first().attr('href');
      const url = href ? `https://www.ajio.com${href}` : '';
      const imageUrl = $(el).find('img').first().attr('src');

      if (name && price) {
        results.push({
          productName: name.substring(0, 100),
          platform: 'Ajio',
          price,
          priceNum: parsePrice(price),
          rating: 0,
          reviewCount: 0,
          url,
          imageUrl,
          seller: 'Ajio Partner',
          reviews: [],
          buyUrl: url,
        });
      }
    });

    logger.info(`Ajio search found ${results.length} results for: ${productName}`);
    return results;
  } catch (err) {
    logger.error(`Ajio search error: ${err.message}`);
    return [];
  } finally {
    await browser.close();
  }
}

// ─── GENERIC SCRAPER (for custom domains + hotels/flights/food/jobs) ──────────
// Uses Gemini AI to extract data from any website
async function scrapeGeneric(platform, query) {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  try {
    const searchUrl = platform.searchUrl.replace('{q}', encodeURIComponent(query));
    logger.info(`Generic scraping: ${platform.name} at ${searchUrl}`);

    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);
    const html = await page.content();

    // Use Gemini to extract structured data from any page
    const prompt = `Extract listing data from this ${platform.name} page.
Platform: ${platform.name} (${platform.domain})
Search query: "${query}"

HTML snippet (first 4000 chars):
${html.substring(0, 4000)}

Return a JSON array of up to 3 results. Each result must have:
{
  "name": "item/hotel/flight name",
  "price": "price with currency symbol or per night/ticket",
  "rating": 4.2,
  "description": "brief description",
  "url": "full URL if found in HTML, else empty string"
}

Return ONLY valid JSON array. No markdown. No explanation. Return [] if nothing found.`;

    const raw = await callGemini(prompt);
    const cleaned = raw.replace(/```json|```/g, '').trim();
    
    let items = [];
    try { items = JSON.parse(cleaned); } catch { items = []; }

    return items.map(item => ({
      productName: (item.name || 'Unknown').substring(0, 100),
      platform: platform.name,
      price: item.price || 'N/A',
      priceNum: parsePrice(item.price),
      rating: parseFloat(item.rating) || 0,
      reviewCount: 0,
      url: item.url || platform.buyUrl?.replace('{q}', encodeURIComponent(query)) || '',
      buyUrl: item.url || platform.buyUrl?.replace('{q}', encodeURIComponent(query)) || '',
      imageUrl: null,
      seller: platform.name,
      reviews: [],
      description: item.description || '',
    }));

  } catch (err) {
    logger.error(`Generic scrape error for ${platform.name}: ${err.message}`);
    return [];
  } finally {
    await browser.close();
  }
}

// ─── MAIN: Smart search with category detection ───────────────────────────────
async function smartSearch(query, categoryOverride = null) {
  // Step 1: Detect category
  const category = categoryOverride || await detectCategory(query);
  logger.info(`Smart search: "${query}" → category: ${category}`);

  // Step 2: Get platforms for this category
  const platforms = getPlatformsForCategory(category);
  logger.info(`Searching ${platforms.length} platforms: ${platforms.map(p => p.name).join(', ')}`);

  // Step 3: Search all platforms simultaneously
  const searchPromises = platforms.map(platform => {
    // Use specific scrapers for known platforms
    switch (platform.scraper) {
      case 'amazon':   return searchAmazon(query);
      case 'flipkart': return searchFlipkart(query);
      case 'myntra':   return searchMyntra(query);
      case 'ajio':     return scrapeGeneric(platform, query); // use generic for now
      default:         return scrapeGeneric(platform, query);
    }
  });

  const results = await Promise.allSettled(searchPromises);

  // Step 4: Collect results
  const allResults = [];
  results.forEach((result, i) => {
    if (result.status === 'fulfilled' && result.value.length > 0) {
      allResults.push(...result.value);
    } else if (result.status === 'rejected') {
      logger.error(`Platform ${platforms[i].name} failed: ${result.reason}`);
    }
  });

  logger.info(`Smart search total results: ${allResults.length}`);
  return { results: allResults, category, platforms };
}

// ─── Keep old function for backward compatibility ─────────────────────────────
async function searchAllPlatforms(productName) {
  const { results } = await smartSearch(productName, 'products');
  return results;
}

// ─── Price Intelligence ───────────────────────────────────────────────────────
function analyzePrices(results) {
  const validPrices = results.map(r => r.priceNum).filter(p => p > 0);
  if (validPrices.length === 0) return results;

  const avgPrice = validPrices.reduce((a, b) => a + b, 0) / validPrices.length;
  const minPrice = Math.min(...validPrices);
  const maxPrice = Math.max(...validPrices);

  return results.map(r => {
    const deviation = avgPrice > 0 ? ((avgPrice - r.priceNum) / avgPrice) * 100 : 0;
    return {
      ...r,
      avgMarketPrice: Math.round(avgPrice),
      minMarketPrice: minPrice,
      maxMarketPrice: maxPrice,
      priceDeviation: Math.round(deviation),
      isSuspiciousPrice: deviation > 40 && r.priceNum > 0,
      priceLabel: deviation > 40 ? 'Suspiciously Low'
        : deviation > 20 ? 'Good Deal'
        : deviation < -20 ? 'Overpriced'
        : 'Fair Price',
    };
  });
}

// ─── Review Intelligence ──────────────────────────────────────────────────────
function analyzeReviewPatterns(results) {
  return results.map(r => {
    const suspicious = [];
    if (r.reviewCount > 500000) suspicious.push('Unusually high review count');
    if (r.rating >= 4.9 && r.reviewCount > 1000) suspicious.push('Suspiciously perfect rating');
    if (r.reviewCount < 10 && r.rating === 0) suspicious.push('No reviews — new or suspicious listing');
    if (detectRepetitiveReviews(r.reviews)) suspicious.push('Repetitive review patterns detected');
    return { ...r, reviewSuspicions: suspicious, hasReviewWarnings: suspicious.length > 0 };
  });
}

module.exports = {
  smartSearch,
  searchAllPlatforms,
  analyzePrices,
  analyzeReviewPatterns,
  scrapeGeneric,
  parsePrice,
};
