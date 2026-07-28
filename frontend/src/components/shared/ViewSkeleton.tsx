'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';

interface ViewSkeletonProps {
  tab: string;
}

export default function ViewSkeleton({ tab }: ViewSkeletonProps) {
  // Normalize the tab name
  const activeTab = tab.toLowerCase();

  // Mapping tab names to friendly display titles
  const getTabLabel = (t: string) => {
    switch (t) {
      case 'leads': return 'Leads & Accounts';
      case 'contacts': return 'Contact Directory';
      case 'companies': return 'Company Registry';
      case 'deals':
      case 'pipeline':
      case 'team pipeline': return 'Pipeline';
      case 'products': return 'Product Catalog';
      case 'emails': return 'Email Integration';
      case 'calendar': return 'Calendar Events';
      case 'documents': return 'Document Vault';
      case 'activities': return 'Activity Stream';
      case 'notifications': return 'Notifications';
      case 'settings': return 'System Settings';
      case 'profile': return 'User Profile';
      case 'users': return 'User Directory';
      case 'roles & permissions': return 'RBAC Security';
      case 'integrations': return 'System Integrations';
      case 'automation': return 'Workflows';
      case 'ai models': return 'AI Frameworks';
      case 'audit logs': return 'System Audit Logs';
      default: return 'Workspace Dashboard';
    }
  };

  const currentTabLabel = getTabLabel(activeTab);

  // Render the specific skeleton layouts
  const renderLayout = () => {
    // 1. Kanban Board Skeleton (Deals, Pipeline, Team Pipeline)
    if (['deals', 'pipeline', 'team pipeline'].includes(activeTab)) {
      return (
        <div className="space-y-6">
          {/* View Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-2">
              <div className="h-8 w-48 premium-shimmer rounded-lg" />
              <div className="h-4 w-80 premium-shimmer rounded" />
            </div>
            <div className="h-8.5 w-32 premium-shimmer rounded-lg" />
          </div>

          {/* Filter Toolbar */}
          <div className="flex flex-wrap gap-3 pb-2">
            <div className="h-8.5 w-40 premium-shimmer rounded-lg" />
            <div className="h-8.5 w-28 premium-shimmer rounded-lg" />
            <div className="h-8.5 w-28 premium-shimmer rounded-lg" />
          </div>

          {/* Kanban Board Columns Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-5 overflow-x-auto pb-4">
            {['Qualified', 'Proposal', 'Under Review', 'Won', 'Lost'].map((columnName, idx) => (
              <div key={idx} className="bg-slate-50/50 border border-slate-150/50 rounded-xl p-4 min-w-[220px] space-y-4">
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="h-4 w-20 premium-shimmer rounded" />
                  <div className="h-5 w-6 rounded-full premium-shimmer" />
                </div>
                
                {/* Column Cards (2-3 cards per column) */}
                {[1, 2, 3].slice(0, 3 - (idx % 2)).map((cardIdx) => (
                  <div key={cardIdx} className="bg-white border border-slate-200/60 rounded-xl p-4 shadow-sm space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="h-4 w-24 premium-shimmer rounded" />
                      <div className="h-3 w-8 premium-shimmer rounded-full" />
                    </div>
                    <div className="h-3 w-16 premium-shimmer rounded" />
                    <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                      <div className="flex items-center space-x-1.5">
                        <div className="h-5.5 w-5.5 rounded-full premium-shimmer" />
                        <div className="h-2.5 w-12 premium-shimmer rounded" />
                      </div>
                      <div className="h-3.5 w-16 premium-shimmer rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      );
    }

    // 2. Table / List List Skeleton (Leads, Contacts, Users, Audit Logs, etc.)
    if (['leads', 'contacts', 'users', 'audit logs'].includes(activeTab)) {
      return (
        <div className="space-y-6">
          {/* View Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-2">
              <div className="h-8 w-44 premium-shimmer rounded-lg" />
              <div className="h-4 w-96 premium-shimmer rounded max-w-full" />
            </div>
            <div className="h-8.5 w-28 premium-shimmer rounded-lg" />
          </div>

          {/* Filters/Search Table Header */}
          <div className="bg-white border border-slate-200/60 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <div className="h-9 w-full premium-shimmer rounded-lg" />
              </div>
              <div className="flex gap-2">
                <div className="h-8.5 w-24 premium-shimmer rounded-lg" />
                <div className="h-8.5 w-24 premium-shimmer rounded-lg" />
              </div>
            </div>

            {/* Table Outline */}
            <div className="border border-slate-100 rounded-lg overflow-hidden">
              {/* Header Row */}
              <div className="bg-slate-50 px-4 py-3 flex items-center justify-between border-b border-slate-100">
                {[1, 2, 3, 4, 5].map((w, idx) => (
                  <div key={idx} className="h-4 w-20 premium-shimmer rounded" />
                ))}
              </div>
              {/* Content Rows */}
              {[1, 2, 3, 4, 5, 6].map((row) => (
                <div key={row} className="px-4 py-4 flex items-center justify-between border-b border-slate-100 last:border-b-0">
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 rounded-full premium-shimmer" />
                    <div className="space-y-1.5">
                      <div className="h-3 w-28 premium-shimmer rounded" />
                      <div className="h-2 w-16 premium-shimmer rounded" />
                    </div>
                  </div>
                  <div className="h-3 w-20 premium-shimmer rounded" />
                  <div className="h-3 w-16 premium-shimmer rounded-full" />
                  <div className="h-3 w-24 premium-shimmer rounded" />
                  <div className="flex space-x-2">
                    <div className="h-6 w-6 rounded premium-shimmer" />
                    <div className="h-6 w-6 rounded premium-shimmer" />
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <div className="h-4 w-32 premium-shimmer rounded" />
              <div className="flex gap-1.5">
                <div className="h-8 w-8 rounded premium-shimmer" />
                <div className="h-8 w-8 rounded premium-shimmer" />
              </div>
            </div>
          </div>
        </div>
      );
    }

    // 3. Grid of Cards Skeleton (Companies, Products, Integrations)
    if (['companies', 'products', 'integrations'].includes(activeTab)) {
      return (
        <div className="space-y-6">
          {/* View Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-2">
              <div className="h-8 w-44 premium-shimmer rounded-lg" />
              <div className="h-4 w-96 premium-shimmer rounded max-w-full" />
            </div>
            <div className="h-8.5 w-32 premium-shimmer rounded-lg" />
          </div>

          {/* Toolbar */}
          <div className="flex justify-between items-center bg-white border border-slate-200/60 rounded-xl p-4 shadow-sm">
            <div className="h-9 w-64 premium-shimmer rounded-lg" />
            <div className="h-9 w-20 premium-shimmer rounded-lg" />
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((cardIdx) => (
              <div key={cardIdx} className="bg-white border border-slate-200/60 rounded-xl p-5 shadow-sm space-y-4">
                <div className="flex items-center space-x-3.5 pb-2 border-b border-slate-100">
                  <div className="h-10 w-10 rounded-lg premium-shimmer" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-4.5 w-32 premium-shimmer rounded" />
                    <div className="h-3 w-20 premium-shimmer rounded" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 w-full premium-shimmer rounded" />
                  <div className="h-3 w-4/5 premium-shimmer rounded" />
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                  <div className="h-3.5 w-16 premium-shimmer rounded" />
                  <div className="h-7 w-20 premium-shimmer rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // 4. Split Pane Skeleton (Emails View)
    if (activeTab === 'emails') {
      return (
        <div className="flex border border-slate-200/60 rounded-xl bg-white h-[calc(100vh-140px)] overflow-hidden shadow-sm">
          {/* Inbox Left Pane (Width 1/3) */}
          <div className="w-1/3 border-r border-slate-200 flex flex-col shrink-0">
            <div className="p-4 border-b border-slate-150">
              <div className="h-8.5 w-full premium-shimmer rounded-lg" />
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="p-4 space-y-2">
                  <div className="flex justify-between">
                    <div className="h-3.5 w-24 premium-shimmer rounded" />
                    <div className="h-2 w-10 premium-shimmer rounded" />
                  </div>
                  <div className="h-3.5 w-36 premium-shimmer rounded" />
                  <div className="h-2.5 w-full premium-shimmer rounded" />
                </div>
              ))}
            </div>
          </div>

          {/* Message Right Pane (Width 2/3) */}
          <div className="flex-1 flex flex-col p-6 space-y-6">
            <div className="space-y-2 border-b border-slate-100 pb-4">
              <div className="h-6 w-3/4 premium-shimmer rounded" />
              <div className="h-3 w-40 premium-shimmer rounded" />
            </div>
            <div className="rounded-xl bg-slate-50 p-4 space-y-2.5">
              <div className="h-3.5 w-48 premium-shimmer rounded" />
              <div className="h-3.5 w-40 premium-shimmer rounded" />
            </div>
            <div className="space-y-3 flex-1">
              <div className="h-3.5 w-full premium-shimmer rounded" />
              <div className="h-3.5 w-full premium-shimmer rounded" />
              <div className="h-3.5 w-4/5 premium-shimmer rounded" />
              <div className="h-3.5 w-5/6 premium-shimmer rounded" />
            </div>
          </div>
        </div>
      );
    }

    // 5. Calendar Grid Skeleton (Calendar)
    if (activeTab === 'calendar') {
      return (
        <div className="space-y-6">
          {/* View Header */}
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <div className="h-8 w-36 premium-shimmer rounded-lg" />
              <div className="h-4 w-48 premium-shimmer rounded" />
            </div>
            <div className="flex gap-2">
              <div className="h-8.5 w-24 premium-shimmer rounded-lg" />
              <div className="h-8 w-20 premium-shimmer rounded-lg" />
            </div>
          </div>

          {/* Calendar Grid Sheet */}
          <div className="bg-white border border-slate-200/60 rounded-xl overflow-hidden shadow-sm">
            {/* Weekday columns */}
            <div className="grid grid-cols-7 border-b border-slate-150 bg-slate-50">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <div key={d} className="py-2.5 text-center border-r border-slate-150 last:border-r-0">
                  <div className="h-4 w-8 mx-auto premium-shimmer rounded" />
                </div>
              ))}
            </div>

            {/* Calendar 7x5 cell block */}
            <div className="grid grid-cols-7 grid-rows-5 h-[500px]">
              {Array.from({ length: 35 }).map((_, idx) => (
                <div key={idx} className="p-2 border-r border-b border-slate-150 last:border-r-0 min-h-[90px] flex flex-col justify-between">
                  <div className="h-4 w-4 premium-shimmer rounded" />
                  {idx % 4 === 1 && (
                    <div className="h-5 w-full bg-brand-accent/10 border border-brand-accent/20 rounded px-1 premium-shimmer" />
                  )}
                  {idx % 7 === 3 && (
                    <div className="h-5 w-full bg-emerald-50 border border-emerald-250/20 rounded px-1 premium-shimmer" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    // 6. Folders/Files Skeleton (Documents)
    if (activeTab === 'documents') {
      return (
        <div className="space-y-8">
          {/* View Header */}
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <div className="h-8 w-44 premium-shimmer rounded-lg" />
              <div className="h-4 w-72 premium-shimmer rounded" />
            </div>
            <div className="h-8.5 w-32 premium-shimmer rounded-lg" />
          </div>

          {/* Folders grid */}
          <div className="space-y-3">
            <div className="h-4 w-28 premium-shimmer rounded" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="border border-slate-200/60 bg-white rounded-xl p-4 flex items-center space-x-3.5 shadow-sm">
                  <div className="h-10 w-10 rounded-lg premium-shimmer" />
                  <div className="space-y-1.5">
                    <div className="h-3.5 w-24 premium-shimmer rounded" />
                    <div className="h-2 w-10 premium-shimmer rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Files list table */}
          <div className="space-y-3 bg-white border border-slate-200/60 rounded-xl p-5 shadow-sm">
            <div className="h-4.5 w-32 premium-shimmer rounded" />
            <div className="border border-slate-100 rounded-lg divide-y divide-slate-100">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="h-7 w-7 rounded premium-shimmer" />
                    <div className="h-3.5 w-64 premium-shimmer rounded" />
                  </div>
                  <div className="h-3 w-16 premium-shimmer rounded" />
                  <div className="h-3 w-28 premium-shimmer rounded ml-8" />
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    // 7. Timeline / List Skeleton (Activities, Notifications)
    if (['activities', 'notifications'].includes(activeTab)) {
      return (
        <div className="space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <div className="h-8 w-40 premium-shimmer rounded-lg" />
            <div className="h-4 w-72 premium-shimmer rounded" />
          </div>

          {/* Timeline wrapper */}
          <div className="bg-white border border-slate-200/60 rounded-xl p-6 shadow-sm space-y-6">
            <div className="relative pl-6 space-y-8 before:absolute before:left-[10px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-150">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="relative space-y-2">
                  {/* Timeline node */}
                  <span className="absolute -left-[20px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-slate-200 premium-shimmer" />
                  
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="h-4 w-2/5 premium-shimmer rounded" />
                      <div className="h-3 w-3/5 premium-shimmer rounded" />
                    </div>
                    <div className="h-3 w-16 premium-shimmer rounded shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    // 8. Form Settings Skeleton (Settings, Profile)
    if (['settings', 'profile'].includes(activeTab)) {
      return (
        <div className="space-y-6">
          {/* View Header */}
          <div className="space-y-2">
            <div className="h-8 w-44 premium-shimmer rounded-lg" />
            <div className="h-4 w-80 premium-shimmer rounded" />
          </div>

          {/* Settings grid split: sidebar menu + main details panel */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
            {/* Sub menu list */}
            <div className="bg-white border border-slate-200/60 rounded-xl p-3 shadow-sm space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-9 w-full premium-shimmer rounded-lg" />
              ))}
            </div>

            {/* Form details block */}
            <div className="md:col-span-3 bg-white border border-slate-200/60 rounded-xl p-6 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <div className="h-5.5 w-32 premium-shimmer rounded" />
              </div>
              
              {/* Input rows */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-3 w-16 premium-shimmer rounded" />
                    <div className="h-9.5 w-full premium-shimmer border border-slate-150/60 rounded-lg" />
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <div className="h-3 w-16 premium-shimmer rounded" />
                <div className="h-20 w-full premium-shimmer border border-slate-150/60 rounded-lg" />
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-100">
                <div className="h-9 w-24 premium-shimmer rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Default Fallback / General Dashboard overview widgets
    return (
      <div className="space-y-6">
        {/* View Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <div className="h-8 w-56 premium-shimmer rounded-lg" />
            <div className="h-4 w-96 premium-shimmer rounded max-w-full" />
          </div>
          <div className="flex space-x-2 shrink-0">
            <div className="h-8 w-36 premium-shimmer rounded-lg" />
            <div className="h-8 w-32 premium-shimmer rounded-lg" />
          </div>
        </div>

        {/* KPI Cards Row (3 Cards fallback) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm h-28 flex flex-col justify-between">
              <div className="h-4 w-24 premium-shimmer rounded" />
              <div className="h-6 w-32 premium-shimmer rounded" />
            </div>
          ))}
        </div>

        {/* Primary widgets split */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm h-72 space-y-4">
            <div className="h-4 w-32 premium-shimmer rounded" />
            <div className="h-44 premium-shimmer rounded" />
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm h-72 space-y-4">
            <div className="h-4 w-32 premium-shimmer rounded" />
            <div className="h-44 premium-shimmer rounded" />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="relative w-full h-full min-h-[400px]">
      {/* Custom Premium Shimmer Styles */}
      <style jsx global>{`
        @keyframes shimmer-move {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
        
        .premium-shimmer {
          background: linear-gradient(
            90deg,
            #f1f5f9 25%,
            #e2e8f0 37%,
            #f1f5f9 50%
          );
          background-size: 200% 100%;
          animation: shimmer-move 1.5s infinite linear;
        }

        @keyframes pulse-slow {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.82;
            transform: scale(0.99);
          }
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 3s infinite ease-in-out;
        }

        @keyframes github-bar-view {
          0% {
            width: 0%;
            left: 0%;
          }
          50% {
            width: 60%;
            left: 20%;
          }
          100% {
            width: 100%;
            left: 100%;
          }
        }

        .glowing-bar-view {
          height: 2px;
          background: linear-gradient(90deg, #7957fb, #7e8cf1, #6ec2de, #7957fb);
          background-size: 300% 100%;
          position: fixed;
          top: 64px; /* Align right below the main Header */
          left: 0;
          right: 0;
          z-index: 40;
          animation: github-bar-view 1.8s infinite ease-in-out;
          box-shadow: 0 0 6px rgba(121, 87, 251, 0.45);
        }
      `}</style>

      {/* Glow loader bar below top navbar */}
      <div className="glowing-bar-view" />

      {/* Render the specific visual layout structure */}
      <div className="opacity-90">{renderLayout()}</div>

      {/* Overlay Branded Glassmorphism Loading Indicator */}
      <div className="absolute inset-0 flex items-center justify-center bg-slate-50/15 backdrop-blur-[1px] pointer-events-none">
        <div className="bg-white/95 border border-brand-border-purple/35 p-5 rounded-2xl shadow-xl flex items-center space-x-3.5 max-w-sm pointer-events-auto transform translate-y-3 transition-all duration-300 animate-pulse-slow">
          <div className="relative flex items-center justify-center shrink-0">
            <div className="h-8.5 w-8.5 rounded-full border-2 border-brand-accent/20 border-t-brand-accent animate-spin" />
            <Sparkles className="absolute h-4 w-4 text-brand-accent" />
          </div>
          <div>
            <h4 className="text-xs font-extrabold text-brand-heading tracking-wide">
              Loading {currentTabLabel}...
            </h4>
            <p className="text-[10px] text-slate-400 mt-0.5 font-bold">
              Fetching records from database
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
