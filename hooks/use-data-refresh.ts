'use client';

import { useEffect, useRef } from 'react';

/**
 * Hook to handle data refresh on navigation and visibility change
 * Prevents stale data issues when users navigate between pages
 */
export function useDataRefresh(
  refreshFn: (() => Promise<void> | void) | undefined,
  options: {
    onVisibilityChange?: boolean;
    onFocus?: boolean;
    refreshInterval?: number; // in milliseconds
  } = {}
) {
  const {
    onVisibilityChange = true,
    onFocus = true,
    refreshInterval = 0,
  } = options;

  const refreshFnRef = useRef(refreshFn);

  // Keep the latest refresh function
  useEffect(() => {
    refreshFnRef.current = refreshFn;
  }, [refreshFn]);

  // Refresh on visibility change (when user switches tabs and comes back)
  useEffect(() => {
    if (!onVisibilityChange || !refreshFnRef.current) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && refreshFnRef.current) {
        refreshFnRef.current();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [onVisibilityChange]);

  // Refresh on window focus
  useEffect(() => {
    if (!onFocus || !refreshFnRef.current) return;

    const handleFocus = () => {
      if (refreshFnRef.current) {
        refreshFnRef.current();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [onFocus]);

  // Periodic refresh
  useEffect(() => {
    if (refreshInterval > 0 && refreshFnRef.current) {
      const intervalId = setInterval(() => {
        if (refreshFnRef.current) {
          refreshFnRef.current();
        }
      }, refreshInterval);

      return () => clearInterval(intervalId);
    }
  }, [refreshInterval]);
}
