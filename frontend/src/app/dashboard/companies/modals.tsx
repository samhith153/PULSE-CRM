// frontend/src/app/dashboard/companies/modals.tsx
// ──────────────────────────────────────────────────────────────────────────────
// ALL MODALS — dynamically imported, loaded only when opened.
// ──────────────────────────────────────────────────────────────────────────────

'use client';

import { useState, FormEvent } from 'react';
import { X, Plus, Check } from 'lucide-react';
import type { Company } from '@/utils/api';

interface AddCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: FormEvent) => void;
  form: { name: string; industry: string; revenue: string; employees: number; owner: string; notes: string };
  setForm: (f: { name: string; industry: string; revenue: string; employees: number; owner: string; notes: string }) => void;
}

export function AddCompanyModal({ isOpen, onClose, onSubmit, form, setForm }: AddCompanyModalProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-ink/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-surface-1 border border-border-default rounded-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-3.5 border-b border-border-default flex justify-between items-center bg-surface-2">
          <h3 className="font-semibold text-text-primary text-sm">Add Company</h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary p-1 cursor-pointer"><X className="h-4.5 w-4.5" /></button>
        </div>
        <form onSubmit={e => { e.preventDefault(); onSubmit(e); setForm({ name: '', industry: '', revenue: '', employees: 10, owner: 'Sarah Johnson', notes: '' }); }} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-[9px] font-semibold text-text-primary uppercase tracking-wider mb-1">Company Name</label><input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-3 py-1.5 border border-border-default rounded-lg text-xs text-text-primary focus:outline-none bg-surface-0" /></div>
            <div><label className="block text-[9px] font-semibold text-text-primary uppercase tracking-wider mb-1">Industry</label><input type="text" required placeholder="e.g. Software" value={form.industry} onChange={e => setForm({...form, industry: e.target.value})} className="w-full px-3 py-1.5 border border-border-default rounded-lg text-xs text-text-primary focus:outline-none bg-surface-0" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-[9px] font-semibold text-text-primary uppercase tracking-wider mb-1">Revenue</label><input type="text" placeholder="e.g. ₹5,000,000" value={form.revenue} onChange={e => setForm({...form, revenue: e.target.value})} className="w-full px-3 py-1.5 border border-border-default rounded-lg text-xs text-text-primary focus:outline-none bg-surface-0" /></div>
            <div><label className="block text-[9px] font-semibold text-text-primary uppercase tracking-wider mb-1">Employees</label><input type="number" value={form.employees} onChange={e => setForm({...form, employees: Number(e.target.value)})} className="w-full px-3 py-1.5 border border-border-default rounded-lg text-xs text-text-primary focus:outline-none bg-surface-0" /></div>
          </div>
          <div><label className="block text-[9px] font-semibold text-text-primary uppercase tracking-wider mb-1">Owner</label><select value={form.owner} onChange={e => setForm({...form, owner: e.target.value})} className="w-full px-2 py-1.5 border border-border-default bg-surface-0 text-text-primary rounded-lg text-xs cursor-pointer"><option>Sarah Johnson</option><option>Alex Johnson</option></select></div>
          <div className="pt-3 border-t border-border-default flex justify-end space-x-2.5"><button type="button" onClick={onClose} className="px-4 py-1.5 border border-border-default rounded-lg text-xs font-semibold text-text-primary hover:bg-surface-2 cursor-pointer">Cancel</button><button type="submit" className="px-4 py-1.5 bg-accent-color hover:bg-accent-color/90 text-surface-0 rounded-lg text-xs font-bold cursor-pointer">Save Company</button></div>
        </form>
      </div>
    </div>
  );
}

interface EditCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: FormEvent) => void;
  form: { name: string; industry: string; revenue: string; employees: number; owner: string; notes: string };
  setForm: (f: { name: string; industry: string; revenue: string; employees: number; owner: string; notes: string }) => void;
}

export function EditCompanyModal({ isOpen, onClose, onSubmit, form, setForm }: EditCompanyModalProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-ink/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-surface-1 border border-border-default rounded-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-3.5 border-b border-border-default flex justify-between items-center bg-surface-2"><h3 className="font-semibold text-text-primary text-sm">Edit Company</h3><button onClick={onClose} className="text-text-muted hover:text-text-primary p-1 cursor-pointer"><X className="h-4.5 w-4.5" /></button></div>
        <form onSubmit={onSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-[9px] font-semibold text-text-primary uppercase tracking-wider mb-1">Company Name</label><input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-3 py-1.5 border border-border-default rounded-lg text-xs text-text-primary focus:outline-none bg-surface-0" /></div>
            <div><label className="block text-[9px] font-semibold text-text-primary uppercase tracking-wider mb-1">Industry</label><input type="text" required value={form.industry} onChange={e => setForm({...form, industry: e.target.value})} className="w-full px-3 py-1.5 border border-border-default rounded-lg text-xs text-text-primary focus:outline-none bg-surface-0" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-[9px] font-semibold text-text-primary uppercase tracking-wider mb-1">Revenue</label><input type="text" value={form.revenue} onChange={e => setForm({...form, revenue: e.target.value})} className="w-full px-3 py-1.5 border border-border-default rounded-lg text-xs text-text-primary focus:outline-none bg-surface-0" /></div>
            <div><label className="block text-[9px] font-semibold text-text-primary uppercase tracking-wider mb-1">Employees</label><input type="number" value={form.employees} onChange={e => setForm({...form, employees: Number(e.target.value)})} className="w-full px-3 py-1.5 border border-border-default rounded-lg text-xs text-text-primary focus:outline-none bg-surface-0" /></div>
          </div>
          <div className="pt-3 border-t border-border-default flex justify-end space-x-2.5"><button type="button" onClick={onClose} className="px-4 py-1.5 border border-border-default rounded-lg text-xs font-semibold text-text-primary hover:bg-surface-2 cursor-pointer">Cancel</button><button type="submit" className="px-4 py-1.5 bg-accent-color hover:bg-accent-color/90 text-surface-0 rounded-lg text-xs font-bold cursor-pointer">Save Changes</button></div>
        </form>
      </div>
    </div>
  );
}

interface AddContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: FormEvent) => void;
  contactName: string;
  setContactName: (name: string) => void;
}

export function AddContactModal({ isOpen, onClose, onSubmit, contactName, setContactName }: AddContactModalProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-ink/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-surface-1 border border-border-default rounded-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-3.5 border-b border-border-default flex justify-between items-center bg-surface-2"><h3 className="font-semibold text-text-primary text-sm">Link Contact</h3><button onClick={onClose} className="text-text-muted hover:text-text-primary p-1 cursor-pointer"><X className="h-4.5 w-4.5" /></button></div>
        <form onSubmit={e => { e.preventDefault(); onSubmit(e); setContactName(''); }} className="p-5 space-y-4">
          <div><label className="block text-[9px] font-semibold text-text-primary uppercase tracking-wider mb-1">Contact Name & Role</label><input type="text" required placeholder="e.g. Timothy Brown (CTO)" value={contactName} onChange={e => setContactName(e.target.value)} className="w-full px-3 py-1.5 border border-border-default rounded-lg text-xs text-text-primary focus:outline-none bg-surface-0" /></div>
          <div className="pt-3 border-t border-border-default flex justify-end space-x-2.5"><button type="button" onClick={onClose} className="px-4 py-1.5 border border-border-default rounded-lg text-xs font-semibold text-text-primary hover:bg-surface-2 cursor-pointer">Cancel</button><button type="submit" className="px-4 py-1.5 bg-accent-color hover:bg-accent-color/90 text-surface-0 rounded-lg text-xs font-bold cursor-pointer">Link Contact</button></div>
        </form>
      </div>
    </div>
  );
}