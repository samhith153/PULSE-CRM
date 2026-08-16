'use client';

import React from 'react';
import { useDashboardApp } from '@/components/dashboard/DashboardAppContext';
import { useDashboardLayout } from '@/components/dashboard/DashboardLayoutContext';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';
import ReportBuilderModal from '@/components/dashboard/ReportBuilderModal';
import CommandPalette from '@/components/dashboard/CommandPalette';
import AICopilotChat from '@/components/dashboard/AICopilotChat';
import DashboardCustomizer from '@/components/dashboard/DashboardCustomizer';
import { Loader2 } from 'lucide-react';

/**
 * Dashboard shell — the persistent chrome around every dashboard route.
 *
 * Must be rendered inside <DashboardAppProvider> (the app/dashboard layout
 * does this automatically). All shared state (auth, role, nav, compose,
 * modals, dashboard data) lives in the provider, so it survives navigation
 * between pages; only the page content in <main> swaps.
 */
export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const app = useDashboardApp();
  const { settings: layoutSettings, toggleSetting } = useDashboardLayout();

  if (!app.authorized) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-surface-0">
        <Loader2 className="h-8 w-8 text-accent-color animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex bg-surface-0 h-screen overflow-hidden font-sans antialiased">
      {/* Sidebar navigation */}
      <Sidebar
        activeTab={app.activeTab}
        setActiveTab={app.navigateToTab}
        collapsed={app.collapsed}
        userRole={app.userRole}
      />

      {/* Main dashboard content container */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Navbar */}
        <Header
          collapsed={app.collapsed}
          setCollapsed={app.toggleCollapsed}
          onTabChange={app.navigateToTab}
          onOpenCommandPalette={app.openCommandPalette}
          onSignOut={app.signOut}
          userRole={app.userRole}
        />

        {/* ui.md §6: Content padding 2xl (32px) on all sides */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden px-8 py-8 md:px-8 space-y-6">
          {children}
        </main>
      </div>

      <ReportBuilderModal
        isOpen={app.isReportModalOpen}
        onClose={app.closeReportModal}
        onSave={app.closeReportModal}
      />

      <CommandPalette
        isOpen={app.isCommandPaletteOpen}
        onClose={app.closeCommandPalette}
        setActiveTab={app.navigateToTab}
        onNewReportClick={app.openReportModal}
      />

      <AICopilotChat />

      <DashboardCustomizer
        isOpen={app.isCustomizerOpen}
        onClose={app.closeCustomizer}
        settings={layoutSettings}
        onToggleSetting={toggleSetting}
      />
    </div>
  );
}
