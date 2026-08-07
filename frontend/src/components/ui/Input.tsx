'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, leftIcon, rightIcon, disabled, ...props }, ref) => {
    const inputId = React.useId();
    const hasLeftIcon = !!leftIcon;
    const hasRightIcon = !!rightIcon;
    
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label 
            htmlFor={inputId}
            className="text-sm font-medium text-foreground"
          >
            {label}
          </label>
        )}
        
        <div className={cn(
          'relative flex items-center',
          'rounded-xl border transition-all duration-200',
          error 
            ? 'border-destructive focus-within:ring-2 focus-within:ring-destructive/20' 
            : 'border-border bg-background focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20',
          disabled && 'opacity-50 cursor-not-allowed bg-secondary',
          hasLeftIcon && 'pl-3',
          hasRightIcon && 'pr-3',
        )}>
          {leftIcon && (
            <span className="absolute left-3 text-muted-foreground pointer-events-none">
              {leftIcon}
            </span>
          )}
          
          <input
            id={inputId}
            type={type}
            ref={ref}
            disabled={disabled}
            className={cn(
              'flex h-11 w-full rounded-xl bg-transparent px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground/70',
              'focus:outline-none focus:ring-0 disabled:cursor-not-allowed',
              'transition-colors duration-200',
              hasLeftIcon && 'pl-10',
              hasRightIcon && 'pr-10',
              className
            )}
            {...props}
          />
          
          {rightIcon && (
            <span className="absolute right-3 text-muted-foreground">
              {rightIcon}
            </span>
          )}
        </div>
        
        {error && (
          <p className="text-xs text-destructive font-medium">{error}</p>
        )}
      </div>
    );
  },
);
Input.displayName = 'Input';

export default Input;
