'use client';

import { useEffect, useState } from 'react';
import { getCurrentUser } from '@/utils/api';
import { toast } from '@/lib/toast';

export interface CurrentUserProfile {
  id: string;
  email: string;
  full_name: string;
  organization_id: string;
  roles: string[];
  permissions: string[];
  is_verified: boolean;
  avatar_url?: string | null;
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrator',
  manager: 'Sales Manager',
  sales_rep: 'Sales Representative',
};

/** Human-readable label for the user's primary role. */
export function roleLabel(user: CurrentUserProfile | null): string {
  const primary = user?.roles?.[0];
  if (!primary) return 'Member';
  return ROLE_LABELS[primary] || primary.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

/** Initials fallback used when a user has no avatar image. */
export function userInitials(fullName?: string | null): string {
  const parts = (fullName || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Loads the authenticated user from /api/v1/auth/me.
 *
 * Shared by the header and sidebar so the shell always shows the real signed-in
 * identity instead of role-keyed placeholder data.
 */
export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    getCurrentUser({ silent: true })
      .then((me) => setUser(me as CurrentUserProfile))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let cancelled = false;
    const run = () => {
      getCurrentUser({ silent: true })
        .then((me) => {
          if (!cancelled) setUser(me as CurrentUserProfile ?? null);
        })
        .catch(() => {
          // Don't redirect here — DashboardShell's own auth guard handles
          // the redirect. Just clear the user so the header shows a fallback.
          if (!cancelled) setUser(null);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    };
    run();

    const handleProfileUpdated = () => run();
    window.addEventListener('pulse-profile-updated', handleProfileUpdated);

    return () => {
      cancelled = true;
      window.removeEventListener('pulse-profile-updated', handleProfileUpdated);
    };
  }, []);

  /** Re-pull the profile (e.g. after uploading an avatar). */
  const refresh = () => load();

  return { user, loading, refresh };
}
