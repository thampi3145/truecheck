const NodeCache = require('node-cache');

// Cache analysis results so same product URL isn't re-fetched repeatedly
// TTL = 1 hour by default (saves API calls)
const cache = new NodeCache({
  stdTTL: parseInt(process.env.CACHE_TTL || '3600'),
  checkperiod: 600,
  useClones: false,
});

function getCached(key) {
  return cache.get(key);
}

function setCache(key, value) {
  cache.set(key, value);
}

function clearCache(key) {
  if (key) cache.del(key);
  else cache.flushAll();
}

module.exports = { getCached, setCache, clearCache };
