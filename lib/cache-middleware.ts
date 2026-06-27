import { NextRequest, NextResponse } from 'next/server';
import { cacheGet, cacheSet } from '@/lib/redis';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds (default 600)
  key?: string; // Custom cache key
}

/**
 * Wraps an API route handler with caching
 * @param handler The API route handler function
 * @param options Cache options (ttl, custom key)
 * @returns Cached response or fresh response
 */
export function withCache(handler: Function, options: CacheOptions = {}) {
  const { ttl = 600 } = options;

  return async (req: NextRequest, context?: any) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return handler(req, context);
    }

    // Generate cache key
    const cacheKey = options.key || `api:${req.nextUrl.pathname}${req.nextUrl.search}`;

    // Try to get from cache
    const cached = await cacheGet(cacheKey);
    if (cached) {
      return NextResponse.json(cached, {
        headers: {
          'X-Cache': 'HIT',
          'Cache-Control': `public, max-age=${ttl}`
        }
      });
    }

    // Call the handler
    const response = await handler(req, context);

    // Cache successful responses
    if (response.status === 200 && response.headers.get('content-type')?.includes('application/json')) {
      try {
        const data = await response.clone().json();
        await cacheSet(cacheKey, data, ttl);
      } catch (error) {
        console.error('Failed to cache response:', error);
      }
    }

    // Add cache headers
    response.headers.set('X-Cache', 'MISS');
    response.headers.set('Cache-Control', `public, max-age=${ttl}`);

    return response;
  };
}

/**
 * Response cache middleware for API routes
 * Usage: export const GET = withResponseCache(handler, { ttl: 300 });
 */
export function withResponseCache(handler: Function, options: CacheOptions = {}) {
  return withCache(handler, options);
}
