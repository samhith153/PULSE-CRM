'use client';

import React, { useState, useEffect } from 'react';
import {
  Plus,
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  X,
  Edit,
  Trash2,
  Calendar,
  List,
  LayoutGrid
} from 'lucide-react';
import type { ActivityTimelineItem } from '@/utils/api';

interface Task {
  id: number;
  title: string;
  deadline: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Pending' | 'Completed' | 'Overdue' | 'Not Started' | 'In Progress';
}

function activityToTask(activity: ActivityTimelineItem): Task {
  const payload = activity.payload as Record<string, unknown> | null;
  const deadline = typeof payload?.deadline === 'string'
    ? payload.deadline.slice(0, 10)
    : activity.created_at.slice(0, 10);
  const priority = payload?.priority === 'High' || payload?.priority === 'Low' || payload?.priority === 'Medium'
    ? payload.priority
    : 'Medium';
  return {
    id: Number(activity.id) || Date.now(),
    title: activity.title,
    deadline,
    priority,
    status: 'Pending',
  };
}

function getSourceTaskId(activity: ActivityTimelineItem): string | null {
  const source = activity.payload?.source_task_id;
  return typeof source === 'string' && source ? source : null;
}

function getTaskRootId(activity: ActivityTimelineItem, byId: Map<string, ActivityTimelineItem>): string {
  const seen = new Set<string>();
  let current = activity;

  while (!seen.has(current.id)) {
    seen.add(current.id);
    const sourceId = getSourceTaskId(current);
    const source = sourceId ? byId.get(sourceId) : null;
    if (!source) return sourceId || current.id;
    current = source;
  }

  return current.id;
}

function latestTasksFromActivities(items: ActivityTimelineItem[]): Task[] {
  const byId = new Map(items.map(item => [item.id, item]));
  const latestByRoot = new Map<string, ActivityTimelineItem>();

  items.forEach((item) => {
    const rootId = getTaskRootId(item, byId);
    const existing = latestByRoot.get(rootId);
    if (!existing || new Date(item.created_at).getTime() >= new Date(existing.created_at).getTime()) {
      latestByRoot.set(rootId, item);
    }
  });

  return Array.from(latestByRoot.values())
    .map(activityToTask)
    .sort((a, b) => a.deadline.localeCompare(b.deadline));
}

interface Props {
  isEmbedded?: boolean;
}

export default function TasksView({ isEmbedded = false }: Props) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [form, setForm] = useState({
    title: '', deadline: '2026-08-04', priority: 'Medium' as Task['priority'], status: 'Pending' as Task['status']
  });

  useEffect(() => {
    const saved = localStorage.getItem('pulse-crm-manual-tasks');
    if (saved) {
      try {
        setTasks(JSON.parse(saved));
      } catch {
        initializeDefaultTasks();
      }
    } else {
      initializeDefaultTasks();
    }
  }, []);

  const initializeDefaultTasks = () => {
    const defaults: Task[] = [
      { id: 1, title: "Register for upcoming CRM Webinars", deadline: "2026-08-03", priority: "Medium", status: "Not Started" },
      { id: 2, title: "Refer CRM Videos", deadline: "2026-08-05", priority: "Medium", status: "In Progress" },
      { id: 3, title: "Competitor Comparison Document", deadline: "2026-08-01", priority: "High", status: "Not Started" },
      { id: 4, title: "Get Approval from Manager", deadline: "2026-08-02", priority: "High", status: "Not Started" },
      { id: 5, title: "Get Approval from Manager", deadline: "2026-08-04", priority: "Medium", status: "In Progress" },
      { id: 6, title: "Get Approval from Manager", deadline: "2026-08-04", priority: "Medium", status: "In Progress" }
    ];
    setTasks(defaults);
    localStorage.setItem('pulse-crm-manual-tasks', JSON.stringify(defaults));
  };

  const saveTasks = (updated: Task[]) => {
    setTasks(updated);
    localStorage.setItem('pulse-crm-manual-tasks', JSON.stringify(updated));
  };

  useEffect(() => {
    const handleOpen = () => {
      setForm({ title: '', deadline: '2026-08-04', priority: 'Medium', status: 'Pending' });
      setIsAddOpen(true);
    };
    window.addEventListener('pulse-open-create-task-modal', handleOpen);
    return () => window.removeEventListener('pulse-open-create-task-modal', handleOpen);
  }, []);

  const handleToggle = (id: number) => {
    const updated = tasks.map(t => {
      if (t.id === id) {
        const nextStatus = t.status === 'Completed' ? 'Pending' : 'Completed';
        return { ...t, status: nextStatus as any };
      }
      return t;
    });
    saveTasks(updated);
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const newTask: Task = {
      id: Date.now(),
      title: form.title,
      deadline: form.deadline,
      priority: form.priority,
      status: form.status
    };
    const updated = [...tasks, newTask];
    saveTasks(updated);
    setIsAddOpen(false);
  };

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;
    const updated = tasks.map(t => t.id === selectedTask.id ? {
      ...t,
      title: form.title,
      deadline: form.deadline,
      priority: form.priority,
      status: form.status
    } : t);
    saveTasks(updated);
    setIsEditOpen(false);
    setSelectedTask(null);
  };

  const handleDelete = (id: number) => {
    const updated = tasks.filter(t => t.id !== id);
    saveTasks(updated);
  };

  const overdueList = tasks.filter(t => t.status === 'Overdue');
  const pendingList = tasks.filter(t => t.status === 'Pending' || t.status === 'Not Started' || t.status === 'In Progress');
  const completedList = tasks.filter(t => t.status === 'Completed');

  return (
    <div className="space-y-6">
      {/* Header / Toolbar */}
      {isEmbedded ? (
        <div className="bg-card border border-border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Layout:</span>
            <div className="flex items-center border border-border rounded-lg overflow-hidden p-0.5 bg-secondary/50 shrink-0 select-none">
              <button
                type="button"
                onClick={() => setViewMode('kanban')}
                className={`p-1.5 rounded-md transition cursor-pointer flex items-center gap-1 ${
                  viewMode === 'kanban'
                    ? 'bg-card text-brand-purple shadow-sm font-bold text-[10px] uppercase'
                    : 'text-muted-foreground hover:text-foreground text-[10px] uppercase font-bold'
                }`}
                title="Kanban Board"
              >
                <LayoutGrid size={12} />
                <span>Kanban</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md transition cursor-pointer flex items-center gap-1 ${
                  viewMode === 'list'
                    ? 'bg-card text-brand-purple shadow-sm font-bold text-[10px] uppercase'
                    : 'text-muted-foreground hover:text-foreground text-[10px] uppercase font-bold'
                }`}
                title="List View"
              >
                <List size={12} />
                <span>List</span>
              </button>
            </div>
          </div>
          <button 
            onClick={() => {
              setForm({ title: '', deadline: '2026-08-04', priority: 'Medium', status: 'Pending' });
              setIsAddOpen(true);
            }}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-brand-purple hover:bg-brand-purple/90 text-primary-foreground rounded-lg text-xs font-bold transition-colors cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create Task</span>
          </button>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl p-5 ">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="font-sans text-2xl text-foreground font-bold">CRM Tasks Workspace</h2>
              <p className="text-[11px] text-muted-foreground/60 mt-0.5 font-bold">Track operational duties, set deadlines, and manage completion states.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center border border-border rounded-lg overflow-hidden p-0.5 bg-secondary/50 shrink-0 select-none">
                <button
                  type="button"
                  onClick={() => setViewMode('kanban')}
                  className={`p-1.5 rounded-md transition cursor-pointer ${
                    viewMode === 'kanban'
                      ? 'bg-card text-brand-purple shadow-sm font-bold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  title="Kanban Board"
                >
                  <LayoutGrid size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-md transition cursor-pointer ${
                    viewMode === 'list'
                      ? 'bg-card text-brand-purple shadow-sm font-bold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  title="List View"
                >
                  <List size={14} />
                </button>
              </div>
              <button 
                onClick={() => {
                  setForm({ title: '', deadline: '2026-08-04', priority: 'Medium', status: 'Pending' });
                  setIsAddOpen(true);
                }}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-brand-purple hover:bg-brand-purple/90 text-primary-foreground rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Create Task</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content View Switcher */}
      {viewMode === 'list' ? (
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse select-none">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-[11px] font-black uppercase text-foreground tracking-wider">
                  <th className="py-3 px-4 text-center w-12">Done</th>
                  <th className="py-3 px-3 text-left">Task Title</th>
                  <th className="py-3 px-3 text-center w-28">Priority</th>
                  <th className="py-3 px-3 text-center w-32">Status</th>
                  <th className="py-3 px-3 text-right w-36">Deadline</th>
                  <th className="py-3 px-4 text-right w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-xs font-semibold text-foreground">
                {tasks.length > 0 ? (
                  tasks.map((t) => {
                    const isCompleted = t.status === 'Completed';
                    const isOverdue = t.status === 'Overdue';
                    return (
                      <tr key={t.id} className={`hover:bg-secondary/15 transition-all ${isCompleted ? 'opacity-60' : ''}`}>
                        <td className="py-3 px-4 text-center">
                          <button onClick={() => handleToggle(t.id)} className="text-muted-foreground hover:text-brand-purple cursor-pointer transition-colors">
                            {isCompleted ? (
                              <CheckCircle2 className="h-4.5 w-4.5 text-brand-cyan" />
                            ) : (
                              <Circle className="h-4.5 w-4.5" />
                            )}
                          </button>
                        </td>
                        <td className={`py-3 px-3 text-left whitespace-normal break-words ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                          <span className="font-bold text-foreground">{t.title}</span>
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                            t.priority === 'High' ? 'bg-destructive/10 text-destructive border border-destructive/15' :
                            t.priority === 'Medium' ? 'bg-amber-500/10 text-amber-600 border border-amber-500/15' :
                            'bg-secondary text-muted-foreground border border-border'
                          }`}>
                            {t.priority}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <span className={`px-2.5 py-0.5 rounded text-[9px] font-bold ${
                            isCompleted ? 'bg-brand-cyan/15 text-brand-cyan border border-brand-cyan/20' :
                            isOverdue ? 'bg-destructive/10 text-destructive border border-destructive/15' :
                            'bg-brand-purple/10 text-brand-purple border border-brand-purple/15'
                          }`}>
                            {t.status}
                          </span>
                        </td>
                        <td className={`py-3 px-3 text-right font-bold tabular-nums font-mono whitespace-nowrap ${isOverdue ? 'text-destructive' : 'text-muted-foreground/80'}`}>
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {t.deadline}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex justify-end gap-1.5">
                            <button 
                              onClick={() => {
                                setSelectedTask(t);
                                setForm({ title: t.title, deadline: t.deadline, priority: t.priority, status: t.status });
                                setIsEditOpen(true);
                              }}
                              className="p-1 text-muted-foreground hover:text-foreground rounded cursor-pointer transition-colors"
                              title="Edit Task"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                            <button 
                              onClick={() => handleDelete(t.id)} 
                              className="p-1 text-muted-foreground hover:text-destructive rounded cursor-pointer transition-colors"
                              title="Delete Task"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground font-semibold">
                      No tasks found. Click "Create Task" to add one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Task Columns Grid */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Overdue Column */}
          <div className="bg-card border border-border rounded-xl p-4 min-h-[400px]">
            <div className="flex justify-between items-center pb-3 border-b border-border/60 mb-4">
              <h3 className="text-[10px] font-bold text-rose-500 uppercase tracking-wider flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>Overdue Tasks</span>
              </h3>
              <span className="text-[10px] font-bold bg-rose-50 text-rose-500 px-2 py-0.5 rounded-full tabular-nums">
                {overdueList.length}
              </span>
            </div>

            <div className="space-y-3">
              {overdueList.map((t) => (
                <div key={t.id} className="bg-card border border-border/80 rounded-lg p-3 hover:shadow-sm transition-shadow cursor-pointer">
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <h4 className="text-[11px] font-bold text-foreground leading-snug break-words">{t.title}</h4>
                    <span className="text-[9px] font-bold bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded border border-rose-100 shrink-0">
                      Overdue
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-3">
                    <span className="flex items-center text-[10px] font-semibold text-rose-600">
                      <Calendar className="h-3 w-3 mr-1.5 opacity-80" />
                      Due {t.deadline}
                    </span>
                    <div className="w-5 h-5 rounded-full bg-secondary border border-border flex items-center justify-center text-[8px] font-bold text-muted-foreground shrink-0">
                      SR
                    </div>
                  </div>
                </div>
              ))}
              <button className="text-[10px] font-bold text-rose-500 hover:underline pt-2 w-full text-left">
                + View all overdue tasks
              </button>
            </div>
          </div>

          {/* Pending Column */}
          <div className="bg-card border border-border rounded-xl p-4 min-h-[400px]">
            <div className="flex justify-between items-center pb-3 border-b border-border/60 mb-4">
              <h3 className="text-[10px] font-bold text-brand-purple uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                <span>Pending Tasks</span>
              </h3>
              <span className="text-[10px] font-bold bg-brand-purple/10 text-brand-purple px-2 py-0.5 rounded-full tabular-nums">
                {pendingList.length}
              </span>
            </div>

            <div className="space-y-3">
              {pendingList.map((t, idx) => (
                <div key={t.id} className="bg-card border border-border/80 rounded-lg p-3 hover:shadow-sm transition-shadow cursor-pointer">
                  <h4 className="text-[11px] font-bold text-foreground leading-snug break-words mb-2.5 pr-8">{t.title}</h4>
                  <div className="flex justify-between items-center mt-3">
                    <span className="flex items-center text-[10px] font-semibold text-muted-foreground">
                      <Calendar className="h-3 w-3 mr-1.5 opacity-70" />
                      Due {t.deadline}
                    </span>
                    <div className="w-5 h-5 rounded-full bg-secondary border border-border flex items-center justify-center text-[8px] font-bold text-muted-foreground shrink-0">
                      {idx % 2 === 0 ? 'SR' : idx % 3 === 0 ? 'PJ' : 'AK'}
                    </div>
                  </div>
                </div>
              ))}
              <button className="text-[10px] font-bold text-brand-purple hover:underline pt-2 w-full text-left">
                + View all pending tasks
              </button>
            </div>
          </div>

          {/* Completed Column */}
          <div className="bg-card border border-border rounded-xl p-4 min-h-[400px]">
            <div className="flex justify-between items-center pb-3 border-b border-border/60 mb-4">
              <h3 className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Completed Tasks</span>
              </h3>
              <span className="text-[10px] font-bold bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full tabular-nums">
                {completedList.length}
              </span>
            </div>

            <div className="space-y-3">
              {completedList.map((t, idx) => (
                <div key={t.id} className="bg-card border border-border/80 rounded-lg p-3 hover:shadow-sm transition-shadow cursor-pointer relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-emerald-500 opacity-20"></div>
                  <div className="flex items-start gap-2 mb-2.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <h4 className="text-[11px] font-bold text-foreground leading-snug break-words">{t.title}</h4>
                  </div>
                  <div className="flex justify-between items-center mt-3 pl-5">
                    <span className="flex items-center text-[10px] font-semibold text-muted-foreground">
                      <Calendar className="h-3 w-3 mr-1.5 opacity-70" />
                      Completed on {t.deadline}
                    </span>
                    <div className="w-5 h-5 rounded-full bg-secondary border border-border flex items-center justify-center text-[8px] font-bold text-muted-foreground shrink-0">
                      {idx % 2 === 0 ? 'SR' : idx % 3 === 0 ? 'PJ' : 'AK'}
                    </div>
                  </div>
                </div>
              ))}
              <button className="text-[10px] font-bold text-emerald-500 hover:underline pt-2 w-full text-left">
                + View all completed tasks
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-xl  w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-3.5 border-b border-border flex justify-between items-center bg-secondary">
              <h3 className="font-bold text-foreground text-sm">Create New Task</h3>
              <button onClick={() => setIsAddOpen(false)} className="text-muted-foreground hover:text-muted-foreground p-1 cursor-pointer"><X className="h-4.5 w-4.5" /></button>
            </div>
            <form onSubmit={handleAdd} className="p-5 space-y-4">
              <div>
                <label className="block text-[9px] font-semibold text-foreground uppercase tracking-wider mb-1">Task Title</label>
                <input type="text" required value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full px-3 py-1.5 border border-border rounded-lg text-xs text-muted-foreground focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-semibold text-foreground uppercase tracking-wider mb-1">Deadline</label>
                  <input type="date" required value={form.deadline} onChange={e => setForm({...form, deadline: e.target.value})} className="w-full px-3 py-1.5 border border-border rounded-lg text-xs text-muted-foreground focus:outline-none cursor-pointer" />
                </div>
                <div>
                  <label className="block text-[9px] font-semibold text-foreground uppercase tracking-wider mb-1">Priority</label>
                  <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value as any})} className="w-full px-2 py-1.5 border border-border bg-card text-muted-foreground rounded-lg text-xs cursor-pointer">
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[9px] font-semibold text-foreground uppercase tracking-wider mb-1">Status Column</label>
                <select value={form.status} onChange={e => setForm({...form, status: e.target.value as any})} className="w-full px-2 py-1.5 border border-border bg-card text-muted-foreground rounded-lg text-xs cursor-pointer">
                  <option value="Pending">Pending</option>
                  <option value="Not Started">Not Started</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Overdue">Overdue</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
              <div className="pt-3 border-t border-border flex justify-end space-x-2.5">
                <button type="button" onClick={() => setIsAddOpen(false)} className="px-4 py-1.5 border border-border rounded-lg text-xs font-bold text-muted-foreground/75 hover:bg-secondary cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-brand-purple hover:bg-brand-purple/90 text-primary-foreground rounded-lg text-xs font-bold  cursor-pointer">Create Task</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-xl  w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-3.5 border-b border-border flex justify-between items-center bg-secondary">
              <h3 className="font-bold text-foreground text-sm">Edit Task</h3>
              <button onClick={() => { setIsEditOpen(false); setSelectedTask(null); }} className="text-muted-foreground hover:text-muted-foreground p-1 cursor-pointer"><X className="h-4.5 w-4.5" /></button>
            </div>
            <form onSubmit={handleEdit} className="p-5 space-y-4">
              <div>
                <label className="block text-[9px] font-semibold text-foreground uppercase tracking-wider mb-1">Task Title</label>
                <input type="text" required value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full px-3 py-1.5 border border-border rounded-lg text-xs text-muted-foreground focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-semibold text-foreground uppercase tracking-wider mb-1">Deadline</label>
                  <input type="date" required value={form.deadline} onChange={e => setForm({...form, deadline: e.target.value})} className="w-full px-3 py-1.5 border border-border rounded-lg text-xs text-muted-foreground focus:outline-none cursor-pointer" />
                </div>
                <div>
                  <label className="block text-[9px] font-semibold text-foreground uppercase tracking-wider mb-1">Priority</label>
                  <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value as any})} className="w-full px-2 py-1.5 border border-border bg-card text-muted-foreground rounded-lg text-xs cursor-pointer">
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[9px] font-semibold text-foreground uppercase tracking-wider mb-1">Status Column</label>
                <select value={form.status} onChange={e => setForm({...form, status: e.target.value as any})} className="w-full px-2 py-1.5 border border-border bg-card text-muted-foreground rounded-lg text-xs cursor-pointer">
                  <option value="Pending">Pending</option>
                  <option value="Not Started">Not Started</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Overdue">Overdue</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
              <div className="pt-3 border-t border-border flex justify-end space-x-2.5">
                <button type="button" onClick={() => { setIsEditOpen(false); setSelectedTask(null); }} className="px-4 py-1.5 border border-border rounded-lg text-xs font-bold text-muted-foreground/75 hover:bg-secondary cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-brand-purple hover:bg-brand-purple/90 text-primary-foreground rounded-lg text-xs font-bold  cursor-pointer">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
