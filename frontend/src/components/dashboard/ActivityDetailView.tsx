'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Edit3, 
  Trash2, 
  Save, 
  X,
  ClipboardList,
  Calendar,
  PhoneCall,
  Mail,
  FileText,
  Clock,
  Sparkles,
  Link2,
  ChevronDown,
  ChevronUp,
  User,
  Plus,
  Compass,
  TrendingUp,
  Activity as ActivityIcon
} from 'lucide-react';
import { getLeads, getContacts, getCrmActivity, CrmActivity, updateCrmTask, deleteCrmTask, updateCrmCall, deleteCrmCall, updateCrmNote, deleteCrmNote, createCrmTask } from '@/utils/api';
import ContextPanel from './ContextPanel';
import { toast } from '@/lib/toast';

interface ActivityDetailViewProps {
  id: string;
  onBack?: () => void;
  onTabChange?: (tab: string) => void;
}

export default function ActivityDetailView({ id, onBack, onTabChange }: ActivityDetailViewProps) {
  const router = useRouter();
  const [activity, setActivity] = useState<CrmActivity | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline'>('overview');
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);
  const [isAiInsightsExpanded, setIsAiInsightsExpanded] = useState(false);
  
  // Form fields for editing
  const [subject, setSubject] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [notes, setNotes] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [relatedEmail, setRelatedEmail] = useState<string | null>(null);
  const [mergedTimeline, setMergedTimeline] = useState<any[]>([]);
  const [timelineFilter, setTimelineFilter] = useState<'all' | 'timeline' | 'email' | 'call' | 'meeting'>('all');

  useEffect(() => {
    if (!activity) return;
    
    let baseTimeline: any[] = [];

    if (activity.activity_type === 'email' && (activity.details as any)?.receiver) {
      setRelatedEmail((activity.details as any).receiver);
    } else {
      setRelatedEmail(null);
    }

    const relType = activity.related_entity_type;
    const relId = activity.related_record_id;
    if (!relType || !relId) {
      setMergedTimeline(baseTimeline);
      return;
    }

    if (relType === 'lead') {
      getLeads().then((leadsList) => {
        const found = leadsList.find((l) => String(l.id) === String(relId));
        if (found) {
          if (found.contact_email) {
            setRelatedEmail(found.contact_email);
          }
          const extraLogs: any[] = [];
          if ((found as any).timeline) {
            (found as any).timeline.forEach((t: any) => {
              extraLogs.push({ action: t.title, time: t.time || new Date().toISOString(), user: 'System', desc: t.desc, type: 'timeline' });
            });
          }
          setMergedTimeline([...baseTimeline, ...extraLogs]);
        } else {
          setMergedTimeline(baseTimeline);
        }
      }).catch(() => {
        setMergedTimeline(baseTimeline);
      });
    } else if (relType === 'contact') {
      getContacts().then((contactsList) => {
        const found = contactsList.find((c) => String(c.id) === String(relId));
        if (found) {
          if (found.email) setRelatedEmail(found.email);
          const extraLogs: any[] = [];
          if ((found as any).timeline) {
            (found as any).timeline.forEach((t: any) => {
              extraLogs.push({ action: t.title, time: t.time || new Date().toISOString(), user: 'System', desc: '', type: 'timeline' });
            });
          }
          setMergedTimeline([...baseTimeline, ...extraLogs]);
        } else {
          setMergedTimeline(baseTimeline);
        }
      }).catch(() => {
        setMergedTimeline(baseTimeline);
      });
    } else {
      setMergedTimeline(baseTimeline);
    }
  }, [activity]);

  // AI loading simulator
  const [aiGenerating, setAiGenerating] = useState(true);
  const [aiInsights, setAiInsights] = useState<{
    summary: string;
    sentiment: 'Positive' | 'Neutral' | 'Negative';
    nextAction: string;
    recommendation: string;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadActivity = async () => {
      try {
        const remote = await getCrmActivity(id);
        if (cancelled) return;
        setActivity(remote);
        setSubject(remote.subject);
        setStatus(remote.status);
        setPriority(remote.priority);
        setNotes((remote.details as any)?.notes || (remote.details as any)?.description || '');
        setDueDate(remote.due_date ? String(remote.due_date).slice(0, 16) : '');
      } catch {
        if (!cancelled) setActivity(null);
      }
      if (!cancelled) setLoading(false);
    };

    loadActivity();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse p-6 bg-background min-h-screen">
        <div className="h-10 w-2/3 bg-secondary rounded-lg" />
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-8 h-96 bg-secondary rounded-2xl" />
          <div className="col-span-4 h-96 bg-secondary rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center select-none bg-card border border-border rounded-xl p-6 m-6">
        <div className="h-14 w-14 rounded-full bg-status-danger-bg flex items-center justify-center mb-4">
          <Trash2 className="size-6 text-status-danger-text" />
        </div>
        <h3 className="text-sm font-bold text-foreground font-['Space_Grotesk']">Activity Not Found</h3>
        <p className="text-[11px] text-muted-foreground max-w-sm mt-1 leading-relaxed">
          The requested activity ID is invalid, or it may have been deleted by another team member.
        </p>
        <button
          onClick={() => onBack ? onBack() : router.push('/activities')}
          className="mt-4 px-4 py-2 bg-accent-color hover:bg-accent-color/90 text-white rounded-lg text-xs font-semibold cursor-pointer"
        >
          Return to Activities
        </button>
      </div>
    );
  }

  // Prev/Next Navigation in List
  // Save changes
  const handleSave = async () => {
    if (!activity || !subject.trim()) {
      toast.error("Subject is required!");
      return;
    }
    try {
      const type = activity.activity_type;
      if (type === 'task') {
        await updateCrmTask(activity.id, { subject, status, priority, due_date: dueDate || undefined } as any);
      } else if (type === 'call') {
        await updateCrmCall(activity.id, { subject, status, priority } as any);
      } else if (type === 'note') {
        await updateCrmNote(activity.id, { title: subject } as any);
      }
      // Re-fetch to get fresh data
      const fresh = await getCrmActivity(id);
      setActivity(fresh);
      setSubject(fresh.subject);
      setStatus(fresh.status);
      setPriority(fresh.priority);
      setNotes((fresh.details as any)?.notes || (fresh.details as any)?.description || '');
      setDueDate(fresh.due_date ? String(fresh.due_date).slice(0, 16) : '');
      setIsEditing(false);
      toast.success("Activity details saved successfully.");
    } catch (err: any) {
      toast.error(err?.message || "Failed to save activity.");
    }
  };

  // Delete activity
  const handleDelete = async () => {
    if (!activity) return;
    if (!window.confirm("Are you sure you want to delete this activity?")) return;
    try {
      const type = activity.activity_type;
      if (type === 'task') {
        await deleteCrmTask(activity.id);
      } else if (type === 'call') {
        await deleteCrmCall(activity.id);
      } else if (type === 'note') {
        await deleteCrmNote(activity.id);
      } else {
        toast.error("Deletion not supported for this activity type.");
        return;
      }
      toast.success("Activity deleted.");
      if (onBack) onBack();
      else router.push('/activities');
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete activity.");
    }
  };

  // AI Create task shortcut
  const handleCreateTaskFromAI = async () => {
    if (!aiInsights) return;
    try {
      await createCrmTask({
        subject: `AI Follow-up: ${aiInsights.nextAction.slice(0, 40)}...`,
        description: aiInsights.nextAction,
        priority: 'high',
        status: 'pending',
        related_entity_type: activity?.related_entity_type || undefined,
        related_lead_id: activity?.related_entity_type === 'lead' ? (activity.related_record_id || undefined) : undefined,
        related_contact_id: activity?.related_entity_type === 'contact' ? (activity.related_record_id || undefined) : undefined,
      });
      toast.success("Task created from AI recommendation!");
    } catch (err: any) {
      toast.error(err?.message || "Failed to create task.");
    }
  };

  // Color mappings
  const getPriorityBadgeClass = (p: string) => {
    switch (p) {
      case 'Urgent': return 'bg-status-danger-bg text-status-danger-text border border-status-danger-text/25';
      case 'High': return 'bg-priority-high-bg text-priority-high border border-priority-high/25';
      case 'Medium': return 'bg-status-info-bg text-status-info-text border border-status-info-text/25';
      default: return 'bg-secondary text-muted-foreground border border-border/80';
    }
  };

  const getStatusBadgeClass = (s: string) => {
    switch (s) {
      case 'Completed': return 'bg-status-success-bg text-status-success-text border border-status-success-text/25';
      case 'Overdue': return 'bg-status-danger-bg text-status-danger-text border border-status-danger-text/25';
      case 'In Progress': return 'bg-status-info-bg text-status-info-text border border-status-info-text/25';
      case 'Scheduled': return 'bg-accent-color/15 text-accent-color border border-accent-color/25';
      default: return 'bg-secondary text-muted-foreground border border-border/80';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'task': return { bg: 'bg-accent-color/15', text: 'text-accent-color', border: 'border-accent-color/25', icon: ClipboardList };
      case 'meeting': return { bg: 'bg-status-info-bg', text: 'text-status-info-text', border: 'border-status-info-text/25', icon: Calendar };
      case 'call': return { bg: 'bg-status-success-bg', text: 'text-status-success-text', border: 'border-status-success-text/25', icon: PhoneCall };
      case 'email': return { bg: 'bg-priority-high-bg', text: 'text-priority-high', border: 'border-priority-high/25', icon: Mail };
      default: return { bg: 'bg-status-success-bg', text: 'text-status-success-text', border: 'border-status-success-text/25', icon: FileText };
    }
  };

  const themeColors = getTypeColor(activity.activity_type);
  const TypeIcon = themeColors.icon;

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      
      {/* Premium Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border/60 select-none">
        <div className="flex items-center gap-4 min-w-0">
          <button 
            onClick={() => onBack ? onBack() : router.push('/activities')}
            className="p-2 hover:bg-secondary/40 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer transition-colors border border-border bg-card shadow-sm"
          >
            <ArrowLeft size={14} />
          </button>
          
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded border flex items-center gap-1 ${themeColors.bg} ${themeColors.text} ${themeColors.border}`}>
                <TypeIcon size={10} />
                <span>{activity.activity_type}</span>
              </span>
              <span className="text-[10px] text-muted-foreground font-bold font-mono uppercase tracking-wider">ID: {activity.id}</span>
            </div>
            
            {isEditing ? (
              <input 
                type="text" 
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="mt-1.5 bg-secondary/30 border border-border rounded-lg px-2.5 py-1 text-base font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-accent-color/20 w-80 sm:w-[450px]"
              />
            ) : (
              <h2 className="text-xl font-bold tracking-tight text-foreground mt-1.5 truncate max-w-sm sm:max-w-md md:max-w-lg font-['Space_Grotesk']">{activity.subject}</h2>
            )}
          </div>
        </div>

        {/* Action Button Strip */}
        <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
          {isEditing ? (
            <>
              <button 
                onClick={handleSave}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-status-success-text hover:bg-status-success-text/90 text-text-on-primary rounded-lg text-xs font-bold transition cursor-pointer shadow-sm"
              >
                <Save size={13} />
                <span>Save</span>
              </button>
              <button 
                onClick={() => {
                  setIsEditing(false);
                  setSubject(activity.subject);
                  setStatus(activity.status);
                  setPriority(activity.priority);
                  setNotes((activity.details as any)?.notes || (activity.details as any)?.description || (activity.details as any)?.body || '');
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-border bg-card hover:bg-secondary text-foreground rounded-lg text-xs font-bold transition cursor-pointer shadow-sm"
              >
                <X size={13} />
                <span>Cancel</span>
              </button>
            </>
          ) : (
            <>
              {relatedEmail && (
                <button
                  onClick={() => {
                    router.push(`?compose=${encodeURIComponent(relatedEmail)}`);
                    onTabChange?.('emails');
                    setTimeout(() => {
                      window.dispatchEvent(new CustomEvent('pulse-compose-email', { detail: { to: relatedEmail } }));
                    }, 150);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-border bg-card hover:bg-secondary text-accent-color rounded-lg text-xs font-bold transition cursor-pointer shadow-sm"
                  title={`Email ${relatedEmail}`}
                >
                  <Mail size={13} />
                  <span>Email</span>
                </button>
              )}
              <button 
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-border bg-card hover:bg-secondary text-foreground rounded-lg text-xs font-bold transition cursor-pointer shadow-sm"
              >
                <Edit3 size={13} />
                <span>Edit</span>
              </button>
              <button 
                onClick={handleDelete}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-status-danger-text hover:bg-status-danger-text/90 text-text-on-primary rounded-lg text-xs font-bold transition cursor-pointer shadow-sm"
              >
                <Trash2 size={13} />
                <span>Delete</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Breakdown Layout */}
      <div className="grid grid-cols-12 gap-5 items-start">
        
        {/* Left Side: Overview Data Card & Notes */}
        <div className="col-span-12 lg:col-span-8 space-y-5">
          
          {/* Tab Pill Selectors */}
          <div className="flex space-x-1.5 p-1 bg-secondary border border-border rounded-xl w-fit select-none shadow-sm">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-1.5 px-4 rounded-lg font-bold text-[10px] uppercase tracking-wider transition duration-200 cursor-pointer ${
                activeTab === 'overview' 
                  ? 'bg-accent-color text-white shadow-sm font-black' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-card/40'
              }`}
            >
              Overview Details
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              className={`py-1.5 px-4 rounded-lg font-bold text-[10px] uppercase tracking-wider transition duration-200 cursor-pointer ${
                activeTab === 'timeline' 
                  ? 'bg-accent-color text-white shadow-sm font-black' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-card/40'
              }`}
            >
              Timeline History
            </button>
          </div>

          {activeTab === 'overview' ? (
            <div className="space-y-5">
              
              {/* Card 1: Key Metadata Fields */}
              <div className="bg-card border border-border rounded-[10px] p-5 shadow-sm space-y-6">
                <h3 className="font-bold text-foreground text-xs uppercase tracking-wider flex items-center gap-1.5 select-none font-['Space_Grotesk']">
                  <ClipboardList className="h-4 w-4 text-accent-color" />
                  <span>Activity Context Specs</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                  {/* Subject field */}
                  <div className="border-b border-border/40 pb-2">
                    <span className="block text-[9px] font-bold text-muted-foreground uppercase tracking-wider font-['Space_Grotesk']">Subject</span>
                    <p className="text-xs font-semibold text-foreground mt-1 leading-snug">{activity.subject}</p>
                  </div>

                  {/* Due Date field */}
                  <div className="border-b border-border/40 pb-2">
                    <span className="block text-[9px] font-bold text-muted-foreground uppercase tracking-wider font-['Space_Grotesk']">Due Date &amp; Time</span>
                    {isEditing ? (
                      <input 
                        type="datetime-local" 
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="mt-1 w-full bg-secondary/30 border border-border rounded-lg px-2.5 py-1 text-xs text-foreground focus:outline-none"
                      />
                    ) : (
                      <p className="text-xs font-bold text-foreground mt-1 flex items-center gap-1.5 font-mono">
                        <Clock size={12} className="text-muted-foreground" />
                        <span>{activity.due_date ? new Date(activity.due_date).toLocaleString('en-IN') : 'No deadline'}</span>
                      </p>
                    )}
                  </div>

                  {/* Status fields */}
                  <div className="border-b border-border/40 pb-2">
                    <span className="block text-[9px] font-bold text-muted-foreground uppercase tracking-wider font-['Space_Grotesk']">Status</span>
                    {isEditing ? (
                      <select 
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="mt-1 w-full bg-secondary/30 border border-border rounded-lg px-2 py-1 text-xs text-foreground focus:outline-none"
                      >
                        <option>Pending</option>
                        <option>Scheduled</option>
                        <option>In Progress</option>
                        <option>Completed</option>
                        <option>Overdue</option>
                      </select>
                    ) : (
                      <span className={`inline-block mt-1 px-2.5 py-0.5 rounded text-[10px] font-bold ${getStatusBadgeClass(activity.status)}`}>
                        {activity.status}
                      </span>
                    )}
                  </div>

                  {/* Priority fields */}
                  <div className="border-b border-border/40 pb-2">
                    <span className="block text-[9px] font-bold text-muted-foreground uppercase tracking-wider font-['Space_Grotesk']">Priority</span>
                    {isEditing ? (
                      <select 
                        value={priority}
                        onChange={(e) => setPriority(e.target.value)}
                        className="mt-1 w-full bg-secondary/30 border border-border rounded-lg px-2 py-1 text-xs text-foreground focus:outline-none"
                      >
                        <option>Urgent</option>
                        <option>High</option>
                        <option>Medium</option>
                        <option>Low</option>
                      </select>
                    ) : (
                      <span className={`inline-block mt-1 px-2.5 py-0.5 rounded text-[10px] font-bold ${getPriorityBadgeClass(activity.priority)}`}>
                        {activity.priority}
                      </span>
                    )}
                  </div>

                  {/* Related Record */}
                  {activity.related_record_id && activity.related_entity_type && (
                    <div className="border-b border-border/40 pb-2 md:border-b-0 md:pb-0">
                      <span className="block text-[9px] font-bold text-muted-foreground uppercase tracking-wider font-['Space_Grotesk']">Related Record Context</span>
                      <button
                        onClick={() => {
                          if (onTabChange) {
                            const tabMap: Record<string, string> = {
                              lead: 'leads',
                              contact: 'contacts',
                              company: 'companies',
                              deal: 'deals'
                            };
                            onTabChange(tabMap[activity.related_entity_type || ''] || 'home');
                          } else {
                            router.push(`/${activity.related_entity_type}s`);
                          }
                        }}
                        className="mt-1 inline-flex items-center gap-1.5 text-xs font-bold text-accent-color hover:underline text-left cursor-pointer"
                      >
                        <Link2 size={12} />
                        <span>{activity.related_record_name || activity.related_entity_type} ({activity.related_entity_type})</span>
                      </button>
                    </div>
                  )}

                  {/* Owner */}
                  <div className="border-b-0 pb-0">
                    <span className="block text-[9px] font-bold text-muted-foreground uppercase tracking-wider font-['Space_Grotesk']">Owner / Assigned To</span>
                    <p className="text-xs font-bold text-foreground mt-1.5 flex items-center gap-1.5">
                      <span className="size-5 rounded-full bg-secondary flex items-center justify-center text-[10px] font-extrabold text-accent-color border border-accent-color/20">
                        {(activity.owner_name || '?').charAt(0)}
                      </span>
                      <span>{activity.owner_name || 'Unassigned'}</span>
                    </p>
                  </div>
                </div>

                {/* Freeform Notes Section */}
                <div className="border-t border-border/60 pt-4">
                  <span className="block text-[9px] font-bold text-muted-foreground uppercase tracking-wider font-['Space_Grotesk']">Summary Description Notes</span>
                  {isEditing ? (
                    <textarea 
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      className="mt-2 w-full bg-secondary/30 border border-border rounded-lg p-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-accent-color/20"
                    />
                  ) : (
                    <p className="text-xs font-medium leading-relaxed bg-secondary/15 rounded-lg border border-border/40 p-3 mt-2 select-text whitespace-pre-wrap text-foreground/80 border-l-2 border-l-accent-color">
                      {notes || 'No description notes logged for this activity.'}
                    </p>
                  )}
                </div>
              </div>

              {/* Card 2: Additional Details Dropdown */}
              <div className="bg-card border border-border rounded-[10px] p-5 shadow-sm relative overflow-hidden group">
                <button
                  onClick={() => setIsAiInsightsExpanded(!isAiInsightsExpanded)}
                  className="w-full flex justify-between items-start text-left focus:outline-none cursor-pointer"
                >
                  <div className="space-y-1">
                    <h3 className="font-bold text-foreground text-xs uppercase tracking-wider font-['Space_Grotesk']">
                      Additional Details
                    </h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Automated customer summary &amp; recommended next actions.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="inline-flex items-center gap-1 bg-accent-color/15 text-accent-color border border-accent-color/20 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase select-none">
                      <Sparkles className="size-2.5 animate-pulse" />
                      <span>AI Insights</span>
                    </div>
                    {isAiInsightsExpanded ? (
                      <ChevronUp size={16} className="text-muted-foreground shrink-0" />
                    ) : (
                      <ChevronDown size={16} className="text-muted-foreground shrink-0" />
                    )}
                  </div>
                </button>

                {isAiInsightsExpanded && (
                  <div className="mt-4 pt-4 border-t border-border/40 animate-in slide-in-from-top-1 duration-200">
                    {aiGenerating ? (
                      <div className="flex items-center gap-2 py-4 text-xs text-muted-foreground font-semibold">
                        <Sparkles className="size-4 animate-spin text-accent-color" />
                        <span>AI is compiling interaction insights...</span>
                      </div>
                    ) : aiInsights ? (
                      <div className="space-y-4">
                        <div>
                          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider font-['Space_Grotesk']">AI Summary</span>
                          <p className="text-xs text-foreground/85 font-medium leading-relaxed mt-1">{aiInsights.summary}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider font-['Space_Grotesk']">Customer Sentiment</span>
                            <div className="mt-1">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-status-success-bg text-status-success-text border border-status-success-text/15">
                                {aiInsights.sentiment}
                              </span>
                            </div>
                          </div>

                          <div>
                            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider font-['Space_Grotesk']">Follow-up Target</span>
                            <p className="text-xs font-semibold text-foreground mt-1 font-mono">Tomorrow &middot; 3:00 PM</p>
                          </div>
                        </div>

                        <div className="bg-secondary/40 border border-border rounded-xl p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                          <div className="min-w-0">
                            <span className="text-[8px] font-black uppercase text-accent-color tracking-widest block leading-none">Next Best Action Recommendation</span>
                            <p className="text-xs font-bold text-foreground mt-1 truncate leading-none">{aiInsights.nextAction}</p>
                          </div>
                          <button
                            onClick={handleCreateTaskFromAI}
                            className="px-3 py-1.5 bg-accent-color hover:bg-accent-color/90 text-white rounded-lg text-[10px] font-bold shrink-0 transition-colors cursor-pointer"
                          >
                            + Create Task
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-muted-foreground text-center py-4 text-xs font-semibold">
                        AI Insights currently unavailable. Check system connection.
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>
          ) : (
            /* Timeline History Tab - uses mergedTimeline */
            <div className="bg-card border border-border rounded-[10px] p-5 shadow-sm space-y-5 animate-in fade-in duration-300">
              <h3 className="font-bold text-foreground text-xs uppercase tracking-wider flex items-center gap-1.5 select-none font-['Space_Grotesk']">
                <Clock className="h-4 w-4 text-accent-color" />
                <span>Lifecycle History Log</span>
                <span className="ml-auto px-2 py-0.5 bg-accent-color/10 text-accent-color rounded-full text-[9px] font-bold">{mergedTimeline.length} events</span>
              </h3>

              {/* Type filter pills */}
              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    { label: 'All', key: 'all' },
                    { label: 'Timelines', key: 'timeline' },
                    { label: 'Emails', key: 'email' },
                    { label: 'Calls', key: 'call' },
                    { label: 'Meetings', key: 'meeting' },
                  ] as { label: string; key: 'all' | 'timeline' | 'email' | 'call' | 'meeting' }[]
                ).map(({ label, key }) => {
                  const count = key === 'all' ? mergedTimeline.length : mergedTimeline.filter(e => e.type === key).length;
                  return (
                    <button
                      key={key}
                      onClick={() => setTimelineFilter(key)}
                      className={`px-2.5 py-1 rounded-full text-[9px] font-bold border transition cursor-pointer ${
                        timelineFilter === key
                          ? 'bg-accent-color text-white border-accent-color shadow-sm'
                          : 'bg-secondary text-muted-foreground border-border hover:text-foreground hover:border-foreground/20'
                      }`}
                    >
                      {label} ({count})
                    </button>
                  );
                })}
              </div>

              <div className="relative border-l-2 border-accent-color/20 ml-3 space-y-5">
                {mergedTimeline.filter(e => timelineFilter === 'all' || e.type === timelineFilter).length === 0 ? (
                  <p className="text-xs text-muted-foreground py-4 text-center font-semibold select-none">No lifecycle events logged yet.</p>
                ) : (
                  [...mergedTimeline.filter(e => timelineFilter === 'all' || e.type === timelineFilter)]
                    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
                    .map((log, index) => {
                      const typeColors: Record<string, string> = {
                        email: 'bg-accent-color',
                        call: 'bg-status-success-text',
                        meeting: 'bg-status-info-text',
                        timeline: 'bg-status-warning-text',
                      };
                      const typeBadge: Record<string, string> = {
                        email: 'bg-accent-color/10 text-accent-color',
                        call: 'bg-status-success-bg text-status-success-text',
                        meeting: 'bg-status-info-bg text-status-info-text',
                        timeline: 'bg-status-warning-bg text-status-warning-text',
                      };
                      const dotColor = typeColors[log.type] ?? 'bg-accent-color';
                      const badgeColor = typeBadge[log.type] ?? 'bg-secondary text-muted-foreground';
                      return (
                        <div key={index} className="relative pl-8 animate-in slide-in-from-left-1 duration-200 group">
                          <div className={`absolute left-0 top-1 -translate-x-1/2 h-5 w-5 rounded-full bg-card border-2 border-border flex items-center justify-center z-10 shadow-sm group-hover:scale-110 transition-transform`}>
                            <div className={`size-2 rounded-full ${dotColor}`} />
                          </div>

                          <div className="bg-secondary/30 dark:bg-secondary/20 border border-border/60 rounded-xl p-3 group-hover:bg-secondary/50 transition-colors">
                            <div className="flex justify-between items-start gap-2 mb-1">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider shrink-0 ${badgeColor}`}>
                                  {log.type}
                                </span>
                                <h4 className="text-xs font-bold text-foreground leading-none truncate">{log.action}</h4>
                              </div>
                              <span className="text-[9px] text-muted-foreground font-mono tabular-nums shrink-0">
                                {new Date(log.time).toLocaleDateString('en-IN')} &middot; {new Date(log.time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            {log.desc && <p className="text-[10px] text-muted-foreground font-semibold leading-relaxed">{log.desc}</p>}
                            <p className="text-[9px] text-accent-color font-extrabold mt-1">by {log.user}</p>
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </div>
          )}

        </div>

        {/* Right Side: Sidebar Context and Settings Log */}
        <div className="col-span-12 lg:col-span-4 space-y-5 pt-[46px]">
          <ContextPanel 
            contactName={activity.related_entity_type === 'contact' ? (activity.related_record_name || undefined) : undefined}
            companyName={activity.related_entity_type === 'company' ? (activity.related_record_name || undefined) : undefined}
            onTabChange={onTabChange}
          />

          {/* System settings details card */}
          <div className="bg-card border border-border rounded-[10px] p-5 shadow-sm space-y-4">
            <button
              onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
              className="w-full flex justify-between items-center text-xs font-bold text-foreground uppercase tracking-wider cursor-pointer font-['Space_Grotesk']"
            >
              <span className="flex items-center gap-1.5">
                <Compass size={14} className="text-accent-color" />
                System Details Log
              </span>
              {isDetailsExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {isDetailsExpanded && (
              <div className="space-y-4 border-t border-border/40 pt-4 animate-in slide-in-from-top-1 duration-200">
                <div>
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block font-['Space_Grotesk']">Created By</span>
                  <p className="text-xs font-semibold text-foreground mt-1">System User &middot; Aug 04, 2026</p>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block font-['Space_Grotesk']">Last Modified By</span>
                  <p className="text-xs font-semibold text-foreground mt-1">{activity.owner_name || 'Unassigned'} &middot; Just now</p>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block font-['Space_Grotesk']">Reminder Trigger</span>
                  <p className="text-xs font-semibold text-foreground mt-1">15 Minutes Before (Push Alert)</p>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block font-['Space_Grotesk']">Recurrence</span>
                  <p className="text-xs font-semibold text-foreground mt-1">Do Not Repeat</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
