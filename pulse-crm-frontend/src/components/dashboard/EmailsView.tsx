'use client';

import React, { useState } from 'react';
import { 
  Inbox, 
  Send, 
  FileText, 
  Mail, 
  Search, 
  Plus, 
  CornerUpLeft, 
  CornerUpRight, 
  Paperclip, 
  Sparkles, 
  X, 
  Check,
  ChevronRight,
  User,
  Star,
  Trash2,
  Archive,
  RefreshCw,
  MoreVertical,
  ChevronLeft,
  ArrowLeft,
  CornerDownLeft,
  MailOpen,
  SendHorizontal
} from 'lucide-react';

interface EmailThread {
  id: number;
  sender: string;
  senderEmail: string;
  subject: string;
  body: string;
  time: string;
  folder: 'inbox' | 'sent' | 'drafts';
  aiSummary: string;
  unread: boolean;
  starred: boolean;
  attachments: { name: string; size: string }[];
}

export default function EmailsView() {
  const [threads, setThreads] = useState<EmailThread[]>([
    {
      id: 1,
      sender: "Alex Rivera",
      senderEmail: "alex.rivera@techcorp.com",
      subject: "SSO Config Approved & Security Review",
      body: "Hi Sarah,\n\nWe reviewed the SSO guidelines you sent. Our compliance team approved the SAML setup but they have some questions regarding custom SLAs and liability limits. Can we schedule a quick call tomorrow to clarify these items?\n\nBest,\nAlex",
      time: "10:15 AM",
      folder: "inbox",
      aiSummary: "Prospect approved SAML config specs but has questions about liability limits and SLAs. Recommends arranging clarification call.",
      unread: true,
      starred: true,
      attachments: [{ name: "SAML_Approval.docx", size: "110 KB" }]
    },
    {
      id: 2,
      sender: "Helena Troy",
      senderEmail: "helena.t@spartacreative.io",
      subject: "Pricing Inquiry - Custom Enterprise Tier",
      body: "Hello Sarah,\n\nI was looking over the custom analytics dashboard tiers on your pricing page. We have around 40 designers who need priority SLA support. Do you support volumetric discounts for design agencies? Let me know.\n\nThanks,\nHelena",
      time: "Yesterday",
      folder: "inbox",
      aiSummary: "Helena inquires about agency volume pricing tiers for 40 seats. Needs response regarding custom priority SLA.",
      unread: false,
      starred: false,
      attachments: []
    },
    {
      id: 3,
      sender: "Sarah Johnson",
      senderEmail: "sarah.j@pulse.crm",
      subject: "Re: Security compliance review",
      body: "Hi Marcus,\n\nI have attached our HIPAA and SOC2 compliance audit folders. Let me know if you need our lead architect on the sandbox review call.\n\nSarah Johnson",
      time: "2 days ago",
      folder: "sent",
      aiSummary: "Sent compliance audit folders (HIPAA/SOC2) to Marcus to coordinate sandbox reviews.",
      unread: false,
      starred: false,
      attachments: [{ name: "Pulse_SOC2_HIPAA.zip", size: "4.5 MB" }]
    }
  ]);

  const [activeFolder, setActiveFolder] = useState<'inbox' | 'sent' | 'drafts' | 'starred'>('inbox');
  const [selectedThreadId, setSelectedThreadId] = useState<number | null>(null);
  const [currentView, setCurrentView] = useState<'list' | 'reader'>('list');
  const [search, setSearch] = useState('');
  
  // Selection state
  const [selectedThreads, setSelectedThreads] = useState<number[]>([]);

  // Modals / forms state
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [composeForm, setComposeForm] = useState({ to: '', subject: '', body: '' });

  // Inline replies
  const [inlineComposerMode, setInlineComposerMode] = useState<'reply' | 'forward' | null>(null);
  const [inlineBody, setInlineBody] = useState('');
  const [inlineTo, setInlineTo] = useState('');

  // Active thread helper
  const activeThread = selectedThreadId ? threads.find(t => t.id === selectedThreadId) || null : null;

  // Folder filtering
  const folderThreads = threads.filter(t => {
    if (activeFolder === 'starred') return t.starred;
    return t.folder === activeFolder;
  });

  // Search filtering
  const filteredThreads = folderThreads.filter(t => 
    t.sender.toLowerCase().includes(search.toLowerCase()) || 
    t.subject.toLowerCase().includes(search.toLowerCase()) || 
    t.body.toLowerCase().includes(search.toLowerCase())
  );

  // Folder thread unread counts
  const inboxUnreadCount = threads.filter(t => t.folder === 'inbox' && t.unread).length;
  const starredCount = threads.filter(t => t.starred).length;

  const handleCompose = (e: React.FormEvent) => {
    e.preventDefault();
    const newMail: EmailThread = {
      id: Date.now(),
      sender: "Sarah Johnson",
      senderEmail: "sarah.j@pulse.crm",
      subject: composeForm.subject,
      body: composeForm.body,
      time: "10:15 AM", // Mock standard time
      folder: "sent",
      aiSummary: `Sent message to ${composeForm.to}. Subject: ${composeForm.subject}`,
      unread: false,
      starred: false,
      attachments: []
    };
    setThreads([newMail, ...threads]);
    setIsComposeOpen(false);
    setComposeForm({ to: '', subject: '', body: '' });
  };

  const handleSendInline = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inlineBody.trim() || !activeThread) return;

    const newMail: EmailThread = {
      id: Date.now(),
      sender: "Sarah Johnson",
      senderEmail: "sarah.j@pulse.crm",
      subject: inlineComposerMode === 'reply' ? `Re: ${activeThread.subject}` : `Fwd: ${activeThread.subject}`,
      body: inlineComposerMode === 'reply' 
        ? inlineBody 
        : `---------- Forwarded message ----------\nFrom: ${activeThread.sender} <${activeThread.senderEmail}>\n\n${inlineBody}`,
      time: "10:15 AM",
      folder: "sent",
      aiSummary: inlineComposerMode === 'reply' 
        ? `Replied to ${activeThread.sender}.` 
        : `Forwarded thread to ${inlineTo}`,
      unread: false,
      starred: false,
      attachments: inlineComposerMode === 'forward' ? activeThread.attachments : []
    };

    setThreads([newMail, ...threads]);
    setInlineComposerMode(null);
    setInlineBody('');
    setInlineTo('');
    setCurrentView('list');
    setSelectedThreadId(null);
  };

  const handleToggleStar = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setThreads(threads.map(t => t.id === id ? { ...t, starred: !t.starred } : t));
  };

  const handleSelectThread = (e: React.ChangeEvent<HTMLInputElement>, id: number) => {
    e.stopPropagation();
    if (e.target.checked) {
      setSelectedThreads([...selectedThreads, id]);
    } else {
      setSelectedThreads(selectedThreads.filter(tid => tid !== id));
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedThreads(filteredThreads.map(t => t.id));
    } else {
      setSelectedThreads([]);
    }
  };

  const handleMarkSelectedRead = (unreadState: boolean) => {
    setThreads(threads.map(t => selectedThreads.includes(t.id) ? { ...t, unread: unreadState } : t));
    setSelectedThreads([]);
  };

  const handleDeleteSelected = () => {
    setThreads(threads.filter(t => !selectedThreads.includes(t.id)));
    setSelectedThreads([]);
  };

  const handleRowDelete = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setThreads(threads.filter(t => t.id !== id));
    if (selectedThreadId === id) {
      setSelectedThreadId(null);
      setCurrentView('list');
    }
  };

  const handleRowToggleRead = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setThreads(threads.map(t => t.id === id ? { ...t, unread: !t.unread } : t));
  };

  return (
    <div className="flex border border-brand-border-purple/20 rounded-xl overflow-hidden bg-white h-[650px] shadow-sm/5 relative">
      
      {/* 1. Gmail Left Sidebar */}
      <div className="w-56 shrink-0 border-r border-brand-border-purple/15 bg-slate-50/50 p-3 flex flex-col justify-between">
        <div className="space-y-4">
          {/* Large Compose Button */}
          <button 
            onClick={() => setIsComposeOpen(true)}
            className="flex items-center space-x-3 bg-white hover:bg-slate-50 border border-brand-border-purple/35 text-brand-text py-3 px-5 rounded-2xl text-xs font-bold shadow-sm transition-all hover:shadow-md cursor-pointer shrink-0"
          >
            <Plus className="h-4.5 w-4.5 text-brand-accent" strokeWidth={2.5} />
            <span>Compose</span>
          </button>

          {/* Sidebar Folders */}
          <nav className="space-y-0.5">
            {[
              { id: 'inbox', label: 'Inbox', icon: Inbox, count: inboxUnreadCount },
              { id: 'starred', label: 'Starred', icon: Star, count: starredCount },
              { id: 'sent', label: 'Sent', icon: Send, count: 0 },
              { id: 'drafts', label: 'Drafts', icon: FileText, count: 0 }
            ].map((fol) => {
              const Icon = fol.icon;
              const isSelected = activeFolder === fol.id;
              return (
                <button
                  key={fol.id}
                  onClick={() => {
                    setActiveFolder(fol.id as any);
                    setSelectedThreadId(null);
                    setCurrentView('list');
                  }}
                  className={`w-full flex items-center justify-between px-4 py-2 rounded-r-full text-xs font-bold transition-all cursor-pointer ${
                    isSelected 
                      ? 'bg-brand-accent/10 text-brand-accent border-l-3 border-brand-accent' 
                      : 'hover:bg-slate-100/70 text-brand-text/75 hover:text-brand-text'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`h-4.5 w-4.5 shrink-0 ${isSelected ? 'text-brand-accent' : 'text-slate-450'}`} strokeWidth={1.75} />
                    <span>{fol.label}</span>
                  </div>
                  {fol.count > 0 && (
                    <span className="text-[10px] font-extrabold bg-brand-accent/10 text-brand-accent px-2 py-0.5 rounded-full tabular-nums">
                      {fol.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Info label */}
        <div className="text-[9px] font-bold text-slate-400 p-3 leading-relaxed border-t border-brand-border-purple/10">
          Sync Status: <span className="text-emerald-500 font-extrabold">Active</span>
          <p className="mt-0.5 font-medium">Synced with CRM Workspace</p>
        </div>
      </div>

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        
        {/* VIEW 1: INBOX THREADS LIST */}
        {currentView === 'list' && (
          <div className="flex-1 flex flex-col min-w-0 h-full">
            
            {/* Top Toolbar controls */}
            <div className="h-12 border-b border-brand-border-purple/15 px-4 flex items-center justify-between bg-slate-50/30 shrink-0">
              <div className="flex items-center space-x-4">
                {/* Select All Checkbox */}
                <input 
                  type="checkbox" 
                  onChange={handleSelectAll}
                  checked={filteredThreads.length > 0 && selectedThreads.length === filteredThreads.length}
                  className="cursor-pointer rounded border-slate-350 text-brand-accent focus:ring-brand-accent/25"
                />

                {/* Bulk Action Buttons (Appear when items are selected) */}
                {selectedThreads.length > 0 ? (
                  <div className="flex items-center space-x-2 animate-in fade-in slide-in-from-left-2 duration-150">
                    <button 
                      onClick={() => handleMarkSelectedRead(false)}
                      className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-brand-text transition-colors cursor-pointer"
                      title="Mark as Read"
                    >
                      <MailOpen className="h-4.5 w-4.5" />
                    </button>
                    <button 
                      onClick={() => handleMarkSelectedRead(true)}
                      className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-brand-text transition-colors cursor-pointer"
                      title="Mark as Unread"
                    >
                      <Mail className="h-4.5 w-4.5" />
                    </button>
                    <button 
                      onClick={handleDeleteSelected}
                      className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="h-4.5 w-4.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1 text-slate-400">
                    <button className="p-1.5 hover:bg-slate-100 rounded hover:text-brand-text transition-colors cursor-pointer">
                      <RefreshCw className="h-4 w-4" />
                    </button>
                    <button className="p-1.5 hover:bg-slate-100 rounded hover:text-brand-text transition-colors cursor-pointer">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Pagination and Search bar */}
              <div className="flex items-center space-x-4">
                {/* Embedded Search bar */}
                <div className="relative w-48 lg:w-60">
                  <span className="absolute inset-y-0 left-2.5 flex items-center pointer-events-none text-slate-400">
                    <Search className="h-3.5 w-3.5" />
                  </span>
                  <input 
                    type="text" 
                    placeholder="Search mail..." 
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1 border border-brand-border-purple/35 rounded-lg text-[11px] text-brand-text focus:outline-none focus:bg-white bg-slate-100/50"
                  />
                </div>

                {/* Pagination */}
                <div className="flex items-center space-x-2 text-[10px] text-slate-400 font-extrabold select-none">
                  <span>1-{filteredThreads.length} of {filteredThreads.length}</span>
                  <div className="flex space-x-0.5 border border-brand-border-purple/20 rounded-md bg-white">
                    <button className="p-1 hover:bg-slate-100 text-slate-400 hover:text-brand-text disabled:opacity-40 cursor-pointer" disabled>
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </button>
                    <button className="p-1 hover:bg-slate-100 text-slate-400 hover:text-brand-text disabled:opacity-40 cursor-pointer" disabled>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Email list body */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {filteredThreads.length > 0 ? (
                filteredThreads.map((thread) => {
                  const isChecked = selectedThreads.includes(thread.id);
                  return (
                    <div
                      key={thread.id}
                      onClick={() => {
                        setSelectedThreadId(thread.id);
                        setCurrentView('reader');
                        setInlineComposerMode(null);
                        if (thread.unread) {
                          setThreads(threads.map(t => t.id === thread.id ? { ...t, unread: false } : t));
                        }
                      }}
                      className={`flex items-center justify-between border-b border-slate-100 py-3.5 px-4 hover:bg-slate-50/70 hover:shadow-[inset_2px_0_0_#7957fb] transition-all cursor-pointer group text-xs text-brand-text ${
                        thread.unread ? 'bg-slate-50/40' : 'bg-white'
                      }`}
                    >
                      {/* Left Controls & Sender */}
                      <div className="flex items-center space-x-3 shrink-0 min-w-0 mr-4">
                        <input 
                          type="checkbox" 
                          checked={isChecked}
                          onChange={(e) => handleSelectThread(e, thread.id)}
                          onClick={e => e.stopPropagation()}
                          className="cursor-pointer rounded border-slate-350 text-brand-accent focus:ring-brand-accent/25"
                        />
                        <button 
                          onClick={(e) => handleToggleStar(e, thread.id)}
                          className={`cursor-pointer ${thread.starred ? 'text-amber-400' : 'text-slate-300 hover:text-slate-400'}`}
                        >
                          <Star className="h-4.5 w-4.5" fill={thread.starred ? "currentColor" : "none"} />
                        </button>
                        <span className={`w-28 truncate leading-tight ${thread.unread ? 'font-extrabold text-brand-heading' : 'font-semibold text-brand-text/75'}`}>
                          {thread.sender}
                        </span>
                      </div>

                      {/* Middle: Subject & body snippet */}
                      <div className="flex-1 min-w-0 flex items-center justify-between mx-4">
                        <div className="min-w-0 flex-1 pr-4">
                          <p className="truncate text-left leading-normal text-xs">
                            <span className={thread.unread ? 'font-extrabold text-brand-heading' : 'font-bold text-brand-text/95'}>
                              {thread.subject}
                            </span>
                            <span className="text-slate-400 font-medium font-sans">
                              {` — ${thread.body.replace(/\n/g, ' ')}`}
                            </span>
                          </p>
                        </div>

                        {/* Attachment indicator badge */}
                        {thread.attachments.length > 0 && (
                          <div className="flex items-center space-x-1 shrink-0 bg-slate-50 border border-brand-border-purple/20 px-1.5 py-0.5 rounded text-[9px] font-bold text-slate-500">
                            <Paperclip className="h-2.5 w-2.5" />
                            <span>{thread.attachments.length}</span>
                          </div>
                        )}
                      </div>

                      {/* Right: Date / Hover actions */}
                      <div className="shrink-0 ml-4 pl-2 min-w-16 text-right">
                        {/* Time label (Visible when NOT hovered) */}
                        <span className="text-[10px] text-slate-400 font-bold group-hover:hidden tabular-nums">
                          {thread.time}
                        </span>

                        {/* Quick actions (Visible on Hover) */}
                        <div className="hidden group-hover:flex items-center space-x-1.5 justify-end">
                          <button 
                            onClick={(e) => handleRowToggleRead(e, thread.id)}
                            className="p-1 hover:bg-slate-200 text-slate-500 rounded transition-all cursor-pointer"
                            title={thread.unread ? "Mark as Read" : "Mark as Unread"}
                          >
                            {thread.unread ? <MailOpen className="h-3.5 w-3.5" /> : <Mail className="h-3.5 w-3.5" />}
                          </button>
                          <button 
                            onClick={(e) => handleRowDelete(e, thread.id)}
                            className="p-1 hover:bg-slate-200 text-slate-500 hover:text-rose-600 rounded transition-all cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-2">
                  <Mail className="h-8 w-8 text-slate-300" strokeWidth={1.5} />
                  <p className="text-slate-400 text-xs font-semibold">No mail threads found in {activeFolder}.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 2: GMAIL THREAD READER */}
        {currentView === 'reader' && activeThread && (
          <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
            
            {/* Top Toolbar actions */}
            <div className="h-12 border-b border-brand-border-purple/15 px-4 flex items-center justify-between bg-slate-50/30 shrink-0">
              <div className="flex items-center space-x-3.5">
                <button 
                  onClick={() => {
                    setCurrentView('list');
                    setSelectedThreadId(null);
                  }}
                  className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-brand-text transition-colors cursor-pointer"
                  title="Back to List"
                >
                  <ArrowLeft className="h-4.5 w-4.5 text-brand-accent" strokeWidth={2.25} />
                </button>
                <div className="h-4 w-px bg-brand-border-purple/20" />
                <button 
                  onClick={() => {
                    setThreads(threads.map(t => t.id === activeThread.id ? { ...t, starred: !t.starred } : t));
                  }}
                  className={`p-1.5 hover:bg-slate-100 rounded transition-colors cursor-pointer ${
                    activeThread.starred ? 'text-amber-400' : 'text-slate-500 hover:text-brand-text'
                  }`}
                  title="Star Thread"
                >
                  <Star className="h-4.5 w-4.5" fill={activeThread.starred ? "currentColor" : "none"} />
                </button>
                <button 
                  onClick={(e) => {
                    setThreads(threads.map(t => t.id === activeThread.id ? { ...t, unread: true } : t));
                    setCurrentView('list');
                    setSelectedThreadId(null);
                  }}
                  className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-brand-text transition-colors cursor-pointer"
                  title="Mark as Unread"
                >
                  <Mail className="h-4.5 w-4.5" />
                </button>
                <button 
                  onClick={(e) => handleRowDelete(e, activeThread.id)}
                  className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
                  title="Delete Thread"
                >
                  <Trash2 className="h-4.5 w-4.5" />
                </button>
              </div>

              {/* Pagination */}
              <div className="flex items-center space-x-2 text-[10px] text-slate-400 font-extrabold select-none">
                <span>Thread Reader</span>
              </div>
            </div>

            {/* Reader view body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Subject Title */}
              <div>
                <h3 className="text-base font-extrabold text-brand-heading leading-tight">{activeThread.subject}</h3>
              </div>

              {/* Sender Details row */}
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-9 w-9 rounded-full bg-brand-accent/10 border border-brand-border-purple/20 flex items-center justify-center text-brand-accent shrink-0 font-bold text-xs">
                    {activeThread.sender.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center space-x-1.5 text-xs">
                      <span className="font-extrabold text-brand-heading">{activeThread.sender}</span>
                      <span className="text-[10px] text-slate-400 font-semibold">&lt;{activeThread.senderEmail}&gt;</span>
                    </div>
                    <p className="text-[9px] text-slate-400 font-bold mt-0.5">to me</p>
                  </div>
                </div>
                <span className="text-[10px] text-slate-450 font-bold tabular-nums">{activeThread.time}</span>
              </div>

              {/* AI Summary Banner */}
              <div className="bg-brand-sidebar-hover/15 border border-brand-border-purple/25 rounded-xl p-4 flex items-start space-x-3 shrink-0">
                <div className="p-1 bg-brand-accent/10 rounded-lg text-brand-accent shrink-0">
                  <Sparkles className="h-4.5 w-4.5 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-[9px] font-extrabold text-brand-heading uppercase tracking-wider">Gemini CRM Summary</h4>
                  <p className="text-[11px] text-brand-text/80 mt-1 leading-relaxed font-bold">{activeThread.aiSummary}</p>
                </div>
              </div>

              {/* Message Body */}
              <div className="text-xs text-brand-text font-semibold leading-relaxed whitespace-pre-line border-b border-slate-100 pb-6 min-h-[120px]">
                {activeThread.body}
              </div>

              {/* Attachments */}
              {activeThread.attachments && activeThread.attachments.length > 0 && (
                <div className="space-y-2.5">
                  <h4 className="text-[9px] font-extrabold text-brand-heading uppercase tracking-wider">Attachments</h4>
                  <div className="flex flex-wrap gap-2.5">
                    {activeThread.attachments.map((file, idx) => (
                      <div key={idx} className="p-2.5 border border-brand-border-purple/15 rounded-lg bg-slate-50/50 flex items-center text-[10px] font-bold">
                        <Paperclip className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
                        <span className="text-brand-heading mr-2">{file.name}</span>
                        <span className="text-slate-400 font-semibold">({file.size})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reader Action Triggers */}
              {inlineComposerMode === null ? (
                <div className="flex space-x-3 pt-2">
                  <button 
                    onClick={() => {
                      setInlineComposerMode('reply');
                      setInlineTo(activeThread.senderEmail);
                    }}
                    className="inline-flex items-center space-x-1.5 px-4 py-2 border border-brand-border-purple/35 hover:border-brand-border-purple text-brand-text/80 text-xs font-bold rounded-lg cursor-pointer bg-white transition-colors"
                  >
                    <CornerUpLeft className="h-4 w-4 text-brand-accent" strokeWidth={2.25} />
                    <span>Reply</span>
                  </button>
                  <button 
                    onClick={() => {
                      setInlineComposerMode('forward');
                      setInlineTo('');
                    }}
                    className="inline-flex items-center space-x-1.5 px-4 py-2 border border-brand-border-purple/35 hover:border-brand-border-purple text-brand-text/80 text-xs font-bold rounded-lg cursor-pointer bg-white transition-colors"
                  >
                    <CornerUpRight className="h-4 w-4 text-slate-450" />
                    <span>Forward</span>
                  </button>
                </div>
              ) : (
                /* 3. Inline Composer (Gmail style inline reply editor) */
                <form 
                  onSubmit={handleSendInline}
                  className="border border-brand-border-purple/30 rounded-xl p-4 bg-slate-50/40 space-y-4 animate-in slide-in-from-bottom-3 duration-250 mt-4"
                >
                  <div className="flex items-center justify-between border-b border-brand-border-purple/10 pb-2">
                    <div className="flex items-center space-x-1.5 text-xs text-brand-text">
                      <CornerDownLeft className="h-4 w-4 text-brand-accent shrink-0" />
                      <span className="font-bold">
                        {inlineComposerMode === 'reply' ? 'Reply to' : 'Forward to'}
                      </span>
                      {inlineComposerMode === 'reply' ? (
                        <span className="font-extrabold text-brand-heading">{activeThread.senderEmail}</span>
                      ) : (
                        <input 
                          type="email" 
                          required 
                          placeholder="recipient@company.com" 
                          value={inlineTo}
                          onChange={e => setInlineTo(e.target.value)}
                          className="px-2 py-0.5 border border-brand-border-purple/20 bg-white rounded text-[11px] font-semibold text-brand-text focus:outline-none focus:ring-1 focus:ring-brand-accent/20 w-48"
                        />
                      )}
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setInlineComposerMode(null)} 
                      className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-brand-text cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div>
                    <textarea 
                      required 
                      placeholder={inlineComposerMode === 'reply' ? 'Write email response...' : 'Forward message notes...'} 
                      value={inlineBody}
                      onChange={e => setInlineBody(e.target.value)}
                      className="w-full p-3 border border-brand-border-purple/25 bg-white rounded-lg text-xs font-semibold text-brand-text focus:outline-none focus:ring-1 focus:ring-brand-accent/20 min-h-[140px] resize-y leading-relaxed"
                    />
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <div className="flex items-center space-x-2 text-slate-400">
                      <button type="button" className="p-2 hover:bg-slate-100 rounded hover:text-brand-text cursor-pointer">
                        <Paperclip className="h-4.5 w-4.5" />
                      </button>
                    </div>
                    <div className="flex items-center space-x-2.5">
                      <button 
                        type="button" 
                        onClick={() => setInlineComposerMode(null)} 
                        className="px-3.5 py-1.5 border border-brand-border-purple/35 rounded-lg text-xs font-bold text-brand-text/75 hover:bg-white cursor-pointer"
                      >
                        Discard
                      </button>
                      <button 
                        type="submit" 
                        className="inline-flex items-center space-x-1.5 px-4 py-1.5 bg-brand-accent hover:bg-brand-accent-hover text-white rounded-lg text-xs font-bold shadow-sm/10 cursor-pointer"
                      >
                        <SendHorizontal className="h-3.5 w-3.5" />
                        <span>Send</span>
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 3. Floating Compose Window (Bottom Right corner, Gmail style!) */}
      {isComposeOpen && (
        <div 
          className="absolute bottom-0 right-12 w-96 bg-white border border-brand-border-purple/35 rounded-t-xl shadow-2xl overflow-hidden z-50 flex flex-col max-h-[400px] animate-in slide-in-from-bottom duration-250"
          onClick={e => e.stopPropagation()}
        >
          {/* Composer Header */}
          <div className="px-4 py-2.5 border-b border-brand-border-purple/15 flex justify-between items-center bg-[#00004f] text-white">
            <span className="font-extrabold text-[11px] tracking-wide uppercase">New Message</span>
            <button 
              onClick={() => setIsComposeOpen(false)} 
              className="text-slate-300 hover:text-white p-0.5 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Composer Form */}
          <form onSubmit={handleCompose} className="p-4 flex-1 flex flex-col space-y-3 justify-between">
            <div className="space-y-2.5">
              <input 
                type="email" 
                required 
                placeholder="To" 
                value={composeForm.to} 
                onChange={e => setComposeForm({...composeForm, to: e.target.value})} 
                className="w-full border-b border-brand-border-purple/15 py-1 text-xs text-brand-text placeholder-slate-450 focus:outline-none focus:border-brand-accent"
              />
              <input 
                type="text" 
                required 
                placeholder="Subject" 
                value={composeForm.subject} 
                onChange={e => setComposeForm({...composeForm, subject: e.target.value})} 
                className="w-full border-b border-brand-border-purple/15 py-1 text-xs text-brand-text placeholder-slate-450 focus:outline-none focus:border-brand-accent"
              />
              <textarea 
                required 
                placeholder="Write message..." 
                value={composeForm.body} 
                onChange={e => setComposeForm({...composeForm, body: e.target.value})} 
                className="w-full py-2 text-xs font-semibold text-brand-text placeholder-slate-400 focus:outline-none min-h-[140px] resize-none leading-relaxed" 
              />
            </div>

            {/* Composer Footer toolbar */}
            <div className="pt-2 border-t border-brand-border-purple/10 flex justify-between items-center shrink-0">
              <button type="button" className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-brand-text cursor-pointer">
                <Paperclip className="h-4 w-4" />
              </button>
              <div className="flex space-x-2">
                <button 
                  type="button" 
                  onClick={() => setIsComposeOpen(false)} 
                  className="px-3 py-1.5 border border-brand-border-purple/30 rounded-lg text-[10px] font-bold text-brand-text/75 hover:bg-slate-50 cursor-pointer"
                >
                  Discard
                </button>
                <button 
                  type="submit" 
                  className="inline-flex items-center space-x-1 px-4 py-1.5 bg-brand-accent hover:bg-brand-accent-hover text-white rounded-lg text-[10px] font-bold shadow-sm/10 cursor-pointer"
                >
                  <SendHorizontal className="h-3.5 w-3.5" />
                  <span>Send</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
