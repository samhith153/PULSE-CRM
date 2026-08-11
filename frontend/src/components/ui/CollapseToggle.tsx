import React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

type CollapseToggleProps = {
  isCollapsed: boolean;
  onToggle: () => void;
};

export const CollapseToggle: React.FC<CollapseToggleProps> = ({ isCollapsed, onToggle }) => (
  <button
    onClick={onToggle}
    aria-expanded={!isCollapsed}
    title={isCollapsed ? 'Expand' : 'Collapse'}
    className={cn(
      'inline-flex items-center justify-center',
      'bg-transparent border-none p-1 cursor-pointer',
      'text-text-muted hover:text-text-primary hover:bg-surface-hover',
      'rounded-[12px] transition-transform duration-200',
      isCollapsed && '-rotate-90'
    )}
  >
    <ChevronDown size={14} />
  </button>
);
