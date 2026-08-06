'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  ChevronLeft, 
  ChevronRight, 
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
import { getActivitiesFromStorage, saveActivitiesToStorage, Activity } from '@/utils/activityDb';
import ContextPanel from './ContextPanel';
import { toast } from '@/lib/toast';

interface ActivityDetailViewProps {
  id: string;
  onBack?: () => void;
  onTabChange?: (tab: string) => void;
}

export default function ActivityDetailView({ id, onBack, onTabChange }: ActivityDetailViewProps) {
  const router = useRouter();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activity, setActivity] = useState<Activity | null>(null);
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

  // AI loading simulator
  const [aiGenerating, setAiGenerating] = useState(true);
  const [aiInsights, setAiInsights] = useState<{
    summary: string;
    sentiment: 'Positive' | 'Neutral' | 'Negative';
    nextAction: string;
    recommendation: string;
  } | null>(null);

  useEffect(() => {
    const list = getActivitiesFromStorage();
    setActivities(list);
    const found = list.find(a => a.id === id);
    if (found) {
      setActivity(found);
      setSubject(found.subject);
      setStatus(found.status);
      setPriority(found.priority);
      setNotes(found.details.notes || found.details.description || found.details.body || '');
      setDueDate(found.dueDate ? found.dueDate.slice(0, 16) : '');
    }
    setLoading(false);

    // Simulate AI Generation
    const timer = setTimeout(() => {
      setAiInsights({
        summary: found ? `Client alignment focused on resolving custom SSO configurations. The customer expressed keen interest but needs SOC2 confirmation.` : `General follow-up regarding system specifications.`,
        sentiment: found?.type === 'email' ? 'Positive' : 'Neutral',
        nextAction: "Send custom SOC2 compliance documentation packet by end of day.",
        recommendation: "Schedule a 15-minute follow-up alignment meeting for tomorrow at 3:00 PM."
      });
      setAiGenerating(false);
    }, 1000);

    return () => clearTimeout(timer);
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
        <div className="h-14 w-14 rounded-full bg-rose-500/10 flex items-center justify-center mb-4">
          <Trash2 className="size-6 text-rose-500" />
        </div>
        <h3 className="text-sm font-bold text-foreground font-['Space_Grotesk']">Activity Not Found</h3>
        <p className="text-[11px] text-muted-foreground max-w-sm mt-1 leading-relaxed">
          The requested activity ID is invalid, or it may have been deleted by another team member.
        </p>
        <button
          onClick={() => onBack ? onBack() : router.push('/activities')}
          className="mt-4 px-4 py-2 bg-brand-purple hover:bg-brand-purple/90 text-white rounded-lg text-xs font-semibold cursor-pointer"
        >
          Return to Activities
        </button>
      </div>
    );
  }

  // Prev/Next Navigation in List
  const currentIndex = activities.findIndex(a => a.id === id);
  const handlePrevActivity = () => {
    if (currentIndex > 0) {
      router.push(`/activities/${activities[currentIndex - 1].id}`);
    } else {
      toast.info("You are at the first activity in the list.");
    }
  };

  const handleNextActivity = () => {
    if (currentIndex < activities.length - 1) {
      router.push(`/activities/${activities[currentIndex + 1].id}`);
    } else {
      toast.info("You are at the last activity in the list.");
    }
  };

  // Save changes
  const handleSave = () => {
    if (!subject.trim()) {
      toast.error("Subject is required!");
      return;
    }
    const updated: Activity = {
      ...activity,
      subject,
      status,
      priority,
      dueDate: dueDate ? new Date(dueDate).toISOString() : activity.dueDate,
      details: {
        ...activity.details,
        notes: activity.type === 'call' || activity.type === 'meeting' ? notes : undefined,
        description: activity.type === 'task' ? notes : undefined,
        body: activity.type === 'note' ? notes : undefined
      },
      timeline: [
        ...(activity.timeline || []),
        { action: 'Updated', time: new Date().toISOString(), user: 'Sarah Johnson', desc: 'Fields updated by owner.' }
      ]
    };

    const newActivities = activities.map(a => a.id === id ? updated : a);
    saveActivitiesToStorage(newActivities);
    setActivity(updated);
    setIsEditing(false);
    toast.success("Activity details saved successfully.");
  };

  // Delete activity
  const handleDelete = () => {
    if (!window.confirm("Are you sure you want to delete this activity?")) return;
    const newActivities = activities.filter(a => a.id !== id);
    saveActivitiesToStorage(newActivities);
    toast.success("Activity deleted.");
    if (onBack) onBack();
    else router.push('/activities');
  };

  // AI Create task shortcut
  const handleCreateTaskFromAI = () => {
    if (!aiInsights) return;
    const newTask: Activity = {
      id: `act-${Date.now()}`,
      type: 'task',
      subject: `AI Follow-up: ${aiInsights.nextAction.slice(0, 40)}...`,
      status: 'Pending',
      priority: 'High',
      dueDate: new Date(Date.now() + 86400000).toISOString(), // due tomorrow
      owner: 'Sarah Johnson',
      relatedRecord: activity.relatedRecord,
      details: {
        title: `AI Follow-up: ${aiInsights.nextAction.slice(0, 40)}...`,
        description: aiInsights.nextAction,
        assignedTo: 'Sarah Johnson'
      },
      timeline: [
        { action: 'Created', time: new Date().toISOString(), user: 'AI Copilot', desc: 'Recommended next best action task created.' }
      ]
    };
    saveActivitiesToStorage([newTask, ...activities]);
    toast.success("Task created from AI recommendation!");
  };

  // Color mappings
  const getPriorityBadgeClass = (p: string) => {
    switch (p) {
      case 'Urgent': return 'bg-[#E2604F]/15 text-[#E2604F] border border-[#E2604F]/25';
      case 'High': return 'bg-[#E8A33D]/15 text-[#E8A33D] border border-[#E8A33D]/25';
      case 'Medium': return 'bg-[#5B9BD5]/15 text-[#5B9BD5] border border-[#5B9BD5]/25';
      default: return 'bg-secondary text-muted-foreground border border-border/80';
    }
  };

  const getStatusBadgeClass = (s: string) => {
    switch (s) {
      case 'Completed': return 'bg-[#4FB477]/15 text-[#4FB477] border border-[#4FB477]/25';
      case 'Overdue': return 'bg-[#E2604F]/15 text-[#E2604F] border border-[#E2604F]/25';
      case 'In Progress': return 'bg-[#5B9BD5]/15 text-[#5B9BD5] border border-[#5B9BD5]/25';
      case 'Scheduled': return 'bg-brand-purple/15 text-brand-purple border border-brand-purple/25';
      default: return 'bg-secondary text-muted-foreground border border-border/80';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'task': return { bg: 'bg-brand-purple/15', text: 'text-brand-purple', border: 'border-brand-purple/25', icon: ClipboardList };
      case 'meeting': return { bg: 'bg-[#5B9BD5]/15', text: 'text-[#5B9BD5]', border: 'border-[#5B9BD5]/25', icon: Calendar };
      case 'call': return { bg: 'bg-[#4FB477]/15', text: 'text-[#4FB477]', border: 'border-[#4FB477]/25', icon: PhoneCall };
      case 'email': return { bg: 'bg-[#E8A33D]/15', text: 'text-[#E8A33D]', border: 'border-[#E8A33D]/25', icon: Mail };
      default: return { bg: 'bg-emerald-500/15', text: 'text-emerald-500', border: 'border-emerald-500/25', icon: FileText };
    }
  };

  const themeColors = getTypeColor(activity.type);
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
                <span>{activity.type}</span>
              </span>
              <span className="text-[10px] text-muted-foreground font-bold font-mono uppercase tracking-wider">ID: {activity.id}</span>
            </div>
            
            {isEditing ? (
              <input 
                type="text" 
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="mt-1.5 bg-secondary/30 border border-border rounded-lg px-2.5 py-1 text-base font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-brand-purple/20 w-80 sm:w-[450px]"
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
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#4FB477] hover:bg-[#4FB477]/90 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm"
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
                  setNotes(activity.details.notes || activity.details.description || activity.details.body || '');
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-border bg-card hover:bg-secondary text-foreground rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm"
              >
                <X size={13} />
                <span>Cancel</span>
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-border bg-card hover:bg-secondary text-foreground rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm"
              >
                <Edit3 size={13} />
                <span>Edit</span>
              </button>
              <button 
                onClick={handleDelete}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#E2604F] hover:bg-[#E2604F]/90 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm"
              >
                <Trash2 size={13} />
                <span>Delete</span>
              </button>
            </>
          )}

          {/* Pagination nodes */}
          <div className="flex items-center border border-border rounded-lg overflow-hidden p-0.5 bg-secondary/50 shadow-sm ml-1.5">
            <button 
              onClick={handlePrevActivity}
              className="p-1.5 hover:bg-card rounded text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
              title="Previous Activity"
            >
              <ChevronLeft size={13} />
            </button>
            <button 
              onClick={handleNextActivity}
              className="p-1.5 hover:bg-card rounded text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
              title="Next Activity"
            >
              <ChevronRight size={13} />
            </button>
          </div>
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
              className={`py-1.5 px-4 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                activeTab === 'overview' 
                  ? 'bg-brand-purple text-white shadow-sm font-black' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-card/40'
              }`}
            >
              Overview Details
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              className={`py-1.5 px-4 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                activeTab === 'timeline' 
                  ? 'bg-brand-purple text-white shadow-sm font-black' 
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
                  <ClipboardList className="h-4 w-4 text-brand-purple" />
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
                        <span>{activity.dueDate ? new Date(activity.dueDate).toLocaleString('en-IN') : 'No deadline'}</span>
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
                  {activity.relatedRecord && (
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
                            onTabChange(tabMap[activity.relatedRecord?.type || ''] || 'home');
                          } else {
                            router.push(`/${activity.relatedRecord?.type}s`);
                          }
                        }}
                        className="mt-1 inline-flex items-center gap-1.5 text-xs font-bold text-brand-purple hover:underline text-left cursor-pointer"
                      >
                        <Link2 size={12} />
                        <span>{activity.relatedRecord.name} ({activity.relatedRecord.type})</span>
                      </button>
                    </div>
                  )}

                  {/* Owner */}
                  <div className="border-b-0 pb-0">
                    <span className="block text-[9px] font-bold text-muted-foreground uppercase tracking-wider font-['Space_Grotesk']">Owner / Assigned To</span>
                    <p className="text-xs font-bold text-foreground mt-1.5 flex items-center gap-1.5">
                      <span className="size-5 rounded-full bg-secondary flex items-center justify-center text-[10px] font-extrabold text-brand-purple border border-brand-purple/20">
                        {activity.owner.charAt(0)}
                      </span>
                      <span>{activity.owner}</span>
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
                      className="mt-2 w-full bg-secondary/30 border border-border rounded-lg p-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-brand-purple/20"
                    />
                  ) : (
                    <p className="text-xs font-medium leading-relaxed bg-secondary/15 rounded-lg border border-border/40 p-3 mt-2 select-text whitespace-pre-wrap text-foreground/80 border-l-2 border-l-brand-purple">
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
                    <div className="inline-flex items-center gap-1 bg-brand-purple/15 text-brand-purple border border-brand-purple/20 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase select-none">
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
                        <Sparkles className="size-4 animate-spin text-brand-purple" />
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
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/15">
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
                            <span className="text-[8px] font-black uppercase text-brand-purple tracking-widest block leading-none">Next Best Action Recommendation</span>
                            <p className="text-xs font-bold text-foreground mt-1 truncate leading-none">{aiInsights.nextAction}</p>
                          </div>
                          <button
                            onClick={handleCreateTaskFromAI}
                            className="px-3 py-1.5 bg-brand-purple hover:bg-brand-purple/90 text-white rounded-lg text-[10px] font-bold shrink-0 transition-colors cursor-pointer"
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
            /* Timeline History Tab */
            <div className="bg-card border border-border rounded-[10px] p-5 shadow-sm space-y-5 animate-in fade-in duration-300">
              <h3 className="font-bold text-foreground text-xs uppercase tracking-wider flex items-center gap-1.5 select-none font-['Space_Grotesk']">
                <Clock className="h-4 w-4 text-brand-purple" />
                <span>Lifecycle History Log</span>
              </h3>

              <div className="relative border-l border-border ml-3 space-y-6">
                {[...(activity.timeline || [])]
                  .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
                  .map((log, index) => (
                    <div key={index} className="relative pl-8 animate-in slide-in-from-left-1 duration-200">
                      <div className="absolute left-0 top-0.5 -translate-x-1/2 h-5 w-5 rounded-full bg-card border border-border flex items-center justify-center z-10 shadow-sm">
                        <div className="size-2 rounded-full bg-brand-purple" />
                      </div>

                      <div>
                        <div className="flex justify-between items-start">
                          <h4 className="text-xs font-bold text-foreground leading-none">{log.action}</h4>
                          <span className="text-[10px] text-muted-foreground font-mono tabular-nums">
                            {new Date(log.time).toLocaleDateString('en-IN')} &middot; {new Date(log.time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 font-semibold">{log.desc}</p>
                        <p className="text-[9px] text-brand-purple font-extrabold mt-0.5">by {log.user}</p>
                      </div>
                    </div>
                  ))}
                
                {(activity.timeline || []).length === 0 && (
                  <p className="text-xs text-muted-foreground py-4 text-center font-semibold select-none">No lifecycle events logged yet.</p>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Right Side: Sidebar Context and Settings Log */}
        <div className="col-span-12 lg:col-span-4 space-y-5 pt-[46px]">
          <ContextPanel 
            contactName={activity.relatedRecord?.type === 'contact' ? activity.relatedRecord.name : undefined}
            companyName={activity.relatedRecord?.type === 'company' ? activity.relatedRecord.name : undefined}
            onTabChange={onTabChange}
          />

          {/* System settings details card */}
          <div className="bg-card border border-border rounded-[10px] p-5 shadow-sm space-y-4">
            <button
              onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
              className="w-full flex justify-between items-center text-xs font-bold text-foreground uppercase tracking-wider cursor-pointer font-['Space_Grotesk']"
            >
              <span className="flex items-center gap-1.5">
                <Compass size={14} className="text-brand-purple" />
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
                  <p className="text-xs font-semibold text-foreground mt-1">{activity.owner} &middot; Just now</p>
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
