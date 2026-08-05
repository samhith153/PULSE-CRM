'use client';

import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Mail, 
  Phone, 
  Calendar, 
  UserPlus, 
  FileText, 
  GitPullRequest,
  Search,
  ListFilter
} from 'lucide-react';
import CalendarView from './CalendarView';
import { motion, AnimatePresence } from 'framer-motion';

interface ActivityLog {
  id: number;
  type: 'creation' | 'email' | 'call' | 'meeting' | 'note' | 'stage_change';
  title: string;
  desc: string;
  user: string;
  time: string;
  dateKey: 'today' | 'week' | 'month';
}

export default function ActivitiesView() {
  const [activeSubTab, setActiveSubTab] = useState<'audit' | 'calendar'>('audit');
  
  const [logs] = useState<ActivityLog[]>([
    { id: 1, type: 'note', title: 'Internal Note Added', desc: 'Alex Rivera: Interested in enterprise migration plan.', user: 'Sarah Johnson', time: '10 mins ago', dateKey: 'today' },
    { id: 2, type: 'email', title: 'Proposal Email Sent', desc: 'Subject: Cloud migration specs and security SLAs', user: 'Sarah Johnson', time: '2 hours ago', dateKey: 'today' },
    { id: 3, type: 'meeting', title: 'Meeting Scheduled: Security Review', desc: 'Date: May 20, 2025 at 10:00 AM', user: 'Alex Johnson', time: '1 day ago', dateKey: 'week' },
    { id: 4, type: 'call', title: 'Call Logged: Outbound Discovery', desc: 'Outcome: Spoke with Marcus Aurelius. Compliance checklist discussed.', user: 'Alex Johnson', time: '3 days ago', dateKey: 'week' },
    { id: 5, type: 'stage_change', title: 'Deal Moved to Proposal', desc: 'Database Cloud Migration moved from Contacted to Proposal.', user: 'System', time: '4 days ago', dateKey: 'week' },
    { id: 6, type: 'creation', title: 'New Lead Ingested', desc: 'Helena Troy registered via custom enterprise contact form.', user: 'System', time: '1 week ago', dateKey: 'month' },
    { id: 7, type: 'call', title: 'Call Outcome: Busy', desc: 'Tried calling David Hume. Cold nurturing assigned.', user: 'David Wilson', time: '2 weeks ago', dateKey: 'month' }
  ]);
  useEffect(() => {
    const handleOpenMeeting = () => {
      setActiveSubTab('calendar');
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('pulse-open-create-calendar-event-modal'));
      }, 100);
    };
    window.addEventListener('pulse-open-create-meeting-modal', handleOpenMeeting);
    return () => window.removeEventListener('pulse-open-create-meeting-modal', handleOpenMeeting);
  }, []);

  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [search, setSearch] = useState('');

  const filtered = logs.filter(l => {
    const matchesFilter = dateFilter === 'all' || l.dateKey === dateFilter;
    const matchesSearch = l.title.toLowerCase().includes(search.toLowerCase()) || 
                          l.desc.toLowerCase().includes(search.toLowerCase()) || 
                          l.user.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getIcon = (type: ActivityLog['type']) => {
    switch(type) {
      case 'creation': return <UserPlus className="h-4 w-4 text-blue-600" />;
      case 'email': return <Mail className="h-4 w-4 text-brand-purple" />;
      case 'call': return <Phone className="h-4 w-4 text-brand-cyan" />;
      case 'meeting': return <Calendar className="h-4 w-4 text-purple-600" />;
      case 'note': return <FileText className="h-4 w-4 text-amber-600" />;
      case 'stage_change': return <GitPullRequest className="h-4 w-4 text-destructive" />;
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 350, damping: 26 } }
  };

  return (
    <div className="space-y-6">
      {/* Unified Tab Sub-Navigation (Tactile pills) */}
      <div className="flex space-x-1.5 p-1 bg-secondary border border-border rounded-xl w-fit">
        <button
          onClick={() => setActiveSubTab('audit')}
          className={`py-1.5 px-4 rounded-lg font-semibold text-xs transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'audit' 
              ? 'bg-brand-purple text-primary-foreground' 
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
          }`}
        >
          <ListFilter className="h-3.5 w-3.5" />
          <span>Audit Logs</span>
        </button>
        <button
          onClick={() => setActiveSubTab('calendar')}
          className={`py-1.5 px-4 rounded-lg font-semibold text-xs transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'calendar' 
              ? 'bg-brand-purple text-primary-foreground' 
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
          }`}
        >
          <Calendar className="h-3.5 w-3.5" />
          <span>Calendar</span>
        </button>
      </div>

      {/* Render sub views */}
      {activeSubTab === 'audit' && (
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
            <div>
              <h2 className="font-sans text-2xl text-foreground font-bold">Audit Activities Log</h2>
              <p className="text-[11px] text-muted-foreground mt-0.5 font-semibold">Monitor a chronological timeline of calls, emails, notes, stage adjustments, and lead actions.</p>
            </div>
            
            {/* Time Filter Pills */}
            <div className="flex space-x-1 p-1 bg-secondary border border-border rounded-xl shrink-0">
              {['all', 'today', 'week', 'month'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setDateFilter(tab as any)}
                  className={`py-1 px-3 rounded-lg font-semibold text-[10px] uppercase transition-all duration-200 cursor-pointer ${
                    dateFilter === tab 
                      ? 'bg-brand-purple text-primary-foreground' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-5">
            <span className="absolute inset-y-0 left-2.5 flex items-center pointer-events-none text-muted-foreground">
              <Search className="h-3.5 w-3.5" />
            </span>
            <input 
              type="text" 
              placeholder="Search activities by user, log description, action type..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 border border-border rounded-lg text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-brand-purple/20 bg-secondary"
            />
          </div>

          {/* Timeline representation */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="relative border-l border-border pl-4 ml-3 space-y-6"
          >
            <AnimatePresence mode="popLayout">
              {filtered.length > 0 ? (
                filtered.map((log) => (
                  <motion.div 
                    key={log.id} 
                    variants={itemVariants}
                    layout
                    exit={{ opacity: 0, y: -15 }}
                    className="relative"
                  >
                    {/* Visual Icon Node overlay */}
                    <div className="absolute -left-[27px] top-0 h-6.5 w-6.5 rounded-full bg-card border border-border flex items-center justify-center z-10 shadow-sm">
                      {getIcon(log.type)}
                    </div>

                    <div className="bg-secondary/40 hover:bg-secondary/70 border border-border/80 rounded-xl p-4 transition-colors duration-200 hover:shadow-nav">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
                        <div>
                          <h4 className="text-xs font-bold text-foreground">{log.title}</h4>
                          <p className="text-xs text-muted-foreground mt-1 font-semibold leading-relaxed">{log.desc}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-[10px] font-semibold text-muted-foreground flex items-center justify-end">
                            <Clock className="h-3 w-3 mr-1 text-muted-foreground" />
                            {log.time}
                          </span>
                          <p className="text-[9px] text-brand-purple font-semibold mt-0.5">by {log.user}</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-muted-foreground text-center py-6 text-xs font-semibold"
                >
                  No activity logs found matching the filter criteria.
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      )}

      {activeSubTab === 'calendar' && <CalendarView />}
    </div>
  );
}
