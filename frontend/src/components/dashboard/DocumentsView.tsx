'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Search, Trash2, FileText, Download, UploadCloud, X, Calendar, User, Eye } from 'lucide-react';

interface DocumentItem {
  id: number;
  name: string;
  type: 'SLA' | 'Proposal' | 'Contract' | 'NDA';
  size: string;
  fileSize?: number; // in bytes
  associatedDeal: string;
  uploadedBy: string;
  uploadedAt: string;
  status: 'Signed' | 'Draft' | 'Sent' | 'Approved';
  filePath?: string; // stored file path
  fileUrl?: string; // downloadable URL
}

export default function DocumentsView() {
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

  // Load documents on mount
  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/documents');
      if (response.ok) {
        const data = await response.json();
        setDocuments(data);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setIsLoading(false);
    }
  };

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

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('name', form.name || selectedFile.name.replace(/\.[^/.]+$/, ''));
    formData.append('type', form.type);
    formData.append('associatedDeal', form.associatedDeal || 'General / Unlinked');
    formData.append('status', form.status);

    try {
      const response = await fetch('/api/documents', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const newDoc = await response.json();
        setDocuments([newDoc, ...documents]);
        setIsUploadOpen(false);
        setSelectedFile(null);
        setForm({ name: '', type: 'SLA', associatedDeal: '', status: 'Draft' });
        // Refresh the list
        await fetchDocuments();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to upload document');
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      alert('Failed to upload document');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      const response = await fetch(`/api/documents/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setDocuments(documents.filter(d => d.id !== id));
      } else {
        alert('Failed to delete document');
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Failed to delete document');
    }
  };

  const handleDownload = async (doc: DocumentItem) => {
    try {
      const response = await fetch(`/api/documents/${doc.id}/download`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = doc.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        alert('Failed to download document');
      }
    } catch (error) {
      console.error('Error downloading document:', error);
      alert('Failed to download document');
    }
  };

  const handleView = async (doc: DocumentItem) => {
    try {
      const response = await fetch(`/api/documents/${doc.id}/download`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
        window.URL.revokeObjectURL(url);
      } else {
        alert('Failed to view document');
      }
    } catch (error) {
      console.error('Error viewing document:', error);
      alert('Failed to view document');
    }
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
      <div className="bg-card border border-border rounded-2xl p-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
          <div>
            <h2 className="font-sans text-2xl text-foreground font-bold">Documents Library</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5 font-bold">
              Upload proposal attachments, manage signed NDAs, SLA drafts, and legal contracts linked to active deals.
            </p>
          </div>
          <button 
            onClick={() => setIsUploadOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-brand-purple hover:bg-brand-purple/90 text-primary-foreground rounded-lg text-xs font-semibold/10 transition-colors cursor-pointer"
          >
            <UploadCloud className="h-3.5 w-3.5" strokeWidth={2.25} />
            <span>Upload Document</span>
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          <div className="relative">
            <span className="absolute inset-y-0 left-2.5 flex items-center pointer-events-none text-muted-foreground">
              <Search className="h-3.5 w-3.5" />
            </span>
            <input 
              type="text" 
              placeholder="Search by name, associated deal..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 border border-border rounded-lg text-xs text-foreground bg-secondary focus:bg-card placeholder-muted-foreground focus:outline-none"
            />
          </div>

          <div>
            <select 
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="w-full px-3 py-1.5 border border-border bg-card text-muted-foreground rounded-lg text-xs focus:outline-none cursor-pointer"
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
              <tr className="border-b border-border text-[9px] uppercase font-semibold tracking-wider text-foreground pb-2">
                <th className="pb-2">Document Name</th>
                <th className="pb-2">Type</th>
                <th className="pb-2">Size</th>
                <th className="pb-2">Associated Deal</th>
                <th className="pb-2">Uploaded By</th>
                <th className="pb-2">Status</th>
                <th className="pb-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-xs text-foreground font-semibold">
              {filteredDocs.length > 0 ? (
                filteredDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="py-3 pr-4 max-w-[220px]">
                      <div className="font-semibold text-foreground flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5 text-destructive shrink-0" />
                        <span className="truncate">{doc.name}</span>
                      </div>
                    </td>
                    <td className="py-3">
                      <span className="font-bold text-muted-foreground">{doc.type}</span>
                    </td>
                    <td className="py-3 font-mono text-[10px] text-muted-foreground">{doc.size}</td>
                    <td className="py-3 font-medium text-foreground truncate max-w-[150px]" title={doc.associatedDeal}>
                      {doc.associatedDeal}
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center space-x-1.5">
                        <User className="h-3 w-3 text-muted-foreground" />
                        <span className="text-[10px] font-bold text-muted-foreground">{doc.uploadedBy}</span>
                      </div>
                      <div className="text-[9px] text-muted-foreground font-semibold flex items-center mt-0.5">
                        <Calendar className="h-2.5 w-2.5 mr-0.5" />
                        {doc.uploadedAt}
                      </div>
                    </td>
                    <td className="py-3">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        doc.status === 'Signed' || doc.status === 'Approved' ? 'text-brand-cyan bg-brand-cyan/15 border border-brand-cyan/20' :
                        doc.status === 'Sent' ? 'text-brand-purple bg-brand-purple/10 border border-brand-purple/15' : 'text-slate-650 bg-secondary border border-border'
                      }`}>
                        {doc.status}
                      </span>
                    </td>
                    <td className="py-3 text-right space-x-1 whitespace-nowrap">
                      <button 
                        onClick={() => handleView(doc)}
                        className="p-1 hover:text-brand-purple text-muted-foreground rounded transition-colors" 
                        title="View Document"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      <button 
                        onClick={() => handleDownload(doc)}
                        className="p-1 hover:text-brand-purple text-muted-foreground rounded transition-colors" 
                        title="Download Document"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </button>
                      <button 
                        onClick={() => handleDelete(doc.id)}
                        className="p-1 hover:text-destructive text-muted-foreground rounded transition-colors"
                        title="Delete Document"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-muted-foreground font-medium">
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
        <div className="fixed inset-0 bg-ink/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-3.5 border-b border-border flex justify-between items-center bg-secondary">
              <h3 className="font-bold text-foreground text-sm">Upload Legal or Sales Document</h3>
              <button onClick={() => setIsUploadOpen(false)} className="text-muted-foreground hover:text-foreground p-1 cursor-pointer">
                <X className="h-4.5 w-4.5" />
              </button>
            </div>
            <form onSubmit={handleUploadSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-[9px] font-semibold text-foreground uppercase tracking-wider mb-1">Upload File</label>
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
                  <label htmlFor="doc-file" className="flex-1 flex items-center gap-2 px-3 py-2 border border-dashed border-border rounded-lg text-xs text-muted-foreground bg-secondary hover:bg-secondary/50 cursor-pointer transition-colors">
                    <UploadCloud className="h-4 w-4 text-brand-purple" />
                    <span>{selectedFile ? selectedFile.name : 'Click to select a file...'}</span>
                  </label>
                  {selectedFile && (
                    <button type="button" onClick={() => { setSelectedFile(null); }} className="p-1.5 text-muted-foreground hover:text-destructive rounded transition-colors cursor-pointer">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <p className="text-[8px] text-muted-foreground mt-1">Supported: PDF, DOC, DOCX, TXT, XLS, XLSX (Max 10MB)</p>
              </div>
              <div>
                <label className="block text-[9px] font-semibold text-foreground uppercase tracking-wider mb-1">Document Name</label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g., TechCorp_SLA_Signed" 
                  value={form.name} 
                  onChange={e => setForm({...form, name: e.target.value})} 
                  className="w-full px-3 py-1.5 border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-brand-purple/20" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-semibold text-foreground uppercase tracking-wider mb-1">Document Type</label>
                  <select value={form.type} onChange={e => setForm({...form, type: e.target.value as any})} className="w-full px-2 py-1.5 border border-border bg-card text-foreground rounded-lg text-xs focus:outline-none cursor-pointer">
                    {documentTypes.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-semibold text-foreground uppercase tracking-wider mb-1">Status</label>
                  <select value={form.status} onChange={e => setForm({...form, status: e.target.value as any})} className="w-full px-2 py-1.5 border border-border bg-card text-foreground rounded-lg text-xs focus:outline-none cursor-pointer">
                    <option>Draft</option>
                    <option>Sent</option>
                    <option>Signed</option>
                    <option>Approved</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[9px] font-semibold text-foreground uppercase tracking-wider mb-1">Associated Pipeline Deal</label>
                <input 
                  type="text" 
                  placeholder="e.g., Database Cloud Migration" 
                  value={form.associatedDeal} 
                  onChange={e => setForm({...form, associatedDeal: e.target.value})} 
                  className="w-full px-3 py-1.5 border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-brand-purple/20" 
                />
              </div>
              <div className="pt-3 border-t border-border flex justify-end space-x-2.5">
                <button type="button" onClick={() => setIsUploadOpen(false)} className="px-4 py-1.5 border border-border rounded-lg text-xs font-bold text-muted-foreground hover:bg-secondary cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-1.5 bg-brand-purple hover:bg-brand-purple/90 text-primary-foreground rounded-lg text-xs font-semibold/10 cursor-pointer">
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
