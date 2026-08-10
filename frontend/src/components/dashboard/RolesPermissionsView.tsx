'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Shield, 
  Check, 
  Save,
  Users,
  User,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { RoleData, PermissionData, getRoles, getPermissions, updateRolePermissions } from '@/utils/api';

interface PermissionRow {
  key: string;
  category: string;
  categoryBg: string;
  name: string;
  description: string;
  codename: string;
}

const CATEGORY_BG: Record<string, string> = {
  user: 'bg-blue-50 text-blue-600',
  org: 'bg-purple-50 text-purple-600',
  company: 'bg-cyan-50 text-cyan-600',
  contact: 'bg-cyan-50 text-cyan-600',
  lead: 'bg-orange-50 text-orange-600',
  deal: 'bg-rose-50 text-rose-600',
  pipeline: 'bg-purple-50 text-purple-600',
  activity: 'bg-slate-50 text-slate-600',
  email: 'bg-purple-50 text-purple-600',
  gmail: 'bg-purple-50 text-purple-600',
  dashboard: 'bg-teal-50 text-teal-600',
  ai: 'bg-pink-50 text-pink-600',
  webhook: 'bg-slate-50 text-slate-600',
  file: 'bg-yellow-50 text-yellow-600',
  report: 'bg-lime-50 text-lime-600',
  system: 'bg-red-50 text-red-600',
  Organization: 'bg-purple-50 text-purple-600',
  Notification: 'bg-slate-50 text-slate-600',
  Leads: 'bg-orange-50 text-orange-600',
};

const categoryLabel: Record<string, string> = {
  user: 'User Management',
  org: 'Organization',
  company: 'Companies',
  contact: 'Contacts',
  lead: 'Leads',
  deal: 'Deals',
  pipeline: 'Pipeline',
  activity: 'Activity',
  email: 'Email',
  gmail: 'Gmail',
  dashboard: 'Dashboard',
  ai: 'AI',
  webhook: 'Webhooks',
  file: 'Files',
  report: 'Reports',
  system: 'System',
};

const ACTION_LABEL: Record<string, string> = {
  create: 'Create records',
  read: 'View records',
  update: 'Edit records',
  delete: 'Delete records',
  assign: 'Assign ownership',
  convert: 'Convert leads',
  manage_roles: 'Manage roles',
  activate: 'Activate users',
  deactivate: 'Deactivate users',
  send: 'Send emails',
  sync: 'Sync emails',
  connect: 'Connect account',
  access: 'Access AI features',
  manage: 'Manage webhooks',
  upload: 'Upload files',
  view: 'View reports',
  export: 'Export reports',
  admin: 'System admin access',
};

function describePermission(codename: string, name: string): string {
  const parts = codename.split(':');
  const action = parts[1] || '';
  return ACTION_LABEL[action] || name;
}

const ROLE_STYLES: Record<string, any> = {
  admin: {
    icon: Shield,
    iconBg: 'bg-brand-purple/10 text-brand-purple',
    badgeBg: 'bg-brand-purple/10 text-brand-purple',
  },
  manager: {
    icon: Users,
    iconBg: 'bg-blue-50 text-blue-600',
    badgeBg: 'bg-blue-50 text-blue-600',
  },
  sales_manager: {
    icon: Users,
    iconBg: 'bg-blue-50 text-blue-600',
    badgeBg: 'bg-blue-50 text-blue-600',
  },
  sales_rep: {
    icon: User,
    iconBg: 'bg-emerald-50 text-emerald-600',
    badgeBg: 'bg-emerald-50 text-emerald-600',
  },
  representative: {
    icon: User,
    iconBg: 'bg-emerald-50 text-emerald-600',
    badgeBg: 'bg-emerald-50 text-emerald-600',
  }
};

function getRoleStyle(roleName: string) {
  return ROLE_STYLES[roleName] || {
    icon: Shield,
    iconBg: 'bg-slate-50 text-slate-600',
    badgeBg: 'bg-slate-50 text-slate-600',
  };
}

export default function RolesPermissionsView() {
  const [roles, setRoles] = useState<RoleData[]>([]);
  const [permissions, setPermissions] = useState<PermissionData[]>([]);
  const [rows, setRows] = useState<PermissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [matrix, setMatrix] = useState<Record<string, Record<string, boolean>>>({});
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [rolesData, permsData] = await Promise.all([getRoles(), getPermissions()]);
      const rolesList = Array.isArray(rolesData) ? rolesData : [];
      const permsList = Array.isArray(permsData) ? permsData : [];
      setRoles(rolesList);
      setPermissions(permsList);

      const r: Record<string, Record<string, boolean>> = {};
      for (const role of rolesList) {
        r[role.name] = {};
        for (const perm of permsList) {
          r[role.name][perm.codename] = role.permissions.includes(perm.codename);
        }
      }
      setMatrix(r);

      const sorted = [...permsList].sort((a, b) => {
        if (a.resource !== b.resource) return a.resource.localeCompare(b.resource);
        return a.action.localeCompare(b.action);
      });
      setRows(sorted.map(p => {
        const catLabel = categoryLabel[p.resource] || p.resource;
        // capitalize first letter if it's the raw resource
        const displayCategory = categoryLabel[p.resource] ? categoryLabel[p.resource] : p.resource.charAt(0).toUpperCase() + p.resource.slice(1);
        
        return {
          key: p.codename,
          category: displayCategory,
          categoryBg: CATEGORY_BG[p.resource] || CATEGORY_BG[displayCategory] || 'bg-slate-50 text-slate-600',
          name: p.name,
          description: describePermission(p.codename, p.name),
          codename: p.codename,
        };
      }));
    } catch {
      setToast('Failed to load roles and permissions.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const togglePermission = (codename: string, roleName: string) => {
    if (roleName === 'admin') return;
    setMatrix(prev => ({
      ...prev,
      [roleName]: {
        ...prev[roleName],
        [codename]: !prev[roleName]?.[codename],
      },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const nonAdminRoles = roles.filter(r => r.name !== 'admin');
      for (const role of nonAdminRoles) {
        const codenames = Object.entries(matrix[role.name] || {})
          .filter(([, v]) => v)
          .map(([k]) => k);
        await updateRolePermissions(role.id, codenames);
      }
      setToast('Permission matrix saved successfully.');
    } catch (err: any) {
      setToast(err?.message || 'Failed to save permissions.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 bg-ink text-primary-foreground px-4 py-3 rounded-xl flex items-center space-x-2.5 text-xs font-bold animate-in fade-in slide-in-from-bottom-2 duration-300 border border-slate-800">
          <Check className="h-4 w-4 text-brand-cyan" />
          <span>{toast}</span>
        </div>
      )}

      {/* ── Page Header ────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-brand-purple/10 mt-0.5">
            <Shield className="h-5 w-5 text-brand-purple" />
          </div>
          <div>
            <h1 className="text-2xl font-sans text-foreground tracking-tight font-bold leading-tight">
              Roles & Permissions
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5 font-medium tracking-wide">
              Configure system authorization profiles and manage access bounds across all workspace roles.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={loadData}
            className="inline-flex items-center space-x-1.5 px-4 py-2 border border-border hover:bg-secondary rounded-lg text-xs font-semibold text-muted-foreground transition cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh</span>
          </button>
          <button 
            onClick={handleSave}
            disabled={saving || loading}
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-brand-purple hover:bg-brand-purple/90 text-primary-foreground rounded-lg text-xs font-semibold transition duration-200 cursor-pointer"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {/* Roles Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {roles.map((role) => {
          const style = getRoleStyle(role.name);
          const Icon = style.icon;
          const activePerms = matrix[role.name] ? Object.values(matrix[role.name]).filter(Boolean).length : 0;
          
          return (
            <div 
              key={role.id}
              className="bg-card border border-border/60 rounded-2xl p-5 hover:shadow-sm transition duration-300"
            >
              <div className="flex justify-between items-start">
                <div className="flex gap-4">
                  <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${style.iconBg}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">{role.display_name}</h3>
                    <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed max-w-[160px]">
                      {role.description || 'No description available for this role.'}
                    </p>
                  </div>
                </div>
                
                <div className={`flex flex-col items-center justify-center px-3 py-1.5 rounded-lg text-center ${style.badgeBg}`}>
                  {role.name === 'admin' ? (
                    <span className="text-[11px] font-bold whitespace-nowrap">Full Access</span>
                  ) : (
                    <>
                      <span className="text-xs font-bold whitespace-nowrap">{activePerms} / {permissions.length}</span>
                      <span className="text-[9px] font-semibold whitespace-nowrap">Permissions</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Permission Access Matrix Table */}
      <div className="bg-card border border-border/60 rounded-2xl p-6 space-y-5">
        <div className="flex items-center justify-between pb-1">
          <h3 className="font-semibold text-foreground text-sm flex items-center">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-brand-purple/10 mr-2.5">
              <Shield className="h-4 w-4 text-brand-purple" />
            </div>
            <span>Permission Access Matrix</span>
          </h3>
          <span className="text-xs font-bold text-brand-purple">
            {permissions.length} Total System Policy Rules
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground text-xs font-medium">
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Loading permissions...
          </div>
        ) : (
          <div className="overflow-x-auto select-none max-h-[600px] overflow-y-auto pb-4">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-card z-10">
                <tr className="border-b border-border/60 text-[10px] uppercase font-black text-muted-foreground tracking-wider">
                  <th className="py-3 px-4 w-32">CATEGORY</th>
                  <th className="py-3 px-4 w-48">PERMISSION</th>
                  <th className="py-3 px-4">DESCRIPTION</th>
                  {roles.map(r => (
                    <th key={r.name} className="py-3 px-4 text-center w-32">
                      {r.display_name.toUpperCase()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-xs font-medium text-foreground">
                {rows.map((row) => (
                  <tr key={row.key} className="hover:bg-secondary/50 transition-colors group">
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-md text-[10px] font-bold ${row.categoryBg}`}>
                        {row.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-foreground text-[11px] block">{row.name}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-muted-foreground text-[11px] leading-normal block max-w-md">{row.description}</span>
                    </td>
                    {roles.map(r => {
                      const isChecked = matrix[r.name]?.[row.codename] || r.name === 'admin';
                      return (
                        <td key={r.name} className="py-3.5 px-4 text-center">
                          <button 
                            type="button"
                            disabled={r.name === 'admin'}
                            onClick={() => togglePermission(row.codename, r.name)}
                            className={`h-6 w-6 rounded-full transition-all flex items-center justify-center mx-auto ${
                              r.name === 'admin'
                                ? 'bg-brand-purple/10 text-brand-purple cursor-not-allowed opacity-90'
                                : isChecked
                                  ? 'bg-brand-purple/10 text-brand-purple hover:bg-brand-purple/20 cursor-pointer'
                                  : 'bg-transparent hover:bg-secondary cursor-pointer'
                            }`}
                            title={r.name === 'admin' ? 'Admin access is permanently enabled' : ''}
                          >
                            {isChecked ? (
                              <Check className="h-3.5 w-3.5" strokeWidth={3} />
                            ) : (
                              <span className="text-muted-foreground/40 font-bold">-</span>
                            )}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
