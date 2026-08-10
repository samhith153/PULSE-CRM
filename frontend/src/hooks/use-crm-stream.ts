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
 * Stops retrying after MAX_RETRIES consecutive failures to avoid log spam
 * when the SSE endpoint is unavailable.
 */
const MAX_RETRIES = 5;

export function useCrmStream({ onInvalidate, enabled = true }: UseCrmStreamOptions = {}) {
  const eventSourceRef = useRef<EventSource | null>(null);
  const retryDelayRef = useRef<number>(2000);
  const retryCountRef = useRef<number>(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onInvalidateRef = useRef(onInvalidate);
  const mountedRef = useRef(true);

  // Keep the callback ref current without triggering effect re-runs
  useEffect(() => {
    onInvalidateRef.current = onInvalidate;
  }, [onInvalidate]);

  useEffect(() => {
    mountedRef.current = true;
    if (!enabled || typeof window === 'undefined') return;

    function connect() {
      if (!mountedRef.current) return;

      // Give up after too many consecutive failures
      if (retryCountRef.current >= MAX_RETRIES) {
        // Silent stop — no more log spam
        return;
      }

      const url = getDashboardStreamUrl();
      if (!url) return;

      const es = new EventSource(url);
      eventSourceRef.current = es;

      es.onopen = () => {
        // Connection established — reset back-off counters
        retryDelayRef.current = 2000;
        retryCountRef.current = 0;
      };

      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (
            data?.type === 'LEAD_SCORE_UPDATED' ||
            data?.type === 'DEAL_AT_RISK'
          ) {
            onInvalidateRef.current?.();
          }
        } catch (err) {
          // Ignore parse errors on heartbeat/keepalive comments
        }
      };

      es.onerror = () => {
        es.close();
        eventSourceRef.current = null;

        if (!mountedRef.current) return;

        retryCountRef.current += 1;

        if (retryCountRef.current >= MAX_RETRIES) {
          // Quietly stop — SSE is a non-critical enhancement
          return;
        }

        // Exponential back-off capped at 30 seconds
        retryTimerRef.current = setTimeout(() => {
          retryDelayRef.current = Math.min(retryDelayRef.current * 2, 30_000);
          connect();
        }, retryDelayRef.current);
      };
    }

    connect();

    return () => {
      mountedRef.current = false;
      eventSourceRef.current?.close();
      eventSourceRef.current = null;
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
    };
  }, [enabled]);
}
