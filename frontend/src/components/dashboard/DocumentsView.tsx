'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Search, Trash2, FileText, Download, UploadCloud, X, Calendar, User, Eye } from 'lucide-react';
import { getDocuments, uploadDocument, deleteDocument, getDocumentDownloadUrl, getAuthHeaders } from '@/utils/api';

interface DocumentItem {
  id: string;
  name: string;
  type: 'SLA' | 'Proposal' | 'Contract' | 'NDA' | string;
  size: string;
  fileSize?: number;
  associatedDeal: string;
  uploadedBy: string;
  uploadedAt: string;
  status: 'Signed' | 'Draft' | 'Sent' | 'Approved';
  dataUrl?: string;
}

const STORAGE_KEY = 'pulse-crm-documents';

function loadDocuments(): DocumentItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveDocuments(docs: DocumentItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

const SEED_DOCS: DocumentItem[] = [
  { id: '1', name: 'TechCorp_SLA_2024', type: 'SLA', size: '245 KB', associatedDeal: 'Cloud Migration', uploadedBy: 'Sarah Johnson', uploadedAt: 'Jan 15, 2024', status: 'Signed' },
  { id: '2', name: 'DataFlow_Proposal_v2', type: 'Proposal', size: '1.2 MB', associatedDeal: 'Data Pipeline Setup', uploadedBy: 'Mike Chen', uploadedAt: 'Feb 3, 2024', status: 'Sent' },
  { id: '3', name: 'SecureNet_Contract', type: 'Contract', size: '890 KB', associatedDeal: 'Security Audit', uploadedBy: 'Sarah Johnson', uploadedAt: 'Feb 10, 2024', status: 'Draft' },
  { id: '4', name: 'Innovate_NDA', type: 'NDA', size: '156 KB', associatedDeal: 'General / Unlinked', uploadedBy: 'Alex Rivera', uploadedAt: 'Mar 1, 2024', status: 'Approved' },
];

export default function DocumentsView({ onLoaded }: { onLoaded?: () => void } = {}) {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [form, setForm] = useState({
    name: '',
    type: 'SLA' as DocumentItem['type'],
    associatedDeal: '',
    status: 'Draft' as DocumentItem['status']
  });

  const documentTypes: DocumentItem['type'][] = ['SLA', 'Proposal', 'Contract', 'NDA'];

  useEffect(() => {
    const stored = loadDocuments();
    if (stored.length === 0) {
      saveDocuments(SEED_DOCS);
      setDocuments(SEED_DOCS);
    } else {
      setDocuments(stored);
    }
    setIsLoading(false);
    onLoaded?.();
  }, []);

  const filteredDocs = documents.filter(d => {
    const matchesSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          d.associatedDeal.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'All' || d.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile) {
      alert('Please select a file to upload');
      return;
    }

    const dataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(selectedFile);
    });

    const newDoc: DocumentItem = {
      id: Date.now().toString(),
      name: form.name || selectedFile.name.replace(/\.[^/.]+$/, ''),
      type: form.type,
      size: formatSize(selectedFile.size),
      fileSize: selectedFile.size,
      associatedDeal: form.associatedDeal || 'General / Unlinked',
      uploadedBy: 'You',
      uploadedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      status: form.status,
      dataUrl,
    };

    const updated = [newDoc, ...documents];
    setDocuments(updated);
    saveDocuments(updated);
    setIsUploadOpen(false);
    setSelectedFile(null);
    setForm({ name: '', type: 'SLA', associatedDeal: '', status: 'Draft' });
  };

  const handleDelete = (id: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    const updated = documents.filter(d => d.id !== id);
    setDocuments(updated);
    saveDocuments(updated);
  };

  const handleDownload = (doc: DocumentItem) => {
    if (!doc.dataUrl) {
      alert('No file data available for this document.');
      return;
    }
    const link = document.createElement('a');
    link.href = doc.dataUrl;
    link.download = doc.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleView = (doc: DocumentItem) => {
    if (!doc.dataUrl) {
      alert('No file data available for this document.');
      return;
    }
    window.open(doc.dataUrl, '_blank');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading documents...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-surface-1 border border-border-default rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
          <div>
            <h2 className="font-sans text-2xl text-text-primary font-bold">Documents Library</h2>
            <p className="text-[11px] text-text-muted mt-0.5 font-bold">
              Upload proposal attachments, manage signed NDAs, SLA drafts, and legal contracts linked to active deals.
            </p>
          </div>
          <button
            onClick={() => setIsUploadOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-accent-color hover:bg-accent-color/90 text-surface-0 rounded-lg text-xs font-semibold/10 transition-colors cursor-pointer"
          >
            <UploadCloud className="h-3.5 w-3.5" strokeWidth={2.25} />
            <span>Upload Document</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          <div className="relative">
            <span className="absolute inset-y-0 left-2.5 flex items-center pointer-events-none text-text-muted">
              <Search className="h-3.5 w-3.5" />
            </span>
            <input
              type="text"
              placeholder="Search by name, associated deal..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 border border-border-default rounded-lg text-xs text-text-primary bg-surface-2 focus:bg-surface-1 placeholder-muted-foreground focus:outline-none"
            />
          </div>

          <div>
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="w-full px-3 py-1.5 border border-border-default bg-surface-1 text-text-muted rounded-lg text-xs focus:outline-none cursor-pointer"
            >
              <option value="All">All Types</option>
              {documentTypes.map(type => <option key={type} value={type}>{type}</option>)}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-border-default text-[9px] uppercase font-semibold tracking-wider text-text-primary pb-2">
                <th className="pb-2">Document Name</th>
                <th className="pb-2">Type</th>
                <th className="pb-2">Size</th>
                <th className="pb-2">Associated Deal</th>
                <th className="pb-2">Uploaded By</th>
                <th className="pb-2">Status</th>
                <th className="pb-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-xs text-text-primary font-semibold">
              {filteredDocs.length > 0 ? (
                filteredDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-surface-2/30 transition-colors">
                    <td className="py-3 pr-4 max-w-[220px]">
                      <div className="font-semibold text-text-primary flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5 text-destructive shrink-0" />
                        <span className="truncate">{doc.name}</span>
                      </div>
                    </td>
                    <td className="py-3">
                      <span className="font-bold text-text-muted">{doc.type}</span>
                    </td>
                    <td className="py-3 font-mono text-[10px] text-text-muted">{doc.size}</td>
                    <td className="py-3 font-medium text-text-primary truncate max-w-[150px]" title={doc.associatedDeal}>
                      {doc.associatedDeal}
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center space-x-1.5">
                        <User className="h-3 w-3 text-text-muted" />
                        <span className="text-[10px] font-bold text-text-muted">{doc.uploadedBy}</span>
                      </div>
                      <div className="text-[9px] text-text-muted font-semibold flex items-center mt-0.5">
                        <Calendar className="h-2.5 w-2.5 mr-0.5" />
                        {doc.uploadedAt}
                      </div>
                    </td>
                    <td className="py-3">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        doc.status === 'Signed' || doc.status === 'Approved' ? 'text-accent-color bg-accent-color/15 border border-accent-color/20' :
                        doc.status === 'Sent' ? 'text-accent-color bg-accent-color/10 border border-accent-color/15' : 'text-slate-650 bg-surface-2 border border-border-default'
                      }`}>
                        {doc.status}
                      </span>
                    </td>
                    <td className="py-3 text-right space-x-1 whitespace-nowrap">
                      <button
                        onClick={() => handleView(doc)}
                        className="p-1 hover:text-accent-color text-text-muted rounded transition-colors"
                        title="View Document"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDownload(doc)}
                        className="p-1 hover:text-accent-color text-text-muted rounded transition-colors"
                        title="Download Document"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="p-1 hover:text-destructive text-text-muted rounded transition-colors"
                        title="Delete Document"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-text-muted font-medium">
                    No documents found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isUploadOpen && (
        <div className="fixed inset-0 bg-ink/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-surface-1 border border-border-default rounded-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-3.5 border-b border-border-default flex justify-between items-center bg-surface-2">
              <h3 className="font-bold text-text-primary text-sm">Upload Legal or Sales Document</h3>
              <button onClick={() => setIsUploadOpen(false)} className="text-text-muted hover:text-text-primary p-1 cursor-pointer">
                <X className="h-4.5 w-4.5" />
              </button>
            </div>
            <form onSubmit={handleUploadSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-[9px] font-semibold text-text-primary uppercase tracking-wider mb-1">Upload File</label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    id="doc-file"
                    onChange={e => {
                      const f = e.target.files?.[0] || null;
                      setSelectedFile(f);
                      if (f) {
                        const nameWithoutExt = f.name.replace(/\.[^/.]+$/, '');
                        setForm({...form, name: nameWithoutExt });
                      }
                    }}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.txt,.xls,.xlsx"
                  />
                  <label htmlFor="doc-file" className="flex-1 flex items-center gap-2 px-3 py-2 border border-dashed border-border-default rounded-lg text-xs text-text-muted bg-surface-2 hover:bg-surface-2/50 cursor-pointer transition-colors">
                    <UploadCloud className="h-4 w-4 text-accent-color" />
                    <span>{selectedFile ? selectedFile.name : 'Click to select a file...'}</span>
                  </label>
                  {selectedFile && (
                    <button type="button" onClick={() => { setSelectedFile(null); }} className="p-1.5 text-text-muted hover:text-destructive rounded transition-colors cursor-pointer">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <p className="text-[8px] text-text-muted mt-1">Supported: PDF, DOC, DOCX, TXT, XLS, XLSX (Max 10MB)</p>
              </div>
              <div>
                <label className="block text-[9px] font-semibold text-text-primary uppercase tracking-wider mb-1">Document Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., TechCorp_SLA_Signed"
                  value={form.name}
                  onChange={e => setForm({...form, name: e.target.value})}
                  className="w-full px-3 py-1.5 border border-border-default rounded-lg text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-color/20"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-semibold text-text-primary uppercase tracking-wider mb-1">Document Type</label>
                  <select value={form.type} onChange={e => setForm({...form, type: e.target.value as any})} className="w-full px-2 py-1.5 border border-border-default bg-surface-1 text-text-primary rounded-lg text-xs focus:outline-none cursor-pointer">
                    {documentTypes.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-semibold text-text-primary uppercase tracking-wider mb-1">Status</label>
                  <select value={form.status} onChange={e => setForm({...form, status: e.target.value as any})} className="w-full px-2 py-1.5 border border-border-default bg-surface-1 text-text-primary rounded-lg text-xs focus:outline-none cursor-pointer">
                    <option>Draft</option>
                    <option>Sent</option>
                    <option>Signed</option>
                    <option>Approved</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[9px] font-semibold text-text-primary uppercase tracking-wider mb-1">Associated Pipeline Deal</label>
                <input
                  type="text"
                  placeholder="e.g., Database Cloud Migration"
                  value={form.associatedDeal}
                  onChange={e => setForm({...form, associatedDeal: e.target.value})}
                  className="w-full px-3 py-1.5 border border-border-default rounded-lg text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-color/20"
                />
              </div>
              <div className="pt-3 border-t border-border-default flex justify-end space-x-2.5">
                <button type="button" onClick={() => setIsUploadOpen(false)} className="px-4 py-1.5 border border-border-default rounded-lg text-xs font-bold text-text-muted hover:bg-surface-2 cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-1.5 bg-accent-color hover:bg-accent-color/90 text-surface-0 rounded-lg text-xs font-semibold/10 cursor-pointer">
                  Upload File
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
