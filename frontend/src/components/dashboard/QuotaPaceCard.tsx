import React from 'react';

// Placeholder hook – replace with real data fetching as needed
const useQuotaProgress = () => {
  // Example static data; in a real app, fetch from API
  const current = 3400000; // ₹34L
  const target = 5000000; // ₹50L
  const percent = Math.round((current / target) * 100);
  return { current, target, percent };
};

export default function QuotaPaceCard() {
  const { current, target, percent } = useQuotaProgress();

  // Determine color based on thresholds
  const barColor =
    percent >= 90 ? 'bg-status-success-text' :
    percent >= 70 ? 'bg-status-warning-text' :
    'bg-status-danger-text';

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <h3 className="text-sm font-semibold text-foreground mb-2">Quota Pace</h3>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-medium text-foreground">{percent}%</span>
        <span className="text-xs text-muted-foreground">of target</span>
      </div>
      <div className="w-full h-2 bg-surface-2 rounded-full overflow-hidden mb-2">
        <div className={`${barColor} h-full w-[${percent}%]`} />
      </div>
      <p className="text-xs text-muted-foreground">
        ₹{(current / 100000).toFixed(1)}L of ₹{(target / 100000).toFixed(1)}L
      </p>
    </div>
  );
}
