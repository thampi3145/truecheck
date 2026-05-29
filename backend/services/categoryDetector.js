const { callGemini } = require('./gemini');
const logger = require('../utils/logger');

// Keywords for fast local detection (no API call needed)
const KEYWORDS = {
  hotels: ['hotel', 'hotels', 'stay', 'resort', 'hostel', 'oyo', 'accommodation', 'room', 'lodge', 'inn', 'booking'],
  flights: ['flight', 'flights', 'air ticket', 'airline', 'fly', 'plane', 'airways', 'airport', 'travel to', 'from to'],
  food: ['food', 'restaurant', 'biryani', 'pizza', 'burger', 'swiggy', 'zomato', 'delivery', 'eat', 'meal', 'lunch', 'dinner', 'breakfast', 'cafe', 'dine'],
  jobs: ['job', 'jobs', 'career', 'hiring', 'vacancy', 'work', 'employment', 'fresher', 'developer', 'engineer', 'salary', 'naukri'],
  products: ['buy', 'price', 'cheap', 'deal', 'offer', 'discount', 'product', 'shop', 'order', 'purchase'],
};

// ─── Fast keyword detection ───────────────────────────────────────────────────
function detectCategoryByKeywords(query) {
  const lower = query.toLowerCase();
  
  for (const [category, keywords] of Object.entries(KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) {
      return category;
    }
  }
  return null; // unknown — will use Gemini
}

// ─── AI category detection ────────────────────────────────────────────────────
async function detectCategory(query) {
  // Try fast local detection first (no API call)
  const local = detectCategoryByKeywords(query);
  if (local) {
    logger.info(`Category detected locally: ${local} for "${query}"`);
    return local;
  }

  // Fall back to Gemini for ambiguous queries
  try {
    const prompt = `Classify this search query into exactly ONE category.
Query: "${query}"

Categories:
- products (physical goods: shoes, phone, clothes, electronics, toys, books)
- hotels (accommodation: hotel, resort, homestay, oyo, stay)
- flights (air travel: flight, ticket, airline, travel from-to)
- food (food delivery: biryani, pizza, restaurant, swiggy, zomato)
- jobs (employment: developer job, hiring, career, vacancy)
- general (anything else)

Reply with ONLY the category name. Nothing else. No explanation.`;

    const result = await callGemini(prompt);
    const category = result.trim().toLowerCase().replace(/[^a-z]/g, '');
    
    const valid = ['products', 'hotels', 'flights', 'food', 'jobs', 'general'];
    const detected = valid.includes(category) ? category : 'products';
    
    logger.info(`Category detected by AI: ${detected} for "${query}"`);
    return detected;
    
  } catch (err) {
    logger.error(`Category detection failed: ${err.message}`);
    return 'products'; // default fallback
  }
}

// ─── Get category display info ────────────────────────────────────────────────
function getCategoryInfo(category) {
  const info = {
    products: { name: 'Products', icon: 'shopping-cart', color: '#FF9900', hint: 'Searching ecommerce platforms' },
    hotels: { name: 'Hotels', icon: 'building', color: '#E91E63', hint: 'Searching hotel booking sites' },
    flights: { name: 'Flights', icon: 'plane', color: '#1976D2', hint: 'Searching flight booking sites' },
    food: { name: 'Food', icon: 'tools-kitchen-2', color: '#FC8019', hint: 'Searching food delivery apps' },
    jobs: { name: 'Jobs', icon: 'briefcase', color: '#0A66C2', hint: 'Searching job portals' },
    general: { name: 'General', icon: 'search', color: '#888780', hint: 'General web search' },
  };
  return info[category] || info.general;
}

module.exports = { detectCategory, getCategoryInfo, detectCategoryByKeywords };
