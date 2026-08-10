'use client';

import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  User, 
  Lock, 
  Bell, 
  GitBranch, 
  Check, 
  Mail, 
  Shield,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  Loader2,
  XCircle,
  Eye,
  EyeOff,
  Code,
  MonitorSmartphone,
  SlidersHorizontal
} from 'lucide-react';
import { getCurrentUser, changePassword, updateUser } from '@/utils/api';
import IntegrationsView from './IntegrationsView';

export default function SettingsView({ userRole = 'manager' }: { userRole?: string }) {
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'password' | 'notifications' | 'integrations' | 'api' | 'sessions' | 'activity'>('password');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const [profileForm, setProfileForm] = useState({ full_name: '', email: '', job_title: '' });
  const [passwordForm, setPasswordForm] = useState({ current: '', next: '', confirm: '' });
  const [userId, setUserId] = useState<string | null>(null);
  
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNextPassword, setShowNextPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    getCurrentUser()
      .then(user => {
        setProfileForm({
          full_name: user.full_name || '',
          email: user.email || '',
          job_title: (user as any).job_title || '',
        });
        setUserId(user.id);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (saveSuccess || saveError) {
      const t = setTimeout(() => { setSaveSuccess(false); setSaveError(null); }, 4000);
      return () => clearTimeout(t);
    }
  }, [saveSuccess, saveError]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    setSaveSuccess(false);

    if (activeSubTab === 'password') {
      if (!passwordForm.current || !passwordForm.next || !passwordForm.confirm) {
        setSaveError('All password fields are required.');
        return;
      }
      if (passwordForm.next !== passwordForm.confirm) {
        setSaveError('New passwords do not match.');
        return;
      }
      if (passwordForm.next.length < 8) {
        setSaveError('New password must be at least 8 characters.');
        return;
      }

      setSaving(true);
      try {
        await changePassword(passwordForm.current, passwordForm.next);
        setPasswordForm({ current: '', next: '', confirm: '' });
        setSaveSuccess(true);
      } catch (err: any) {
        setSaveError(err?.message || 'Failed to change password.');
      } finally {
        setSaving(false);
      }
    } else if (activeSubTab === 'profile') {
      if (!profileForm.full_name.trim()) {
        setSaveError('Full name is required.');
        return;
      }
      if (!userId) {
        setSaveError('User not loaded.');
        return;
      }
      setSaving(true);
      try {
        await updateUser(userId, { full_name: profileForm.full_name.trim() });
        setSaveSuccess(true);
      } catch (err: any) {
        setSaveError(err?.message || 'Failed to update profile.');
      } finally {
        setSaving(false);
      }
    } else {
      setSaveSuccess(true);
    }
  };

  const hasLength = passwordForm.next.length >= 8;
  const hasUpper = /[A-Z]/.test(passwordForm.next);
  const hasLower = /[a-z]/.test(passwordForm.next);
  const hasSpecialOrNum = /[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(passwordForm.next);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-brand-purple" />
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-[30px] font-sans text-foreground tracking-tight font-extrabold">System Settings</h1>
          <p className="text-sm text-muted-foreground mt-1.5 font-medium tracking-wide">Configure personal parameters, account passwords, alerts rules, and third-party integrations.</p>
        </div>
        
        {saveSuccess && (
          <div className="bg-emerald-50 text-emerald-600 text-sm font-bold px-4 py-2 rounded-xl flex items-center space-x-2 animate-in fade-in duration-200 shadow-sm border border-emerald-100">
            <Check className="h-4 w-4" />
            <span>Settings saved successfully</span>
          </div>
        )}
        {saveError && (
          <div className="bg-rose-50 text-rose-600 text-sm font-bold px-4 py-2 rounded-xl flex items-center space-x-2 animate-in fade-in duration-200 shadow-sm border border-rose-100">
            <XCircle className="h-4 w-4" />
            <span>{saveError}</span>
          </div>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-6 items-start">
        
        {/* Left Sidebar Menu */}
        <div className="w-full md:w-[280px] shrink-0 space-y-4">
          <div className="bg-card border border-border rounded-3xl p-4 shadow-sm flex flex-col h-full space-y-1">
            {[
              { id: 'password', label: 'Password & Security', icon: Lock },
              { id: 'profile', label: 'Profile Settings', icon: User },
              { id: 'notifications', label: 'Notification Rules', icon: Bell },
              { id: 'integrations', label: 'Integrations Sync', icon: GitBranch },
              { id: 'api', label: 'API Access', icon: Code },
              { id: 'sessions', label: 'Session Management', icon: MonitorSmartphone },
              { id: 'activity', label: 'Activity Preferences', icon: SlidersHorizontal }
            ].map((item) => {
              const Icon = item.icon;
              const isSelected = activeSubTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSubTab(item.id as any)}
                  className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-2xl text-[13px] font-bold transition-all text-left cursor-pointer ${
                    isSelected 
                      ? 'bg-brand-purple/10 text-brand-purple' 
                      : 'hover:bg-secondary/60 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="h-[18px] w-[18px] shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}

            <div className="mt-8 mb-2 p-4 bg-brand-purple/5 rounded-2xl border border-brand-purple/10">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-brand-purple" />
                <span className="text-xs font-bold text-foreground">Security Tip</span>
              </div>
              <p className="text-[11px] font-medium text-muted-foreground leading-relaxed">
                Use a strong password and update it regularly to keep your account secure.
              </p>
            </div>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 bg-card border border-border/80 rounded-3xl shadow-sm overflow-hidden w-full min-h-[600px]">
          {activeSubTab === 'integrations' ? (
            <div className="p-8">
              <IntegrationsView />
            </div>
          ) : activeSubTab === 'password' ? (
            <form onSubmit={handleSave} className="flex flex-col h-full">
              <div className="p-8 border-b border-border/40">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-brand-purple/10 text-brand-purple">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-foreground tracking-tight">Password & Security</h2>
                    <p className="text-xs font-medium text-muted-foreground mt-0.5">Manage your account password and security preferences.</p>
                  </div>
                </div>
              </div>

              <div className="p-8 flex-1 space-y-8">
                <div>
                  <label className="flex items-center gap-2 text-[11px] font-bold text-foreground mb-2">
                    <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      placeholder="••••••••••••"
                      value={passwordForm.current}
                      onChange={e => setPasswordForm({...passwordForm, current: e.target.value})}
                      className="w-full pl-4 pr-10 py-3 border border-border/80 rounded-xl text-sm bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-brand-purple/30 transition-shadow"
                      required
                    />
                    <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="flex items-center gap-2 text-[11px] font-bold text-foreground mb-2">
                      <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showNextPassword ? "text" : "password"}
                        placeholder="Enter new password"
                        value={passwordForm.next}
                        onChange={e => setPasswordForm({...passwordForm, next: e.target.value})}
                        className="w-full pl-4 pr-10 py-3 border border-border/80 rounded-xl text-sm bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-brand-purple/30 transition-shadow"
                        required
                        minLength={8}
                      />
                      <button type="button" onClick={() => setShowNextPassword(!showNextPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showNextPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-[11px] font-bold text-foreground mb-2">
                      <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm new password"
                        value={passwordForm.confirm}
                        onChange={e => setPasswordForm({...passwordForm, confirm: e.target.value})}
                        className="w-full pl-4 pr-10 py-3 border border-border/80 rounded-xl text-sm bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-brand-purple/30 transition-shadow"
                        required
                        minLength={8}
                      />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start pt-2">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className={`flex items-center justify-center w-[18px] h-[18px] rounded-full ${hasLength ? 'border border-emerald-500 bg-emerald-50 text-emerald-600' : 'border border-border bg-secondary text-transparent'}`}>
                        <Check className="w-3 h-3" />
                      </div>
                      <span className={`text-[11px] font-bold ${hasLength ? 'text-emerald-700' : 'text-muted-foreground'}`}>At least 8 characters</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`flex items-center justify-center w-[18px] h-[18px] rounded-full ${hasUpper ? 'border border-emerald-500 bg-emerald-50 text-emerald-600' : 'border border-border bg-secondary text-transparent'}`}>
                        <Check className="w-3 h-3" />
                      </div>
                      <span className={`text-[11px] font-bold ${hasUpper ? 'text-emerald-700' : 'text-muted-foreground'}`}>Includes uppercase letter</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`flex items-center justify-center w-[18px] h-[18px] rounded-full ${hasLower ? 'border border-emerald-500 bg-emerald-50 text-emerald-600' : 'border border-border bg-secondary text-transparent'}`}>
                        <Check className="w-3 h-3" />
                      </div>
                      <span className={`text-[11px] font-bold ${hasLower ? 'text-emerald-700' : 'text-muted-foreground'}`}>Includes lowercase letter</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`flex items-center justify-center w-[18px] h-[18px] rounded-full ${hasSpecialOrNum ? 'border border-emerald-500 bg-emerald-50 text-emerald-600' : 'border border-border bg-secondary text-transparent'}`}>
                        <Check className="w-3 h-3" />
                      </div>
                      <span className={`text-[11px] font-bold ${hasSpecialOrNum ? 'text-emerald-700' : 'text-muted-foreground'}`}>Includes number or special character</span>
                    </div>
                  </div>

                  <div className="bg-secondary/40 border border-border rounded-2xl p-5 mt-2 md:mt-0">
                    <span className="text-[11px] font-bold text-foreground block mb-4">Password Strength</span>
                    <div className="flex gap-1.5 mb-3">
                      <div className={`h-1.5 flex-1 rounded-full ${passwordForm.next.length > 0 ? (hasLength ? 'bg-emerald-500' : 'bg-rose-500') : 'bg-border'}`}></div>
                      <div className={`h-1.5 flex-1 rounded-full ${passwordForm.next.length > 0 && hasLength && (hasUpper || hasLower) ? 'bg-emerald-500' : 'bg-border'}`}></div>
                      <div className={`h-1.5 flex-1 rounded-full ${passwordForm.next.length > 0 && hasLength && hasUpper && hasLower ? 'bg-emerald-500' : 'bg-border'}`}></div>
                      <div className={`h-1.5 flex-1 rounded-full ${passwordForm.next.length > 0 && hasLength && hasUpper && hasLower && hasSpecialOrNum ? 'bg-emerald-500' : 'bg-border'}`}></div>
                    </div>
                    <span className="text-[11px] font-bold text-muted-foreground">
                      {passwordForm.next.length === 0 ? 'Too weak' 
                        : (hasLength && hasUpper && hasLower && hasSpecialOrNum ? 'Strong' 
                        : 'Weak')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-border/40 flex justify-end bg-secondary/10">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-brand-purple hover:bg-brand-purple/90 disabled:opacity-50 text-white rounded-xl text-xs font-bold cursor-pointer inline-flex items-center space-x-2 shadow-sm transition-colors"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>{saving ? 'Saving...' : 'Save Settings Preferences'}</span>
                </button>
              </div>

            </form>
          ) : activeSubTab === 'profile' ? (
            <form onSubmit={handleSave} className="flex flex-col h-full">
              <div className="p-8 border-b border-border/40">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-brand-purple/10 text-brand-purple">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-foreground tracking-tight">Profile Settings</h2>
                    <p className="text-xs font-medium text-muted-foreground mt-0.5">Manage your personal information and contact details.</p>
                  </div>
                </div>
              </div>
              
              <div className="p-8 flex-1 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="flex items-center gap-2 text-[11px] font-bold text-foreground mb-2">Full Name</label>
                    <input
                      type="text"
                      value={profileForm.full_name}
                      onChange={e => setProfileForm({...profileForm, full_name: e.target.value})}
                      className="w-full px-4 py-3 border border-border/80 rounded-xl text-sm bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-brand-purple/30 transition-shadow"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-[11px] font-bold text-foreground mb-2">Role Title</label>
                    <input
                      type="text"
                      readOnly
                      value={profileForm.job_title || profileForm.email}
                      className="w-full px-4 py-3 border border-border/80 rounded-xl text-sm bg-secondary/50 text-muted-foreground focus:outline-none cursor-not-allowed"
                    />
                  </div>
                </div>
                <div>
                  <label className="flex items-center gap-2 text-[11px] font-bold text-foreground mb-2">Contact Email</label>
                  <input
                    type="email"
                    readOnly
                    value={profileForm.email}
                    className="w-full px-4 py-3 border border-border/80 rounded-xl text-sm bg-secondary/50 text-muted-foreground focus:outline-none cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="p-6 border-t border-border/40 flex justify-end bg-secondary/10">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-brand-purple hover:bg-brand-purple/90 disabled:opacity-50 text-white rounded-xl text-xs font-bold cursor-pointer inline-flex items-center space-x-2 shadow-sm transition-colors"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>{saving ? 'Saving...' : 'Save Settings Preferences'}</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="flex items-center justify-center h-full flex-col text-muted-foreground py-20">
              <Settings className="w-12 h-12 mb-4 opacity-20" />
              <p className="text-sm font-semibold">Settings panel coming soon</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
