'use client';

import React, { useEffect, useMemo, useState } from 'react';

import { getAutomationEvents, triggerAutomationDelivery, type AutomationEvent } from '@/utils/api';
import { 
  GitBranch, 
  Play, 
  Pause, 
  Plus, 
  Trash2, 
  Check, 
  X, 
  Clock, 
  Mail, 
  UserCheck, 
  AlertTriangle, 
  ChevronRight, 
  Settings, 
  Zap, 
  Sliders, 
  Copy, 
  CheckCircle2,
  FileText,
  UserPlus,
  HelpCircle,
  FolderOpen
} from 'lucide-react';

interface Workflow {
  id: number | string;
  name: string;
  desc: string;
  triggerType: 'form_submission' | 'stage_change' | 'time_delay' | 'creation';
  triggerLabel: string;
  totalRuns: number;
  successRate: string;
  activeContacts: number;
  status: 'Active' | 'Draft' | 'Paused';
}

interface WorkflowNode {
  id: string;
  type: 'trigger' | 'condition' | 'action';
  category: string; // e.g. "Record Created", "Property Filter", "Send Email"
  label: string;
  desc: string;
  config: string;
}

function titleCaseEvent(value?: string | null): string {
  if (!value) return 'CRM Event';
  return value
    .toLowerCase()
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function eventToWorkflow(event: AutomationEvent): Workflow {
  const type = event.event_type || event.event_name || 'CRM_EVENT';
  const payloadStatus = String(event.payload?.status ?? '').toLowerCase();
  const triggerType: Workflow['triggerType'] = type.includes('EMAIL')
    ? 'form_submission'
    : type.includes('DEAL')
      ? 'stage_change'
      : type.includes('ACTIVITY')
        ? 'time_delay'
        : 'creation';

  return {
    id: event.id,
    name: `${titleCaseEvent(type)} Workflow`,
    desc: event.aggregate_type
      ? `Live ${titleCaseEvent(event.aggregate_type)} automation event from the backend event stream.`
      : 'Live automation event from the backend event stream.',
    triggerType,
    triggerLabel: titleCaseEvent(event.event_name || type),
    totalRuns: Number(event.payload?.total_runs ?? event.payload?.runs ?? 1),
    successRate: payloadStatus.includes('fail') || payloadStatus.includes('error') ? '0%' : '100%',
    activeContacts: Number(event.payload?.active_contacts ?? event.payload?.contact_count ?? 0),
    status: payloadStatus.includes('draft') ? 'Draft' : payloadStatus.includes('pause') ? 'Paused' : 'Active'
  };
}

const fallbackWorkflows: Workflow[] = [
    { id: 1, name: "Lead Assignment Automation", desc: "Auto-assigns new enterprise leads to regional reps based on geolocation.", triggerType: "creation", triggerLabel: "New Lead Created", totalRuns: 1240, successRate: "99.8%", activeContacts: 24, status: "Active" },
    { id: 2, name: "SaaS Free Trial Nurture", desc: "Sends a welcome email series and checks product usage milestones.", triggerType: "form_submission", triggerLabel: "Trial Sign-Up Form", totalRuns: 850, successRate: "97.5%", activeContacts: 112, status: "Active" },
    { id: 3, name: "Stale Deal Slack Alerts", desc: "Notifies account executives when a deal remains in 'Proposal' for over 10 days.", triggerType: "time_delay", triggerLabel: "10 Days Inactivity", totalRuns: 310, successRate: "100%", activeContacts: 15, status: "Active" },
    { id: 4, name: "Post-Purchase NDA Request", desc: "Sends NDAs and custom contract SLA drafts once a deal moves to Negotiation.", triggerType: "stage_change", triggerLabel: "Stage: Negotiation", totalRuns: 145, successRate: "98.2%", activeContacts: 4, status: "Paused" },
    { id: 5, name: "Q4 Marketing Inbound Scoring", desc: "Increments lead scores by 15 points when they open high-intent links.", triggerType: "form_submission", triggerLabel: "Pricing Link Clicked", totalRuns: 0, successRate: "--", activeContacts: 0, status: "Draft" }
  ];

export default function WorkflowsView({ onLoaded }: { onLoaded?: () => void } = {}) {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loadingWorkflows, setLoadingWorkflows] = useState(true);
  const [workflowError, setWorkflowError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'Active' | 'Draft' | 'Paused'>('Active');
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [newWorkflowName, setNewWorkflowName] = useState('');
  const [newWorkflowDesc, setNewWorkflowDesc] = useState('');
  
  // Visual Canvas States
  const [canvasNodes, setCanvasNodes] = useState<WorkflowNode[]>([]);
  const [activeConfigNode, setActiveConfigNode] = useState<string | null>(null);

  // Pre-Built Templates Recipes
  const templates = [
    {
      name: "Welcome Email Series",
      desc: "Delight new subscribers with automatic onboarding emails.",
      trigger: "Form Submission (Web Sign-up)",
      nodes: [
        { id: "1", type: "trigger" as const, category: "User Actions", label: "Form Submitted", desc: "Website signup form filled out", config: "Signup Form V2" },
        { id: "2", type: "action" as const, category: "External Actions", label: "Send Onboarding Email 1", desc: "Deliver welcome kit package", config: "Template: Welcome_Kit" },
        { id: "3", type: "condition" as const, category: "If/Else Branches", label: "Opened Email?", desc: "Checks email open event in 48h", config: "Opened Welcome_Kit == True" },
        { id: "4", type: "action" as const, category: "Internal Actions", label: "Add Lead Score +10", desc: "Increase score profile", config: "Score: +10" }
      ]
    },
    {
      name: "Stale Deal AE Reminder",
      desc: "Prevent deals from rotting by alerting owners.",
      trigger: "Time Delay & Activity Tracker",
      nodes: [
        { id: "1", type: "trigger" as const, category: "Time-Based Events", label: "10 Days Inactive", desc: "No touchpoints logged in 10 days", config: "Stage == Proposal" },
        { id: "2", type: "condition" as const, category: "Property Filters", label: "Deal Size > ₹50K", desc: "Focuses on high-value pipeline", config: "Value >= 50000" },
        { id: "3", type: "action" as const, category: "Internal Actions", label: "Ping Slack Owner", desc: "Send urgent warning channel message", config: "Slack AE Channel" }
      ]
    },
    {
      name: "Lead Scoring Pipeline",
      desc: "Auto-qualify leads based on custom criteria.",
      trigger: "Record Creation/Updates",
      nodes: [
        { id: "1", type: "trigger" as const, category: "Record Updates", label: "Lead Ingestion", desc: "New database record created", config: "Status: New" },
        { id: "2", type: "condition" as const, category: "Property Filters", label: "Enterprise Filter", desc: "Check company headcount", config: "Employees >= 100" },
        { id: "3", type: "action" as const, category: "Internal Actions", label: "Assign to Enterprise Rep", desc: "Change owner assignment", config: "Assignee: Sarah Johnson" }
      ]
    }
  ];

  useEffect(() => {
    let cancelled = false;

    async function loadWorkflows() {
      setLoadingWorkflows(true);
      setWorkflowError(null);
      try {
        const result = await getAutomationEvents(50);
        if (!cancelled) {
          setWorkflows(result.items.length ? result.items.map(eventToWorkflow) : fallbackWorkflows);
        }
      } catch {
        if (!cancelled) {
          setWorkflows(fallbackWorkflows);
          setWorkflowError('Live workflows could not be loaded. Showing fallback recipes.');
        }
      } finally {
        if (!cancelled) setLoadingWorkflows(false);
      }
    }

    loadWorkflows();
    return () => { cancelled = true; };
  }, []);

  const visibleWorkflows = useMemo(() => workflows.filter(w => w.status === activeTab), [workflows, activeTab]);

  const handleToggleStatus = (id: number | string) => {
    setWorkflows(workflows.map(w => {
      if (w.id === id) {
        const nextStatus = w.status === 'Active' ? 'Paused' : 'Active';
        return { ...w, status: nextStatus };
      }
      return w;
    }));
  };

  const handleDeleteWorkflow = (id: number | string) => {
    setWorkflows(workflows.filter(w => w.id !== id));
  };

  const handleUseTemplate = (template: typeof templates[0]) => {
    setNewWorkflowName(template.name);
    setNewWorkflowDesc(template.desc);
    setCanvasNodes(template.nodes);
    setIsBuilderOpen(true);
  };

  const handleCreateNewWorkflow = () => {
    setNewWorkflowName("Custom Workflow Automation");
    setNewWorkflowDesc("Trigger triggers, filters, and actions in sequence.");
    setCanvasNodes([
      { id: "1", type: "trigger", category: "Record Updates", label: "Choose Trigger", desc: "Click to define starting condition", config: "Pending Setup" }
    ]);
    setIsBuilderOpen(true);
  };

  const handleAddNode = (type: 'trigger' | 'condition' | 'action') => {
    const newId = String(canvasNodes.length + 1);
    let category = '';
    let label = '';
    let desc = '';

    if (type === 'trigger') {
      category = 'Record Updates';
      label = 'New Trigger Rule';
      desc = 'Define automation start trigger';
    } else if (type === 'condition') {
      category = 'Property Filters';
      label = 'New Branch Condition';
      desc = 'Narrow contacts filtering';
    } else {
      category = 'Internal Actions';
      label = 'New CRM Action';
      desc = 'Send automated response or update records';
    }

    setCanvasNodes([...canvasNodes, { id: newId, type, category, label, desc, config: "Draft Setup" }]);
  };

  const handleSaveWorkflow = async () => {
    if (!newWorkflowName.trim()) return;

    const firstTrigger = canvasNodes.find(n => n.type === 'trigger');
    const newWf: Workflow = {
      id: Date.now(),
      name: newWorkflowName,
      desc: newWorkflowDesc || "No description provided.",
      triggerType: "creation",
      triggerLabel: firstTrigger ? firstTrigger.label : "Record Created",
      totalRuns: 0,
      successRate: "--",
      activeContacts: 0,
      status: "Draft"
    };

    try {
      await triggerAutomationDelivery('WORKFLOW_DRAFT_CREATED', {
        workflow_name: newWorkflowName,
        description: newWorkflowDesc,
        nodes: canvasNodes
      });
    } catch {
      // Keep the existing local draft flow even if webhook delivery is unavailable.
    }

    setWorkflows([newWf, ...workflows]);
    setIsBuilderOpen(false);
    setActiveTab('Draft');
  };

  const getTriggerIcon = (type: Workflow['triggerType']) => {
    switch (type) {
      case 'form_submission': return <FileText className="h-4 w-4 text-brand-purple" />;
      case 'stage_change': return <Sliders className="h-4 w-4 text-indigo-500" />;
      case 'time_delay': return <Clock className="h-4 w-4 text-amber-500" />;
      case 'creation': return <UserPlus className="h-4 w-4 text-brand-cyan" />;
    }
  };

  return (
    <div className="space-y-6">
      {!isBuilderOpen ? (
        // ----------------- LANDING SCREEN -----------------
        <div className="space-y-6">


          <div className="bg-card border border-border rounded-2xl p-5">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
              <div>
                <h2 className="font-sans text-2xl text-foreground font-bold">Automated Workflows</h2>
                <p className="text-[11px] text-muted-foreground mt-0.5 font-bold">Deploy automated rules, drip email schedules, Slack alerts, and lead assignment scripts.</p>
              </div>
              <button 
                onClick={handleCreateNewWorkflow}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-brand-purple hover:bg-brand-purple/90 text-primary-foreground rounded-lg text-xs font-semibold/10 transition-colors cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" strokeWidth={2.25} />
                <span>Create Workflow</span>
              </button>
            </div>

            {/* Categorized Tabs */}
            <div className="flex space-x-1.5 p-1 bg-secondary border border-border rounded-xl w-fit mb-5">
              {loadingWorkflows && (
                <span className="px-3 py-1.5 text-xs font-semibold text-muted-foreground">Loading live data...</span>
              )}
              {(['Active', 'Draft', 'Paused'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-1.5 px-4 rounded-lg font-semibold text-xs transition duration-200 cursor-pointer ${
                    activeTab === tab 
                      ? 'bg-brand-purple text-primary-foreground' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                  }`}
                >
                  {tab} ({workflows.filter(w => w.status === tab).length})
                </button>
              ))}
            </div>

            {workflowError && (
              <div className="mb-4 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-[11px] font-bold text-foreground">
                {workflowError}
              </div>
            )}

            {/* Workflow List Table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-border text-[9px] uppercase font-semibold tracking-wider text-foreground pb-2">
                    <th className="pb-2">Workflow Name & Scope</th>
                    <th className="pb-2">Trigger Event</th>
                    <th className="pb-2 text-center">Total Runs</th>
                    <th className="pb-2 text-center">Success Rate</th>
                    <th className="pb-2 text-center">Contacts In</th>
                    <th className="pb-2 text-center">Active Toggle</th>
                    <th className="pb-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-xs text-foreground font-semibold">
                  {visibleWorkflows.length > 0 ? (
                    visibleWorkflows.map((wf) => (
                        <tr key={wf.id} className="hover:bg-secondary/30 transition-colors">
                          <td className="py-3.5 pr-4 max-w-[280px]">
                            <div className="font-semibold text-foreground flex items-center gap-1.5">
                              <Zap className={`h-3.5 w-3.5 shrink-0 ${wf.status === 'Active' ? 'text-amber-500 animate-pulse' : 'text-muted-foreground'}`} />
                              <span className="truncate">{wf.name}</span>
                            </div>
                            <div className="text-[10px] text-muted-foreground mt-0.5 font-medium truncate" title={wf.desc}>
                              {wf.desc}
                            </div>
                          </td>
                          <td className="py-3.5 pr-3">
                            <div className="flex items-center space-x-1.5 bg-slate-55/60 border border-border px-2 py-1 rounded-lg w-fit text-[10px] font-bold text-foreground">
                              {getTriggerIcon(wf.triggerType)}
                              <span>{wf.triggerLabel}</span>
                            </div>
                          </td>
                          <td className="py-3.5 text-center tabular-nums text-muted-foreground">{wf.totalRuns.toLocaleString()}</td>
                          <td className="py-3.5 text-center tabular-nums text-muted-foreground">{wf.successRate}</td>
                          <td className="py-3.5 text-center tabular-nums font-bold text-brand-purple">{wf.activeContacts}</td>
                          <td className="py-3.5 text-center">
                            <button
                              onClick={() => handleToggleStatus(wf.id)}
                              className={`inline-flex items-center justify-center p-1 rounded-lg transition-colors cursor-pointer border ${
                                wf.status === 'Active'
                                  ? 'bg-brand-cyan/15 hover:bg-brand-cyan/20 border-brand-cyan/25 text-brand-cyan'
                                  : 'bg-secondary hover:bg-secondary border-border text-muted-foreground'
                              }`}
                              title={wf.status === 'Active' ? 'Pause Automation' : 'Activate Automation'}
                            >
                              {wf.status === 'Active' ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                            </button>
                          </td>
                          <td className="py-3.5 text-right">
                            <button
                              onClick={() => handleDeleteWorkflow(wf.id)}
                              className="p-1 hover:text-destructive text-muted-foreground rounded transition-colors cursor-pointer"
                              title="Delete Workflow"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-muted-foreground font-medium">
                        No {activeTab.toLowerCase()} workflows found. Create a new automation or load a template below.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pre-Built Templates Library */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="font-sans text-lg text-foreground font-semibold mb-3 flex items-center gap-1.5">
              <FolderOpen className="h-4.5 w-4.5 text-muted-foreground" />
              <span>Pre-Built Automation Templates</span>
            </h3>
            <p className="text-[11px] text-muted-foreground mb-5 font-bold">Skip configuration by choosing an optimized recipe for database leads, alerts, or messaging.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {templates.map((tpl, idx) => (
                <div 
                  key={idx}
                  className="border border-border hover:border-border rounded-xl p-4.5 bg-secondary/20 hover:bg-secondary transition flex flex-col justify-between"
                >
                  <div>
                    <span className="text-[9px] font-semibold uppercase bg-brand-secondary-accent/20 border border-border text-brand-purple px-1.5 py-0.5 rounded">
                      {tpl.trigger}
                    </span>
                    <h4 className="font-bold text-foreground text-xs mt-2.5">{tpl.name}</h4>
                    <p className="text-[10px] text-muted-foreground mt-1 font-semibold leading-relaxed">
                      {tpl.desc}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-border flex justify-between items-center">
                    <span className="text-[9px] font-bold text-muted-foreground">{tpl.nodes.length} Blocks configured</span>
                    <button 
                      onClick={() => handleUseTemplate(tpl)}
                      className="inline-flex items-center space-x-1 text-[10px] font-bold text-brand-purple hover:text-brand-purple-hover transition-colors cursor-pointer"
                    >
                      <span>Use Recipe</span>
                      <ChevronRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        // ----------------- VISUAL CANVAS BUILDER -----------------
        <div className="bg-secondary border border-border rounded-xl p-5 min-h-[580px] flex flex-col justify-between">
          {/* Builder Top Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border pb-4 bg-card -mx-5 -mt-5 p-5 rounded-t-xl">
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => setIsBuilderOpen(false)}
                className="p-1 hover:bg-secondary rounded-lg text-muted-foreground cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
              <div>
                <input 
                  type="text" 
                  value={newWorkflowName}
                  onChange={e => setNewWorkflowName(e.target.value)}
                  className="font-sans text-lg text-foreground focus:outline-none border-b border-transparent hover:border-border focus:border-brand-accent font-semibold bg-transparent"
                  placeholder="Untitled Automation Workflow"
                />
                <input 
                  type="text" 
                  value={newWorkflowDesc}
                  onChange={e => setNewWorkflowDesc(e.target.value)}
                  className="block text-[11px] text-muted-foreground focus:outline-none border-b border-transparent hover:border-border focus:border-brand-accent bg-transparent w-full mt-0.5 font-semibold"
                  placeholder="Describe your automation goals..."
                />
              </div>
            </div>

            <div className="flex items-center space-x-2.5">
              <button 
                onClick={() => setIsBuilderOpen(false)}
                className="px-3.5 py-1.5 border border-border rounded-lg text-xs font-bold text-muted-foreground hover:bg-secondary cursor-pointer"
              >
                Exit Canvas
              </button>
              <button 
                onClick={handleSaveWorkflow}
                className="px-3.5 py-1.5 bg-brand-purple hover:bg-brand-purple/90 text-primary-foreground rounded-lg text-xs font-semibold/10 flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Save & Deploy</span>
              </button>
            </div>
          </div>

          {/* Builder Visual Area */}
          <div className="flex-1 grid grid-cols-12 gap-5 py-6">
            {/* Left Sidebar: Node Adders & Config */}
            <div className="col-span-12 md:col-span-4 space-y-4">
              <div className="bg-card border border-border rounded-xl p-4.5 space-y-3.5">
                <h4 className="text-[10px] font-semibold text-foreground uppercase tracking-wider border-b border-slate-50 pb-1.5">
                  Flow Block Palette
                </h4>
                
                {/* Trigger Adder */}
                <button 
                  onClick={() => handleAddNode('trigger')}
                  className="w-full flex items-center justify-between p-2.5 border border-brand-cyan/20 hover:border-emerald-300 bg-brand-cyan/15/30 hover:bg-brand-cyan/15/60 rounded-xl transition cursor-pointer group text-left"
                >
                  <div className="flex items-center space-x-2">
                    <span className="h-7 w-7 rounded-lg bg-brand-cyan/150/10 text-brand-cyan flex items-center justify-center shrink-0 border border-brand-cyan/25">
                      <Zap className="h-4 w-4" />
                    </span>
                    <div>
                      <span className="text-xs font-semibold text-emerald-800 block">🟢 Trigger Node</span>
                      <span className="text-[9px] text-muted-foreground font-semibold block leading-tight">Define entry criteria</span>
                    </div>
                  </div>
                  <Plus className="h-4 w-4 text-brand-cyan opacity-60 group-hover:opacity-100 shrink-0" />
                </button>

                {/* Condition Adder */}
                <button 
                  onClick={() => handleAddNode('condition')}
                  className="w-full flex items-center justify-between p-2.5 border border-brand-purple/15 hover:border-indigo-300 bg-brand-purple/10/30 hover:bg-brand-purple/10/60 rounded-xl transition cursor-pointer group text-left"
                >
                  <div className="flex items-center space-x-2">
                    <span className="h-7 w-7 rounded-lg bg-brand-purple/100/10 text-brand-purple flex items-center justify-center shrink-0 border border-brand-purple/20">
                      <Sliders className="h-4 w-4" />
                    </span>
                    <div>
                      <span className="text-xs font-semibold text-indigo-800 block">🔀 Filter Condition</span>
                      <span className="text-[9px] text-muted-foreground font-semibold block leading-tight">If/Else branch filter</span>
                    </div>
                  </div>
                  <Plus className="h-4 w-4 text-brand-purple opacity-60 group-hover:opacity-100 shrink-0" />
                </button>

                {/* Action Adder */}
                <button 
                  onClick={() => handleAddNode('action')}
                  className="w-full flex items-center justify-between p-2.5 border border-border hover:border-border bg-brand-secondary-accent/5 hover:bg-brand-purple/5 rounded-xl transition cursor-pointer group text-left"
                >
                  <div className="flex items-center space-x-2">
                    <span className="h-7 w-7 rounded-lg bg-brand-purple/10 text-brand-purple flex items-center justify-center shrink-0 border border-border">
                      <Mail className="h-4 w-4" />
                    </span>
                    <div>
                      <span className="text-xs font-semibold text-brand-purple block">🔵 CRM Action</span>
                      <span className="text-[9px] text-muted-foreground font-semibold block leading-tight">Task, Slack, or Email outbound</span>
                    </div>
                  </div>
                  <Plus className="h-4 w-4 text-brand-purple opacity-60 group-hover:opacity-100 shrink-0" />
                </button>
              </div>

              {/* Configure Panel */}
              {activeConfigNode !== null ? (
                <div className="bg-card border border-border rounded-2xl p-4.5 animate-in fade-in duration-200">
                  <div className="flex justify-between items-center border-b border-slate-50 pb-2 mb-3">
                    <h4 className="text-[10px] font-semibold text-foreground uppercase tracking-wider">
                      Edit Block Configuration
                    </h4>
                    <button onClick={() => setActiveConfigNode(null)} className="text-muted-foreground p-1"><X className="h-3.5 w-3.5" /></button>
                  </div>
                  
                  {(() => {
                    const node = canvasNodes.find(n => n.id === activeConfigNode);
                    if (!node) return null;
                    return (
                      <div className="space-y-3.5">
                        <div>
                          <label className="block text-[9px] font-semibold text-foreground uppercase tracking-wider mb-1">Block Label</label>
                          <input 
                            type="text" 
                            value={node.label}
                            onChange={(e) => {
                              const val = e.target.value;
                              setCanvasNodes(canvasNodes.map(n => n.id === node.id ? { ...n, label: val } : n));
                            }}
                            className="w-full px-3 py-1.5 border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-brand-purple/20" 
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-semibold text-foreground uppercase tracking-wider mb-1">Trigger Subcategory</label>
                          <select 
                            value={node.category}
                            onChange={(e) => {
                              const val = e.target.value;
                              setCanvasNodes(canvasNodes.map(n => n.id === node.id ? { ...n, category: val } : n));
                            }}
                            className="w-full px-2 py-1.5 border border-border bg-card text-foreground rounded-lg text-xs focus:outline-none cursor-pointer"
                          >
                            {node.type === 'trigger' && (
                              <>
                                <option>Record Updates</option>
                                <option>User Actions</option>
                                <option>Time-Based Events</option>
                              </>
                            )}
                            {node.type === 'condition' && (
                              <>
                                <option>Property Filters</option>
                                <option>If/Else Branches</option>
                              </>
                            )}
                            {node.type === 'action' && (
                              <>
                                <option>Internal Actions</option>
                                <option>External Actions</option>
                                <option>Delays & Timers</option>
                              </>
                            )}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[9px] font-semibold text-foreground uppercase tracking-wider mb-1">Rules / Configuration</label>
                          <input 
                            type="text" 
                            value={node.config}
                            onChange={(e) => {
                              const val = e.target.value;
                              setCanvasNodes(canvasNodes.map(n => n.id === node.id ? { ...n, config: val } : n));
                            }}
                            className="w-full px-3 py-1.5 border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-brand-purple/20 font-mono text-[10px]" 
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-semibold text-foreground uppercase tracking-wider mb-1">Description</label>
                          <textarea 
                            rows={2}
                            value={node.desc}
                            onChange={(e) => {
                              const val = e.target.value;
                              setCanvasNodes(canvasNodes.map(n => n.id === node.id ? { ...n, desc: val } : n));
                            }}
                            className="w-full px-3 py-1.5 border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-brand-purple/20 resize-none font-semibold" 
                          />
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="bg-card border border-border rounded-xl p-4.5 text-center text-muted-foreground font-semibold text-xs py-10">
                  <HelpCircle className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  Select any block on the canvas to configure triggers, rules, filters, or delays.
                </div>
              )}
            </div>

            {/* Right Canvas: Drag-and-drop Nodes Flow */}
            <div className="col-span-12 md:col-span-8 flex flex-col items-center py-4 bg-card border border-border rounded-xl overflow-y-auto max-h-[480px]">
              {canvasNodes.length > 0 ? (
                canvasNodes.map((node, idx) => (
                  <React.Fragment key={node.id}>
                    {/* Node Container Card */}
                    <div 
                      onClick={() => setActiveConfigNode(node.id)}
                      className={`relative w-80 max-w-full p-4 border rounded-xl hover:shadow-nav cursor-pointer transition ${
                        activeConfigNode === node.id 
                          ? 'border-brand-accent ring-2 ring-brand-accent/15 bg-brand-secondary-accent/5' 
                          : 'border-border bg-secondary/20'
                      }`}
                    >
                      {/* Delete node top corner */}
                      {canvasNodes.length > 1 && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (activeConfigNode === node.id) setActiveConfigNode(null);
                            setCanvasNodes(canvasNodes.filter(n => n.id !== node.id));
                          }}
                          className="absolute right-2 top-2 p-1 text-muted-foreground hover:text-destructive rounded cursor-pointer"
                          title="Delete Block"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}

                      <div className="flex items-start space-x-3">
                        <span className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border ${
                          node.type === 'trigger' ? 'bg-brand-cyan/15 text-brand-cyan border-brand-cyan/20' :
                          node.type === 'condition' ? 'bg-brand-purple/10 text-brand-purple border-brand-purple/15' :
                          'bg-brand-purple/10 text-brand-purple border-border'
                        }`}>
                          {node.type === 'trigger' ? <Zap className="h-4.5 w-4.5" /> :
                           node.type === 'condition' ? <Sliders className="h-4.5 w-4.5" /> :
                           <Mail className="h-4.5 w-4.5" />}
                        </span>
                        
                        <div className="space-y-1 pr-6">
                          <span className={`text-[8px] font-semibold uppercase px-1.5 py-0.5 rounded leading-none ${
                            node.type === 'trigger' ? 'text-brand-cyan bg-brand-cyan/15 border border-brand-cyan/20' :
                            node.type === 'condition' ? 'text-brand-purple bg-brand-purple/10 border border-brand-purple/15' :
                            'text-brand-purple bg-brand-purple/5 border border-border'
                          }`}>
                            {node.category}
                          </span>
                          <h5 className="font-semibold text-foreground text-xs leading-snug">{node.label}</h5>
                          <p className="text-[10px] text-muted-foreground leading-tight font-medium">{node.desc}</p>
                          {node.config && (
                            <div className="font-mono text-[9px] text-brand-purple font-bold mt-1 max-w-full truncate bg-secondary p-1 rounded border border-border">
                              {node.config}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Visual Connector Line between nodes */}
                    {idx < canvasNodes.length - 1 && (
                      <div className="flex flex-col items-center py-2">
                        <div className="w-0.5 h-6 bg-brand-border-purple/25" />
                        <div className="w-2 h-2 rounded-full bg-brand-border-purple/35 -mt-1.5" />
                      </div>
                    )}
                  </React.Fragment>
                ))
              ) : (
                <div className="text-muted-foreground font-semibold text-xs py-10">No nodes on the canvas. Add one using the palette on the left.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

