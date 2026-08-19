'use client';

interface TooltipRow {
  label: string;
  value: string;
  color?: string;
}

interface ChartTooltipProps {
  x: number;
  y: number;
  title?: string;
  rows: TooltipRow[];
}

/**
 * Floating tooltip rendered on top of a chart section. Caller positions it via
 * `x`/`y` (relative to the tooltip's `relative` parent) and passes title + rows.
 * Rendered as a `pointer-events-none` overlay so hover stays on the chart.
 */
export default function ChartTooltip({ x, y, title, rows }: ChartTooltipProps) {
  return (
    <div
      className="pointer-events-none absolute z-50 min-w-[150px] max-w-[240px] rounded-lg border border-border bg-surface-1 px-3 py-2 shadow-xl"
      style={{
        left: x,
        top: y,
        transform: 'translate(-50%, calc(-100% - 10px))',
      }}
    >
      {title && (
        <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-text-primary">{title}</p>
      )}
      <div className="space-y-1">
        {rows.map((r, i) => (
          <div key={i} className="flex items-center gap-2 text-[11px] leading-tight">
            {r.color && (
              <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: r.color }} />
            )}
            <span className="text-text-muted">{r.label}</span>
            <span className="ml-auto pl-2 font-bold text-text-primary tabular-nums">{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}