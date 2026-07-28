'use client';

import React, { useState } from 'react';
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
  id: number;
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

export default function WorkflowsView() {
  const [workflows, setWorkflows] = useState<Workflow[]>([
    { id: 1, name: "Lead Assignment Automation", desc: "Auto-assigns new enterprise leads to regional reps based on geolocation.", triggerType: "creation", triggerLabel: "New Lead Created", totalRuns: 1240, successRate: "99.8%", activeContacts: 24, status: "Active" },
    { id: 2, name: "SaaS Free Trial Nurture", desc: "Sends a welcome email series and checks product usage milestones.", triggerType: "form_submission", triggerLabel: "Trial Sign-Up Form", totalRuns: 850, successRate: "97.5%", activeContacts: 112, status: "Active" },
    { id: 3, name: "Stale Deal Slack Alerts", desc: "Notifies account executives when a deal remains in 'Proposal' for over 10 days.", triggerType: "time_delay", triggerLabel: "10 Days Inactivity", totalRuns: 310, successRate: "100%", activeContacts: 15, status: "Active" },
    { id: 4, name: "Post-Purchase NDA Request", desc: "Sends NDAs and custom contract SLA drafts once a deal moves to Negotiation.", triggerType: "stage_change", triggerLabel: "Stage: Negotiation", totalRuns: 145, successRate: "98.2%", activeContacts: 4, status: "Paused" },
    { id: 5, name: "Q4 Marketing Inbound Scoring", desc: "Increments lead scores by 15 points when they open high-intent links.", triggerType: "form_submission", triggerLabel: "Pricing Link Clicked", totalRuns: 0, successRate: "--", activeContacts: 0, status: "Draft" }
  ]);

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

  const handleToggleStatus = (id: number) => {
    setWorkflows(workflows.map(w => {
      if (w.id === id) {
        const nextStatus = w.status === 'Active' ? 'Paused' : 'Active';
        return { ...w, status: nextStatus };
      }
      return w;
    }));
  };

  const handleDeleteWorkflow = (id: number) => {
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

  const handleSaveWorkflow = () => {
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

    setWorkflows([newWf, ...workflows]);
    setIsBuilderOpen(false);
    setActiveTab('Draft');
  };

  const getTriggerIcon = (type: Workflow['triggerType']) => {
    switch (type) {
      case 'form_submission': return <FileText className="h-4 w-4 text-brand-accent" />;
      case 'stage_change': return <Sliders className="h-4 w-4 text-indigo-500" />;
      case 'time_delay': return <Clock className="h-4 w-4 text-amber-500" />;
      case 'creation': return <UserPlus className="h-4 w-4 text-emerald-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {!isBuilderOpen ? (
        // ----------------- LANDING SCREEN -----------------
        <div className="space-y-6">
          <div className="bg-white border border-brand-border-purple/20 rounded-xl p-5 shadow-sm/5">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
              <div>
                <h2 className="font-sans text-2xl text-brand-heading font-bold">Automated Workflows</h2>
                <p className="text-[11px] text-brand-text/60 mt-0.5 font-bold">Deploy automated rules, drip email schedules, Slack alerts, and lead assignment scripts.</p>
              </div>
              <button 
                onClick={handleCreateNewWorkflow}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-brand-accent hover:bg-brand-accent-hover text-white rounded-lg text-xs font-bold shadow-sm/10 transition-colors cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" strokeWidth={2.25} />
                <span>Create Workflow</span>
              </button>
            </div>

            {/* Categorized Tabs */}
            <div className="flex space-x-1.5 p-1 bg-brand-sidebar-hover/15 border border-brand-border-purple/20 rounded-xl w-fit mb-5">
              {(['Active', 'Draft', 'Paused'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-1.5 px-4 rounded-lg font-extrabold text-xs transition-all duration-200 cursor-pointer ${
                    activeTab === tab 
                      ? 'bg-brand-accent text-white shadow-sm' 
                      : 'text-brand-text/75 hover:text-brand-heading hover:bg-brand-sidebar-hover/20'
                  }`}
                >
                  {tab} ({workflows.filter(w => w.status === tab).length})
                </button>
              ))}
            </div>

            {/* Workflow List Table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-brand-border-purple/20 text-[9px] uppercase font-extrabold tracking-wider text-brand-heading pb-2">
                    <th className="pb-2">Workflow Name & Scope</th>
                    <th className="pb-2">Trigger Event</th>
                    <th className="pb-2 text-center">Total Runs</th>
                    <th className="pb-2 text-center">Success Rate</th>
                    <th className="pb-2 text-center">Contacts In</th>
                    <th className="pb-2 text-center">Active Toggle</th>
                    <th className="pb-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border-purple/15 text-xs text-brand-text font-semibold">
                  {workflows.filter(w => w.status === activeTab).length > 0 ? (
                    workflows
                      .filter(w => w.status === activeTab)
                      .map((wf) => (
                        <tr key={wf.id} className="hover:bg-slate-50/30 transition-colors">
                          <td className="py-3.5 pr-4 max-w-[280px]">
                            <div className="font-extrabold text-brand-heading flex items-center gap-1.5">
                              <Zap className={`h-3.5 w-3.5 shrink-0 ${wf.status === 'Active' ? 'text-amber-500 animate-pulse' : 'text-slate-400'}`} />
                              <span className="truncate">{wf.name}</span>
                            </div>
                            <div className="text-[10px] text-brand-text/60 mt-0.5 font-medium truncate" title={wf.desc}>
                              {wf.desc}
                            </div>
                          </td>
                          <td className="py-3.5 pr-3">
                            <div className="flex items-center space-x-1.5 bg-slate-55/60 border border-brand-border-purple/20 px-2 py-1 rounded-lg w-fit text-[10px] font-bold text-brand-heading">
                              {getTriggerIcon(wf.triggerType)}
                              <span>{wf.triggerLabel}</span>
                            </div>
                          </td>
                          <td className="py-3.5 text-center tabular-nums text-slate-500">{wf.totalRuns.toLocaleString()}</td>
                          <td className="py-3.5 text-center tabular-nums text-slate-500">{wf.successRate}</td>
                          <td className="py-3.5 text-center tabular-nums font-bold text-brand-accent">{wf.activeContacts}</td>
                          <td className="py-3.5 text-center">
                            <button
                              onClick={() => handleToggleStatus(wf.id)}
                              className={`inline-flex items-center justify-center p-1 rounded-lg transition-colors cursor-pointer border ${
                                wf.status === 'Active'
                                  ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-600'
                                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-400'
                              }`}
                              title={wf.status === 'Active' ? 'Pause Automation' : 'Activate Automation'}
                            >
                              {wf.status === 'Active' ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                            </button>
                          </td>
                          <td className="py-3.5 text-right">
                            <button
                              onClick={() => handleDeleteWorkflow(wf.id)}
                              className="p-1 hover:text-rose-600 text-slate-450 rounded transition-colors cursor-pointer"
                              title="Delete Workflow"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-slate-400 font-medium">
                        No {activeTab.toLowerCase()} workflows found. Create a new automation or load a template below.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pre-Built Templates Library */}
          <div className="bg-white border border-brand-border-purple/20 rounded-xl p-5 shadow-sm/5">
            <h3 className="font-sans text-lg text-brand-heading font-semibold mb-3 flex items-center gap-1.5">
              <FolderOpen className="h-4.5 w-4.5 text-slate-400" />
              <span>Pre-Built Automation Templates</span>
            </h3>
            <p className="text-[11px] text-brand-text/60 mb-5 font-bold">Skip configuration by choosing an optimized recipe for database leads, alerts, or messaging.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {templates.map((tpl, idx) => (
                <div 
                  key={idx}
                  className="border border-brand-border-purple/20 hover:border-brand-border-purple/45 rounded-xl p-4.5 bg-slate-50/20 hover:bg-slate-50/50 transition-all flex flex-col justify-between"
                >
                  <div>
                    <span className="text-[9px] font-extrabold uppercase bg-brand-secondary-accent/20 border border-brand-border-purple/25 text-brand-accent px-1.5 py-0.5 rounded">
                      {tpl.trigger}
                    </span>
                    <h4 className="font-bold text-brand-heading text-xs mt-2.5">{tpl.name}</h4>
                    <p className="text-[10px] text-brand-text/75 mt-1 font-semibold leading-relaxed">
                      {tpl.desc}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center">
                    <span className="text-[9px] font-bold text-slate-400">{tpl.nodes.length} Blocks configured</span>
                    <button 
                      onClick={() => handleUseTemplate(tpl)}
                      className="inline-flex items-center space-x-1 text-[10px] font-bold text-brand-accent hover:text-brand-accent-hover transition-colors cursor-pointer"
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
        <div className="bg-slate-50 border border-brand-border-purple/20 rounded-xl p-5 shadow-sm/5 min-h-[580px] flex flex-col justify-between">
          {/* Builder Top Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-brand-border-purple/15 pb-4 bg-white -mx-5 -mt-5 p-5 rounded-t-xl">
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => setIsBuilderOpen(false)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-450 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
              <div>
                <input 
                  type="text" 
                  value={newWorkflowName}
                  onChange={e => setNewWorkflowName(e.target.value)}
                  className="font-sans text-lg text-brand-heading focus:outline-none border-b border-transparent hover:border-slate-300 focus:border-brand-accent font-semibold bg-transparent"
                  placeholder="Untitled Automation Workflow"
                />
                <input 
                  type="text" 
                  value={newWorkflowDesc}
                  onChange={e => setNewWorkflowDesc(e.target.value)}
                  className="block text-[11px] text-brand-text/60 focus:outline-none border-b border-transparent hover:border-slate-300 focus:border-brand-accent bg-transparent w-full mt-0.5 font-semibold"
                  placeholder="Describe your automation goals..."
                />
              </div>
            </div>

            <div className="flex items-center space-x-2.5">
              <button 
                onClick={() => setIsBuilderOpen(false)}
                className="px-3.5 py-1.5 border border-brand-border-purple/30 rounded-lg text-xs font-bold text-brand-text/75 hover:bg-slate-50 cursor-pointer"
              >
                Exit Canvas
              </button>
              <button 
                onClick={handleSaveWorkflow}
                className="px-3.5 py-1.5 bg-brand-accent hover:bg-brand-accent-hover text-white rounded-lg text-xs font-bold shadow-sm/10 flex items-center gap-1.5 cursor-pointer"
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
              <div className="bg-white border border-brand-border-purple/15 rounded-xl p-4.5 space-y-3.5">
                <h4 className="text-[10px] font-extrabold text-brand-heading uppercase tracking-wider border-b border-slate-50 pb-1.5">
                  Flow Block Palette
                </h4>
                
                {/* Trigger Adder */}
                <button 
                  onClick={() => handleAddNode('trigger')}
                  className="w-full flex items-center justify-between p-2.5 border border-emerald-100 hover:border-emerald-300 bg-emerald-50/30 hover:bg-emerald-50/60 rounded-xl transition-all cursor-pointer group text-left"
                >
                  <div className="flex items-center space-x-2">
                    <span className="h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200">
                      <Zap className="h-4 w-4" />
                    </span>
                    <div>
                      <span className="text-xs font-extrabold text-emerald-800 block">🟢 Trigger Node</span>
                      <span className="text-[9px] text-slate-500 font-semibold block leading-tight">Define entry criteria</span>
                    </div>
                  </div>
                  <Plus className="h-4 w-4 text-emerald-600 opacity-60 group-hover:opacity-100 shrink-0" />
                </button>

                {/* Condition Adder */}
                <button 
                  onClick={() => handleAddNode('condition')}
                  className="w-full flex items-center justify-between p-2.5 border border-indigo-100 hover:border-indigo-300 bg-indigo-50/30 hover:bg-indigo-50/60 rounded-xl transition-all cursor-pointer group text-left"
                >
                  <div className="flex items-center space-x-2">
                    <span className="h-7 w-7 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-200">
                      <Sliders className="h-4 w-4" />
                    </span>
                    <div>
                      <span className="text-xs font-extrabold text-indigo-800 block">🔀 Filter Condition</span>
                      <span className="text-[9px] text-slate-500 font-semibold block leading-tight">If/Else branch filter</span>
                    </div>
                  </div>
                  <Plus className="h-4 w-4 text-indigo-600 opacity-60 group-hover:opacity-100 shrink-0" />
                </button>

                {/* Action Adder */}
                <button 
                  onClick={() => handleAddNode('action')}
                  className="w-full flex items-center justify-between p-2.5 border border-brand-border-purple/20 hover:border-brand-border-purple/40 bg-brand-secondary-accent/5 hover:bg-brand-secondary-accent/10 rounded-xl transition-all cursor-pointer group text-left"
                >
                  <div className="flex items-center space-x-2">
                    <span className="h-7 w-7 rounded-lg bg-brand-accent/10 text-brand-accent flex items-center justify-center shrink-0 border border-brand-border-purple/30">
                      <Mail className="h-4 w-4" />
                    </span>
                    <div>
                      <span className="text-xs font-extrabold text-brand-accent block">🔵 CRM Action</span>
                      <span className="text-[9px] text-slate-500 font-semibold block leading-tight">Task, Slack, or Email outbound</span>
                    </div>
                  </div>
                  <Plus className="h-4 w-4 text-brand-accent opacity-60 group-hover:opacity-100 shrink-0" />
                </button>
              </div>

              {/* Configure Panel */}
              {activeConfigNode !== null ? (
                <div className="bg-white border border-brand-border-purple/20 rounded-xl p-4.5 animate-in fade-in duration-200">
                  <div className="flex justify-between items-center border-b border-slate-50 pb-2 mb-3">
                    <h4 className="text-[10px] font-extrabold text-brand-heading uppercase tracking-wider">
                      Edit Block Configuration
                    </h4>
                    <button onClick={() => setActiveConfigNode(null)} className="text-slate-450 p-1"><X className="h-3.5 w-3.5" /></button>
                  </div>
                  
                  {(() => {
                    const node = canvasNodes.find(n => n.id === activeConfigNode);
                    if (!node) return null;
                    return (
                      <div className="space-y-3.5">
                        <div>
                          <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Block Label</label>
                          <input 
                            type="text" 
                            value={node.label}
                            onChange={(e) => {
                              const val = e.target.value;
                              setCanvasNodes(canvasNodes.map(n => n.id === node.id ? { ...n, label: val } : n));
                            }}
                            className="w-full px-3 py-1.5 border border-brand-border-purple/35 rounded-lg text-xs text-brand-text focus:outline-none focus:ring-1 focus:ring-brand-accent/20" 
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Trigger Subcategory</label>
                          <select 
                            value={node.category}
                            onChange={(e) => {
                              const val = e.target.value;
                              setCanvasNodes(canvasNodes.map(n => n.id === node.id ? { ...n, category: val } : n));
                            }}
                            className="w-full px-2 py-1.5 border border-brand-border-purple/35 bg-white text-brand-text rounded-lg text-xs focus:outline-none cursor-pointer"
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
                          <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Rules / Configuration</label>
                          <input 
                            type="text" 
                            value={node.config}
                            onChange={(e) => {
                              const val = e.target.value;
                              setCanvasNodes(canvasNodes.map(n => n.id === node.id ? { ...n, config: val } : n));
                            }}
                            className="w-full px-3 py-1.5 border border-brand-border-purple/35 rounded-lg text-xs text-brand-text focus:outline-none focus:ring-1 focus:ring-brand-accent/20 font-mono text-[10px]" 
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Description</label>
                          <textarea 
                            rows={2}
                            value={node.desc}
                            onChange={(e) => {
                              const val = e.target.value;
                              setCanvasNodes(canvasNodes.map(n => n.id === node.id ? { ...n, desc: val } : n));
                            }}
                            className="w-full px-3 py-1.5 border border-brand-border-purple/35 rounded-lg text-xs text-brand-text focus:outline-none focus:ring-1 focus:ring-brand-accent/20 resize-none font-semibold" 
                          />
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="bg-white border border-brand-border-purple/15 rounded-xl p-4.5 text-center text-slate-400 font-semibold text-xs py-10">
                  <HelpCircle className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                  Select any block on the canvas to configure triggers, rules, filters, or delays.
                </div>
              )}
            </div>

            {/* Right Canvas: Drag-and-drop Nodes Flow */}
            <div className="col-span-12 md:col-span-8 flex flex-col items-center py-4 bg-white border border-brand-border-purple/15 rounded-xl overflow-y-auto max-h-[480px]">
              {canvasNodes.length > 0 ? (
                canvasNodes.map((node, idx) => (
                  <React.Fragment key={node.id}>
                    {/* Node Container Card */}
                    <div 
                      onClick={() => setActiveConfigNode(node.id)}
                      className={`relative w-80 max-w-full p-4 border rounded-xl shadow-sm/5 hover:shadow-md cursor-pointer transition-all ${
                        activeConfigNode === node.id 
                          ? 'border-brand-accent ring-2 ring-brand-accent/15 bg-brand-secondary-accent/5' 
                          : 'border-brand-border-purple/20 bg-slate-50/20'
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
                          className="absolute right-2 top-2 p-1 text-slate-400 hover:text-rose-500 rounded cursor-pointer"
                          title="Delete Block"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}

                      <div className="flex items-start space-x-3">
                        <span className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border ${
                          node.type === 'trigger' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                          node.type === 'condition' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                          'bg-purple-50 text-brand-accent border-brand-border-purple/30'
                        }`}>
                          {node.type === 'trigger' ? <Zap className="h-4.5 w-4.5" /> :
                           node.type === 'condition' ? <Sliders className="h-4.5 w-4.5" /> :
                           <Mail className="h-4.5 w-4.5" />}
                        </span>
                        
                        <div className="space-y-1 pr-6">
                          <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded leading-none ${
                            node.type === 'trigger' ? 'text-emerald-700 bg-emerald-50 border border-emerald-100' :
                            node.type === 'condition' ? 'text-indigo-700 bg-indigo-50 border border-indigo-100' :
                            'text-brand-accent bg-brand-secondary-accent/10 border border-brand-border-purple/20'
                          }`}>
                            {node.category}
                          </span>
                          <h5 className="font-extrabold text-brand-heading text-xs leading-snug">{node.label}</h5>
                          <p className="text-[10px] text-brand-text/60 leading-tight font-medium">{node.desc}</p>
                          {node.config && (
                            <div className="font-mono text-[9px] text-brand-accent font-bold mt-1 max-w-full truncate bg-slate-50 p-1 rounded border border-brand-border-purple/15">
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
                <div className="text-slate-400 font-semibold text-xs py-10">No nodes on the canvas. Add one using the palette on the left.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
