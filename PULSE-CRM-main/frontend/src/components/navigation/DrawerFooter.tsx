'use client';
import React from 'react';
import { ArrowRight, Shield, Zap, HeadphonesIcon } from 'lucide-react';

interface DrawerFooterProps {
  onClose: () => void;
  onOpenModal: () => void;
}

export default function DrawerFooter({ onClose, onOpenModal }: DrawerFooterProps) {
  const badges = [
    { icon: Shield, label: 'SOC 2 Secure' },
    { icon: Zap, label: '14-day free trial' },
    { icon: HeadphonesIcon, label: '24/7 support' },
  ];

  return (
    <div style={{
      borderTop: '1px solid #f1f5f9', paddingTop: 16, marginTop: 'auto',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      flexWrap: 'wrap', gap: 12,
    }}>
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        {badges.map(b => {
          const Icon = b.icon;
          return (
            <span key={b.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#6b7280' }}>
              <Icon size={13} color='#7c3aed' /> {b.label}
            </span>
          );
        })}
      </div>
      <button
        onClick={() => { onClose(); onOpenModal(); }}
        style={{
          display: 'flex', alignItems: 'center', gap: 7,
          padding: '9px 20px', borderRadius: 100,
          background: '#0f172a', color: '#fff',
          fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      >
        Get Started Free <ArrowRight size={13} />
      </button>
    </div>
  );
}
