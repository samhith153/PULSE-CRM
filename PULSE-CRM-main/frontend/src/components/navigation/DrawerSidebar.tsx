'use client';
import React from 'react';
import SidebarItem from './SidebarItem';

interface SidebarSection {
  id: string;
  label: string;
  icon: React.ElementType;
}

interface DrawerSidebarProps {
  items: SidebarSection[];
  activeId: string;
  onSelect: (id: string) => void;
  title?: string;
}

export default function DrawerSidebar({ items, activeId, onSelect, title }: DrawerSidebarProps) {
  return (
    <div style={{
      width: 240, flexShrink: 0, borderRight: '1px solid #f1f5f9',
      padding: '4px 12px 24px', display: 'flex', flexDirection: 'column', gap: 2,
      overflowY: 'auto', maxHeight: '100%',
    }}>
      {title && (
        <p style={{ fontSize: 10, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '8px 14px 10px', margin: 0 }}>
          {title}
        </p>
      )}
      {items.map(item => (
        <SidebarItem
          key={item.id}
          icon={item.icon}
          label={item.label}
          active={activeId === item.id}
          onClick={() => onSelect(item.id)}
        />
      ))}
    </div>
  );
}
