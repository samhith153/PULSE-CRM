'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Target,
  Loader2,
  Plus,
  Pencil,
  Trash2,
  IndianRupee,
  BarChart3,
  Zap,
} from 'lucide-react';
import { toast } from '@/lib/toast';
import {
  getCurrentTargets,
  createSalesTarget,
  updateSalesTarget,
  deleteSalesTarget,
  SalesTargetData,
  getUsers,
  UserData,
} from '@/utils/api';

/* ΓöÇΓöÇ Helpers ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */

function getPeriodDates(
  periodType: string,
): { period_start: string; period_end: string } {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);

  switch (periodType) {
    case 'quarterly': {
      const qStartMonth = Math.floor(now.getMonth() / 3) * 3;
      start.setMonth(qStartMonth, 1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(qStartMonth + 3, 0);
      end.setHours(23, 59, 59, 999);
      break;
    }
    case 'yearly': {
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(11, 31);
      end.setHours(23, 59, 59, 999);
      break;
    }
    default: {
      // monthly
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(now.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
      break;
    }
  }

  return {
    period_start: start.toISOString().slice(0, 10),
    period_end: end.toISOString().slice(0, 10),
  };
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const AVATAR_COLORS = [
  { bg: '#EDE9FE', text: '#7C3AED' },
  { bg: '#DBEAFE', text: '#2563EB' },
  { bg: '#D1FAE5', text: '#059669' },
  { bg: '#FEF3C7', text: '#D97706' },
  { bg: '#FCE7F3', text: '#DB2777' },
  { bg: '#E0E7FF', text: '#4F46E5' },
  { bg: '#CFFAFE', text: '#0891B2' },
  { bg: '#FEE2E2', text: '#DC2626' },
  { bg: '#F3E8FF', text: '#9333EA' },
  { bg: '#ECFDF5', text: '#10B981' },
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  achieved: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  exceeded: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  on_track: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  behind: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
  not_started: { bg: 'bg-slate-50', text: 'text-slate-500', dot: 'bg-slate-400' },
};

const TARGET_TYPES = [
  { value: 'revenue', label: 'Revenue' },
  { value: 'deals', label: 'Deals Closed' },
  { value: 'calls', label: 'Outbound Calls' },
  { value: 'meetings', label: 'Meetings Set' },
];

const PERIOD_OPTIONS = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
];

/* ΓöÇΓöÇ Component ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */

interface ModalState {
  open: boolean;
  repId: string;
  targetType: string;
  amount: string;
  notes: string;
}

export default function TargetsView() {
  const [periodType, setPeriodType] = useState('monthly');
  const [targets, setTargets] = useState<SalesTargetData[]>([]);
  const [reps, setReps] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const [modal, setModal] = useState<ModalState>({
    open: false,
    repId: '',
    targetType: 'revenue',
    amount: '',
    notes: '',
  });
  const [editingTarget, setEditingTarget] = useState<SalesTargetData | null>(null);

  const loadTargets = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCurrentTargets(periodType);
      setTargets(data);
    } catch {
      toast.error('Failed to load sales targets.');
    } finally {
      setLoading(false);
    }
  }, [periodType]);

  useEffect(() => {
    loadTargets();
  }, [loadTargets]);

  useEffect(() => {
    getUsers(1, 100)
      .then((res) => {
        const data = Array.isArray(res) ? res : (res.data ?? []);
        setReps(data);
      })
      .catch(() => {});
  }, []);

  /* ΓöÇΓöÇ Derived metrics ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */

  const teamTarget = targets.reduce((s, t) => s + (t.target_amount || 0), 0);
  const teamActual = targets.reduce((s, t) => s + (t.actual_amount || 0), 0);
  const teamProgress = teamTarget > 0 ? Math.round((teamActual / teamTarget) * 100) : 0;
  const repsWithTargets = targets.length;

  /* ΓöÇΓöÇ Modal handlers ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */

  function openCreateModal() {
    setEditingTarget(null);
    setModal({ open: true, repId: '', targetType: 'revenue', amount: '', notes: '' });
  }

  function openEditModal(target: SalesTargetData) {
    setEditingTarget(target);
    setModal({
      open: true,
      repId: target.rep_id,
      targetType: target.target_type,
      amount: String(target.target_amount),
      notes: target.notes ?? '',
    });
  }

  function closeModal() {
    setModal({ open: false, repId: '', targetType: 'revenue', amount: '', notes: '' });
    setEditingTarget(null);
  }

  async function handleSave() {
    if (!modal.repId) {
      toast.error('Please select a sales rep.');
      return;
    }
    if (!modal.amount || Number(modal.amount) <= 0) {
      toast.error('Please enter a valid target amount.');
      return;
    }

    const { period_start, period_end } = getPeriodDates(periodType);
    setSaving(true);

    try {
      if (editingTarget?.id) {
        await updateSalesTarget(editingTarget.id, {
          target_amount: Number(modal.amount),
          notes: modal.notes || undefined,
        });
        toast.success('Target updated successfully.');
      } else {
        await createSalesTarget({
          rep_id: modal.repId,
          target_type: modal.targetType,
          target_amount: Number(modal.amount),
          period_type: periodType,
          period_start,
          period_end,
          notes: modal.notes || undefined,
        });
        toast.success('Target created successfully.');
      }
      closeModal();
      loadTargets();
    } catch {
      toast.error('Failed to save target.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(target: SalesTargetData) {
    if (!target.id) return;
    if (!window.confirm(`Delete target for ${target.rep_name}?`)) return;

    setDeleting(target.id);
    try {
      await deleteSalesTarget(target.id);
      toast.success('Target deleted.');
      loadTargets();
    } catch {
      toast.error('Failed to delete target.');
    } finally {
      setDeleting(null);
    }
  }

  /* ΓöÇΓöÇ Status helpers ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */

  function getStatusInfo(status: string) {
    const s = STATUS_STYLES[status] ?? STATUS_STYLES.not_started;
    const label = status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    return { ...s, label };
  }

  /* ΓöÇΓöÇ Render ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-sans text-foreground tracking-tight font-bold">
            Sales Targets
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-1 font-medium tracking-wide">
            Set and track revenue targets for each sales representative.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={periodType}
            onChange={(e) => setPeriodType(e.target.value)}
            className="bg-card border border-border/60 rounded-xl px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-brand-purple/30"
          >
            {PERIOD_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 bg-brand-purple text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-brand-purple/90 transition-colors cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            Set Target
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Team Target',
            value: formatCurrency(teamTarget),
            icon: Target,
            color: 'text-brand-purple',
          },
          {
            label: 'Achieved',
            value: formatCurrency(teamActual),
            icon: IndianRupee,
            color: 'text-emerald-600',
          },
          {
            label: 'Team Progress',
            value: `${teamProgress}%`,
            icon: BarChart3,
            color: 'text-blue-600',
            progress: true,
          },
          {
            label: 'Reps with Targets',
            value: String(repsWithTargets),
            icon: Zap,
            color: 'text-amber-600',
          },
        ].map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="bg-card border border-border/60 rounded-2xl p-4 space-y-2">
              <div className="flex items-center space-x-1.5 text-muted-foreground">
                <Icon className={`h-3.5 w-3.5 ${card.color}`} />
                <span className="text-[10px] font-semibold uppercase tracking-wide">
                  {card.label}
                </span>
              </div>
              <h4 className="text-lg font-bold text-foreground">{card.value}</h4>
              {card.progress && (
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(teamProgress, 100)}%` }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-card border border-border/60 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-24 text-muted-foreground text-xs font-semibold">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Loading targetsΓÇª
          </div>
        ) : targets.length === 0 ? (
          <div className="py-24 text-center text-muted-foreground text-xs font-semibold">
            No targets set for this period. Click &quot;Set Target&quot; to create one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border/60 bg-secondary/30">
                  <th className="py-3 px-5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Rep
                  </th>
                  <th className="py-3 px-4 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Target Type
                  </th>
                  <th className="py-3 px-4 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground text-right">
                    Target
                  </th>
                  <th className="py-3 px-4 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground text-right">
                    Actual
                  </th>
                  <th className="py-3 px-4 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Achieved
                  </th>
                  <th className="py-3 px-4 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Status
                  </th>
                  <th className="py-3 px-4 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="text-[13px] text-foreground">
                {targets.map((t) => {
                  const avatar = getAvatarColor(t.rep_name);
                  const initials = getInitials(t.rep_name);
                  const pct = t.achievement_pct ?? 0;
                  const status = getStatusInfo(t.status);

                  return (
                    <tr
                      key={t.id ?? t.rep_id}
                      className="border-b border-border/60 hover:bg-secondary/50 transition-colors"
                    >
                      {/* REP */}
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-3">
                          <div
                            className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold select-none"
                            style={{ backgroundColor: avatar.bg, color: avatar.text }}
                          >
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-foreground whitespace-nowrap">
                              {t.rep_name}
                            </div>
                            <div className="text-[11px] text-muted-foreground truncate">
                              {t.rep_email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* TARGET TYPE */}
                      <td className="py-3 px-4">
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          {t.target_type.replace(/_/g, ' ')}
                        </span>
                      </td>

                      {/* TARGET */}
                      <td className="py-3 px-4 text-right font-semibold tabular-nums">
                        {formatCurrency(t.target_amount)}
                      </td>

                      {/* ACTUAL */}
                      <td className="py-3 px-4 text-right font-semibold tabular-nums text-foreground">
                        {formatCurrency(t.actual_amount)}
                      </td>

                      {/* ACHIEVED */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 min-w-[120px]">
                          <div className="flex-1 bg-secondary rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all duration-500 ${
                                pct >= 100
                                  ? 'bg-emerald-500'
                                  : pct >= 70
                                  ? 'bg-blue-500'
                                  : 'bg-red-500'
                              }`}
                              style={{ width: `${Math.min(pct, 100)}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-bold tabular-nums w-10 text-right">
                            {Math.round(pct)}%
                          </span>
                        </div>
                      </td>

                      {/* STATUS */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold whitespace-nowrap ${status.bg} ${status.text}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                          {status.label}
                        </span>
                      </td>

                      {/* ACTIONS */}
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => openEditModal(t)}
                            className="p-1.5 text-muted-foreground hover:text-brand-purple hover:bg-brand-purple/10 rounded-md transition-all duration-150 cursor-pointer"
                            title="Edit Target"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(t)}
                            disabled={deleting === t.id}
                            className="p-1.5 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-md transition-all duration-150 disabled:opacity-50 cursor-pointer"
                            title="Delete Target"
                          >
                            {deleting === t.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={closeModal} />
          <div className="relative bg-card border border-border/60 rounded-2xl shadow-xl w-full max-w-md mx-4 p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground">
                {editingTarget ? 'Edit Target' : 'Set New Target'}
              </h3>
              <button
                onClick={closeModal}
                className="p-1 text-muted-foreground hover:text-foreground rounded-md transition-colors cursor-pointer"
              >
                Γ£ò
              </button>
            </div>

            {/* Rep Select */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Sales Rep
              </label>
              <select
                value={modal.repId}
                onChange={(e) => setModal((m) => ({ ...m, repId: e.target.value }))}
                disabled={!!editingTarget}
                className="w-full bg-secondary border border-border/60 rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-brand-purple/30 disabled:opacity-60"
              >
                <option value="">Select a repΓÇª</option>
                {reps.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.full_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Target Type */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Target Type
              </label>
              <select
                value={modal.targetType}
                onChange={(e) => setModal((m) => ({ ...m, targetType: e.target.value }))}
                disabled={!!editingTarget}
                className="w-full bg-secondary border border-border/60 rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-brand-purple/30 disabled:opacity-60"
              >
                {TARGET_TYPES.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Amount */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Target Amount (₹)
              </label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={modal.amount}
                  onChange={(e) => setModal((m) => ({ ...m, amount: e.target.value }))}
                  placeholder="e.g. 500000"
                  className="w-full bg-secondary border border-border/60 rounded-xl pl-9 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-brand-purple/30"
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Notes
              </label>
              <textarea
                value={modal.notes}
                onChange={(e) => setModal((m) => ({ ...m, notes: e.target.value }))}
                rows={3}
                placeholder="Optional notesΓÇª"
                className="w-full bg-secondary border border-border/60 rounded-xl px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-brand-purple/30 resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 bg-brand-purple text-white px-5 py-2 rounded-xl text-xs font-semibold hover:bg-brand-purple/90 transition-colors disabled:opacity-60 cursor-pointer"
              >
                {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {editingTarget ? 'Update Target' : 'Create Target'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
