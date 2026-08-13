'use client';

import { useEffect, useRef } from 'react';
import { getDashboardStreamUrl, getToken } from '@/utils/api';

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
 * The token is sent via the Authorization header (fetch-based SSE) instead of
 * a query parameter — native EventSource can't set headers, and putting JWTs
 * in URLs leaks them into logs, browser history and Referer headers.
 *
 * Connection is automatically closed on component unmount.
 * Re-connects with exponential back-off on error (max 30s delay).
 */
export function useCrmStream({ onInvalidate, enabled = true }: UseCrmStreamOptions = {}) {
  const abortRef = useRef<AbortController | null>(null);
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

    function handleMessage(raw: string) {
      try {
        const data = JSON.parse(raw);
        if (data?.type === 'LEAD_SCORE_UPDATED' || data?.type === 'DEAL_AT_RISK') {
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
    }

    function connect() {
      const url = getDashboardStreamUrl();
      const token = getToken();
      if (!url || !token) return;

      const controller = new AbortController();
      abortRef.current = controller;
      let buffer = '';

      (async () => {
        try {
          const res = await fetch(url, {
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal,
          });
          if (!res.ok || !res.body) {
            throw new Error(`SSE HTTP ${res.status}`);
          }
          // Reset back-off once the stream is actually open
          retryDelayRef.current = 2000;

          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            let sep: number;
            while ((sep = buffer.indexOf('\n\n')) !== -1) {
              const frame = buffer.slice(0, sep);
              buffer = buffer.slice(sep + 2);
              const dataLine = frame
                .split('\n')
                .find((l) => l.startsWith('data:'));
              if (dataLine) {
                handleMessage(dataLine.slice(5).trim());
              }
            }
          }
        } catch (err) {
          if (controller.signal.aborted) return; // intentional close
          console.warn(`[useCrmStream] SSE error — retrying in ${retryDelayRef.current / 1000}s`, err);
          retryTimerRef.current = setTimeout(() => {
            retryDelayRef.current = Math.min(retryDelayRef.current * 2, 30_000);
            connect();
          }, retryDelayRef.current);
        }
      })();

    }

    connect();

    return () => {
      abortRef.current?.abort();
      abortRef.current = null;
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
