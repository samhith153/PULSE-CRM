'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AlertCircle, Bot, ChevronLeft, ChevronRight, Inbox, Loader2, Mail, MailOpen, Paperclip, RefreshCw, Search, Sparkles, Plus, X, Send, Menu, PenSquare, Trash2, Star, MoreHorizontal, Send as SendIcon, File as FileIcon, Archive, Clock as ClockIcon } from 'lucide-react';
import { getEmail, getEmails, getEmailSummary, EmailSummaryData, SyncedEmail, getGmailStatus, sendGmailEmail, getLeads, getContacts, draftOutreachEmail, EmailComposeTarget } from '@/utils/api';
import { toast } from '@/lib/toast';

type MailboxFilter = 'all' | 'inbound' | 'outbound' | 'unread';

const pageSize = 12;

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function formatSize(bytes?: number | null) {
  if (!bytes) return 'Unknown size';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

interface EmailsViewProps {
  onLoaded?: () => void;
  onTabChange?: (tab: string) => void;
  composeTarget?: EmailComposeTarget | null;
  onComposeConsumed?: () => void;
}

export default function EmailsView({ onLoaded, onTabChange, composeTarget, onComposeConsumed }: EmailsViewProps = {}) {
  const [emails, setEmails] = useState<SyncedEmail[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<SyncedEmail | null>(null);
  const [filter, setFilter] = useState<MailboxFilter>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailSummary, setEmailSummary] = useState<EmailSummaryData | null>(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [isAsideCollapsed, setIsAsideCollapsed] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

  // --- Compose & AI Draft State ---
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [composeForm, setComposeForm] = useState({ to: '', name: '', subject: '', body: '' });
  const [isDrafting, setIsDrafting] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [composeError, setComposeError] = useState<string | null>(null);
  const [composeContext, setComposeContext] = useState<EmailComposeTarget | null>(null);

  const [gmailConnected, setGmailConnected] = useState(false);
  const [gmailConnectionId, setGmailConnectionId] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const router = useRouter();

  // Load Gmail connection status on mount
  useEffect(() => {
    getGmailStatus().then((status) => {
      setGmailConnected(status.connected);
      if (status.connection) {
        setGmailConnectionId(status.connection.id);
      }
    }).catch(() => {});
  }, []);

  const generateDraft = async (target: EmailComposeTarget) => {
    setIsDrafting(true);
    setComposeError(null);
    try {
      const draft = await draftOutreachEmail({
        recipient_name: target.name || target.to,
        recipient_email: target.to,
        company: target.company,
        designation: target.designation,
        purpose: target.purpose || 'follow_up',
        context: target.context,
        external_entity_type: target.externalEntityType,
        external_entity_id: target.externalEntityId
      });
      setComposeForm({ to: target.to, name: target.name || '', subject: draft.subject, body: draft.body });
    } catch (err: any) {
      setComposeError(err?.message || 'Could not generate an AI draft. You can still write the email manually.');
      setComposeForm({ to: target.to, name: target.name || '', subject: '', body: '' });
    } finally {
      setIsDrafting(false);
    }
  };

  // Listen for target from DashboardShell
  useEffect(() => {
    if (!composeTarget) return;
    setIsComposeOpen(true);
    setComposeContext(composeTarget);
    generateDraft(composeTarget);
    onComposeConsumed?.();
  }, [composeTarget?.requestId]);

  const openBlankCompose = () => {
    setComposeForm({ to: '', name: '', subject: '', body: '' });
    setComposeContext(null);
    setComposeError(null);
    setIsComposeOpen(true);
  };

  const closeCompose = () => {
    setIsComposeOpen(false);
    setComposeForm({ to: '', name: '', subject: '', body: '' });
    setComposeContext(null);
    setComposeError(null);
  };

  // Listen to search param or custom event to trigger composing (Legacy fallback)
  useEffect(() => {
    const handleCompose = (e: Event) => {
      const customEvent = e as CustomEvent<{ to: string }>;
      if (customEvent.detail?.to) {
        setComposeForm(prev => ({ ...prev, to: customEvent.detail.to }));
        setIsComposeOpen(true);
      }
    };
    window.addEventListener('pulse-compose-email', handleCompose);

    const composeParam = searchParams.get('compose');
    if (composeParam) {
      setComposeForm(prev => ({ ...prev, to: composeParam }));
      setIsComposeOpen(true);
      const nextUrl = window.location.pathname;
      window.history.replaceState({}, '', nextUrl);
    }

    return () => {
      window.removeEventListener('pulse-compose-email', handleCompose);
    };
  }, [searchParams]);

  const handleSendCompose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeForm.to || !composeForm.subject || !composeForm.body) return;
    if (!gmailConnected || !gmailConnectionId) {
      setComposeError('Gmail is not connected. Connect Gmail in Integrations settings first.');
      return;
    }
    setIsSending(true);
    setComposeError(null);
    try {
      await sendGmailEmail({
        gmail_connection_id: gmailConnectionId,
        receiver: composeForm.to,
        subject: composeForm.subject,
        html_body: composeForm.body.replace(/\n/g, '<br/>'),
        external_entity_type: composeContext?.externalEntityType ?? undefined,
        external_entity_id: composeContext?.externalEntityId ?? undefined
      });
      toast.success(`Email sent to ${composeForm.to}.`);
      closeCompose();
      loadEmails(); // Refresh emails list
    } catch (err: any) {
      setComposeError(err?.message || 'Failed to send email. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const direction = filter === 'inbound' ? 'inbound' : filter === 'outbound' ? 'outbound' : '';
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const loadEmails = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getEmails({ page, page_size: pageSize, search, direction, sort_order: 'desc' });
      const rows = filter === 'unread' ? result.data.filter(item => !item.is_read) : result.data;
      setEmails(rows);
      setTotal(filter === 'unread' ? rows.length : result.total);
      if (selectedEmail && !rows.some(item => item.id === selectedEmail.id)) setSelectedEmail(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load emails.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEmails();
  }, [page, filter]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setPage(1);
      loadEmails();
    }, 350);
    return () => window.clearTimeout(timeout);
  }, [search]);

  const unreadCount = useMemo(() => emails.filter(email => !email.is_read).length, [emails]);

  const openEmail = async (email: SyncedEmail) => {
    setSelectedEmail(email);
    setEmailSummary(null);
    setIsDetailLoading(true);
    setError(null);
    try {
      const detail = await getEmail(email.id);
      setSelectedEmail(detail);
      if (detail.thread_id && detail.direction === 'inbound') {
        setIsSummaryLoading(true);
        try {
          const summary = await getEmailSummary(detail.thread_id);
          setEmailSummary(summary);
        } catch {
          // Summary may not exist yet — not an error
        } finally {
          setIsSummaryLoading(false);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load email details.');
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleSingleClick = (email: SyncedEmail) => {
    openEmail(email);
    setIsEmailModalOpen(true);
  };

  const handleDoubleClick = async (email: SyncedEmail) => {
    const searchEmail = email.direction === 'outbound' 
      ? (email.receiver || '') 
      : email.sender;
      
    if (!searchEmail) return;
    
    try {
      const leads = await getLeads() as any[];
      const foundLead = leads.find(l => 
        l.email?.toLowerCase() === searchEmail.toLowerCase() ||
        l.contact_email?.toLowerCase() === searchEmail.toLowerCase() ||
        l.name?.toLowerCase() === searchEmail.toLowerCase() ||
        l.title?.toLowerCase() === searchEmail.toLowerCase()
      );
      
      if (foundLead) {
        localStorage.setItem('pulse-selected-lead-id', String(foundLead.id));
        onTabChange?.('leads');
        toast.success(`Opening Lead Summary for ${foundLead.name || foundLead.title || 'Lead'}`);
        return;
      }
      
      const contacts = await getContacts() as any[];
      const foundContact = contacts.find(c => 
        c.email?.toLowerCase() === searchEmail.toLowerCase() ||
        c.name?.toLowerCase() === searchEmail.toLowerCase() ||
        c.first_name?.toLowerCase() === searchEmail.toLowerCase()
      );
      
      if (foundContact) {
        localStorage.setItem('pulse-selected-contact-id', String(foundContact.id));
        onTabChange?.('contacts');
        toast.success(`Opening Contact Summary for ${foundContact.name || foundContact.first_name || 'Contact'}`);
        return;
      }
      
      openEmail(email);
      setIsEmailModalOpen(true);
      toast.info('No matching Lead or Contact found in CRM.');
    } catch (err) {
      openEmail(email);
      setIsEmailModalOpen(true);
    }
  };

  return (
    <div className="flex border-none h-[calc(100vh-80px)] relative bg-background">
      <aside className={`shrink-0 border-r border-border bg-card flex flex-col gap-2 transition duration-300 ${isAsideCollapsed ? 'w-16 p-2' : 'w-64 p-4'}`}>
        <div className="flex items-center justify-between mb-4">
          {!isAsideCollapsed && <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider pl-2">Mailbox</span>}
          <button 
            onClick={() => setIsAsideCollapsed(!isAsideCollapsed)}
            className={`p-1.5 hover:bg-card border border-border/40 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer transition-colors ${isAsideCollapsed ? 'mx-auto' : ''}`}
            title={isAsideCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            <Menu className="h-3.5 w-3.5" />
          </button>
        </div>

        <button 
          onClick={openBlankCompose}
          className={`flex items-center justify-center gap-2 py-3 bg-brand-purple hover:bg-brand-purple/90 text-white rounded-xl text-sm font-bold transition cursor-pointer shadow-sm mb-4 ${isAsideCollapsed ? 'w-10 h-10 rounded-full p-0 mx-auto' : 'w-full'}`}
          title="Compose"
        >
          <PenSquare className="h-4.5 w-4.5" />
          {!isAsideCollapsed && <span>Compose</span>}
        </button>

        <nav className="space-y-1">
          {[
            { id: 'all', label: 'All Mail', icon: Mail, count: total },
            { id: 'inbound', label: 'Inbox', icon: Inbox, count: unreadCount },
            { id: 'outbound', label: 'Sent', icon: SendIcon, count: 0 },
            { id: 'drafts', label: 'Drafts', icon: FileIcon, count: 0 },
            { id: 'unread', label: 'Unread', icon: MailOpen, count: unreadCount },
            { id: 'starred', label: 'Starred', icon: Star, count: 0 },
            { id: 'snoozed', label: 'Snoozed', icon: ClockIcon, count: 0 },
            { id: 'trash', label: 'Trash', icon: Trash2, count: 0 }
          ].map(item => {
            const Icon = item.icon;
            const active = filter === item.id || (item.id === 'all' && filter === 'all'); // simplify logic for mockup
            return (
              <button 
                key={item.id} 
                onClick={() => { if (['all', 'inbound', 'outbound', 'unread'].includes(item.id)) { setFilter(item.id as MailboxFilter); setPage(1); } }} 
                className={`flex items-center rounded-r-2xl text-sm font-semibold transition cursor-pointer ${
                  isAsideCollapsed 
                    ? 'justify-center p-2 rounded-2xl w-10 h-10 mx-auto' 
                    : 'w-full justify-between px-4 py-2.5'
                } ${active ? 'bg-brand-purple/10 text-brand-purple border-l-4 border-brand-purple' : 'hover:bg-secondary text-muted-foreground hover:text-foreground border-l-4 border-transparent'}`}
                title={isAsideCollapsed ? item.label : undefined}
              >
                <span className="flex items-center gap-3">
                  <Icon className="h-5 w-5" />
                  {!isAsideCollapsed && item.label}
                </span>
                {!isAsideCollapsed && item.count > 0 && (
                  <span className="text-[11px] font-bold bg-brand-purple/10 text-brand-purple px-2 py-0.5 rounded-full tabular-nums">{item.count}</span>
                )}
              </button>
            );
          })}
        </nav>
      </aside>

      <section className="flex-1 min-w-0 flex flex-col bg-card">
        <div className="h-16 px-6 flex items-center justify-between shrink-0 gap-4 pt-2">
          <div className="relative flex-1 max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search sender, subject, preview..." className="w-full pl-11 pr-4 py-2.5 border border-border rounded-xl text-xs text-foreground focus:outline-none bg-background shadow-sm" />
          </div>
          <button onClick={loadEmails} disabled={isLoading} className="p-2.5 hover:bg-secondary rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50" title="Refresh emails">
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {error && <div className="m-6 mt-0 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-xs font-semibold text-destructive flex gap-2"><AlertCircle className="h-4 w-4 shrink-0" />{error}</div>}

        <div className="flex-1 overflow-y-auto mt-2 px-6 pb-24">
          {isLoading ? (
            <div className="h-full flex items-center justify-center text-muted-foreground text-xs font-semibold"><Loader2 className="h-5 w-5 animate-spin mr-2" />Loading emails...</div>
          ) : emails.length === 0 ? (
            <div className="h-full flex items-center justify-center text-muted-foreground text-xs font-semibold">No emails found.</div>
          ) : (
            <div className="space-y-2">
              {emails.map((email, idx) => {
                const colors = ['bg-blue-500/10 text-blue-600', 'bg-emerald-500/10 text-emerald-600', 'bg-amber-500/10 text-amber-600', 'bg-rose-500/10 text-rose-600', 'bg-purple-500/10 text-purple-600'];
                const colorClass = colors[idx % colors.length];
                const address = email.direction === 'outbound' ? email.receiver || 'Recipient' : email.sender;
                const initial = address ? address.substring(0, 2).toUpperCase() : '??';

                return (
                  <button key={email.id} onClick={() => handleSingleClick(email)} onDoubleClick={() => handleDoubleClick(email)} className={`w-full text-left p-4 rounded-2xl hover:bg-secondary/40 transition-colors border ${selectedEmail?.id === email.id ? 'border-brand-purple/30 bg-brand-purple/5 shadow-sm' : !email.is_read ? 'border-border/60 bg-secondary/20' : 'border-transparent'}`}>
                    <div className="flex gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${colorClass}`}>
                        {initial}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className={`text-sm font-bold truncate ${!email.is_read ? 'text-foreground' : 'text-foreground/80'}`}>{address}</h4>
                          <div className="flex items-center gap-3 shrink-0 text-muted-foreground">
                            <span className="text-xs font-semibold">{formatDate(email.sent_at)}</span>
                            <Star className="h-4 w-4 hover:text-amber-400 cursor-pointer" />
                            <MoreHorizontal className="h-4 w-4 hover:text-foreground cursor-pointer" />
                          </div>
                        </div>
                        <p className={`text-sm truncate mb-1 ${!email.is_read ? 'font-bold text-foreground' : 'font-semibold text-foreground/80'}`}>{email.subject}</p>
                        <p className="text-xs text-muted-foreground font-semibold line-clamp-1">{email.body_preview || 'No preview available'}</p>
                        <div className="flex items-center gap-3 mt-2 text-[10px] font-semibold text-muted-foreground">
                          {email.thread_id && <span className="bg-secondary px-2 py-0.5 rounded text-muted-foreground border border-border/50">Thread ID: {email.thread_id}</span>}
                          {email.attachment_metadata?.length > 0 && <span className="inline-flex items-center gap-1"><Paperclip className="h-3 w-3" />{email.attachment_metadata.length}</span>}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground pl-6">
            Showing {total === 0 ? '0' : `${(page - 1) * pageSize + 1} to ${Math.min(page * pageSize, total)}`} of {total} emails
          </span>
          <div className="flex items-center gap-3 pr-[88px]">
            <div className="flex items-center">
              <button onClick={() => setPage(value => Math.max(1, value - 1))} disabled={page <= 1} className="w-8 h-8 flex items-center justify-center border border-border bg-card rounded-l-lg text-muted-foreground hover:bg-secondary cursor-pointer transition-colors disabled:opacity-50"><ChevronLeft className="h-4 w-4" /></button>
              <button className="w-8 h-8 flex items-center justify-center border-y border-border bg-brand-purple/10 text-brand-purple font-bold text-xs cursor-pointer">{page}</button>
              <button className="w-8 h-8 flex items-center justify-center border border-border bg-card hover:bg-secondary text-muted-foreground font-bold text-xs cursor-pointer">{Math.min(totalPages, page + 1)}</button>
              <button className="w-8 h-8 flex items-center justify-center border-y border-border bg-card text-muted-foreground text-xs cursor-pointer">...</button>
              <button className="w-8 h-8 flex items-center justify-center border border-border bg-card hover:bg-secondary text-muted-foreground font-bold text-xs cursor-pointer">{totalPages}</button>
              <button onClick={() => setPage(value => Math.min(totalPages, value + 1))} disabled={page >= totalPages} className="w-8 h-8 flex items-center justify-center border border-border bg-card rounded-r-lg text-muted-foreground hover:bg-secondary cursor-pointer transition-colors disabled:opacity-50"><ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>
          
          <div className="absolute bottom-0 right-0 flex items-center gap-3">
            <button className="w-12 h-12 rounded-full bg-brand-purple text-white shadow-lg flex items-center justify-center hover:bg-brand-purple/90 transition-transform hover:scale-105 cursor-pointer">
              <Plus className="h-6 w-6" />
            </button>
            <button className="w-12 h-12 rounded-full bg-card border border-border text-brand-purple shadow-lg flex items-center justify-center hover:bg-secondary transition-transform hover:scale-105 cursor-pointer">
              <Sparkles className="h-5 w-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Detail Slide-over Drawer (overlay) */}
      {isEmailModalOpen && selectedEmail && (
        <div className="absolute inset-y-0 right-0 w-[550px] max-w-full bg-card border-l border-border shadow-2xl z-20 flex flex-col animate-in slide-in-from-right duration-300">
          <div className="flex items-center justify-between border-b border-border p-4 bg-secondary shrink-0">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Email Details</h3>
            <button 
              onClick={() => { setIsEmailModalOpen(false); setSelectedEmail(null); }}
              className="p-1.5 hover:bg-secondary rounded text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {isDetailLoading ? (
              <div className="h-full flex items-center justify-center text-muted-foreground text-xs font-semibold"><Loader2 className="h-5 w-5 animate-spin mr-2" />Loading details...</div>
            ) : (
              <>
                <div>
                  <h3 className="text-base font-semibold text-foreground leading-tight">{selectedEmail.subject}</h3>
                  <p className="text-[10px] font-semibold text-muted-foreground mt-1">{formatDate(selectedEmail.sent_at)} - {selectedEmail.is_read ? 'Read' : 'Unread'}</p>
                </div>
                <div className="rounded-xl border border-border bg-secondary p-4 space-y-2 text-xs font-semibold text-muted-foreground">
                  <p><span className="font-semibold text-foreground">From:</span> {selectedEmail.sender}</p>
                  <p><span className="font-semibold text-foreground">To:</span> {selectedEmail.receiver || 'Not provided'}</p>
                  {selectedEmail.thread_id && <p><span className="font-semibold text-foreground">Thread:</span> {selectedEmail.thread_id}</p>}
                </div>
                <div className="text-xs text-foreground font-semibold leading-relaxed whitespace-pre-line border-b border-border pb-6 min-h-[140px]">{selectedEmail.body_preview || 'No message body was provided by the backend response.'}</div>
                {selectedEmail.direction === 'inbound' && (emailSummary || isSummaryLoading) && (
                  <div className="rounded-xl border border-brand-purple/20 bg-brand-purple/5 p-4 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-semibold text-brand-purple">
                      {isSummaryLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                      <span>AI Summary</span>
                      {emailSummary?.model_version && <span className="text-[10px] text-muted-foreground font-semibold ml-auto">{emailSummary.model_version}</span>}
                    </div>
                    {isSummaryLoading ? (
                      <p className="text-[11px] text-muted-foreground font-semibold">Generating summary...</p>
                    ) : emailSummary?.summary && (
                      <>
                        <p className="text-xs text-foreground font-semibold leading-relaxed whitespace-pre-line">{emailSummary.summary}</p>
                        <div className="flex flex-wrap gap-2 text-[10px] font-semibold">
                          {emailSummary.sentiment && <span className="px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">{emailSummary.sentiment}</span>}
                          {emailSummary.intent && <span className="px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">{emailSummary.intent}</span>}
                          {emailSummary.category && <span className="px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">{emailSummary.category}</span>}
                          {emailSummary.follow_up_suggestion && <span className="px-2 py-0.5 rounded-full bg-brand-purple/10 text-brand-purple">{emailSummary.follow_up_suggestion}</span>}
                        </div>
                        {emailSummary.key_points?.length > 0 && (
                          <div className="space-y-1">
                            <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest">Key Points</p>
                            <ul className="list-disc list-inside text-[11px] text-foreground font-semibold space-y-0.5">
                              {emailSummary.key_points.map((point, i) => <li key={i}>{point}</li>)}
                            </ul>
                          </div>
                        )}
                        {emailSummary.action_items?.length > 0 && (
                          <div className="space-y-1">
                            <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest">Action Items</p>
                            <ul className="list-disc list-inside text-[11px] text-foreground font-semibold space-y-0.5">
                              {emailSummary.action_items.map((item, i) => <li key={i}>{item}</li>)}
                            </ul>
                          </div>
                        )}
                        {emailSummary.draft_reply && (
                          <div className="space-y-1">
                            <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest">Suggested Reply</p>
                            <p className="text-[11px] text-foreground font-semibold whitespace-pre-line border-l-2 border-brand-purple/30 pl-3">{emailSummary.draft_reply}</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
                <div className="space-y-2.5">
                  <h4 className="text-[9px] font-semibold text-foreground uppercase tracking-widest">Attachments</h4>
                  {selectedEmail.attachment_metadata?.length ? selectedEmail.attachment_metadata.map(file => (
                    <div key={file.attachment_id || file.filename} className="p-2.5 border border-border rounded-lg bg-secondary flex items-center text-[10px] font-semibold w-fit">
                      <Paperclip className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                      <span className="text-foreground mr-2">{file.filename}</span>
                      <span className="text-muted-foreground font-semibold">{formatSize(file.size_bytes)}</span>
                    </div>
                  )) : <p className="text-xs text-muted-foreground font-semibold">No attachments.</p>}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* AI Compose Modal */}
      {isComposeOpen && (
        <div className="fixed inset-0 bg-ink/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200" onClick={closeCompose}>
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-3.5 border-b border-border flex justify-between items-center bg-secondary">
              <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
                <PenSquare className="h-4 w-4 text-brand-purple" />
                {composeForm.name ? `Email ${composeForm.name}` : 'New Email'}
              </h3>
              <button onClick={closeCompose} className="text-muted-foreground hover:text-foreground p-1 cursor-pointer"><X className="h-4.5 w-4.5" /></button>
            </div>

            {gmailConnected === false && (
              <div className="mx-5 mt-4 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-[11px] font-semibold text-amber-700">
                Gmail is not connected. Go to <strong>Integrations</strong> in the sidebar to connect your Gmail account, then try again.
              </div>
            )}

            <form onSubmit={handleSendCompose} className="p-5 space-y-4">
              <div>
                <label className="block text-[9px] font-semibold text-foreground uppercase tracking-wider mb-1">To</label>
                <input type="email" required placeholder="name@company.com" value={composeForm.to} onChange={e => setComposeForm({ ...composeForm, to: e.target.value })} className="w-full px-3 py-1.5 border border-border rounded-lg text-xs text-foreground focus:outline-none bg-background" />
              </div>
              <div>
                <label className="block text-[9px] font-semibold text-foreground uppercase tracking-wider mb-1">Subject</label>
                <input type="text" required placeholder="Subject line" value={composeForm.subject} onChange={e => setComposeForm({ ...composeForm, subject: e.target.value })} disabled={isDrafting} className="w-full px-3 py-1.5 border border-border rounded-lg text-xs text-foreground focus:outline-none bg-background disabled:opacity-50" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[9px] font-semibold text-foreground uppercase tracking-wider">Email Body</label>
                  {isDrafting && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-brand-purple">
                      <Sparkles className="h-3 w-3 animate-pulse" /> AI drafting...
                    </span>
                  )}
                </div>
                {isDrafting ? (
                  <div className="w-full min-h-[140px] border border-border rounded-lg bg-secondary flex items-center justify-center">
                    <Loader2 className="h-5 w-5 animate-spin text-brand-purple" />
                  </div>
                ) : (
                  <textarea required placeholder="Write message..." value={composeForm.body} onChange={e => setComposeForm({ ...composeForm, body: e.target.value })} className="w-full p-2.5 border border-border rounded-lg text-xs text-foreground focus:outline-none min-h-[140px] bg-background leading-relaxed" />
                )}
                {!isDrafting && composeForm.body && composeContext && (
                  <p className="text-[10px] text-muted-foreground font-semibold mt-1.5 flex items-center gap-1"><Bot className="h-3 w-3" /> AI-drafted — review and edit before sending.</p>
                )}
              </div>

              {composeError && <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-[11px] font-semibold text-destructive flex gap-2"><AlertCircle className="h-4 w-4 shrink-0" />{composeError}</div>}

              <div className="pt-3 border-t border-border flex justify-between items-center">
                <button type="button" onClick={closeCompose} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-destructive cursor-pointer">
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Discard</span>
                </button>
                <div className="flex gap-2.5">
                  <button
                    type="button"
                    onClick={() => generateDraft({
                      to: composeForm.to,
                      name: composeForm.name || composeContext?.name,
                      company: composeContext?.company,
                      designation: composeContext?.designation,
                      purpose: composeContext?.purpose || 'follow_up',
                      context: composeContext?.context,
                      externalEntityType: composeContext?.externalEntityType,
                      externalEntityId: composeContext?.externalEntityId,
                      requestId: Date.now()
                    })}
                    disabled={isDrafting || !composeForm.to}
                    className="px-4 py-1.5 border border-border rounded-lg text-xs font-semibold text-foreground hover:bg-secondary cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Regenerate
                  </button>
                  <button
                    type="submit"
                    disabled={isSending || isDrafting || gmailConnected === false || !composeForm.to || !composeForm.subject || !composeForm.body}
                    className="inline-flex items-center space-x-1.5 px-4 py-1.5 bg-brand-purple hover:bg-brand-purple/90 text-primary-foreground rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                    <span>{isSending ? 'Sending...' : 'Send Email'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}