'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Bot, ChevronLeft, ChevronRight, Inbox, Loader2, Mail, MailOpen, Paperclip, RefreshCw, Search, Sparkles } from 'lucide-react';
import { getEmail, getEmails, getEmailSummary, EmailSummaryData, SyncedEmail } from '@/utils/api';

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

export default function EmailsView({ onLoaded }: { onLoaded?: () => void } = {}) {
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
      if (detail.thread_id) {
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

  return (
    <div className="flex border border-border rounded-2xl overflow-hidden bg-card h-[650px]">
      <aside className="w-56 shrink-0 border-r border-border bg-secondary p-3 flex flex-col gap-4">
        <nav className="space-y-0.5">
          {[
            { id: 'all', label: 'All Mail', icon: Mail, count: total },
            { id: 'inbound', label: 'Inbox', icon: Inbox, count: unreadCount },
            { id: 'outbound', label: 'Sent', icon: MailOpen, count: 0 },
            { id: 'unread', label: 'Unread', icon: MailOpen, count: unreadCount }
          ].map(item => {
            const Icon = item.icon;
            const active = filter === item.id;
            return (
              <button key={item.id} onClick={() => { setFilter(item.id as MailboxFilter); setPage(1); }} className={`w-full flex items-center justify-between px-4 py-2 rounded-r-full text-xs font-semibold transition-all cursor-pointer ${active ? 'bg-brand-purple/10 text-brand-purple border-l-3 border-brand-purple' : 'hover:bg-secondary text-muted-foreground hover:text-foreground'}`}>
                <span className="flex items-center gap-3"><Icon className="h-4.5 w-4.5" />{item.label}</span>
                {item.count > 0 && <span className="text-[10px] font-semibold bg-brand-purple/10 text-brand-purple px-2 py-0.5 rounded-full tabular-nums">{item.count}</span>}
              </button>
            );
          })}
        </nav>
      </aside>

      <section className="w-[46%] min-w-[360px] border-r border-border flex flex-col">
        <div className="h-12 border-b border-border px-4 flex items-center justify-between bg-secondary shrink-0 gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search sender, subject, preview..." className="w-full pl-8 pr-3 py-1.5 border border-border rounded-lg text-[11px] text-foreground focus:outline-none bg-background" />
          </div>
          <button onClick={loadEmails} disabled={isLoading} className="p-1.5 hover:bg-secondary rounded text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50" title="Refresh emails">
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {error && <div className="m-3 rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive flex gap-2"><AlertCircle className="h-4 w-4 shrink-0" />{error}</div>}

        <div className="flex-1 overflow-y-auto divide-y divide-border">
          {isLoading ? (
            <div className="h-full flex items-center justify-center text-muted-foreground text-xs font-semibold"><Loader2 className="h-5 w-5 animate-spin mr-2" />Loading emails...</div>
          ) : emails.length === 0 ? (
            <div className="h-full flex items-center justify-center text-muted-foreground text-xs font-semibold">No emails found.</div>
          ) : emails.map(email => (
            <button key={email.id} onClick={() => openEmail(email)} className={`w-full text-left px-4 py-3.5 hover:bg-secondary/50 transition-colors ${selectedEmail?.id === email.id ? 'bg-brand-purple/5' : !email.is_read ? 'bg-secondary/50' : ''}`}>
              <div className="flex items-center justify-between gap-3">
                <p className={`truncate text-xs ${!email.is_read ? 'font-semibold text-foreground' : 'font-bold text-muted-foreground/80'}`}>{email.direction === 'outbound' ? email.receiver || 'Recipient' : email.sender}</p>
                <span className="text-[10px] text-muted-foreground font-semibold shrink-0">{formatDate(email.sent_at)}</span>
              </div>
              <p className="text-xs font-semibold text-foreground truncate mt-1">{email.subject}</p>
              <p className="text-[11px] text-muted-foreground font-semibold truncate mt-0.5">{email.body_preview || 'No preview available'}</p>
              <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground font-semibold">
                {email.thread_id && <span>Thread {email.thread_id}</span>}
                {email.attachment_metadata?.length > 0 && <span className="inline-flex items-center gap-1"><Paperclip className="h-3 w-3" />{email.attachment_metadata.length}</span>}
              </div>
            </button>
          ))}
        </div>

        <div className="h-11 border-t border-border px-4 flex items-center justify-between text-[10px] text-muted-foreground font-semibold">
          <span>{total === 0 ? '0' : `${(page - 1) * pageSize + 1}-${Math.min(page * pageSize, total)}`} of {total}</span>
          <div className="flex border border-border rounded-md bg-background">
            <button onClick={() => setPage(value => Math.max(1, value - 1))} disabled={page <= 1} className="p-1 hover:bg-secondary disabled:opacity-40"><ChevronLeft className="h-3.5 w-3.5" /></button>
            <button onClick={() => setPage(value => Math.min(totalPages, value + 1))} disabled={page >= totalPages} className="p-1 hover:bg-secondary disabled:opacity-40"><ChevronRight className="h-3.5 w-3.5" /></button>
          </div>
        </div>
      </section>

      <section className="flex-1 min-w-0 bg-card">
        {!selectedEmail ? (
          <div className="h-full flex items-center justify-center text-muted-foreground text-xs font-semibold">Select an email to view details.</div>
        ) : isDetailLoading ? (
          <div className="h-full flex items-center justify-center text-muted-foreground text-xs font-semibold"><Loader2 className="h-5 w-5 animate-spin mr-2" />Loading details...</div>
        ) : (
          <div className="h-full overflow-y-auto p-6 space-y-5">
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
            {(emailSummary || isSummaryLoading) && (
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
          </div>
        )}
      </section>
    </div>
  );
}
