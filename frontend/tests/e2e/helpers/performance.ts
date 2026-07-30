import { Page } from '@playwright/test';

export interface PerformanceMetrics {
  route: string;
  lcp: number;
  fcp: number;
  ttfb: number;
  loadTime: number;
  apiCalls: ApiCallMetric[];
}

export interface ApiCallMetric {
  url: string;
  method: string;
  status: number;
  duration: number;
  size: number;
}

/**
 * Collect performance metrics for a page navigation.
 * Records FCP, TTFB, load time, and all API calls made during navigation.
 */
export async function collectMetrics(page: Page, route: string): Promise<PerformanceMetrics> {
  const apiCalls: ApiCallMetric[] = [];

  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('/api/')) {
      try {
        const timing = response.request().timing();
        const body = await response.body().catch(() => Buffer.alloc(0));
        apiCalls.push({
          url,
          method: response.request().method(),
          status: response.status(),
          duration: timing.responseEnd - timing.requestStart,
          size: body.length,
        });
      } catch {
        // Response may have been disposed
      }
    }
  });

  const startTime = Date.now();
  await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {});
  const loadTime = Date.now() - startTime;

  const performanceData = await page.evaluate(() => {
    const entries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    const paintEntries = performance.getEntriesByType('paint');

    const nav = entries[0];
    const ttfb = nav ? nav.responseStart - nav.requestStart : 0;

    let fcp = 0;
    const fcpEntry = paintEntries.find((e) => e.name === 'first-contentful-paint');
    if (fcpEntry) fcp = fcpEntry.startTime;

    // LCP via PerformanceObserver is unreliable in headless Chrome
    // Use a fallback: largest paint entry
    let lcp = 0;
    const allPaints = performance.getEntriesByType('paint');
    if (allPaints.length > 0) {
      lcp = allPaints[allPaints.length - 1].startTime;
    }

    return { ttfb, fcp, lcp };
  });

  return {
    route,
    lcp: performanceData.lcp,
    fcp: performanceData.fcp,
    ttfb: performanceData.ttfb,
    loadTime,
    apiCalls,
  };
}

/**
 * Collect Core Web Vitals using PerformanceObserver API.
 * Call this BEFORE navigation to capture metrics as they happen.
 */
export async function setupPerformanceObservers(page: Page): Promise<void> {
  await page.evaluate(() => {
    (window as any).__perfMetrics = {
      lcp: 0,
      fid: 0,
      cls: 0,
      fcp: 0,
      ttfb: 0,
    };

    try {
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        (window as any).__perfMetrics.lcp = lastEntry.startTime;
      }).observe({ type: 'largest-contentful-paint', buffered: true });
    } catch {
      // LCP observer not supported
    }

    try {
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          (window as any).__perfMetrics.fid = entry.processingStart - entry.startTime;
        });
      }).observe({ type: 'first-input', buffered: true });
    } catch {
      // FID observer not supported
    }

    try {
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          (window as any).__perfMetrics.cls += entry.value;
        });
      }).observe({ type: 'layout-shift', buffered: true });
    } catch {
      // CLS observer not supported
    }
  });
}

/**
 * Read collected performance metrics from the page.
 */
export async function getPerformanceMetrics(page: Page): Promise<{
  lcp: number;
  fid: number;
  cls: number;
  fcp: number;
  ttfb: number;
}> {
  return page.evaluate(() => (window as any).__perfMetrics || { lcp: 0, fid: 0, cls: 0, fcp: 0, ttfb: 0 });
}

/**
 * Log metrics in a structured JSON format for CI output.
 */
export function logMetrics(metrics: PerformanceMetrics): void {
  const summary = {
    route: metrics.route,
    timings: {
      lcp: `${metrics.lcp.toFixed(0)}ms`,
      fcp: `${metrics.fcp.toFixed(0)}ms`,
      ttfb: `${metrics.ttfb.toFixed(0)}ms`,
      loadTime: `${metrics.loadTime}ms`,
    },
    apiCalls: {
      count: metrics.apiCalls.length,
      totalDuration: `${metrics.apiCalls.reduce((sum, c) => sum + c.duration, 0).toFixed(0)}ms`,
      slowest: metrics.apiCalls.sort((a, b) => b.duration - a.duration).slice(0, 3).map((c) => ({
        url: c.url.split('?')[0],
        duration: `${c.duration.toFixed(0)}ms`,
        status: c.status,
      })),
    },
  };

  console.log(`[PERF] ${JSON.stringify(summary)}`);
}

/**
 * Assert that metrics are within acceptable thresholds.
 * Logs warnings but does NOT fail the test (metrics-only mode).
 */
export function evaluateThresholds(metrics: PerformanceMetrics): { passed: boolean; violations: string[] } {
  const violations: string[] = [];
  const THRESHOLDS = {
    lcp: 5000,
    fcp: 3000,
    ttfb: 1500,
    loadTime: 15000,
    apiResponseTime: 5000,
  };

  if (metrics.lcp > THRESHOLDS.lcp) violations.push(`LCP ${metrics.lcp.toFixed(0)}ms > ${THRESHOLDS.lcp}ms`);
  if (metrics.fcp > THRESHOLDS.fcp) violations.push(`FCP ${metrics.fcp.toFixed(0)}ms > ${THRESHOLDS.fcp}ms`);
  if (metrics.ttfb > THRESHOLDS.ttfb) violations.push(`TTFB ${metrics.ttfb.toFixed(0)}ms > ${THRESHOLDS.ttfb}ms`);
  if (metrics.loadTime > THRESHOLDS.loadTime) violations.push(`Load ${metrics.loadTime}ms > ${THRESHOLDS.loadTime}ms`);

  for (const call of metrics.apiCalls) {
    if (call.duration > THRESHOLDS.apiResponseTime) {
      violations.push(`API ${call.url.split('?')[0]} ${call.duration.toFixed(0)}ms > ${THRESHOLDS.apiResponseTime}ms`);
    }
  }

  return { passed: violations.length === 0, violations };
}
