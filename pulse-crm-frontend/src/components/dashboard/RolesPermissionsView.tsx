'use client';

import React, { useState } from 'react';
import { 
  Shield, 
  Lock, 
  Check, 
  Save,
  Users,
  Info,
  Sparkles
} from 'lucide-react';

interface PermissionRow {
  key: string;
  category: string;
  categoryBg: string;
  name: string;
  description: string;
  admin: boolean;
  manager: boolean;
  representative: boolean;
}

export default function RolesPermissionsView() {
  const [matrix, setMatrix] = useState<PermissionRow[]>([
    { 
      key: "view_leads", 
      category: "CRM Data", 
      categoryBg: "bg-blue-50 text-blue-700 border-blue-200/60", 
      name: "View Leads & Contacts", 
      description: "Read base client records, activity logs, and interaction timelines", 
      admin: true, 
      manager: true, 
      representative: true 
    },
    { 
      key: "edit_leads", 
      category: "CRM Data", 
      categoryBg: "bg-blue-50 text-blue-700 border-blue-200/60", 
      name: "Write & Modify Leads", 
      description: "Create new leads or edit details and deal pipeline values", 
      admin: true, 
      manager: true, 
      representative: true 
    },
    { 
      key: "delete_leads", 
      category: "CRM Data", 
      categoryBg: "bg-blue-50 text-blue-700 border-blue-200/60", 
      name: "Delete Lead Records", 
      description: "Permanently purge lead profiles and historic activity logs", 
      admin: true, 
      manager: false, 
      representative: false 
    },
    
    { 
      key: "view_reports", 
      category: "Analytics", 
      categoryBg: "bg-purple-50 text-purple-700 border-purple-200/60", 
      name: "Access Standard Reports", 
      description: "View overall pipeline velocity and monthly revenue performance", 
      admin: true, 
      manager: true, 
      representative: true 
    },
    { 
      key: "view_forecasts", 
      category: "Analytics", 
      categoryBg: "bg-purple-50 text-purple-700 border-purple-200/60", 
      name: "Access Team Forecasts", 
      description: "Read AI forecasted projections and confidence indexes", 
      admin: true, 
      manager: true, 
      representative: false 
    },
    
    { 
      key: "manage_users", 
      category: "Administration", 
      categoryBg: "bg-amber-50 text-amber-700 border-amber-200/60", 
      name: "Manage System Users", 
      description: "Provision team accounts, assign roles, and reset credentials", 
      admin: true, 
      manager: false, 
      representative: false 
    },
    { 
      key: "edit_roles", 
      category: "Administration", 
      categoryBg: "bg-amber-50 text-amber-700 border-amber-200/60", 
      name: "Configure Permissions Matrix", 
      description: "Modify role authorization mapping and access bounds", 
      admin: true, 
      manager: false, 
      representative: false 
    },
    { 
      key: "system_settings", 
      category: "Administration", 
      categoryBg: "bg-amber-50 text-amber-700 border-amber-200/60", 
      name: "Modify System Settings", 
      description: "Configure API connection keys, SSO integrations, and security policies", 
      admin: true, 
      manager: false, 
      representative: false 
    }
  ]);

  const [toast, setToast] = useState<string | null>(null);

  const togglePermission = (idx: number, role: 'admin' | 'manager' | 'representative') => {
    // Admin permissions locked to true for safety
    if (role === 'admin') return;
    
    const updated = [...matrix];
    updated[idx][role] = !updated[idx][role];
    setMatrix(updated);
  };

  const handleSave = () => {
    setToast("Authorization matrix configurations saved successfully!");
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Toast Alert */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-2.5 text-xs font-bold animate-in fade-in slide-in-from-bottom-2 duration-300 border border-slate-800">
          <Check className="h-4 w-4 text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-sans text-brand-heading tracking-tight font-extrabold">
            Roles &amp; Permissions
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1 font-medium tracking-wide">
            Configure system authorization profiles and manage access bounds across all workspace roles.
          </p>
        </div>

        <button 
          onClick={handleSave}
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md self-start sm:self-center"
        >
          <Save className="h-4 w-4" />
          <span>Save Changes</span>
        </button>
      </div>

      {/* Roles Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { name: "System Administrator", usersCount: 2, desc: "Full root access permissions. Manage system configurations, user profiles, integrations, and core database settings." },
          { name: "Sales Manager", usersCount: 3, desc: "Manage team performance, review forecasted revenue metrics, sign off on deal stages, and generate audit logs." },
          { name: "Sales Representative", usersCount: 40, desc: "Standard workspace profile. Ingest leads, log activity calls, edit deals pipeline stages, and sync email accounts." }
        ].map((item, idx) => (
          <div 
            key={idx} 
            className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-2 hover:shadow-md hover:border-slate-300 transition-all duration-300"
          >
            <div className="flex justify-between items-center">
              <span className="text-sm font-extrabold text-slate-900">{item.name}</span>
              <span className="text-[10px] font-extrabold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full border border-indigo-100">
                {item.usersCount} Users
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed font-normal">{item.desc}</p>
          </div>
        ))}
      </div>

      {/* Permission Matrix Table */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-slate-900 text-base flex items-center">
            <Shield className="h-5 w-5 mr-2 text-indigo-600" />
            <span>Permission Access Matrix</span>
          </h3>
          <span className="text-xs font-medium text-slate-400">
            8 Total System Policy Rules
          </span>
        </div>

        <div className="overflow-x-auto select-none">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] uppercase font-black text-slate-400 tracking-wider">
                <th className="py-3 px-4">CATEGORY</th>
                <th className="py-3 px-4">PERMISSION NAME</th>
                <th className="py-3 px-4">DESCRIPTION</th>
                <th className="py-3 px-4 text-center w-28">ADMINISTRATOR</th>
                <th className="py-3 px-4 text-center w-28">SALES MANAGER</th>
                <th className="py-3 px-4 text-center w-28">SALES REP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {matrix.map((row, idx) => (
                <tr key={row.key} className="hover:bg-slate-50/80 transition-colors group">
                  
                  {/* Category Pill */}
                  <td className="py-4 px-4">
                    <span className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-extrabold border ${row.categoryBg}`}>
                      {row.category}
                    </span>
                  </td>

                  {/* Permission Name */}
                  <td className="py-4 px-4">
                    <span className="font-bold text-slate-900 text-xs block">{row.name}</span>
                  </td>

                  {/* Description */}
                  <td className="py-4 px-4">
                    <span className="text-slate-500 text-xs leading-normal block max-w-md">{row.description}</span>
                  </td>

                  {/* Admin Checkbox */}
                  <td className="py-4 px-4 text-center">
                    <button 
                      type="button" 
                      disabled
                      title="Admin access is permanently enabled"
                      className="h-5 w-5 rounded-md border border-indigo-200 bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto cursor-not-allowed opacity-75"
                    >
                      <Check className="h-3.5 w-3.5" strokeWidth={3} />
                    </button>
                  </td>

                  {/* Manager Checkbox */}
                  <td className="py-4 px-4 text-center">
                    <button 
                      type="button"
                      onClick={() => togglePermission(idx, 'manager')}
                      className={`h-5 w-5 rounded-md border transition-all flex items-center justify-center mx-auto cursor-pointer ${
                        row.manager 
                          ? 'border-indigo-600 bg-indigo-600 text-white shadow-2xs hover:bg-indigo-700' 
                          : 'border-slate-300 bg-white hover:border-indigo-400'
                      }`}
                    >
                      {row.manager && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                    </button>
                  </td>

                  {/* Representative Checkbox */}
                  <td className="py-4 px-4 text-center">
                    <button 
                      type="button"
                      onClick={() => togglePermission(idx, 'representative')}
                      className={`h-5 w-5 rounded-md border transition-all flex items-center justify-center mx-auto cursor-pointer ${
                        row.representative 
                          ? 'border-indigo-600 bg-indigo-600 text-white shadow-2xs hover:bg-indigo-700' 
                          : 'border-slate-300 bg-white hover:border-indigo-400'
                      }`}
                    >
                      {row.representative && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                    </button>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
