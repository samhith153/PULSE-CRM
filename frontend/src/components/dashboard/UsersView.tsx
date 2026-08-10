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
  Undo2
} from 'lucide-react';
import { 
  UserData, RoleData, 
  getUsers, createUser, updateUser, deleteUser,
  activateUser, deactivateUser, assignUserRole, resetUserPassword,
  getRoles, getDeletedUsers, restoreUser, permanentDeleteUser
} from '@/utils/api';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { toast } from '@/lib/toast';

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

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-sans text-foreground tracking-tight font-bold">
            User Profiles Management
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-1 font-medium tracking-wide">
            Provision user configurations, restrict roles authorization mapping, and cycle passwords.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={loadUsers}
            className="inline-flex items-center space-x-1.5 px-3 py-2 border border-border hover:bg-secondary rounded-lg text-xs font-bold text-muted-foreground transition cursor-pointer"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
          <button 
            onClick={handleOpenCreate}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-brand-purple hover:bg-brand-purple/90 text-primary-foreground rounded-lg text-xs font-semibold transition duration-200 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Create User</span>
          </button>
        </div>
      </div>

      {/* Active Users */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <h3 className="font-semibold text-foreground text-sm flex items-center">
          <Users className="h-4.5 w-4.5 mr-2 text-brand-purple" />
          <span>Active Organization Users</span>
          {loading && <Loader2 className="h-3.5 w-3.5 ml-2 animate-spin text-muted-foreground" />}
        </h3>

        {loading && users.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground text-xs font-medium">
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Loading users...
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-xs font-medium">
            No users found. Create one to get started.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border text-[11px] uppercase font-black tracking-wider text-foreground bg-muted/40">
                    <th className="py-2.5">User</th>
                    <th className="py-2.5">Email</th>
                    <th className="py-2.5">Authorization Role</th>
                    <th className="py-2.5">Status</th>
                    <th className="py-2.5">Last Login</th>
                    <th className="py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-xs font-semibold text-foreground">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-secondary transition-colors">
                      <td className="py-3 font-semibold">{user.full_name}</td>
                      <td className="py-3 text-muted-foreground">{user.email}</td>
                      <td className="py-3">
                        {(user.roles || []).length > 0 ? (
                          <span className="bg-secondary text-foreground px-2 py-0.5 rounded text-[9px] font-semibold">
                            {roleNameDisplay(user.roles[0])}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-[9px]">No role</span>
                        )}
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wide ${
                          user.is_active 
                            ? 'bg-brand-cyan/15 text-brand-cyan' 
                            : 'bg-destructive/10 text-destructive'
                        }`}>
                          {user.is_active ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="py-3 text-muted-foreground tabular-nums">
                        {user.last_login_at 
                          ? new Date(user.last_login_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                          : 'Never'}
                      </td>
                      <td className="py-3 text-right space-x-1 whitespace-nowrap">
                        <button 
                          onClick={() => handleOpenEdit(user)}
                          className="p-1 text-muted-foreground hover:text-brand-purple rounded hover:bg-secondary transition cursor-pointer inline-block"
                          title="Edit Profile"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleToggleStatus(user)}
                          className={`p-1 rounded hover:bg-secondary transition cursor-pointer inline-block ${
                            user.is_active ? 'text-destructive hover:text-destructive' : 'text-brand-cyan hover:text-brand-cyan'
                          }`}
                          title={user.is_active ? 'Disable User' : 'Enable User'}
                        >
                          <Ban className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleResetPassword(user)}
                          className="p-1 text-muted-foreground hover:text-amber-500 rounded hover:bg-secondary transition cursor-pointer inline-block"
                          title="Reset Password"
                        >
                          <Key className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteUser(user)}
                          className="p-1 text-muted-foreground hover:text-destructive rounded hover:bg-secondary transition cursor-pointer inline-block"
                          title={isAdmin ? 'Permanently Delete' : 'Deactivate User'}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-3 border-t border-border">
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

      {/* Archived Users Section — Admin Only */}
      {isAdmin && (
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className="w-full flex items-center justify-between text-left cursor-pointer"
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
            <span className="text-xs text-muted-foreground">
              {showArchived ? 'Hide' : 'Show'}
            </span>
          </button>

          {showArchived && (
            <>
              {deletedUsers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-xs font-medium">
                  No archived users.
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-border text-[11px] uppercase font-black tracking-wider text-foreground bg-muted/40">
                          <th className="py-2.5">User</th>
                          <th className="py-2.5">Email</th>
                          <th className="py-2.5">Role</th>
                          <th className="py-2.5">Status</th>
                          <th className="py-2.5">Last Login</th>
                          <th className="py-2.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border text-xs font-semibold text-foreground">
                        {deletedUsers.map((user) => (
                          <tr key={user.id} className="hover:bg-secondary transition-colors opacity-75">
                            <td className="py-3 font-semibold">{user.full_name}</td>
                            <td className="py-3 text-muted-foreground">{user.email}</td>
                            <td className="py-3">
                              {(user.roles || []).length > 0 ? (
                                <span className="bg-secondary text-foreground px-2 py-0.5 rounded text-[9px] font-semibold">
                                  {roleNameDisplay(user.roles[0])}
                                </span>
                              ) : (
                                <span className="text-muted-foreground text-[9px]">No role</span>
                              )}
                            </td>
                            <td className="py-3">
                              <span className="px-2 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wide bg-amber-500/10 text-amber-500">
                                Archived
                              </span>
                            </td>
                            <td className="py-3 text-muted-foreground tabular-nums">
                              {user.last_login_at 
                                ? new Date(user.last_login_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                                : 'Never'}
                            </td>
                            <td className="py-3 text-right space-x-1 whitespace-nowrap">
                              <button 
                                onClick={() => handleRestoreUser(user)}
                                className="p-1 text-muted-foreground hover:text-brand-cyan rounded hover:bg-secondary transition cursor-pointer inline-block"
                                title="Restore User"
                              >
                                <Undo2 className="h-4 w-4" />
                              </button>
                              <button 
                                onClick={() => handlePermanentDelete(user)}
                                className="p-1 text-muted-foreground hover:text-destructive rounded hover:bg-secondary transition cursor-pointer inline-block"
                                title="Permanently Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {deletedTotalPages > 1 && (
                    <div className="flex items-center justify-between pt-3 border-t border-border">
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
