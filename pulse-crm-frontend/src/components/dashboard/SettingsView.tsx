'use client';

import React, { useState } from 'react';
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
  ToggleRight
} from 'lucide-react';

export default function SettingsView() {
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'password' | 'notifications' | 'integrations'>('profile');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // States for forms
  const [profileForm, setProfileForm] = useState({ name: 'Alex Johnson', role: 'Sales Manager', email: 'alex.johnson@pulse.crm' });
  const [passwordForm, setPasswordForm] = useState({ current: '', next: '', confirm: '' });
  const [notifPreferences, setNotifPreferences] = useState({ leadAssigned: true, emailReply: true, meetingReminder: true, taskDue: false });
  const [gmailSync, setGmailSync] = useState(true);
  const [calendarSync, setCalendarSync] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="bg-white border border-brand-border-purple/20 rounded-xl p-5 shadow-sm/5">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5 border-b border-brand-border-purple/15 pb-4">
        <div>
          <h2 className="font-sans text-2xl text-brand-heading font-bold">System Settings</h2>
          <p className="text-[11px] text-brand-text/60 mt-0.5 font-bold">Configure personal parameters, account passwords, alerts rules, and third-party integrations.</p>
        </div>
        
        {saveSuccess && (
          <div className="bg-emerald-50 text-emerald-700 text-xs font-bold px-3.5 py-1.5 rounded-lg border border-emerald-150 flex items-center space-x-1.5 animate-in fade-in duration-200">
            <Check className="h-4 w-4" />
            <span>Settings saved successfully</span>
          </div>
        )}
      </div>

      {/* Sub tabs and Form content */}
      <div className="grid grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Settings navigation (Col 3) */}
        <div className="col-span-12 md:col-span-3 space-y-1">
          {[
            { id: 'profile', label: 'Profile Settings', icon: User },
            { id: 'password', label: 'Password & Security', icon: Lock },
            { id: 'notifications', label: 'Notification Rules', icon: Bell },
            { id: 'integrations', label: 'Integrations Sync', icon: GitBranch }
          ].map((item) => {
            const Icon = item.icon;
            const isSelected = activeSubTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSubTab(item.id as any)}
                className={`w-full flex items-center space-x-2.5 px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all text-left cursor-pointer ${
                  isSelected 
                    ? 'bg-brand-secondary-accent/15 text-brand-accent' 
                    : 'hover:bg-slate-50 text-brand-text/75 hover:text-brand-text'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Side: Form details (Col 9) */}
        <div className="col-span-12 md:col-span-9 bg-slate-50/50 border border-brand-border-purple/15 rounded-xl p-5">
          <form onSubmit={handleSave} className="space-y-4">
            
            {activeSubTab === 'profile' && (
              <div className="space-y-4">
                <h3 className="text-xs font-extrabold text-brand-heading uppercase tracking-wider mb-2">Profile Setup</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Full Name</label>
                    <input type="text" value={profileForm.name} onChange={e => setProfileForm({...profileForm, name: e.target.value})} className="w-full px-3 py-1.5 border border-brand-border-purple/35 rounded-lg text-xs bg-white text-brand-text focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Role Title</label>
                    <input type="text" readOnly value={profileForm.role} className="w-full px-3 py-1.5 border border-brand-border-purple/20 rounded-lg text-xs bg-slate-100/50 text-brand-text/60 focus:outline-none cursor-not-allowed" />
                  </div>
                </div>
                <div>
                  <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Contact Email</label>
                  <input type="email" value={profileForm.email} onChange={e => setProfileForm({...profileForm, email: e.target.value})} className="w-full px-3 py-1.5 border border-brand-border-purple/35 rounded-lg text-xs bg-white text-brand-text focus:outline-none" />
                </div>
              </div>
            )}

            {activeSubTab === 'password' && (
              <div className="space-y-4">
                <h3 className="text-xs font-extrabold text-brand-heading uppercase tracking-wider mb-2">Password Update</h3>
                <div>
                  <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Current Password</label>
                  <input type="password" placeholder="••••••••" value={passwordForm.current} onChange={e => setPasswordForm({...passwordForm, current: e.target.value})} className="w-full px-3 py-1.5 border border-brand-border-purple/35 rounded-lg text-xs bg-white text-brand-text focus:outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">New Password</label>
                    <input type="password" placeholder="Min 8 characters" value={passwordForm.next} onChange={e => setPasswordForm({...passwordForm, next: e.target.value})} className="w-full px-3 py-1.5 border border-brand-border-purple/35 rounded-lg text-xs bg-white text-brand-text focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Confirm New Password</label>
                    <input type="password" placeholder="Min 8 characters" value={passwordForm.confirm} onChange={e => setPasswordForm({...passwordForm, confirm: e.target.value})} className="w-full px-3 py-1.5 border border-brand-border-purple/35 rounded-lg text-xs bg-white text-brand-text focus:outline-none" />
                  </div>
                </div>
              </div>
            )}

            {activeSubTab === 'notifications' && (
              <div className="space-y-4">
                <h3 className="text-xs font-extrabold text-brand-heading uppercase tracking-wider mb-2">Notification Preferences</h3>
                <div className="space-y-3 font-semibold text-brand-text text-xs">
                  {[
                    { key: 'leadAssigned', label: 'Email me when a new lead is assigned to my name' },
                    { key: 'emailReply', label: 'Notify me when a prospect replies to my email logs' },
                    { key: 'meetingReminder', label: 'Display push meeting countdown alerts (15 mins prior)' },
                    { key: 'taskDue', label: 'Send alerts when tasks approach overdue deadlines' }
                  ].map((pref) => (
                    <label key={pref.key} className="flex items-center space-x-3 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={(notifPreferences as any)[pref.key]}
                        onChange={(e) => setNotifPreferences({...notifPreferences, [pref.key]: e.target.checked})}
                        className="h-4 w-4 rounded border-brand-border-purple/35 text-brand-accent focus:ring-brand-accent/20 cursor-pointer"
                      />
                      <span>{pref.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {activeSubTab === 'integrations' && (
              <div className="space-y-4">
                <h3 className="text-xs font-extrabold text-brand-heading uppercase tracking-wider mb-2">Integrations Sync</h3>
                
                <div className="space-y-4 font-semibold text-brand-text text-xs">
                  {/* Gmail integration switch */}
                  <div className="flex items-center justify-between p-3 border border-brand-border-purple/15 bg-white rounded-xl">
                    <div className="flex items-center space-x-3">
                      <Mail className="h-5 w-5 text-indigo-600" />
                      <div>
                        <h4 className="font-extrabold text-brand-heading">Gmail Integration Link</h4>
                        <p className="text-[10px] text-slate-450 mt-0.5">Sync sent emails and inbox replies history with prospects timeline.</p>
                      </div>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setGmailSync(!gmailSync)}
                      className="text-brand-accent cursor-pointer"
                    >
                      {gmailSync ? <ToggleRight className="h-8 w-8" /> : <ToggleLeft className="h-8 w-8 text-slate-300" />}
                    </button>
                  </div>

                  {/* Calendar integration switch */}
                  <div className="flex items-center justify-between p-3 border border-brand-border-purple/15 bg-white rounded-xl">
                    <div className="flex items-center space-x-3">
                      <ShieldCheck className="h-5 w-5 text-purple-600" />
                      <div>
                        <h4 className="font-extrabold text-brand-heading">Google Calendar Sync</h4>
                        <p className="text-[10px] text-slate-450 mt-0.5">Coordinate calls and client briefs calendar dates directly inside Pulse calendar.</p>
                      </div>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setCalendarSync(!calendarSync)}
                      className="text-brand-accent cursor-pointer"
                    >
                      {calendarSync ? <ToggleRight className="h-8 w-8" /> : <ToggleLeft className="h-8 w-8 text-slate-300" />}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-brand-border-purple/15 flex justify-end">
              <button type="submit" className="px-5 py-2 bg-brand-accent hover:bg-brand-accent-hover text-white rounded-lg text-xs font-bold shadow-sm/10 cursor-pointer">
                Save Settings Preferences
              </button>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
}
