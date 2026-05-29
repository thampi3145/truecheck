// ─── Built-in platform registry by category ──────────────────────────────────
// Each category has its own platforms
// When user searches "hotels in Goa" → only hotel platforms are searched
// When user searches "Nike shoes" → only ecommerce platforms are searched

const BUILT_IN_PLATFORMS = {
  products: [
    {
      id: 'amazon',
      name: 'Amazon India',
      domain: 'amazon.in',
      color: '#FF9900',
      searchUrl: 'https://www.amazon.in/s?k={q}',
      buyUrl: 'https://www.amazon.in/s?k={q}',
      scraper: 'amazon',
      enabled: true,
      builtIn: true,
    },
    {
      id: 'flipkart',
      name: 'Flipkart',
      domain: 'flipkart.com',
      color: '#2874F0',
      searchUrl: 'https://www.flipkart.com/search?q={q}&otracker=search',
      buyUrl: 'https://www.flipkart.com/search?q={q}',
      scraper: 'flipkart',
      enabled: true,
      builtIn: true,
    },
    {
      id: 'myntra',
      name: 'Myntra',
      domain: 'myntra.com',
      color: '#FF3E6C',
      searchUrl: 'https://www.myntra.com/search?rawQuery={q}',
      buyUrl: 'https://www.myntra.com/search?rawQuery={q}',
      scraper: 'myntra',
      enabled: true,
      builtIn: true,
    },
    {
      id: 'ajio',
      name: 'Ajio',
      domain: 'ajio.com',
      color: '#00B5AD',
      searchUrl: 'https://www.ajio.com/search/?text={q}',
      buyUrl: 'https://www.ajio.com/search/?text={q}',
      scraper: 'ajio',
      enabled: true,
      builtIn: true,
    },
    {
      id: 'meesho',
      name: 'Meesho',
      domain: 'meesho.com',
      color: '#F43397',
      searchUrl: 'https://www.meesho.com/search?q={q}',
      buyUrl: 'https://www.meesho.com/search?q={q}',
      scraper: 'generic',
      enabled: true,
      builtIn: true,
    },
  ],

  hotels: [
    {
      id: 'makemytrip_hotels',
      name: 'MakeMyTrip',
      domain: 'makemytrip.com',
      color: '#E91E63',
      searchUrl: 'https://www.makemytrip.com/hotels/hotel-listing/?checkin=&checkout=&city={q}',
      buyUrl: 'https://www.makemytrip.com/hotels/',
      scraper: 'generic',
      enabled: true,
      builtIn: true,
    },
    {
      id: 'goibibo_hotels',
      name: 'Goibibo',
      domain: 'goibibo.com',
      color: '#E53935',
      searchUrl: 'https://www.goibibo.com/hotels/hotels-in-{q}/',
      buyUrl: 'https://www.goibibo.com/hotels/',
      scraper: 'generic',
      enabled: true,
      builtIn: true,
    },
    {
      id: 'oyo',
      name: 'OYO Rooms',
      domain: 'oyorooms.com',
      color: '#EF4136',
      searchUrl: 'https://www.oyorooms.com/search/?location={q}',
      buyUrl: 'https://www.oyorooms.com/',
      scraper: 'generic',
      enabled: true,
      builtIn: true,
    },
    {
      id: 'booking',
      name: 'Booking.com',
      domain: 'booking.com',
      color: '#003580',
      searchUrl: 'https://www.booking.com/search.html?ss={q}',
      buyUrl: 'https://www.booking.com/',
      scraper: 'generic',
      enabled: true,
      builtIn: true,
    },
  ],

  flights: [
    {
      id: 'makemytrip_flights',
      name: 'MakeMyTrip',
      domain: 'makemytrip.com',
      color: '#E91E63',
      searchUrl: 'https://www.makemytrip.com/flights/',
      buyUrl: 'https://www.makemytrip.com/flights/',
      scraper: 'generic',
      enabled: true,
      builtIn: true,
    },
    {
      id: 'cleartrip',
      name: 'Cleartrip',
      domain: 'cleartrip.com',
      color: '#F77F00',
      searchUrl: 'https://www.cleartrip.com/flights/',
      buyUrl: 'https://www.cleartrip.com/flights/',
      scraper: 'generic',
      enabled: true,
      builtIn: true,
    },
    {
      id: 'ixigo',
      name: 'Ixigo',
      domain: 'ixigo.com',
      color: '#FF5722',
      searchUrl: 'https://www.ixigo.com/search/result/flight?from={q}',
      buyUrl: 'https://www.ixigo.com/',
      scraper: 'generic',
      enabled: true,
      builtIn: true,
    },
    {
      id: 'easemytrip',
      name: 'EaseMyTrip',
      domain: 'easemytrip.com',
      color: '#00BCD4',
      searchUrl: 'https://www.easemytrip.com/flights/',
      buyUrl: 'https://www.easemytrip.com/',
      scraper: 'generic',
      enabled: true,
      builtIn: true,
    },
  ],

  food: [
    {
      id: 'swiggy',
      name: 'Swiggy',
      domain: 'swiggy.com',
      color: '#FC8019',
      searchUrl: 'https://www.swiggy.com/search?query={q}',
      buyUrl: 'https://www.swiggy.com/',
      scraper: 'generic',
      enabled: true,
      builtIn: true,
    },
    {
      id: 'zomato',
      name: 'Zomato',
      domain: 'zomato.com',
      color: '#CB202D',
      searchUrl: 'https://www.zomato.com/search?q={q}',
      buyUrl: 'https://www.zomato.com/',
      scraper: 'generic',
      enabled: true,
      builtIn: true,
    },
    {
      id: 'blinkit',
      name: 'Blinkit',
      domain: 'blinkit.com',
      color: '#F8CC1B',
      searchUrl: 'https://blinkit.com/s/?q={q}',
      buyUrl: 'https://blinkit.com/',
      scraper: 'generic',
      enabled: true,
      builtIn: true,
    },
  ],

  jobs: [
    {
      id: 'naukri',
      name: 'Naukri',
      domain: 'naukri.com',
      color: '#2557A7',
      searchUrl: 'https://www.naukri.com/{q}-jobs',
      buyUrl: 'https://www.naukri.com/',
      scraper: 'generic',
      enabled: true,
      builtIn: true,
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      domain: 'linkedin.com',
      color: '#0A66C2',
      searchUrl: 'https://www.linkedin.com/jobs/search/?keywords={q}',
      buyUrl: 'https://www.linkedin.com/jobs/',
      scraper: 'generic',
      enabled: true,
      builtIn: true,
    },
    {
      id: 'indeed',
      name: 'Indeed',
      domain: 'in.indeed.com',
      color: '#003A9B',
      searchUrl: 'https://in.indeed.com/jobs?q={q}',
      buyUrl: 'https://in.indeed.com/',
      scraper: 'generic',
      enabled: true,
      builtIn: true,
    },
  ],
};

// Custom platforms added by users at runtime
let customPlatforms = [];

// ─── Get platforms for a category ────────────────────────────────────────────
function getPlatformsForCategory(category) {
  const builtIn = BUILT_IN_PLATFORMS[category] || BUILT_IN_PLATFORMS.products;
  const custom = customPlatforms.filter(p => p.category === category && p.enabled);
  return [...builtIn.filter(p => p.enabled), ...custom];
}

// ─── Add custom platform ──────────────────────────────────────────────────────
function addCustomPlatform(platform) {
  const existing = customPlatforms.findIndex(p => p.id === platform.id);
  if (existing >= 0) {
    customPlatforms[existing] = platform;
  } else {
    customPlatforms.push(platform);
  }
  return platform;
}

// ─── Toggle platform ──────────────────────────────────────────────────────────
function togglePlatform(id, enabled) {
  // Check built-in
  for (const cat of Object.values(BUILT_IN_PLATFORMS)) {
    const p = cat.find(p => p.id === id);
    if (p) { p.enabled = enabled; return p; }
  }
  // Check custom
  const custom = customPlatforms.find(p => p.id === id);
  if (custom) { custom.enabled = enabled; return custom; }
  return null;
}

// ─── Get all platforms ────────────────────────────────────────────────────────
function getAllPlatforms() {
  const all = {};
  for (const [cat, platforms] of Object.entries(BUILT_IN_PLATFORMS)) {
    all[cat] = [...platforms, ...customPlatforms.filter(p => p.category === cat)];
  }
  return all;
}

module.exports = {
  BUILT_IN_PLATFORMS,
  getPlatformsForCategory,
  addCustomPlatform,
  togglePlatform,
  getAllPlatforms,
  get customPlatforms() { return customPlatforms; },
};
