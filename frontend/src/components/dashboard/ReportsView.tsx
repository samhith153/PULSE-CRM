'use client';

import React, { useEffect, useState } from 'react';
import {
  Upload,
  Loader2,
} from 'lucide-react';

import StatCardsNew from './StatCardsNew';
import { SalesReportNew } from './SalesReportNew';
import { SalesActivityNew } from './SalesActivityNew';
import { BestSellersNew } from './BestSellersNew';
import { OrdersByCountryNew } from './OrdersByCountryNew';

import {
  getSalesRepDashboard,
  type SalesRepDashboardData,
  asNumber,
} from '@/utils/api';

export type ReportPeriod =
  | 'week'
  | 'month'
  | 'quarter'
  | 'year';

const PERIOD_LABELS: Record<
  ReportPeriod,
  string
> = {
  week: 'Weekly',
  month: 'Monthly',
  quarter: 'Quarterly',
  year: 'Yearly',
};

export default function ReportsView() {
  const [data, setData] =
    useState<SalesRepDashboardData | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  // Single source of truth for the report period.
  const [period, setPeriod] =
    useState<ReportPeriod>('month');

  const [showFilter, setShowFilter] =
    useState(false);

  /*
   * ---------------------------------------------------------
   * LOAD REPORT
   * ---------------------------------------------------------
   *
   * This is the only place that fetches the report.
   *
   * Changing period automatically causes this effect
   * to run again and fetch fresh backend data.
   */
  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError(null);

    (async () => {
      try {
        const result =
          await getSalesRepDashboard(
            period
          );

        console.log(
          '🔥 SALES REP REPORT PERIOD:',
          period
        );

        console.log(
          '🔥 SALES REP REPORT RESPONSE:',
          JSON.stringify(
            result,
            null,
            2
          )
        );

        if (!cancelled) {
          setData(result);
        }
      } catch (err: any) {
        console.error(
          '❌ SALES REP REPORT ERROR:',
          err
        );

        if (!cancelled) {
          setError(
            err?.message ||
              'Failed to load reports'
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [period]);

  /*
   * ---------------------------------------------------------
   * EXPORT CURRENT REPORT
   * ---------------------------------------------------------
   *
   * Uses the data already returned by the backend.
   * No additional API request.
   */
  const handleExport = () => {
    if (!data) {
      return;
    }

    const rows: string[][] = [
      [
        'Metric',
        'Value',
      ],

      [
        'Period',
        PERIOD_LABELS[period],
      ],

      [
        'Revenue',
        String(
          data.revenue_stat?.total ??
            0
        ),
      ],

      [
        'Revenue Growth %',
        String(
          data.revenue_stat
            ?.growth_pct ?? 0
        ),
      ],

      [
        'Won Deals',
        String(
          data.won_deals_stat
            ?.count ?? 0
        ),
      ],

      [
        'Won Deals Growth %',
        String(
          data.won_deals_stat
            ?.growth_pct ?? 0
        ),
      ],

      [
        'Win Rate %',
        String(
          data.win_rate_stat
            ?.win_rate ?? 0
        ),
      ],

      [
        'Win Rate Growth %',
        String(
          data.win_rate_stat
            ?.growth_pct ?? 0
        ),
      ],

      [
        'Average Deal Size',
        String(
          data.avg_deal_size_stat
            ?.avg_deal_value ?? 0
        ),
      ],

      [
        'Average Deal Growth %',
        String(
          data.avg_deal_size_stat
            ?.growth_pct ?? 0
        ),
      ],

      [
        'Open Deals',
        String(
          data.key_metrics
            ?.open_deals ?? 0
        ),
      ],

      [
        'Pipeline Value',
        String(
          data.key_metrics
            ?.pipeline_value ?? 0
        ),
      ],

      [
        'Deals Created',
        String(
          data.key_metrics
            ?.deals_created ?? 0
        ),
      ],

      [
        'Deals Lost',
        String(
          data.key_metrics
            ?.deals_lost ?? 0
        ),
      ],

      [
        'Activities Logged',
        String(
          data.key_metrics
            ?.activities_logged ?? 0
        ),
      ],

      [
        'Emails Sent',
        String(
          data.activity_overview
            ?.emails_sent ?? 0
        ),
      ],

      [
        'Calls Made',
        String(
          data.activity_overview
            ?.calls_made ?? 0
        ),
      ],

      [
        'Meetings Held',
        String(
          data.activity_overview
            ?.meetings_held ?? 0
        ),
      ],

      [
        'Tasks Completed',
        String(
          data.activity_overview
            ?.tasks_completed ?? 0
        ),
      ],

      [
        'Notes Added',
        String(
          data.activity_overview
            ?.notes_added ?? 0
        ),
      ],
    ];

    const csv = rows
      .map((row) =>
        row
          .map((value) => {
            const text =
              String(value);

            return `"${text.replace(
              /"/g,
              '""'
            )}"`;
          })
          .join(',')
      )
      .join('\n');

    const blob = new Blob(
      [csv],
      {
        type: 'text/csv;charset=utf-8;',
      }
    );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement('a');

    link.href = url;

    link.download =
      `sales-report-${period}.csv`;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  /*
   * ---------------------------------------------------------
   * LOADING
   * ---------------------------------------------------------
   */
  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading reports...
        </div>
      </div>
    );
  }

  /*
   * ---------------------------------------------------------
   * ERROR
   * ---------------------------------------------------------
   */
  if (error || !data) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="rounded-xl border border-border bg-card px-5 py-4 text-sm text-muted-foreground">
          {error || 'No data available'}
        </div>
      </div>
    );
  }

  /*
   * ---------------------------------------------------------
   * KPI VALUES
   * ---------------------------------------------------------
   */

  const revenue =
    asNumber(
      data.revenue_stat?.total
    ) || 0;

  const revenueGrowth =
    asNumber(
      data.revenue_stat
        ?.growth_pct
    ) || 0;

  const wonDeals =
    data.won_deals_stat
      ?.count || 0;

  const dealsGrowth =
    asNumber(
      data.won_deals_stat
        ?.growth_pct
    ) || 0;

  const winRate =
    asNumber(
      data.win_rate_stat
        ?.win_rate
    ) || 0;

  const winRateGrowth =
    asNumber(
      data.win_rate_stat
        ?.growth_pct
    ) || 0;

  const avgDealSize =
    asNumber(
      data.avg_deal_size_stat
        ?.avg_deal_value
    ) || 0;

  const avgDealGrowth =
    asNumber(
      data.avg_deal_size_stat
        ?.growth_pct
    ) || 0;

  /*
   * ---------------------------------------------------------
   * PAGE
   * ---------------------------------------------------------
   */

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-sans text-foreground tracking-tight font-bold">
            Reports
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-1 font-medium tracking-wide">
            Performance overview backed by live data.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Period Select */}
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as ReportPeriod)}
            className="rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground outline-none focus:ring-1 focus:ring-accent-color/20 cursor-pointer"
          >
            <option value="week">Weekly</option>
            <option value="month">Monthly</option>
            <option value="quarter">Quarterly</option>
            <option value="year">Yearly</option>
          </select>

          {/* Export */}
          <button
            type="button"
            onClick={handleExport}
            disabled={loading || !data}
            className="inline-flex items-center gap-1.5 px-4 py-2 border border-border bg-card hover:bg-secondary text-foreground rounded-full text-xs font-bold transition shadow-sm cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Upload className="size-3.5" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <StatCardsNew
        revenue={revenue}
        revenueGrowth={
          revenueGrowth
        }
        wonDeals={wonDeals}
        dealsGrowth={
          dealsGrowth
        }
        winRate={winRate}
        winRateGrowth={
          winRateGrowth
        }
        avgDealSize={
          avgDealSize
        }
        avgDealGrowth={
          avgDealGrowth
        }
      />

      {/* Revenue + Source */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">

        <SalesReportNew
          revenueTrend={
            data.revenue_trend ||
            []
          }
          period={period}
          onPeriodChange={
            setPeriod
          }
        />

        <SalesActivityNew
          dealsBySource={
            data.deals_by_source ||
            []
          }
          period={period}
          onPeriodChange={
            setPeriod
          }
        />

      </div>

      {/* Stage + Key Metrics */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">

        <BestSellersNew
          dealsByStage={
            data.deals_by_stage ||
            []
          }
        />

        <OrdersByCountryNew
          keyMetrics={
            data.key_metrics
          }
        />

      </div>

    </div>
  );
}