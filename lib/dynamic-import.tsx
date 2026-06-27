import dynamic from 'next/dynamic';
import React from 'react';

/**
 * Dynamic import helper for lazy loading components
 * Improves initial page load by code-splitting heavy components
 */

interface DynamicOptions {
  ssr?: boolean;
  loading?: React.ReactNode;
}

/**
 * Create a dynamically imported component with optional SSR and loading state
 * 
 * @param importFn - Function that returns a dynamic import
 * @param options - Configuration options
 * @returns Dynamically imported component
 * 
 * @example
 * // Basic usage
 * const Chart = dynamic(() => import('@/components/charts/overview-chart'));
 * 
 * @example
 * // With loading state
 * const Chart = dynamic(
 *   () => import('@/components/charts/overview-chart'),
 *   { loading: () => <div>Loading chart...</div> }
 * );
 * 
 * @example
 * // Disable SSR for client-only components
 * const HeavyComponent = dynamic(
 *   () => import('@/components/heavy'),
 *   { ssr: false }
 * );
 */
export function createDynamicComponent<T>(
  importFn: () => Promise<{ default: React.ComponentType<T> }>,
  options: DynamicOptions = {}
) {
  const { ssr = true, loading } = options;

  return dynamic(() => importFn(), {
    ssr,
    loading: loading ? () => <div className="loading-skeleton">{loading}</div> : undefined,
  });
}

/**
 * Preload a component before it's needed
 * Call this on user interactions that might lead to the component
 * 
 * @param importFn - Function that returns a dynamic import
 * 
 * @example
 * // Prefetch chart component when user hovers over a button
 * <button
 *   onMouseEnter={() => prefetchComponent(() => import('@/components/charts/overview-chart'))}
 * >
 *   View Analytics
 * </button>
 */
export async function prefetchComponent<T>(importFn: () => Promise<T>) {
  return importFn();
}

/**
 * Dynamic import with prefetching on hover or idle
 * 
 * @param importFn - Function that returns a dynamic import
 * @param trigger - User action that triggers prefetch
 * @returns Component with automatic prefetching
 */
export function usePrefetch<T>(importFn: () => Promise<T>, trigger: 'hover' | 'visible' = 'hover') {
  const prefetch = () => {
    // Use requestIdleCallback if available, otherwise use setTimeout
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => importFn());
    } else {
      setTimeout(() => importFn(), 1);
    }
  };

  return { prefetch };
}

export default createDynamicComponent;
