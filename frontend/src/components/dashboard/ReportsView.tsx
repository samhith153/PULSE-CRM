'use client';

import React from 'react';
import { Filter, Upload } from 'lucide-react';
import StatCardsNew from './StatCardsNew';
import { SalesReportNew } from './SalesReportNew';
import { SalesActivityNew } from './SalesActivityNew';
import { BestSellersNew } from './BestSellersNew';
import { OrdersByCountryNew } from './OrdersByCountryNew';

export default function ReportsView() {
  return (
    <div className="w-full">
      <div className="flex flex-wrap items-end gap-3 mb-6">
        <div>
          <h1 className="text-[30px] font-extrabold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Here's your overview of your business sales.
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
        <StatCardsNew />
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <SalesReportNew />
          <SalesActivityNew />
        </div>
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <BestSellersNew />
          <OrdersByCountryNew />
        </div>
      </div>
    </div>
  );
}
