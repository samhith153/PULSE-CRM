'use client';
import React, { useState } from 'react';
import { X, Mail, Lock, Loader2, Activity, AlertCircle } from 'lucide-react';
import { login, register, setToken } from '@/utils/api';

type Role = 'representative' | 'manager' | 'admin';
type ModalMode = 'signin' | 'signup';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: ModalMode;
  onSuccess?: () => void;
}

export default function AuthModal({ isOpen, onClose, defaultMode = 'signup', onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<ModalMode>(defaultMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [orgName, setOrgName] = useState('');
  const [role, setRole] = useState<Role>('manager');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (mode === 'signup' && (!name || !orgName))) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (mode === 'signup') {
        const result = await register(name, email, password, orgName);
        setToken(result.access_token);
      } else {
        const result = await login(email, password);
        setToken(result.access_token);
      }

      if (typeof window !== 'undefined') {
        sessionStorage.setItem('pulse-crm-auth', 'true');
        localStorage.setItem('pulse-crm-role', role);
        localStorage.setItem('pulse-crm-user', name || role);
      }

      onClose();
      if (onSuccess) {
        onSuccess();
      } else {
        window.location.href = '/';
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message || 'Authentication failed.');
      setLoading(false);
    }
  };

  const ROLES: { value: Role; label: string }[] = [
    { value: 'admin', label: 'Admin' },
    { value: 'manager', label: 'Manager' },
    { value: 'representative', label: 'Sales Rep' },
  ];

  const isSignin = mode === 'signin';

  const switchMode = () => {
    setMode(isSignin ? 'signup' : 'signin');
    setError('');
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(6px)', padding: 16 }}
      onClick={onClose}>
      <div onClick={e => e.stopPropagation()}
        style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 380, padding: '28px 32px 24px', boxShadow: '0 32px 80px rgba(0,0,0,0.22)', position: 'relative' }}>
        <button onClick={onClose}
          style={{ position: 'absolute', top: 12, right: 12, width: 28, height: 28, borderRadius: 8, border: 'none', background: '#f8fafc', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
          <X size={14} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg, #7c3aed, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(124,58,237,0.27)' }}>
            <Activity size={15} color="#fff" strokeWidth={2.5} />
          </div>
          <span style={{ fontSize: 16, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em' }}>
            Pulse<span style={{ color: '#7c3aed' }}>CRM</span>
          </span>
        </div>
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.03em', lineHeight: 1.3 }}>
            {isSignin ? 'Welcome back' : 'Get started free'}
          </h2>
          <p style={{ fontSize: 13, color: '#475569', fontWeight: 450, margin: '2px 0 0', lineHeight: 1.5 }}>
            {isSignin ? 'Sign in to your account to continue.' : 'Join thousands of teams using PulseCRM.'}
          </p>
        </div>

        {error && (
          <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle size={14} color="#dc2626" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: '#991b1b', fontWeight: 600 }}>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {mode === 'signup' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)}
                  placeholder="John" required
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 13, fontFamily: 'inherit', color: '#0f172a', outline: 'none', boxSizing: 'border-box', background: '#faf9ff' }}
                  onFocus={e => e.target.style.borderColor = '#7c3aed'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>Company</label>
                <input type="text" value={orgName} onChange={e => setOrgName(e.target.value)}
                  placeholder="Acme Inc." required
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 13, fontFamily: 'inherit', color: '#0f172a', outline: 'none', boxSizing: 'border-box', background: '#faf9ff' }}
                  onFocus={e => e.target.style.borderColor = '#7c3aed'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
              </div>
            </div>
          )}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>Email address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={14} color="#94a3b8" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com" required
                style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 13, fontFamily: 'inherit', color: '#0f172a', outline: 'none', boxSizing: 'border-box', background: '#faf9ff' }}
                onFocus={e => e.target.style.borderColor = '#7c3aed'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={14} color="#94a3b8" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" required
                style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 13, fontFamily: 'inherit', color: '#0f172a', outline: 'none', boxSizing: 'border-box', background: '#faf9ff' }}
                onFocus={e => e.target.style.borderColor = '#7c3aed'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>I am a</p>
            <div style={{ display: 'flex', gap: 4 }}>
              {ROLES.map(r => (
                <button key={r.value} type="button" onClick={() => setRole(r.value)}
                  style={{ padding: '5px 12px', borderRadius: 20, border: `1.5px solid ${role === r.value ? '#7c3aed' : '#e2e8f0'}`, background: role === r.value ? '#f5f3ff' : 'transparent', cursor: 'pointer', fontSize: 10, fontWeight: 700, color: role === r.value ? '#7c3aed' : '#64748b', fontFamily: 'inherit', transition: 'all 0.15s' }}>
                  {r.label}
                </button>
              ))}
            </div>
          </div>
          {isSignin && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: -4 }}>
              <button type="button" style={{ fontSize: 11, fontWeight: 600, color: '#7c3aed', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Forgot password?</button>
            </div>
          )}
          <button type="submit" disabled={loading}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px', background: loading ? '#9b72f0' : 'linear-gradient(135deg, #7c3aed, #7c3aed)', color: '#fff', fontSize: 14, fontWeight: 700, borderRadius: 12, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', boxShadow: '0 6px 24px rgba(124,58,237,0.33)', transition: 'all 0.15s', letterSpacing: '-0.01em' }}>
            {loading ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> {isSignin ? 'Signing in\u2026' : 'Creating account\u2026'}</> : isSignin ? 'Sign In' : 'Create Account'}
          </button>
        </form>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '16px 0' }}>
          <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
          <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500, whiteSpace: 'nowrap' }}>or continue with</span>
          <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
        </div>
        <button onClick={() => { setLoading(true); setTimeout(() => { setLoading(false); onClose(); }, 1200); }} disabled={loading}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '11px', background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 12, fontSize: 13, fontWeight: 700, color: '#0f172a', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}>
          <svg width="17" height="17" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continue with Google
        </button>
        <p style={{ textAlign: 'center', fontSize: 12, color: '#475569', margin: '16px 0 0' }}>
          {isSignin ? "Don't have an account? " : 'Already have an account? '}
          <button onClick={switchMode} style={{ fontSize: 12, fontWeight: 700, color: '#7c3aed', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
            {isSignin ? 'Sign up free' : 'Sign in'}
          </button>
        </p>
      </div>
      <style>{`@keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }`}</style>
    </div>
  );
}
