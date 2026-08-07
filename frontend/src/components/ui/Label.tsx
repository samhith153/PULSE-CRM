'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, required, children, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        'text-sm font-medium text-foreground leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
        required && "after:content-['*'] after:ml-0.5 after:text-destructive",
        className
      )}
      {...props}
    >
      {children}
    </label>
  ),
);
Label.displayName = 'Label';

export default Label;
