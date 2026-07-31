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
  Loader2
} from 'lucide-react';
import { 
  UserData, RoleData, 
  getUsers, createUser, updateUser, deleteUser,
  activateUser, deactivateUser, assignUserRole, resetUserPassword,
  getRoles
} from '@/utils/api';
import { toast } from '@/lib/toast';

export default function UsersView() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [roles, setRoles] = useState<RoleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit'>('create');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState<string | null>(null);

  const [form, setForm] = useState({
    full_name: '', email: '', password: '', role_id: '' as string
  });

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getUsers(page, pageSize);
      const data = Array.isArray(result) ? result : (result.data ?? []);
      const t = (result as any).total ?? data.length;
      setUsers(data);
      setTotal(t);
    } catch {
      toast.error('Failed to load users.');
    } finally {
      setLoading(false);
    }
  }, [page]);

  const loadRoles = useCallback(async () => {
    const FALLBACK: RoleData[] = [
      { id: 'admin', name: 'admin', display_name: 'Administrator', description: null, is_system: true, permissions: [] },
      { id: 'manager', name: 'manager', display_name: 'Sales Manager', description: null, is_system: true, permissions: [] },
      { id: 'sales_rep', name: 'sales_rep', display_name: 'Sales Representative', description: null, is_system: true, permissions: [] },
    ];
    try {
      const data = await getRoles();
      setRoles(Array.isArray(data) && data.length ? data : FALLBACK);
    } catch {
      // Network/permission failure shouldn't block user creation — show safe defaults.
      setRoles(FALLBACK);
    }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);
  useEffect(() => { loadRoles(); }, [loadRoles]);

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
      role_id: user.roles?.length ? String(user.roles[0]) : ''
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
    if (!window.confirm(`Permanently delete user "${user.full_name}"? This action cannot be undone.`)) return;
    try {
      await deleteUser(user.id);
      toast.success(`User "${user.full_name}" deleted.`);
      loadUsers();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete user.');
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

  return (
    <div className="space-y-6">
      {showPassword && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white border rounded-xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="font-extrabold text-brand-heading text-sm">New Password</h3>
            <p className="text-xs text-slate-600">Copy the temporary password below. The user will need to change it on next login.</p>
            <div className="bg-slate-50 border rounded-lg p-3 text-center">
              <code className="text-sm font-mono font-bold text-brand-accent break-all select-all">{showPassword}</code>
            </div>
            <button
              onClick={() => { navigator.clipboard.writeText(showPassword); setShowPassword(null); }}
              className="w-full px-3.5 py-2 bg-brand-accent hover:bg-brand-accent-hover text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
            >
              Copy &amp; Close
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-sans text-brand-heading tracking-tight font-bold">
            User Profiles Management
          </h1>
          <p className="text-xs md:text-sm text-brand-text/75 mt-1 font-medium tracking-wide">
            Provision user configurations, restrict roles authorization mapping, and cycle passwords.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={loadUsers}
            className="inline-flex items-center space-x-1.5 px-3 py-2 border border-brand-border-purple/35 hover:bg-slate-50 rounded-lg text-xs font-bold text-brand-text/80 transition-all cursor-pointer"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
          <button 
            onClick={handleOpenCreate}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-brand-accent hover:bg-brand-accent-hover text-white rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Create User</span>
          </button>
        </div>
      </div>

      <div className="bg-white border border-brand-border-purple/20 rounded-xl p-5 shadow-sm/5 space-y-4">
        <h3 className="font-extrabold text-brand-heading text-sm flex items-center">
          <Users className="h-4.5 w-4.5 mr-2 text-brand-accent" />
          <span>Active Organization Users</span>
          {loading && <Loader2 className="h-3.5 w-3.5 ml-2 animate-spin text-slate-400" />}
        </h3>

        {loading && users.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-slate-400 text-xs font-medium">
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Loading users...
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs font-medium">
            No users found. Create one to get started.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] uppercase font-extrabold text-black">
                    <th className="py-2.5">User</th>
                    <th className="py-2.5">Email</th>
                    <th className="py-2.5">Authorization Role</th>
                    <th className="py-2.5">Status</th>
                    <th className="py-2.5">Last Login</th>
                    <th className="py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-semibold text-brand-text">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 font-extrabold">{user.full_name}</td>
                      <td className="py-3 text-slate-500">{user.email}</td>
                      <td className="py-3">
                        {(user.roles || []).length > 0 ? (
                          <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-[9px] font-extrabold">
                            {roleNameDisplay(user.roles[0])}
                          </span>
                        ) : (
                          <span className="text-slate-300 text-[9px]">No role</span>
                        )}
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wide ${
                          user.is_active 
                            ? 'bg-emerald-50 text-emerald-700' 
                            : 'bg-rose-50 text-rose-700'
                        }`}>
                          {user.is_active ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="py-3 text-slate-450 tabular-nums">
                        {user.last_login_at 
                          ? new Date(user.last_login_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                          : 'Never'}
                      </td>
                      <td className="py-3 text-right space-x-1 whitespace-nowrap">
                        <button 
                          onClick={() => handleOpenEdit(user)}
                          className="p-1 text-slate-400 hover:text-brand-accent rounded hover:bg-slate-50 transition-all cursor-pointer inline-block"
                          title="Edit Profile"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleToggleStatus(user)}
                          className={`p-1 rounded hover:bg-slate-50 transition-all cursor-pointer inline-block ${
                            user.is_active ? 'text-rose-500 hover:text-rose-700' : 'text-emerald-500 hover:text-emerald-700'
                          }`}
                          title={user.is_active ? 'Disable User' : 'Enable User'}
                        >
                          <Ban className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleResetPassword(user)}
                          className="p-1 text-slate-400 hover:text-amber-500 rounded hover:bg-slate-50 transition-all cursor-pointer inline-block"
                          title="Reset Password"
                        >
                          <Key className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteUser(user)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-50 transition-all cursor-pointer inline-block"
                          title="Delete User"
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
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <span className="text-[10px] text-slate-400 font-medium">
                  Page {page} of {totalPages} ({total} total)
                </span>
                <div className="flex space-x-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    className="px-2.5 py-1 text-[10px] font-bold border border-slate-200 rounded-lg disabled:opacity-30 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Previous
                  </button>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage(p => p + 1)}
                    className="px-2.5 py-1 text-[10px] font-bold border border-slate-200 rounded-lg disabled:opacity-30 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-brand-border-purple/30 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-5 py-4 bg-slate-50 border-b border-brand-border-purple/15 flex justify-between items-center">
              <span className="font-extrabold text-brand-heading text-sm flex items-center">
                <UserPlus className="h-4.5 w-4.5 mr-2 text-brand-accent" />
                <span>{modalType === 'create' ? 'Create System User' : 'Modify User Profile'}</span>
              </span>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div>
                <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1.5">Full Name</label>
                <input 
                  type="text" 
                  value={form.full_name} 
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  placeholder="e.g. John Doe"
                  className="w-full px-3 py-2 border border-brand-border-purple/35 rounded-lg text-xs bg-slate-50/50 text-brand-text focus:outline-none focus:border-brand-accent transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1.5">Email Address</label>
                <input 
                  type="email" 
                  value={form.email} 
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="e.g. john@pulse.crm"
                  className="w-full px-3 py-2 border border-brand-border-purple/35 rounded-lg text-xs bg-slate-50/50 text-brand-text focus:outline-none focus:border-brand-accent transition-colors"
                  required
                  disabled={modalType === 'edit'}
                />
              </div>

              {modalType === 'create' && (
                <div>
                  <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1.5">Password</label>
                  <input 
                    type="text" 
                    value={form.password} 
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Min 8 chars, upper, lower, number, special"
                    className="w-full px-3 py-2 border border-brand-border-purple/35 rounded-lg text-xs bg-slate-50/50 text-brand-text focus:outline-none focus:border-brand-accent transition-colors"
                    required
                    minLength={8}
                  />
                </div>
              )}

              <div>
                <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1.5">
                  {modalType === 'create' ? 'Authorization Role' : 'Assign New Role (optional)'}
                </label>
                <select 
                  value={form.role_id} 
                  onChange={(e) => setForm({ ...form, role_id: e.target.value })}
                  className="w-full px-3 py-2 border border-brand-border-purple/35 rounded-lg text-xs bg-slate-50/50 text-brand-text focus:outline-none focus:border-brand-accent transition-colors"
                >
                  <option value="">{modalType === 'create' ? '— Select Role —' : '— Keep current role —'}</option>
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>{r.display_name}</option>
                  ))}
                </select>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-xs font-bold rounded-lg text-brand-text transition-colors cursor-pointer"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={saving}
                  className="px-3.5 py-1.5 bg-brand-accent hover:bg-brand-accent-hover disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer inline-flex items-center space-x-1"
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
