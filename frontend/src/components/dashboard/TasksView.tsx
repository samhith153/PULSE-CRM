'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Plus,
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  X,
  Calendar,
  Loader2
} from 'lucide-react';
import { createActivity, getActivities, type ActivityTimelineItem } from '@/utils/api';
import { toast } from '@/lib/toast';

interface Task {
  id: string;
  title: string;
  deadline: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Pending' | 'Completed' | 'Overdue';
  description?: string | null;
}

const today = new Date().toISOString().slice(0, 10);

function normalizeStatus(value: unknown, deadline: string): Task['status'] {
  const raw = String(value || '').toLowerCase();
  if (raw === 'completed') return 'Completed';
  if (raw === 'overdue') return 'Overdue';
  if (deadline && deadline < today) return 'Overdue';
  return 'Pending';
}

function activityToTask(activity: ActivityTimelineItem): Task {
  const payload = activity.payload || {};
  const deadline = String(payload.deadline || payload.due_date || activity.created_at.slice(0, 10));
  const priority = String(payload.priority || 'Medium');

  return {
    id: activity.id,
    title: activity.title,
    deadline,
    priority: priority === 'High' || priority === 'Low' ? priority : 'Medium',
    status: normalizeStatus(payload.status, deadline),
    description: activity.description
  };
}

export default function TasksView() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const [form, setForm] = useState({
    title: '',
    deadline: today,
    priority: 'Medium' as Task['priority'],
    status: 'Pending' as Task['status'],
    description: ''
  });

  const loadTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const [openTasks, completedTasks] = await Promise.all([
        getActivities({ page_size: 100, activity_type: 'task' }),
        getActivities({ page_size: 100, activity_type: 'task_completed' })
      ]);
      const completedSourceIds = new Set(completedTasks.data.map(item => String(item.payload?.source_task_id || '')).filter(Boolean));
      const activeItems = openTasks.data.filter(item => !completedSourceIds.has(item.id));
      setTasks([...activeItems, ...completedTasks.data].map(activityToTask));
    } catch (e: any) {
      setTasks([]);
      setError(e?.message || 'Live tasks could not be loaded.');
      toast.error(e?.message || 'Live tasks could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleToggle = async (task: Task) => {
    const nextStatus: Task['status'] = task.status === 'Completed' ? 'Pending' : 'Completed';
    setSaving(true);
    try {
      await createActivity({
        entity_type: 'task',
        entity_id: crypto.randomUUID(),
        action: nextStatus === 'Completed' ? 'task_completed' : 'task',
        title: task.title,
        description: task.description || null,
        payload: {
          source_task_id: task.id,
          deadline: task.deadline,
          priority: task.priority,
          status: nextStatus
        }
      });
      await loadTasks();
      toast.success(nextStatus === 'Completed' ? 'Task marked complete.' : 'Task reopened.');
    } catch (e: any) {
      toast.error(e?.message || 'Task status could not be updated.');
    } finally {
      setSaving(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = form.title.trim();
    if (!title) {
      setError('Task title is required.');
      return;
    }
    if (!form.deadline) {
      setError('Deadline is required.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await createActivity({
        entity_type: 'task',
        entity_id: crypto.randomUUID(),
        action: form.status === 'Completed' ? 'task_completed' : 'task',
        title,
        description: form.description.trim() || null,
        payload: {
          deadline: form.deadline,
          priority: form.priority,
          status: form.status
        }
      });
      await loadTasks();
      setIsAddOpen(false);
      setForm({ title: '', deadline: today, priority: 'Medium', status: 'Pending', description: '' });
      toast.success('Task created successfully.');
    } catch (e: any) {
      setError(e?.message || 'Failed to create task.');
      toast.error(e?.message || 'Failed to create task.');
    } finally {
      setSaving(false);
    }
  };

  const overdueList = useMemo(() => tasks.filter(t => t.status === 'Overdue'), [tasks]);
  const pendingList = useMemo(() => tasks.filter(t => t.status === 'Pending'), [tasks]);
  const completedList = useMemo(() => tasks.filter(t => t.status === 'Completed'), [tasks]);

  const renderTask = (t: Task, tone: 'overdue' | 'pending' | 'completed') => (
    <div key={t.id} className={`${tone === 'overdue' ? 'bg-rose-50/70 border-rose-100 border-l-rose-500' : tone === 'completed' ? 'bg-emerald-50/40 border-emerald-100 border-l-emerald-500' : 'bg-indigo-50/40 border-brand-border-purple/20 border-l-brand-accent'} border border-l-4 rounded-lg p-3.5 shadow-sm/5 flex items-start space-x-3`}>
      <button disabled={saving} onClick={() => handleToggle(t)} className={`${tone === 'completed' ? 'text-emerald-600' : 'text-slate-400 hover:text-emerald-600'} mt-0.5 cursor-pointer disabled:opacity-50`}>
        {tone === 'completed' ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
      </button>
      <div className={`flex-1 min-w-0 ${tone === 'completed' ? 'line-through' : ''}`}>
        <h4 className={`text-xs font-bold leading-snug break-words ${tone === 'completed' ? 'text-slate-500' : 'text-brand-heading'}`}>{t.title}</h4>
        <div className="flex items-center space-x-2 mt-2 text-[9px] font-extrabold text-slate-450">
          <span className={t.priority === 'High' ? 'text-rose-600' : ''}>{t.priority}</span>
          <span className={`flex items-center tabular-nums ${tone === 'overdue' ? 'text-rose-600' : ''}`}>
            {tone === 'overdue' ? <Clock className="h-3 w-3 mr-0.5" /> : <Calendar className="h-3 w-3 mr-0.5" />}
            {tone === 'completed' ? 'Done' : t.deadline}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-white border border-brand-border-purple/20 rounded-xl p-5 shadow-sm/5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="font-sans text-2xl text-brand-heading font-bold">CRM Tasks Workspace</h2>
            <p className="text-[11px] text-brand-text/60 mt-0.5 font-bold">Track operational duties, set deadlines, and manage completion states.</p>
          </div>
          <button
            onClick={() => {
              setForm({ title: '', deadline: today, priority: 'Medium', status: 'Pending', description: '' });
              setError(null);
              setIsAddOpen(true);
            }}
            disabled={saving}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-brand-accent hover:bg-brand-accent-hover text-white rounded-lg text-xs font-bold transition-colors cursor-pointer disabled:opacity-60"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create Task</span>
          </button>
        </div>
      </div>

      {loading && (
        <div className="bg-white border border-brand-border-purple/20 rounded-xl px-4 py-3 text-xs font-bold text-brand-text/70 flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-brand-accent" />
          <span>Loading live tasks...</span>
        </div>
      )}

      {error && !isAddOpen && (
        <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-xs font-bold text-amber-800 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-slate-50/50 border border-brand-border-purple/20 rounded-xl p-4 min-h-[400px]">
          <div className="flex justify-between items-center pb-2 border-b border-brand-border-purple/15 mb-4">
            <h3 className="text-xs font-extrabold text-rose-600 uppercase tracking-wider flex items-center"><AlertCircle className="h-4 w-4 mr-1.5" /><span>Overdue Tasks</span></h3>
            <span className="text-[10px] font-extrabold bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full tabular-nums">{overdueList.length}</span>
          </div>
          <div className="space-y-3">{overdueList.map(t => renderTask(t, 'overdue'))}</div>
        </div>

        <div className="bg-slate-50/50 border border-brand-border-purple/20 rounded-xl p-4 min-h-[400px]">
          <div className="flex justify-between items-center pb-2 border-b border-brand-border-purple/15 mb-4">
            <h3 className="text-xs font-extrabold text-brand-heading uppercase tracking-wider flex items-center"><Clock className="h-4 w-4 mr-1.5 text-brand-accent" /><span>Pending Tasks</span></h3>
            <span className="text-[10px] font-extrabold bg-brand-secondary-accent/15 text-brand-accent px-2 py-0.5 rounded-full tabular-nums">{pendingList.length}</span>
          </div>
          <div className="space-y-3">{pendingList.map(t => renderTask(t, 'pending'))}</div>
        </div>

        <div className="bg-slate-50/50 border border-brand-border-purple/20 rounded-xl p-4 min-h-[400px]">
          <div className="flex justify-between items-center pb-2 border-b border-brand-border-purple/15 mb-4">
            <h3 className="text-xs font-extrabold text-emerald-600 uppercase tracking-wider flex items-center"><CheckCircle2 className="h-4 w-4 mr-1.5" /><span>Completed Tasks</span></h3>
            <span className="text-[10px] font-extrabold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full tabular-nums">{completedList.length}</span>
          </div>
          <div className="space-y-3 opacity-60">{completedList.map(t => renderTask(t, 'completed'))}</div>
        </div>
      </div>

      {isAddOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-brand-border-purple/25 rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-3.5 border-b border-brand-border-purple/15 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-brand-heading text-sm">Create New Task</h3>
              <button onClick={() => setIsAddOpen(false)} disabled={saving} className="text-slate-400 hover:text-brand-text p-1 cursor-pointer disabled:opacity-50"><X className="h-4.5 w-4.5" /></button>
            </div>
            <form onSubmit={handleAdd} className="p-5 space-y-4">
              {error && <div className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-[11px] font-bold text-amber-800">{error}</div>}
              <div>
                <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Task Title</label>
                <input type="text" required value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full px-3 py-1.5 border border-brand-border-purple/35 rounded-lg text-xs text-brand-text focus:outline-none" />
              </div>
              <div>
                <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Description</label>
                <textarea rows={2} value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full px-3 py-1.5 border border-brand-border-purple/35 rounded-lg text-xs text-brand-text focus:outline-none resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Deadline</label>
                  <input type="date" required value={form.deadline} onChange={e => setForm({...form, deadline: e.target.value})} className="w-full px-3 py-1.5 border border-brand-border-purple/35 rounded-lg text-xs text-brand-text focus:outline-none cursor-pointer" />
                </div>
                <div>
                  <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Priority</label>
                  <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value as Task['priority']})} className="w-full px-2 py-1.5 border border-brand-border-purple/35 bg-white text-brand-text rounded-lg text-xs cursor-pointer">
                    <option>High</option><option>Medium</option><option>Low</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Status Column</label>
                <select value={form.status} onChange={e => setForm({...form, status: e.target.value as Task['status']})} className="w-full px-2 py-1.5 border border-brand-border-purple/35 bg-white text-brand-text rounded-lg text-xs cursor-pointer">
                  <option>Pending</option><option>Overdue</option><option>Completed</option>
                </select>
              </div>
              <div className="pt-3 border-t border-brand-border-purple/15 flex justify-end space-x-2.5">
                <button type="button" disabled={saving} onClick={() => setIsAddOpen(false)} className="px-4 py-1.5 border border-brand-border-purple/30 rounded-lg text-xs font-bold text-brand-text/75 hover:bg-slate-50 cursor-pointer disabled:opacity-50">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-1.5 bg-brand-accent hover:bg-brand-accent-hover text-white rounded-lg text-xs font-bold shadow-sm/10 cursor-pointer disabled:opacity-60 inline-flex items-center gap-1.5">
                  {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>{saving ? 'Creating...' : 'Create Task'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

