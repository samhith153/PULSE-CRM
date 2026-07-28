'use client';

import React, { useState } from 'react';
import { 
  Sparkles, 
  Cpu, 
  CheckCircle, 
  RefreshCw, 
  Zap, 
  BarChart,
  Target
} from 'lucide-react';

interface AIModelItem {
  id: string;
  name: string;
  description: string;
  status: 'Active' | 'Training' | 'Offline';
  accuracy: string;
  lastTrained: string;
  version: string;
}

export default function AIModelsView() {
  const [models, setModels] = useState<AIModelItem[]>([
    { id: "m1", name: "Lead Scoring Engine", description: "Predicts lead conversion probability based on historical profiles and interactions.", status: "Active", accuracy: "91.2%", lastTrained: "2 days ago", version: "v4.2.1" },
    { id: "m2", name: "Next-Best-Action Recommendation", description: "Suggests call timings, contract discounts, and document dispatches.", status: "Active", accuracy: "86.5%", lastTrained: "1 week ago", version: "v2.0.4" },
    { id: "m3", name: "Conversation Intelligence Analyzer", description: "Transcribes calls and runs sentiment classification mapping.", status: "Active", accuracy: "94.8%", lastTrained: "3 days ago", version: "v1.8.9" }
  ]);

  const [toast, setToast] = useState<string | null>(null);

  const triggerRetrain = (id: string, name: string) => {
    // Set status to Training
    setModels(models.map(m => m.id === id ? { ...m, status: 'Training' } : m));
    setToast(`Retraining pipeline scheduled for: "${name}".`);
    setTimeout(() => setToast(null), 3000);

    // Simulate completion in 4 seconds
    setTimeout(() => {
      setModels(prev => prev.map(m => m.id === id ? { ...m, status: 'Active', lastTrained: 'Just now' } : m));
    }, 4500);
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-55 bg-slate-900 dark:bg-brand-accent text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center space-x-2 text-xs font-bold animate-in fade-in slide-in-from-bottom-2 duration-300">
          <RefreshCw className="h-4 w-4 text-emerald-400 animate-spin" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-3xl font-sans text-brand-heading tracking-tight font-bold">
          AI Copilot Models Management
        </h1>
        <p className="text-xs md:text-sm text-brand-text/75 mt-1 font-medium tracking-wide">
          Inspect validation accuracy, check status states, and schedule retraining runs for neural nodes.
        </p>
      </div>

      {/* Models List */}
      <div className="space-y-6">
        {models.map((model) => (
          <div key={model.id} className="bg-white border border-brand-border-purple/20 rounded-xl p-5 shadow-sm/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-2 flex-1 max-w-xl">
              <div className="flex items-center space-x-2.5">
                <div className="h-8 w-8 rounded-lg bg-brand-sidebar-hover/30 border border-brand-border-purple/10 flex items-center justify-center text-brand-accent shrink-0">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-xs font-extrabold text-brand-text flex items-center">
                    <span>{model.name}</span>
                    <span className="ml-2 text-[9px] text-slate-400 font-bold bg-slate-100 px-1.5 py-0.2 rounded">
                      {model.version}
                    </span>
                  </h3>
                </div>
              </div>
              <p className="text-[11px] text-brand-text/70 leading-relaxed font-semibold">
                {model.description}
              </p>
            </div>

            {/* Performance status & Train buttons */}
            <div className="flex flex-wrap md:flex-nowrap items-center gap-6 self-stretch md:self-auto border-t md:border-t-0 pt-4 md:pt-0 border-slate-150">
              <div className="text-left md:text-right">
                <span className="text-[9px] font-bold text-slate-400 uppercase block">Verification Precision</span>
                <span className="text-base font-extrabold text-brand-heading tabular-nums">{model.accuracy}</span>
              </div>

              <div className="text-left md:text-right">
                <span className="text-[9px] font-bold text-slate-400 uppercase block">Last Trained Run</span>
                <span className="text-xs font-extrabold text-brand-text tabular-nums">{model.lastTrained}</span>
              </div>

              <div className="flex items-center space-x-3">
                <span className={`px-2 py-0.5 rounded font-extrabold uppercase tracking-wide text-[8px] flex items-center space-x-1 ${
                  model.status === 'Active' 
                    ? 'bg-emerald-50 text-emerald-700' 
                    : model.status === 'Training'
                    ? 'bg-amber-50 text-amber-700'
                    : 'bg-slate-50 text-slate-700'
                }`}>
                  {model.status === 'Training' && <RefreshCw className="h-2.5 w-2.5 animate-spin mr-1" />}
                  <span>{model.status}</span>
                </span>

                <button 
                  onClick={() => triggerRetrain(model.id, model.name)}
                  disabled={model.status === 'Training'}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-colors cursor-pointer flex items-center space-x-1.5 ${
                    model.status === 'Training'
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : 'bg-brand-accent hover:bg-brand-accent-hover text-white'
                  }`}
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${model.status === 'Training' ? 'animate-spin' : ''}`} />
                  <span>Retrain Model</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
