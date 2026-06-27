/**
 * Rate Limiting Utility
 * Prevents API abuse and DDoS attacks
 * Works without Redis (in-memory storage)
 */

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number; // Time window in milliseconds
}

interface RateLimitData {
  count: number;
  resetTime: number;
}

// In-memory storage (use Redis in production for multi-server setups)
const rateLimitStore = new Map<string, RateLimitData>();

// Default configurations
export const RATE_LIMITS = {
  // Strict limits for authentication
  AUTH: {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
  // Moderate limits for API writes
  API_WRITE: {
    maxRequests: 100,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
  // Loose limits for API reads
  API_READ: {
    maxRequests: 1000,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
  // File upload limits
  UPLOAD: {
    maxRequests: 20,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
};

/**
 * Clean up expired entries
 * Run every 5 minutes
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of rateLimitStore.entries()) {
    if (data.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Check if request is rate limited
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
} {
  const now = Date.now();
  const data = rateLimitStore.get(identifier);

  // First request or expired
  if (!data || data.resetTime < now) {
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + config.windowMs,
    });

    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: now + config.windowMs,
    };
  }

  // Within limit
  if (data.count < config.maxRequests) {
    data.count++;
    rateLimitStore.set(identifier, data);

    return {
      allowed: true,
      remaining: config.maxRequests - data.count,
      resetTime: data.resetTime,
    };
  }

  // Rate limit exceeded
  return {
    allowed: false,
    remaining: 0,
    resetTime: data.resetTime,
    retryAfter: Math.ceil((data.resetTime - now) / 1000),
  };
}

/**
 * Get rate limit headers
 */
export function getRateLimitHeaders(
  remaining: number,
  resetTime: number,
  maxRequests: number
): Record<string, string> {
  return {
    'X-RateLimit-Limit': maxRequests.toString(),
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': Math.floor(resetTime / 1000).toString(),
  };
}

/**
 * Create rate limit middleware for Next.js API routes
 */
export function createRateLimiter(config: RateLimitConfig) {
  return async function rateLimitMiddleware(
    request: Request,
    identifier?: string
  ): Promise<{
    success: boolean;
    headers?: Record<string, string>;
    retryAfter?: number;
  }> {
    // Get identifier (IP address or custom)
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      'unknown';

    const key = identifier || `ip:${ip}`;

    const result = checkRateLimit(key, config);

    if (!result.allowed) {
      return {
        success: false,
        retryAfter: result.retryAfter,
      };
    }

    return {
      success: true,
      headers: getRateLimitHeaders(
        result.remaining,
        result.resetTime,
        config.maxRequests
      ),
    };
  };
}

/**
 * Pre-configured rate limiters for common use cases
 */
export const rateLimiters = {
  auth: createRateLimiter(RATE_LIMITS.AUTH),
  apiWrite: createRateLimiter(RATE_LIMITS.API_WRITE),
  apiRead: createRateLimiter(RATE_LIMITS.API_READ),
  upload: createRateLimiter(RATE_LIMITS.UPLOAD),
};
