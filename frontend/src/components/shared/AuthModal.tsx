'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Mail, Lock, Loader2, Activity, AlertCircle } from 'lucide-react';
import { login, register, setToken, getAuthConfig, loginWithGoogle, getCurrentUser } from '@/utils/api';

type Role = 'representative' | 'manager' | 'admin';
type ModalMode = 'signin' | 'signup';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: ModalMode;
  onSuccess?: () => void;
}

export default function AuthModal({ isOpen, onClose, defaultMode = 'signup', onSuccess }: AuthModalProps) {
  const router = useRouter();
  const [mode, setMode] = useState<ModalMode>(defaultMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [orgName, setOrgName] = useState('');
  const [role, setRole] = useState<Role>('manager');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [googleClientId, setGoogleClientId] = useState<string | null>(null);

  // Load public auth configurations
  useEffect(() => {
    if (!isOpen) return;
    getAuthConfig()
      .then(config => {
        if (config.google_client_id) setGoogleClientId(config.google_client_id);
      })
      .catch(err => console.error('Failed to load auth config:', err));
  }, [isOpen]);

  const handleGoogleCallback = async (response: any) => {
    if (!response.credential) return;
    setLoading(true);
    setError('');
    try {
      const result = await loginWithGoogle(response.credential);
      setToken(result.access_token);

      const user = await getCurrentUser();
      const primaryRole = user.roles && user.roles.length > 0 ? user.roles[0] : 'sales_rep';

      if (typeof window !== 'undefined') {
        sessionStorage.setItem('pulse-crm-auth', 'true');
        localStorage.setItem('pulse-crm-role', primaryRole);
        localStorage.setItem('pulse-crm-user', user.full_name || 'Google User');
      }

      onClose();

      let redirectPath = '/dashboard';
      if (primaryRole === 'admin') {
        redirectPath = '/dashboard/admin';
      } else if (primaryRole === 'manager') {
        redirectPath = '/dashboard/manager';
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.push(redirectPath);
      }
    } catch (err: any) {
      console.error('Google auth error:', err);
      setError(err.message || 'Google Sign-In failed.');
      setLoading(false);
    }
  };

  // Dynamically load Google GSI client SDK and initialize button
  useEffect(() => {
    if (!isOpen || !googleClientId) return;

    const id = 'google-gsi-client';
    let script = document.getElementById(id) as HTMLScriptElement;

    const initializeGoogleSignIn = () => {
      const g = (window as any).google;
      if (g && g.accounts && g.accounts.id) {
        g.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleGoogleCallback,
        });
        const container = document.getElementById('google-signin-btn-container');
        if (container) {
          g.accounts.id.renderButton(container, {
            theme: 'outline',
            size: 'large',
            width: 316,
            text: 'continue_with',
          });
        }
      }
    };

    if (!script) {
      script = document.createElement('script');
      script.id = id;
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initializeGoogleSignIn;
      document.body.appendChild(script);
    } else {
      // Small timeout to ensure DOM container is rendered
      setTimeout(initializeGoogleSignIn, 50);
    }
  }, [isOpen, googleClientId]);

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

      const user = await getCurrentUser();
      const primaryRole = user.roles && user.roles.length > 0 ? user.roles[0] : 'sales_rep';

      if (typeof window !== 'undefined') {
        sessionStorage.setItem('pulse-crm-auth', 'true');
        localStorage.setItem('pulse-crm-role', primaryRole);
        localStorage.setItem('pulse-crm-user', user.full_name || name);
      }

      onClose();

      let redirectPath = '/dashboard';
      if (primaryRole === 'admin') {
        redirectPath = '/dashboard/admin';
      } else if (primaryRole === 'manager') {
        redirectPath = '/dashboard/manager';
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.push(redirectPath);
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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/65 backdrop-blur-sm p-4"
      onClick={onClose}>
      <div onClick={e => e.stopPropagation()}
        className="bg-surface-1 rounded-[20px] w-full max-w-[380px] p-7 shadow-[0_32px_80px_rgba(0,0,0,0.22)] relative">
        <button onClick={onClose}
          className="absolute top-3 right-3 w-7 h-7 rounded-lg border-none bg-surface-2 cursor-pointer flex items-center justify-center text-muted-foreground hover:bg-surface-hover">
          <X size={14} />
        </button>
        <div className="flex items-center gap-2.5 mb-1.5">
          <div className="w-8 h-8 rounded-[10px] bg-gradient-to-br from-brand to-brand flex items-center justify-center shadow-[0_4px_12px_rgba(37,99,235,0.27)]">
            <Activity size={15} className="text-white" strokeWidth={2.5} />
          </div>
          <span className="text-base font-black text-foreground tracking-tight">
            Pulse<span className="text-brand">CRM</span>
          </span>
        </div>
        <div className="mb-5">
          <h2 className="text-[22px] font-extrabold text-foreground m-0 tracking-tight leading-snug">
            {isSignin ? 'Welcome back' : 'Get started free'}
          </h2>
          <p className="text-[13px] text-muted-foreground font-medium m-0.5 leading-normal">
            {isSignin ? 'Sign in to your account to continue.' : 'Join thousands of teams using PulseCRM.'}
          </p>
        </div>

        {error && (
          <div className="px-3.5 py-2.5 bg-red-500/10 border border-red-500/20 rounded-[10px] mb-4 flex items-center gap-2">
            <AlertCircle size={14} className="text-red-500 shrink-0" />
            <span className="text-xs text-red-600 dark:text-red-400 font-semibold">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {mode === 'signup' && (
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-muted-foreground mb-1">Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)}
                  placeholder="John" required
                  className="w-full py-2.5 px-3 rounded-[10px] border-[1.5px] border-border bg-surface-2 text-[13px] font-[inherit] text-foreground outline-none box-border focus:border-brand transition-colors" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-muted-foreground mb-1">Company</label>
                <input type="text" value={orgName} onChange={e => setOrgName(e.target.value)}
                  placeholder="Acme Inc." required
                  className="w-full py-2.5 px-3 rounded-[10px] border-[1.5px] border-border bg-surface-2 text-[13px] font-[inherit] text-foreground outline-none box-border focus:border-brand transition-colors" />
              </div>
            </div>
          )}
          <div>
            <label className="block text-[11px] font-bold text-muted-foreground mb-1">Email address</label>
            <div className="relative">
              <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" />
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com" required
                className="w-full py-2.5 pl-9 pr-3 rounded-[10px] border-[1.5px] border-border bg-surface-2 text-[13px] font-[inherit] text-foreground outline-none box-border focus:border-brand transition-colors" />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-muted-foreground mb-1">Password</label>
            <div className="relative">
              <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" />
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" required
                className="w-full py-2.5 pl-9 pr-3 rounded-[10px] border-[1.5px] border-border bg-surface-2 text-[13px] font-[inherit] text-foreground outline-none box-border focus:border-brand transition-colors" />
            </div>
          </div>
          <div className="flex items-center justify-between mt-0.5">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest m-0">I am a</p>
            <div className="flex gap-1">
              {ROLES.map(r => (
                <button key={r.value} type="button" onClick={() => setRole(r.value)}
                  className={`px-3 py-1 rounded-full border-[1.5px] cursor-pointer text-[10px] font-bold font-[inherit] transition-all ${
                    role === r.value
                      ? 'border-brand bg-brand/10 text-brand'
                      : 'border-border bg-transparent text-muted-foreground'
                  }`}>
                  {r.label}
                </button>
              ))}
            </div>
          </div>
          {isSignin && (
            <div className="flex justify-end -mt-1">
              <button type="button" className="text-[11px] font-semibold text-brand bg-transparent border-none cursor-pointer font-[inherit]">Forgot password?</button>
            </div>
          )}
          <button type="submit" disabled={loading}
            className="flex items-center justify-center gap-2 py-3 bg-brand text-white text-sm font-bold rounded-xl border-none cursor-pointer font-[inherit] shadow-[0_6px_24px_rgba(37,99,235,0.33)] transition-all tracking-tight disabled:opacity-60 disabled:cursor-not-allowed">
            {loading ? <><Loader2 size={15} className="animate-spin" /> {isSignin ? 'Signing in\u2026' : 'Creating account\u2026'}</> : isSignin ? 'Sign In' : 'Create Account'}
          </button>
        </form>
        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-border" />
          <span className="text-[11px] text-muted-foreground font-medium whitespace-nowrap">or continue with</span>
          <div className="flex-1 h-px bg-border" />
        </div>
        {googleClientId ? (
          <div className="flex justify-center min-h-[40px]">
            <div id="google-signin-btn-container" className="w-full max-w-[316px]" />
          </div>
        ) : (
          <>
            <button onClick={() => { setLoading(true); setTimeout(() => { setLoading(false); onClose(); }, 1200); }} disabled={loading}
              className="w-full flex items-center justify-center gap-2.5 py-2.5 bg-surface-2 border-[1.5px] border-border rounded-xl text-[13px] font-semibold text-muted-foreground cursor-not-allowed font-[inherit] transition-all"
              title="Google Sign-In is not configured on the server."
            >
              <svg width="17" height="17" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </button>
            <p className="text-center text-[11px] text-muted-foreground mt-2">Google Sign-In is not configured on the server.</p>
          </>
        )}
        <p className="text-center text-xs text-muted-foreground mt-4">
          {isSignin ? "Don't have an account? " : 'Already have an account? '}
          <button onClick={switchMode} className="text-xs font-bold text-brand bg-transparent border-none cursor-pointer font-[inherit]">
            {isSignin ? 'Sign up free' : 'Sign in'}
          </button>
        </p>
      </div>
      <style>{`@keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }`}</style>
    </div>
  );
}
