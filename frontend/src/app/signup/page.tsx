'use client';

import { AuthShell } from '@/components/auth/AuthShell';
import { useState, type FormEvent } from 'react';
import { AuthDivider, AuthSubmit } from '@/components/auth/AuthShell';
import { AuthField } from '@/components/auth/AuthField';
import { GoogleButton } from '@/components/auth/GoogleButton';
import { register, setToken, getCurrentUser } from '@/utils/api';
import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';

function strengthOf(pw: string) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (pw.length === 0) return { level: 0, label: '' };
  if (score <= 1) return { level: 1, label: 'Weak' };
  if (score <= 3) return { level: 2, label: 'Medium' };
  return { level: 3, label: 'Strong' };
}

export default function SignUpPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const strength = strengthOf(password);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (name.trim().length < 2) next.name = 'Please enter your full name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim()))
      next.email = 'Enter a valid work email address.';
    if (password.length < 8) next.password = 'Password must be at least 8 characters.';
    setErrors({});
    if (Object.keys(next).length) {
      requestAnimationFrame(() => setErrors(next));
      return;
    }
    setLoading(true);
    try {
      const orgName = name.trim().split(' ').slice(-1)[0] || 'My Org';
      const result = await register(name.trim(), email.trim(), password, orgName);
      setToken(result.access_token);

      const user = await getCurrentUser();
      const primaryRole = user.roles && user.roles.length > 0 ? user.roles[0] : 'sales_rep';

      sessionStorage.setItem('pulse-crm-auth', 'true');
      localStorage.setItem('pulse-crm-role', primaryRole);
      localStorage.setItem('pulse-crm-user', user.full_name || name.trim());

      let redirectPath = '/dashboard';
      if (primaryRole === 'admin') {
        redirectPath = '/dashboard/admin';
      } else if (primaryRole === 'manager') {
        redirectPath = '/dashboard/manager';
      }

      window.location.href = redirectPath;
    } catch (err: any) {
      setLoading(false);
      setErrors({ general: err.message || 'Registration failed. Please try again.' });
    }
  }

  return (
    <AuthShell>
      <div className="fade-in-soft">
        <h1 className="rise-in text-2xl font-bold tracking-tight text-ink" style={{ animationDelay: '60ms' }}>
          Create your account
        </h1>
        <p
          className="rise-in mt-2 text-sm leading-relaxed text-muted-foreground"
          style={{ animationDelay: '120ms' }}
        >
          Start closing more deals in minutes — no credit card required.
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

        <form onSubmit={onSubmit} noValidate className="space-y-3">
          <div className="rise-in" style={{ animationDelay: '260ms' }}>
            <AuthField
              label="Full name"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={errors.name}
            />
          </div>
          <div className="rise-in" style={{ animationDelay: '300ms' }}>
            <AuthField
              label="Work email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
            />
          </div>
          <div className="rise-in" style={{ animationDelay: '340ms' }}>
            <AuthField
              label="Password"
              toggleable
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
            />
            <div className="mt-2 flex items-center gap-2 px-1">
              <div className="flex flex-1 gap-1.5">
                {[1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                      strength.level >= i ? 'bg-accent-color' : 'bg-border-default'
                    }`}
                  />
                ))}
              </div>
              <span className="w-14 text-right text-[11px] text-muted-foreground">
                {strength.label}
              </span>
            </div>
          </div>

          <div className="rise-in pt-2" style={{ animationDelay: '380ms' }}>
            <AuthSubmit loading={loading}>Create account</AuthSubmit>
          </div>
        </form>

        <p
          className="rise-in mt-5 text-center text-sm text-muted-foreground"
          style={{ animationDelay: '420ms' }}
        >
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-link hover:underline">
            Sign in
          </Link>
        </p>

        <p
          className="rise-in mt-8 text-center text-xs leading-relaxed text-muted-foreground"
          style={{ animationDelay: '460ms' }}
        >
          By continuing, you agree to Pulse&apos;s{' '}
          <a href="#" className="text-link hover:underline">
            Terms
          </a>{' '}
          and{' '}
          <a href="#" className="text-link hover:underline">
            Privacy Policy
          </a>
          .
        </p>

        <div className="flex items-center justify-center gap-1.5 text-xs text-text-secondary/80 select-none border-t border-border-default/50 pt-4 w-full">
          <ShieldCheck size={14} className="text-status-success-text" />
          <span>Secure, SSL encrypted connection</span>
        </div>
      </div>
    </AuthShell>
  );
}
