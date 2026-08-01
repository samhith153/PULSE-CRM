'use client';
import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';

interface FeatureCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  href: string;
  color?: string;
  onClick?: () => void;
}

export default function FeatureCard({ icon: Icon, title, description, href, color = '#7c3aed', onClick }: FeatureCardProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <a
      href={href}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        padding: '20px',
        borderRadius: 16,
        border: `1.5px solid ${hovered ? color + '44' : '#e5e7eb'}`,
        background: hovered ? color + '06' : '#fff',
        cursor: 'pointer',
        textDecoration: 'none',
        transition: 'all 0.18s cubic-bezier(0.4,0,0.2,1)',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: hovered ? `0 8px 24px ${color}18` : '0 1px 4px rgba(0,0,0,0.05)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Icon */}
      <div style={{
        height: 44, width: 44, borderRadius: 12,
        background: hovered ? color : color + '15',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.18s ease', flexShrink: 0,
      }}>
        <Icon size={20} color={hovered ? '#fff' : color} strokeWidth={1.8} />
      </div>

      {/* Text */}
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: '0 0 5px', letterSpacing: '-0.01em' }}>{title}</p>
        <p style={{ fontSize: 12.5, color: '#6b7280', fontWeight: 400, lineHeight: 1.5, margin: 0 }}>{description}</p>
      </div>

      {/* Arrow */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
        opacity: hovered ? 1 : 0, transition: 'opacity 0.18s ease',
      }}>
        <ArrowRight size={14} color={color} />
      </div>
    </a>
  );
}
