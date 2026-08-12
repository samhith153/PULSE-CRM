'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2, CheckCircle } from 'lucide-react';
import { setToken, setRefreshToken, getCurrentUser } from '@/utils/api';

export default function GoogleCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Completing Google authentication...');

  useEffect(() => {
    const handleCallback = async () => {
      const accessToken = searchParams.get('access_token');
      const refreshToken = searchParams.get('refresh_token');
      const error = searchParams.get('error');

      if (error) {
        setStatus('error');
        setMessage(decodeURIComponent(error));
        return;
      }

      if (!accessToken || !refreshToken) {
        setStatus('error');
        setMessage('Authentication failed. Missing tokens.');
        return;
      }

      try {
        // Store tokens — matches the app's sessionStorage-based auth model
        setToken(accessToken);
        setRefreshToken(refreshToken);

        // Get user profile
        const user = await getCurrentUser();
        const primaryRole = user.roles && user.roles.length > 0 ? user.roles[0] : 'sales_rep';

        // Save auth state
        sessionStorage.setItem('pulse-crm-auth', 'true');
        localStorage.setItem('pulse-crm-role', primaryRole);
        if (user.full_name) {
          localStorage.setItem('pulse-crm-user', user.full_name);
        }

        setStatus('success');
        setMessage('Authentication successful! Redirecting to dashboard...');

        // Redirect based on role (same mapping as the login page)
        setTimeout(() => {
          if (primaryRole === 'admin') {
            router.push('/dashboard/admin');
          } else if (primaryRole === 'manager') {
            router.push('/dashboard/manager');
          } else {
            // Sales reps and other roles go to base dashboard
            router.push('/dashboard');
          }
        }, 1500);
      } catch (err: any) {
        console.error('[auth] Google callback error:', err);
        setStatus('error');
        setMessage(err.message || 'Authentication failed. Please try again.');
      }
    };

    handleCallback();
  }, [searchParams, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
      <div className="w-full max-w-md rounded-2xl border border-border-default bg-surface-1 p-8 shadow-lg">
        <div className="flex flex-col items-center space-y-4 text-center">
          {status === 'loading' && (
            <>
              <Loader2 className="h-12 w-12 animate-spin text-accent-color" />
              <h2 className="text-xl font-semibold text-text-primary">
                Authenticating...
              </h2>
              <p className="text-sm text-text-muted">{message}</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="h-12 w-12 text-status-success-text" />
              <h2 className="text-xl font-semibold text-text-primary">
                Welcome!
              </h2>
              <p className="text-sm text-text-muted">{message}</p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <span className="text-2xl">⚠️</span>
              </div>
              <h2 className="text-xl font-semibold text-destructive">
                Authentication Failed
              </h2>
              <p className="text-sm text-text-muted">{message}</p>
              <button
                onClick={() => router.push('/login')}
                className="mt-4 rounded-full bg-accent-color px-6 py-2 text-sm font-medium text-white hover:bg-accent-color/90 transition-colors"
              >
                Return to Login
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
