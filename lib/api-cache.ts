import { unstable_cache } from 'next/cache';
import { cache } from 'react';

/**
 * API caching utilities for server-side data fetching
 * Reduces database queries and improves response times
 */

interface CacheOptions {
  revalidate?: number | false;
  tags?: string[];
}

/**
 * Cache an API response with automatic revalidation
 * 
 * @param fn - Function to cache
 * @param key - Unique cache key
 * @param options - Cache options
 * @returns Cached function
 * 
 * @example
 * // Cache for 5 minutes
 * const getCachedData = withCache(
 *   async (id) => await db.data.findUnique({ where: { id } }),
 *   'data-by-id',
 *   { revalidate: 300 }
 * );
 * 
 * @example
 * // Cache with tags for on-demand revalidation
 * const getCachedEmployees = withCache(
 *   async () => await db.employee.findMany(),
 *   'all-employees',
 *   { tags: ['employees'] }
 * );
 * 
 * // Later, revalidate: revalidateTag('employees');
 */
export function withCache<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  key: string,
  options: CacheOptions = {}
) {
  const { revalidate = 300, tags = [] } = options;

  return cache(unstable_cache(
    async (...args: Parameters<T>): Promise<ReturnType<T>> => {
      const result = await fn(...args);
      return result;
    },
    [key],
    {
      revalidate,
      tags,
    }
  ));
}

/**
 * Simple in-memory cache for frequently accessed data
 * Uses React's cache() for request memoization
 * 
 * @param fn - Function to memoize
 * @returns Memoized function
 * 
 * @example
 * const getCachedConfig = withRequestCache(
 *   async () => await db.configuration.findFirst()
 * );
 */
export function withRequestCache<T extends (...args: any[]) => Promise<any>>(fn: T) {
  return cache(fn);
}

/**
 * Fetch with automatic caching and revalidation
 * 
 * @param url - URL to fetch
 * @param options - Fetch options
 * @returns Fetch response
 */
export async function cachedFetch(url: string, options?: RequestInit) {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    // Enable caching
    cache: 'force-cache',
    next: {
      // Revalidate every 5 minutes
      revalidate: 300,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

/**
 * Optimistic update helper
 * Updates UI immediately while syncing with server in background
 * 
 * @param currentData - Current data to update
 * @param updateFn - Function to apply updates
 * @param syncFn - Async function to sync with server
 */
export async function optimisticUpdate<T>(
  currentData: T,
  updateFn: (data: T) => T,
  syncFn: (data: T) => Promise<void>
) {
  const updatedData = updateFn(currentData);
  
  try {
    await syncFn(updatedData);
  } catch (error) {
    // Handle error (show toast, rollback, etc.)
    console.error('Optimistic update failed:', error);
    throw error;
  }
}

/**
 * Debounce function for search inputs and rapid API calls
 * 
 * @param fn - Function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
) {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Throttle function for rate-limiting API calls
 * 
 * @param fn - Function to throttle
 * @param limit - Time limit in milliseconds
 * @returns Throttled function
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number
) {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}
