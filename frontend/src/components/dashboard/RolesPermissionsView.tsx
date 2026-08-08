'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Shield, 
  Check, 
  Save,
  Users,
  Loader2
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
  user: 'bg-blue-50 text-blue-700 border-blue-200/60',
  org: 'bg-brand-purple/10 text-brand-purple border-purple-200/60',
  company: 'bg-brand-cyan/15 text-brand-cyan border-cyan-200/60',
  contact: 'bg-brand-cyan/15 text-brand-cyan border-brand-cyan/25/60',
  lead: 'bg-amber-50 text-amber-700 border-amber-200/60',
  deal: 'bg-destructive/10 text-destructive border-destructive/25/60',
  pipeline: 'bg-brand-purple/10 text-brand-purple border-violet-200/60',
  activity: 'bg-secondary text-muted-foreground border-orange-200/60',
  email: 'bg-brand-purple/10 text-brand-purple border-brand-purple/20/60',
  gmail: 'bg-brand-purple/10 text-brand-purple border-brand-purple/20/60',
  dashboard: 'bg-secondary text-muted-foreground border-teal-200/60',
  ai: 'bg-secondary text-muted-foreground border-pink-200/60',
  webhook: 'bg-secondary text-foreground border-border/60',
  file: 'bg-secondary text-muted-foreground border-yellow-200/60',
  report: 'bg-secondary text-muted-foreground border-lime-200/60',
  system: 'bg-destructive/10 text-destructive border-red-200/60',
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
      setRows(sorted.map(p => ({
        key: p.codename,
        category: p.resource,
        categoryBg: CATEGORY_BG[p.resource] || 'bg-secondary text-foreground border-border/60',
        name: p.name,
        description: describePermission(p.codename, p.name),
        codename: p.codename,
      })));
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

  const userCountRole = (roleName: string): number => {
    return 0;
  };

  return (
    <div className="space-y-6 font-sans">
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 bg-ink text-primary-foreground px-4 py-3 rounded-xl flex items-center space-x-2.5 text-xs font-bold animate-in fade-in slide-in-from-bottom-2 duration-300 border border-slate-800">
          <Check className="h-4 w-4 text-brand-cyan" />
          <span>{toast}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-sans text-foreground tracking-tight font-semibold">
            Roles &amp; Permissions
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-1 font-medium tracking-wide">
            Configure system authorization profiles and manage access bounds across all workspace roles.
          </p>
        </div>

        <button 
          onClick={handleSave}
          disabled={saving || loading}
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-brand-purple hover:bg-brand-purple/90 disabled:opacity-50 text-primary-foreground rounded-xl text-xs font-bold transition duration-200 cursor-pointer hover:shadow-nav self-start sm:self-center"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          <span>{saving ? 'Saving...' : 'Save Changes'}</span>
        </button>
      </div>

      {/* Roles Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {roles.map((role) => (
          <div 
            key={role.id}
            className="bg-card border border-border/90 rounded-2xl p-5  space-y-2 hover:shadow-nav hover:border-border transition duration-300"
          >
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-foreground">{role.display_name}</span>
              <span className="text-[10px] font-semibold bg-brand-purple/10 text-brand-purple px-2.5 py-1 rounded-full border border-brand-purple/15">
                {role.name === 'admin' ? 'Full Access' : `${(matrix[role.name] ? Object.values(matrix[role.name]).filter(Boolean).length : 0)} / ${permissions.length} Permissions`}
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed font-normal">{role.description || 'No description.'}</p>
          </div>
        ))}
      </div>

      {/* Permission Matrix Table */}
      <div className="bg-card border border-border/90 rounded-2xl p-6  space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground text-base flex items-center">
            <Shield className="h-5 w-5 mr-2 text-brand-purple" />
            <span>Permission Access Matrix</span>
          </h3>
          <span className="text-xs font-medium text-muted-foreground">
            {permissions.length} Total System Policy Rules
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground text-xs font-medium">
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Loading permissions...
          </div>
        ) : (
          <div className="overflow-x-auto select-none max-h-[600px] overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-card z-10">
                <tr className="border-b border-border text-[10px] uppercase font-semibold text-foreground tracking-wider">
                  <th className="py-3 px-4">CATEGORY</th>
                  <th className="py-3 px-4">PERMISSION</th>
                  <th className="py-3 px-4">DESCRIPTION</th>
                  {roles.map(r => (
                    <th key={r.name} className="py-3 px-4 text-center w-28">{r.display_name.toUpperCase()}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs font-medium text-foreground">
                {rows.map((row) => (
                  <tr key={row.key} className="hover:bg-secondary/80 transition-colors group">
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-semibold border ${row.categoryBg}`}>
                        {categoryLabel[row.category] || row.category}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-foreground text-xs block">{row.name}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-muted-foreground text-xs leading-normal block max-w-md">{row.description}</span>
                    </td>
                    {roles.map(r => (
                      <td key={r.name} className="py-3 px-4 text-center">
                        <button 
                          type="button"
                          disabled={r.name === 'admin'}
                          onClick={() => togglePermission(row.codename, r.name)}
                          className={`h-5 w-5 rounded-md border transition flex items-center justify-center mx-auto ${
                            r.name === 'admin'
                              ? 'border-brand-purple/20 bg-brand-purple/10 text-brand-purple cursor-not-allowed opacity-75'
                              : matrix[r.name]?.[row.codename]
                                ? 'border-brand-purple bg-brand-purple text-primary-foreground  hover:bg-brand-purple/90 cursor-pointer'
                                : 'border-border bg-card hover:border-brand-purple/50 cursor-pointer'
                          }`}
                          title={r.name === 'admin' ? 'Admin access is permanently enabled' : ''}
                        >
                          {matrix[r.name]?.[row.codename] && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                        </button>
                      </td>
                    ))}
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

