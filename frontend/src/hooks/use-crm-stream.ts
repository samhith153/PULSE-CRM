'use client';

import { useEffect, useRef } from 'react';
import { getDashboardStreamUrl } from '@/utils/api';

interface UseCrmStreamOptions {
  /** Called whenever a LEAD_SCORE_UPDATED or DEAL_AT_RISK SSE event arrives. */
  onInvalidate?: () => void;
  /** Whether to enable the SSE connection. Defaults to true. */
  enabled?: boolean;
}

/**
 * useCrmStream
 *
 * Maintains a persistent Server-Sent Events (SSE) connection to
 * GET /api/v1/stream/dashboard for real-time background AI worker updates.
 *
 * When the backend pushes a LEAD_SCORE_UPDATED or DEAL_AT_RISK event,
 * this hook calls `onInvalidate()` — letting the caller decide whether
 * to trigger a full dashboard re-fetch, show a toast, or update local state.
 *
 * The token is passed as a query parameter because the native EventSource API
 * does not support custom request headers.
 *
 * Connection is automatically closed on component unmount.
 * Re-connects with exponential back-off on error (max 30s delay).
 */
export function useCrmStream({ onInvalidate, enabled = true }: UseCrmStreamOptions = {}) {
  const eventSourceRef = useRef<EventSource | null>(null);
  const retryDelayRef = useRef<number>(2000);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onInvalidateRef = useRef(onInvalidate);

  // Keep the callback ref current without triggering effect re-runs
  useEffect(() => {
    onInvalidateRef.current = onInvalidate;
  }, [onInvalidate]);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    function connect() {
      const url = getDashboardStreamUrl();
      if (!url) return;

      const es = new EventSource(url);
      eventSourceRef.current = es;

      es.onopen = () => {
        // Reset back-off on successful connection
        retryDelayRef.current = 2000;
      };

      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (
            data?.type === 'LEAD_SCORE_UPDATED' ||
            data?.type === 'DEAL_AT_RISK'
          ) {
            // Debounce: coalesce rapid events into a single re-fetch (500ms window)
            if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
            debounceTimerRef.current = setTimeout(() => {
              onInvalidateRef.current?.();
              debounceTimerRef.current = null;
            }, 500);
          }
        } catch (err) {
          console.error('[useCrmStream] Failed to parse SSE message:', err);
        }
      };

      es.onerror = () => {
        console.warn(`[useCrmStream] SSE connection error — retrying in ${retryDelayRef.current / 1000}s`);
        es.close();
        eventSourceRef.current = null;

        // Exponential back-off capped at 30 seconds
        retryTimerRef.current = setTimeout(() => {
          retryDelayRef.current = Math.min(retryDelayRef.current * 2, 30_000);
          connect();
        }, retryDelayRef.current);
      };
    }

    connect();

    return () => {
      eventSourceRef.current?.close();
      eventSourceRef.current = null;
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    };
  }, [enabled]);
}
