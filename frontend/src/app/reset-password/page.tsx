'use client';

import React, { Suspense, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Lock,
  Eye,
  EyeOff,
  Mail,
  ArrowLeft,
  Send,
} from 'lucide-react';
import { resetPassword, forgotPassword } from '@/utils/api';
import { AuthShell } from '@/components/auth/AuthShell';

function passwordStrengthHint(password: string): string | null {
  if (!password) return null;
  if (password.length < 8) return 'Must be at least 8 characters';
  if (!/[A-Z]/.test(password)) return 'Must include an uppercase letter';
  if (!/[a-z]/.test(password)) return 'Must include a lowercase letter';
  if (!/\d/.test(password)) return 'Must include a number';
  if (!/[!@#$%^&*()_+\-=[\]{}|;':",.<>?/`~]/.test(password)) {
    return 'Must include a special character';
  }
  return null;
}

/* ─────────────────────────────────────────────────────────────────────
   Step 1: Request reset email
───────────────────────────────────────────────────────────────────── */
function RequestResetForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    setLoading(true);
    try {
      await forgotPassword(email.trim());
      setSent(true);
    } catch (err: any) {
      // Show success anyway to prevent email enumeration
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <div className="fade-in-soft">
        <Link
          href="/login"
          className="rise-in inline-flex items-center gap-1.5 text-xs font-semibold text-white/50 hover:text-white/80 transition-colors mb-5"
        >
          <ArrowLeft size={14} />
          Back to sign in
        </Link>

        {sent ? (
          <div className="rise-in" style={{ animationDelay: '60ms' }}>
            <div className="grid size-12 place-items-center rounded-2xl bg-[#10B981]/15 border border-[#10B981]/20 mx-auto mb-4">
              <CheckCircle2 size={22} className="text-[#10B981]" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white/90 text-center">
              Check your email
            </h1>
            <p className="mt-2 text-sm text-white/50 text-center leading-relaxed">
              If an account exists for <span className="text-white/70 font-medium">{email}</span>, we&apos;ve sent a password reset link.
            </p>
            <p className="mt-1 text-xs text-white/35 text-center">
              Didn&apos;t get it? Check your spam folder or try again.
            </p>
            <button
              type="button"
              onClick={() => { setSent(false); setEmail(''); }}
              className="rise-in mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 text-sm font-semibold text-white/70 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
            >
              Send another email
            </button>
          </div>
        ) : (
          <>
            <div className="rise-in" style={{ animationDelay: '60ms' }}>
              <div className="grid size-12 place-items-center rounded-2xl bg-accent-color/15 border border-accent-color/20 mx-auto mb-4">
                <Lock size={22} className="text-accent-color" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-white/90 text-center">
                Reset your password
              </h1>
              <p className="mt-2 text-sm text-white/50 text-center leading-relaxed">
                Enter the email address associated with your account and we&apos;ll send a reset link.
              </p>
            </div>

            {error && (
              <div className="rise-in mt-4 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-2.5 flex items-center gap-2" style={{ animationDelay: '100ms' }}>
                <AlertCircle size={14} className="text-red-400 shrink-0" />
                <span className="text-xs font-semibold text-red-400">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 mt-5">
              <div className="rise-in" style={{ animationDelay: '140ms' }}>
                <label className="block text-[11px] font-bold text-white/50 uppercase tracking-wider mb-1.5">
                  Email address
                </label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); if (error) setError(''); }}
                    placeholder="you@company.com"
                    required
                    autoComplete="email"
                    className="h-12 w-full rounded-xl border border-white/15 bg-white/5 pl-10 pr-4 text-sm text-white placeholder:text-white/30 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>
              </div>

              <div className="rise-in pt-1" style={{ animationDelay: '180ms' }}>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(37,99,235,0.3)] hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(37,99,235,0.45)] hover:from-blue-500 hover:to-indigo-500 active:translate-y-0 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300 cursor-pointer"
                >
                  {loading ? (
                    <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  ) : (
                    <Send size={16} />
                  )}
                  {loading ? 'Sending...' : 'Send reset link'}
                </button>
              </div>
            </form>
          </>
        )}

        <p className="rise-in mt-5 text-center text-sm text-white/40" style={{ animationDelay: '220ms' }}>
          Remember your password?{' '}
          <Link href="/login" className="font-semibold text-link hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   Step 2: Set new password (with token from email link)
───────────────────────────────────────────────────────────────────── */
function SetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const clientHint = useMemo(() => passwordStrengthHint(password), [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (clientHint) {
      setError(clientHint);
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(token, password);
      setSuccess(true);
    } catch (err: any) {
      setError(err?.message || 'Unable to reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AuthShell>
        <div className="fade-in-soft text-center">
          <div className="grid size-12 place-items-center rounded-2xl bg-[#10B981]/15 border border-[#10B981]/20 mx-auto mb-4">
            <CheckCircle2 size={22} className="text-[#10B981]" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white/90">
            Password updated
          </h1>
          <p className="mt-2 text-sm text-white/50 leading-relaxed">
            Your password has been reset. You can now sign in with your new password.
          </p>
          <button
            type="button"
            onClick={() => router.push('/login')}
            className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(37,99,235,0.3)] hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(37,99,235,0.45)] transition-all cursor-pointer"
          >
            Go to sign in
          </button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <div className="fade-in-soft">
        <Link
          href="/login"
          className="rise-in inline-flex items-center gap-1.5 text-xs font-semibold text-white/50 hover:text-white/80 transition-colors mb-5"
        >
          <ArrowLeft size={14} />
          Back to sign in
        </Link>

        <div className="rise-in" style={{ animationDelay: '60ms' }}>
          <div className="grid size-12 place-items-center rounded-2xl bg-accent-color/15 border border-accent-color/20 mx-auto mb-4">
            <Lock size={22} className="text-accent-color" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white/90 text-center">
            Choose a new password
          </h1>
          <p className="mt-2 text-sm text-white/50 text-center leading-relaxed">
            Use at least 8 characters with upper, lower, number, and special character.
          </p>
        </div>

        {error && (
          <div className="rise-in mt-4 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-2.5 flex items-center gap-2" style={{ animationDelay: '100ms' }}>
            <AlertCircle size={14} className="text-red-400 shrink-0" />
            <span className="text-xs font-semibold text-red-400">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mt-5">
          <div className="rise-in" style={{ animationDelay: '140ms' }}>
            <label className="block text-[11px] font-bold text-white/50 uppercase tracking-wider mb-1.5">
              New password
            </label>
            <div className="relative">
              <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="new-password"
                className="h-12 w-full rounded-xl border border-white/15 bg-white/5 pl-10 pr-11 text-sm text-white placeholder:text-white/30 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {clientHint && password.length > 0 && (
              <p className="mt-1.5 text-[11px] text-[#F59E0B] font-semibold">{clientHint}</p>
            )}
          </div>

          <div className="rise-in" style={{ animationDelay: '180ms' }}>
            <label className="block text-[11px] font-bold text-white/50 uppercase tracking-wider mb-1.5">
              Confirm password
            </label>
            <div className="relative">
              <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="new-password"
                className="h-12 w-full rounded-xl border border-white/15 bg-white/5 pl-10 pr-4 text-sm text-white placeholder:text-white/30 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>
          </div>

          <div className="rise-in pt-1" style={{ animationDelay: '220ms' }}>
            <button
              type="submit"
              disabled={loading}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(37,99,235,0.3)] hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(37,99,235,0.45)] hover:from-blue-500 hover:to-indigo-500 active:translate-y-0 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300 cursor-pointer"
            >
              {loading ? (
                <>
                  <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Updating...
                </>
              ) : (
                'Reset password'
              )}
            </button>
          </div>
        </form>

        <p className="rise-in mt-5 text-center text-sm text-white/40" style={{ animationDelay: '260ms' }}>
          Remembered it?{' '}
          <Link href="/login" className="font-semibold text-link hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   Main: Decide which step to show
───────────────────────────────────────────────────────────────────── */
function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  if (token) {
    return <SetPasswordForm token={token} />;
  }

  return <RequestResetForm />;
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-white/50 text-sm">
          Loading...
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
