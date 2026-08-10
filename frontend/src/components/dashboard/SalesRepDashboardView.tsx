'use client';

import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  Calendar, 
  Users, 
  Plus, 
  Trash2, 
  Edit, 
  X,
  AlertCircle,
  Briefcase,
  Layers,
  Contact,
  Loader2
} from 'lucide-react';
import { getActivities, getLeads, Lead, ActivityTimelineItem } from '@/utils/api';

interface Task {
  id: number;
  title: string;
  deadline: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Pending' | 'Completed' | 'Overdue';
}

interface Meeting {
  id: string;
  title: string;
  time: string;
  attendees: string;
}

interface SalesRepDashboardViewProps {
  onTabChange: (tab: string) => void;
}

export default function SalesRepDashboardView({ onTabChange }: SalesRepDashboardViewProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(true);
  const [loadingMeetings, setLoadingMeetings] = useState(true);
  
  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  
  // Forms state
  const [form, setForm] = useState({
    title: '', deadline: new Date().toISOString().slice(0, 10), priority: 'Medium' as Task['priority']
  });

  // Initial load of tasks from localStorage
  useEffect(() => {
    const savedTasks = localStorage.getItem('pulse-crm-rep-tasks');
    if (savedTasks) {
      try {
        setTasks(JSON.parse(savedTasks));
      } catch {
        initializeDefaultTasks();
      }
    } else {
      initializeDefaultTasks();
    }
  }, []);

  const initializeDefaultTasks = () => {
    const defaults: Task[] = [
      { id: 1, title: "Review TechCorp SAML integration setup details", deadline: "2026-08-04", priority: "High", status: "Pending" },
      { id: 2, title: "Follow up with Marcus Aurelius on HIPAA files", deadline: "2026-08-05", priority: "High", status: "Pending" },
      { id: 3, title: "Send Helena Troy volumetric agency pricing tier sheet", deadline: "2026-08-06", priority: "Medium", status: "Pending" },
      { id: 4, title: "Draft Q3 forecast report template", deadline: "2026-08-08", priority: "Low", status: "Pending" },
      { id: 5, title: "Sign database security agreement contract", deadline: "2026-08-03", priority: "High", status: "Completed" }
    ];
    setTasks(defaults);
    saveTasks(defaults);
  };

  const saveTasks = (updated: Task[]) => {
    localStorage.setItem('pulse-crm-rep-tasks', JSON.stringify(updated));
  };

  // Fetch leads and meetings from API
  useEffect(() => {
    setLoadingLeads(true);
    getLeads()
      .then((data) => {
        // Sort leads by created_at (recency)
        const sorted = (data ?? []).sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setLeads(sorted);
      })
      .catch((err) => console.error('Error fetching leads:', err))
      .finally(() => setLoadingLeads(false));

    setLoadingMeetings(true);
    getActivities({ page_size: 50 })
      .then((data) => {
        const items: ActivityTimelineItem[] = Array.isArray(data) ? data : (data?.data ?? []);
        // Map activities to meetings
        const mapped = items
          .filter((a) => a.action === 'meeting' || a.action === 'meeting_scheduled')
          .map((a) => {
            const dt = new Date(a.created_at);
            return {
              id: a.id,
              title: a.title || 'Scheduled Meeting',
              time: dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' - ' + dt.toLocaleDateString(),
              attendees: a.entity_type || 'Client'
            };
          });
        setMeetings(mapped);
      })
      .catch((err) => console.error('Error fetching meetings:', err))
      .finally(() => setLoadingMeetings(false));
  }, []);

  const handleToggleTask = (id: number) => {
    const updated = tasks.map((t) => {
      if (t.id === id) {
        const nextStatus: Task['status'] = t.status === 'Completed' ? 'Pending' : 'Completed';
        return { ...t, status: nextStatus };
      }
      return t;
    });
    setTasks(updated);
    saveTasks(updated);
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    const newTask: Task = {
      id: Date.now(),
      title: form.title,
      deadline: form.deadline,
      priority: form.priority,
      status: 'Pending'
    };
    const updated = [newTask, ...tasks];
    setTasks(updated);
    saveTasks(updated);
    setIsAddOpen(false);
    setForm({ title: '', deadline: new Date().toISOString().slice(0, 10), priority: 'Medium' });
  };

  const handleOpenEdit = (task: Task) => {
    setSelectedTask(task);
    setForm({
      title: task.title,
      deadline: task.deadline,
      priority: task.priority
    });
    setIsEditOpen(true);
  };

  const handleEditTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !form.title.trim()) return;

    const updated = tasks.map((t) =>
      t.id === selectedTask.id
        ? {
            ...t,
            title: form.title,
            deadline: form.deadline,
            priority: form.priority
          }
        : t
    );
    setTasks(updated);
    saveTasks(updated);
    setIsEditOpen(false);
    setSelectedTask(null);
  };

  const handleDeleteTask = (id: number) => {
    if (!window.confirm('Delete this task?')) return;
    const updated = tasks.filter((t) => t.id !== id);
    setTasks(updated);
    saveTasks(updated);
  };

  // Quick Action triggers
  const triggerQuickAdd = (type: 'lead' | 'deal' | 'contact') => {
    if (type === 'lead') {
      onTabChange('leads');
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('pulse-open-create-lead-modal'));
      }, 150);
    } else if (type === 'contact') {
      onTabChange('contacts');
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('pulse-open-create-contact-modal'));
      }, 150);
    } else if (type === 'deal') {
      onTabChange('deals');
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('pulse-open-create-deal-modal'));
      }, 150);
    }
  };

  return (
    <div className="space-y-[var(--space-5)]">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-sans text-foreground tracking-tight font-bold">
            My Workspace
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-1 font-medium tracking-wide">
            Organize daily tasks, scheduled meetings, and recent lead touchpoints.
          </p>
        </div>
      </div>

      {/* Grid containing Tasks, Meetings, and Leads */}
      <div className="grid grid-cols-12 gap-[var(--space-4)] items-start">
        {/* Column 1: Tasks & Meetings */}
        <div className="col-span-12 lg:col-span-8 space-y-[var(--space-4)]">
          
          {/* Tasks Section */}
          <div className="bg-card border border-border rounded-2xl p-[var(--space-4)] space-y-[var(--space-3)]">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <h3 className="font-semibold text-foreground text-sm flex items-center">
                <CheckCircle2 className="h-4.5 w-4.5 mr-2 text-accent-color" />
                <span>My Tasks Today</span>
              </h3>
              <button
                onClick={() => setIsAddOpen(true)}
                className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-accent-color hover:bg-accent-color/90 text-primary-foreground rounded-lg text-[11px] font-bold transition cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Task</span>
              </button>
            </div>

            {tasks.filter((t) => t.status !== 'Completed').length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-xs font-semibold bg-secondary/10 rounded-xl border border-border/50">
                No tasks yet — add one to get started
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {tasks
                  .filter((t) => t.status !== 'Completed')
                  .map((task) => (
                    <div
                      key={task.id}
                      className="flex items-start justify-between py-[var(--space-2)] px-[var(--space-3)] border border-border/60 rounded-xl hover:bg-secondary/30 transition-colors"
                    >
                      <div className="flex items-start space-x-3 min-w-0">
                        <button
                          onClick={() => handleToggleTask(task.id)}
                          className="mt-0.5 text-muted-foreground hover:text-accent-color transition-colors cursor-pointer"
                        >
                          <Circle className="h-4.5 w-4.5" />
                        </button>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-foreground break-words">{task.title}</p>
                          <div className="flex items-center space-x-2.5 mt-1 text-[10px] text-muted-foreground">
                            <span className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {task.deadline}
                            </span>
                            <span
                              className={`px-1.5 py-0.25 rounded-[4px] font-bold text-[9px] ${
                                task.priority === 'High'
                                  ? 'bg-status-danger/10 text-status-danger border border-status-danger/15'
                                  : task.priority === 'Medium'
                                  ? 'bg-status-warning/10 text-status-warning border border-status-warning/15'
                                  : 'bg-slate-500/10 text-muted-foreground border border-slate-500/15'
                              }`}
                            >
                              {task.priority}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1 shrink-0 ml-2">
                        <button
                          onClick={() => handleOpenEdit(task)}
                          className="p-1 text-muted-foreground hover:text-foreground hover:bg-secondary rounded transition-colors cursor-pointer"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Meetings Section */}
          <div className="bg-card border border-border rounded-2xl p-[var(--space-4)] space-y-[var(--space-3)]">
            <div className="border-b border-border pb-2">
              <h3 className="font-semibold text-foreground text-sm flex items-center">
                <Calendar className="h-4.5 w-4.5 mr-2 text-accent-color" />
                <span>My Meetings</span>
              </h3>
            </div>

            {loadingMeetings ? (
              <div className="flex items-center justify-center py-8 text-xs text-muted-foreground">
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Loading meetings...
              </div>
            ) : meetings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-xs font-semibold bg-secondary/10 rounded-xl border border-border/50">
                No meetings scheduled for today
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto pr-1">
                {meetings.map((meeting) => (
                  <div
                    key={meeting.id}
                    className="py-[var(--space-2)] px-[var(--space-3)] border border-border/60 rounded-xl hover:shadow-nav transition duration-200 bg-secondary/10 flex flex-col justify-between space-y-[var(--space-2)]"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-foreground leading-snug">{meeting.title}</h4>
                      <p className="text-[10px] text-muted-foreground font-semibold mt-1">Client: {meeting.attendees}</p>
                    </div>
                    <div className="flex items-center text-[10px] text-accent-color font-bold">
                      <Clock className="h-3 w-3 mr-1" />
                      <span>{meeting.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Column 2: My Leads & Quick Actions */}
        <div className="col-span-12 lg:col-span-4 space-y-[var(--space-4)]">
          
          {/* Quick-add Shortcuts */}
          <div className="bg-card border border-border rounded-2xl p-[var(--space-4)] space-y-[var(--space-3)]">
            <h3 className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground/60 border-b border-border pb-1.5">
              Quick Shortcuts
            </h3>
            <div className="grid grid-cols-3 gap-2.5">
              <button
                onClick={() => triggerQuickAdd('lead')}
                className="flex flex-col items-center justify-center p-3 border border-border hover:border-accent-color/45 hover:bg-secondary/40 rounded-xl text-center cursor-pointer transition duration-200 group"
              >
                <Users className="h-5 w-5 text-muted-foreground group-hover:text-accent-color mb-1.5 transition-colors" />
                <span className="text-[10px] font-bold text-foreground">Add Lead</span>
              </button>
              <button
                onClick={() => triggerQuickAdd('deal')}
                className="flex flex-col items-center justify-center p-3 border border-border hover:border-accent-color/45 hover:bg-secondary/40 rounded-xl text-center cursor-pointer transition duration-200 group"
              >
                <Layers className="h-5 w-5 text-muted-foreground group-hover:text-accent-color mb-1.5 transition-colors" />
                <span className="text-[10px] font-bold text-foreground">Add Deal</span>
              </button>
              <button
                onClick={() => triggerQuickAdd('contact')}
                className="flex flex-col items-center justify-center p-3 border border-border hover:border-accent-color/45 hover:bg-secondary/40 rounded-xl text-center cursor-pointer transition duration-200 group"
              >
                <Contact className="h-5 w-5 text-muted-foreground group-hover:text-accent-color mb-1.5 transition-colors" />
                <span className="text-[10px] font-bold text-foreground">Add Contact</span>
              </button>
            </div>
          </div>

          {/* My Leads Section */}
          <div className="bg-card border border-border rounded-2xl p-[var(--space-4)] space-y-[var(--space-3)]">
            <div className="border-b border-border pb-2">
              <h3 className="font-semibold text-foreground text-sm flex items-center">
                <Briefcase className="h-4.5 w-4.5 mr-2 text-accent-color" />
                <span>My Leads</span>
              </h3>
            </div>

            {loadingLeads ? (
              <div className="flex items-center justify-center py-8 text-xs text-muted-foreground">
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Loading leads...
              </div>
            ) : leads.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-xs font-semibold bg-secondary/10 rounded-xl border border-border/50">
                No leads assigned yet
              </div>
            ) : (
              <div className="space-y-3.5 max-h-[380px] overflow-y-auto pr-1">
                {leads.slice(0, 5).map((lead) => (
                  <div
                    key={lead.id}
                    className="py-[var(--space-2)] px-[var(--space-3)] border border-border/60 hover:bg-secondary/30 rounded-xl flex items-center justify-between cursor-pointer transition-colors"
                    onClick={() => {
                      onTabChange('leads');
                      // Wait a brief moment for component mounting, then trigger selection
                      setTimeout(() => {
                        window.dispatchEvent(new CustomEvent('pulse-select-lead', { detail: { leadId: lead.id } }));
                      }, 150);
                    }}
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">{lead.title}</p>
                      <p className="text-[10px] text-muted-foreground/80 mt-0.5 truncate">{lead.company_name || 'Individual'}</p>
                    </div>
                    
                    <div className="flex items-center space-x-2 shrink-0">
                      <span className="text-[10px] font-bold tabular-nums text-accent-color">
                        {lead.score ? `${lead.score}%` : '—'}
                      </span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.25 rounded uppercase tracking-wider ${
                          lead.status === 'new' ? 'bg-status-success/10 text-status-success' : 'bg-secondary text-muted-foreground'
                        }`}
                      >
                        {lead.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ADD TASK MODAL */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-ink/50 backdrop-blur-sm flex items-center justify-center z-60 p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-border pb-2">
              <h3 className="font-semibold text-foreground text-sm">Add New Task</h3>
              <button onClick={() => setIsAddOpen(false)} className="text-muted-foreground hover:text-foreground cursor-pointer">
                <X className="h-4.5 w-4.5" />
              </button>
            </div>
            <form onSubmit={handleAddTask} className="space-y-4">
              <div>
                <label className="block text-[9px] font-semibold text-foreground uppercase tracking-wider mb-1">Task Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Follow up on proposal contract"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-1.5 border border-border rounded-lg text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent-color/20 bg-background"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] font-semibold text-foreground uppercase tracking-wider mb-1">Due Date</label>
                  <input
                    type="date"
                    required
                    value={form.deadline}
                    onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                    className="w-full px-3 py-1.5 border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-accent-color/20 bg-background"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-semibold text-foreground uppercase tracking-wider mb-1">Priority</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value as any })}
                    className="w-full px-2 py-1.5 border border-border bg-background text-foreground rounded-lg text-xs cursor-pointer focus:outline-none"
                  >
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                  </select>
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-2 bg-accent-color hover:bg-accent-color/90 text-primary-foreground rounded-lg text-xs font-semibold cursor-pointer"
              >
                Create Task
              </button>
            </form>
          </div>
        </div>
      )}

      {/* EDIT TASK MODAL */}
      {isEditOpen && (
        <div className="fixed inset-0 bg-ink/50 backdrop-blur-sm flex items-center justify-center z-60 p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-border pb-2">
              <h3 className="font-semibold text-foreground text-sm">Edit Task</h3>
              <button onClick={() => setIsEditOpen(false)} className="text-muted-foreground hover:text-foreground cursor-pointer">
                <X className="h-4.5 w-4.5" />
              </button>
            </div>
            <form onSubmit={handleEditTask} className="space-y-4">
              <div>
                <label className="block text-[9px] font-semibold text-foreground uppercase tracking-wider mb-1">Task Title</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-1.5 border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-accent-color/20 bg-background"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] font-semibold text-foreground uppercase tracking-wider mb-1">Due Date</label>
                  <input
                    type="date"
                    required
                    value={form.deadline}
                    onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                    className="w-full px-3 py-1.5 border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-accent-color/20 bg-background"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-semibold text-foreground uppercase tracking-wider mb-1">Priority</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value as any })}
                    className="w-full px-2 py-1.5 border border-border bg-background text-foreground rounded-lg text-xs cursor-pointer focus:outline-none"
                  >
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                  </select>
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-2 bg-accent-color hover:bg-accent-color/90 text-primary-foreground rounded-lg text-xs font-semibold cursor-pointer"
              >
                Save Changes
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
