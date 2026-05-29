const { chromium } = require('playwright');
const cheerio = require('cheerio');
const logger = require('../utils/logger');

// ─── Common Browser ──────────────────────────────────────────────────────────
async function launchBrowser() {
  return chromium.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    ],
  });
}

// ─── Helper: Parse Price ─────────────────────────────────────────────────────
// Converts "₹2,999" or "2999" → 2999 (number)
function parsePrice(priceStr) {
  if (!priceStr) return 0;
  const cleaned = priceStr.replace(/[₹,\s]/g, '').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

// ─── Helper: Detect Repetitive Reviews ──────────────────────────────────────
// If many reviews use same words → likely fake
function detectRepetitiveReviews(reviews) {
  if (!reviews || reviews.length < 3) return false;
  
  // Count word frequency
  const wordCounts = {};
  reviews.forEach(review => {
    const words = review.toLowerCase().split(/\s+/);
    words.forEach(word => {
      if (word.length > 3) { // ignore short words
        wordCounts[word] = (wordCounts[word] || 0) + 1;
      }
    });
  });
  
  // If any word appears in more than 60% of reviews → suspicious
  const threshold = reviews.length * 0.6;
  const repetitive = Object.values(wordCounts).some(count => count > threshold);
  return repetitive;
}

// ─── AMAZON: Search by product name ─────────────────────────────────────────
async function searchAmazon(productName) {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  try {
    // Search Amazon India
    const searchUrl = `https://www.amazon.in/s?k=${encodeURIComponent(productName)}`;
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);
    
    const html = await page.content();
    const $ = cheerio.load(html);
    
    // Get top 3 results
    const results = [];
    $('[data-component-type="s-search-result"]').each((i, el) => {
      if (i >= 3) return false; // only first 3
      
      const name = $(el).find('h2 span').text().trim();
      const priceWhole = $(el).find('.a-price-whole').first().text().trim();
      const rating = $(el).find('.a-icon-alt').first().text().trim();
      const reviewCount = $(el).find('.a-size-base').filter((i, e) => 
        $(e).text().match(/^\d/)
      ).first().text().trim();
      const url = 'https://www.amazon.in' + $(el).find('h2 a').attr('href');
      const imageUrl = $(el).find('img.s-image').attr('src');
      const seller = $(el).find('.a-size-base.s-underline-text').text().trim() || 'Amazon Seller';
      
      if (name && priceWhole) {
        results.push({
          productName: name.substring(0, 100),
          platform: 'Amazon India',
          price: `₹${priceWhole.replace(/[₹,]/g, '')}`,
          priceNum: parsePrice(priceWhole),
          rating: parseFloat(rating.match(/[\d.]+/)?.[0] || '0'),
          reviewCount: parseInt(reviewCount.replace(/[^0-9]/g, '') || '0'),
          url,
          imageUrl,
          seller,
          reviews: [],
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

// ─── FLIPKART: Search by product name ────────────────────────────────────────
async function searchFlipkart(productName) {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  try {
    const searchUrl = `https://www.flipkart.com/search?q=${encodeURIComponent(productName)}`;
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);
    
    const html = await page.content();
    const $ = cheerio.load(html);
    
    const results = [];
    // Flipkart product cards
    $('div[data-id]').each((i, el) => {
      if (i >= 3) return false;
      
      const name = $(el).find('div.KzDlHZ, div._4rR01T, a.s1Q9rs').first().text().trim();
      const price = $(el).find('div.Nx9bqj, div._30jeq3').first().text().trim();
      const rating = $(el).find('div.XQDdHH, div._3LWZlK').first().text().trim();
      const reviews = $(el).find('span.Wphh3N, span._2_R_DZ').first().text().trim();
      const href = $(el).find('a').first().attr('href');
      const url = href ? `https://www.flipkart.com${href}` : '';
      const imageUrl = $(el).find('img').first().attr('src');
      
      if (name && price) {
        results.push({
          productName: name.substring(0, 100),
          platform: 'Flipkart',
          price,
          priceNum: parsePrice(price),
          rating: parseFloat(rating) || 0,
          reviewCount: parseInt(reviews.replace(/[^0-9]/g, '') || '0'),
          url,
          imageUrl,
          seller: 'Flipkart Seller',
          reviews: [],
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

// ─── MYNTRA: Search by product name ──────────────────────────────────────────
async function searchMyntra(productName) {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  try {
    const searchUrl = `https://www.myntra.com/${encodeURIComponent(productName.replace(/\s+/g, '-'))}`;
    await page.goto(searchUrl, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    
    const html = await page.content();
    const $ = cheerio.load(html);
    
    const results = [];
    $('li.product-base').each((i, el) => {
      if (i >= 3) return false;
      
      const brand = $(el).find('h3.product-brand').text().trim();
      const name = $(el).find('h4.product-product').text().trim();
      const price = $(el).find('span.product-discountedPrice').text().trim()
                 || $(el).find('span.product-strike').text().trim();
      const rating = $(el).find('div.product-ratingsContainer span').first().text().trim();
      const href = $(el).find('a').attr('href');
      const url = href ? `https://www.myntra.com/${href}` : '';
      const imageUrl = $(el).find('img.img-responsive').attr('src');
      
      if ((brand || name) && price) {
        results.push({
          productName: `${brand} ${name}`.trim().substring(0, 100),
          platform: 'Myntra',
          price,
          priceNum: parsePrice(price),
          rating: parseFloat(rating) || 0,
          reviewCount: 0,
          url,
          imageUrl,
          seller: 'Myntra Partner',
          reviews: [],
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

// ─── AJIO: Search by product name ────────────────────────────────────────────
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
    $('div.item.rilrtl-products-list__item').each((i, el) => {
      if (i >= 3) return false;
      
      const name = $(el).find('div.nameCls').text().trim()
                || $(el).find('strong.brand').text().trim();
      const price = $(el).find('span.price strong').text().trim()
                 || $(el).find('div.price').text().trim();
      const rating = $(el).find('span.rating').text().trim();
      const href = $(el).find('a').attr('href');
      const url = href ? `https://www.ajio.com${href}` : '';
      const imageUrl = $(el).find('img').attr('src');
      
      if (name && price) {
        results.push({
          productName: name.substring(0, 100),
          platform: 'Ajio',
          price,
          priceNum: parsePrice(price),
          rating: parseFloat(rating) || 0,
          reviewCount: 0,
          url,
          imageUrl,
          seller: 'Ajio Partner',
          reviews: [],
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

// ─── MAIN: Search ALL platforms simultaneously ────────────────────────────────
async function searchAllPlatforms(productName) {
  logger.info(`Searching all platforms for: ${productName}`);
  
  // Run ALL searches at the same time (parallel)
  // Promise.allSettled = even if one fails, others continue
  const [amazonResult, flipkartResult, myntraResult, ajioResult] = 
    await Promise.allSettled([
      searchAmazon(productName),
      searchFlipkart(productName),
      searchMyntra(productName),
      searchAjio(productName),
    ]);
  
  // Collect successful results
  const allResults = [];
  
  if (amazonResult.status === 'fulfilled') 
    allResults.push(...amazonResult.value);
  if (flipkartResult.status === 'fulfilled') 
    allResults.push(...flipkartResult.value);
  if (myntraResult.status === 'fulfilled') 
    allResults.push(...myntraResult.value);
  if (ajioResult.status === 'fulfilled') 
    allResults.push(...ajioResult.value);
  
  logger.info(`Total results found: ${allResults.length}`);
  return allResults;
}

// ─── Price Intelligence ───────────────────────────────────────────────────────
function analyzePrices(results) {
  // Get valid prices only
  const validPrices = results
    .map(r => r.priceNum)
    .filter(p => p > 0);
  
  if (validPrices.length === 0) return results;
  
  // Calculate average price
  const avgPrice = validPrices.reduce((a, b) => a + b, 0) / validPrices.length;
  const minPrice = Math.min(...validPrices);
  const maxPrice = Math.max(...validPrices);
  
  // Tag each result
  return results.map(r => {
    const deviation = avgPrice > 0 
      ? ((avgPrice - r.priceNum) / avgPrice) * 100 
      : 0;
    
    return {
      ...r,
      avgMarketPrice: Math.round(avgPrice),
      minMarketPrice: minPrice,
      maxMarketPrice: maxPrice,
      priceDeviation: Math.round(deviation),
      // 40% below average = suspicious
      isSuspiciousPrice: deviation > 40 && r.priceNum > 0,
      priceLabel: deviation > 40 ? '🚨 Suspiciously Low'
                : deviation > 20 ? '✅ Good Deal'
                : deviation < -20 ? '💰 Overpriced'
                : '✅ Fair Price',
    };
  });
}

// ─── Review Intelligence ──────────────────────────────────────────────────────
function analyzeReviewPatterns(results) {
  return results.map(r => {
    const suspicious = [];
    
    // Too many reviews?
    if (r.reviewCount > 500000) suspicious.push('Unusually high review count');
    
    // Rating too perfect?
    if (r.rating >= 4.9 && r.reviewCount > 1000) suspicious.push('Suspiciously perfect rating');
    
    // Very low review count for established product?
    if (r.reviewCount < 10 && r.rating === 0) suspicious.push('No reviews - new/suspicious listing');
    
    // Repetitive reviews?
    if (detectRepetitiveReviews(r.reviews)) suspicious.push('Repetitive review patterns detected');
    
    return {
      ...r,
      reviewSuspicions: suspicious,
      hasReviewWarnings: suspicious.length > 0,
    };
  });
}

module.exports = { 
  searchAllPlatforms, 
  analyzePrices, 
  analyzeReviewPatterns,
  parsePrice 
};
