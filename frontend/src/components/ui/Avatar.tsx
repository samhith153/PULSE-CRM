'use client';

import { useState } from 'react';
import { mediaUrl } from '@/utils/api';

interface AvatarProps {
  /** Full name used to derive initials when no photo is present. */
  name: string;
  /** Stored avatar path or absolute URL; empty -> initials circle. */
  src?: string | null;
  /** Diameter in Tailwind-compatible px size (rendered as h-/w- classes). */
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZES: Record<NonNullable<AvatarProps['size']>, string> = {
  xs: 'h-5 w-5 text-[9px]',
  sm: 'h-7 w-7 text-[11px]',
  md: 'h-9 w-9 text-xs',
  lg: 'h-20 w-20 text-2xl',
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function Avatar({ name, src, size = 'sm', className = '' }: AvatarProps) {
  const [broken, setBroken] = useState(false);
  const url = src ? mediaUrl(src) : '';
  const showImage = url && !broken;

  return (
    <div
      className={`shrink-0 rounded-full overflow-hidden border border-black/10 dark:border-white/10 bg-brand-accent/10 flex items-center justify-center font-bold text-brand-accent select-none ${SIZES[size]} ${className}`}
      title={name}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={name}
          className="h-full w-full object-cover"
          onError={() => setBroken(true)}
        />
      ) : (
        <span>{initials(name)}</span>
      )}
    </div>
  );
}
