'use client';

import { AuthShell } from '@/components/auth/AuthShell';
import { useState, useEffect, type FormEvent } from 'react';
import { AuthDivider, AuthSubmit } from '@/components/auth/AuthShell';
import { AuthField } from '@/components/auth/AuthField';
import { GoogleButton } from '@/components/auth/GoogleButton';
import { login, setToken, getCurrentUser } from '@/utils/api';
import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');

  // Inline Validation Helpers
  const validateEmail = (val: string) => {
    if (!val.trim()) return 'Email is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val.trim()))
      return 'Enter a valid work email address.';
    return '';
  };

  const validatePassword = (val: string) => {
    if (!val) return 'Password is required.';
    if (val.length < 8) return 'Password must be at least 8 characters.';
    return '';
  };

  // Simulated progress bar for slow auth requests
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      setProgress(5);
      setProgressMessage('Connecting to secure server...');
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          const next = prev + Math.floor(Math.random() * 12) + 6;
          if (next >= 70) {
            setProgressMessage('Loading workspace preferences...');
          } else if (next >= 35) {
            setProgressMessage('Verifying credentials...');
          }
          return Math.min(next, 90);
        });
      }, 350);
    } else {
      setProgress(0);
      setProgressMessage('');
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [loading]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const emailErr = validateEmail(email);
    const passErr = validatePassword(password);
    
    if (emailErr || passErr) {
      setErrors({
        email: emailErr,
        password: passErr
      });
      return;
    }
    
    setErrors({});
    setLoading(true);
    try {
      const result = await login(email.trim(), password);
      setToken(result.access_token);

      const user = await getCurrentUser();
      const primaryRole = user.roles && user.roles.length > 0 ? user.roles[0] : 'sales_rep';

      sessionStorage.setItem('pulse-crm-auth', 'true');
      localStorage.setItem('pulse-crm-role', primaryRole);
      if (user.full_name) localStorage.setItem('pulse-crm-user', user.full_name);

      let redirectPath = '/dashboard';
      if (primaryRole === 'admin') {
        redirectPath = '/dashboard/admin';
      } else if (primaryRole === 'manager') {
        redirectPath = '/dashboard/manager';
      }

      // Finish progress bar visual before redirecting
      setProgress(100);
      setProgressMessage('Authenticated! Redirecting...');
      setTimeout(() => {
        window.location.href = redirectPath;
      }, 400);
    } catch (err: any) {
      setLoading(false);
      setErrors({ general: err.message || 'Invalid email or password.' });
    }
  }

  return (
    <AuthShell>
      <div className="fade-in-soft">
        <h1 className="rise-in text-2xl font-bold tracking-tight text-text-primary" style={{ animationDelay: '60ms' }}>
          Welcome back
        </h1>
        <p
          className="rise-in mt-2 text-sm leading-relaxed text-text-secondary"
          style={{ animationDelay: '120ms' }}
        >
          Sign in to pick up right where you left off.
        </p>

        <div className="rise-in mt-7" style={{ animationDelay: '180ms' }}>
          <GoogleButton label="Continue with Google" />
        </div>

        <div className="rise-in" style={{ animationDelay: '220ms' }}>
          <AuthDivider />
        </div>

        {errors.general && (
          <div className="mb-3 rounded-lg bg-status-danger-bg border border-status-danger-text/25 px-4 py-2.5 text-xs font-semibold text-status-danger-text">
            {errors.general}
          </div>
        )}

        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <div className="rise-in" style={{ animationDelay: '260ms' }}>
            <AuthField
              label="Work email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) {
                  setErrors(prev => ({ ...prev, email: validateEmail(e.target.value) }));
                }
              }}
              onBlur={() => {
                setErrors(prev => ({ ...prev, email: validateEmail(email) }));
              }}
              error={errors.email}
            />
          </div>
          <div className="rise-in" style={{ animationDelay: '300ms' }}>
            <div className="mb-1.5 flex justify-end">
              <a href="#" className="text-xs font-semibold text-link hover:underline">
                Forgot password?
              </a>
            </div>
            <AuthField
              label="Password"
              toggleable
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) {
                  setErrors(prev => ({ ...prev, password: validatePassword(e.target.value) }));
                }
              }}
              onBlur={() => {
                setErrors(prev => ({ ...prev, password: validatePassword(password) }));
              }}
              error={errors.password}
            />
          </div>

          {loading && (
            <div className="space-y-1.5 pt-1">
              <div className="w-full bg-surface-2 h-1.5 rounded-full overflow-hidden relative">
                <div 
                  className="bg-accent-color h-full transition-all duration-300 ease-out rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-[10px] font-semibold text-text-secondary select-none animate-pulse">
                {progressMessage}
              </p>
            </div>
          )}

          <div className="rise-in pt-2" style={{ animationDelay: '340ms' }}>
            <AuthSubmit loading={loading}>Sign in</AuthSubmit>
          </div>
        </form>

        <p
          className="rise-in mt-5 text-center text-sm text-muted-foreground"
          style={{ animationDelay: '380ms' }}
        >
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="font-semibold text-link hover:underline">
            Sign up
          </Link>
        </p>

        <div className="flex items-center justify-center gap-1.5 text-xs text-text-secondary/80 select-none border-t border-border-default/50 pt-4 w-full">
          <ShieldCheck size={14} className="text-status-success-text" />
          <span>Secure, SSL encrypted connection</span>
        </div>
      </div>
    </AuthShell>
  );
}
