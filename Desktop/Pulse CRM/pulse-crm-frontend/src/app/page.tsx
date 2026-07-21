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
import UsersView from '@/components/dashboard/UsersView';
import RolesPermissionsView from '@/components/dashboard/RolesPermissionsView';
import IntegrationsView from '@/components/dashboard/IntegrationsView';
import AutomationView from '@/components/dashboard/AutomationView';
import AIModelsView from '@/components/dashboard/AIModelsView';
import AuditLogsView from '@/components/dashboard/AuditLogsView';
import { Calendar, Filter, ChevronDown, Check, Settings2, Loader2 } from 'lucide-react';

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
  };

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardSubTab, setDashboardSubTab] = useState('overview');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  
  // User Role State
  const [userRole, setUserRole] = useState<'representative' | 'manager' | 'admin'>('manager');

  useEffect(() => {
    const savedRole = localStorage.getItem('pulse-crm-role') as any;
    if (savedRole && ['representative', 'manager', 'admin'].includes(savedRole)) {
      setUserRole(savedRole);
    }
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
  
  // Simulated loading and empty states
  const [isLoading, setIsLoading] = useState(false);
  const [isEmpty, setIsEmpty] = useState(false);

  // Trigger loading skeleton on sub-tab change to demo loaders
  const handleSubTabChange = (tabKey: string) => {
    setDashboardSubTab(tabKey);
    setIsLoading(true);
    
    // Simulate empty state on Marketing tab for demo
    if (tabKey === 'marketing') {
      setIsEmpty(true);
    } else {
      setIsEmpty(false);
    }

    setTimeout(() => {
      setIsLoading(false);
    }, 450);
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
    <div className="flex bg-white h-screen overflow-hidden font-sans text-brand-text antialiased">
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
            <SettingsView />
          ) : activeTab === 'profile' ? (
            <ProfileView />
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

              {/* Sub Navigation Tabs (Tactile pills) */}
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <nav className="flex space-x-1 p-1 bg-brand-sidebar-hover/15 border border-brand-border-purple/20 rounded-xl overflow-x-auto scrollbar-none min-w-0">
                  {subTabs.map((tab) => {
                    const isActive = dashboardSubTab === tab.key;
                    return (
                      <button
                        key={tab.key}
                        onClick={() => handleSubTabChange(tab.key)}
                        className={`py-1.5 px-3.5 rounded-lg font-extrabold text-xs transition-all duration-200 whitespace-nowrap cursor-pointer ${
                          isActive 
                            ? 'bg-brand-accent text-white shadow-sm' 
                            : 'text-brand-text/75 hover:text-brand-heading hover:bg-brand-sidebar-hover/20'
                        }`}
                      >
                        {tab.name}
                      </button>
                    );
                  })}
                </nav>

                {/* Datepicker and Filters (Tactile and premium style) */}
                <div className="flex items-center space-x-2 shrink-0 self-start lg:self-center">
                  <button className="inline-flex items-center space-x-1.5 bg-white border border-brand-border-purple/35 hover:border-brand-border-purple active:bg-slate-50 px-3.5 py-1.5 rounded-lg text-xs font-bold text-brand-text/80 transition-all duration-200 cursor-pointer shadow-sm/5">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" strokeWidth={1.75} />
                    <span className="tabular-nums">May 12 – May 18, 2025</span>
                  </button>

                  <div className="relative">
                    <button 
                      onClick={() => setShowFiltersMenu(!showFiltersMenu)}
                      className="inline-flex items-center space-x-1.5 bg-white border border-brand-border-purple/35 hover:border-brand-border-purple active:bg-slate-50 px-3.5 py-1.5 rounded-lg text-xs font-bold text-brand-text/80 transition-all duration-200 cursor-pointer shadow-sm/5"
                    >
                      <Filter className="h-3.5 w-3.5 text-slate-400" strokeWidth={1.75} />
                      <span>Filters</span>
                      <ChevronDown className="h-3 w-3 text-slate-400" strokeWidth={1.75} />
                    </button>
                    
                    {showFiltersMenu && (
                      <div className="absolute right-0 mt-2 w-56 bg-white border border-brand-border-purple/35 rounded-xl shadow-xl overflow-hidden z-20 animate-in fade-in slide-in-from-top-2 duration-200 p-2.5 text-left">
                        <p className="text-[9px] font-bold text-brand-heading uppercase tracking-wider mb-2 px-2">Filter Pipeline</p>
                        <div className="space-y-0.5">
                          {['All', 'Enterprise Deals', 'Mid-Market Deals', 'Small Business Deals'].map((type) => (
                            <button
                              key={type}
                              onClick={() => {
                                setSelectedPipelineType(type);
                                setShowFiltersMenu(false);
                              }}
                              className="w-full flex items-center justify-between text-xs font-semibold text-brand-text/80 hover:bg-slate-50 px-2 py-1.5 rounded-lg text-left"
                            >
                              <span>{type}</span>
                              {selectedPipelineType === type && <Check className="h-3.5 w-3.5 text-brand-accent" strokeWidth={2} />}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

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
