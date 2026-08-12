'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  AlertTriangle,
  Flame,
  CheckSquare,
  ShieldCheck,
  Check,
  BrainCircuit,
  MessageSquare,
  Target,
  Smile,
  Frown,
  Meh,
  Clock,
  TrendingDown,
  Loader2,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import {
  getSalesRepAIInsights,
  SalesRepAIInsightsData,
  SalesRepActionItem,
  SalesRepFollowUpItem,
  SalesRepColdItem,
  SalesRepPriorityItem,
  SalesRepRecentSummary,
} from '@/utils/api';

// ── Loading skeleton ─────────────────────────────────────────────────────────
function CardSkeleton({ rows = 2 }: { rows?: number }) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="p-2.5 bg-surface-1 border border-border-default rounded-lg">
          <div className="flex justify-between items-center">
            <div className="h-2.5 bg-muted rounded w-28" />
            <div className="h-2.5 bg-muted rounded w-12" />
          </div>
          <div className="h-2 bg-muted rounded w-48 mt-2" />
        </div>
      ))}
    </div>
  );
}

// ── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ message }: { message: string }) {
  return (
    <p className="text-[9px] text-text-muted font-semibold italic py-2">
      {message}
    </p>
  );
}

// ── Navigate to lead detail ──────────────────────────────────────────────────
function navigateToLead(leadId: string, setActiveTab: ((t: string) => void) | undefined) {
  if (setActiveTab) setActiveTab('leads');
}
function navigateToDeal(dealId: string, setActiveTab: ((t: string) => void) | undefined) {
  if (setActiveTab) setActiveTab('deals');
}

// ── Immediate Action card ────────────────────────────────────────────────────
function ImmediateActionCard({
  item,
  onNavigate,
}: {
  item: SalesRepActionItem;
  onNavigate?: (tab: string) => void;
}) {
  return (
    <div
      className="p-2.5 bg-surface-1 border border-destructive/10 rounded-lg cursor-pointer hover:border-destructive/30 transition"
      onClick={() => navigateToLead(item.lead_id, onNavigate)}
    >
      <div className="flex justify-between items-center">
        <span className="text-[10px] font-semibold text-text-primary truncate max-w-[60%]">
          {item.lead_name}
        </span>
        <span className="text-[9px] font-semibold text-destructive bg-destructive/10 px-1.5 py-0.5 rounded shrink-0">
          {item.score} Score
        </span>
      </div>
      <p className="text-[9px] text-text-muted mt-1 font-semibold leading-relaxed line-clamp-2">
        {item.reason}
      </p>
    </div>
  );
}

// ── Follow Up Due card ───────────────────────────────────────────────────────
function FollowUpCard({
  item,
  onNavigate,
}: {
  item: SalesRepFollowUpItem;
  onNavigate?: (tab: string) => void;
}) {
  const label =
    item.days_overdue === 1
      ? 'Overdue 1d'
      : `Overdue ${item.days_overdue}d`;
  return (
    <div
      className="p-2.5 bg-surface-1 border border-status-warning-text/20 rounded-lg cursor-pointer hover:border-status-warning-text/40 transition"
      onClick={() => navigateToLead(item.lead_id, onNavigate)}
    >
      <div className="flex justify-between items-center">
        <span className="text-[10px] font-semibold text-text-primary truncate max-w-[60%]">
          {item.lead_name}
        </span>
        <span className="text-[9px] font-semibold text-status-warning-text bg-status-warning-bg px-1.5 py-0.5 rounded shrink-0">
          {label}
        </span>
      </div>
      <p className="text-[9px] text-text-muted mt-1 font-semibold leading-relaxed line-clamp-2">
        {item.reason}
      </p>
    </div>
  );
}

// ── Rising Interest card ─────────────────────────────────────────────────────
function RisingCard({
  item,
  onNavigate,
}: {
  item: SalesRepActionItem;
  onNavigate?: (tab: string) => void;
}) {
  return (
    <div
      className="p-2.5 bg-surface-1 border border-border-default rounded-lg cursor-pointer hover:border-accent-color/40 transition"
      onClick={() => navigateToLead(item.lead_id, onNavigate)}
    >
      <div className="flex justify-between items-center">
        <span className="text-[10px] font-semibold text-text-primary truncate max-w-[60%]">
          {item.lead_name}
        </span>
        <span className="text-[9px] font-semibold text-accent-color bg-accent-color/15 px-1.5 py-0.5 rounded shrink-0">
          Score {item.score}
        </span>
      </div>
      <p className="text-[9px] text-text-muted mt-1 font-semibold leading-relaxed line-clamp-2">
        {item.reason}
      </p>
    </div>
  );
}

// ── Going Cold card ──────────────────────────────────────────────────────────
function ColdCard({
  item,
  onNavigate,
}: {
  item: SalesRepColdItem;
  onNavigate?: (tab: string) => void;
}) {
  return (
    <div
      className="p-2.5 bg-surface-1 border border-border-default rounded-lg cursor-pointer hover:border-muted-foreground/30 transition"
      onClick={() => navigateToLead(item.lead_id, onNavigate)}
    >
      <div className="flex justify-between items-center">
        <span className="text-[10px] font-semibold text-text-primary truncate max-w-[60%]">
          {item.lead_name}
        </span>
        <span className="text-[9px] font-semibold text-text-muted bg-surface-2 px-1.5 py-0.5 rounded shrink-0">
          Score {item.score}
        </span>
      </div>
      <p className="text-[9px] text-text-muted mt-1 font-semibold leading-relaxed line-clamp-2">
        {item.reason}
      </p>
    </div>
  );
}

// ── Priority checklist item ───────────────────────────────────────────────────
function PriorityItem({
  item,
  checked,
  onToggle,
  onNavigate,
}: {
  item: SalesRepPriorityItem;
  checked: boolean;
  onToggle: () => void;
  onNavigate?: (tab: string) => void;
}) {
  const formattedValue =
    item.deal_value > 0
      ? `₹${item.deal_value >= 100000
          ? `${(item.deal_value / 100000).toFixed(0)}L`
          : item.deal_value.toLocaleString('en-IN')}`
      : null;

  return (
    <div
      className="flex items-start space-x-2.5 cursor-pointer"
      onClick={onToggle}
    >
      <div
        className={`h-4 w-4 rounded border flex items-center justify-center shrink-0 mt-0.5 ${
          checked
            ? 'bg-accent-color border-accent-color text-surface-0'
            : 'border-border-default bg-surface-0'
        }`}
      >
        {checked && <Check className="h-3 w-3" strokeWidth={3} />}
      </div>
      <div className={checked ? 'line-through opacity-55' : ''}>
        <div className="flex justify-between items-center w-full gap-2">
          <h4 className="text-[11px] font-semibold text-text-primary leading-tight">
            {item.title}
          </h4>
          <span
            className={`text-[8px] font-bold shrink-0 ${
              item.priority_level === 'High' || item.priority_level === 'Critical'
                ? 'text-destructive'
                : 'text-text-muted'
            }`}
          >
            {item.priority_level === 'Critical' ? 'High' : item.priority_level}
          </span>
        </div>
        <p className="text-[9px] text-text-muted mt-0.5 leading-relaxed font-semibold line-clamp-2">
          {item.description}
        </p>
        {formattedValue && (
          <p className="text-[9px] text-accent-color font-semibold mt-1">
            Value: {formattedValue}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Recent Summary card ───────────────────────────────────────────────────────
function RecentSummaryCard({
  item,
  onNavigate,
}: {
  item: SalesRepRecentSummary;
  onNavigate?: (tab: string) => void;
}) {
  const sentimentStyle =
    item.sentiment === 'positive'
      ? 'bg-accent-color/15 text-accent-color'
      : item.sentiment === 'negative'
      ? 'bg-destructive/10 text-destructive'
      : 'bg-surface-2 text-text-muted';

  const categoryStyle =
    item.category === 'sales'
      ? 'bg-accent-color/15 text-accent-color'
      : item.category === 'urgent'
      ? 'bg-destructive/10 text-destructive'
      : 'bg-surface-2 text-text-muted';

  return (
    <div
      className="p-2.5 bg-surface-1 border border-border-default rounded-lg cursor-pointer hover:border-accent-color/30 transition"
      onClick={() => onNavigate?.('emails')}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-[9px] font-semibold text-text-primary truncate max-w-[50%]">
          {item.contact_name}
        </span>
        <div className="flex items-center space-x-1">
          <span className={`text-[7px] font-bold px-1 py-0.5 rounded ${categoryStyle}`}>
            {item.category}
          </span>
          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${sentimentStyle}`}>
            {item.sentiment}
          </span>
        </div>
      </div>
      <p className="text-[9px] text-text-muted font-semibold leading-relaxed line-clamp-2">
        {item.summary}
      </p>
      {item.follow_up_suggestion && (
        <p className="text-[8px] text-status-warning-text font-semibold mt-1">
          ⏰ {item.follow_up_suggestion}
        </p>
      )}
    </div>
  );
}

// ── useSalesRepAIInsights hook ────────────────────────────────────────────────
function useSalesRepAIInsights() {
  const [data, setData] = useState<SalesRepAIInsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetch = useCallback(async (silent = false) => {
    // Keep showing existing data during a silent background refresh
    if (!silent || data === null) setLoading(true);
    setError(null);
    try {
      const result = await getSalesRepAIInsights();
      setData(result);
      setLastUpdated(new Date());
    } catch (err: any) {
      setError(err?.message || 'Failed to load AI insights.');
    } finally {
      setLoading(false);
    }
  }, [data]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refresh: fetch, lastUpdated };
}

// ── Main component ────────────────────────────────────────────────────────────
interface AIInsightsViewProps {
  onTabChange?: (tab: string) => void;
  refreshSignal?: number;
}

export default function AIInsightsView({ onTabChange, refreshSignal = 0 }: AIInsightsViewProps = {}) {
  const { data, loading, error, refresh, lastUpdated } = useSalesRepAIInsights();
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());

  // Silent background refresh when the tab becomes active again (data stays visible)
  useEffect(() => {
    if (refreshSignal > 0) refresh(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshSignal]);

  const handleToggle = (id: string) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Derived data with safe fallbacks
  const ac = data?.action_center;
  const ph = data?.pipeline_health;
  const priorities = data?.daily_priorities ?? [];
  const conv = data?.conversation_intelligence;
  const sentiment = conv?.sentiment;
  const intentDist = conv?.intent_distribution ?? [];
  const recentSummaries = conv?.recent_summaries ?? [];

  // Sentiment bar widths
  const sentTotal = (sentiment?.positive ?? 0) + (sentiment?.neutral ?? 0) + (sentiment?.negative ?? 0);
  const sentPct = (n: number) => sentTotal > 0 ? `${Math.round((n / sentTotal) * 100)}%` : '0%';

  // Intent bar widths
  const intentMax = intentDist.length > 0 ? Math.max(...intentDist.map((i) => i.count)) : 1;

  // Last updated text
  const updatedText = lastUpdated
    ? `Updated ${Math.round((Date.now() - lastUpdated.getTime()) / 1000)}s ago`
    : '';

  return (
    <div className="space-y-6">
      {/* ── Top Banner ─────────────────────────────────────────────────────── */}
      <div className="border border-border-default rounded-2xl p-5 flex items-start justify-between space-x-3.5">
        <div className="flex items-start space-x-3.5">
          <div className="h-10 w-10 rounded-xl bg-accent-color flex items-center justify-center text-surface-0 shrink-0">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-sans text-2xl text-text-primary font-bold">AI Copilot Insights</h2>
            <p className="text-xs text-text-muted mt-1 leading-relaxed font-semibold max-w-2xl">
              Real-time recommendations powered by predictive lead scoring, conversation intelligence, compliance
              mapping, and contact velocity.
            </p>
          </div>
        </div>
        <button
          onClick={() => refresh()}
          disabled={loading}
          className="shrink-0 flex items-center gap-1.5 text-[10px] font-semibold text-text-muted hover:text-text-primary transition px-2 py-1 rounded-lg hover:bg-surface-2"
          title="Refresh AI insights"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          {updatedText}
        </button>
      </div>

      {/* ── Error state ─────────────────────────────────────────────────────── */}
      {error && !loading && (
        <div className="flex items-center gap-2 p-4 bg-destructive/5 border border-destructive/20 rounded-xl text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span className="font-semibold">{error}</span>
          <button
            onClick={() => refresh()}
            className="ml-auto text-[10px] font-bold underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Main 12-col grid ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-12 gap-6">

        {/* ── Left: AI Action Center (8 cols) ─────────────────────────────── */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          <div className="bg-surface-1 border border-border-default rounded-2xl p-5">
            <h3 className="font-semibold text-text-primary text-sm mb-4 flex items-center">
              <BrainCircuit className="h-4 w-4 mr-2 text-accent-color" />
              <span>AI Action Center</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* IMMEDIATE ACTION */}
              <div className="bg-surface-2 border border-border-default rounded-xl p-4 flex flex-col justify-between min-h-[220px]">
                <div>
                  <div className="flex justify-between items-center pb-2 border-b border-border-default mb-3">
                    <h4 className="text-xs font-semibold text-destructive uppercase tracking-wider flex items-center">
                      <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />
                      <span>Immediate Action</span>
                    </h4>
                    <span className="text-[9px] font-semibold bg-destructive/10 text-destructive px-1.5 py-0.5 rounded-full">
                      P1 Urgent
                    </span>
                  </div>
                  {loading ? (
                    <CardSkeleton rows={2} />
                  ) : !ac?.immediate_action?.length ? (
                    <EmptyState message="No immediate actions required." />
                  ) : (
                    <div className="space-y-3">
                      {ac.immediate_action.map((item) => (
                        <ImmediateActionCard key={item.lead_id} item={item} onNavigate={onTabChange} />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* FOLLOW UP DUE */}
              <div className="bg-surface-2 border border-border-default rounded-xl p-4 flex flex-col justify-between min-h-[220px]">
                <div>
                  <div className="flex justify-between items-center pb-2 border-b border-border-default mb-3">
                    <h4 className="text-xs font-semibold text-status-warning-text uppercase tracking-wider flex items-center">
                      <Clock className="h-3.5 w-3.5 mr-1.5" />
                      <span>Follow Up Due</span>
                    </h4>
                    <span className="text-[9px] font-semibold bg-status-warning-bg text-status-warning-text px-1.5 py-0.5 rounded-full">
                      Missed
                    </span>
                  </div>
                  {loading ? (
                    <CardSkeleton rows={2} />
                  ) : !ac?.follow_up_due?.length ? (
                    <EmptyState message="No overdue follow-ups." />
                  ) : (
                    <div className="space-y-3">
                      {ac.follow_up_due.map((item) => (
                        <FollowUpCard key={item.lead_id} item={item} onNavigate={onTabChange} />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* RISING INTEREST */}
              <div className="bg-surface-2 border border-border-default rounded-xl p-4 flex flex-col justify-between min-h-[220px]">
                <div>
                  <div className="flex justify-between items-center pb-2 border-b border-border-default mb-3">
                    <h4 className="text-xs font-semibold text-accent-color uppercase tracking-wider flex items-center">
                      <Flame className="h-3.5 w-3.5 mr-1.5 animate-pulse" />
                      <span>Rising Interest</span>
                    </h4>
                    <span className="text-[9px] font-semibold bg-accent-color/15 text-accent-color px-1.5 py-0.5 rounded-full">
                      Spiking
                    </span>
                  </div>
                  {loading ? (
                    <CardSkeleton rows={2} />
                  ) : !ac?.rising_interest?.length ? (
                    <EmptyState message="No rising engagement detected." />
                  ) : (
                    <div className="space-y-3">
                      {ac.rising_interest.map((item) => (
                        <RisingCard key={item.lead_id} item={item} onNavigate={onTabChange} />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* GOING COLD */}
              <div className="bg-surface-2 border border-border-default rounded-xl p-4 flex flex-col justify-between min-h-[220px]">
                <div>
                  <div className="flex justify-between items-center pb-2 border-b border-border-default mb-3">
                    <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider flex items-center">
                      <TrendingDown className="h-3.5 w-3.5 mr-1.5" />
                      <span>Going Cold</span>
                    </h4>
                    <span className="text-[9px] font-semibold bg-surface-2 text-text-muted px-1.5 py-0.5 rounded-full">
                      At Risk
                    </span>
                  </div>
                  {loading ? (
                    <CardSkeleton rows={2} />
                  ) : !ac?.going_cold?.length ? (
                    <EmptyState message="No leads going cold." />
                  ) : (
                    <div className="space-y-3">
                      {ac.going_cold.map((item) => (
                        <ColdCard key={item.lead_id} item={item} onNavigate={onTabChange} />
                      ))}
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* ── Right: Pipeline Health + Daily Priorities (4 cols) ────────── */}
        <div className="col-span-12 lg:col-span-4 space-y-6">

          {/* Pipeline Health Index */}
          <div className="bg-surface-1 border border-border-default rounded-2xl p-5">
            <h3 className="font-semibold text-text-primary text-sm mb-3.5 flex items-center">
              <ShieldCheck className="h-4 w-4 mr-2 text-accent-color" />
              <span>Pipeline Health Index</span>
            </h3>
            {loading ? (
              <div className="animate-pulse space-y-2">
                <div className="h-10 bg-muted rounded-xl w-full" />
                <div className="h-2 bg-muted rounded w-3/4" />
              </div>
            ) : (
              <>
                <div className="text-center py-4 bg-surface-2 border border-border-default rounded-xl">
                  <span className="text-4xl font-serif text-text-primary font-normal tabular-nums">
                    {ph?.score ?? 0}
                    <span className="text-sm font-sans text-text-muted">/100</span>
                  </span>
                  <p className="text-[10px] text-accent-color font-semibold mt-1.5">
                    {ph?.trend_label ?? '—'}
                  </p>
                </div>
                <p className="text-[9px] text-text-muted font-semibold mt-3 leading-relaxed">
                  {ph?.explanation ?? 'Calculated from your pipeline data.'}
                </p>
              </>
            )}
          </div>

          {/* Daily Priorities checklist */}
          <div className="bg-surface-1 border border-border-default rounded-2xl p-5">
            <h3 className="font-semibold text-text-primary text-sm mb-4 flex items-center">
              <CheckSquare className="h-4 w-4 mr-2 text-accent-color" />
              <span>Daily Priorities</span>
            </h3>
            {loading ? (
              <div className="animate-pulse space-y-3.5">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="flex items-start space-x-2.5">
                    <div className="h-4 w-4 rounded border bg-muted shrink-0 mt-0.5" />
                    <div className="space-y-1.5 flex-1">
                      <div className="h-2.5 bg-muted rounded w-32" />
                      <div className="h-2 bg-muted rounded w-full" />
                      <div className="h-2 bg-muted rounded w-16" />
                    </div>
                  </div>
                ))}
              </div>
            ) : !priorities.length ? (
              <EmptyState message="No priorities generated yet." />
            ) : (
              <div className="space-y-3.5">
                {priorities.map((item) => (
                  <PriorityItem
                    key={item.priority_id}
                    item={item}
                    checked={checkedIds.has(item.priority_id)}
                    onToggle={() => handleToggle(item.priority_id)}
                    onNavigate={onTabChange}
                  />
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ── Conversation Intelligence ──────────────────────────────────────── */}
      <div className="bg-surface-1 border border-border-default rounded-2xl p-5">
        <h3 className="font-semibold text-text-primary text-sm mb-4 flex items-center">
          <BrainCircuit className="h-4 w-4 mr-2 text-accent-color" />
          <span>Conversation Intelligence</span>
        </h3>

        <div className="grid grid-cols-12 gap-4">

          {/* Sentiment Breakdown */}
          <div className="col-span-12 lg:col-span-4 p-4 border border-border-default rounded-xl bg-surface-2">
            <h4 className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-3 flex items-center">
              <Smile className="h-3.5 w-3.5 mr-1.5 text-accent-color" />
              Sentiment Breakdown
            </h4>
            {loading ? (
              <div className="animate-pulse space-y-2.5">
                {[1, 2, 3].map((n) => (
                  <div key={n}>
                    <div className="flex justify-between mb-1">
                      <div className="h-2 bg-muted rounded w-16" />
                      <div className="h-2 bg-muted rounded w-4" />
                    </div>
                    <div className="h-1.5 bg-muted rounded-full w-full" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2.5">
                <div>
                  <div className="flex justify-between text-[10px] font-semibold text-text-primary mb-1">
                    <span className="flex items-center">
                      <Smile className="h-3 w-3 text-accent-color mr-1" /> Positive
                    </span>
                    <span className="tabular-nums">{sentiment?.positive ?? 0}</span>
                  </div>
                  <div className="h-1.5 w-full bg-surface-0 rounded-full overflow-hidden">
                    <div className="h-full bg-accent-color rounded-full transition-all duration-500" style={{ width: sentPct(sentiment?.positive ?? 0) }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[10px] font-semibold text-text-primary mb-1">
                    <span className="flex items-center">
                      <Meh className="h-3 w-3 text-status-warning-text mr-1" /> Neutral
                    </span>
                    <span className="tabular-nums">{sentiment?.neutral ?? 0}</span>
                  </div>
                  <div className="h-1.5 w-full bg-surface-0 rounded-full overflow-hidden">
                    <div className="h-full bg-status-warning-text rounded-full transition-all duration-500" style={{ width: sentPct(sentiment?.neutral ?? 0) }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[10px] font-semibold text-text-primary mb-1">
                    <span className="flex items-center">
                      <Frown className="h-3 w-3 text-destructive mr-1" /> Negative
                    </span>
                    <span className="tabular-nums">{sentiment?.negative ?? 0}</span>
                  </div>
                  <div className="h-1.5 w-full bg-surface-0 rounded-full overflow-hidden">
                    <div className="h-full bg-destructive rounded-full transition-all duration-500" style={{ width: sentPct(sentiment?.negative ?? 0) }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Intent Distribution */}
          <div className="col-span-12 lg:col-span-4 p-4 border border-border-default rounded-xl bg-surface-2">
            <h4 className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-3 flex items-center">
              <Target className="h-3.5 w-3.5 mr-1.5 text-accent-color" />
              Intent Distribution
            </h4>
            {loading ? (
              <div className="animate-pulse space-y-2.5">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n}>
                    <div className="flex justify-between mb-1">
                      <div className="h-2 bg-muted rounded w-20" />
                      <div className="h-2 bg-muted rounded w-4" />
                    </div>
                    <div className="h-1.5 bg-muted rounded-full w-full" />
                  </div>
                ))}
              </div>
            ) : !intentDist.length ? (
              <EmptyState message="No intent data available." />
            ) : (
              <div className="space-y-2.5">
                {intentDist.slice(0, 5).map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between text-[10px] font-semibold text-text-primary mb-1">
                      <span>{item.label}</span>
                      <span className="tabular-nums">{item.count}</span>
                    </div>
                    <div className="h-1.5 w-full bg-surface-0 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent-color rounded-full transition-all duration-500"
                        style={{ width: `${Math.round((item.count / intentMax) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
            <p className="text-[9px] text-text-muted font-semibold mt-3 leading-relaxed">
              Based on email thread analysis via Groq LLM
            </p>
          </div>

          {/* Recent Summaries */}
          <div className="col-span-12 lg:col-span-4 p-4 border border-border-default rounded-xl bg-surface-2">
            <h4 className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-3 flex items-center">
              <MessageSquare className="h-3.5 w-3.5 mr-1.5 text-accent-color" />
              Recent Summaries
            </h4>
            {loading ? (
              <div className="animate-pulse space-y-2.5">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="p-2.5 bg-surface-1 border border-border-default rounded-lg">
                    <div className="flex justify-between mb-1">
                      <div className="h-2.5 bg-muted rounded w-20" />
                      <div className="flex gap-1">
                        <div className="h-2.5 bg-muted rounded w-10" />
                        <div className="h-2.5 bg-muted rounded w-12" />
                      </div>
                    </div>
                    <div className="h-2 bg-muted rounded w-full mt-1" />
                    <div className="h-2 bg-muted rounded w-24 mt-1" />
                  </div>
                ))}
              </div>
            ) : !recentSummaries.length ? (
              <EmptyState message="No conversations available." />
            ) : (
              <div className="space-y-2.5">
                {recentSummaries.map((item) => (
                  <RecentSummaryCard key={item.id} item={item} onNavigate={onTabChange} />
                ))}
              </div>
            )}
            <div className="mt-3 pt-3 border-t border-border-default">
              <p className="text-[9px] text-accent-color font-semibold flex items-center">
                <Sparkles className="h-3 w-3 mr-1" />
                Powered by {conv?.powered_by ?? 'Groq (llama-3.1-8b-instant)'}
              </p>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
