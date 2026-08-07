'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import SalesRepDashboardView from '@/components/dashboard/SalesRepDashboardView';
import HomeView from '@/components/dashboard/HomeView';
import TasksView from '@/components/dashboard/TasksView';
import UsersView from '@/components/dashboard/UsersView';
import RolesPermissionsView from '@/components/dashboard/RolesPermissionsView';
import IntegrationsView from '@/components/dashboard/IntegrationsView';
import AutomationView from '@/components/dashboard/AutomationView';
import AIModelsView from '@/components/dashboard/AIModelsView';
import AuditLogsView from '@/components/dashboard/AuditLogsView';
import { Calendar, ChevronDown, Settings2, Loader2, Plus } from 'lucide-react';
import { clearToken } from '@/utils/api';
import NewLandingPage from '@/components/landing/NewLandingPage';
import PageTransition from '@/components/shared/PageTransition';
import { AnimatePresence } from 'framer-motion';

export default function DashboardHome() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [userRole, setUserRole] = useState<'representative' | 'manager' | 'admin'>('manager');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const authFromLanding = params.get('auth') === 'true';
    const roleParam = params.get('role');
    const emailParam = params.get('email');
    const validRoles = ['representative', 'manager', 'admin', 'sales_rep'] as const;

    if (authFromLanding && roleParam && validRoles.includes(roleParam as typeof validRoles[number])) {
      sessionStorage.setItem('pulse-crm-auth', 'true');
      const mappedRole = roleParam === 'sales_rep' ? 'representative' : roleParam;
      localStorage.setItem('pulse-crm-role', mappedRole);
      if (emailParam) localStorage.setItem('pulse-crm-user', emailParam);
      setIsAuthenticated(true);
      setUserRole(mappedRole as 'representative' | 'manager' | 'admin');
      window.history.replaceState({}, '', window.location.pathname);
      setIsAuthLoading(false);
      return;
    }

    const auth = sessionStorage.getItem('pulse-crm-auth') === 'true';

    if (!auth) {
      setIsAuthenticated(false);
      setIsAuthLoading(false);
      return;
    }

    setIsAuthenticated(true);
    let savedRole = localStorage.getItem('pulse-crm-role');
    if (savedRole === 'sales_rep') {
      savedRole = 'representative';
      localStorage.setItem('pulse-crm-role', 'representative');
    }
    const legacyRoles = ['representative', 'manager', 'admin'] as const;
    if (savedRole && legacyRoles.includes(savedRole as typeof legacyRoles[number])) {
      setUserRole(savedRole as 'representative' | 'manager' | 'admin');
    }
    setIsAuthLoading(false);
  }, [router]);

  const handleLogin = (role: string) => {
    const mappedRole = role === 'sales_rep' ? 'representative' : role;
    setIsAuthenticated(true);
    setUserRole(mappedRole as 'representative' | 'manager' | 'admin');
  };

  const handleSignOut = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('pulse-crm-auth');
    clearToken();
  };

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [dashboardSubTab, setDashboardSubTab] = useState('overview');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [reportType, setReportType] = useState('Sales Funnel');
  const [primaryMetric, setPrimaryMetric] = useState('Deal Value');
  const [groupBy, setGroupBy] = useState('Stage');

  const [showFiltersMenu, setShowFiltersMenu] = useState(false);
  const [selectedPipelineType, setSelectedPipelineType] = useState('All');
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const [layoutSettings, setLayoutSettings] = useState({
    statCards: true,
    charts: true,
    heatmap: true,
    leaderboard: true,
    productivity: true,
    rightPanel: true,
    quotaPace: true,
    funnelChart: true,
  });

  useEffect(() => {
    const saved = localStorage.getItem('pulse-crm-layout');
    if (saved) {
      try {
        setLayoutSettings(prev => ({ ...prev, ...JSON.parse(saved) }));
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
      <div className="min-h-screen w-full flex items-center justify-center bg-surface-warm">
        <Loader2 className="h-8 w-8 text-brand-purple animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <NewLandingPage onLogin={handleLogin} />;
  }

  return (
    <div className="flex bg-background h-screen overflow-hidden font-sans text-foreground antialiased">
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
          <AnimatePresence mode="wait">
            <PageTransition key={activeTab}>
              {activeTab === 'home' ? (
                userRole === 'manager' ? (
                  <ManagerDashboardView onTabChange={setActiveTab} />
                ) : userRole === 'admin' ? (
                  <AdminDashboardView />
                ) : (
                  <HomeView onTabChange={setActiveTab} />
                )
              ) : activeTab === 'leads' ? (
                <LeadsView onTabChange={setActiveTab} />
              ) : activeTab === 'contacts' ? (
                <ContactsView onTabChange={setActiveTab} />
              ) : activeTab === 'companies' ? (
                <CompaniesView />
              ) : activeTab === 'tasks' ? (
                <TasksView />
              ) : (activeTab === 'deals' || activeTab === 'pipeline' || activeTab === 'team pipeline') ? (
                <PipelineView />
              ) : activeTab === 'products' ? (
                <ProductsView />
              ) : activeTab === 'activities' ? (
                <ActivitiesView onTabChange={setActiveTab} />
              ) : activeTab === 'emails' ? (
                <EmailsView onTabChange={setActiveTab} />
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
                    
                    {/* Datepicker and Layout Customization (Tactile and premium style) */}
                    <div className="flex items-center space-x-2 shrink-0 self-start md:self-auto">
                      <button className="inline-flex items-center gap-1.5 bg-background border border-border hover:bg-secondary hover:shadow-nav hover:-translate-y-0.5 px-4 py-1.5 rounded-full text-xs font-bold text-foreground transition-all duration-200 cursor-pointer">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
                        <span className="tabular-nums">May 12 – May 18, 2025</span>
                      </button>

                      <button 
                        onClick={() => setIsCustomizerOpen(true)}
                        className="inline-flex items-center gap-1.5 bg-background border border-border hover:bg-secondary hover:shadow-nav hover:-translate-y-0.5 px-4 py-1.5 rounded-full text-xs font-bold text-foreground transition-all duration-200 cursor-pointer"
                      >
                        <Settings2 className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
                        <span>Customize Layout</span>
                      </button>
                    </div>
                  </div>

                  {/* KPI Stat Cards (Spans full horizontal width above grid split) */}
                  {layoutSettings.statCards && (
                    <div className="mb-8">
                      <StatCards timeFilter={dashboardSubTab} loading={isLoading} />
                    </div>
                  )}

                  {/* Dashboard Grid Layout (Left 2/3 Main, Right 1/3 Summary Sidebar) */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    
                    {/* Main Content (Charts, Heatmap, Widgets) */}
                    <div className="lg:col-span-2 space-y-8">
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

                    {/* Sidebar Column (Right Panel Summary & Recent Reports) */}
                    <div className="space-y-8">
                      {layoutSettings.rightPanel && (
                        <RightPanel 
                          onNewReportClick={() => setIsReportModalOpen(true)} 
                          recentReports={recentReports}
                          loading={isLoading}
                        />
                      )}
                    </div>

                  </div>
                  {/* Report Builder Control Panel at the bottom of the page */}
                  <div className="bg-card border border-border rounded-2xl p-5 hover:shadow-nav hover:-translate-y-0.5 transition-all duration-300 mt-8">
                    <div className="flex items-center justify-between mb-4 border-b border-border pb-2">
                      <div>
                        <h3 className="font-bold text-foreground text-sm">Report builder</h3>
                        <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                          Configure template, metrics, and grouping to dynamically compile custom reports.
                        </p>
                      </div>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-brand-purple/10 text-brand-purple uppercase tracking-wider">
                        Customizer
                      </span>
                    </div>

                    <div className="space-y-4">
                      {/* Selection Row */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {/* Report Type */}
                        <div>
                          <label className="block text-[9px] font-extrabold text-foreground uppercase tracking-wider mb-1.5">
                            Report Template
                          </label>
                          <div className="relative">
                            <select
                              value={reportType}
                              onChange={(e) => setReportType(e.target.value)}
                              className="w-full px-2.5 py-1.5 border border-border bg-background rounded-lg text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all duration-200 cursor-pointer appearance-none pr-8 font-semibold"
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

                        {/* Primary Metric */}
                        <div>
                          <label className="block text-[9px] font-extrabold text-foreground uppercase tracking-wider mb-1.5">
                            Primary Metric
                          </label>
                          <div className="relative">
                            <select
                              value={primaryMetric}
                              onChange={(e) => setPrimaryMetric(e.target.value)}
                              className="w-full px-2.5 py-1.5 border border-border bg-background rounded-lg text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all duration-200 cursor-pointer appearance-none pr-8 font-semibold"
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

                        {/* Group By Selector */}
                        <div>
                          <label className="block text-[9px] font-extrabold text-foreground uppercase tracking-wider mb-1.5">
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
                                      ? 'border-brand-purple bg-brand-purple/5 text-brand-purple shadow-sm' 
                                      : 'border-border hover:border-muted-foreground text-muted-foreground hover:bg-secondary'
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
                      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-secondary border border-border rounded-xl p-3.5 mt-2">
                        <div className="flex items-center space-x-2 text-xs text-foreground font-semibold overflow-hidden w-full sm:w-auto">
                          <span className="text-muted-foreground font-bold uppercase tracking-wider text-[9px] shrink-0">Output Schema:</span>
                          <span className="font-mono bg-background px-2.5 py-1 rounded border border-border text-brand-purple font-bold truncate max-w-full sm:max-w-md">
                            {`${reportType.toLowerCase().replace(/\s+/g, '_')}_by_${groupBy.toLowerCase()}.csv`}
                          </span>
                        </div>
                        <button
                          onClick={() => setIsReportModalOpen(true)}
                          className="inline-flex items-center justify-center space-x-1.5 bg-ink text-background hover:-translate-y-0.5 hover:shadow-nav py-2.5 px-5 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer w-full sm:w-auto shrink-0 animate-pulse-slow"
                        >
                          <Plus className="h-4 w-4" strokeWidth={2.5} />
                          <span>Generate Custom Report</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </PageTransition>
          </AnimatePresence>
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
