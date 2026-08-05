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
    <div className="bg-card border border-border rounded-2xl p-[var(--space-4)] hover:-translate-y-0.5 hover:shadow-nav transition-all duration-300 flex flex-col justify-between h-[360px]">
      <div>
        <h3 className="font-bold text-foreground text-sm flex items-center gap-1.5 pb-[var(--space-2)] border-b border-border/80 mb-[var(--space-3)] select-none">
          <Plus className="h-4.5 w-4.5 text-brand-purple" />
          <span>Quick Capture</span>
        </h3>
        <p className="text-xs text-muted-foreground mb-[var(--space-4)] leading-relaxed">
          Instantly add new items to your sales funnel. Select a category below to open the creation panel.
        </p>

        <div className="space-y-[var(--space-2)]">
          <button
            onClick={() => triggerQuickAdd('lead')}
            className="w-full flex items-center justify-between p-[var(--space-3)] rounded-xl border border-border/60 bg-secondary/10 hover:bg-brand-purple/5 hover:border-brand-purple/30 text-foreground transition-all cursor-pointer group animate-transition"
          >
            <div className="flex items-center space-x-2.5">
              <div className="h-8 w-8 rounded-lg bg-brand-purple/10 flex items-center justify-center text-brand-purple group-hover:scale-105 transition-transform">
                <Users size={16} />
              </div>
              <span className="text-xs font-bold font-sans">New Lead</span>
            </div>
            <Plus size={14} className="text-muted-foreground group-hover:text-brand-purple transition-colors" />
          </button>

          <button
            onClick={() => triggerQuickAdd('deal')}
            className="w-full flex items-center justify-between p-[var(--space-3)] rounded-xl border border-border/60 bg-secondary/10 hover:bg-brand-blue/5 hover:border-brand-blue/30 text-foreground transition-all cursor-pointer group animate-transition"
          >
            <div className="flex items-center space-x-2.5">
              <div className="h-8 w-8 rounded-lg bg-brand-blue/10 flex items-center justify-center text-brand-blue group-hover:scale-105 transition-transform">
                <Briefcase size={16} />
              </div>
              <span className="text-xs font-bold font-sans">New Deal</span>
            </div>
            <Plus size={14} className="text-muted-foreground group-hover:text-brand-blue transition-colors" />
          </button>

          <button
            onClick={() => triggerQuickAdd('contact')}
            className="w-full flex items-center justify-between p-[var(--space-3)] rounded-xl border border-border/60 bg-secondary/10 hover:bg-brand-cyan/5 hover:border-brand-cyan/30 text-foreground transition-all cursor-pointer group animate-transition"
          >
            <div className="flex items-center space-x-2.5">
              <div className="h-8 w-8 rounded-lg bg-brand-cyan/10 flex items-center justify-center text-brand-cyan group-hover:scale-105 transition-transform">
                <Contact size={16} />
              </div>
              <span className="text-xs font-bold font-sans">New Contact</span>
            </div>
            <Plus size={14} className="text-muted-foreground group-hover:text-brand-cyan transition-colors" />
          </button>
        </div>
      </div>
      
      <div className="text-[10px] text-muted-foreground text-center select-none pt-[var(--space-2)] border-t border-border/40 font-semibold font-sans">
        Created records sync instantly to the CRM pipeline.
      </div>
    </div>
  );
}
