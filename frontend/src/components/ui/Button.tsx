import React, { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

/* ─── Button — ui.md §19 ───
 * Variants: primary, secondary, tertiary, ghost, danger, icon
 * Sizes: sm, md, lg
 * All have: hover, active, focus, disabled, loading states
 */

type Variant = 'primary' | 'secondary' | 'tertiary' | 'ghost' | 'danger' | 'icon';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children?: ReactNode;
  /** Show loading spinner, lock width to prevent layout shift */
  loading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary: [
    'bg-accent-color text-text-on-primary',
    'hover:brightness-110 active:brightness-90',
    'shadow-sm hover:shadow-md',
    'rounded-full cursor-pointer',
  ].join(' '),
  secondary: [
    'bg-surface-1 text-text-primary border border-border-default',
    'hover:bg-surface-hover active:bg-surface-2',
    'rounded-full cursor-pointer',
  ].join(' '),
  tertiary: [
    'bg-transparent text-accent-color border-none',
    'hover:underline',
    'cursor-pointer',
  ].join(' '),
  ghost: [
    'bg-transparent text-text-secondary border-none',
    'hover:bg-surface-hover',
    'cursor-pointer',
  ].join(' '),
  danger: [
    'bg-status-danger-text text-text-on-primary',
    'hover:brightness-110 active:brightness-90',
    'rounded-full cursor-pointer',
  ].join(' '),
  icon: [
    'bg-surface-2 text-text-secondary border-none',
    'hover:bg-surface-hover hover:text-text-primary',
    'rounded-[12px] p-1 cursor-pointer',
  ].join(' '),
};

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs h-8',
  md: 'px-5 py-2 text-sm h-10',
  lg: 'px-6 py-2.5 text-base h-11',
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  loading = false,
  disabled,
  ...rest
}) => {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 font-semibold',
        'transition-all duration-150',
        'focus:outline-none focus:ring-2 focus:ring-accent-color focus:ring-offset-2',
        'disabled:opacity-40 disabled:pointer-events-none',
        variantClasses[variant],
        sizeClasses[size],
        loading && 'pointer-events-none',
        className
      )}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && (
        <svg
          className="animate-spin h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
};
