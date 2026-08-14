'use client';

import { AuthShell } from '@/components/auth/AuthShell';
import { useState, type FormEvent } from 'react';
import { AuthDivider, AuthSubmit } from '@/components/auth/AuthShell';
import { AuthField } from '@/components/auth/AuthField';
import { GoogleButton } from '@/components/auth/GoogleButton';
import { register, setToken, getCurrentUser } from '@/utils/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const strength = strengthOf(password);

  // Inline Validation Helpers
  const validateName = (val: string) => {
    if (!val.trim()) return 'Name is required.';
    if (val.trim().length < 2) return 'Please enter your full name.';
    return '';
  };

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

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const nameErr = validateName(name);
    const emailErr = validateEmail(email);
    const passErr = validatePassword(password);
    
    if (nameErr || emailErr || passErr) {
      setErrors({
        name: nameErr,
        email: emailErr,
        password: passErr
      });
      return;
    }

    setErrors({});
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

      router.push(redirectPath);
    } catch (err: any) {
      setLoading(false);
      setErrors({ general: err.message || 'Registration failed. Please try again.' });
    }
  }

  return (
    <AuthShell>
      <div className="fade-in-soft">
        <h1 className="rise-in text-2xl font-bold tracking-tight text-white/90" style={{ animationDelay: '60ms' }}>
          Create your account
        </h1>
        <p
          className="rise-in mt-2 text-sm leading-relaxed text-white/60"
          style={{ animationDelay: '120ms' }}
        >
          Start closing more deals in minutes — no credit card required.
        </p>

        <div className="rise-in mt-6" style={{ animationDelay: '180ms' }}>
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
              label="Full name"
              autoComplete="name"
              value={name}
              placeholder="Jane Doe"
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) {
                  setErrors(prev => ({ ...prev, name: validateName(e.target.value) }));
                }
              }}
              onBlur={() => {
                setErrors(prev => ({ ...prev, name: validateName(name) }));
              }}
              error={errors.name}
            />
          </div>
          <div className="rise-in" style={{ animationDelay: '300ms' }}>
            <AuthField
              label="Work email"
              type="email"
              autoComplete="email"
              value={email}
              placeholder="you@company.com"
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
          <div className="rise-in" style={{ animationDelay: '340ms' }}>
            <AuthField
              label="Password"
              toggleable
              autoComplete="new-password"
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
            <div className="mt-2 flex items-center gap-2">
              <span className="text-[11px] font-medium text-white/50">Password strength</span>
              <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden relative">
                <div
                  className={`absolute inset-0 h-full rounded-full transition-colors duration-300 ${strength.level >= 1 ? 'bg-red-400' : strength.level >= 2 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                  style={{ width: `${strength.level * 33.33}%` }}
                />
              </div>
              <span className="text-[11px] font-semibold ml-2 text-emerald-400">{strength.label}</span>
            </div>
          </div>

          <div className="rise-in pt-2" style={{ animationDelay: '380ms' }}>
            <AuthSubmit loading={loading}>Create account</AuthSubmit>
          </div>
        </form>

        <p
          className="rise-in mt-5 text-center text-sm text-white/50"
          style={{ animationDelay: '420ms' }}
        >
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-link hover:underline">
            Sign in
          </Link>
        </p>

        <p
          className="rise-in mt-6 text-center text-xs leading-relaxed text-white/40"
          style={{ animationDelay: '460ms' }}
        >
          By continuing, you agree to Pulse&apos;s{' '}
          <a href="#" className="text-link hover:underline font-semibold">
            Terms
          </a>{' '}
          and{' '}
          <a href="#" className="text-link hover:underline font-semibold">
            Privacy Policy
          </a>
          .
        </p>

        <div className="flex items-center justify-center gap-1.5 text-xs text-white/40 select-none border-t border-white/10 pt-4 w-full">
          <ShieldCheck size={14} className="text-status-success-text" />
          <span>Secure, SSL encrypted connection</span>
        </div>
      </div>
    </AuthShell>
  );
}
