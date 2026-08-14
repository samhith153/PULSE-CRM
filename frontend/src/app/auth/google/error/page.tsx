'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AlertCircle, Loader2 } from 'lucide-react';

function GoogleErrorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [message, setMessage] = useState('');

  useEffect(() => {
    const errorMessage = searchParams.get('message');
    setMessage(
      errorMessage
        ? decodeURIComponent(errorMessage)
        : 'An error occurred during Google authentication.'
    );
  }, [searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border border-border-default bg-surface-1 p-8 shadow-lg">
        <div className="flex flex-col items-center space-y-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>

          <h2 className="text-2xl font-bold text-text-primary">
            Authentication Error
          </h2>

          <div className="rounded-lg bg-destructive/5 border border-destructive/20 p-4">
            <p className="text-sm text-destructive font-medium">{message}</p>
          </div>

          <div className="pt-4 space-y-2 w-full">
            <button
              onClick={() => router.push('/login')}
              className="w-full rounded-full bg-accent-color px-6 py-3 text-sm font-semibold text-white hover:bg-accent-color/90 transition-colors"
            >
              Return to Login
            </button>

            <button
              onClick={() => router.push('/')}
              className="w-full rounded-full bg-surface-2 px-6 py-3 text-sm font-medium text-text-primary hover:bg-surface-hover transition-colors"
            >
              Go to Home
            </button>
          </div>

          <div className="pt-4 text-xs text-text-muted">
            <p>If you believe this is an error, please contact your system administrator.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GoogleErrorPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-accent-color" />
      </div>
    }>
      <GoogleErrorContent />
    </Suspense>
  );
}
