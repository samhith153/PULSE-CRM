import React from 'react';
import { cn } from '@/lib/utils';

/* ─── Input — ui.md §20 ───
 * 40px height, --radius-sm (8px), 1px --border, --surface fill,
 * md horizontal padding, 14px/400 text.
 * Focus: border -> --primary, 3px --primary-subtle outer ring.
 * Error: border -> --danger, helper text below.
 */

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Error message shown below the input */
  error?: string;
  /** Optional label above the input */
  label?: string;
  /** Left icon or element */
  leftIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, label, leftIcon, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-[13px] font-medium text-text-secondary mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full h-10 rounded-lg border bg-surface-1 text-sm text-text-primary',
              'px-3 placeholder:text-text-muted',
              'transition-all duration-150',
              'focus:outline-none focus:border-accent-color focus:ring-3 focus:ring-accent-muted',
              'disabled:bg-surface-2 disabled:text-text-disabled disabled:cursor-not-allowed',
              error
                ? 'border-status-danger-text focus:border-status-danger-text focus:ring-status-danger-bg'
                : 'border-border-default hover:border-border-strong',
              leftIcon && 'pl-9',
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-1 text-xs text-status-danger-text">{error}</p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

/* ─── Textarea — same styling as Input ─── */
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  label?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, label, id, ...props }, ref) => {
    const generatedId = React.useId();
    const textareaId = id ?? generatedId;
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-[13px] font-medium text-text-secondary mb-1.5"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            'w-full min-h-[80px] rounded-lg border bg-surface-1 text-sm text-text-primary',
            'px-3 py-2 placeholder:text-text-muted',
            'transition-all duration-150 resize-y',
            'focus:outline-none focus:border-accent-color focus:ring-3 focus:ring-accent-muted',
            'disabled:bg-surface-2 disabled:text-text-disabled disabled:cursor-not-allowed',
            error
              ? 'border-status-danger-text focus:border-status-danger-text focus:ring-status-danger-bg'
              : 'border-border-default hover:border-border-strong',
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-1 text-xs text-status-danger-text">{error}</p>
        )}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';
