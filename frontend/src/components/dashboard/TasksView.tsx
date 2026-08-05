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
  Calendar
} from 'lucide-react';

interface Task {
  id: number;
  title: string;
  deadline: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Pending' | 'Completed' | 'Overdue' | 'Not Started' | 'In Progress';
}

export default function TasksView() {
  const [tasks, setTasks] = useState<Task[]>([]);

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
      {/* Header */}
      <div className="bg-card border border-border rounded-xl p-5 ">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="font-sans text-2xl text-foreground font-bold">CRM Tasks Workspace</h2>
            <p className="text-[11px] text-muted-foreground/60 mt-0.5 font-bold">Track operational duties, set deadlines, and manage completion states.</p>
          </div>
          <button 
            onClick={() => {
              setForm({ title: '', deadline: '2025-05-14', priority: 'Medium', status: 'Pending' });
              setIsAddOpen(true);
            }}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-brand-purple hover:bg-brand-purple/90 text-primary-foreground rounded-lg text-xs font-bold transition-colors cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create Task</span>
          </button>
        </div>
      </div>

      {/* Task Columns Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Overdue Column */}
        <div className="bg-secondary/50 border border-border rounded-xl p-4 min-h-[400px]">
          <div className="flex justify-between items-center pb-2 border-b border-border mb-4">
            <h3 className="text-xs font-semibold text-destructive uppercase tracking-wider flex items-center">
              <AlertCircle className="h-4 w-4 mr-1.5" />
              <span>Overdue Tasks</span>
            </h3>
            <span className="text-[10px] font-semibold bg-destructive/10 text-destructive px-2 py-0.5 rounded-full tabular-nums">
              {overdueList.length}
            </span>
          </div>

          <div className="space-y-3">
            {overdueList.map((t) => (
              <div key={t.id} className="bg-destructive/10/70 border border-destructive/15 border-l-4 border-l-rose-500 rounded-lg p-3.5  flex items-start space-x-3">
                <button onClick={() => handleToggle(t.id)} className="text-muted-foreground hover:text-brand-purple mt-0.5 cursor-pointer">
                  <Circle className="h-4 w-4" />
                </button>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-foreground leading-snug break-words">{t.title}</h4>
                  <div className="flex items-center space-x-2 mt-2 text-[9px] font-semibold text-muted-foreground">
                    <span className="text-destructive">● {t.priority}</span>
                    <span className="flex items-center tabular-nums text-destructive">
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
        <div className="bg-secondary/50 border border-border rounded-xl p-4 min-h-[400px]">
          <div className="flex justify-between items-center pb-2 border-b border-border mb-4">
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center">
              <Clock className="h-4 w-4 mr-1.5 text-brand-purple" />
              <span>Pending Tasks</span>
            </h3>
            <span className="text-[10px] font-semibold bg-brand-purple/10 text-brand-purple px-2 py-0.5 rounded-full tabular-nums">
              {pendingList.length}
            </span>
          </div>

          <div className="space-y-3">
            {pendingList.map((t) => (
              <div key={t.id} className="bg-brand-purple/10/40 border border-border border-l-4 border-l-brand-accent rounded-lg p-3.5  flex items-start space-x-3">
                <button onClick={() => handleToggle(t.id)} className="text-muted-foreground hover:text-brand-cyan mt-0.5 cursor-pointer">
                  <Circle className="h-4 w-4" />
                </button>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-foreground leading-snug break-words">{t.title}</h4>
                  <div className="flex justify-between items-center mt-2.5">
                    <div className="flex items-center space-x-2 text-[9px] font-semibold text-muted-foreground">
                      <span className={t.priority === 'High' ? 'text-destructive' : 'text-muted-foreground'}>● {t.priority}</span>
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
                        className="p-0.5 text-muted-foreground hover:text-foreground rounded cursor-pointer"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => handleDelete(t.id)} className="p-0.5 text-muted-foreground hover:text-destructive rounded cursor-pointer">
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
        <div className="bg-secondary/50 border border-border rounded-xl p-4 min-h-[400px]">
          <div className="flex justify-between items-center pb-2 border-b border-border mb-4">
            <h3 className="text-xs font-semibold text-brand-cyan uppercase tracking-wider flex items-center">
              <CheckCircle2 className="h-4 w-4 mr-1.5" />
              <span>Completed Tasks</span>
            </h3>
            <span className="text-[10px] font-semibold bg-brand-cyan/15 text-brand-cyan px-2 py-0.5 rounded-full tabular-nums">
              {completedList.length}
            </span>
          </div>

          <div className="space-y-3 opacity-60">
            {completedList.map((t) => (
              <div key={t.id} className="bg-brand-cyan/15/40 border border-brand-cyan/20 border-l-4 border-l-emerald-500 rounded-lg p-3.5  flex items-start space-x-3">
                <button onClick={() => handleToggle(t.id)} className="text-brand-cyan mt-0.5 cursor-pointer">
                  <CheckCircle2 className="h-4 w-4" />
                </button>
                <div className="flex-1 min-w-0 line-through">
                  <h4 className="text-xs font-bold text-muted-foreground leading-snug break-words">{t.title}</h4>
                  <div className="flex items-center space-x-2 mt-2 text-[9px] font-semibold text-muted-foreground">
                    <span>{t.priority}</span>
                    <span>Done</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

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
