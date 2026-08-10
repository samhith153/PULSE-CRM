'use client';

import React, { useState, useEffect } from 'react';
import { Filter, Upload, Loader2 } from 'lucide-react';
import StatCardsNew from './StatCardsNew';
import { SalesReportNew } from './SalesReportNew';
import { SalesActivityNew } from './SalesActivityNew';
import { BestSellersNew } from './BestSellersNew';
import { OrdersByCountryNew } from './OrdersByCountryNew';
import { getSalesRepDashboard, type SalesRepDashboardData, asNumber } from '@/utils/api';

export default function ReportsView() {
  const [data, setData] = useState<SalesRepDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await getSalesRepDashboard('month', { silent: true });
        if (!cancelled) setData(result);
      } catch (err: any) {
        if (!cancelled) setError(err?.message || 'Failed to load reports');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 text-brand-purple animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <p className="text-sm text-muted-foreground">{error || 'No data available'}</p>
      </div>
    );
  }

  const revenue = asNumber(data.revenue_stat?.total) || 0;
  const prevRevenue = asNumber(data.revenue_stat?.previous_period) || 0;
  const revenueGrowth = asNumber(data.revenue_stat?.growth_pct) || 0;

  const wonDeals = data.won_deals_stat?.count || 0;
  const prevWonDeals = data.won_deals_stat?.previous_period || 0;
  const dealsGrowth = asNumber(data.won_deals_stat?.growth_pct) || 0;

  const winRate = asNumber(data.win_rate_stat?.win_rate) || 0;
  const prevWinRate = asNumber(data.win_rate_stat?.previous_win_rate) || 0;
  const winRateGrowth = asNumber(data.win_rate_stat?.growth_pct) || 0;

  const avgDealSize = asNumber(data.avg_deal_size_stat?.avg_deal_value) || 0;
  const prevAvgDeal = asNumber(data.avg_deal_size_stat?.previous_avg) || 0;
  const avgDealGrowth = asNumber(data.avg_deal_size_stat?.growth_pct) || 0;

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-end gap-3 mb-6">
        <div>
          <h1 className="text-[30px] font-extrabold tracking-tight">Reports</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Performance overview backed by live data.
          </p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <button className="inline-flex items-center gap-2 rounded-full bg-card px-4 py-2.5 text-[13px] font-semibold shadow-[0_1px_3px_rgba(20,20,40,0.08)]">
            Export <Upload className="size-3.5 text-muted-foreground" />
          </button>
          <button className="inline-flex items-center gap-2 rounded-full bg-card px-4 py-2.5 text-[13px] font-semibold shadow-[0_1px_3px_rgba(20,20,40,0.08)]">
            Filter <Filter className="size-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>

      <div className="space-y-5">
        <StatCardsNew
          revenue={revenue}
          revenueGrowth={revenueGrowth}
          wonDeals={wonDeals}
          dealsGrowth={dealsGrowth}
          winRate={winRate}
          winRateGrowth={winRateGrowth}
          avgDealSize={avgDealSize}
          avgDealGrowth={avgDealGrowth}
        />
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <SalesReportNew revenueTrend={data.revenue_trend || []} />
          <SalesActivityNew dealsBySource={data.deals_by_source || []} />
        </div>
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <BestSellersNew dealsByStage={data.deals_by_stage || []} />
          <OrdersByCountryNew keyMetrics={data.key_metrics} />
        </div>
      </div>
    </div>
  );
}
