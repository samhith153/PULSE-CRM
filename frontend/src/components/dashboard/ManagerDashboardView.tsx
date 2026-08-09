'use client';

import React from 'react';
import HomeView from './HomeView';

interface ManagerDashboardViewProps {
  onTabChange?: (tab: string) => void;
}

export default function ManagerDashboardView({ onTabChange }: ManagerDashboardViewProps) {
  return <HomeView onTabChange={onTabChange || (() => {})} />;
}
