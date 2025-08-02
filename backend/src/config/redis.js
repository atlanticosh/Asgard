const redis = require('redis');
const logger = require('../utils/logger');

let client = null;

// Redis configuration
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD,
  database: 0,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  retryDelayTime: 200,
  connectTimeout: 60000,
  commandTimeout: 5000,
};

// Connect to Redis
async function connectRedis() {
  try {
    if (client) {
      logger.warn('Redis client already exists');
      return client;
    }

    // Use REDIS_URL if provided (common in production)
    if (process.env.REDIS_URL) {
      client = redis.createClient({
        url: process.env.REDIS_URL,
      });
    } else {
      client = redis.createClient(redisConfig);
    }

    // Error handling
    client.on('error', (err) => {
      logger.error('Redis Client Error:', err);
    });

    client.on('connect', () => {
      logger.info('Redis client connected');
    });

    client.on('ready', () => {
      logger.info('Redis client ready');
    });

    client.on('end', () => {
      logger.info('Redis client disconnected');
    });

    // Connect to Redis
    await client.connect();

    // Test the connection
    await client.ping();
    logger.info('Redis connection established successfully');

    return client;
  } catch (error) {
    logger.error('Failed to connect to Redis:', error);
    throw error;
  }
}

// Get Redis client
function getRedisClient() {
  if (!client) {
    throw new Error('Redis not connected. Call connectRedis() first.');
  }
  return client;
}

// Cache helper functions
class CacheService {
  static async get(key) {
    try {
      const client = getRedisClient();
      const value = await client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Cache GET error:', { key, error: error.message });
      return null;
    }
  }

  static async set(key, value, ttlSeconds = 3600) {
    try {
      const client = getRedisClient();
      await client.setEx(key, ttlSeconds, JSON.stringify(value));
      return true;
    } catch (error) {
      logger.error('Cache SET error:', { key, error: error.message });
      return false;
    }
  }

  static async del(key) {
    try {
      const client = getRedisClient();
      await client.del(key);
      return true;
    } catch (error) {
      logger.error('Cache DEL error:', { key, error: error.message });
      return false;
    }
  }

  static async exists(key) {
    try {
      const client = getRedisClient();
      const exists = await client.exists(key);
      return exists === 1;
    } catch (error) {
      logger.error('Cache EXISTS error:', { key, error: error.message });
      return false;
    }
  }

  static async keys(pattern) {
    try {
      const client = getRedisClient();
      return await client.keys(pattern);
    } catch (error) {
      logger.error('Cache KEYS error:', { pattern, error: error.message });
      return [];
    }
  }

  static async incr(key, ttlSeconds = 3600) {
    try {
      const client = getRedisClient();
      const value = await client.incr(key);
      if (value === 1) {
        await client.expire(key, ttlSeconds);
      }
      return value;
    } catch (error) {
      logger.error('Cache INCR error:', { key, error: error.message });
      return 0;
    }
  }

  static async hGet(key, field) {
    try {
      const client = getRedisClient();
      const value = await client.hGet(key, field);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Cache HGET error:', { key, field, error: error.message });
      return null;
    }
  }

  static async hSet(key, field, value, ttlSeconds = 3600) {
    try {
      const client = getRedisClient();
      await client.hSet(key, field, JSON.stringify(value));
      await client.expire(key, ttlSeconds);
      return true;
    } catch (error) {
      logger.error('Cache HSET error:', { key, field, error: error.message });
      return false;
    }
  }

  static async hGetAll(key) {
    try {
      const client = getRedisClient();
      const hash = await client.hGetAll(key);
      const result = {};
      for (const [field, value] of Object.entries(hash)) {
        try {
          result[field] = JSON.parse(value);
        } catch {
          result[field] = value;
        }
      }
      return result;
    } catch (error) {
      logger.error('Cache HGETALL error:', { key, error: error.message });
      return {};
    }
  }

  // Real-time features
  static async publish(channel, message) {
    try {
      const client = getRedisClient();
      await client.publish(channel, JSON.stringify(message));
      return true;
    } catch (error) {
      logger.error('Redis PUBLISH error:', { channel, error: error.message });
      return false;
    }
  }

  static async subscribe(channel, callback) {
    try {
      const subscriber = client.duplicate();
      await subscriber.connect();

      await subscriber.subscribe(channel, (message) => {
        try {
          const parsed = JSON.parse(message);
          callback(parsed);
        } catch (error) {
          logger.error('Error parsing subscribed message:', error);
          callback(message);
        }
      });

      logger.info(`Subscribed to Redis channel: ${channel}`);
      return subscriber;
    } catch (error) {
      logger.error('Redis SUBSCRIBE error:', { channel, error: error.message });
      throw error;
    }
  }
}

// Specialized cache keys
const CacheKeys = {
  // User related
  user: (userId) => `user:${userId}`,
  userStats: (userId) => `user:${userId}:stats`,
  userAchievements: (userId) => `user:${userId}:achievements`,

  // Swap related
  swap: (swapId) => `swap:${swapId}`,
  swapStatus: (hashlock) => `swap:status:${hashlock}`,
  pendingSwaps: (userId) => `user:${userId}:pending_swaps`,

  // 1inch related
  oneInchQuote: (tokenIn, tokenOut, amount) =>
    `1inch:quote:${tokenIn}:${tokenOut}:${amount}`,
  oneInchTokens: () => '1inch:tokens',

  // Analytics
  dailyStats: (date) => `stats:daily:${date}`,
  volumeStats: () => 'stats:volume',
  arbitrageOpportunities: () => 'arbitrage:opportunities',

  // Game related
  leaderboard: () => 'game:leaderboard',
  achievements: () => 'game:achievements',

  // Rate limiting
  rateLimit: (ip, endpoint) => `rate_limit:${ip}:${endpoint}`,

  // Blockchain data
  ethGasPrice: () => 'eth:gas_price',
  stellarLedger: () => 'stellar:latest_ledger',
  tokenPrices: () => 'prices:tokens',

  // WebSocket connections
  activeConnections: () => 'websocket:active_connections',
  userConnection: (userId) => `websocket:user:${userId}`,
};

// Close Redis connection
async function closeRedis() {
  if (client) {
    await client.quit();
    client = null;
    logger.info('Redis connection closed');
  }
}

module.exports = {
  connectRedis,
  getRedisClient,
  closeRedis,
  CacheService,
  CacheKeys,
};
