import React from 'react';
import { ChevronDown } from 'lucide-react';

type CollapseToggleProps = {
  isCollapsed: boolean;
  onToggle: () => void;
};

export const CollapseToggle: React.FC<CollapseToggleProps> = ({ isCollapsed, onToggle }) => (
  <button
    onClick={onToggle}
    aria-expanded={!isCollapsed}
    title={isCollapsed ? 'Expand' : 'Collapse'}
    className={`inline-flex items-center justify-center bg-transparent border-none p-1 cursor-pointer text-gray-500 hover:text-gray-900 hover:bg-black/5 rounded transition-transform duration-200 ${
      isCollapsed ? '-rotate-90' : ''
    }`}
  >
    <ChevronDown size={14} />
  </button>
);
