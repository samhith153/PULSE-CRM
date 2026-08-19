'use client';

import { useCallback, useRef, useState } from 'react';

export interface TooltipPoint<T> {
  x: number;
  y: number;
  data: T;
}

/**
 * Shared hover state for custom SVG/div charts.
 * Position (x, y) is computed relative to the wrapping `<div ref={containerRef}>`
 * so a repositioned tooltip can be rendered absolutely inside that container.
 */
export function useChartTooltip<T>() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [tip, setTip] = useState<TooltipPoint<T> | null>(null);

  const show = useCallback((e: { currentTarget: Element }, data: T) => {
    const el = e.currentTarget as HTMLElement;
    const c = containerRef.current;
    if (!c || !el) return;
    const er = el.getBoundingClientRect();
    const cr = c.getBoundingClientRect();
    setTip({ x: er.left - cr.left + er.width / 2, y: er.top - cr.top, data });
  }, []);

  const hide = useCallback(() => setTip(null), []);

  return { containerRef, tip, show, hide };
}