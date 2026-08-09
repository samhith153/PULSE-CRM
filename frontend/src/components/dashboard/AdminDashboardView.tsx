'use client';

import React from 'react';
import HomeView from './HomeView';

interface AdminDashboardViewProps {
  onTabChange?: (tab: string) => void;
}

export default function AdminDashboardView({ onTabChange }: AdminDashboardViewProps) {
  return <HomeView onTabChange={onTabChange || (() => {})} />;
}
