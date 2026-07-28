'use client';

import React, { useState, useEffect } from 'react';
import { 
  GitBranch, 
  Play, 
  Cpu, 
  ListTodo, 
  ArrowRight, 
  Plus, 
  Activity, 
  CheckCircle, 
  AlertTriangle,
  X,
  Globe
} from 'lucide-react';
import { getWebhookEndpoints, createWebhookEndpoint } from '@/utils/api';

interface WebhookEndpoint {
  id: string;
  name: string;
  target_url: string;
  event_types: string[];
  is_active: boolean;
  max_attempts: number;
}

export default function AutomationView() {
  const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [newWorkflowName, setNewWorkflowName] = useState('');
  const [newWorkflowUrl, setNewWorkflowUrl] = useState('');
  const [selectedTriggers, setSelectedTriggers] = useState<string[]>(['lead.score_updated']);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Execution logs simulator state
  const [logs, setLogs] = useState([
    { id: "W001", workflow: "Slack Lead Alerts", trigger: "lead.score_updated", time: "5 mins ago", status: "Success", duration: "140ms" },
    { id: "W002", workflow: "CRM Stage Followup", trigger: "deal.stage_changed", time: "45 mins ago", status: "Success", duration: "210ms" }
  ]);

  const loadEndpoints = () => {
    getWebhookEndpoints().then(res => {
      setEndpoints(res || []);
      setLoading(false);
    }).catch(err => {
      console.error("Failed to load automation endpoints:", err);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadEndpoints();
  }, []);

  const handleTestWorkflow = (workflowName: string, triggerEvent: string) => {
    setToast(`Test payload dispatched for "${workflowName}".`);
    
    // Simulate adding to execution history log
    const newLog = {
      id: `W0${Math.floor(Math.random() * 900) + 100}`,
      workflow: workflowName,
      trigger: triggerEvent,
      time: "Just now",
      status: "Success",
      duration: `${Math.floor(Math.random() * 200) + 80}ms`
    };
    setLogs(prev => [newLog, ...prev]);

    setTimeout(() => setToast(null), 3000);
  };

  const handleCreateWorkflow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkflowName || !newWorkflowUrl) return;

    // Validate URL structure roughly
    if (!newWorkflowUrl.startsWith('http://') && !newWorkflowUrl.startsWith('https://')) {
      alert("Target URL must start with http:// or https://");
      return;
    }

    setIsSubmitting(true);
    createWebhookEndpoint({
      name: newWorkflowName,
      target_url: newWorkflowUrl,
      event_types: selectedTriggers,
      secret: "pulse-crm-custom-secret-key-16-bytes" // compliant min length
    }).then(() => {
      setToast(`Automation workflow "${newWorkflowName}" created successfully!`);
      setTimeout(() => setToast(null), 3000);
      
      // Reset & reload
      setNewWorkflowName('');
      setNewWorkflowUrl('');
      setSelectedTriggers(['lead.score_updated']);
      setShowModal(false);
      setIsSubmitting(false);
      setLoading(true);
      loadEndpoints();
    }).catch(err => {
      console.error("Failed to register webhook automation:", err);
      alert("Failed to save workflow. Please check target URL syntax.");
      setIsSubmitting(false);
    });
  };

  const toggleTriggerSelection = (t: string) => {
    if (selectedTriggers.includes(t)) {
      setSelectedTriggers(selectedTriggers.filter(x => x !== t));
    } else {
      setSelectedTriggers([...selectedTriggers, t]);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-white border border-brand-border-purple/20 rounded-xl p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-accent"></div>
        <p className="text-xs text-brand-text/60 mt-4 font-bold">Synchronizing automation webhook handlers...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-55 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center space-x-2 text-xs font-bold animate-in fade-in slide-in-from-bottom-2 duration-300">
          <CheckCircle className="h-4 w-4 text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-sans text-brand-heading tracking-tight font-bold">
            Automation &amp; Workflows
          </h1>
          <p className="text-xs md:text-sm text-brand-text/75 mt-1 font-medium tracking-wide">
            Design automated triggers and notification chains to accelerate outbound client conversions.
          </p>
        </div>

        <button 
          onClick={() => setShowModal(true)}
          className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-brand-accent hover:bg-brand-accent-hover text-white rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer shadow-sm self-start sm:self-center"
        >
          <Plus className="h-4 w-4" />
          <span>New Workflow</span>
        </button>
      </div>

      {/* 1. Workflow Builder Canvas Mockup */}
      <div className="bg-white border border-brand-border-purple/20 rounded-xl p-5 shadow-sm/5 space-y-4">
        <h3 className="font-extrabold text-brand-heading text-sm flex items-center">
          <GitBranch className="h-4.5 w-4.5 mr-2 text-brand-accent" />
          <span>Visual Workflow Builder Canvas</span>
        </h3>

        <div className="p-6 bg-slate-50 border border-slate-100 rounded-xl flex flex-col md:flex-row items-center justify-center gap-4 text-center md:text-left relative overflow-hidden">
          {/* Node 1 */}
          <div className="bg-white border border-brand-border-purple/35 rounded-xl p-4 shadow-sm/5 w-60 space-y-1.5 relative z-10">
            <span className="text-[9px] font-black text-brand-accent bg-brand-accent/10 px-2 py-0.5 rounded uppercase tracking-wider">
              Trigger Node
            </span>
            <h4 className="text-xs font-extrabold text-brand-text">Lead qualification score updated</h4>
            <p className="text-[10px] text-slate-450 leading-relaxed font-semibold">Checks if score is ≥ 80 points</p>
          </div>

          <ArrowRight className="h-5 w-5 text-brand-border-purple/65 hidden md:block shrink-0" strokeWidth={2} />

          {/* Node 2 */}
          <div className="bg-white border border-brand-border-purple/35 rounded-xl p-4 shadow-sm/5 w-60 space-y-1.5 relative z-10">
            <span className="text-[9px] font-black text-brand-blue bg-brand-blue/10 px-2 py-0.5 rounded uppercase tracking-wider">
              Condition Node
            </span>
            <h4 className="text-xs font-extrabold text-brand-text">Check target region</h4>
            <p className="text-[10px] text-slate-450 leading-relaxed font-semibold">Validates if Territory = 'Enterprise'</p>
          </div>

          <ArrowRight className="h-5 w-5 text-brand-border-purple/65 hidden md:block shrink-0" strokeWidth={2} />

          {/* Node 3 */}
          <div className="bg-white border border-brand-border-purple/35 rounded-xl p-4 shadow-sm/5 w-60 space-y-1.5 relative z-10">
            <span className="text-[9px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded uppercase tracking-wider">
              Action Node
            </span>
            <h4 className="text-xs font-extrabold text-brand-text">Post notification to Slack</h4>
            <p className="text-[10px] text-slate-450 leading-relaxed font-semibold">Dispatches message details to #sales-leads</p>
          </div>
        </div>
      </div>

      {/* 2. Registered Workflows list */}
      <div className="bg-white border border-brand-border-purple/20 rounded-xl p-5 shadow-sm/5 space-y-4">
        <h3 className="font-extrabold text-brand-heading text-sm flex items-center">
          <Globe className="h-4.5 w-4.5 mr-2 text-brand-accent" />
          <span>Active Webhook Workflows ({endpoints.length})</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {endpoints.length > 0 ? (
            endpoints.map(ep => (
              <div key={ep.id} className="p-4 border border-brand-border-purple/20 rounded-xl bg-slate-50/50 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex justify-between items-start">
                    <h4 className="text-xs font-extrabold text-brand-heading">{ep.name}</h4>
                    <span className={`text-[8.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                      ep.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {ep.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-[10px] text-brand-accent font-mono truncate mt-1">{ep.target_url}</p>
                  
                  <div className="flex flex-wrap gap-1 mt-2.5">
                    {ep.event_types.map(ev => (
                      <span key={ev} className="text-[8px] font-extrabold bg-brand-accent/15 text-brand-accent px-1.5 py-0.5 rounded">
                        {ev}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-brand-border-purple/10 flex justify-end">
                  <button 
                    onClick={() => handleTestWorkflow(ep.name, ep.event_types[0] || 'manual')}
                    className="inline-flex items-center space-x-1 px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-md text-[9px] font-black text-brand-text cursor-pointer transition-colors"
                  >
                    <Play className="h-3 w-3 text-brand-accent" />
                    <span>TEST PLAYLOAD</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-2 py-6 text-center text-xs text-slate-400 font-bold border border-dashed border-slate-200 rounded-xl bg-slate-50/20">
              No webhook endpoints registered. Click "New Workflow" to create one.
            </div>
          )}
        </div>
      </div>

      {/* 3. Automation Execution Logs */}
      <div className="bg-white border border-brand-border-purple/20 rounded-xl p-5 shadow-sm/5 space-y-4">
        <h3 className="font-extrabold text-brand-heading text-sm flex items-center">
          <Activity className="h-4.5 w-4.5 mr-2 text-brand-accent" />
          <span>Workflow execution history Logs</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] uppercase font-extrabold text-black">
                <th className="py-2.5">Log ID</th>
                <th className="py-2.5">Workflow Name</th>
                <th className="py-2.5">Fired Trigger</th>
                <th className="py-2.5">Execution Time</th>
                <th className="py-2.5">Outcome Status</th>
                <th className="py-2.5 text-right">Runtime Latency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-semibold text-brand-text">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 font-extrabold text-slate-450 uppercase text-[10px] tracking-wide">{log.id}</td>
                  <td className="py-3 font-extrabold">{log.workflow}</td>
                  <td className="py-3 text-slate-550">{log.trigger}</td>
                  <td className="py-3 text-slate-450 tabular-nums">{log.time}</td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded font-extrabold uppercase tracking-wide text-[8px] ${
                      log.status === 'Success' 
                        ? 'bg-emerald-50 text-emerald-700' 
                        : 'bg-rose-50 text-rose-700'
                    }`}>
                      {log.status}
                    </span>
                  </td>
                  <td className="py-3 text-right text-slate-450 tabular-nums">{log.duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Workflow Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-md shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setShowModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-650 cursor-pointer"
            >
              <X className="h-4.5 w-4.5" />
            </button>

            <h3 className="font-extrabold text-brand-heading text-sm mb-4">Register New Automation Workflow</h3>
            
            <form onSubmit={handleCreateWorkflow} className="space-y-4 text-xs font-bold">
              <div>
                <label className="block text-slate-500 mb-1 text-[10px] uppercase">Workflow Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Slack Enterprise Alerts" 
                  value={newWorkflowName}
                  onChange={(e) => setNewWorkflowName(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-accent/20"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1 text-[10px] uppercase">Target HTTP URL</label>
                <input 
                  type="url" 
                  required
                  placeholder="https://hooks.slack.com/services/..." 
                  value={newWorkflowUrl}
                  onChange={(e) => setNewWorkflowUrl(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-accent/20 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1 text-[10px] uppercase">Event Trigger Subscriptions</label>
                <div className="space-y-2 mt-1.5">
                  {[
                    { val: 'lead.score_updated', label: 'Lead score threshold crossed' },
                    { val: 'deal.stage_changed', label: 'Deal stage modification' },
                    { val: 'email.received', label: 'Inbound client email ingest' }
                  ].map((trig) => (
                    <label key={trig.val} className="flex items-center space-x-2.5 cursor-pointer text-brand-text select-none">
                      <input 
                        type="checkbox"
                        checked={selectedTriggers.includes(trig.val)}
                        onChange={() => toggleTriggerSelection(trig.val)}
                        className="h-4 w-4 rounded border-slate-300 text-brand-accent focus:ring-0 cursor-pointer"
                      />
                      <span>{trig.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-end space-x-2">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-brand-accent hover:bg-brand-accent-hover text-white rounded-lg cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Registering...' : 'Save Workflow'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
