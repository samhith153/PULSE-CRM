'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatINR, asNumber } from '@/utils/api';
import {
  AlertTriangle,
  Flame,
  Clock,
  UserCheck,
  Send,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  ArrowUpRight,
  Filter,
  CheckCircle2
} from 'lucide-react';

export interface AtRiskDealItem {
  id?: string;
  deal_id?: string;
  name?: string;
  deal_name?: string;
  company?: string | null;
  owner?: string | null;
  owner_name?: string | null;
  value?: number | string;
  deal_value?: number | string;
  reason?: string;
  risk_reason?: string;
  days_since_last_activity?: number;
  daysInactive?: number;
  probability?: number;
}

interface DealsAtRiskCardProps {
  deals?: AtRiskDealItem[];
  title?: string;
  subtitle?: string;
  onSelectDeal?: (deal: AtRiskDealItem) => void;
  onNudgeOwner?: (dealName: string, ownerName: string) => void;
  className?: string;
}

export default function DealsAtRiskCard({
  deals = [],
  title = "Deals at Risk",
  subtitle = "High value opportunities requiring action",
  onSelectDeal,
  onNudgeOwner,
  className = "",
}: DealsAtRiskCardProps) {
  const [filter, setFilter] = useState<'all' | 'critical' | 'high_value'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [nudgedSet, setNudgedSet] = useState<Set<string>>(new Set());

  // Normalize deal items
  const normalizedDeals = useMemo(() => {
    return deals.map((d, index) => {
      const id = String(d.id || d.deal_id || `risk-deal-${index}`);
      const name = d.name || d.deal_name || 'Unnamed Deal';
      const company = d.company || 'Direct Client';
      const owner = d.owner || d.owner_name || 'Unassigned';
      const value = asNumber(d.value ?? d.deal_value ?? 0);
      const reason = d.reason || d.risk_reason || 'No activity > 7 days';
      const days = d.days_since_last_activity ?? d.daysInactive ?? 7;
      const probability = typeof d.probability === 'number' ? d.probability : null;

      // Severity rating based on value & days
      const isCritical = value > 500000 || days > 10 || reason.toLowerCase().includes('inactive') || reason.toLowerCase().includes('decision');

      return {
        id,
        name,
        company,
        owner,
        value,
        reason,
        days,
        probability,
        isCritical,
        raw: d,
      };
    });
  }, [deals]);

  // Filter deals based on tab selection
  const filteredDeals = useMemo(() => {
    if (filter === 'critical') {
      return normalizedDeals.filter((d) => d.isCritical);
    }
    if (filter === 'high_value') {
      return [...normalizedDeals].sort((a, b) => b.value - a.value);
    }
    return normalizedDeals;
  }, [normalizedDeals, filter]);

  const totalAtRiskValue = useMemo(() => {
    return normalizedDeals.reduce((sum, d) => sum + d.value, 0);
  }, [normalizedDeals]);

  const handleNudge = (e: React.MouseEvent, deal: typeof normalizedDeals[0]) => {
    e.stopPropagation();
    setNudgedSet((prev) => new Set(prev).add(deal.id));
    if (onNudgeOwner) {
      onNudgeOwner(deal.name, deal.owner);
    }
  };

  return (
    <div
      className={`bg-card/90 backdrop-blur-md border border-status-warning-text/20 dark:border-status-warning-text/25 rounded-[20px] p-5 shadow-sm hover:shadow-xl hover:shadow-status-warning-text/5 transition duration-300 flex flex-col justify-between relative overflow-hidden group h-full min-h-[420px] ${className}`}
    >
      {/* Background ambient warm amber aura pulse */}
      <div className="absolute -top-12 -left-12 w-36 h-36 rounded-full bg-status-warning-text/8 blur-3xl pointer-events-none group-hover:bg-status-warning-text/12 transition duration-500" />
      <div>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3.5 mb-3.5 border-b border-border/60">
          <div className="flex items-center space-x-2.5">
            <div className="relative">
              <div className="h-9 w-9 rounded-xl bg-status-warning-text/12 flex items-center justify-center text-status-warning-text dark:text-status-warning-text border border-status-warning-text/20 shadow-inner">
                <AlertTriangle size={18} className="animate-pulse" />
              </div>
              {normalizedDeals.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-warning-text opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-status-warning-text"></span>
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-foreground text-sm tracking-tight">{title}</h3>
                {normalizedDeals.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-status-warning-text/12 border border-status-warning-text/20 text-status-warning-text dark:text-status-warning-text text-[10px] font-bold tabular-nums">
                    {normalizedDeals.length}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-text-secondary font-medium">{subtitle}</p>
            </div>
          </div>

          {/* Total Value Pill */}
          {normalizedDeals.length > 0 && (
            <div className="flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-status-warning-text/10 border border-status-warning-text/20 text-status-warning-text dark:text-status-warning-text text-xs font-bold self-start sm:self-auto">
              <Flame size={13} className="text-status-warning-text animate-bounce" />
              <span>{formatINR(totalAtRiskValue)}</span>
            </div>
          )}
        </div>

        {/* Filter Toolbar */}
        {normalizedDeals.length > 0 && (
          <div className="flex items-center justify-between mb-3 text-[11px]">
            <div className="flex items-center space-x-1 bg-surface-2/40 p-0.5 rounded-lg border border-border-default">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold border transition-colors cursor-pointer select-none ${
                  filter === 'all'
                    ? 'bg-surface-1 text-text-primary border-border-default'
                    : 'border-transparent text-text-muted hover:text-text-primary hover:bg-surface-2'
                }`}
              >
                All ({normalizedDeals.length})
              </button>
              <button
                onClick={() => setFilter('critical')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold border transition-colors cursor-pointer select-none ${
                  filter === 'critical'
                    ? 'bg-destructive/15 text-destructive border-destructive/25'
                    : 'border-transparent text-text-muted hover:text-text-primary hover:bg-surface-2'
                }`}
              >
                Critical 🔥
              </button>
              <button
                onClick={() => setFilter('high_value')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold border transition-colors cursor-pointer select-none ${
                  filter === 'high_value'
                    ? 'bg-status-warning-text/15 text-status-warning-text dark:text-status-warning-text border-status-warning-text/25'
                    : 'border-transparent text-text-muted hover:text-text-primary hover:bg-surface-2'
                }`}
              >
                Top Value 💰
              </button>
            </div>

            <span className="text-[10px] text-text-secondary font-semibold hidden sm:inline">
              Sorted by urgency
            </span>
          </div>
        )}

        {/* Deals list container */}
        <div className="space-y-2.5 max-h-[280px] overflow-y-auto custom-scrollbar pr-1">
          {filteredDeals.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-10 flex flex-col items-center justify-center text-center space-y-2"
            >
              <div className="h-12 w-12 rounded-full bg-status-success-text/10 border border-status-success-text/20 flex items-center justify-center text-status-success-text shadow-inner">
                <ShieldCheck size={24} />
              </div>
              <p className="text-xs font-bold text-foreground">All deals are healthy!</p>
              <p className="text-[10px] text-text-secondary max-w-[200px]">
                No deals currently match risk escalation criteria. Great job!
              </p>
            </motion.div>
          ) : (
            <AnimatePresence mode="popLayout">
              {filteredDeals.map((deal, idx) => {
                const isExpanded = expandedId === deal.id;
                const isNudged = nudgedSet.has(deal.id);

                return (
                  <motion.div
                    key={deal.id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.25, delay: idx * 0.04 }}
                    onClick={() => {
                      setExpandedId(isExpanded ? null : deal.id);
                      if (onSelectDeal) onSelectDeal(deal.raw);
                    }}
                    className={`group/item rounded-xl p-3 border transition duration-200 cursor-pointer relative overflow-hidden ${
                      deal.isCritical
                        ? 'border-status-warning-text/30 bg-status-warning-text/8 hover:bg-status-warning-text/12 hover:border-status-warning-text/45'
                        : 'border-border/80 bg-muted/30 hover:bg-muted/60 hover:border-status-warning-text/30'
                    } ${isExpanded ? 'ring-1 ring-status-warning-text/40 shadow-md' : ''}`}
                  >
                    {/* Top Row: Name, Company, Value */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-extrabold text-foreground truncate group-hover/item:text-status-warning-text dark:group-hover/item:text-status-warning-text transition-colors">
                            {deal.name}
                          </p>
                          {deal.isCritical && (
                            <span className="shrink-0 px-1.5 py-0.2 rounded text-[8px] font-black uppercase tracking-wider bg-status-warning-text/15 text-status-warning-text dark:text-status-warning-text border border-status-warning-text/25">
                              Attention
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-text-secondary font-semibold truncate mt-0.5">
                          {deal.company}
                        </p>
                        {deal.probability !== null && (
                          <p className="text-[9px] text-text-secondary font-medium tabular-nums truncate mt-0.5">
                            {deal.days}d stalled · {deal.probability}% probability · {formatINR(deal.value)}
                          </p>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-black text-foreground tabular-nums block">
                          {formatINR(deal.value)}
                        </span>
                        <div className="flex items-center justify-end gap-1 text-[9px] text-text-secondary mt-0.5">
                          <Clock size={10} />
                          <span>{deal.days}d inactive</span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Row: Risk reason & Owner Nudge */}
                    <div className="mt-2.5 pt-2 border-t border-border/40 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between text-[10px]">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <UserCheck size={11} className="text-text-secondary shrink-0" />
                        <span className="text-text-secondary font-bold truncate">
                          {deal.owner}
                        </span>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto shrink-0">
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-status-warning-text/10 text-status-warning-text dark:text-status-warning-text border border-status-warning-text/20 truncate max-w-[150px]">
                          {deal.reason}
                        </span>

                        {/* Nudge button */}
                        <button
                          onClick={(e) => handleNudge(e, deal)}
                          title={`Send alert to ${deal.owner}`}
                          className={`px-2 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 transition shrink-0 cursor-pointer ${
                            isNudged
                              ? 'bg-status-success-bg text-status-success-text border border-status-success-text/25'
                              : 'bg-surface-1 border border-border-default hover:border-status-warning-text/50 text-text-primary hover:text-status-warning-text hover:bg-status-warning-text/10'
                          }`}
                        >
                          {isNudged ? (
                            <>
                              <CheckCircle2 size={10} />
                              <span>Nudged</span>
                            </>
                          ) : (
                            <>
                              <Send size={9} />
                              <span>Nudge</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Expanded Action Panel */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="mt-2.5 pt-2 border-t border-status-warning-text/20 text-[10px] space-y-2 bg-status-warning-text/5 -mx-3 -mb-3 p-3 rounded-b-xl"
                        >
                          <div className="flex items-center gap-1.5 text-status-warning-text dark:text-status-warning-text font-bold">
                            <Sparkles size={12} />
                            <span>AI Recommended Action:</span>
                          </div>
                          <p className="text-[10px] text-text-secondary font-medium bg-card/60 p-2 rounded-lg border border-border/50">
                            Schedule an immediate follow-up with {deal.owner} or offer an executive discount incentive to prevent deal churn.
                          </p>

                          <div className="flex justify-end gap-2 pt-1">
                            <span className="text-[10px] font-bold text-status-warning-text dark:text-status-warning-text hover:underline inline-flex items-center gap-0.5">
                              Open Deal Details <ArrowUpRight size={11} />
                            </span>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}
