import React, { createContext, useContext, useEffect, useState } from 'react';

export type LayoutSettings = {
  statCards: boolean;
  charts: boolean;
  heatmap: boolean;
  leaderboard: boolean;
  productivity: boolean;
  rightPanel: boolean;
  quotaPace: boolean;
  funnelChart: boolean;
};

type DashboardLayoutContextProps = {
  settings: LayoutSettings;
  toggleSetting: (key: keyof LayoutSettings) => void;
  resetLayout: () => void;
};

const DashboardLayoutContext = createContext<DashboardLayoutContextProps | undefined>(undefined);

export const DashboardLayoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const defaultSettings: LayoutSettings = {
    statCards: true,
    charts: true,
    heatmap: true,
    leaderboard: true,
    productivity: true,
    rightPanel: true,
    quotaPace: true,
    funnelChart: true,
  };

  const [settings, setSettings] = useState<LayoutSettings>(defaultSettings);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('pulse-crm-layout');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Partial<LayoutSettings>;
        setSettings(prev => ({ ...prev, ...parsed }));
      } catch (e) {
        console.error('Failed to parse layout settings', e);
      }
    }
  }, []);

  const toggleSetting = (key: keyof LayoutSettings) => {
    setSettings(prev => {
      const updated = { ...prev, [key]: !prev[key] };
      localStorage.setItem('pulse-crm-layout', JSON.stringify(updated));
      return updated;
    });
  };

  const resetLayout = () => {
    setSettings(defaultSettings);
    localStorage.setItem('pulse-crm-layout', JSON.stringify(defaultSettings));
  };

  return (
    <DashboardLayoutContext.Provider value={{ settings, toggleSetting, resetLayout }}>
      {children}
    </DashboardLayoutContext.Provider>
  );
};

export const useDashboardLayout = () => {
  const context = useContext(DashboardLayoutContext);
  if (!context) {
    throw new Error('useDashboardLayout must be used within DashboardLayoutProvider');
  }
  return context;
};
