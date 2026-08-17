# Fix: Show loading spinner at score position during scoring

## File: frontend/src/components/dashboard/PipelineView.tsx

### Change 1: Card score (line ~1097)

Replace:
```tsx
{deal.leadScore != null && (
  <span className={`text-[8px] font-bold px-1 py-0.25 rounded ${
    deal.leadScore >= 80 ? 'text-status-success bg-status-success/10' :
    deal.leadScore >= 50 ? 'text-status-warning bg-status-warning/10' :
    'text-text-muted bg-surface-2'
  }`}>{deal.leadScore}%</span>
)}
{deal.leadScore == null && scoringIds.has(String(deal.id)) && (
  <Loader2 className="h-2.5 w-2.5 animate-spin text-accent-color" />
)}
```

With:
```tsx
{deal.leadScore != null && !scoringIds.has(String(deal.id)) && (
  <span className={`text-[8px] font-bold px-1 py-0.25 rounded ${
    deal.leadScore >= 80 ? 'text-status-success bg-status-success/10' :
    deal.leadScore >= 50 ? 'text-status-warning bg-status-warning/10' :
    'text-text-muted bg-surface-2'
  }`}>{deal.leadScore}%</span>
)}
{scoringIds.has(String(deal.id)) && (
  <Loader2 className="h-2.5 w-2.5 animate-spin text-accent-color" />
)}
```

### Change 2: Detail panel score (line ~1354)

Replace:
```tsx
{selectedDeal.leadScore != null && (
  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
    selectedDeal.leadScore >= 80 ? 'text-status-success bg-status-success/10' :
    selectedDeal.leadScore >= 50 ? 'text-status-warning bg-status-warning/10' :
    'text-text-muted bg-surface-2'
  }`}>{selectedDeal.leadScore}%</span>
)}
{selectedDeal.leadScore == null && scoringIds.has(String(selectedDeal.id)) && (
  <Loader2 className="h-3.5 w-3.5 animate-spin text-accent-color" />
)}
```

With:
```tsx
{selectedDeal.leadScore != null && !scoringIds.has(String(selectedDeal.id)) && (
  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
    selectedDeal.leadScore >= 80 ? 'text-status-success bg-status-success/10' :
    selectedDeal.leadScore >= 50 ? 'text-status-warning bg-status-warning/10' :
    'text-text-muted bg-surface-2'
  }`}>{selectedDeal.leadScore}%</span>
)}
{scoringIds.has(String(selectedDeal.id)) && (
  <Loader2 className="h-3.5 w-3.5 animate-spin text-accent-color" />
)}
```

## Logic
- When scoringIds has the deal ID (stage just changed), hide the old score badge and show spinner
- When SSE score update arrives, scoringIds is cleared, spinner hides, new score badge appears
