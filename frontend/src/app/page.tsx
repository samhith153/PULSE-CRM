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
import SalesRepDashboardView from '@/components/dashboard/SalesRepDashboardView';
import UsersView from '@/components/dashboard/UsersView';
import RolesPermissionsView from '@/components/dashboard/RolesPermissionsView';
import IntegrationsView from '@/components/dashboard/IntegrationsView';
import AutomationView from '@/components/dashboard/AutomationView';
import AIModelsView from '@/components/dashboard/AIModelsView';
import AuditLogsView from '@/components/dashboard/AuditLogsView';
import { Calendar, Filter, ChevronDown, Check, Settings2, Loader2, Plus } from 'lucide-react';
import { getToken, getCurrentUser, clearToken } from '@/utils/api';

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
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardSubTab, setDashboardSubTab] = useState('overview');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [reportType, setReportType] = useState('Sales Funnel');
  const [primaryMetric, setPrimaryMetric] = useState('Deal Value');
  const [groupBy, setGroupBy] = useState('Stage');
  
  // User Role State — derived from the authenticated user's real roles.
  const [userRole, setUserRole] = useState<'representative' | 'manager' | 'admin'>('manager');

  // Map backend role names -> UI role. Backend uses "sales_rep", "manager", "admin".
  const mapBackendRole = (roles: string[]): 'representative' | 'manager' | 'admin' => {
    if (roles.includes('admin')) return 'admin';
    if (roles.includes('manager')) return 'manager';
    if (roles.includes('sales_rep') || roles.includes('representative')) return 'representative';
    // Fallback: a user without a recognized role defaults to representative (least privilege).
    return 'representative';
  };

  // Resolve the real role from the API once the token is present; only fall back
  // to a stale localStorage value if /auth/me is unavailable.
  useEffect(() => {
    const token = getToken();
    if (!token) return;
    let cancelled = false;
    getCurrentUser()
      .then((me) => {
        if (cancelled) return;
        const role = mapBackendRole(me.roles || []);
        setUserRole(role);
        localStorage.setItem('pulse-crm-role', role);
      })
      .catch(() => {
        if (cancelled) return;
        const savedRole = localStorage.getItem('pulse-crm-role') as
          | 'representative'
          | 'manager'
          | 'admin'
          | null;
        if (savedRole && ['representative', 'manager', 'admin'].includes(savedRole)) {
          setUserRole(savedRole);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

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
  const [showFiltersMenu, setShowFiltersMenu] = useState(false);
  const [selectedPipelineType, setSelectedPipelineType] = useState('All');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isEmpty, setIsEmpty] = useState(false);

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
    { name: 'Sales', key: 'sales' },
    { name: 'Pipeline', key: 'pipeline' },
    { name: 'Activity', key: 'activity' },
    { name: 'Marketing', key: 'marketing' }, // will show empty state
    { name: 'Team', key: 'team' },
    { name: 'Forecasting', key: 'forecasting' },
    { name: 'Custom Reports', key: 'custom' },
  ];

  if (isAuthLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <Loader2 className="h-8 w-8 text-brand-accent animate-spin" />
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
          ) : activeTab === 'dashboard' && userRole === 'representative' ? (
            <SalesRepDashboardView />
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
                
                {/* Datepicker and Layout Customization (Tactile and premium style) */}
                <div className="flex items-center space-x-2 shrink-0 self-start md:self-auto">
                  <button className="inline-flex items-center space-x-1.5 bg-white border border-brand-border-purple/35 hover:border-brand-border-purple active:bg-slate-50 px-3.5 py-1.5 rounded-lg text-xs font-bold text-brand-text/80 transition-all duration-200 cursor-pointer shadow-sm/5">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" strokeWidth={1.75} />
                    <span className="tabular-nums">May 12 – May 18, 2025</span>
                  </button>

                  <button 
                    onClick={() => setIsCustomizerOpen(true)}
                    className="inline-flex items-center space-x-1.5 bg-white border border-brand-border-purple/35 hover:border-brand-border-purple active:bg-slate-50 px-3.5 py-1.5 rounded-lg text-xs font-bold text-brand-text/80 transition-all duration-200 cursor-pointer shadow-sm/5"
                  >
                    <Settings2 className="h-3.5 w-3.5 text-slate-400" strokeWidth={1.75} />
                    <span>Customize Layout</span>
                  </button>
                </div>
              </div>

              {/* KPI Stat Cards (Spans full horizontal width above grid split) */}
              {layoutSettings.statCards && (
                <StatCards timeFilter={dashboardSubTab} loading={isLoading} />
              )}

              {/* Stacked Dashboard Row Layout */}
              <div className="space-y-6">
                
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

                {/* Right Panel Cards (Key Metrics Summary & Recent Reports) */}
                {layoutSettings.rightPanel && (
                  <RightPanel 
                    onNewReportClick={() => setIsReportModalOpen(true)} 
                    recentReports={recentReports}
                    loading={isLoading}
                  />
                )}

              </div>
              {/* Report Builder Control Panel at the bottom of the page */}
              <div className="bg-white border border-brand-border-purple/20 rounded-xl p-5 shadow-sm/5 hover:shadow-md hover:border-brand-border-purple/40 transition-all duration-300 mt-6">
                <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2">
                  <div>
                    <h3 className="font-bold text-brand-heading text-sm">Report builder</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                      Configure template, metrics, and grouping to dynamically compile custom reports.
                    </p>
                  </div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-brand-accent/10 text-brand-accent uppercase tracking-wider">
                    Customizer
                  </span>
                </div>

                <div className="space-y-4">
                  {/* Selection Row */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {/* Report Type */}
                    <div>
                      <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1.5">
                        Report Template
                      </label>
                      <div className="relative">
                        <select
                          value={reportType}
                          onChange={(e) => setReportType(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-brand-border-purple/35 bg-white rounded-lg text-xs text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent/15 focus:border-brand-accent transition-all duration-200 cursor-pointer appearance-none pr-8 font-semibold"
                        >
                          <option value="Sales Funnel">Sales Funnel Analysis</option>
                          <option value="Lead Conversion">Lead Conversion Rate</option>
                          <option value="Activity Log">Rep Activity Metrics</option>
                          <option value="Revenue Projection">Revenue Forecast Q3</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400">
                          <ChevronDown className="h-3 w-3" strokeWidth={2} />
                        </div>
                      </div>
                    </div>

                    {/* Primary Metric */}
                    <div>
                      <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1.5">
                        Primary Metric
                      </label>
                      <div className="relative">
                        <select
                          value={primaryMetric}
                          onChange={(e) => setPrimaryMetric(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-brand-border-purple/35 bg-white rounded-lg text-xs text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent/15 focus:border-brand-accent transition-all duration-200 cursor-pointer appearance-none pr-8 font-semibold"
                        >
                          <option value="Deal Value">Deal Value (INR)</option>
                          <option value="Lead Score">AI Lead Score</option>
                          <option value="Conversion Rate">Conversion Rate (%)</option>
                          <option value="Task Count">Total Activities</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-450">
                          <ChevronDown className="h-3 w-3" strokeWidth={2} />
                        </div>
                      </div>
                    </div>

                    {/* Group By Selector */}
                    <div>
                      <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1.5">
                        Group By
                      </label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {['Stage', 'Source', 'Owner'].map((group) => {
                          const isActive = groupBy === group;
                          return (
                            <button
                              key={group}
                              type="button"
                              onClick={() => setGroupBy(group)}
                              className={`py-1.5 rounded-lg text-[10px] font-extrabold border transition-all duration-200 cursor-pointer ${
                                isActive 
                                  ? 'border-brand-accent bg-brand-accent/5 text-brand-accent shadow-sm/5' 
                                  : 'border-brand-border-purple/30 hover:border-brand-border-purple text-brand-text/75 hover:bg-slate-50'
                              }`}
                            >
                              {group}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Schema Preview & Button Row */}
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50 border border-brand-border-purple/15 rounded-xl p-3.5 mt-2">
                    <div className="flex items-center space-x-2 text-xs text-brand-text font-semibold overflow-hidden w-full sm:w-auto">
                      <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px] shrink-0">Output Schema:</span>
                      <span className="font-mono bg-white px-2.5 py-1 rounded border border-brand-border-purple/20 text-brand-accent font-bold truncate max-w-full sm:max-w-md">
                        {`${reportType.toLowerCase().replace(/\s+/g, '_')}_by_${groupBy.toLowerCase()}.csv`}
                      </span>
                    </div>
                    <button
                      onClick={() => setIsReportModalOpen(true)}
                      className="inline-flex items-center justify-center space-x-1.5 bg-brand-accent hover:bg-brand-accent-hover text-white py-2 px-5 rounded-lg text-xs font-extrabold shadow-sm/10 hover:shadow-sm hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer w-full sm:w-auto shrink-0"
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
