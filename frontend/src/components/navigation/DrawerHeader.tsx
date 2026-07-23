'use client';
import React from 'react';
import { ArrowRight } from 'lucide-react';

interface DrawerHeaderProps {
  title: string;
  description: string;
  browseLabel: string;
  browseHref: string;
  onClose: () => void;
}

export default function DrawerHeader({ title, description, browseLabel, browseHref, onClose }: DrawerHeaderProps) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h2 style={{ fontSize: 26, fontWeight: 900, color: '#0f172a', margin: '0 0 8px', letterSpacing: '-0.03em' }}>{title}</h2>
      <p style={{ fontSize: 14, color: '#6b7280', fontWeight: 400, lineHeight: 1.6, margin: '0 0 16px', maxWidth: 480 }}>{description}</p>
      <a
        href={browseHref}
        onClick={onClose}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 7,
          padding: '9px 18px', borderRadius: 100,
          background: '#7c3aed', color: '#fff',
          fontSize: 13, fontWeight: 700, textDecoration: 'none',
          boxShadow: '0 4px 14px rgba(124,58,237,0.35)',
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#6d28d9'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#7c3aed'; }}
      >
        {browseLabel} <ArrowRight size={13} />
      </a>
    </div>
  );
}
