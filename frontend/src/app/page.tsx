'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';
import StatCards from '@/components/dashboard/StatCards';
import Charts from '@/components/dashboard/Charts';
import Widgets from '@/components/dashboard/Widgets';
import RightPanel from '@/components/dashboard/RightPanel';
import ReportBuilderModal from '@/components/dashboard/ReportBuilderModal';
import PulseLandingPage from '@/components/auth/PulseLandingPage';
import LeadsView from '@/components/dashboard/LeadsView';
import CompaniesView from '@/components/dashboard/CompaniesView';
import ContactsView from '@/components/dashboard/ContactsView';
import PipelineView from '@/components/dashboard/PipelineView';
import DealsView from '@/components/dashboard/DealsView';
import ActivitiesView from '@/components/dashboard/ActivitiesView';
import EmailsView from '@/components/dashboard/EmailsView';
import AIInsightsView from '@/components/dashboard/AIInsightsView';
import NotificationsView from '@/components/dashboard/NotificationsView';
import ProfileView from '@/components/dashboard/ProfileView';
import SettingsView from '@/components/dashboard/SettingsView';
import ProductsView from '@/components/dashboard/ProductsView';
import DocumentsView from '@/components/dashboard/DocumentsView';
import ReportsView from '@/components/dashboard/ReportsView';
import WorkflowsView from '@/components/dashboard/WorkflowsView';
import CommandPalette from '@/components/dashboard/CommandPalette';
import AICopilotChat from '@/components/dashboard/AICopilotChat';
import DashboardCustomizer from '@/components/dashboard/DashboardCustomizer';
import ActivityHeatmap from '@/components/dashboard/ActivityHeatmap';
import CalendarView from '@/components/dashboard/CalendarView';
import ManagerDashboardView from '@/components/dashboard/ManagerDashboardView';
import ForecastView from '@/components/dashboard/ForecastView';
import TeamPerformanceView from '@/components/dashboard/TeamPerformanceView';
import AdminDashboardView from '@/components/dashboard/AdminDashboardView';
import UsersView from '@/components/dashboard/UsersView';
import RolesPermissionsView from '@/components/dashboard/RolesPermissionsView';
import IntegrationsView from '@/components/dashboard/IntegrationsView';
import AutomationView from '@/components/dashboard/AutomationView';
import AIModelsView from '@/components/dashboard/AIModelsView';
import AuditLogsView from '@/components/dashboard/AuditLogsView';
import { Settings2, Loader2 } from 'lucide-react';
import { clearToken } from '@/utils/api';

export default function DashboardHome() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    const auth = sessionStorage.getItem('pulse-crm-auth') === 'true';
    setIsAuthenticated(auth);
    setIsAuthLoading(false);
  }, []);

  const handleLogin = (role: 'representative' | 'manager' | 'admin') => {
    setIsAuthenticated(true);
    sessionStorage.setItem('pulse-crm-auth', 'true');
    setUserRole(role);
    localStorage.setItem('pulse-crm-role', role);
  };

  const handleSignOut = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('pulse-crm-auth');
    clearToken();
  };

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | string>('dashboard');
  const [userRole, setUserRole] = useState<'representative' | 'manager' | 'admin'>('representative');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  useEffect(() => {
    const savedRole = localStorage.getItem('pulse-crm-role') as any;
    if (savedRole && ['representative', 'manager', 'admin'].includes(savedRole)) {
      setUserRole(savedRole);
    }
    const savedTab = localStorage.getItem('pulse-crm-active-tab');
    if (savedTab) {
      setActiveTab(savedTab);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('pulse-crm-active-tab', activeTab);
  }, [activeTab]);

  const handleSetUserRole = (role: 'representative' | 'manager' | 'admin') => {
    setUserRole(role);
    localStorage.setItem('pulse-crm-role', role);
  };

  // Layout Customization States
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const [layoutSettings, setLayoutSettings] = useState({
    statCards: true,
    charts: true,
    heatmap: true,
    leaderboard: true,
    productivity: true,
    rightPanel: true
  });

  useEffect(() => {
    const saved = localStorage.getItem('pulse-crm-layout');
    if (saved) {
      try {
        setLayoutSettings(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse layout settings', e);
      }
    }
  }, []);

  const handleToggleLayoutSetting = (key: keyof typeof layoutSettings) => {
    const updated = { ...layoutSettings, [key]: !layoutSettings[key] };
    setLayoutSettings(updated);
    localStorage.setItem('pulse-crm-layout', JSON.stringify(updated));
  };

  // Global listener for Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  // Simulated loading state
  const [isLoading, setIsLoading] = useState(false);

  // Custom reports state
  const [recentReports, setRecentReports] = useState([
    { id: 1, title: "Sales Performance Overview", time: "Generated 2 hours ago" },
    { id: 2, title: "Pipeline Health Report", time: "Generated 1 day ago" },
    { id: 3, title: "Revenue Forecast Report", time: "Generated 2 days ago" },
    { id: 4, title: "Activity Summary", time: "Generated 3 days ago" }
  ]);

  const handleSaveReport = (newReport: { title: string; time: string }) => {
    setRecentReports([
      { id: Date.now(), ...newReport },
      ...recentReports
    ]);
  };

  const subTabs = [
    { name: 'Overview', key: 'overview' },
  ];

  if (isAuthLoading) {
    return (
      <div className="min-h-screen w-full flex bg-slate-50 antialiased">
        <div className="w-16 shrink-0 bg-white border-r border-slate-100" />
        <div className="flex-1 p-6 md:p-8 space-y-6">
          <div className="h-10 bg-slate-100 rounded-xl w-48 animate-pulse" />
          <div className="h-px bg-slate-100" />
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 lg:col-span-9 space-y-6">
              <div className="h-32 bg-slate-100 rounded-xl animate-pulse" />
              <div className="h-48 bg-slate-100 rounded-xl animate-pulse" />
            </div>
            <div className="col-span-12 lg:col-span-3 space-y-6">
              <div className="h-40 bg-slate-100 rounded-xl animate-pulse" />
              <div className="h-40 bg-slate-100 rounded-xl animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <PulseLandingPage onLogin={handleLogin} />;
  }

  return (
    <div className="flex bg-slate-50 h-screen overflow-hidden font-sans text-brand-text antialiased">
      {/* Sidebar navigation - toned down background */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        collapsed={sidebarCollapsed} 
        setCollapsed={setSidebarCollapsed} 
        userRole={userRole}
      />

      {/* Main dashboard content container */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        
        {/* Top Navbar */}
        <Header 
          collapsed={sidebarCollapsed} 
          setCollapsed={setSidebarCollapsed} 
          onNewReportClick={() => setIsReportModalOpen(true)} 
          onTabChange={(tab) => setActiveTab(tab)}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onSignOut={handleSignOut}
          userRole={userRole}
        />

        {/* Dashboard inner scroll view with increased whitespace */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
          {isLoading ? (
            <div className="space-y-6 animate-pulse">
              <div className="h-10 bg-slate-100 rounded-xl w-56" />
              <div className="grid grid-cols-12 gap-6">
                <div className="col-span-12 lg:col-span-9 space-y-6">
                  <div className="h-40 bg-slate-100 rounded-xl" />
                  <div className="h-56 bg-slate-100 rounded-xl" />
                </div>
                <div className="col-span-12 lg:col-span-3 space-y-6">
                  <div className="h-36 bg-slate-100 rounded-xl" />
                  <div className="h-36 bg-slate-100 rounded-xl" />
                </div>
              </div>
            </div>
          ) : activeTab === 'leads' ? (
            <LeadsView />
          ) : activeTab === 'contacts' ? (
            <ContactsView />
          ) : activeTab === 'companies' ? (
            <CompaniesView />
          ) : activeTab === 'deals' ? (
            <DealsView />
          ) : (activeTab === 'pipeline' || activeTab === 'team pipeline') ? (
            <PipelineView />
          ) : activeTab === 'products' ? (
            <ProductsView />
          ) : activeTab === 'activities' ? (
            <ActivitiesView />
          ) : activeTab === 'emails' ? (
            <EmailsView />
          ) : activeTab === 'documents' ? (
            <DocumentsView />
          ) : activeTab === 'reports' ? (
            <ReportsView />
          ) : activeTab === 'workflows' ? (
            <WorkflowsView />
          ) : activeTab === 'ai insights' ? (
            <AIInsightsView />
          ) : activeTab === 'settings' ? (
            <SettingsView userRole={userRole} />
          ) : activeTab === 'profile' ? (
            <ProfileView userRole={userRole} />
          ) : activeTab === 'notifications' ? (
            <NotificationsView />
          ) : activeTab === 'calendar' ? (
            <CalendarView />
          ) : activeTab === 'forecast' ? (
            <ForecastView />
          ) : activeTab === 'team performance' ? (
            <TeamPerformanceView />
          ) : activeTab === 'users' ? (
            <UsersView />
          ) : activeTab === 'roles & permissions' ? (
            <RolesPermissionsView />
          ) : activeTab === 'integrations' ? (
            <IntegrationsView />
          ) : activeTab === 'automation' ? (
            <AutomationView />
          ) : activeTab === 'ai models' ? (
            <AIModelsView />
          ) : activeTab === 'audit logs' ? (
            <AuditLogsView />
          ) : activeTab === 'dashboard' && userRole === 'manager' ? (
            <ManagerDashboardView onTabChange={setActiveTab} />
          ) : activeTab === 'dashboard' && userRole === 'admin' ? (
            <AdminDashboardView />
          ) : (
            <>
              {/* Header block with improved contrast & page title visual prominence */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h1 className="text-3xl md:text-4xl font-sans text-brand-heading tracking-tight font-bold">
                    Reports & analytics
                  </h1>
                  <p className="text-xs md:text-sm text-brand-text/75 mt-2 leading-relaxed max-w-2xl font-medium tracking-wide">
                    Track performance, analyze trends, and make data-driven decisions.
                  </p>
                </div>
              </div>

              {/* Toolbar */}
              <div className="flex items-center justify-end">
                <button 
                  onClick={() => setIsCustomizerOpen(true)}
                  className="inline-flex items-center space-x-1.5 bg-white border border-brand-border-purple/35 hover:border-brand-border-purple active:bg-slate-50 px-3.5 py-1.5 rounded-lg text-xs font-bold text-brand-text/80 transition-all duration-200 cursor-pointer shadow-sm/5"
                >
                  <Settings2 className="h-3.5 w-3.5 text-slate-400" strokeWidth={1.75} />
                  <span>Customize Layout</span>
                </button>
              </div>

              {/* KPI Stat Cards (Spans full horizontal width above grid split) */}
              {layoutSettings.statCards && (
                <StatCards timeFilter="overview" loading={isLoading} />
              )}

              {/* 12-Column Dashboard Grid Layout */}
              <div className="grid grid-cols-12 gap-6">
                
                {/* Left section (9 Columns of 12): Charts & Widgets */}
                {(layoutSettings.charts || layoutSettings.heatmap || layoutSettings.leaderboard || layoutSettings.productivity) && (
                  <div className={`col-span-12 ${layoutSettings.rightPanel ? 'lg:col-span-9' : 'col-span-12'} space-y-6`}>
                    
                    {/* Charts (Revenue, stage funnel, source donuts) */}
                    {layoutSettings.charts && (
                      <Charts loading={isLoading} empty={isEmpty} />
                    )}

                    {/* Sales Activity Heatmap */}
                    {layoutSettings.heatmap && (
                      <ActivityHeatmap />
                    )}

                    {/* Widgets (Leaderboard & Activity Logs) */}
                    {(layoutSettings.leaderboard || layoutSettings.productivity) && (
                      <Widgets 
                        loading={isLoading} 
                        showLeaderboard={layoutSettings.leaderboard}
                        showProductivity={layoutSettings.productivity}
                        onTabChange={setActiveTab}
                      />
                    )}

                  </div>
                )}

                {/* Right section (3 Columns of 12): Report Builder, Key Metrics, Recent Reports */}
                {layoutSettings.rightPanel && (
                  <div className={`col-span-12 ${(layoutSettings.charts || layoutSettings.heatmap || layoutSettings.leaderboard || layoutSettings.productivity) ? 'lg:col-span-3' : 'col-span-12'} space-y-6`}>
                    <RightPanel 
                      onNewReportClick={() => setIsReportModalOpen(true)} 
                      recentReports={recentReports}
                      loading={isLoading}
                    />
                  </div>
                )}

              </div>
            </>
          )}
        </main>
      </div>

      {/* Report builder modal dialog */}
      <ReportBuilderModal 
        isOpen={isReportModalOpen} 
        onClose={() => setIsReportModalOpen(false)} 
        onSave={handleSaveReport}
      />

      {/* Command Palette search modal */}
      <CommandPalette 
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        setActiveTab={setActiveTab}
        onNewReportClick={() => setIsReportModalOpen(true)}
      />

      {/* Floating AI Copilot Chatbot */}
      <AICopilotChat />

      {/* Dashboard Customizer Drawer */}
      <DashboardCustomizer
        isOpen={isCustomizerOpen}
        onClose={() => setIsCustomizerOpen(false)}
        settings={layoutSettings}
        onToggleSetting={handleToggleLayoutSetting}
      />
    </div>
  );
}
