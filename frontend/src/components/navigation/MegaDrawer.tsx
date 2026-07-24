'use client';
import React, { useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import ProductDrawer from './drawers/ProductDrawer';
import SolutionsDrawer from './drawers/SolutionsDrawer';
import PricingDrawer from './drawers/PricingDrawer';
import ResourcesDrawer from './drawers/ResourcesDrawer';

type DrawerType = 'product' | 'solutions' | 'pricing' | 'resources' | null;

interface MegaDrawerProps {
  activeDrawer: DrawerType;
  onClose: () => void;
  onOpenModal: () => void;
}

export default function MegaDrawer({ activeDrawer, onClose, onOpenModal }: MegaDrawerProps) {
  // ESC key closes drawer
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Lock body scroll when open
  useEffect(() => {
    if (activeDrawer) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [activeDrawer]);

  const isOpen = !!activeDrawer;

  const drawerLabels: Record<NonNullable<DrawerType>, string> = {
    product: 'Product',
    solutions: 'Solutions',
    pricing: 'Pricing',
    resources: 'Resources',
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 998,
          background: 'rgba(15,23,42,0.45)',
          backdropFilter: isOpen ? 'blur(3px)' : 'blur(0)',
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'all' : 'none',
          transition: 'opacity 0.25s ease, backdrop-filter 0.25s ease',
        }}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={activeDrawer ? `${drawerLabels[activeDrawer]} menu` : 'Navigation menu'}
        style={{
          position: 'fixed',
          top: 64, // navbar height
          left: 0,
          right: 0,
          zIndex: 999,
          background: '#ffffff',
          borderBottom: '1px solid #e5e7eb',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          height: isOpen ? '78vh' : 0,
          maxHeight: '78vh',
          overflow: 'hidden',
          transition: 'height 0.3s cubic-bezier(0.4,0,0.2,1)',
          borderRadius: '0 0 20px 20px',
        }}
      >
        {/* Drawer inner — only render content when open for performance */}
        {activeDrawer && (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
            {/* Top strip: active label + close */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '0 32px', height: 48, borderBottom: '1px solid #f1f5f9',
              background: '#fafafa', flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                  Pulse CRM
                </span>
                <span style={{ color: '#d1d5db', fontSize: 12 }}>›</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                  {activeDrawer ? drawerLabels[activeDrawer] : ''}
                </span>
              </div>
              <button
                onClick={onClose}
                aria-label="Close menu"
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 14px', borderRadius: 8,
                  background: 'transparent', border: '1px solid #e5e7eb',
                  color: '#6b7280', fontSize: 12, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'inherit',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#f5f3ff'; (e.currentTarget as HTMLButtonElement).style.color = '#7c3aed'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#6b7280'; }}
              >
                <X size={13} /> Close  <kbd style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', background: '#f1f5f9', padding: '1px 5px', borderRadius: 4, border: '1px solid #e5e7eb', fontFamily: 'monospace' }}>ESC</kbd>
              </button>
            </div>

            {/* Drawer content */}
            <div style={{ flex: 1, overflow: 'hidden' }}>
              {activeDrawer === 'product'    && <ProductDrawer   onClose={onClose} onOpenModal={onOpenModal} />}
              {activeDrawer === 'solutions'  && <SolutionsDrawer onClose={onClose} onOpenModal={onOpenModal} />}
              {activeDrawer === 'pricing'    && <PricingDrawer   onClose={onClose} onOpenModal={onOpenModal} />}
              {activeDrawer === 'resources'  && <ResourcesDrawer onClose={onClose} onOpenModal={onOpenModal} />}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
