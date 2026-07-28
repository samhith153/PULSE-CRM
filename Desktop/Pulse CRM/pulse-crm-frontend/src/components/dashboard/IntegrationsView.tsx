'use client';

import React, { useState } from 'react';
import { 
  Link2, 
  Check, 
  Mail, 
  Calendar, 
  MessageSquare,
  Settings,
  AlertCircle
} from 'lucide-react';

interface IntegrationItem {
  id: string;
  name: string;
  provider: string;
  description: string;
  status: 'Connected' | 'Disconnected' | 'Configure';
  icon: React.ComponentType<{ className?: string }>;
}

export default function IntegrationsView() {
  const [integrations, setIntegrations] = useState<IntegrationItem[]>([
    { id: "1", name: "Gmail Integration", provider: "Google Suite", description: "Sync customer mail threads and parse leads automatically.", status: "Connected", icon: Mail },
    { id: "2", name: "Outlook Integration", provider: "Microsoft 365", description: "Integrate Office 365 inbox threads with pipeline deals.", status: "Disconnected", icon: Mail },
    { id: "3", name: "Calendar Sync", provider: "Google/Outlook Calendar", description: "Sync meetings, discovery demos, and deadlines directly.", status: "Connected", icon: Calendar },
    { id: "4", name: "WhatsApp for Business", provider: "WhatsApp Cloud API", description: "Send automated reminders and log text queries directly.", status: "Configure", icon: MessageSquare }
  ]);

  const [toast, setToast] = useState<string | null>(null);

  const toggleConnection = (id: string) => {
    setIntegrations(integrations.map(item => {
      if (item.id === id) {
        const nextStatus = item.status === 'Connected' ? 'Disconnected' : 'Connected';
        setToast(`${item.name} is now ${nextStatus.toLowerCase()}!`);
        setTimeout(() => setToast(null), 3000);
        return { ...item, status: nextStatus };
      }
      return item;
    }));
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-55 bg-slate-900 dark:bg-brand-accent text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center space-x-2 text-xs font-bold animate-in fade-in slide-in-from-bottom-2 duration-300">
          <Check className="h-4 w-4" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-3xl font-sans text-brand-heading tracking-tight font-bold">
          System Integrations
        </h1>
        <p className="text-xs md:text-sm text-brand-text/75 mt-1 font-medium tracking-wide">
          Connect third-party communications channels and synchronization agents.
        </p>
      </div>

      {/* Integrations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {integrations.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.id} className="bg-white border border-brand-border-purple/20 rounded-xl p-5 shadow-sm/5 flex flex-col justify-between space-y-4">
              <div className="flex items-start space-x-4">
                <div className="h-10 w-10 rounded-xl bg-brand-sidebar-hover/30 border border-brand-border-purple/10 flex items-center justify-center text-brand-accent shrink-0">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-xs font-extrabold text-brand-text">{item.name}</h3>
                    <span className="text-[9px] text-slate-400 font-extrabold">{item.provider}</span>
                  </div>
                  <p className="text-[11px] text-brand-text/70 mt-1 font-semibold leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                <div className="flex items-center space-x-1.5">
                  <span className={`h-2 w-2 rounded-full ${
                    item.status === 'Connected' 
                      ? 'bg-emerald-500' 
                      : item.status === 'Configure'
                      ? 'bg-amber-500'
                      : 'bg-slate-300'
                  }`} />
                  <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wide">
                    {item.status}
                  </span>
                </div>

                <div className="flex space-x-2">
                  <button 
                    onClick={() => toggleConnection(item.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      item.status === 'Connected'
                        ? 'bg-rose-50 hover:bg-rose-100 text-rose-700'
                        : 'bg-brand-accent hover:bg-brand-accent-hover text-white'
                    }`}
                  >
                    {item.status === 'Connected' ? 'Disconnect' : 'Connect API'}
                  </button>

                  {item.status !== 'Disconnected' && (
                    <button className="p-1.5 border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-brand-text transition-colors cursor-pointer">
                      <Settings className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
