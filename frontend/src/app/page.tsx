'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import NewLandingPage from '@/components/landing/NewLandingPage';

/**
 * Landing entry. Unauthenticated visitors see the marketing landing page;
 * signed-in users (or visitors arriving with landing-page auth params) are
 * routed to /dashboard, where the app provider completes the auth handoff.
 *
 * The legacy tab-switching dashboard that previously lived here was removed —
 * /dashboard/* is the only dashboard.
 */
export default function Home() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const authFromLanding = params.get('auth') === 'true';
    const isAuthenticated = sessionStorage.getItem('pulse-crm-auth') === 'true';

    if (isAuthenticated || authFromLanding) {
      // Keep the query string so /dashboard can finish the token handoff.
      const query = authFromLanding ? window.location.search : '';
      router.replace(`/dashboard${query}`);
      return;
    }
    setReady(true);
  }, [router]);

  if (!ready) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 text-brand animate-spin" />
      </div>
    );
  }

  return (
    <NewLandingPage
      onLogin={(role) => {
        const mappedRole = role === 'representative' ? 'sales_rep' : role;
        sessionStorage.setItem('pulse-crm-auth', 'true');
        localStorage.setItem('pulse-crm-role', mappedRole);
        router.push('/dashboard');
      }}
    />
  );
}
