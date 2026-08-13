'use client';
import React from 'react';

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  active: boolean;
  onClick: () => void;
}

export default function SidebarItem({ icon: Icon, label, active, onClick }: SidebarItemProps) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 14px', borderRadius: 10, width: '100%',
        border: 'none', cursor: 'pointer', textAlign: 'left',
        background: active ? '#2563EB' : 'transparent',
        transition: 'all 0.15s ease', fontFamily: 'inherit',
      }}
      onMouseEnter={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = '#EFF6FF'; }}
      onMouseLeave={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
    >
      <div style={{
        height: 32, width: 32, borderRadius: 8, flexShrink: 0,
        background: active ? 'rgba(255,255,255,0.2)' : '#EFF6FF',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={16} color={active ? '#fff' : '#2563EB'} strokeWidth={1.8} />
      </div>
      <span style={{ fontSize: 13.5, fontWeight: active ? 700 : 500, color: active ? '#fff' : '#374151' }}>{label}</span>
    </button>
  );
}
