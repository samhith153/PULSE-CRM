'use client';

import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Key, 
  UserPlus, 
  Shield, 
  Mail, 
  X, 
  Check, 
  Ban,
  RefreshCw
} from 'lucide-react';

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  status: 'Active' | 'Disabled';
  lastLogin: string;
}

export default function UsersView() {
  const [users, setUsers] = useState<UserItem[]>([
    { id: "1", name: "Alex Johnson", email: "alex.johnson@pulse.crm", role: "Sales Manager", department: "Enterprise Acquisition", status: "Active", lastLogin: "12 mins ago" },
    { id: "2", name: "Sarah Johnson", email: "sarah.johnson@pulse.crm", role: "Sales Representative", department: "SaaS Sales East", status: "Active", lastLogin: "2 hours ago" },
    { id: "3", name: "David Wilson", email: "david.wilson@pulse.crm", role: "Sales Representative", department: "Enterprise Acquisition", status: "Active", lastLogin: "1 day ago" },
    { id: "4", name: "System Admin", email: "admin@pulse.crm", role: "Admin", department: "IT Operations", status: "Active", lastLogin: "3 mins ago" },
    { id: "5", name: "Lisa Martinez", email: "lisa.martinez@pulse.crm", role: "Sales Representative", department: "SaaS Sales West", status: "Disabled", lastLogin: "5 days ago" }
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit'>('create');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '', email: '', role: 'Sales Representative', department: 'Enterprise Acquisition'
  });

  const [toast, setToast] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleOpenCreate = () => {
    setModalType('create');
    setForm({ name: '', email: '', role: 'Sales Representative', department: 'Enterprise Acquisition' });
    setEditingUserId(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: UserItem) => {
    setModalType('edit');
    setForm({ name: user.name, email: user.email, role: user.role, department: user.department });
    setEditingUserId(user.id);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) return;

    if (modalType === 'create') {
      const newUser: UserItem = {
        id: Date.now().toString(),
        name: form.name,
        email: form.email,
        role: form.role,
        department: form.department,
        status: 'Active',
        lastLogin: 'Never'
      };
      setUsers([...users, newUser]);
      triggerToast(`User "${form.name}" has been created successfully!`);
    } else if (modalType === 'edit' && editingUserId) {
      setUsers(users.map(u => u.id === editingUserId ? { ...u, ...form } : u));
      triggerToast(`User "${form.name}" has been updated successfully!`);
    }

    setIsModalOpen(false);
  };

  const handleToggleStatus = (id: string) => {
    const user = users.find(u => u.id === id);
    if (!user) return;
    const newStatus = user.status === 'Active' ? 'Disabled' : 'Active';
    setUsers(users.map(u => u.id === id ? { ...u, status: newStatus } : u));
    triggerToast(`User "${user.name}" status updated to ${newStatus}.`);
  };

  const handleResetPassword = (name: string) => {
    triggerToast(`Temporary password reset link dispatched to ${name}'s email address.`);
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-55 bg-slate-900 dark:bg-brand-accent text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center space-x-2 text-xs font-bold animate-in fade-in slide-in-from-bottom-2 duration-300">
          <Check className="h-4 w-4" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-sans text-brand-heading tracking-tight font-bold">
            User Profiles Management
          </h1>
          <p className="text-xs md:text-sm text-brand-text/75 mt-1 font-medium tracking-wide">
            Provision user configurations, restrict roles authorization mapping, and cycle passwords.
          </p>
        </div>

        <button 
          onClick={handleOpenCreate}
          className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-brand-accent hover:bg-brand-accent-hover text-white rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer shadow-sm self-start sm:self-center"
        >
          <Plus className="h-4 w-4" />
          <span>Create User</span>
        </button>
      </div>

      {/* User list Table */}
      <div className="bg-white border border-brand-border-purple/20 rounded-xl p-5 shadow-sm/5 space-y-4">
        <h3 className="font-extrabold text-brand-heading text-sm flex items-center">
          <Users className="h-4.5 w-4.5 mr-2 text-brand-accent" />
          <span>Active Organization Users</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] uppercase font-extrabold text-slate-400">
                <th className="py-2.5">User</th>
                <th className="py-2.5">Email</th>
                <th className="py-2.5">Authorization Role</th>
                <th className="py-2.5">Department</th>
                <th className="py-2.5">Status</th>
                <th className="py-2.5">Last Login</th>
                <th className="py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-semibold text-brand-text">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/50">
                  <td className="py-3 font-extrabold">{user.name}</td>
                  <td className="py-3 text-slate-500">{user.email}</td>
                  <td className="py-3">
                    <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-[9px] font-extrabold">
                      {user.role}
                    </span>
                  </td>
                  <td className="py-3">{user.department}</td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wide ${
                      user.status === 'Active' 
                        ? 'bg-emerald-50 text-emerald-700' 
                        : 'bg-rose-50 text-rose-700'
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="py-3 text-slate-450 tabular-nums">{user.lastLogin}</td>
                  <td className="py-3 text-right space-x-1 whitespace-nowrap">
                    <button 
                      onClick={() => handleOpenEdit(user)}
                      className="p-1 text-slate-400 hover:text-brand-accent rounded hover:bg-slate-50 transition-all cursor-pointer inline-block"
                      title="Edit Profile"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleToggleStatus(user.id)}
                      className={`p-1 rounded hover:bg-slate-50 transition-all cursor-pointer inline-block ${
                        user.status === 'Active' ? 'text-rose-500 hover:text-rose-700' : 'text-emerald-500 hover:text-emerald-755'
                      }`}
                      title={user.status === 'Active' ? "Disable User" : "Enable User"}
                    >
                      <Ban className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleResetPassword(user.name)}
                      className="p-1 text-slate-400 hover:text-amber-500 rounded hover:bg-slate-50 transition-all cursor-pointer inline-block"
                      title="Reset Password"
                    >
                      <Key className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-brand-border-purple/30 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-5 py-4 bg-slate-50 border-b border-brand-border-purple/15 flex justify-between items-center">
              <span className="font-extrabold text-brand-heading text-sm flex items-center">
                <UserPlus className="h-4.5 w-4.5 mr-2 text-brand-accent" />
                <span>{modalType === 'create' ? 'Create System User' : 'Modify User profile'}</span>
              </span>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div>
                <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1.5">Full Name</label>
                <input 
                  type="text" 
                  value={form.name} 
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. John Doe"
                  className="w-full px-3 py-2 border border-brand-border-purple/35 rounded-lg text-xs bg-slate-50/50 text-brand-text focus:outline-none focus:border-brand-accent transition-colors"
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
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1.5">Authorization Role</label>
                  <select 
                    value={form.role} 
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="w-full px-3 py-2 border border-brand-border-purple/35 rounded-lg text-xs bg-slate-50/50 text-brand-text focus:outline-none focus:border-brand-accent transition-colors"
                  >
                    <option value="Admin">Admin</option>
                    <option value="Sales Manager">Sales Manager</option>
                    <option value="Sales Representative">Sales Representative</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1.5">Department</label>
                  <input 
                    type="text" 
                    value={form.department} 
                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                    placeholder="e.g. Enterprise Sales"
                    className="w-full px-3 py-2 border border-brand-border-purple/35 rounded-lg text-xs bg-slate-50/50 text-brand-text focus:outline-none focus:border-brand-accent transition-colors"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-xs font-bold rounded-lg text-brand-text transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-3.5 py-1.5 bg-brand-accent hover:bg-brand-accent-hover text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
