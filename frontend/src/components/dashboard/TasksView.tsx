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
  id: string | number;
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
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const apiTasks = await getTasks();
      if (Array.isArray(apiTasks) && apiTasks.length > 0) {
        const formatted: Task[] = apiTasks.map((t: any) => ({
          id: t.id,
          title: t.title || t.name || 'Untitled Task',
          deadline: t.due_date ? new Date(t.due_date).toISOString().split('T')[0] : '2026-08-10',
          priority: t.priority === 'high' ? 'High' : t.priority === 'low' ? 'Low' : 'Medium',
          status: t.status === 'completed' ? 'Completed' : t.status === 'in_progress' ? 'In Progress' : 'Pending'
        }));
        setTasks(formatted);
        return;
      }
    } catch (err) {
      console.error('Error fetching API tasks, loading local cache:', err);
    }

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
  };

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
        <div className="bg-surface-1 border border-border-default rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Layout:</span>
            <div className="flex items-center border border-border-default rounded-lg overflow-hidden p-0.5 bg-surface-2/50 shrink-0 select-none">
              <button
                type="button"
                onClick={() => setViewMode('kanban')}
                className={`p-1.5 rounded-md transition cursor-pointer flex items-center gap-1 ${
                  viewMode === 'kanban'
                    ? 'bg-surface-1 text-accent-color shadow-sm font-bold text-[10px] uppercase'
                    : 'text-text-muted hover:text-text-primary text-[10px] uppercase font-bold'
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
                    ? 'bg-surface-1 text-accent-color shadow-sm font-bold text-[10px] uppercase'
                    : 'text-text-muted hover:text-text-primary text-[10px] uppercase font-bold'
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
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-accent-color hover:bg-accent-color/90 text-surface-0 rounded-lg text-xs font-bold transition-colors cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create Task</span>
          </button>
        </div>
      ) : (
        <div className="bg-surface-1 border border-border-default rounded-xl p-5 ">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="font-sans text-2xl text-text-primary font-bold">CRM Tasks Workspace</h2>
              <p className="text-[11px] text-text-muted/60 mt-0.5 font-bold">Track operational duties, set deadlines, and manage completion states.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center border border-border-default rounded-lg overflow-hidden p-0.5 bg-surface-2/50 shrink-0 select-none">
                <button
                  type="button"
                  onClick={() => setViewMode('kanban')}
                  className={`p-1.5 rounded-md transition cursor-pointer ${
                    viewMode === 'kanban'
                      ? 'bg-surface-1 text-accent-color shadow-sm font-bold'
                      : 'text-text-muted hover:text-text-primary'
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
                      ? 'bg-surface-1 text-accent-color shadow-sm font-bold'
                      : 'text-text-muted hover:text-text-primary'
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
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-accent-color hover:bg-accent-color/90 text-surface-0 rounded-lg text-xs font-bold transition-colors cursor-pointer"
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
        <div className="bg-surface-1 border border-border-default rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse select-none">
              <thead>
                <tr className="border-b border-border-default bg-muted/40 text-[11px] font-black uppercase text-text-primary tracking-wider">
                  <th className="py-3 px-4 text-center w-12">Done</th>
                  <th className="py-3 px-3 text-left">Task Title</th>
                  <th className="py-3 px-3 text-center w-28">Priority</th>
                  <th className="py-3 px-3 text-center w-32">Status</th>
                  <th className="py-3 px-3 text-right w-36">Deadline</th>
                  <th className="py-3 px-4 text-right w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-xs font-semibold text-text-primary">
                {tasks.length > 0 ? (
                  tasks.map((t) => {
                    const isCompleted = t.status === 'Completed';
                    const isOverdue = t.status === 'Overdue';
                    return (
                      <tr key={t.id} className={`hover:bg-surface-2/15 transition-all ${isCompleted ? 'opacity-60' : ''}`}>
                        <td className="py-3 px-4 text-center">
                          <button onClick={() => handleToggle(t.id)} className="text-text-muted hover:text-accent-color cursor-pointer transition-colors">
                            {isCompleted ? (
                              <CheckCircle2 className="h-4.5 w-4.5 text-accent-color" />
                            ) : (
                              <Circle className="h-4.5 w-4.5" />
                            )}
                          </button>
                        </td>
                        <td className={`py-3 px-3 text-left whitespace-normal break-words ${isCompleted ? 'line-through text-text-muted' : ''}`}>
                          <span className="font-bold text-text-primary">{t.title}</span>
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                            t.priority === 'High' ? 'bg-status-danger/10 text-status-danger border border-destructive/15' :
                            t.priority === 'Medium' ? 'bg-status-warning/10 text-status-warning border border-status-warning/15' :
                            'bg-surface-2 text-text-muted border border-border-default'
                          }`}>
                            {t.priority}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <span className={`px-2.5 py-0.5 rounded text-[9px] font-bold ${
                            isCompleted ? 'bg-accent-color/15 text-accent-color border border-accent-color/20' :
                            isOverdue ? 'bg-status-danger/10 text-status-danger border border-destructive/15' :
                            'bg-accent-color/10 text-accent-color border border-accent-color/15'
                          }`}>
                            {t.status}
                          </span>
                        </td>
                        <td className={`py-3 px-3 text-right font-bold tabular-nums font-mono whitespace-nowrap ${isOverdue ? 'text-status-danger' : 'text-text-muted/80'}`}>
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
                              className="p-1 text-text-muted hover:text-text-primary rounded cursor-pointer transition-colors"
                              title="Edit Task"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                            <button 
                              onClick={() => handleDelete(t.id)} 
                              className="p-1 text-text-muted hover:text-status-danger rounded cursor-pointer transition-colors"
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
                    <td colSpan={6} className="py-8 text-center text-text-muted font-semibold">
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
        <div className="bg-surface-2/50 border border-border-default rounded-xl p-4 min-h-[400px]">
          <div className="flex justify-between items-center pb-2 border-b border-border-default mb-4">
            <h3 className="text-xs font-semibold text-status-danger uppercase tracking-wider flex items-center">
              <AlertCircle className="h-4 w-4 mr-1.5" />
              <span>Overdue Tasks</span>
            </h3>
            <span className="text-[10px] font-semibold bg-status-danger/10 text-status-danger px-2 py-0.5 rounded-full tabular-nums">
              {overdueList.length}
            </span>
          </div>

          <div className="space-y-3">
            {overdueList.map((t) => (
              <div key={t.id} className="bg-status-danger/10/70 border border-destructive/15 border-l-4 border-l-rose-500 rounded-lg p-3.5  flex items-start space-x-3">
                <button onClick={() => handleToggle(t.id)} className="text-text-muted hover:text-accent-color mt-0.5 cursor-pointer">
                  <Circle className="h-4 w-4" />
                </button>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-text-primary leading-snug break-words">{t.title}</h4>
                  <div className="flex items-center space-x-2 mt-2 text-[9px] font-semibold text-text-muted">
                    <span className="text-status-danger">● {t.priority}</span>
                    <span className="flex items-center tabular-nums text-status-danger">
                      <Clock className="h-3 w-3 mr-0.5" />
                      {t.deadline}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Column */}
        <div className="bg-surface-2/50 border border-border-default rounded-xl p-4 min-h-[400px]">
          <div className="flex justify-between items-center pb-2 border-b border-border-default mb-4">
            <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wider flex items-center">
              <Clock className="h-4 w-4 mr-1.5 text-accent-color" />
              <span>Pending Tasks</span>
            </h3>
            <span className="text-[10px] font-semibold bg-accent-color/10 text-accent-color px-2 py-0.5 rounded-full tabular-nums">
              {pendingList.length}
            </span>
          </div>

          <div className="space-y-3">
            {pendingList.map((t) => (
              <div key={t.id} className="bg-accent-color/10/40 border border-border-default border-l-4 border-l-brand-accent rounded-lg p-3.5  flex items-start space-x-3">
                <button onClick={() => handleToggle(t.id)} className="text-text-muted hover:text-accent-color mt-0.5 cursor-pointer">
                  <Circle className="h-4 w-4" />
                </button>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-text-primary leading-snug break-words">{t.title}</h4>
                  <div className="flex justify-between items-center mt-2.5">
                    <div className="flex items-center space-x-2 text-[9px] font-semibold text-text-muted">
                      <span className={t.priority === 'High' ? 'text-status-danger' : 'text-text-muted'}>● {t.priority}</span>
                      <span className="flex items-center tabular-nums">
                        <Calendar className="h-3 w-3 mr-0.5" />
                        {t.deadline}
                      </span>
                    </div>

                    <div className="flex space-x-1">
                      <button 
                        onClick={() => {
                          setSelectedTask(t);
                          setForm({ title: t.title, deadline: t.deadline, priority: t.priority, status: t.status });
                          setIsEditOpen(true);
                        }}
                        className="p-0.5 text-text-muted hover:text-text-primary rounded cursor-pointer"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => handleDelete(t.id)} className="p-0.5 text-text-muted hover:text-status-danger rounded cursor-pointer">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Completed Column */}
        <div className="bg-surface-2/50 border border-border-default rounded-xl p-4 min-h-[400px]">
          <div className="flex justify-between items-center pb-2 border-b border-border-default mb-4">
            <h3 className="text-xs font-semibold text-accent-color uppercase tracking-wider flex items-center">
              <CheckCircle2 className="h-4 w-4 mr-1.5" />
              <span>Completed Tasks</span>
            </h3>
            <span className="text-[10px] font-semibold bg-accent-color/15 text-accent-color px-2 py-0.5 rounded-full tabular-nums">
              {completedList.length}
            </span>
          </div>

          <div className="space-y-3 opacity-60">
            {completedList.map((t) => (
              <div key={t.id} className="bg-accent-color/15/40 border border-accent-color/20 border-l-4 border-l-emerald-500 rounded-lg p-3.5  flex items-start space-x-3">
                <button onClick={() => handleToggle(t.id)} className="text-accent-color mt-0.5 cursor-pointer">
                  <CheckCircle2 className="h-4 w-4" />
                </button>
                <div className="flex-1 min-w-0 line-through">
                  <h4 className="text-xs font-bold text-text-muted leading-snug break-words">{t.title}</h4>
                  <div className="flex items-center space-x-2 mt-2 text-[9px] font-semibold text-text-muted">
                    <span>{t.priority}</span>
                    <span>Done</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        </div>
      )}

      {/* Add Task Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-surface-1 border border-border-default rounded-xl  w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-3.5 border-b border-border-default flex justify-between items-center bg-surface-2">
              <h3 className="font-bold text-text-primary text-sm">Create New Task</h3>
              <button onClick={() => setIsAddOpen(false)} className="text-text-muted hover:text-text-muted p-1 cursor-pointer"><X className="h-4.5 w-4.5" /></button>
            </div>
            <form onSubmit={handleAdd} className="p-5 space-y-4">
              <div>
                <label className="block text-[9px] font-semibold text-text-primary uppercase tracking-wider mb-1">Task Title</label>
                <input type="text" required value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full px-3 py-1.5 border border-border-default rounded-lg text-xs text-text-muted focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-semibold text-text-primary uppercase tracking-wider mb-1">Deadline</label>
                  <input type="date" required value={form.deadline} onChange={e => setForm({...form, deadline: e.target.value})} className="w-full px-3 py-1.5 border border-border-default rounded-lg text-xs text-text-muted focus:outline-none cursor-pointer" />
                </div>
                <div>
                  <label className="block text-[9px] font-semibold text-text-primary uppercase tracking-wider mb-1">Priority</label>
                  <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value as any})} className="w-full px-2 py-1.5 border border-border-default bg-surface-1 text-text-muted rounded-lg text-xs cursor-pointer">
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[9px] font-semibold text-text-primary uppercase tracking-wider mb-1">Status Column</label>
                <select value={form.status} onChange={e => setForm({...form, status: e.target.value as any})} className="w-full px-2 py-1.5 border border-border-default bg-surface-1 text-text-muted rounded-lg text-xs cursor-pointer">
                  <option value="Pending">Pending</option>
                  <option value="Not Started">Not Started</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Overdue">Overdue</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
              <div className="pt-3 border-t border-border-default flex justify-end space-x-2.5">
                <button type="button" onClick={() => setIsAddOpen(false)} className="px-4 py-1.5 border border-border-default rounded-lg text-xs font-bold text-text-muted/75 hover:bg-surface-2 cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-accent-color hover:bg-accent-color/90 text-surface-0 rounded-lg text-xs font-bold  cursor-pointer">Create Task</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-surface-1 border border-border-default rounded-xl  w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-3.5 border-b border-border-default flex justify-between items-center bg-surface-2">
              <h3 className="font-bold text-text-primary text-sm">Edit Task</h3>
              <button onClick={() => { setIsEditOpen(false); setSelectedTask(null); }} className="text-text-muted hover:text-text-muted p-1 cursor-pointer"><X className="h-4.5 w-4.5" /></button>
            </div>
            <form onSubmit={handleEdit} className="p-5 space-y-4">
              <div>
                <label className="block text-[9px] font-semibold text-text-primary uppercase tracking-wider mb-1">Task Title</label>
                <input type="text" required value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full px-3 py-1.5 border border-border-default rounded-lg text-xs text-text-muted focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-semibold text-text-primary uppercase tracking-wider mb-1">Deadline</label>
                  <input type="date" required value={form.deadline} onChange={e => setForm({...form, deadline: e.target.value})} className="w-full px-3 py-1.5 border border-border-default rounded-lg text-xs text-text-muted focus:outline-none cursor-pointer" />
                </div>
                <div>
                  <label className="block text-[9px] font-semibold text-text-primary uppercase tracking-wider mb-1">Priority</label>
                  <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value as any})} className="w-full px-2 py-1.5 border border-border-default bg-surface-1 text-text-muted rounded-lg text-xs cursor-pointer">
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[9px] font-semibold text-text-primary uppercase tracking-wider mb-1">Status Column</label>
                <select value={form.status} onChange={e => setForm({...form, status: e.target.value as any})} className="w-full px-2 py-1.5 border border-border-default bg-surface-1 text-text-muted rounded-lg text-xs cursor-pointer">
                  <option value="Pending">Pending</option>
                  <option value="Not Started">Not Started</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Overdue">Overdue</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
              <div className="pt-3 border-t border-border-default flex justify-end space-x-2.5">
                <button type="button" onClick={() => { setIsEditOpen(false); setSelectedTask(null); }} className="px-4 py-1.5 border border-border-default rounded-lg text-xs font-bold text-text-muted/75 hover:bg-surface-2 cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-accent-color hover:bg-accent-color/90 text-surface-0 rounded-lg text-xs font-bold  cursor-pointer">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
