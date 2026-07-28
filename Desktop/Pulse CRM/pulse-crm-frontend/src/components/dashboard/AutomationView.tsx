'use client';

import React, { useState } from 'react';
import { 
  GitBranch, 
  Play, 
  Cpu, 
  ListTodo, 
  Settings2, 
  ArrowRight, 
  Plus, 
  Activity, 
  CheckCircle, 
  AlertTriangle
} from 'lucide-react';

export default function AutomationView() {
  const triggers = [
    { id: "t1", name: "Lead Score Updated", desc: "Fires when lead qualification score reaches > 80" },
    { id: "t2", name: "Deal Stage Changed", desc: "Fires when a deal moves to Negotiating/Won" },
    { id: "t3", name: "Client Email Ingested", desc: "Fires when a new client email syncs" }
  ];

  const actions = [
    { id: "a1", name: "Send Slack Notification", desc: "Ping representative channel with deal details" },
    { id: "a2", name: "Trigger CRM Task Creation", desc: "Create a follow-up task with a 24h SLA" },
    { id: "a3", name: "Disburse Verification Email", desc: "Send pricing/SSO documentation file" }
  ];

  const [logs] = useState([
    { id: "L001", workflow: "Enterprise Lead Routing", trigger: "Lead Score Updated", time: "5 mins ago", status: "Success", duration: "180ms" },
    { id: "L002", workflow: "Deal Win Slack Alert", trigger: "Deal Stage Changed", time: "45 mins ago", status: "Success", duration: "250ms" },
    { id: "L003", workflow: "HIPAA Doc Dispatch", trigger: "Client Email Ingested", time: "3 hours ago", status: "Failed", duration: "420ms" }
  ]);

  const [toast, setToast] = useState<string | null>(null);

  const handleTestWorkflow = (name: string) => {
    setToast(`Test execution triggered for workflow: "${name}".`);
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-55 bg-slate-900 dark:bg-brand-accent text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center space-x-2 text-xs font-bold animate-in fade-in slide-in-from-bottom-2 duration-300">
          <CheckCircle className="h-4 w-4 text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-sans text-brand-heading tracking-tight font-bold">
            Automation & Workflows
          </h1>
          <p className="text-xs md:text-sm text-brand-text/75 mt-1 font-medium tracking-wide">
            Design automated triggers and notification chains to accelerate outbound client conversions.
          </p>
        </div>

        <button 
          onClick={() => handleTestWorkflow('New Custom Flow')}
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

      {/* 2. Triggers & Actions List Splints */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Triggers List */}
        <div className="bg-white border border-brand-border-purple/20 rounded-xl p-5 shadow-sm/5 space-y-4">
          <h3 className="font-extrabold text-brand-heading text-sm flex items-center">
            <Cpu className="h-4.5 w-4.5 mr-2 text-brand-accent" />
            <span>Available Trigger Conditions</span>
          </h3>

          <div className="space-y-3">
            {triggers.map(t => (
              <div key={t.id} className="p-3 border border-brand-border-purple/15 rounded-lg bg-slate-50/50">
                <h4 className="text-xs font-extrabold text-brand-text">{t.name}</h4>
                <p className="text-[10px] text-brand-text/70 mt-1 leading-relaxed font-semibold">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Actions List */}
        <div className="bg-white border border-brand-border-purple/20 rounded-xl p-5 shadow-sm/5 space-y-4">
          <h3 className="font-extrabold text-brand-heading text-sm flex items-center">
            <ListTodo className="h-4.5 w-4.5 mr-2 text-brand-accent" />
            <span>Available Actions Matrix</span>
          </h3>

          <div className="space-y-3">
            {actions.map(a => (
              <div key={a.id} className="p-3 border border-brand-border-purple/15 rounded-lg bg-slate-50/50">
                <h4 className="text-xs font-extrabold text-brand-text">{a.name}</h4>
                <p className="text-[10px] text-brand-text/70 mt-1 leading-relaxed font-semibold">{a.desc}</p>
              </div>
            ))}
          </div>
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
              <tr className="border-b border-slate-100 text-[10px] uppercase font-extrabold text-slate-400">
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
                <tr key={log.id} className="hover:bg-slate-50/50">
                  <td className="py-3 font-extrabold text-slate-450 uppercase text-[10px] tracking-wide">{log.id}</td>
                  <td className="py-3 font-extrabold">{log.workflow}</td>
                  <td className="py-3 text-slate-500">{log.trigger}</td>
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
    </div>
  );
}
