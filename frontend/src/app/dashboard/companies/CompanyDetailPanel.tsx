// frontend/src/app/dashboard/companies/CompanyDetailPanel.tsx
// ──────────────────────────────────────────────────────────────────────────────
// PURE PRESENTATIONAL — right sidebar detail panel for company.
// ──────────────────────────────────────────────────────────────────────────────

import { 
  Building2, Trash2, X, Users, PlusCircle, 
  Paperclip, ShieldAlert, Clock, IndianRupee, Briefcase
} from 'lucide-react';

import type { UICompany } from '@/lib/api-server';

interface CompanyDetailPanelProps {
  company: UICompany;
  formatCompanyRevenue: (val: string | number) => string;
  onClose: () => void;
  onDelete: (id: number | string) => void;
  onAddContact: () => void;
}

export default function CompanyDetailPanel({ 
  company, formatCompanyRevenue, onClose, onDelete, onAddContact 
}: CompanyDetailPanelProps) {
  return (
    <div className="bg-surface-1 border border-border-default rounded-2xl p-5 sticky top-20">
      <div className="flex items-center justify-between pb-3 border-b border-border-default">
        <div className="flex items-center space-x-2.5">
          <div className="h-8.5 w-8.5 rounded-lg bg-surface-2 border border-border-default flex items-center justify-center text-accent-color">
            <Building2 className="h-4.5 w-4.5" />
          </div>
          <div>
            <h3 className="font-semibold text-text-primary text-sm">{company.name}</h3>
            <p className="text-[10px] text-text-muted font-semibold">{company.industry}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={() => onDelete(company.id)} className="p-1 bg-surface-2 hover:bg-status-danger-bg border border-border-default rounded text-text-muted hover:text-status-danger-text transition duration-200 cursor-pointer" title="Delete Company" aria-label="Delete Company"><Trash2 className="h-4 w-4" /></button>
          <button onClick={onClose} className="p-1 bg-surface-2 hover:bg-surface-2 border border-border-default rounded text-text-muted hover:text-text-primary transition duration-200 cursor-pointer" title="Close Summary" aria-label="Close Summary"><X className="h-4 w-4" /></button>
        </div>
      </div>

      <div className="py-3 space-y-2.5 text-[11px] font-semibold border-b border-border-default">
        <div className="flex justify-between"><span className="text-text-muted">Owner</span><span className="text-text-primary">{company.owner}</span></div>
        <div className="flex justify-between"><span className="text-text-muted">Revenue Size</span><span className="text-text-muted tabular-nums">{formatCompanyRevenue(company.revenue)}</span></div>
        <div className="flex justify-between"><span className="text-text-muted">Employees</span><span className="text-text-muted tabular-nums">{company.employees}</span></div>
      </div>

      {/* Contacts list */}
      <div className="py-3 border-b border-border-default">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-[10px] font-semibold text-text-primary uppercase tracking-wider">Company Contacts</h4>
          <button onClick={onAddContact} className="text-accent-color hover:text-accent-color/80 inline-flex items-center space-x-0.5 text-[10px] font-bold cursor-pointer"><PlusCircle className="h-3 w-3" /><span>Add Link</span></button>
        </div>
        <div className="space-y-1.5">
          {company.contacts.length > 0 ? (
            company.contacts.map((c, i) => (
              <div key={i} className="text-[11px] text-text-primary font-semibold flex items-center">
                <Users className="h-3 w-3 mr-1.5 text-text-muted" />{c}
              </div>
            ))
          ) : (
            <p className="text-text-muted text-[10px] font-semibold">No contacts linked yet.</p>
          )}
        </div>
      </div>

      {/* Notes */}
      <div className="py-3 border-b border-border-default">
        <h4 className="text-[10px] font-semibold text-text-primary uppercase tracking-wider mb-1.5">Notes</h4>
        <p className="text-[11px] text-text-muted leading-relaxed font-semibold bg-surface-2 p-2 border border-border-default rounded-lg">{company.notes || 'No internal notes saved.'}</p>
      </div>

      {/* Timeline & Files */}
      <div className="pt-3 space-y-4">
        <div>
          <h4 className="text-[10px] font-semibold text-text-primary uppercase tracking-wider mb-2">Recent Timeline</h4>
          <div className="space-y-2">
            {company.timeline.map((item) => (
              <div key={item.id} className="text-[10px] font-semibold flex justify-between">
                <span className="text-text-muted">{item.title}</span>
                <span className="text-text-muted font-bold">{item.time}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-[10px] font-semibold text-text-primary uppercase tracking-wider mb-2">Uploaded Attachments</h4>
          <div className="space-y-1.5">
            {company.files.length > 0 ? (
              company.files.map((file) => (
                <div key={file.id} className="p-2 border border-border-default rounded bg-surface-2 flex justify-between items-center text-[10px] font-semibold">
                  <span className="flex items-center text-text-primary font-semibold"><Paperclip className="h-3.5 w-3.5 mr-1.5 text-text-muted" />{file.name}</span>
                  <span className="text-text-muted">{file.size}</span>
                </div>
              ))
            ) : (
              <p className="text-text-muted text-[10px] font-semibold">No files uploaded.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}