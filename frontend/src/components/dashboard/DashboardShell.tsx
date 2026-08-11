'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useDashboardLayout, DashboardLayoutProvider } from '@/components/dashboard/DashboardLayoutContext';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';
import ReportBuilderModal from '@/components/dashboard/ReportBuilderModal';
import CommandPalette from '@/components/dashboard/CommandPalette';
import AICopilotChat from '@/components/dashboard/AICopilotChat';
import DashboardCustomizer from '@/components/dashboard/DashboardCustomizer';
import { Calendar, ChevronDown, Settings2, Loader2, Plus } from 'lucide-react';
import { clearToken, setToken, EmailComposeTarget } from '@/utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { useDashboardOverview } from '@/hooks/use-dashboard';
import { useCrmStream } from '@/hooks/use-crm-stream';

// ── Lazy-loaded view components (code-split per tab) ──────────────────────
const HomeView = React.lazy(() => import('@/components/dashboard/HomeView'));
const LeadsView = React.lazy(() => import('@/components/dashboard/LeadsView'));
const CompaniesView = React.lazy(() => import('@/components/dashboard/CompaniesView'));
const ContactsView = React.lazy(() => import('@/components/dashboard/ContactsView'));
const PipelineView = React.lazy(() => import('@/components/dashboard/PipelineView'));
const ActivitiesView = React.lazy(() => import('@/components/dashboard/ActivitiesView'));
const EmailsView = React.lazy(() => import('@/components/dashboard/EmailsView'));
const AIInsightsView = React.lazy(() => import('@/components/dashboard/AIInsightsView'));
const NotificationsView = React.lazy(() => import('@/components/dashboard/NotificationsView'));
const ProfileView = React.lazy(() => import('@/components/dashboard/ProfileView'));
const SettingsView = React.lazy(() => import('@/components/dashboard/SettingsView'));
const ProductsView = React.lazy(() => import('@/components/dashboard/ProductsView'));
const DocumentsView = React.lazy(() => import('@/components/dashboard/DocumentsView'));
const ReportsView = React.lazy(() => import('@/components/dashboard/ReportsView'));
const ManagerReportsView = React.lazy(() => import('@/components/dashboard/ManagerReportsView'));
const AdminReportsView = React.lazy(() => import('@/components/dashboard/AdminReportsView'));
const WorkflowsView = React.lazy(() => import('@/components/dashboard/WorkflowsView'));
const ActivityHeatmap = React.lazy(() => import('@/components/dashboard/ActivityHeatmap'));
const CalendarView = React.lazy(() => import('@/components/dashboard/CalendarView'));
const ManagerDashboardView = React.lazy(() => import('@/components/dashboard/ManagerDashboardView'));
const ForecastView = React.lazy(() => import('@/components/dashboard/ForecastView'));
const TeamPerformanceView = React.lazy(() => import('@/components/dashboard/TeamPerformanceView'));
const AdminDashboardView = React.lazy(() => import('@/components/dashboard/AdminDashboardView'));
const SalesRepDashboardView = React.lazy(() => import('@/components/dashboard/SalesRepDashboardView'));
const UsersView = React.lazy(() => import('@/components/dashboard/UsersView'));
const RolesPermissionsView = React.lazy(() => import('@/components/dashboard/RolesPermissionsView'));
const IntegrationsView = React.lazy(() => import('@/components/dashboard/IntegrationsView'));
const AutomationView = React.lazy(() => import('@/components/dashboard/AutomationView'));
const AIModelsView = React.lazy(() => import('@/components/dashboard/AIModelsView'));
const AuditLogsView = React.lazy(() => import('@/components/dashboard/AuditLogsView'));
const TasksView = React.lazy(() => import('@/components/dashboard/TasksView'));
const StatCards = React.lazy(() => import('@/components/dashboard/StatCards'));
const Charts = React.lazy(() => import('@/components/dashboard/Charts'));
const QuotaPaceCard = React.lazy(() => import('@/components/dashboard/QuotaPaceCard'));
const FunnelChartCard = React.lazy(() => import('@/components/dashboard/FunnelChartCard'));
const Widgets = React.lazy(() => import('@/components/dashboard/Widgets'));
const RightPanel = React.lazy(() => import('@/components/dashboard/RightPanel'));

interface DashboardShellProps {
  requiredRole: 'sales_rep' | 'manager' | 'admin';
  defaultTab?: string;
  activityId?: string;
}

function DashboardShellContent({ requiredRole, defaultTab = 'home', activityId }: DashboardShellProps) {
  const [authorized, setAuthorized] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [dashboardSubTab, setDashboardSubTab] = useState('overview');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [reportType, setReportType] = useState('Sales Funnel');
  const [primaryMetric, setPrimaryMetric] = useState('Deal Value');
  const [groupBy, setGroupBy] = useState('Stage');
  const [isLoading, setIsLoading] = useState(true);
  const [isEmpty, setIsEmpty] = useState(false);

  const [composeTarget, setComposeTarget] = useState<EmailComposeTarget | null>(null);

  // Opens the Emails page with a one-click AI draft ready for the given recipient.
  const openEmailCompose = (target: Omit<EmailComposeTarget, 'requestId'>) => {
    if (!target.to) return;
    setComposeTarget({ ...target, requestId: Date.now() });
    setActiveTab('emails');
  };

  // ── Unified dashboard data hook (GET /api/v1/dashboard/me) ──────────────
  // Only fetch for sales_rep role — manager and admin views make their own calls.
  const dashboardOverview = useDashboardOverview();
  const dashboardData = requiredRole === 'sales_rep' ? dashboardOverview.data : null;
  const refetchDashboard = requiredRole === 'sales_rep' ? dashboardOverview.refetch : () => {};

  // ── Real-time SSE stream — invalidates dashboardData on AI events ────────
  useCrmStream({
    enabled: authorized,
    onInvalidate: refetchDashboard,
  });

  const [isFabOpen, setIsFabOpen] = useState(false);
  const fabRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (fabRef.current && !fabRef.current.contains(event.target as Node)) {
        setIsFabOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  // Layout Customization States
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const { settings: layoutSettings, toggleSetting, resetLayout } = useDashboardLayout();

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
      window.location.href = '/login';
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

// The DashboardLayoutContext now handles persistence.
// No localStorage sync needed here.

  const handleToggleLayoutSetting = (key: keyof typeof layoutSettings) => {
    toggleSetting(key);
  };

  // Global listener for Ctrl+K (with input/textarea focus guard)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        const tag = (e.target as HTMLElement)?.tagName;
        const isEditable = (e.target as HTMLElement)?.isContentEditable;
        // Don't open palette when user is typing in a form field
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || isEditable) return;
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
    window.location.href = '/login';
  };

  const legacyRole = requiredRole;

  if (!authorized) {
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
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        collapsed={sidebarCollapsed} 
        setCollapsed={setSidebarCollapsed} 
        userRole={requiredRole}
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

        {/* ui.md §6: Content padding 2xl (32px) on all sides */}
        <main className="flex-1 overflow-y-auto px-8 py-8 md:px-8 space-y-6">
          <Suspense fallback={
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-6 w-6 text-accent-color animate-spin" />
            </div>
          }>
          {activeTab === 'home' ? (
            requiredRole === 'manager' ? (
              <ManagerDashboardView onTabChange={setActiveTab} />
            ) : requiredRole === 'admin' ? (
              <AdminDashboardView />
            ) : (
              <HomeView onTabChange={setActiveTab} dashboardData={dashboardData ?? undefined} />
            )
          ) : activeTab === 'leads' ? (
            <LeadsView onTabChange={setActiveTab} onComposeEmail={openEmailCompose} />
          ) : activeTab === 'contacts' ? (
            <ContactsView onTabChange={setActiveTab} onComposeEmail={openEmailCompose} />
          ) : activeTab === 'companies' ? (
            <CompaniesView />
          ) : activeTab === 'tasks' ? (
            <TasksView />
          ) : (activeTab === 'deals' || activeTab === 'pipeline' || activeTab === 'team pipeline') ? (
            <PipelineView />
          ) : activeTab === 'products' ? (
            <ProductsView />
          ) : activeTab === 'activities' ? (
            <ActivitiesView activityId={activityId} onTabChange={setActiveTab} onComposeEmail={openEmailCompose} />
          ) : activeTab === 'emails' ? (
            <EmailsView onTabChange={setActiveTab} composeTarget={composeTarget} onComposeConsumed={() => setComposeTarget(null)} />
          ) : activeTab === 'documents' ? (
            <DocumentsView />
          ) : activeTab === 'reports' ? (
            requiredRole === 'manager' ? <ManagerReportsView /> :
            requiredRole === 'admin' ? <AdminReportsView /> :
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
          ) : activeTab === 'dashboard' ? (
            <SalesRepDashboardView onTabChange={setActiveTab} />
          ) : (
            <>
              {/* Page heading */}
              <div className="grid grid-cols-[minmax(0,1fr)] items-end gap-4 lg:flex lg:justify-between">
                <div className="min-w-0">
                  <h1 className="text-3xl font-bold tracking-tight text-text-primary md:text-[2.5rem]">
                    Reports &amp; analytics
                  </h1>
                  <p className="mt-2 text-sm text-text-muted">
                    Track performance, analyze trends, and make data-driven decisions.
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2 self-start md:self-auto">
                  <button className="inline-flex items-center gap-2 rounded-full border border-border-default bg-background px-4 py-2 text-xs font-medium text-ink transition-colors hover:bg-surface-2 cursor-pointer">
                    <Calendar size={14} className="text-text-muted" />
                    <span className="tabular-nums">May 12 – May 18, 2026</span>
                  </button>
                  <button
                    onClick={() => setIsCustomizerOpen(true)}
                    className="inline-flex items-center gap-2 rounded-full border border-border-default bg-background px-4 py-2 text-xs font-medium text-ink transition-colors hover:bg-surface-2 cursor-pointer"
                  >
                    <Settings2 size={14} className="text-text-muted" />
                    <span>Customize layout</span>
                  </button>
                </div>
              </div>

                {/* KPI Stat Cards */}
                {layoutSettings.statCards && (
                  <StatCards timeFilter={dashboardSubTab} loading={isLoading} />
                )}

                {/* New Quota Pace and Funnel Chart cards */}
                {layoutSettings.quotaPace && <QuotaPaceCard />}
                {layoutSettings.funnelChart && <FunnelChartCard />}

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
              <div className="bg-surface-1 border border-border-default rounded-2xl p-5 hover:shadow-nav transition duration-300 mt-6">
                <div className="flex items-center justify-between mb-4 border-b border-border-default pb-2">
                  <div>
                    <h3 className="font-semibold text-text-primary text-sm">Report builder</h3>
                    <p className="text-xs text-text-muted mt-0.5 leading-relaxed">
                      Configure template, metrics, and grouping to dynamically compile custom reports.
                    </p>
                  </div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-accent-color/10 text-accent-color uppercase tracking-wider">
                    Customizer
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div>
                      <label className="block text-[11px] font-semibold text-text-primary uppercase tracking-wider mb-1.5">
                        Report Template
                      </label>
                      <div className="relative">
                        <select
                          value={reportType}
                          onChange={(e) => setReportType(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-border-default bg-background rounded-lg text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-ring/30 transition duration-200 cursor-pointer appearance-none pr-8 font-medium"
                        >
                          <option value="Sales Funnel">Sales Funnel Analysis</option>
                          <option value="Lead Conversion">Lead Conversion Rate</option>
                          <option value="Activity Log">Rep Activity Metrics</option>
                          <option value="Revenue Projection">Revenue Forecast Q3</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-text-muted">
                          <ChevronDown className="h-3 w-3" strokeWidth={2} />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-text-primary uppercase tracking-wider mb-1.5">
                        Primary Metric
                      </label>
                      <div className="relative">
                        <select
                          value={primaryMetric}
                          onChange={(e) => setPrimaryMetric(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-border-default bg-background rounded-lg text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-ring/30 transition duration-200 cursor-pointer appearance-none pr-8 font-medium"
                        >
                          <option value="Deal Value">Deal Value (INR)</option>
                          <option value="Lead Score">AI Lead Score</option>
                          <option value="Conversion Rate">Conversion Rate (%)</option>
                          <option value="Task Count">Total Activities</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-text-muted">
                          <ChevronDown className="h-3 w-3" strokeWidth={2} />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-text-primary uppercase tracking-wider mb-1.5">
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
                              className={`py-1.5 rounded-lg text-xs font-semibold border transition duration-200 cursor-pointer ${
                                isActiveGroup
                                  ? 'border-accent-color bg-accent-color/10 text-accent-color'
                                  : 'border-border-default hover:border-accent-color/50 text-text-muted hover:bg-surface-2'
                              }`}
                            >
                              {group}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-surface-2 border border-border-default rounded-xl p-3.5 mt-2">
                    <div className="flex items-center gap-2 text-xs text-text-primary font-medium overflow-hidden w-full sm:w-auto">
                      <span className="text-text-muted font-semibold uppercase tracking-wider text-[11px] shrink-0">Output:</span>
                      <span className="font-mono bg-background px-2.5 py-1 rounded border border-border-default text-accent-color font-semibold truncate max-w-full sm:max-w-md">
                        {`${reportType.toLowerCase().replace(/\s+/g, '_')}_by_${groupBy.toLowerCase()}.csv`}
                      </span>
                    </div>
                    <button
                      onClick={() => setIsReportModalOpen(true)}
                      className="inline-flex items-center justify-center gap-1.5 bg-ink hover:opacity-90 text-primary-foreground py-2 px-5 rounded-full text-xs font-semibold hover:-translate-y-0.5 hover:shadow-nav active:translate-y-0 transition duration-200 cursor-pointer w-full sm:w-auto shrink-0"
                    >
                      <Plus className="h-4 w-4" strokeWidth={2.5} />
                      <span>Generate Custom Report</span>
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
          </Suspense>
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

      {/* Floating Quick Actions FAB */}
      <div className="fixed bottom-6 right-22 z-50 flex flex-col items-end" ref={fabRef}>
        <AnimatePresence>
          {isFabOpen && (
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
              className="mb-3 bg-popover border border-border-default shadow-float rounded-2xl p-2 w-48 flex flex-col gap-0.5"
            >
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest px-3 py-1.5 border-b border-border-default/60 mb-1 select-none">Quick Actions</p>
              
              <button
                onClick={() => { setIsFabOpen(false); setActiveTab('leads'); }}
                className="flex items-center gap-2.5 px-3 py-2.5 text-xs font-semibold text-text-primary hover:bg-surface-2 rounded-xl text-left cursor-pointer transition-colors"
              >
                <Plus size={14} className="text-accent-color" />
                <span>New Lead</span>
              </button>
              
              <button
                onClick={() => { setIsFabOpen(false); setActiveTab('tasks'); }}
                className="flex items-center gap-2.5 px-3 py-2.5 text-xs font-semibold text-text-primary hover:bg-surface-2 rounded-xl text-left cursor-pointer transition-colors"
              >
                <Plus size={14} className="text-accent-color" />
                <span>New Task</span>
              </button>

              <button
                onClick={() => { setIsFabOpen(false); setActiveTab('calendar'); }}
                className="flex items-center gap-2.5 px-3 py-2.5 text-xs font-semibold text-text-primary hover:bg-surface-2 rounded-xl text-left cursor-pointer transition-colors"
              >
                <Plus size={14} className="text-status-success" />
                <span>New Meeting</span>
              </button>

              <button
                onClick={() => { setIsFabOpen(false); alert('New Invoice action triggered: Invoice layout will open shortly.'); }}
                className="flex items-center gap-2.5 px-3 py-2.5 text-xs font-semibold text-text-primary hover:bg-surface-2 rounded-xl text-left cursor-pointer transition-colors"
              >
                <Plus size={14} className="text-status-warning" />
                <span>New Invoice</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => setIsFabOpen(!isFabOpen)}
          className="h-14 w-14 rounded-full bg-ink text-primary-foreground border border-border-default shadow-float flex items-center justify-center hover:scale-105 active:scale-95 transition duration-200 cursor-pointer group"
          aria-label="Quick Actions"
        >
          <Plus size={24} className={`transition-transform duration-300 ${isFabOpen ? 'rotate-45' : ''}`} />
        </button>
      </div>

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

export default function DashboardShell(props: DashboardShellProps) {
  return (
    <DashboardLayoutProvider>
      <DashboardShellContent {...props} />
    </DashboardLayoutProvider>
  );
}