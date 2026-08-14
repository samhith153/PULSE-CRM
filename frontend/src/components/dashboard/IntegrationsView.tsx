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
  const [showSettingsModal, setShowSettingsModal] = useState(false);

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
        <div className="bg-status-warning/10 dark:bg-status-warning/10 border border-status-warning/20 dark:border-status-warning/20 text-text-primary rounded-xl px-4 py-3 text-xs font-bold flex items-start gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-status-warning dark:text-status-warning" />
          <span className="text-status-warning dark:text-status-warning">{gmailError}</span>
        </div>
      )}

      <div className="border border-border-default/80 rounded-2xl bg-surface-1 overflow-hidden">
        <div className="px-5 py-4 border-b border-border-default/80 bg-surface-2/30">
          <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">Active Integrations</h3>
          <p className="text-[10px] text-text-muted mt-0.5">Manage connected data-sources and external synchronization channels.</p>
        </div>

        <div className="divide-y divide-border/60">
          {integrations.map((item) => {
            const Icon = item.icon;
            const isGmail = item.id === 'gmail';
            return (
              <div key={item.id} className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:bg-surface-2/10 transition-colors">
                <div className="flex items-start space-x-3.5 min-w-0 flex-1">
                  <div className="h-9.5 w-9.5 rounded-xl bg-surface-2 border border-border-default flex items-center justify-center text-accent-color shrink-0">
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-xs font-bold text-text-primary">{item.name}</h4>
                      <span className="text-[9px] bg-surface-2 border border-border-default text-text-muted px-1.5 py-0.5 rounded-md font-semibold">{item.provider}</span>
                      
                      {/* Connection status badge */}
                      <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        item.status === 'Connected' 
                          ? 'bg-status-success/10 text-status-success dark:text-status-success border border-status-success/20' 
                          : item.status === 'Configure'
                          ? 'bg-status-warning/10 text-status-warning dark:text-status-warning border border-status-warning/20'
                          : 'bg-surface-2 text-text-muted border border-border-default'
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                          item.status === 'Connected' ? 'bg-status-success' : item.status === 'Configure' ? 'bg-status-warning' : 'bg-slate-400'
                        }`} />
                        <span>{isGmail && isLoadingGmail ? 'Checking...' : item.status}</span>
                      </span>
                    </div>
                    <p className="text-[11px] text-text-muted mt-1 font-semibold leading-relaxed">{item.description}</p>
                    {isGmail && gmailConnection && (
                      <p className="text-[10px] text-accent-color font-extrabold mt-1.5 bg-accent-color/5 border border-accent-color/10 px-2 py-0.5 rounded inline-block max-w-full truncate">
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
                            ? 'bg-destructive/10 hover:bg-status-danger/10 dark:hover:bg-status-danger/10 text-status-danger border border-destructive/20' 
                            : 'bg-accent-color hover:bg-accent-color/90 text-primary-foreground shadow-sm'
                        }`}
                      >
                        {isLoadingGmail ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : gmailConnection?.is_active ? 'Disconnect' : 'Connect'}
                      </button>
                      <button 
                        onClick={loadGmailStatus} 
                        disabled={isLoadingGmail} 
                        className="p-1.5 border border-border-default hover:bg-surface-2 rounded-lg text-text-muted hover:text-text-primary transition cursor-pointer disabled:opacity-60 bg-surface-1" 
                        title="Refresh status"
                      >
                        <RefreshCw className={`h-4 w-4 ${isLoadingGmail ? 'animate-spin' : ''}`} />
                      </button>
                    </>
                  ) : (
                    <button className="px-3 py-1.5 rounded-lg text-xs font-bold bg-surface-2/80 text-text-muted cursor-not-allowed border border-border-default/50">Coming Soon</button>
                  )}
                  {item.status !== 'Disconnected' && (
                    <button 
                      onClick={() => item.id === 'gmail' && setShowSettingsModal(true)}
                      className="p-1.5 border border-border-default hover:bg-surface-2 rounded-lg text-text-muted hover:text-text-primary transition cursor-pointer bg-surface-1"
                    >
                      <Settings className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {/* Gmail Settings Coming Soon Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-ink/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-surface-1 border border-border-default rounded-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-5 py-4 border-b border-border-default flex justify-between items-center bg-surface-2/30">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-text-muted" />
                <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">Gmail Settings</h3>
              </div>
              <button onClick={() => setShowSettingsModal(false)} className="text-text-muted hover:text-text-primary p-1 cursor-pointer">
                <span className="sr-only">Close</span>
                ✕
              </button>
            </div>
            <div className="p-6 text-center">
              <div className="mx-auto h-12 w-12 rounded-full bg-accent-color/10 flex items-center justify-center mb-3">
                <Settings className="h-5 w-5 text-accent-color" />
              </div>
              <h4 className="text-sm font-bold text-text-primary mb-1">Coming Soon</h4>
              <p className="text-[11px] text-text-muted font-semibold leading-relaxed max-w-[260px] mx-auto">
                Gmail sync configuration — including sync scope, date range, AI summarization toggle, and force re-sync — is on the roadmap.
              </p>
            </div>
            <div className="px-5 py-3 border-t border-border-default flex justify-end bg-surface-2/20">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="px-4 py-1.5 bg-accent-color hover:bg-accent-color/90 text-surface-0 rounded-lg text-xs font-bold cursor-pointer"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
