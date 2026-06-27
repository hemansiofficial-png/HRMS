import { createClient, RedisClientType } from 'redis';

/**
 * Redis caching utility for API responses and expensive operations
 * Provides significant performance improvements for frequently accessed data
 */

type RedisClient = RedisClientType | null;

let client: RedisClient = null;
let isConnected = false;

/**
 * Initialize Redis connection
 * Call this once at application startup
 */
export async function initRedis(): Promise<RedisClient> {
  if (client) return client;

  try {
    const redisUrl = process.env.REDIS_URL;
    
    if (!redisUrl) {
      console.log('🔴 Redis not configured. Caching disabled.');
      return null;
    }

    client = createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 5) {
            console.error('🔴 Redis max retries reached. Using fallback.');
            return new Error('Max retries reached');
          }
          return Math.min(retries * 100, 3000);
        },
      },
    });

    client.on('error', (err) => {
      console.error('🔴 Redis Client Error:', err.message);
      isConnected = false;
    });

    client.on('connect', () => {
      console.log('🟢 Redis connected');
      isConnected = true;
    });

    await client.connect();
    return client;
  } catch (error) {
    console.error('🔴 Redis connection failed:', error);
    return null;
  }
}

/**
 * Get value from cache
 * 
 * @param key - Cache key
 * @returns Cached value or null
 * 
 * @example
 * const data = await cache.get('employees:all');
 * if (data) {
 *   return JSON.parse(data);
 * }
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  if (!client || !isConnected) return null;

  try {
    const value = await client.get(key);
    if (!value) return null;
    return JSON.parse(value);
  } catch (error) {
    console.error('Cache get error:', error);
    return null;
  }
}

/**
 * Set value in cache with optional TTL
 * 
 * @param key - Cache key
 * @param value - Value to cache
 * @param ttl - Time to live in seconds (default: 300 = 5 minutes)
 * 
 * @example
 * await cache.set('employees:all', employees, 600); // 10 minutes
 */
export async function cacheSet<T>(
  key: string,
  value: T,
  ttl: number = 300
): Promise<void> {
  if (!client || !isConnected) return;

  try {
    await client.setEx(key, ttl, JSON.stringify(value));
  } catch (error) {
    console.error('Cache set error:', error);
  }
}

/**
 * Delete value from cache
 * 
 * @param key - Cache key or pattern
 * 
 * @example
 * await cache.delete('employees:all');
 * await cache.delete('employees:*'); // Delete all employee keys
 */
export async function cacheDelete(key: string): Promise<void> {
  if (!client || !isConnected) return;

  try {
    const keys = await client.keys(key);
    if (keys.length > 0) {
      await client.del(keys);
    }
  } catch (error) {
    console.error('Cache delete error:', error);
  }
}

/**
 * Cache wrapper for async functions
 * Automatically caches results and handles cache invalidation
 * 
 * @param key - Cache key
 * @param fn - Function to cache
 * @param ttl - Time to live in seconds
 * @returns Cached or fresh result
 * 
 * @example
 * const getEmployees = cacheFn(
 *   'employees:all',
 *   async () => await db.employee.findMany(),
 *   300
 * );
 */
export async function cacheFn<T>(
  key: string,
  fn: () => Promise<T>,
  ttl: number = 300
): Promise<T> {
  // Try cache first
  const cached = await cacheGet<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Cache miss - fetch fresh data
  const result = await fn();
  
  // Store in cache
  await cacheSet(key, result, ttl);
  
  return result;
}

/**
 * Multi-key cache operation
 * Get multiple values in a single operation
 * 
 * @param keys - Array of cache keys
 * @returns Array of cached values
 */
export async function cacheGetMany<T>(keys: string[]): Promise<(T | null)[]> {
  if (!client || !isConnected) return keys.map(() => null);

  try {
    const values = await client.mGet(keys);
    return values.map((value) => {
      if (!value) return null;
      return JSON.parse(value);
    });
  } catch (error) {
    console.error('Cache getMany error:', error);
    return keys.map(() => null);
  }
}

/**
 * Increment a counter in cache
 * Useful for rate limiting and analytics
 * 
 * @param key - Cache key
 * @param ttl - TTL for the key (if it doesn't exist)
 * @returns New counter value
 */
export async function cacheIncrement(key: string, ttl?: number): Promise<number> {
  if (!client || !isConnected) return 0;

  try {
    const value = await client.incr(key);
    if (ttl) {
      await client.expire(key, ttl);
    }
    return value;
  } catch (error) {
    console.error('Cache increment error:', error);
    return 0;
  }
}

/**
 * Check if Redis is connected and healthy
 */
export async function checkRedisHealth(): Promise<boolean> {
  if (!client || !isConnected) return false;

  try {
    await client.ping();
    return true;
  } catch {
    return false;
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  connected: boolean;
  keysCount?: number;
  usedMemory?: string;
} | null> {
  if (!client || !isConnected) {
    return { connected: false };
  }

  try {
    const dbSize = await client.dbSize();
    const info = await client.info('memory');
    
    // Parse memory info (simplified)
    const usedMemory = info
      .split('\n')
      .find(line => line.includes('used_memory_human'))
      ?.split(':')[1]
      ?.trim() || 'N/A';

    return {
      connected: true,
      keysCount: dbSize,
      usedMemory,
    };
  } catch (error) {
    console.error('Cache stats error:', error);
    return { connected: false };
  }
}

export default {
  init: initRedis,
  get: cacheGet,
  set: cacheSet,
  delete: cacheDelete,
  fn: cacheFn,
  getMany: cacheGetMany,
  increment: cacheIncrement,
  checkHealth: checkRedisHealth,
  getStats: getCacheStats,
};
