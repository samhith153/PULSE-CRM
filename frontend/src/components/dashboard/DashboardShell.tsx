'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';
import StatCards from '@/components/dashboard/StatCards';
import Charts from '@/components/dashboard/Charts';
import Widgets from '@/components/dashboard/Widgets';
import RightPanel from '@/components/dashboard/RightPanel';
import ReportBuilderModal from '@/components/dashboard/ReportBuilderModal';
import LeadsView from '@/components/dashboard/LeadsView';
import CompaniesView from '@/components/dashboard/CompaniesView';
import ContactsView from '@/components/dashboard/ContactsView';
import PipelineView from '@/components/dashboard/PipelineView';
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
import { Calendar, ChevronDown, Settings2, Loader2, Plus } from 'lucide-react';
import { clearToken, setToken } from '@/utils/api';

interface DashboardShellProps {
  requiredRole: 'sales_rep' | 'manager' | 'admin';
}

export default function DashboardShell({ requiredRole }: DashboardShellProps) {
  const [authorized, setAuthorized] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardSubTab, setDashboardSubTab] = useState('overview');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [reportType, setReportType] = useState('Sales Funnel');
  const [primaryMetric, setPrimaryMetric] = useState('Deal Value');
  const [groupBy, setGroupBy] = useState('Stage');
  const [isLoading, setIsLoading] = useState(true);
  const [isEmpty, setIsEmpty] = useState(false);

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

  // Auth & Role Protection Guard
  useEffect(() => {
    // Accept auth passed via query params from the landing page redirect.
    // The token is included because sessionStorage does NOT cross origins —
    // landing page (8081) and dashboard (3000) are separate storage scopes.
    const params = new URLSearchParams(window.location.search);
    const authParam = params.get('auth');
    const roleParam = params.get('role');
    const emailParam = params.get('email');
    const tokenParam = params.get('token');

    if (authParam === 'true' && roleParam) {
      // Store token FIRST so any subsequent API calls have it immediately
      if (tokenParam) setToken(tokenParam);
      sessionStorage.setItem('pulse-crm-auth', 'true');
      localStorage.setItem('pulse-crm-role', roleParam);
      if (emailParam) localStorage.setItem('pulse-crm-user', emailParam);
      // Clean URL — remove sensitive token from address bar
      window.history.replaceState({}, '', window.location.pathname);
    }

    const auth = sessionStorage.getItem('pulse-crm-auth') === 'true';
    const role = localStorage.getItem('pulse-crm-role');

    if (!auth) {
      // Redirect back to the landing page login, not the Next.js /login route
      window.location.href = 'http://localhost:8081/login';
      return;
    }

    // Role mismatch — redirect to the correct dashboard
    if (role !== requiredRole) {
      let correctPath = '/dashboard';
      if (role === 'admin') correctPath = '/dashboard/admin';
      else if (role === 'manager') correctPath = '/dashboard/manager';
      window.location.href = correctPath;
      return;
    }

    setAuthorized(true);
  }, [requiredRole]);

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

  const handleSubTabChange = (tabKey: string) => {
    setDashboardSubTab(tabKey);
    setIsLoading(true);
    setIsEmpty(tabKey === 'marketing');
  };

  useEffect(() => {
    if (!isLoading) return;
    const timer = setTimeout(() => setIsLoading(false), 450);
    return () => clearTimeout(timer);
  }, [isLoading]);

  // Custom reports state
  const [recentReports, setRecentReports] = useState([
    { id: 1, title: 'Sales Performance Overview', time: 'Generated 2 hours ago' },
    { id: 2, title: 'Pipeline Health Report', time: 'Generated 1 day ago' },
    { id: 3, title: 'Revenue Forecast Report', time: 'Generated 2 days ago' },
    { id: 4, title: 'Activity Summary', time: 'Generated 3 days ago' }
  ]);

  const handleSaveReport = (newReport: { title: string; time: string }) => {
    setRecentReports([
      { id: Date.now(), ...newReport },
      ...recentReports
    ]);
  };

  const handleSignOut = () => {
    sessionStorage.removeItem('pulse-crm-auth');
    localStorage.removeItem('pulse-crm-role');
    localStorage.removeItem('pulse-crm-user');
    clearToken();
    window.location.href = 'http://localhost:8081/login';
  };

  const mapRoleForLegacyComponent = (r: 'sales_rep' | 'manager' | 'admin'): 'representative' | 'manager' | 'admin' => {
    if (r === 'sales_rep') return 'representative';
    return r;
  };

  const legacyRole = mapRoleForLegacyComponent(requiredRole);

  if (!authorized) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-surface-warm">
        <Loader2 className="h-8 w-8 text-brand-purple animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex bg-surface-warm h-screen overflow-hidden font-sans antialiased">
      {/* Sidebar navigation */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        collapsed={sidebarCollapsed} 
        setCollapsed={setSidebarCollapsed} 
        userRole={legacyRole}
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
          userRole={legacyRole}
        />

        {/* Dashboard inner scroll view */}
        <main className="flex-1 overflow-y-auto px-4 py-8 md:px-6 space-y-6">
          {activeTab === 'leads' ? (
            <LeadsView />
          ) : activeTab === 'contacts' ? (
            <ContactsView />
          ) : activeTab === 'companies' ? (
            <CompaniesView />
          ) : (activeTab === 'deals' || activeTab === 'pipeline' || activeTab === 'team pipeline') ? (
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
            <SettingsView userRole={legacyRole} />
          ) : activeTab === 'profile' ? (
            <ProfileView userRole={legacyRole} />
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
          ) : activeTab === 'dashboard' && requiredRole === 'manager' ? (
            <ManagerDashboardView onTabChange={setActiveTab} />
          ) : activeTab === 'dashboard' && requiredRole === 'admin' ? (
            <AdminDashboardView />
          ) : (
            <>
              {/* Page heading */}
              <div className="grid grid-cols-[minmax(0,1fr)] items-end gap-4 lg:flex lg:justify-between">
                <div className="min-w-0">
                  <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-[2.5rem]">
                    Reports &amp; analytics
                  </h1>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Track performance, analyze trends, and make data-driven decisions.
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2 self-start md:self-auto">
                  <button className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-xs font-medium text-ink transition-colors hover:bg-secondary cursor-pointer">
                    <Calendar size={14} className="text-muted-foreground" />
                    <span className="tabular-nums">May 12 – May 18, 2026</span>
                  </button>
                  <button
                    onClick={() => setIsCustomizerOpen(true)}
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-xs font-medium text-ink transition-colors hover:bg-secondary cursor-pointer"
                  >
                    <Settings2 size={14} className="text-muted-foreground" />
                    <span>Customize layout</span>
                  </button>
                </div>
              </div>

              {/* KPI Stat Cards */}
              {layoutSettings.statCards && (
                <StatCards timeFilter={dashboardSubTab} loading={isLoading} />
              )}

              {/* Stacked Dashboard Row Layout */}
              <div className="space-y-6">
                
                {/* Charts */}
                {layoutSettings.charts && (
                  <Charts loading={isLoading} empty={isEmpty} />
                )}

                {/* Sales Activity Heatmap */}
                {layoutSettings.heatmap && (
                  <ActivityHeatmap />
                )}

                {/* Widgets */}
                {(layoutSettings.leaderboard || layoutSettings.productivity) && (
                  <Widgets 
                    loading={isLoading} 
                    showLeaderboard={layoutSettings.leaderboard}
                    showProductivity={layoutSettings.productivity}
                    onTabChange={setActiveTab}
                  />
                )}

                {/* Right Panel Cards */}
                {layoutSettings.rightPanel && (
                  <RightPanel 
                    onNewReportClick={() => setIsReportModalOpen(true)} 
                    recentReports={recentReports}
                    loading={isLoading}
                  />
                )}

              </div>
              {/* Report Builder Control Panel */}
              <div className="bg-card border border-border rounded-2xl p-5 hover:shadow-nav transition-all duration-300 mt-6">
                <div className="flex items-center justify-between mb-4 border-b border-border pb-2">
                  <div>
                    <h3 className="font-semibold text-foreground text-sm">Report builder</h3>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      Configure template, metrics, and grouping to dynamically compile custom reports.
                    </p>
                  </div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-brand-purple/10 text-brand-purple uppercase tracking-wider">
                    Customizer
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div>
                      <label className="block text-[11px] font-semibold text-foreground uppercase tracking-wider mb-1.5">
                        Report Template
                      </label>
                      <div className="relative">
                        <select
                          value={reportType}
                          onChange={(e) => setReportType(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-border bg-background rounded-lg text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 transition-all duration-200 cursor-pointer appearance-none pr-8 font-medium"
                        >
                          <option value="Sales Funnel">Sales Funnel Analysis</option>
                          <option value="Lead Conversion">Lead Conversion Rate</option>
                          <option value="Activity Log">Rep Activity Metrics</option>
                          <option value="Revenue Projection">Revenue Forecast Q3</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-muted-foreground">
                          <ChevronDown className="h-3 w-3" strokeWidth={2} />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-foreground uppercase tracking-wider mb-1.5">
                        Primary Metric
                      </label>
                      <div className="relative">
                        <select
                          value={primaryMetric}
                          onChange={(e) => setPrimaryMetric(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-border bg-background rounded-lg text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 transition-all duration-200 cursor-pointer appearance-none pr-8 font-medium"
                        >
                          <option value="Deal Value">Deal Value (INR)</option>
                          <option value="Lead Score">AI Lead Score</option>
                          <option value="Conversion Rate">Conversion Rate (%)</option>
                          <option value="Task Count">Total Activities</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-muted-foreground">
                          <ChevronDown className="h-3 w-3" strokeWidth={2} />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-foreground uppercase tracking-wider mb-1.5">
                        Group By
                      </label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {['Stage', 'Source', 'Owner'].map((group) => {
                          const isActiveGroup = groupBy === group;
                          return (
                            <button
                              key={group}
                              type="button"
                              onClick={() => setGroupBy(group)}
                              className={`py-1.5 rounded-lg text-xs font-semibold border transition-all duration-200 cursor-pointer ${
                                isActiveGroup
                                  ? 'border-brand-purple bg-brand-purple/10 text-brand-purple'
                                  : 'border-border hover:border-brand-purple/50 text-muted-foreground hover:bg-secondary'
                              }`}
                            >
                              {group}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-secondary border border-border rounded-xl p-3.5 mt-2">
                    <div className="flex items-center gap-2 text-xs text-foreground font-medium overflow-hidden w-full sm:w-auto">
                      <span className="text-muted-foreground font-semibold uppercase tracking-wider text-[11px] shrink-0">Output:</span>
                      <span className="font-mono bg-background px-2.5 py-1 rounded border border-border text-brand-purple font-semibold truncate max-w-full sm:max-w-md">
                        {`${reportType.toLowerCase().replace(/\s+/g, '_')}_by_${groupBy.toLowerCase()}.csv`}
                      </span>
                    </div>
                    <button
                      onClick={() => setIsReportModalOpen(true)}
                      className="inline-flex items-center justify-center gap-1.5 bg-ink hover:opacity-90 text-primary-foreground py-2 px-5 rounded-full text-xs font-semibold hover:-translate-y-0.5 hover:shadow-nav active:translate-y-0 transition-all duration-200 cursor-pointer w-full sm:w-auto shrink-0"
                    >
                      <Plus className="h-4 w-4" strokeWidth={2.5} />
                      <span>Generate Custom Report</span>
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      <ReportBuilderModal 
        isOpen={isReportModalOpen} 
        onClose={() => setIsReportModalOpen(false)} 
        onSave={handleSaveReport}
      />

      <CommandPalette 
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        setActiveTab={setActiveTab}
        onNewReportClick={() => setIsReportModalOpen(true)}
      />

      <AICopilotChat />

      <DashboardCustomizer
        isOpen={isCustomizerOpen}
        onClose={() => setIsCustomizerOpen(false)}
        settings={layoutSettings}
        onToggleSetting={handleToggleLayoutSetting}
      />
    </div>
  );
}
