'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Key, 
  UserPlus, 
  X, 
  Ban,
  RefreshCw,
  Loader2,
  Archive,
  Undo2,
  Calendar,
  ChevronDown,
  CheckSquare
} from 'lucide-react';
import { 
  UserData, RoleData, 
  getUsers, createUser, updateUser, deleteUser,
  activateUser, deactivateUser, assignUserRole, resetUserPassword,
  getRoles, getDeletedUsers, restoreUser, permanentDeleteUser
} from '@/utils/api';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { toast } from '@/lib/toast';

/* ── Avatar color palette — deterministic per-user ────────────────────── */
const AVATAR_COLORS = [
  { bg: '#EDE9FE', text: '#7C3AED' },  // violet
  { bg: '#DBEAFE', text: '#2563EB' },  // blue
  { bg: '#D1FAE5', text: '#059669' },  // emerald
  { bg: '#FEF3C7', text: '#D97706' },  // amber
  { bg: '#FCE7F3', text: '#DB2777' },  // pink
  { bg: '#E0E7FF', text: '#4F46E5' },  // indigo
  { bg: '#CFFAFE', text: '#0891B2' },  // cyan
  { bg: '#FEE2E2', text: '#DC2626' },  // red
  { bg: '#F3E8FF', text: '#9333EA' },  // purple
  { bg: '#ECFDF5', text: '#10B981' },  // green
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/* ── Role badge styling ───────────────────────────────────────────────── */
const ROLE_STYLES: Record<string, { bg: string; text: string }> = {
  'Sales Representative': { bg: '#EDE9FE', text: '#7C3AED' },
  'sales_rep':            { bg: '#EDE9FE', text: '#7C3AED' },
  'Sales Manager':        { bg: '#DBEAFE', text: '#2563EB' },
  'sales_manager':        { bg: '#DBEAFE', text: '#2563EB' },
  'Manager':              { bg: '#DBEAFE', text: '#2563EB' },
  'manager':              { bg: '#DBEAFE', text: '#2563EB' },
  'Admin':                { bg: '#FCE7F3', text: '#DB2777' },
  'admin':                { bg: '#FCE7F3', text: '#DB2777' },
};

function getRoleStyle(roleName: string) {
  return ROLE_STYLES[roleName] || { bg: '#F3F4F6', text: '#6B7280' };
}

export default function UsersView() {
  const { user: currentUser } = useCurrentUser();
  const [users, setUsers] = useState<UserData[]>([]);
  const [deletedUsers, setDeletedUsers] = useState<UserData[]>([]);
  const [roles, setRoles] = useState<RoleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [deletedPage, setDeletedPage] = useState(1);
  const [deletedTotal, setDeletedTotal] = useState(0);
  const [showArchived, setShowArchived] = useState(false);
  const pageSize = 20;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit'>('create');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState<string | null>(null);

  const [form, setForm] = useState({
    full_name: '', email: '', password: '', role_id: '' as string
  });

  const isAdmin = currentUser?.roles?.includes('admin') ?? false;

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getUsers(page, pageSize);
      const data = Array.isArray(result) ? result : (result.data ?? []);
      const filtered = currentUser ? data.filter((u: UserData) => u.id !== currentUser.id) : data;
      const t = (result as any).total ?? data.length;
      setUsers(filtered);
      setTotal(currentUser ? t - 1 : t);
    } catch {
      toast.error('Failed to load users.');
    } finally {
      setLoading(false);
    }
  }, [page, currentUser]);

  const loadDeletedUsers = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const result = await getDeletedUsers(deletedPage, pageSize);
      const data = Array.isArray(result) ? result : (result.data ?? []);
      setDeletedUsers(data);
      setDeletedTotal((result as any).total ?? data.length);
    } catch {
      toast.error('Failed to load archived users.');
    }
  }, [deletedPage, isAdmin]);

  const loadRoles = useCallback(async () => {
    try {
      const data = await getRoles();
      setRoles(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Failed to load roles. Please refresh the page.');
    }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);
  useEffect(() => { loadRoles(); }, [loadRoles]);
  useEffect(() => { if (showArchived) loadDeletedUsers(); }, [showArchived, loadDeletedUsers]);

  const handleOpenCreate = () => {
    setModalType('create');
    setForm({ full_name: '', email: '', password: '', role_id: roles[0]?.id || '' });
    setEditingUserId(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: UserData) => {
    setModalType('edit');
    setForm({
      full_name: user.full_name,
      email: user.email,
      password: '',
      role_id: user.roles.length > 0 ? '' : ''
    });
    setEditingUserId(user.id);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name.trim() || !form.email.trim()) return;
    setSaving(true);
    try {
      if (modalType === 'create') {
        const payload: any = { full_name: form.full_name.trim(), email: form.email.trim(), password: form.password };
        if (form.role_id) payload.role_id = form.role_id;
        await createUser(payload);
        toast.success(`User "${form.full_name}" created successfully.`);
      } else if (modalType === 'edit' && editingUserId) {
        await updateUser(editingUserId, { full_name: form.full_name.trim() });
        if (form.role_id) {
          await assignUserRole(editingUserId, form.role_id);
        }
        toast.success(`User "${form.full_name}" updated successfully.`);
      }
      setIsModalOpen(false);
      loadUsers();
    } catch (err: any) {
      toast.error(err?.message || 'Operation failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (user: UserData) => {
    try {
      if (user.is_active) {
        await deactivateUser(user.id);
        toast.success(`User "${user.full_name}" deactivated.`);
      } else {
        await activateUser(user.id);
        toast.success(`User "${user.full_name}" activated.`);
      }
      loadUsers();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update user status.');
    }
  };

  const handleDeleteUser = async (user: UserData) => {
    if (isAdmin) {
      if (!window.confirm(`Permanently delete user "${user.full_name}"? This action cannot be undone.`)) return;
    } else {
      if (!window.confirm(`Deactivate user "${user.full_name}"? They can be restored later by an admin.`)) return;
    }
    try {
      await deleteUser(user.id);
      toast.success(isAdmin ? `User "${user.full_name}" permanently deleted.` : `User "${user.full_name}" deactivated.`);
      loadUsers();
      if (showArchived) loadDeletedUsers();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete user.');
    }
  };

  const handleRestoreUser = async (user: UserData) => {
    try {
      await restoreUser(user.id);
      toast.success(`User "${user.full_name}" restored.`);
      loadDeletedUsers();
      loadUsers();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to restore user.');
    }
  };

  const handlePermanentDelete = async (user: UserData) => {
    if (!window.confirm(`Permanently delete "${user.full_name}"? The email "${user.email}" will become available again. This cannot be undone.`)) return;
    try {
      await permanentDeleteUser(user.id);
      toast.success(`User "${user.full_name}" permanently deleted.`);
      loadDeletedUsers();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to permanently delete user.');
    }
  };

  const handleResetPassword = async (user: UserData) => {
    try {
      const result = await resetUserPassword(user.id);
      setShowPassword(result.new_password);
      toast.success(`Password reset for "${user.full_name}".`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to reset password.');
    }
  };

  const roleNameDisplay = (role: string) => {
    const r = roles.find(r => r.name === role);
    return r?.display_name || role;
  };

  const formatLastLogin = (dateStr: string | null | undefined): string => {
    if (!dateStr) return 'Never';
    const d = new Date(dateStr);
    const day = d.getDate();
    const month = d.toLocaleString('en-US', { month: 'short' });
    const year = d.getFullYear();
    const time = d.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase();
    return `${day} ${month} ${year}, ${time}`;
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const deletedTotalPages = Math.max(1, Math.ceil(deletedTotal / pageSize));

  return (
    <div className="space-y-6">
      {showPassword && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-ink/50 backdrop-blur-sm p-4">
          <div className="bg-card border rounded-xl w-full max-w-md p-6 space-y-4">
            <h3 className="font-semibold text-foreground text-sm">New Password</h3>
            <p className="text-xs text-muted-foreground">Copy the temporary password below. The user will need to change it on next login.</p>
            <div className="bg-secondary border rounded-lg p-3 text-center">
              <code className="text-sm font-mono font-bold text-brand-purple break-all select-all">{showPassword}</code>
            </div>
            <button
              onClick={() => { navigator.clipboard.writeText(showPassword); setShowPassword(null); }}
              className="w-full px-3.5 py-2 bg-brand-purple hover:bg-brand-purple/90 text-primary-foreground text-xs font-bold rounded-lg transition-colors cursor-pointer"
            >
              Copy &amp; Close
            </button>
          </div>
        </div>
      )}

      {/* ── Page Header ────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-brand-purple/10 mt-0.5">
            <Users className="h-5 w-5 text-brand-purple" />
          </div>
          <div>
            <h1 className="text-2xl font-sans text-foreground tracking-tight font-bold leading-tight">
              User Profiles Management
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5 font-medium tracking-wide">
              Provision user configurations, restrict roles authorization mapping, and cycle passwords.
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2.5">
          <button
            onClick={loadUsers}
            className="inline-flex items-center space-x-1.5 px-4 py-2 border border-border hover:bg-secondary rounded-lg text-xs font-semibold text-muted-foreground transition cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh</span>
          </button>
          <button 
            onClick={handleOpenCreate}
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-brand-purple hover:bg-brand-purple/90 text-primary-foreground rounded-lg text-xs font-semibold transition duration-200 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create User</span>
          </button>
        </div>
      </div>

      {/* ── Active Users Card ──────────────────────────────────────────── */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {/* Section header */}
        <div className="px-5 pt-5 pb-3">
          <h3 className="font-semibold text-foreground text-sm flex items-center">
            <Users className="h-4.5 w-4.5 mr-2 text-brand-purple" />
            <span>Active Organization Users</span>
            {loading && <Loader2 className="h-3.5 w-3.5 ml-2 animate-spin text-muted-foreground" />}
          </h3>
        </div>

        {loading && users.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground text-xs font-medium">
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Loading users...
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground text-xs font-medium">
            No users found. Create one to get started.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-y border-border text-[11px] uppercase font-black tracking-wider text-muted-foreground">
                    <th className="py-3 px-5 font-semibold">User</th>
                    <th className="py-3 px-4 font-semibold">Email</th>
                    <th className="py-3 px-4 font-semibold">Authorization Role</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold">Last Login</th>
                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-[13px] text-foreground">
                  {users.map((user) => {
                    const avatar = getAvatarColor(user.full_name);
                    const initials = getInitials(user.full_name);
                    const displayRole = (user.roles || []).length > 0 ? roleNameDisplay(user.roles[0]) : null;
                    const roleStyle = displayRole ? getRoleStyle(displayRole) : null;

                    return (
                      <tr key={user.id} className="border-b border-border/60 hover:bg-secondary/50 transition-colors">
                        {/* USER */}
                        <td className="py-3 px-5">
                          <div className="flex items-center gap-3">
                            <div
                              className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold select-none"
                              style={{ backgroundColor: avatar.bg, color: avatar.text }}
                            >
                              {initials}
                            </div>
                            <span className="font-semibold text-foreground whitespace-nowrap">{user.full_name}</span>
                          </div>
                        </td>

                        {/* EMAIL */}
                        <td className="py-3 px-4 text-muted-foreground font-normal text-[13px] whitespace-nowrap">
                          {user.email}
                        </td>

                        {/* AUTHORIZATION ROLE */}
                        <td className="py-3 px-4">
                          {displayRole && roleStyle ? (
                            <span
                              className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap"
                              style={{ backgroundColor: roleStyle.bg, color: roleStyle.text }}
                            >
                              {displayRole}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-[11px]">No role</span>
                          )}
                        </td>

                        {/* STATUS */}
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide ${
                            user.is_active 
                              ? 'text-emerald-600' 
                              : 'text-destructive'
                          }`}>
                            <span className={`w-2 h-2 rounded-full ${
                              user.is_active ? 'bg-emerald-500' : 'bg-destructive'
                            }`} />
                            {user.is_active ? 'Active' : 'Disabled'}
                          </span>
                        </td>

                        {/* LAST LOGIN */}
                        <td className="py-3 px-4 text-muted-foreground text-[13px] whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground/70 flex-shrink-0" />
                            <span className="tabular-nums">
                              {formatLastLogin(user.last_login_at)}
                            </span>
                          </div>
                        </td>

                        {/* ACTIONS */}
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center gap-1">
                            <button 
                              onClick={() => handleOpenEdit(user)}
                              className="p-1.5 text-muted-foreground hover:text-brand-purple hover:bg-brand-purple/10 rounded-md transition-all duration-150 cursor-pointer"
                              title="Edit Profile"
                            >
                              <CheckSquare className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => handleToggleStatus(user)}
                              className={`p-1.5 rounded-md transition-all duration-150 cursor-pointer ${
                                user.is_active 
                                  ? 'text-muted-foreground hover:text-destructive hover:bg-destructive/10' 
                                  : 'text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50'
                              }`}
                              title={user.is_active ? 'Disable User' : 'Enable User'}
                            >
                              <Ban className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => handleResetPassword(user)}
                              className="p-1.5 text-muted-foreground hover:text-amber-600 hover:bg-amber-50 rounded-md transition-all duration-150 cursor-pointer"
                              title="Reset Password"
                            >
                              <Key className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteUser(user)}
                              className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-all duration-150 cursor-pointer"
                              title={isAdmin ? 'Permanently Delete' : 'Deactivate User'}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-border">
                <span className="text-[10px] text-muted-foreground font-medium">
                  Page {page} of {totalPages} ({total} total)
                </span>
                <div className="flex space-x-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    className="px-2.5 py-1 text-[10px] font-bold border border-border rounded-lg disabled:opacity-30 hover:bg-secondary transition-colors cursor-pointer"
                  >
                    Previous
                  </button>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage(p => p + 1)}
                    className="px-2.5 py-1 text-[10px] font-bold border border-border rounded-lg disabled:opacity-30 hover:bg-secondary transition-colors cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Archived Users Section — Admin Only ────────────────────────── */}
      {isAdmin && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className="w-full flex items-center justify-between text-left cursor-pointer px-5 py-4"
          >
            <h3 className="font-semibold text-foreground text-sm flex items-center">
              <Archive className="h-4.5 w-4.5 mr-2 text-amber-500" />
              <span>Archived Users</span>
              {deletedTotal > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-amber-500/10 text-amber-500 rounded text-[9px] font-semibold">
                  {deletedTotal}
                </span>
              )}
            </h3>
            <span className="flex items-center gap-1 text-xs text-muted-foreground font-medium">
              {showArchived ? 'Hide' : 'Show'}
              <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${showArchived ? 'rotate-180' : ''}`} />
            </span>
          </button>

          {showArchived && (
            <>
              {deletedUsers.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground text-xs font-medium border-t border-border">
                  No archived users.
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-y border-border text-[11px] uppercase font-black tracking-wider text-muted-foreground">
                          <th className="py-3 px-5 font-semibold">User</th>
                          <th className="py-3 px-4 font-semibold">Email</th>
                          <th className="py-3 px-4 font-semibold">Role</th>
                          <th className="py-3 px-4 font-semibold">Status</th>
                          <th className="py-3 px-4 font-semibold">Last Login</th>
                          <th className="py-3 px-4 font-semibold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="text-[13px] text-foreground">
                        {deletedUsers.map((user) => {
                          const avatar = getAvatarColor(user.full_name);
                          const initials = getInitials(user.full_name);
                          const displayRole = (user.roles || []).length > 0 ? roleNameDisplay(user.roles[0]) : null;
                          const roleStyle = displayRole ? getRoleStyle(displayRole) : null;

                          return (
                            <tr key={user.id} className="border-b border-border/60 hover:bg-secondary/50 transition-colors opacity-75">
                              {/* USER */}
                              <td className="py-3 px-5">
                                <div className="flex items-center gap-3">
                                  <div
                                    className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold select-none"
                                    style={{ backgroundColor: avatar.bg, color: avatar.text }}
                                  >
                                    {initials}
                                  </div>
                                  <span className="font-semibold text-foreground whitespace-nowrap">{user.full_name}</span>
                                </div>
                              </td>

                              {/* EMAIL */}
                              <td className="py-3 px-4 text-muted-foreground font-normal text-[13px] whitespace-nowrap">
                                {user.email}
                              </td>

                              {/* ROLE */}
                              <td className="py-3 px-4">
                                {displayRole && roleStyle ? (
                                  <span
                                    className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap"
                                    style={{ backgroundColor: roleStyle.bg, color: roleStyle.text }}
                                  >
                                    {displayRole}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground text-[11px]">No role</span>
                                )}
                              </td>

                              {/* STATUS */}
                              <td className="py-3 px-4">
                                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-amber-600">
                                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                                  Archived
                                </span>
                              </td>

                              {/* LAST LOGIN */}
                              <td className="py-3 px-4 text-muted-foreground text-[13px] whitespace-nowrap">
                                <div className="flex items-center gap-1.5">
                                  <Calendar className="h-3.5 w-3.5 text-muted-foreground/70 flex-shrink-0" />
                                  <span className="tabular-nums">
                                    {formatLastLogin(user.last_login_at)}
                                  </span>
                                </div>
                              </td>

                              {/* ACTIONS */}
                              <td className="py-3 px-4 text-right">
                                <div className="inline-flex items-center gap-1">
                                  <button 
                                    onClick={() => handleRestoreUser(user)}
                                    className="p-1.5 text-muted-foreground hover:text-brand-cyan hover:bg-brand-cyan/10 rounded-md transition-all duration-150 cursor-pointer"
                                    title="Restore User"
                                  >
                                    <Undo2 className="h-4 w-4" />
                                  </button>
                                  <button 
                                    onClick={() => handlePermanentDelete(user)}
                                    className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-all duration-150 cursor-pointer"
                                    title="Permanently Delete"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {deletedTotalPages > 1 && (
                    <div className="flex items-center justify-between px-5 py-3 border-t border-border">
                      <span className="text-[10px] text-muted-foreground font-medium">
                        Page {deletedPage} of {deletedTotalPages} ({deletedTotal} total)
                      </span>
                      <div className="flex space-x-2">
                        <button
                          disabled={deletedPage <= 1}
                          onClick={() => setDeletedPage(p => Math.max(1, p - 1))}
                          className="px-2.5 py-1 text-[10px] font-bold border border-border rounded-lg disabled:opacity-30 hover:bg-secondary transition-colors cursor-pointer"
                        >
                          Previous
                        </button>
                        <button
                          disabled={deletedPage >= deletedTotalPages}
                          onClick={() => setDeletedPage(p => p + 1)}
                          className="px-2.5 py-1 text-[10px] font-bold border border-border rounded-lg disabled:opacity-30 hover:bg-secondary transition-colors cursor-pointer"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Create / Edit Modal ────────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-5 py-4 bg-secondary border-b border-border flex justify-between items-center">
              <span className="font-semibold text-foreground text-sm flex items-center">
                <UserPlus className="h-4.5 w-4.5 mr-2 text-brand-purple" />
                <span>{modalType === 'create' ? 'Create System User' : 'Modify User Profile'}</span>
              </span>
              <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-muted-foreground transition-colors cursor-pointer">
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div>
                <label className="block text-[9px] font-semibold text-foreground uppercase tracking-wider mb-1.5">Full Name</label>
                <input 
                  type="text" 
                  value={form.full_name} 
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  placeholder="e.g. John Doe"
                  className="w-full px-3 py-2 border border-border rounded-lg text-xs bg-secondary text-foreground focus:outline-none focus:border-brand-accent transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-[9px] font-semibold text-foreground uppercase tracking-wider mb-1.5">Email Address</label>
                <input 
                  type="email" 
                  value={form.email} 
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="e.g. john@pulse.crm"
                  className="w-full px-3 py-2 border border-border rounded-lg text-xs bg-secondary text-foreground focus:outline-none focus:border-brand-accent transition-colors"
                  required
                  disabled={modalType === 'edit'}
                />
              </div>

              {modalType === 'create' && (
                <div>
                  <label className="block text-[9px] font-semibold text-foreground uppercase tracking-wider mb-1.5">Password</label>
                  <input 
                    type="text" 
                    value={form.password} 
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Min 8 chars, upper, lower, number, special"
                    className="w-full px-3 py-2 border border-border rounded-lg text-xs bg-secondary text-foreground focus:outline-none focus:border-brand-accent transition-colors"
                    required
                    minLength={8}
                  />
                </div>
              )}

              <div>
                <label className="block text-[9px] font-semibold text-foreground uppercase tracking-wider mb-1.5">
                  {modalType === 'create' ? 'Authorization Role' : 'Assign New Role (optional)'}
                </label>
                <select 
                  value={form.role_id} 
                  onChange={(e) => setForm({ ...form, role_id: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg text-xs bg-secondary text-foreground focus:outline-none focus:border-brand-accent transition-colors"
                >
                  <option value="">{modalType === 'create' ? '— Select Role —' : '— Keep current role —'}</option>
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>{r.display_name}</option>
                  ))}
                </select>
              </div>

              <div className="pt-4 border-t border-border flex justify-end space-x-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 border border-border hover:bg-secondary text-xs font-bold rounded-lg text-foreground transition-colors cursor-pointer"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={saving}
                  className="px-3.5 py-1.5 bg-brand-purple hover:bg-brand-purple/90 disabled:opacity-50 text-primary-foreground text-xs font-bold rounded-lg transition-colors cursor-pointer inline-flex items-center space-x-1"
                >
                  {saving && <Loader2 className="h-3 w-3 animate-spin" />}
                  <span>{saving ? 'Saving...' : 'Save Profile'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
