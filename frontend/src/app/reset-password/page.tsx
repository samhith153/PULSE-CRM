'use client';

import React, { Suspense, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react';
import { resetPassword } from '@/utils/api';

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

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const clientHint = useMemo(() => passwordStrengthHint(password), [password]);
  const missingToken = !token;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (missingToken) {
      setError('This reset link is invalid or incomplete. Request a new one from the sign-in screen.');
      return;
    }
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

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        background: 'linear-gradient(160deg, #faf5ff 0%, #f8fafc 45%, #eef2ff 100%)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          background: '#fff',
          borderRadius: 20,
          padding: '28px 32px 24px',
          boxShadow: '0 32px 80px rgba(15,23,42,0.12)',
          border: '1px solid #f1f5f9',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(124,58,237,0.27)',
            }}
          >
            <Activity size={16} color="#fff" strokeWidth={2.5} />
          </div>
          <span style={{ fontSize: 17, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em' }}>
            Pulse<span style={{ color: '#7c3aed' }}>CRM</span>
          </span>
        </div>

        {success ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div
              style={{
                padding: '14px 16px',
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: 12,
                display: 'flex',
                gap: 10,
                alignItems: 'flex-start',
              }}
            >
              <CheckCircle2 size={18} color="#16a34a" style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#166534' }}>
                  Password updated
                </p>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#15803d', lineHeight: 1.5 }}>
                  Your password has been reset. You can sign in with your new password.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => router.push('/?auth=signin')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '12px',
                background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                color: '#fff',
                fontSize: 14,
                fontWeight: 700,
                borderRadius: 12,
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'inherit',
                boxShadow: '0 6px 24px rgba(124,58,237,0.33)',
              }}
            >
              Go to sign in
            </button>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 18 }}>
              <h1
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: '#0f172a',
                  margin: 0,
                  letterSpacing: '-0.03em',
                }}
              >
                Choose a new password
              </h1>
              <p style={{ fontSize: 13, color: '#475569', margin: '4px 0 0', lineHeight: 1.5 }}>
                Use at least 8 characters with upper, lower, number, and special character.
              </p>
            </div>

            {missingToken && (
              <div
                style={{
                  padding: '10px 14px',
                  background: '#fff7ed',
                  border: '1px solid #fed7aa',
                  borderRadius: 10,
                  marginBottom: 14,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <AlertCircle size={14} color="#c2410c" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: '#9a3412', fontWeight: 600 }}>
                  Missing reset token. Open the link from your email, or request a new one.
                </span>
              </div>
            )}

            {error && (
              <div
                style={{
                  padding: '10px 14px',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: 10,
                  marginBottom: 14,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <AlertCircle size={14} color="#dc2626" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: '#991b1b', fontWeight: 600 }}>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#475569',
                    marginBottom: 4,
                  }}
                >
                  New password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock
                    size={14}
                    color="#94a3b8"
                    style={{
                      position: 'absolute',
                      left: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      pointerEvents: 'none',
                    }}
                  />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoComplete="new-password"
                    disabled={missingToken}
                    style={{
                      width: '100%',
                      padding: '10px 40px 10px 36px',
                      borderRadius: 10,
                      border: '1.5px solid #e2e8f0',
                      fontSize: 13,
                      fontFamily: 'inherit',
                      color: '#0f172a',
                      outline: 'none',
                      boxSizing: 'border-box',
                      background: missingToken ? '#f8fafc' : '#faf9ff',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    style={{
                      position: 'absolute',
                      right: 10,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      color: '#94a3b8',
                      display: 'flex',
                      padding: 2,
                    }}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {clientHint && password.length > 0 && (
                  <p style={{ margin: '6px 0 0', fontSize: 11, color: '#b45309', fontWeight: 600 }}>
                    {clientHint}
                  </p>
                )}
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#475569',
                    marginBottom: 4,
                  }}
                >
                  Confirm password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock
                    size={14}
                    color="#94a3b8"
                    style={{
                      position: 'absolute',
                      left: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      pointerEvents: 'none',
                    }}
                  />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoComplete="new-password"
                    disabled={missingToken}
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 36px',
                      borderRadius: 10,
                      border: '1.5px solid #e2e8f0',
                      fontSize: 13,
                      fontFamily: 'inherit',
                      color: '#0f172a',
                      outline: 'none',
                      boxSizing: 'border-box',
                      background: missingToken ? '#f8fafc' : '#faf9ff',
                    }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || missingToken}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '12px',
                  marginTop: 4,
                  background: loading || missingToken ? '#9b72f0' : 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 700,
                  borderRadius: 12,
                  border: 'none',
                  cursor: loading || missingToken ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                  boxShadow: '0 6px 24px rgba(124,58,237,0.33)',
                }}
              >
                {loading ? (
                  <>
                    <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
                    Updating…
                  </>
                ) : (
                  'Reset password'
                )}
              </button>
            </form>

            <p style={{ textAlign: 'center', fontSize: 12, color: '#64748b', margin: '18px 0 0' }}>
              Remembered it?{' '}
              <button
                type="button"
                onClick={() => router.push('/?auth=signin')}
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#7c3aed',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Back to sign in
              </button>
            </p>
          </>
        )}
      </div>
      <style>{`@keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }`}</style>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#64748b',
            fontSize: 14,
          }}
        >
          Loading…
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
