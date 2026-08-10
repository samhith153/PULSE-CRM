'use client';

import React, { useState } from 'react';
import { 
  Sparkles, 
  RefreshCw, 
  MoreVertical,
  Plus,
  LayoutGrid,
  List,
  Target,
  Calendar,
  Wand2,
  Activity,
  ArrowUpRight
} from 'lucide-react';

interface AIModelItem {
  id: string;
  name: string;
  description: string;
  status: 'Active' | 'Training' | 'Offline';
  accuracy: string;
  accuracyGrowth: string;
  lastTrainedStr: string;
  lastTrainedDate: string;
  version: string;
  theme: 'purple' | 'green' | 'blue';
  icon: React.ReactNode;
}

export default function AIModelsView() {
  const [models, setModels] = useState<AIModelItem[]>([
    { 
      id: "m1", 
      name: "Lead Scoring Engine", 
      description: "Predicts lead conversion probability based on historical profiles and interactions.", 
      status: "Active", 
      accuracy: "91.2%", 
      accuracyGrowth: "+4.2%",
      lastTrainedStr: "2 days ago", 
      lastTrainedDate: "May 20, 2025 • 10:30 AM",
      version: "v4.2.1",
      theme: "purple",
      icon: <Sparkles className="h-6 w-6" />
    },
    { 
      id: "m2", 
      name: "Next-Best-Action Recommendation", 
      description: "Suggests call timings, contract discounts, and document dispatches.", 
      status: "Active", 
      accuracy: "86.5%", 
      accuracyGrowth: "+2.7%",
      lastTrainedStr: "1 week ago", 
      lastTrainedDate: "May 14, 2025 • 09:15 AM",
      version: "v2.0.4",
      theme: "green",
      icon: <Wand2 className="h-6 w-6" />
    },
    { 
      id: "m3", 
      name: "Conversation Intelligence Analyzer", 
      description: "Transcribes calls and runs sentiment classification mapping.", 
      status: "Active", 
      accuracy: "94.8%", 
      accuracyGrowth: "+5.6%",
      lastTrainedStr: "3 days ago", 
      lastTrainedDate: "May 19, 2025 • 02:45 PM",
      version: "v1.8.9",
      theme: "blue",
      icon: <Activity className="h-6 w-6" />
    }
  ]);

  const [toast, setToast] = useState<string | null>(null);

  const triggerRetrain = (id: string, name: string) => {
    // Set status to Training
    setModels(models.map(m => m.id === id ? { ...m, status: 'Training' } : m));
    setToast(`Retraining pipeline scheduled for: "${name}".`);
    setTimeout(() => setToast(null), 3000);

    // Simulate completion in 4 seconds
    setTimeout(() => {
      setModels(prev => prev.map(m => m.id === id ? { ...m, status: 'Active', lastTrainedStr: 'Just now' } : m));
    }, 4500);
  };

  const getThemeStyles = (theme: string) => {
    switch(theme) {
      case 'purple': return { bg: 'bg-brand-purple/10', text: 'text-brand-purple', border: 'border-brand-purple/20' };
      case 'green': return { bg: 'bg-emerald-500/10', text: 'text-emerald-600', border: 'border-emerald-500/20' };
      case 'blue': return { bg: 'bg-blue-500/10', text: 'text-blue-600', border: 'border-blue-500/20' };
      default: return { bg: 'bg-secondary', text: 'text-foreground', border: 'border-border' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-55 bg-ink dark:bg-brand-purple text-primary-foreground px-4 py-2.5 rounded-xl flex items-center space-x-2 text-xs font-bold animate-in fade-in slide-in-from-bottom-2 duration-300 shadow-lg">
          <RefreshCw className="h-4 w-4 text-brand-cyan animate-spin" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-sans text-foreground tracking-tight font-extrabold">
            AI Copilot Models Management
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5 font-medium tracking-wide">
            Inspect validation accuracy, check status states, and schedule retraining runs for neural nodes.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center border border-border rounded-lg overflow-hidden p-0.5 bg-secondary/30 shrink-0 select-none shadow-sm">
            <button className="p-2 rounded-md transition cursor-pointer bg-card text-brand-purple shadow-sm font-bold">
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button className="p-2 rounded-md transition cursor-pointer text-muted-foreground hover:text-foreground">
              <List className="w-4 h-4" />
            </button>
          </div>
          <button className="inline-flex items-center space-x-2 px-4 py-2.5 bg-brand-purple hover:bg-brand-purple/90 text-white rounded-lg text-sm font-bold transition-colors cursor-pointer shadow-sm">
            <Plus className="h-4 w-4" />
            <span>Add Model</span>
          </button>
        </div>
      </div>

      {/* Models List */}
      <div className="space-y-4">
        {models.map((model) => {
          const t = getThemeStyles(model.theme);
          
          return (
            <div key={model.id} className="bg-card border border-border/80 hover:border-border transition-colors rounded-[24px] p-6 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 shadow-sm">
              
              {/* Left Section: Icon + Details */}
              <div className="flex items-start gap-5 flex-1 min-w-0">
                <div className={`w-[72px] h-[72px] rounded-2xl flex items-center justify-center shrink-0 ${t.bg} ${t.text}`}>
                  {model.icon}
                </div>
                <div className="flex flex-col pt-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <h3 className="text-[17px] font-bold text-foreground truncate">{model.name}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${t.bg} ${t.text}`}>
                      {model.version}
                    </span>
                  </div>
                  <p className="text-[13px] text-muted-foreground font-medium leading-relaxed max-w-[400px]">
                    {model.description}
                  </p>
                  <div className="flex items-center gap-2 mt-3">
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-100">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                      <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">{model.status}</span>
                    </div>
                    <span className="text-[11px] font-semibold text-muted-foreground">
                      Last retrained: {model.lastTrainedStr}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Section: Stats & Actions */}
              <div className="flex flex-wrap md:flex-nowrap items-center gap-8 xl:gap-12 w-full xl:w-auto xl:pl-8 border-t xl:border-t-0 border-border/50 pt-6 xl:pt-0">
                
                {/* Precision Stat */}
                <div className="flex items-start gap-3">
                  <div className={`mt-1 w-8 h-8 rounded-full flex items-center justify-center ${t.bg} ${t.text}`}>
                    <Target className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Verification Precision</span>
                    <div className="flex items-end gap-2">
                      <span className="text-xl font-extrabold text-foreground tabular-nums leading-none">{model.accuracy}</span>
                      <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 text-[10px] font-bold mb-0.5">
                        <ArrowUpRight className="w-3 h-3" />
                        {model.accuracyGrowth.replace('+', '')}
                      </span>
                    </div>
                    <span className="text-[10px] font-semibold text-muted-foreground mt-1">vs last run</span>
                  </div>
                </div>

                {/* Vertical Divider */}
                <div className="hidden md:block w-px h-12 bg-border/60"></div>

                {/* Last Run Stat */}
                <div className="flex items-start gap-3">
                  <div className={`mt-1 w-8 h-8 rounded-full flex items-center justify-center bg-brand-purple/10 text-brand-purple`}>
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Last Trained Run</span>
                    <span className="text-xl font-extrabold text-foreground tabular-nums leading-none">{model.lastTrainedStr}</span>
                    <span className="text-[10px] font-semibold text-muted-foreground mt-1.5">{model.lastTrainedDate}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 ml-auto">
                  <button 
                    onClick={() => triggerRetrain(model.id, model.name)}
                    disabled={model.status === 'Training'}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center space-x-2 shadow-sm ${
                      model.status === 'Training'
                        ? 'bg-secondary text-muted-foreground cursor-not-allowed'
                        : 'bg-brand-purple hover:bg-brand-purple/90 text-white'
                    }`}
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${model.status === 'Training' ? 'animate-spin' : ''}`} />
                    <span>Retrain Model</span>
                  </button>
                  <button className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-secondary text-muted-foreground transition-colors cursor-pointer border border-transparent hover:border-border">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>

              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
