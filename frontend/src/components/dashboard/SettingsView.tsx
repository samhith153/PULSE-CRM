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
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  Loader2,
  XCircle
} from 'lucide-react';
import { getCurrentUser, changePassword, updateUser } from '@/utils/api';

export default function SettingsView({ userRole = 'manager' }: { userRole?: string }) {
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'password' | 'notifications' | 'integrations'>('password');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const [profileForm, setProfileForm] = useState({ full_name: '', email: '', job_title: '' });
  const [passwordForm, setPasswordForm] = useState({ current: '', next: '', confirm: '' });
  const [userId, setUserId] = useState<string | null>(null);

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

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-2xl p-5 flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 mr-2 animate-spin text-muted-foreground" />
        <span className="text-xs text-muted-foreground font-medium">Loading settings...</span>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-5 ">
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5 border-b border-border pb-4">
        <div>
          <h2 className="font-sans text-2xl text-foreground font-bold">System Settings</h2>
          <p className="text-[11px] text-muted-foreground mt-0.5 font-semibold">Configure personal parameters, account passwords, alerts rules, and third-party integrations.</p>
        </div>
        
        {saveSuccess && (
          <div className="bg-brand-cyan/15 text-brand-cyan text-xs font-semibold px-3.5 py-1.5 rounded-lg border border-brand-cyan/20 flex items-center space-x-1.5 animate-in fade-in duration-200">
            <Check className="h-4 w-4" />
            <span>Settings saved successfully</span>
          </div>
        )}
        {saveError && (
          <div className="bg-destructive/10 text-destructive text-xs font-semibold px-3.5 py-1.5 rounded-lg border border-destructive/20 flex items-center space-x-1.5 animate-in fade-in duration-200">
            <XCircle className="h-4 w-4" />
            <span>{saveError}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-12 gap-6 items-start">
        
        <div className="col-span-12 md:col-span-3 space-y-1">
          {[
            { id: 'password', label: 'Password & Security', icon: Lock },
            { id: 'profile', label: 'Profile Settings', icon: User },
            { id: 'notifications', label: 'Notification Rules', icon: Bell },
            { id: 'integrations', label: 'Integrations Sync', icon: GitBranch }
          ].map((item) => {
            const Icon = item.icon;
            const isSelected = activeSubTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSubTab(item.id as any)}
                className={`w-full flex items-center space-x-2.5 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all text-left cursor-pointer ${
                  isSelected 
                    ? 'bg-brand-purple/10 text-brand-purple' 
                    : 'hover:bg-secondary text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        <div className="col-span-12 md:col-span-9 bg-secondary border border-border rounded-xl p-5">
          <form onSubmit={handleSave} className="space-y-4">
            
            {activeSubTab === 'password' && (
              <div className="space-y-4">
                <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2">Password Update</h3>
                <div>
                  <label className="block text-[9px] font-semibold text-foreground uppercase tracking-wider mb-1">Current Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={passwordForm.current}
                    onChange={e => setPasswordForm({...passwordForm, current: e.target.value})}
                    className="w-full px-3 py-1.5 border border-border rounded-lg text-xs bg-background text-foreground focus:outline-none"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-semibold text-foreground uppercase tracking-wider mb-1">New Password</label>
                    <input
                      type="password"
                      placeholder="Min 8 characters"
                      value={passwordForm.next}
                      onChange={e => setPasswordForm({...passwordForm, next: e.target.value})}
                      className="w-full px-3 py-1.5 border border-border rounded-lg text-xs bg-background text-foreground focus:outline-none"
                      required
                      minLength={8}
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-semibold text-foreground uppercase tracking-wider mb-1">Confirm New Password</label>
                    <input
                      type="password"
                      placeholder="Min 8 characters"
                      value={passwordForm.confirm}
                      onChange={e => setPasswordForm({...passwordForm, confirm: e.target.value})}
                      className="w-full px-3 py-1.5 border border-border rounded-lg text-xs bg-background text-foreground focus:outline-none"
                      required
                      minLength={8}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeSubTab === 'profile' && (
              <div className="space-y-4">
                <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2">Profile Setup</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-semibold text-foreground uppercase tracking-wider mb-1">Full Name</label>
                    <input
                      type="text"
                      value={profileForm.full_name}
                      onChange={e => setProfileForm({...profileForm, full_name: e.target.value})}
                      className="w-full px-3 py-1.5 border border-border rounded-lg text-xs bg-background text-foreground focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-semibold text-foreground uppercase tracking-wider mb-1">Role Title</label>
                    <input
                      type="text"
                      readOnly
                      value={profileForm.job_title || profileForm.email}
                      className="w-full px-3 py-1.5 border border-border rounded-lg text-xs bg-secondary text-muted-foreground focus:outline-none cursor-not-allowed"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[9px] font-semibold text-foreground uppercase tracking-wider mb-1">Contact Email</label>
                  <input
                    type="email"
                    readOnly
                    value={profileForm.email}
                    className="w-full px-3 py-1.5 border border-border rounded-lg text-xs bg-secondary text-muted-foreground focus:outline-none cursor-not-allowed"
                  />
                </div>
              </div>
            )}

            {activeSubTab === 'notifications' && (
              <div className="space-y-4">
                <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2">Notification Preferences</h3>
                <p className="text-[10px] text-muted-foreground italic">Notification preferences will be available in a future update.</p>
              </div>
            )}

            {activeSubTab === 'integrations' && (
              <div className="space-y-4">
                <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2">Integrations Sync</h3>
                
                <div className="space-y-4 font-semibold text-foreground text-xs">
                  <div className="flex items-center justify-between p-3 border border-border bg-card rounded-xl">
                    <div className="flex items-center space-x-3">
                      <Mail className="h-5 w-5 text-brand-purple" />
                      <div>
                        <h4 className="font-semibold text-foreground">Gmail Integration Link</h4>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Sync sent emails and inbox replies history with prospects timeline.</p>
                      </div>
                    </div>
                    <div className="text-[10px] text-muted-foreground font-medium">Managed from Gmail Sync page</div>
                  </div>

                  <div className="flex items-center justify-between p-3 border border-border bg-card rounded-xl">
                    <div className="flex items-center space-x-3">
                      <ShieldCheck className="h-5 w-5 text-brand-purple" />
                      <div>
                        <h4 className="font-semibold text-foreground">Google Calendar Sync</h4>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Coordinate calls and client briefs calendar dates directly inside Pulse calendar.</p>
                      </div>
                    </div>
                    <div className="text-[10px] text-muted-foreground font-medium">Coming soon</div>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-border flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 bg-brand-purple hover:bg-brand-purple/90 disabled:opacity-50 text-primary-foreground rounded-lg text-xs font-semibold cursor-pointer inline-flex items-center space-x-1.5"
              >
                {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>{saving ? 'Saving...' : 'Save Settings Preferences'}</span>
              </button>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
}

