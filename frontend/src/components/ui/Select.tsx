import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

/* ─── Select — ui.md §20 ───
 * Same input shell as Input, with dropdown panel using --shadow-popover + --radius-md.
 */

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
  label?: string;
  /** Placeholder text when no value is selected */
  placeholder?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, label, placeholder, children, id, ...props }, ref) => {
    const selectId = id || React.useId();
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-[13px] font-medium text-text-secondary mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              'w-full h-10 rounded-lg border bg-surface-1 text-sm text-text-primary',
              'px-3 pr-9 appearance-none',
              'transition-all duration-150',
              'focus:outline-none focus:border-accent-color focus:ring-3 focus:ring-accent-muted',
              'disabled:bg-surface-2 disabled:text-text-disabled disabled:cursor-not-allowed',
              error
                ? 'border-status-danger-text focus:border-status-danger-text focus:ring-status-danger-bg'
                : 'border-border-default hover:border-border-strong',
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {children}
          </select>
          <ChevronDown
            size={16}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
          />
        </div>
        {error && (
          <p className="mt-1 text-xs text-status-danger-text">{error}</p>
        )}
      </div>
    );
  }
);
Select.displayName = 'Select';
