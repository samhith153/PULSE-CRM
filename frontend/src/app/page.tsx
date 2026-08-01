'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';
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
import SkeletonLoader from '@/components/dashboard/SkeletonLoader';
import { Calendar, Filter, ChevronDown, Check, Settings2, Loader2, Plus } from 'lucide-react';
import { getToken, getCurrentUser, clearToken } from '@/utils/api';
import { ROLE_HOME, ROLE_TABS, Role } from '@/lib/roles';

export default function DashboardHome() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    const auth = sessionStorage.getItem('pulse-crm-auth') === 'true';
    setIsAuthenticated(auth);
    setIsAuthLoading(false);
  }, []);

  const handleLogin = (role: 'sales_rep' | 'manager' | 'admin') => {
    setIsAuthenticated(true);
    sessionStorage.setItem('pulse-crm-auth', 'true');
    setUserRole(role);
    setToken(getToken());
  };

  const handleSignOut = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('pulse-crm-auth');
    clearToken();
    setToken(null);
    localStorage.removeItem('pulse-crm-role');
    localStorage.removeItem('pulse-crm-user');
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
  // Initialise from localStorage to avoid a flash of wrong role before the API responds.
  const [userRole, setUserRole] = useState<'sales_rep' | 'manager' | 'admin'>(() => {
    const cached = localStorage.getItem('pulse-crm-role');
    if (cached === 'admin' || cached === 'manager' || cached === 'sales_rep') return cached;
    return 'sales_rep';
  });
  const [token, setToken] = useState<string | null>(() => getToken());
  const [currentUser, setCurrentUser] = useState<{ full_name: string; email: string; avatar_url: string | null; job_title: string | null } | null>(null);

  // Map backend role names -> UI role. Backend uses "sales_rep", "manager", "admin".
  const mapBackendRole = (roles: string[]): 'sales_rep' | 'manager' | 'admin' => {
    if (roles.includes('admin')) return 'admin';
    if (roles.includes('manager')) return 'manager';
    if (roles.includes('sales_rep')) return 'sales_rep';
    // Fallback: a user without a recognized role defaults to sales_rep (least privilege).
    return 'sales_rep';
  };

  // Resolve the real role from the API whenever the token changes. Each run is
  // cancelled on the next, so a stale-token response can never override the
  // logged-in user's role (e.g. signing in as manager right after an admin session).
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    getCurrentUser()
      .then((me) => {
        if (cancelled) return;
        const role = mapBackendRole(me.roles || []);
        setUserRole(role);
        setCurrentUser({ full_name: me.full_name, email: me.email, avatar_url: me.avatar_url, job_title: me.job_title });
        localStorage.setItem('pulse-crm-role', role);
      })
      .catch(() => {
        if (cancelled) return;
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  // Role-scoped navigation: never let a tab the current role cannot access win.
  const navigate = (tab: string) => {
    setActiveTab(ROLE_TABS[userRole].has(tab) ? tab : ROLE_HOME[userRole]);
  };

  // Re-sanitize the active tab whenever the resolved role changes.
  useEffect(() => {
    setActiveTab(prev => (ROLE_TABS[userRole].has(prev) ? prev : ROLE_HOME[userRole]));
  }, [userRole]);

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

  // Reset loading state when activeTab or userRole changes
  useEffect(() => {
    setIsLoading(true);
  }, [activeTab, userRole]);

  // Safety-net: auto-clear skeleton after 1.5s for views without onLoaded
  useEffect(() => {
    if (!isLoading) return;
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, [isLoading]);

  // Determine skeleton loader layout based on active tab
  const getSkeletonLayout = (tab: string) => {
    switch (tab) {
      case 'dashboard':
        return 'dashboard';
      case 'leads':
      case 'contacts':
      case 'companies':
      case 'products':
      case 'users':
      case 'audit logs':
        return 'table';
      case 'deals':
      case 'pipeline':
      case 'team pipeline':
        return 'kanban';
      case 'settings':
      case 'profile':
        return 'form';
      case 'calendar':
        return 'calendar';
      default:
        return 'list';
    }
  };

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
        setActiveTab={navigate} 
        collapsed={sidebarCollapsed} 
        setCollapsed={setSidebarCollapsed} 
        userRole={userRole}
        currentUser={currentUser}
      />

      {/* Main dashboard content container */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        
        {/* Top Navbar */}
        <Header 
          collapsed={sidebarCollapsed} 
          setCollapsed={setSidebarCollapsed} 
          onNewReportClick={() => setIsReportModalOpen(true)} 
          onTabChange={(tab) => navigate(tab)}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onSignOut={handleSignOut}
          userRole={userRole}
          currentUser={currentUser}
        />

        {/* Dashboard inner scroll view with increased whitespace */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
          <SkeletonLoader isLoading={isLoading} layout={getSkeletonLayout(activeTab)}>
            {!ROLE_TABS[userRole].has(activeTab) ? (
              userRole === 'sales_rep' ? (
                <SalesRepDashboardView onLoaded={() => setIsLoading(false)} onTabChange={navigate} timeFilter={dashboardSubTab} />
              ) : userRole === 'manager' ? (
                <ManagerDashboardView onTabChange={navigate} onLoaded={() => setIsLoading(false)} />
              ) : (
                <AdminDashboardView onLoaded={() => setIsLoading(false)} />
              )
            ) : activeTab === 'leads' ? (
              <LeadsView onLoaded={() => setIsLoading(false)} />
            ) : activeTab === 'contacts' ? (
              <ContactsView onLoaded={() => setIsLoading(false)} />
            ) : activeTab === 'companies' ? (
              <CompaniesView onLoaded={() => setIsLoading(false)} />
            ) : (activeTab === 'deals' || activeTab === 'pipeline' || activeTab === 'team pipeline') ? (
              <PipelineView onLoaded={() => setIsLoading(false)} />
            ) : activeTab === 'products' ? (
              <ProductsView onLoaded={() => setIsLoading(false)} />
            ) : activeTab === 'activities' ? (
              <ActivitiesView onLoaded={() => setIsLoading(false)} />
            ) : activeTab === 'emails' ? (
              <EmailsView onLoaded={() => setIsLoading(false)} />
            ) : activeTab === 'documents' ? (
              <DocumentsView onLoaded={() => setIsLoading(false)} />
            ) : activeTab === 'reports' ? (
              <ReportsView userRole={userRole} onLoaded={() => setIsLoading(false)} />
            ) : activeTab === 'workflows' ? (
              <WorkflowsView onLoaded={() => setIsLoading(false)} />
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
              <TeamPerformanceView userRole={userRole} />
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
              <ManagerDashboardView onTabChange={navigate} />
            ) : activeTab === 'dashboard' && userRole === 'admin' ? (
              <AdminDashboardView />
            ) : (
              <SalesRepDashboardView onLoaded={() => setIsLoading(false)} onTabChange={navigate} timeFilter={dashboardSubTab} />
            )}
          </SkeletonLoader>
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
        setActiveTab={navigate}
        userRole={userRole}
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
