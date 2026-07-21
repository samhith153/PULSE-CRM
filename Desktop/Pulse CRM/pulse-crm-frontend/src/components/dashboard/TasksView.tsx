'use client';

import React, { useState } from 'react';
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
  status: 'Pending' | 'Completed' | 'Overdue';
}

export default function TasksView() {
  const [tasks, setTasks] = useState<Task[]>([
    { id: 1, title: "Review TechCorp SAML integration setup details", deadline: "2025-05-13", priority: "High", status: "Overdue" },
    { id: 2, title: "Follow up with Marcus Aurelius on HIPAA files", deadline: "2025-05-15", priority: "High", status: "Pending" },
    { id: 3, title: "Send Helena Troy volumetric agency pricing tier sheet", deadline: "2025-05-16", priority: "Medium", status: "Pending" },
    { id: 4, title: "Draft Q3 forecast report template", deadline: "2025-05-18", priority: "Low", status: "Pending" },
    { id: 5, title: "Sign database security agreement contract", deadline: "2025-05-10", priority: "High", status: "Completed" }
  ]);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const [form, setForm] = useState({
    title: '', deadline: '2025-05-14', priority: 'Medium' as Task['priority'], status: 'Pending' as Task['status']
  });

  const handleToggle = (id: number) => {
    setTasks(tasks.map(t => {
      if (t.id === id) {
        const nextStatus = t.status === 'Completed' ? 'Pending' : 'Completed';
        return { ...t, status: nextStatus };
      }
      return t;
    }));
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
    setTasks([...tasks, newTask]);
    setIsAddOpen(false);
  };

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;
    setTasks(tasks.map(t => t.id === selectedTask.id ? {
      ...t,
      title: form.title,
      deadline: form.deadline,
      priority: form.priority,
      status: form.status
    } : t));
    setIsEditOpen(false);
    setSelectedTask(null);
  };

  const handleDelete = (id: number) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const overdueList = tasks.filter(t => t.status === 'Overdue');
  const pendingList = tasks.filter(t => t.status === 'Pending');
  const completedList = tasks.filter(t => t.status === 'Completed');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-brand-border-purple/20 rounded-xl p-5 shadow-sm/5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="font-sans text-2xl text-brand-heading font-bold">CRM Tasks Workspace</h2>
            <p className="text-[11px] text-brand-text/60 mt-0.5 font-bold">Track operational duties, set deadlines, and manage completion states.</p>
          </div>
          <button 
            onClick={() => {
              setForm({ title: '', deadline: '2025-05-14', priority: 'Medium', status: 'Pending' });
              setIsAddOpen(true);
            }}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-brand-accent hover:bg-brand-accent-hover text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create Task</span>
          </button>
        </div>
      </div>

      {/* Task Columns Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Overdue Column */}
        <div className="bg-slate-50/50 border border-brand-border-purple/20 rounded-xl p-4 min-h-[400px]">
          <div className="flex justify-between items-center pb-2 border-b border-brand-border-purple/15 mb-4">
            <h3 className="text-xs font-extrabold text-rose-600 uppercase tracking-wider flex items-center">
              <AlertCircle className="h-4 w-4 mr-1.5" />
              <span>Overdue Tasks</span>
            </h3>
            <span className="text-[10px] font-extrabold bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full tabular-nums">
              {overdueList.length}
            </span>
          </div>

          <div className="space-y-3">
            {overdueList.map((t) => (
              <div key={t.id} className="bg-white border border-brand-border-purple/25 rounded-lg p-3.5 shadow-sm/5 flex items-start space-x-3">
                <button onClick={() => handleToggle(t.id)} className="text-slate-400 hover:text-brand-accent mt-0.5 cursor-pointer">
                  <Circle className="h-4 w-4" />
                </button>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-brand-heading leading-snug break-words">{t.title}</h4>
                  <div className="flex items-center space-x-2 mt-2 text-[9px] font-extrabold text-slate-450">
                    <span className="text-rose-600">● {t.priority}</span>
                    <span className="flex items-center tabular-nums text-rose-600">
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
        <div className="bg-slate-50/50 border border-brand-border-purple/20 rounded-xl p-4 min-h-[400px]">
          <div className="flex justify-between items-center pb-2 border-b border-brand-border-purple/15 mb-4">
            <h3 className="text-xs font-extrabold text-brand-heading uppercase tracking-wider flex items-center">
              <Clock className="h-4 w-4 mr-1.5 text-brand-accent" />
              <span>Pending Tasks</span>
            </h3>
            <span className="text-[10px] font-extrabold bg-brand-secondary-accent/15 text-brand-accent px-2 py-0.5 rounded-full tabular-nums">
              {pendingList.length}
            </span>
          </div>

          <div className="space-y-3">
            {pendingList.map((t) => (
              <div key={t.id} className="bg-white border border-brand-border-purple/25 rounded-lg p-3.5 shadow-sm/5 flex items-start space-x-3">
                <button onClick={() => handleToggle(t.id)} className="text-slate-400 hover:text-emerald-600 mt-0.5 cursor-pointer">
                  <Circle className="h-4 w-4" />
                </button>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-brand-heading leading-snug break-words">{t.title}</h4>
                  <div className="flex justify-between items-center mt-2.5">
                    <div className="flex items-center space-x-2 text-[9px] font-extrabold text-slate-450">
                      <span className={t.priority === 'High' ? 'text-rose-600' : 'text-slate-450'}>● {t.priority}</span>
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
                        className="p-0.5 text-slate-400 hover:text-brand-heading rounded cursor-pointer"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => handleDelete(t.id)} className="p-0.5 text-slate-400 hover:text-rose-600 rounded cursor-pointer">
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
        <div className="bg-slate-50/50 border border-brand-border-purple/20 rounded-xl p-4 min-h-[400px]">
          <div className="flex justify-between items-center pb-2 border-b border-brand-border-purple/15 mb-4">
            <h3 className="text-xs font-extrabold text-emerald-600 uppercase tracking-wider flex items-center">
              <CheckCircle2 className="h-4 w-4 mr-1.5" />
              <span>Completed Tasks</span>
            </h3>
            <span className="text-[10px] font-extrabold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full tabular-nums">
              {completedList.length}
            </span>
          </div>

          <div className="space-y-3 opacity-60">
            {completedList.map((t) => (
              <div key={t.id} className="bg-white border border-brand-border-purple/25 rounded-lg p-3.5 shadow-sm/5 flex items-start space-x-3">
                <button onClick={() => handleToggle(t.id)} className="text-emerald-600 mt-0.5 cursor-pointer">
                  <CheckCircle2 className="h-4 w-4" />
                </button>
                <div className="flex-1 min-w-0 line-through">
                  <h4 className="text-xs font-bold text-slate-500 leading-snug break-words">{t.title}</h4>
                  <div className="flex items-center space-x-2 mt-2 text-[9px] font-extrabold text-slate-400">
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
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-brand-border-purple/25 rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-3.5 border-b border-brand-border-purple/15 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-brand-heading text-sm">Create New Task</h3>
              <button onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-brand-text p-1 cursor-pointer"><X className="h-4.5 w-4.5" /></button>
            </div>
            <form onSubmit={handleAdd} className="p-5 space-y-4">
              <div>
                <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Task Title</label>
                <input type="text" required value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full px-3 py-1.5 border border-brand-border-purple/35 rounded-lg text-xs text-brand-text focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Deadline</label>
                  <input type="date" required value={form.deadline} onChange={e => setForm({...form, deadline: e.target.value})} className="w-full px-3 py-1.5 border border-brand-border-purple/35 rounded-lg text-xs text-brand-text focus:outline-none cursor-pointer" />
                </div>
                <div>
                  <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Priority</label>
                  <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value as any})} className="w-full px-2 py-1.5 border border-brand-border-purple/35 bg-white text-brand-text rounded-lg text-xs cursor-pointer">
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Status Column</label>
                <select value={form.status} onChange={e => setForm({...form, status: e.target.value as any})} className="w-full px-2 py-1.5 border border-brand-border-purple/35 bg-white text-brand-text rounded-lg text-xs cursor-pointer">
                  <option>Pending</option>
                  <option>Overdue</option>
                  <option>Completed</option>
                </select>
              </div>
              <div className="pt-3 border-t border-brand-border-purple/15 flex justify-end space-x-2.5">
                <button type="button" onClick={() => setIsAddOpen(false)} className="px-4 py-1.5 border border-brand-border-purple/30 rounded-lg text-xs font-bold text-brand-text/75 hover:bg-slate-50 cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-brand-accent hover:bg-brand-accent-hover text-white rounded-lg text-xs font-bold shadow-sm/10 cursor-pointer">Create Task</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-brand-border-purple/25 rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-3.5 border-b border-brand-border-purple/15 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-brand-heading text-sm">Edit Task</h3>
              <button onClick={() => { setIsEditOpen(false); setSelectedTask(null); }} className="text-slate-400 hover:text-brand-text p-1 cursor-pointer"><X className="h-4.5 w-4.5" /></button>
            </div>
            <form onSubmit={handleEdit} className="p-5 space-y-4">
              <div>
                <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Task Title</label>
                <input type="text" required value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full px-3 py-1.5 border border-brand-border-purple/35 rounded-lg text-xs text-brand-text focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Deadline</label>
                  <input type="date" required value={form.deadline} onChange={e => setForm({...form, deadline: e.target.value})} className="w-full px-3 py-1.5 border border-brand-border-purple/35 rounded-lg text-xs text-brand-text focus:outline-none cursor-pointer" />
                </div>
                <div>
                  <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Priority</label>
                  <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value as any})} className="w-full px-2 py-1.5 border border-brand-border-purple/35 bg-white text-brand-text rounded-lg text-xs cursor-pointer">
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Status Column</label>
                <select value={form.status} onChange={e => setForm({...form, status: e.target.value as any})} className="w-full px-2 py-1.5 border border-brand-border-purple/35 bg-white text-brand-text rounded-lg text-xs cursor-pointer">
                  <option>Pending</option>
                  <option>Overdue</option>
                  <option>Completed</option>
                </select>
              </div>
              <div className="pt-3 border-t border-brand-border-purple/15 flex justify-end space-x-2.5">
                <button type="button" onClick={() => { setIsEditOpen(false); setSelectedTask(null); }} className="px-4 py-1.5 border border-brand-border-purple/30 rounded-lg text-xs font-bold text-brand-text/75 hover:bg-slate-50 cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-brand-accent hover:bg-brand-accent-hover text-white rounded-lg text-xs font-bold shadow-sm/10 cursor-pointer">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
