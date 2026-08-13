'use client';

import React from 'react';
import { Plus, Users, Briefcase, Contact } from 'lucide-react';

interface QuickCaptureCardProps {
  onTabChange: (tab: string) => void;
}

export default function QuickCaptureCard({ onTabChange }: QuickCaptureCardProps) {
  const triggerQuickAdd = (type: 'lead' | 'deal' | 'contact') => {
    if (type === 'lead') {
      onTabChange('leads');
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('pulse-open-create-lead-modal'));
      }, 150);
    } else if (type === 'contact') {
      onTabChange('contacts');
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('pulse-open-create-contact-modal'));
      }, 150);
    } else if (type === 'deal') {
      onTabChange('deals');
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('pulse-open-create-deal-modal'));
      }, 150);
    }
  };

  return (
    <div className="bg-surface-1/95 backdrop-blur-md border border-border-default/80 dark:border-border-default/60 hover:border-primary/30 rounded-2xl p-5 shadow-sm hover:shadow-xl hover:shadow-primary/5 transition duration-300 flex flex-col justify-between h-full relative overflow-hidden group">
      {/* Background ambient radial aura pulse */}
      <div className="absolute -top-14 -right-14 w-40 h-40 rounded-full bg-primary/5 blur-3xl pointer-events-none group-hover:bg-primary/10 transition duration-500" />

      <div>
        {/* Header */}
        <div className="flex items-center space-x-3 pb-3.5 mb-3.5 border-b border-border-default/60 relative">
          <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary border border-primary/15 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
            <Plus size={18} />
          </div>
          <div>
            <h3 className="font-extrabold text-text-primary text-sm tracking-tight select-none">Quick Capture</h3>
            <p className="text-[10px] text-text-muted uppercase font-extrabold tracking-wider mt-0.5">Instant Funnel Addition</p>
          </div>
        </div>

        <p className="text-xs text-text-muted mb-4 leading-relaxed font-medium">
          Instantly add new items to your sales funnel. Select a category below to open the creation panel.
        </p>

        <div className="space-y-[var(--space-2)]">
          <button
            onClick={() => triggerQuickAdd('lead')}
            className="w-full flex items-center justify-between p-[var(--space-3)] rounded-xl border border-border-default/60 bg-surface-2/10 hover:bg-accent-color/5 hover:border-accent-color/30 text-text-primary transition cursor-pointer group animate-transition"
          >
            <div className="flex items-center space-x-2.5">
              <div className="h-8 w-8 rounded-lg bg-accent-color/10 flex items-center justify-center text-accent-color group-hover:scale-105 transition-transform">
                <Users size={16} />
              </div>
              <span className="text-xs font-bold font-sans">New Lead</span>
            </div>
            <Plus size={14} className="text-text-muted group-hover:text-accent-color transition-colors" />
          </button>

          <button
            onClick={() => triggerQuickAdd('deal')}
            className="w-full flex items-center justify-between p-[var(--space-3)] rounded-xl border border-border-default/60 bg-surface-2/10 hover:bg-accent-color/5 hover:border-accent-color/30 text-text-primary transition cursor-pointer group animate-transition"
          >
            <div className="flex items-center space-x-2.5">
              <div className="h-8 w-8 rounded-lg bg-accent-color/10 flex items-center justify-center text-accent-color group-hover:scale-105 transition-transform">
                <Briefcase size={16} />
              </div>
              <span className="text-xs font-bold font-sans">New Deal</span>
            </div>
            <Plus size={14} className="text-text-muted group-hover:text-accent-color transition-colors" />
          </button>

          <button
            onClick={() => triggerQuickAdd('contact')}
            className="w-full flex items-center justify-between p-[var(--space-3)] rounded-xl border border-border-default/60 bg-surface-2/10 hover:bg-accent-color/5 hover:border-accent-color/30 text-text-primary transition cursor-pointer group animate-transition"
          >
            <div className="flex items-center space-x-2.5">
              <div className="h-8 w-8 rounded-lg bg-accent-color/10 flex items-center justify-center text-accent-color group-hover:scale-105 transition-transform">
                <Contact size={16} />
              </div>
              <span className="text-xs font-bold font-sans">New Contact</span>
            </div>
            <Plus size={14} className="text-text-muted group-hover:text-accent-color transition-colors" />
          </button>
        </div>
      </div>
      
      <div className="text-[10px] text-text-muted text-center select-none pt-[var(--space-2)] border-t border-border-default/40 font-semibold font-sans">
        Created records sync instantly to the CRM pipeline.
      </div>
    </div>
  );
}
