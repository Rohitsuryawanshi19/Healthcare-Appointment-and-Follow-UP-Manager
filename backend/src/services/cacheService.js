const Redis = require('ioredis');
const logger = require('../config/logger');

let redisClient = null;
let isConnected = false;

/**
 * Initializes and returns a lazy-connected Redis client instance
 * Returns null if REDIS_URL is not set or in test mode
 */
function getRedisClient() {
  if (process.env.NODE_ENV === 'test') return null;
  if (redisClient) return isConnected ? redisClient : null;

  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    return null;
  }

  try {
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      connectTimeout: 2000,
      lazyConnect: true,
      enableOfflineQueue: false,
      retryStrategy: (times) => {
        if (times > 3) return null; // stop retrying quickly
        return Math.min(times * 100, 1000);
      },
    });

    redisClient.on('connect', () => {
      isConnected = true;
      logger.info('Redis cache connection established');
    });

    redisClient.on('error', (err) => {
      isConnected = false;
      logger.warn({ err: err.message }, 'Redis error, falling back to database query');
    });

    redisClient.on('close', () => {
      isConnected = false;
    });

    redisClient.connect().catch((err) => {
      isConnected = false;
      logger.warn({ err: err.message }, 'Redis initial connection failed, bypassing cache');
    });

    return redisClient;
  } catch (err) {
    logger.warn({ err: err.message }, 'Failed to instantiate Redis client');
    return null;
  }
}

/**
 * Retrieves cached JSON payload by key
 */
async function getCache(key) {
  const client = getRedisClient();
  if (!client || !isConnected) return null;
  try {
    const raw = await client.get(key);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    logger.debug({ key, err: err.message }, 'Redis get error');
    return null;
  }
}

/**
 * Caches JSON payload with TTL in seconds (default 60s)
 */
async function setCache(key, data, ttlSeconds = 60) {
  const client = getRedisClient();
  if (!client || !isConnected) return;
  try {
    await client.set(key, JSON.stringify(data), 'EX', ttlSeconds);
  } catch (err) {
    logger.debug({ key, err: err.message }, 'Redis set error');
  }
}

/**
 * Invalidates all cache keys matching a pattern (e.g. 'cache:doctors:*')
 */
async function invalidateCachePattern(pattern) {
  const client = getRedisClient();
  if (!client || !isConnected) return;
  try {
    const keys = await client.keys(pattern);
    if (keys && keys.length > 0) {
      await client.del(...keys);
      logger.debug({ pattern, count: keys.length }, 'Invalidated cache keys');
    }
  } catch (err) {
    logger.debug({ pattern, err: err.message }, 'Redis cache invalidation error');
  }
}

module.exports = {
  getRedisClient,
  getCache,
  setCache,
  invalidateCachePattern,
};
