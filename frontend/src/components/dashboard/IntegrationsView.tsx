'use client';

import React, { useEffect, useState } from 'react';
import { AlertCircle, Calendar, Check, Loader2, Mail, MessageSquare, RefreshCw, Settings } from 'lucide-react';
import { completeGmailOAuth, getGmailStatus, GmailConnection, startGmailOAuth } from '@/utils/api';

interface IntegrationItem {
  id: string;
  name: string;
  provider: string;
  description: string;
  status: 'Connected' | 'Disconnected' | 'Configure';
  icon: React.ComponentType<{ className?: string }>;
}

export default function IntegrationsView() {
  const [gmailConnection, setGmailConnection] = useState<GmailConnection | null>(null);
  const [isLoadingGmail, setIsLoadingGmail] = useState(true);
  const [gmailError, setGmailError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const integrations: IntegrationItem[] = [
    { id: 'gmail', name: 'Gmail Integration', provider: 'Google Suite', description: 'Sync customer mail threads and parse leads automatically.', status: gmailConnection?.is_active ? 'Connected' : 'Disconnected', icon: Mail },
    { id: 'outlook', name: 'Outlook Integration', provider: 'Microsoft 365', description: 'Integrate Office 365 inbox threads with pipeline deals.', status: 'Disconnected', icon: Mail },
    { id: 'calendar', name: 'Calendar Sync', provider: 'Google/Outlook Calendar', description: 'Sync meetings, discovery demos, and deadlines directly.', status: 'Configure', icon: Calendar },
    { id: 'whatsapp', name: 'WhatsApp for Business', provider: 'WhatsApp Cloud API', description: 'Send automated reminders and log text queries directly.', status: 'Configure', icon: MessageSquare }
  ];

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const loadGmailStatus = async () => {
    setIsLoadingGmail(true);
    setGmailError(null);
    try {
      const status = await getGmailStatus();
      setGmailConnection(status.connection ?? null);
    } catch (error) {
      setGmailError(error instanceof Error ? error.message : 'Unable to load Gmail status.');
    } finally {
      setIsLoadingGmail(false);
    }
  };

  useEffect(() => {
    loadGmailStatus();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state') || sessionStorage.getItem('pulse-gmail-oauth-state');
    if (!code) return;

    setIsLoadingGmail(true);
    completeGmailOAuth(code, state)
      .then(connection => {
        sessionStorage.removeItem('pulse-gmail-oauth-state');
        setGmailConnection(connection);
        showToast('Gmail connected successfully.');
        window.history.replaceState({}, '', window.location.pathname);
      })
      .catch(error => setGmailError(error instanceof Error ? error.message : 'Gmail OAuth callback failed.'))
      .finally(() => setIsLoadingGmail(false));
  }, []);

  const handleConnectGmail = async () => {
    setGmailError(null);
    setIsLoadingGmail(true);
    try {
      const result = await startGmailOAuth();
      sessionStorage.setItem('pulse-gmail-oauth-state', result.state);
      window.location.href = result.authorization_url;
    } catch (error) {
      setGmailError(error instanceof Error ? error.message : 'Unable to start Gmail OAuth.');
      setIsLoadingGmail(false);
    }
  };

  const handleDisconnectGmail = () => {
    setGmailError('Backend endpoint missing: POST /gmail/disconnect. Existing backend exposes /gmail/connections but no disconnect route.');
  };

  return (
    <div className="space-y-5">
      {toast && (
        <div className="fixed bottom-5 right-5 z-55 bg-ink text-primary-foreground px-4 py-2.5 rounded-xl flex items-center space-x-2 text-xs font-bold animate-in fade-in slide-in-from-bottom-2 duration-300">
          <Check className="h-4 w-4" />
          <span>{toast}</span>
        </div>
      )}

      {gmailError && (
        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-foreground rounded-xl px-4 py-3 text-xs font-bold flex items-start gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
          <span className="text-amber-850 dark:text-amber-300">{gmailError}</span>
        </div>
      )}

      <div className="border border-border/80 rounded-2xl bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border/80 bg-secondary/30">
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Active Integrations</h3>
          <p className="text-[10px] text-muted-foreground mt-0.5">Manage connected data-sources and external synchronization channels.</p>
        </div>

        <div className="divide-y divide-border/60">
          {integrations.map((item) => {
            const Icon = item.icon;
            const isGmail = item.id === 'gmail';
            return (
              <div key={item.id} className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:bg-secondary/10 transition-colors">
                <div className="flex items-start space-x-3.5 min-w-0 flex-1">
                  <div className="h-9.5 w-9.5 rounded-xl bg-secondary border border-border flex items-center justify-center text-brand-purple shrink-0">
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-xs font-bold text-foreground">{item.name}</h4>
                      <span className="text-[9px] bg-secondary border border-border text-muted-foreground px-1.5 py-0.5 rounded-md font-semibold">{item.provider}</span>
                      
                      {/* Connection status badge */}
                      <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        item.status === 'Connected' 
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                          : item.status === 'Configure'
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                          : 'bg-secondary text-muted-foreground border border-border'
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                          item.status === 'Connected' ? 'bg-emerald-500' : item.status === 'Configure' ? 'bg-amber-500' : 'bg-slate-400'
                        }`} />
                        <span>{isGmail && isLoadingGmail ? 'Checking...' : item.status}</span>
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1 font-semibold leading-relaxed">{item.description}</p>
                    {isGmail && gmailConnection && (
                      <p className="text-[10px] text-brand-purple font-extrabold mt-1.5 bg-brand-purple/5 border border-brand-purple/10 px-2 py-0.5 rounded inline-block max-w-full truncate">
                        Active Account: {gmailConnection.email_address} ({gmailConnection.sync_status})
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2 self-end sm:self-center shrink-0">
                  {isGmail ? (
                    <>
                      <button 
                        onClick={gmailConnection?.is_active ? handleDisconnectGmail : handleConnectGmail} 
                        disabled={isLoadingGmail} 
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer disabled:opacity-60 flex items-center space-x-1.5 ${
                          gmailConnection?.is_active 
                            ? 'bg-destructive/10 hover:bg-rose-100 dark:hover:bg-rose-950/20 text-destructive border border-destructive/20' 
                            : 'bg-brand-purple hover:bg-brand-purple/90 text-primary-foreground shadow-sm'
                        }`}
                      >
                        {isLoadingGmail ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : gmailConnection?.is_active ? 'Disconnect' : 'Connect'}
                      </button>
                      <button 
                        onClick={loadGmailStatus} 
                        disabled={isLoadingGmail} 
                        className="p-1.5 border border-border hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground transition cursor-pointer disabled:opacity-60 bg-card" 
                        title="Refresh status"
                      >
                        <RefreshCw className={`h-4 w-4 ${isLoadingGmail ? 'animate-spin' : ''}`} />
                      </button>
                    </>
                  ) : (
                    <button className="px-3 py-1.5 rounded-lg text-xs font-bold bg-secondary/80 text-muted-foreground cursor-not-allowed border border-border/50">Coming Soon</button>
                  )}
                  {item.status !== 'Disconnected' && (
                    <button className="p-1.5 border border-border hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground transition cursor-pointer bg-card">
                      <Settings className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
