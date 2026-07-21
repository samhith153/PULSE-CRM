'use client';

import React, { useState } from 'react';
import { Plus, Search, Trash2, FileText, Download, UploadCloud, X, Calendar, User, Eye } from 'lucide-react';

interface DocumentItem {
  id: number;
  name: string;
  type: 'SLA' | 'Proposal' | 'Contract' | 'NDA';
  size: string;
  associatedDeal: string;
  uploadedBy: string;
  uploadedAt: string;
  status: 'Signed' | 'Draft' | 'Sent' | 'Approved';
}

export default function DocumentsView() {
  const [documents, setDocuments] = useState<DocumentItem[]>([
    { id: 1, name: "TechCorp_Enterprise_SLA_Draft.pdf", type: "SLA", size: "2.4 MB", associatedDeal: "Database Cloud Migration", uploadedBy: "Sarah Johnson", uploadedAt: "2025-05-12", status: "Draft" },
    { id: 2, name: "MedSaaS_Solutions_ComplianceNDA_Signed.pdf", type: "NDA", size: "1.1 MB", associatedDeal: "Compliance Suite Expansion", uploadedBy: "Alex Johnson", uploadedAt: "2025-05-10", status: "Signed" },
    { id: 3, name: "SpartaCreative_SSOIntegration_Proposal.pdf", type: "Proposal", size: "3.8 MB", associatedDeal: "SSO Integration Scope", uploadedBy: "Sarah Johnson", uploadedAt: "2025-05-09", status: "Sent" },
    { id: 4, name: "EmpiricLogistics_GlobalAPI_Contract_Final.pdf", type: "Contract", size: "4.5 MB", associatedDeal: "Global Logistics API", uploadedBy: "David Wilson", uploadedAt: "2025-05-08", status: "Approved" },
    { id: 5, name: "ByteSized_Co_CustomAnalytics_SLA_Signed.pdf", type: "SLA", size: "2.2 MB", associatedDeal: "Analytics Custom Tier", uploadedBy: "Alex Johnson", uploadedAt: "2025-05-07", status: "Signed" }
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'SLA' as DocumentItem['type'], associatedDeal: '', status: 'Draft' as DocumentItem['status'] });

  const documentTypes: DocumentItem['type'][] = ['SLA', 'Proposal', 'Contract', 'NDA'];

  const filteredDocs = documents.filter(d => {
    const matchesSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase()) || d.associatedDeal.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'All' || d.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newDoc: DocumentItem = {
      id: Date.now(),
      name: form.name.endsWith('.pdf') ? form.name : `${form.name}.pdf`,
      type: form.type,
      size: `${(Math.random() * 3 + 1).toFixed(1)} MB`,
      associatedDeal: form.associatedDeal || 'General / Unlinked',
      uploadedBy: "Alex Johnson",
      uploadedAt: new Date().toISOString().split('T')[0],
      status: form.status
    };
    setDocuments([newDoc, ...documents]);
    setIsUploadOpen(false);
    setForm({ name: '', type: 'SLA', associatedDeal: '', status: 'Draft' });
  };

  const handleDelete = (id: number) => {
    setDocuments(documents.filter(d => d.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-brand-border-purple/20 rounded-xl p-5 shadow-sm/5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
          <div>
            <h2 className="font-sans text-2xl text-brand-heading font-bold">Documents Library</h2>
            <p className="text-[11px] text-brand-text/60 mt-0.5 font-bold">Upload proposal attachments, manage signed NDAs, SLA drafts, and legal contracts linked to active deals.</p>
          </div>
          <button 
            onClick={() => setIsUploadOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-brand-accent hover:bg-brand-accent-hover text-white rounded-lg text-xs font-bold shadow-sm/10 transition-colors cursor-pointer"
          >
            <UploadCloud className="h-3.5 w-3.5" strokeWidth={2.25} />
            <span>Upload Document</span>
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          <div className="relative">
            <span className="absolute inset-y-0 left-2.5 flex items-center pointer-events-none text-slate-400">
              <Search className="h-3.5 w-3.5" />
            </span>
            <input 
              type="text" 
              placeholder="Search by name, associated deal..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 border border-brand-border-purple/35 rounded-lg text-xs text-brand-text bg-slate-50/50 focus:bg-white placeholder-slate-400 focus:outline-none"
            />
          </div>

          <div>
            <select 
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="w-full px-3 py-1.5 border border-brand-border-purple/35 bg-white text-brand-text/80 rounded-lg text-xs focus:outline-none cursor-pointer"
            >
              <option value="All">All Types</option>
              {documentTypes.map(type => <option key={type} value={type}>{type}</option>)}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-brand-border-purple/20 text-[9px] uppercase font-extrabold tracking-wider text-brand-heading pb-2">
                <th className="pb-2">Document Name</th>
                <th className="pb-2">Type</th>
                <th className="pb-2">Size</th>
                <th className="pb-2">Associated Deal</th>
                <th className="pb-2">Uploaded By</th>
                <th className="pb-2">Status</th>
                <th className="pb-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border-purple/15 text-xs text-brand-text font-semibold">
              {filteredDocs.length > 0 ? (
                filteredDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="py-3 pr-4 max-w-[220px]">
                      <div className="font-extrabold text-brand-heading flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                        <span className="truncate">{doc.name}</span>
                      </div>
                    </td>
                    <td className="py-3">
                      <span className="font-bold text-brand-text/80">{doc.type}</span>
                    </td>
                    <td className="py-3 font-mono text-[10px] text-slate-500">{doc.size}</td>
                    <td className="py-3 font-medium text-brand-heading truncate max-w-[150px]" title={doc.associatedDeal}>
                      {doc.associatedDeal}
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center space-x-1.5">
                        <User className="h-3 w-3 text-slate-400" />
                        <span className="text-[10px] font-bold text-brand-text/75">{doc.uploadedBy}</span>
                      </div>
                      <div className="text-[9px] text-slate-400 font-semibold flex items-center mt-0.5">
                        <Calendar className="h-2.5 w-2.5 mr-0.5" />
                        {doc.uploadedAt}
                      </div>
                    </td>
                    <td className="py-3">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        doc.status === 'Signed' || doc.status === 'Approved' ? 'text-emerald-700 bg-emerald-50 border border-emerald-100' :
                        doc.status === 'Sent' ? 'text-indigo-700 bg-indigo-50 border border-indigo-100' : 'text-slate-650 bg-slate-50 border border-slate-100'
                      }`}>
                        {doc.status}
                      </span>
                    </td>
                    <td className="py-3 text-right space-x-1 whitespace-nowrap">
                      <button className="p-1 hover:text-brand-accent text-slate-400 rounded transition-colors" title="View Document">
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      <button className="p-1 hover:text-brand-accent text-slate-400 rounded transition-colors" title="Download Document">
                        <Download className="h-3.5 w-3.5" />
                      </button>
                      <button 
                        onClick={() => handleDelete(doc.id)}
                        className="p-1 hover:text-rose-600 text-slate-400 rounded transition-colors"
                        title="Delete Document"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400 font-medium">
                    No documents found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload Modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-brand-border-purple/25 rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-3.5 border-b border-brand-border-purple/15 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-brand-heading text-sm">Upload Legal or Sales Document</h3>
              <button onClick={() => setIsUploadOpen(false)} className="text-slate-400 hover:text-brand-text p-1 cursor-pointer"><X className="h-4.5 w-4.5" /></button>
            </div>
            <form onSubmit={handleUploadSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Document Name (without extension)</label>
                <input type="text" required placeholder="e.g., TechCorp_SLA_Signed" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-3 py-1.5 border border-brand-border-purple/35 rounded-lg text-xs text-brand-text focus:outline-none focus:ring-1 focus:ring-brand-accent/20" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Document Type</label>
                  <select value={form.type} onChange={e => setForm({...form, type: e.target.value as any})} className="w-full px-2 py-1.5 border border-brand-border-purple/35 bg-white text-brand-text rounded-lg text-xs focus:outline-none cursor-pointer">
                    {documentTypes.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Status</label>
                  <select value={form.status} onChange={e => setForm({...form, status: e.target.value as any})} className="w-full px-2 py-1.5 border border-brand-border-purple/35 bg-white text-brand-text rounded-lg text-xs focus:outline-none cursor-pointer">
                    <option>Draft</option>
                    <option>Sent</option>
                    <option>Signed</option>
                    <option>Approved</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Associated Pipeline Deal</label>
                <input type="text" placeholder="e.g., Database Cloud Migration" value={form.associatedDeal} onChange={e => setForm({...form, associatedDeal: e.target.value})} className="w-full px-3 py-1.5 border border-brand-border-purple/35 rounded-lg text-xs text-brand-text focus:outline-none focus:ring-1 focus:ring-brand-accent/20" />
              </div>
              <div className="pt-3 border-t border-brand-border-purple/15 flex justify-end space-x-2.5">
                <button type="button" onClick={() => setIsUploadOpen(false)} className="px-4 py-1.5 border border-brand-border-purple/30 rounded-lg text-xs font-bold text-brand-text/75 hover:bg-slate-50 cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-brand-accent hover:bg-brand-accent-hover text-white rounded-lg text-xs font-bold shadow-sm/10 cursor-pointer">Upload File</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
