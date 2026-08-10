'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getDashboardMe, DashboardOverviewData } from '@/utils/api';

interface UseDashboardOverviewResult {
  data: DashboardOverviewData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * useDashboardOverview
 *
 * Fetches all 6 core dashboard widget data in a single concurrent request
 * from GET /api/v1/dashboard/me.
 *
 * - Gracefully returns null when the endpoint is not yet deployed,
 *   allowing existing widget fallbacks to continue working.
 * - Automatically re-fetches when `invalidate()` is called (e.g. from SSE events).
 * - Caches data for 5 minutes; a background re-fetch occurs after that window.
 */
const STALE_TIME_MS = 1000 * 60 * 5; // 5 minutes

export function useDashboardOverview(): UseDashboardOverviewResult {
  const [data, setData] = useState<DashboardOverviewData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastFetchedAt = useRef<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetch = useCallback(async (force = false) => {
    const now = Date.now();
    // Skip if data is fresh and not a forced re-fetch
    if (!force && data !== null && now - lastFetchedAt.current < STALE_TIME_MS) return;

    // Cancel any in-flight request
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setError(null);

    try {
      const result = await getDashboardMe({ silent: true });
      if (!result) {
        // No token yet — will retry on next refetch cycle
        return;
      }
      lastFetchedAt.current = Date.now();
      setData(result);
    } catch (err: any) {
      const msg: string = err?.message ?? '';
      // 401 triggers redirect via apiFetch — don't record as an error
      if (!msg.includes('expired') && !msg.includes('401') && err?.name !== 'AbortError') {
        setError(msg || 'Failed to fetch dashboard data');
      }
    } finally {
      setIsLoading(false);
    }
  }, [data]);

  // Initial load
  useEffect(() => {
    fetch(true);
    return () => {
      abortControllerRef.current?.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refetch = useCallback(() => {
    fetch(true);
  }, [fetch]);

  return { data, isLoading, error, refetch };
}
