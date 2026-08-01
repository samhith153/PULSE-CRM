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
    <div className="space-y-6">
      {toast && (
        <div className="fixed bottom-5 right-5 z-55 bg-ink text-primary-foreground px-4 py-2.5 rounded-xl flex items-center space-x-2 text-xs font-bold animate-in fade-in slide-in-from-bottom-2 duration-300">
          <Check className="h-4 w-4" />
          <span>{toast}</span>
        </div>
      )}

      <div>
        <h1 className="text-3xl font-sans text-foreground tracking-tight font-bold">System Integrations</h1>
        <p className="text-xs md:text-sm text-muted-foreground mt-1 font-medium tracking-wide">Connect third-party communications channels and synchronization agents.</p>
      </div>

      {gmailError && (
        <div className="bg-amber-50 border border-amber-200 text-foreground rounded-xl px-4 py-3 text-xs font-bold flex items-start gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{gmailError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {integrations.map((item) => {
          const Icon = item.icon;
          const isGmail = item.id === 'gmail';
          return (
            <div key={item.id} className="bg-card border border-border rounded-2xl p-5 flex flex-col justify-between space-y-4">
              <div className="flex items-start space-x-4">
                <div className="h-10 w-10 rounded-xl bg-secondary border border-border flex items-center justify-center text-brand-purple shrink-0">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-xs font-semibold text-foreground">{item.name}</h3>
                    <span className="text-[9px] text-muted-foreground font-semibold">{item.provider}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1 font-semibold leading-relaxed">{item.description}</p>
                  {isGmail && gmailConnection && (
                    <p className="text-[10px] text-brand-purple font-semibold mt-2 truncate">{gmailConnection.email_address} - {gmailConnection.sync_status}</p>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-border">
                <div className="flex items-center space-x-1.5">
                  <span className={`h-2 w-2 rounded-full ${item.status === 'Connected' ? 'bg-brand-cyan/150' : item.status === 'Configure' ? 'bg-amber-500' : 'bg-slate-300'}`} />
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{isGmail && isLoadingGmail ? 'Checking' : item.status}</span>
                </div>

                <div className="flex space-x-2">
                  {isGmail ? (
                    <>
                      <button onClick={gmailConnection?.is_active ? handleDisconnectGmail : handleConnectGmail} disabled={isLoadingGmail} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer disabled:opacity-60 ${gmailConnection?.is_active ? 'bg-destructive/10 hover:bg-rose-100 text-destructive' : 'bg-brand-purple hover:bg-brand-purple/90 text-primary-foreground'}`}>
                        {isLoadingGmail ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : gmailConnection?.is_active ? 'Disconnect' : 'Connect Gmail'}
                      </button>
                      <button onClick={loadGmailStatus} disabled={isLoadingGmail} className="p-1.5 border border-border hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground transition-colors cursor-pointer disabled:opacity-60" title="Refresh status">
                        <RefreshCw className={`h-4 w-4 ${isLoadingGmail ? 'animate-spin' : ''}`} />
                      </button>
                    </>
                  ) : (
                    <button className="px-3 py-1.5 rounded-lg text-xs font-bold bg-secondary text-muted-foreground cursor-not-allowed">Coming Soon</button>
                  )}
                  {item.status !== 'Disconnected' && <button className="p-1.5 border border-border hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground transition-colors cursor-pointer"><Settings className="h-4 w-4" /></button>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

