'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'vertical' | 'horizontal' | 'both';
}

const ScrollArea = React.forwardRef<HTMLDivElement, ScrollAreaProps>(
  ({ className, orientation = 'vertical', children, ...props }, ref) => {
    const overflowClasses = {
      vertical: 'overflow-y-auto overflow-x-hidden',
      horizontal: 'overflow-x-auto overflow-y-hidden',
      both: 'overflow-auto',
    };

    return (
      <div
        ref={ref}
        className={cn('relative', overflowClasses[orientation], className)}
        {...props}
      >
        {children}
        
        {/* Custom scrollbar styling via CSS */}
        <style jsx>{`
          .overflow-y-auto::-webkit-scrollbar {
            width: 6px;
          }
          .overflow-x-auto::-webkit-scrollbar {
            height: 6px;
          }
          .overflow-y-auto::-webkit-scrollbar-track,
          .overflow-x-auto::-webkit-scrollbar-track {
            background: transparent;
          }
          .overflow-y-auto::-webkit-scrollbar-thumb,
          .overflow-x-auto::-webkit-scrollbar-thumb {
            background: var(--border);
            border-radius: 3px;
          }
          .overflow-y-auto::-webkit-scrollbar-thumb:hover,
          .overflow-x-auto::-webkit-scrollbar-thumb:hover {
            background: var(--muted-foreground);
          }
        `}</style>
      </div>
    );
  },
);
ScrollArea.displayName = 'ScrollArea';

export default ScrollArea;
