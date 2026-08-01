'use client';

import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, ChevronLeft, ChevronRight, Inbox, Loader2, Mail, MailOpen, Paperclip, RefreshCw, Search, Sparkles } from 'lucide-react';
import { getEmail, getEmails, getGmailConnections, getThread, syncGmail, SyncedEmail, ThreadSummary } from '@/utils/api';

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
  const [threadEmails, setThreadEmails] = useState<SyncedEmail[]>([]);
  const [threadSummary, setThreadSummary] = useState<ThreadSummary | null>(null);
  const [filter, setFilter] = useState<MailboxFilter>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [counts, setCounts] = useState({ all: 0, inbound: 0, outbound: 0, unread: 0 });

  const direction = filter === 'inbound' ? 'inbound' : filter === 'outbound' ? 'outbound' : '';
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const loadEmails = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getEmails({
        page,
        page_size: pageSize,
        search,
        direction,
        is_read: filter === 'unread' ? false : undefined,
        sort_order: 'desc'
      });
      setEmails(result.data);
      setTotal(result.total);
      if (selectedEmail && !result.data.some(item => item.id === selectedEmail.id)) setSelectedEmail(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load emails.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadCounts = async () => {
    try {
      const [allRes, inboundRes, outboundRes, unreadRes] = await Promise.all([
        getEmails({ page: 1, page_size: 1 }),
        getEmails({ page: 1, page_size: 1, direction: 'inbound' }),
        getEmails({ page: 1, page_size: 1, direction: 'outbound' }),
        getEmails({ page: 1, page_size: 1, is_read: false }),
      ]);
      setCounts({
        all: allRes.total,
        inbound: inboundRes.total,
        outbound: outboundRes.total,
        unread: unreadRes.total
      });
    } catch {
      // Counts are cosmetic; keep last known values on failure.
    }
  };

  const runSync = async () => {
    try {
      const connections = await getGmailConnections();
      const connection = connections.find(item => item.is_active) ?? connections[0];
      if (!connection) return;
      setIsSyncing(true);
      await syncGmail(connection.id);
    } catch {
      // Fall through to listing already-synced emails.
    } finally {
      setIsSyncing(false);
    }
  };

  const refresh = async () => {
    await runSync();
    await Promise.all([loadCounts(), loadEmails()]);
  };

  const hasLoadedOnceRef = useRef(false);

  useEffect(() => {
    if (!hasLoadedOnceRef.current) {
      hasLoadedOnceRef.current = true;
      refresh().finally(() => onLoaded?.());
      return;
    }
    loadEmails();
  }, [page, filter]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setPage(1);
      loadEmails();
    }, 350);
    return () => window.clearTimeout(timeout);
  }, [search]);

  const openEmail = async (email: SyncedEmail) => {
    setSelectedEmail(email);
    setThreadEmails([]);
    setThreadSummary(null);
    setIsDetailLoading(true);
    setError(null);
    try {
      const fullEmail = await getEmail(email.id);
      setSelectedEmail(fullEmail);
      if (fullEmail.thread_id) {
        try {
          const thread = await getThread(fullEmail.thread_id);
          setThreadEmails(thread.emails);
          setThreadSummary(thread.summary);
        } catch {
          // Thread fetch failed; show single email only.
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load email details.');
    } finally {
      setIsDetailLoading(false);
    }
  };

  return (
    <div className="flex border border-brand-border-purple/20 rounded-xl overflow-hidden bg-white h-[650px] shadow-sm/5">
      <aside className="w-56 shrink-0 border-r border-brand-border-purple/15 bg-slate-50/50 p-3 flex flex-col gap-4">
        <nav className="space-y-0.5">
          {[
            { id: 'all', label: 'All Mail', icon: Mail, count: counts.all },
            { id: 'inbound', label: 'Inbox', icon: Inbox, count: counts.inbound },
            { id: 'outbound', label: 'Sent', icon: MailOpen, count: counts.outbound },
            { id: 'unread', label: 'Unread', icon: MailOpen, count: counts.unread }
          ].map(item => {
            const Icon = item.icon;
            const active = filter === item.id;
            return (
              <button key={item.id} onClick={() => { setFilter(item.id as MailboxFilter); setPage(1); }} className={`w-full flex items-center justify-between px-4 py-2 rounded-r-full text-xs font-bold transition-all cursor-pointer ${active ? 'bg-brand-accent/10 text-brand-accent border-l-3 border-brand-accent' : 'hover:bg-slate-100/70 text-brand-text/75 hover:text-brand-text'}`}>
                <span className="flex items-center gap-3"><Icon className="h-4.5 w-4.5" />{item.label}</span>
                {item.count > 0 && <span className="text-[10px] font-extrabold bg-brand-accent/10 text-brand-accent px-2 py-0.5 rounded-full tabular-nums">{item.count}</span>}
              </button>
            );
          })}
        </nav>
      </aside>

      <section className="w-[46%] min-w-[360px] border-r border-brand-border-purple/15 flex flex-col">
        <div className="h-12 border-b border-brand-border-purple/15 px-4 flex items-center justify-between bg-slate-50/30 shrink-0 gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search sender, subject, preview..." className="w-full pl-8 pr-3 py-1.5 border border-brand-border-purple/35 rounded-lg text-[11px] text-brand-text focus:outline-none focus:bg-white bg-white" />
          </div>
          <button onClick={refresh} disabled={isLoading || isSyncing} className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-brand-text transition-colors disabled:opacity-50" title="Sync Gmail and refresh emails">
            <RefreshCw className={`h-4 w-4 ${isLoading || isSyncing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {error && <div className="m-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 flex gap-2"><AlertCircle className="h-4 w-4 shrink-0" />{error}</div>}

        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {isLoading ? (
            <div className="h-full flex items-center justify-center text-slate-400 text-xs font-bold"><Loader2 className="h-5 w-5 animate-spin mr-2" />Loading emails...</div>
          ) : emails.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-400 text-xs font-bold">No emails found.</div>
          ) : emails.map(email => (
            <button key={email.id} onClick={() => openEmail(email)} className={`w-full text-left px-4 py-3.5 hover:bg-slate-50 transition-colors ${selectedEmail?.id === email.id ? 'bg-brand-accent/5' : !email.is_read ? 'bg-slate-50/50' : 'bg-white'}`}>
              <div className="flex items-center justify-between gap-3">
                <p className={`truncate text-xs ${!email.is_read ? 'font-extrabold text-brand-heading' : 'font-bold text-brand-text/80'}`}>{email.direction === 'outbound' ? email.receiver || 'Recipient' : email.sender}</p>
                <span className="text-[10px] text-slate-400 font-bold shrink-0">{formatDate(email.sent_at)}</span>
              </div>
              <p className="text-xs font-extrabold text-brand-heading truncate mt-1">{email.subject}</p>
              <p className="text-[11px] text-brand-text/60 font-semibold truncate mt-0.5">{email.body_preview || 'No preview available'}</p>
              <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-400 font-bold">
                {email.thread_id && <span>Thread {email.thread_id}</span>}
                {email.attachment_metadata?.length > 0 && <span className="inline-flex items-center gap-1"><Paperclip className="h-3 w-3" />{email.attachment_metadata.length}</span>}
              </div>
            </button>
          ))}
        </div>

        <div className="h-11 border-t border-brand-border-purple/15 px-4 flex items-center justify-between text-[10px] text-slate-400 font-extrabold">
          <span>{total === 0 ? '0' : `${(page - 1) * pageSize + 1}-${Math.min(page * pageSize, total)}`} of {total}</span>
          <div className="flex border border-brand-border-purple/20 rounded-md bg-white">
            <button onClick={() => setPage(value => Math.max(1, value - 1))} disabled={page <= 1} className="p-1 hover:bg-slate-100 disabled:opacity-40"><ChevronLeft className="h-3.5 w-3.5" /></button>
            <button onClick={() => setPage(value => Math.min(totalPages, value + 1))} disabled={page >= totalPages} className="p-1 hover:bg-slate-100 disabled:opacity-40"><ChevronRight className="h-3.5 w-3.5" /></button>
          </div>
        </div>
      </section>

      <section className="flex-1 min-w-0 bg-white">
        {!selectedEmail ? (
          <div className="h-full flex items-center justify-center text-slate-400 text-xs font-bold">Select an email to view details.</div>
        ) : isDetailLoading ? (
          <div className="h-full flex items-center justify-center text-slate-400 text-xs font-bold"><Loader2 className="h-5 w-5 animate-spin mr-2" />Loading details...</div>
        ) : (
          <div className="h-full overflow-y-auto p-6 space-y-5">
            <div>
              <h3 className="text-base font-extrabold text-brand-heading leading-tight">{selectedEmail.subject}</h3>
              <p className="text-[10px] font-bold text-slate-400 mt-1">{selectedEmail.thread_id && `Thread: ${selectedEmail.thread_id}`}</p>
            </div>
            {threadSummary && (
              <div className="rounded-xl border border-brand-accent/20 bg-brand-accent/5 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-brand-accent" />
                  <h4 className="text-xs font-extrabold text-brand-accent uppercase tracking-wider">AI Summary</h4>
                  {threadSummary.confidence != null && (
                    <span className="text-[9px] font-bold text-slate-400 ml-auto">{Math.round(threadSummary.confidence * 100)}% confidence</span>
                  )}
                </div>
                <p className="text-xs font-semibold text-brand-text leading-relaxed">{threadSummary.summary}</p>
                <div className="flex flex-wrap gap-2">
                  {threadSummary.sentiment && (
                    <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${threadSummary.sentiment === 'positive' ? 'bg-emerald-100 text-emerald-700' : threadSummary.sentiment === 'negative' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>
                      {threadSummary.sentiment}
                    </span>
                  )}
                  {threadSummary.category && (
                    <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">{threadSummary.category}</span>
                  )}
                  {threadSummary.intent && (
                    <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{threadSummary.intent}</span>
                  )}
                </div>
                {threadSummary.follow_up_suggestion && (
                  <div className="flex items-start gap-1.5 pt-1 border-t border-brand-accent/10">
                    <span className="text-[9px] font-extrabold text-brand-accent shrink-0 mt-0.5">Follow-up:</span>
                    <span className="text-[10px] font-semibold text-brand-text/70">{threadSummary.follow_up_suggestion}</span>
                  </div>
                )}
              </div>
            )}
            {threadEmails.length > 0 ? (
              <div className="space-y-4">
                {threadEmails.map((msg) => (
                  <div key={msg.id} className="rounded-xl border border-brand-border-purple/15 bg-slate-50/50 p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-extrabold text-brand-heading">{msg.direction === 'outbound' ? `To: ${msg.receiver}` : `From: ${msg.sender}`}</p>
                      <span className="text-[10px] font-bold text-slate-400">{formatDate(msg.sent_at)}</span>
                    </div>
                    <div className="text-xs text-brand-text font-semibold leading-relaxed whitespace-pre-line">{msg.body_preview || 'No message body.'}</div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="rounded-xl border border-brand-border-purple/15 bg-slate-50/50 p-4 space-y-2 text-xs font-semibold text-brand-text/80">
                  <p><span className="font-extrabold text-brand-heading">From:</span> {selectedEmail.sender}</p>
                  <p><span className="font-extrabold text-brand-heading">To:</span> {selectedEmail.receiver || 'Not provided'}</p>
                </div>
                <div className="text-xs text-brand-text font-semibold leading-relaxed whitespace-pre-line border-b border-slate-100 pb-6 min-h-[140px]">{selectedEmail.body_preview || 'No message body was provided by the backend response.'}</div>
              </>
            )}
            <div className="space-y-2.5">
              <h4 className="text-[9px] font-extrabold text-brand-heading uppercase tracking-wider">Attachments</h4>
              {selectedEmail.attachment_metadata?.length ? selectedEmail.attachment_metadata.map(file => (
                <div key={file.attachment_id || file.filename} className="p-2.5 border border-brand-border-purple/15 rounded-lg bg-slate-50/50 flex items-center text-[10px] font-bold w-fit">
                  <Paperclip className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
                  <span className="text-brand-heading mr-2">{file.filename}</span>
                  <span className="text-slate-400 font-semibold">{formatSize(file.size_bytes)}</span>
                </div>
              )) : <p className="text-xs text-slate-400 font-semibold">No attachments.</p>}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}