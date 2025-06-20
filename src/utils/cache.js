// src/utils/cache.js

const CACHE_DURATION_MS = 30 * 60 * 1000; // 30 minutes
const cache = new Map();

/**
 * Stores data in the cache with a timestamp.
 * @param {string} key - The cache key.
 * @param {any} data - The data to store.
 */
export const setCache = (key, data) => {
  const timestamp = Date.now();
  cache.set(key, { data, timestamp });
  console.log(`[Cache] Set data for key: ${key}`);
};

/**
 * Retrieves data from the cache if it exists and is not older than CACHE_DURATION_MS.
 * @param {string} key - The cache key.
 * @returns {any|null} The cached data or null if not found or expired.
 */
export const getCache = (key) => {
  const cachedItem = cache.get(key);

  if (!cachedItem) {
    console.log(`[Cache] Miss for key: ${key}`);
    return null;
  }

  const isExpired = (Date.now() - cachedItem.timestamp) > CACHE_DURATION_MS;

  if (isExpired) {
    console.log(`[Cache] Expired data for key: ${key}`);
    cache.delete(key); // Remove expired item
    return null;
  }

  console.log(`[Cache] Hit for key: ${key}`);
  return cachedItem.data;
};

/**
 * Clears the entire cache.
 */
export const clearCache = () => {
  cache.clear();
  console.log('[Cache] Cleared all cache entries.');
};

/**
 * Deletes a specific entry from the cache.
 * @param {string} key - The cache key to delete.
 */
export const deleteCacheEntry = (key) => {
  if (cache.has(key)) {
    cache.delete(key);
    console.log(`[Cache] Deleted entry for key: ${key}`);
  } else {
    console.log(`[Cache] No entry found to delete for key: ${key}`);
  }
};
