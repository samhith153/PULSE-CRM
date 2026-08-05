import React from 'react';

// Placeholder hook – replace with real data fetching as needed
const useFunnelData = () => {
  return [
    { stage: 'Prospecting', count: 120 },
    { stage: 'Qualification', count: 80 },
    { stage: 'Proposal', count: 45 },
    { stage: 'Negotiation', count: 30 },
    { stage: 'Closed Won', count: 20 },
  ];
};

export default function FunnelChartCard() {
  const data = useFunnelData();
  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <h3 className="text-sm font-semibold text-foreground mb-2">Funnel Chart</h3>
      <div className="space-y-2">
        {data.map((item) => {
          const percent = Math.round((item.count / total) * 100);
          return (
            <div key={item.stage} className="flex items-center">
              <span className="w-24 text-xs font-medium text-foreground">{item.stage}</span>
              <div className="flex-1 h-2 bg-surface-2 rounded-full overflow-hidden mr-2">
                <div className="bg-accent h-full" style={{ width: `${percent}%` }}></div>
              </div>
              <span className="text-xs font-medium text-foreground">{percent}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
