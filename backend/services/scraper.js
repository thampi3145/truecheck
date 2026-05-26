const { chromium } = require('playwright');
const cheerio = require('cheerio');
const logger = require('../utils/logger');

// ─── Detect Platform ────────────────────────────────────────────────────────
function detectPlatform(url) {
  if (url.includes('amazon.in') || url.includes('amzn.in')) return 'Amazon India';
  if (url.includes('flipkart.com')) return 'Flipkart';
  if (url.includes('myntra.com')) return 'Myntra';
  if (url.includes('ajio.com')) return 'Ajio';
  return null;
}

// ─── Common Browser Launch ──────────────────────────────────────────────────
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

// ─── Amazon India Scraper ───────────────────────────────────────────────────
async function scrapeAmazon(url) {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  try {
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-IN,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    });
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);
    const html = await page.content();
    const $ = cheerio.load(html);

    const productName = $('#productTitle').text().trim()
      || $('h1.a-size-large').first().text().trim()
      || 'Product Name Not Found';

    const price = $('.a-price-whole').first().text().trim()
      || $('#priceblock_ourprice').text().trim()
      || $('#priceblock_dealprice').text().trim()
      || 'N/A';

    const originalPrice = $('span.a-text-price .a-offscreen').first().text().trim() || null;

    const seller = $('#sellerProfileTriggerId').text().trim()
      || $('#merchant-info').text().trim()
      || $('a#sellerProfileTriggerId').text().trim()
      || 'Amazon / Unknown Seller';

    const ratingText = $('#acrPopover').attr('title') || $('.a-icon-alt').first().text().trim() || '0';
    const rating = parseFloat(ratingText.match(/[\d.]+/)?.[0] || '0');

    const reviewText = $('#acrCustomerReviewText').text().trim()
      || $('span[data-hook="total-review-count"]').text().trim()
      || '0';
    const reviewCount = parseInt(reviewText.replace(/[^0-9]/g, '') || '0');

    const imageUrl = $('#landingImage').attr('src')
      || $('#imgTagWrapperId img').attr('src')
      || null;

    const warrantyText = $('#warranty_feature_div').text().trim()
      || $('*:contains("warranty")').filter((i, el) => $(el).text().length < 100).first().text().trim()
      || '';

    const returnText = $('#returnPolicyDiv').text().trim()
      || $('*:contains("return")').filter((i, el) => $(el).text().length < 120).first().text().trim()
      || '';

    // Extract top 10 reviews
    const reviews = [];
    $('[data-hook="review-collapsed"] span, [data-hook="review-body"] span').each((i, el) => {
      if (i < 10) reviews.push($(el).text().trim());
    });

    const fulfillment = $('div#merchant-info').text().includes('Amazon')
      || $('div#SSOFpopoverLink').text().includes('Amazon') ? 'FBA' : 'FBM';

    logger.info(`Amazon scraped: ${productName.substring(0, 50)}`);
    return {
      productName: productName.substring(0, 150),
      platform: 'Amazon India',
      price: price ? `₹${price.replace(/[₹,]/g, '')}` : 'N/A',
      originalPrice: originalPrice || null,
      seller: seller.substring(0, 80),
      rating,
      reviewCount,
      imageUrl,
      warrantyText,
      returnText,
      reviews,
      fulfillment,
      url,
    };
  } finally {
    await browser.close();
  }
}

// ─── Flipkart Scraper ───────────────────────────────────────────────────────
async function scrapeFlipkart(url) {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);
    const html = await page.content();
    const $ = cheerio.load(html);

    const productName = $('span.B_NuCI').text().trim()
      || $('h1._9E25nV').text().trim()
      || $('h1').first().text().trim()
      || 'Product Name Not Found';

    const price = $('div._30jeq3._16Jk6d').text().trim()
      || $('div._30jeq3').text().trim()
      || 'N/A';

    const originalPrice = $('div._3I9_wc._2p6lqe').text().trim()
      || $('div._3I9_wc').text().trim()
      || null;

    const seller = $('div._2bSvqm').text().trim()
      || $('a._3fy2R5').text().trim()
      || 'Unknown Seller';

    const ratingText = $('div._3LWZlK').first().text().trim() || '0';
    const rating = parseFloat(ratingText) || 0;

    const reviewText = $('span._2_R_DZ').text().trim() || '0';
    const reviewCount = parseInt(reviewText.replace(/[^0-9]/g, '') || '0');

    const imageUrl = $('img._396cs4._2amPTt').attr('src')
      || $('img._396cs4').attr('src')
      || null;

    const reviews = [];
    $('div.t-ZTKy div').each((i, el) => {
      if (i < 10) {
        const txt = $(el).text().trim();
        if (txt.length > 20) reviews.push(txt);
      }
    });

    logger.info(`Flipkart scraped: ${productName.substring(0, 50)}`);
    return {
      productName: productName.substring(0, 150),
      platform: 'Flipkart',
      price,
      originalPrice,
      seller: seller.substring(0, 80),
      rating,
      reviewCount,
      imageUrl,
      warrantyText: '',
      returnText: '10 day return policy',
      reviews,
      fulfillment: 'Flipkart',
      url,
    };
  } finally {
    await browser.close();
  }
}

// ─── Myntra Scraper ─────────────────────────────────────────────────────────
async function scrapeMyntra(url) {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    const html = await page.content();
    const $ = cheerio.load(html);

    const productName = $('h1.pdp-name').text().trim()
      || $('h1.pdp-title').text().trim()
      || $('h1').first().text().trim()
      || 'Product Name Not Found';

    const price = $('span.pdp-price strong').text().trim()
      || $('span.pdp-mrp strong').text().trim()
      || 'N/A';

    const originalPrice = $('span.pdp-mrp').text().trim() || null;

    const seller = $('a.supplier-info-link').text().trim()
      || $('div.sold-by').text().replace('Sold by', '').trim()
      || 'Myntra Partner';

    const ratingText = $('div.detailed-ratings span').first().text().trim() || '0';
    const rating = parseFloat(ratingText) || 0;

    const reviewText = $('a.detailed-ratings-count').text().trim() || '0';
    const reviewCount = parseInt(reviewText.replace(/[^0-9]/g, '') || '0');

    const imageUrl = $('img.image-grid-imageContainer img').first().attr('src') || null;

    logger.info(`Myntra scraped: ${productName.substring(0, 50)}`);
    return {
      productName: productName.substring(0, 150),
      platform: 'Myntra',
      price,
      originalPrice,
      seller: seller.substring(0, 80),
      rating,
      reviewCount,
      imageUrl,
      warrantyText: '',
      returnText: '30 day return policy',
      reviews: [],
      fulfillment: 'Myntra',
      url,
    };
  } finally {
    await browser.close();
  }
}

// ─── Ajio Scraper ───────────────────────────────────────────────────────────
async function scrapeAjio(url) {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    const html = await page.content();
    const $ = cheerio.load(html);

    const productName = $('h1.prod-name').text().trim()
      || $('div.prod-name').text().trim()
      || $('h1').first().text().trim()
      || 'Product Name Not Found';

    const price = $('div.prod-sp').text().trim()
      || $('strong.prod-sp').text().trim()
      || 'N/A';

    const originalPrice = $('div.prod-cp').text().trim() || null;

    const seller = $('div.seller-info').text().trim()
      || 'Ajio';

    const ratingText = $('div.rating-num').text().trim() || '0';
    const rating = parseFloat(ratingText) || 0;
    const reviewCount = parseInt($('div.rating-count').text().replace(/[^0-9]/g, '') || '0');

    const imageUrl = $('img.rilrtl-lazy-img').first().attr('src') || null;

    logger.info(`Ajio scraped: ${productName.substring(0, 50)}`);
    return {
      productName: productName.substring(0, 150),
      platform: 'Ajio',
      price,
      originalPrice,
      seller: seller.substring(0, 80),
      rating,
      reviewCount,
      imageUrl,
      warrantyText: '',
      returnText: '15 day return policy',
      reviews: [],
      fulfillment: 'Ajio',
      url,
    };
  } finally {
    await browser.close();
  }
}

// ─── Main Scrape Function ───────────────────────────────────────────────────
async function scrapeProduct(url) {
  const platform = detectPlatform(url);
  if (!platform) throw new Error('Unsupported platform. Use Amazon India, Flipkart, Myntra, or Ajio links.');

  logger.info(`Scraping ${platform}: ${url}`);
  switch (platform) {
    case 'Amazon India': return scrapeAmazon(url);
    case 'Flipkart':     return scrapeFlipkart(url);
    case 'Myntra':       return scrapeMyntra(url);
    case 'Ajio':         return scrapeAjio(url);
    default: throw new Error('Unsupported platform');
  }
}

module.exports = { scrapeProduct, detectPlatform };
