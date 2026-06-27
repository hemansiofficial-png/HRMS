'use client';

import useSWR, { SWRConfiguration, SWRResponse } from 'swr';

// Generic fetcher for API calls
const fetcher = async (url: string) => {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: 'An error occurred',
    }));
    throw new Error(error.message || 'An error occurred');
  }

  return response.json();
};

// Default configuration for optimal performance
const defaultConfig: SWRConfiguration = {
  // Revalidate on focus (when user comes back to tab)
  revalidateOnFocus: true,
  // Revalidate when regaining connection
  revalidateOnReconnect: true,
  // Don't revalidate on mount by default
  revalidateOnMount: false,
  // Keep stale data for 30 seconds
  dedupingInterval: 30000,
  // Refresh interval (set to 0 to disable)
  refreshInterval: 0,
  // Keep previous data while loading
  keepPreviousData: true,
  // Retry logic
  shouldRetryOnError: (error) => {
    const status = error?.response?.status;
    // Don't retry on 4xx errors
    return status && status >= 500;
  },
  // Error retry intervals
  errorRetryInterval: 5000,
  errorRetryCount: 3,
  // Loading timeout
  loadingTimeout: 5000,
};

/**
 * Custom hook for data fetching with SWR
 * 
 * @param key - API endpoint or null to disable fetching
 * @param config - Optional SWR configuration
 * @returns SWR response with data, error, loading states
 * 
 * @example
 * // Basic usage
 * const { data, error, isLoading } = useApi('/api/employees');
 * 
 * @example
 * // With custom config
 * const { data } = useApi('/api/employees', {
 *   refreshInterval: 5000,
 *   revalidateOnFocus: false
 * });
 * 
 * @example
 * // Conditional fetching
 * const { data } = useApi(isEnabled ? '/api/data' : null);
 */
export function useApi<T = any>(
  key: string | null | undefined,
  config?: SWRConfiguration
): SWRResponse<T, Error> {
  return useSWR<T, Error>(key, key ? fetcher : null, {
    ...defaultConfig,
    ...config,
  });
}

/**
 * Hook for mutations (POST, PUT, DELETE)
 * 
 * @example
 * const { trigger, isMutating } = useMutation();
 * 
 * const handleSave = async (data) => {
 *   const result = await trigger('/api/employees', {
 *     method: 'POST',
 *     body: JSON.stringify(data)
 *   });
 * };
 */
export function useMutation() {
  const mutate = async <T>(
    url: string,
    options?: RequestInit
  ): Promise<T> => {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: 'An error occurred',
      }));
      throw new Error(error.message || 'An error occurred');
    }

    return response.json();
  };

  return { trigger: mutate };
}

export { fetcher };
export default useSWR;
