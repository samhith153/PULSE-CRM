'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Trash2, FileText, Download, UploadCloud, X, Calendar, User, Eye, Loader2 } from 'lucide-react';
import { DocumentData, getDocuments, uploadDocument, deleteDocument, getDocumentDownloadUrl, getDocumentSignedUrl } from '@/utils/api';
import { toast } from '@/lib/toast';

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function fileIcon(type: string) {
  if (type?.includes('pdf')) return '📄';
  if (type?.includes('word') || type?.includes('doc')) return '📝';
  if (type?.includes('sheet') || type?.includes('excel') || type?.includes('xls')) return '📊';
  if (type?.includes('image')) return '🖼️';
  return '📎';
}

const DOCUMENT_TYPES = ['SLA', 'Proposal', 'Contract', 'NDA'];

export default function DocumentsView({ onLoaded }: { onLoaded?: () => void } = {}) {
  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    type: 'SLA' as string,
    associatedDeal: '',
    status: 'Draft' as string
  });

  const loadDocuments = useCallback(async () => {
    try {
      const data = await getDocuments();
      setDocuments(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Failed to load documents.');
    } finally {
      setIsLoading(false);
      onLoaded?.();
    }
  }, []);

  useEffect(() => { loadDocuments(); }, [loadDocuments]);

  const filteredDocs = documents.filter(d => {
    const matchesSearch = d.file_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'All' || getFileCategory(d.file_type) === typeFilter;
    return matchesSearch && matchesType;
  });

  function getFileCategory(fileType: string): string {
    if (!fileType) return 'Other';
    if (fileType.includes('pdf')) return 'SLA';
    if (fileType.includes('word') || fileType.includes('doc')) return 'Proposal';
    if (fileType.includes('sheet') || fileType.includes('excel')) return 'Contract';
    return 'Other';
  }

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error('Please select a file to upload');
      return;
    }
    setUploading(true);
    try {
      await uploadDocument(selectedFile);
      toast.success(`Document "${selectedFile.name}" uploaded successfully.`);
      setIsUploadOpen(false);
      setSelectedFile(null);
      setForm({ name: '', type: 'SLA', associatedDeal: '', status: 'Draft' });
      loadDocuments();
    } catch (err: any) {
      toast.error(err?.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (doc: DocumentData) => {
    if (!confirm(`Delete "${doc.file_name}"? This cannot be undone.`)) return;
    try {
      await deleteDocument(doc.id);
      toast.success(`Document "${doc.file_name}" deleted.`);
      loadDocuments();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete document.');
    }
  };

  const handleView = async (doc: DocumentData) => {
    try {
      const { url } = await getDocumentSignedUrl(doc.id);
      window.open(url, '_blank');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to open document.');
    }
  };

  const handleDownload = async (doc: DocumentData) => {
    try {
      const res = await fetch(getDocumentDownloadUrl(doc.id), {
        headers: { Authorization: `Bearer ${localStorage.getItem('pulse_crm_token') || ''}` },
      });
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = doc.file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to download document.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-5 w-5 animate-spin text-text-muted mr-2" />
        <div className="text-text-muted text-xs font-medium">Loading documents...</div>
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
              placeholder="Search by name..."
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
              {DOCUMENT_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
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
                <th className="pb-2">Uploaded</th>
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
                        <span className="truncate">{doc.file_name}</span>
                      </div>
                    </td>
                    <td className="py-3">
                      <span className="font-bold text-text-muted">{getFileCategory(doc.file_type)}</span>
                    </td>
                    <td className="py-3 font-mono text-[10px] text-text-muted">{formatSize(doc.file_size_bytes)}</td>
                    <td className="py-3 pr-4">
                      <div className="text-[10px] font-bold text-text-muted flex items-center">
                        <Calendar className="h-2.5 w-2.5 mr-0.5" />
                        {new Date(doc.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
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
                        onClick={() => handleDelete(doc)}
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
                  <td colSpan={5} className="text-center py-8 text-text-muted font-medium">
                    No documents found. Upload one to get started.
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
              <h3 className="font-bold text-text-primary text-sm">Upload Document</h3>
              <button onClick={() => setIsUploadOpen(false)} className="text-text-muted hover:text-text-primary p-1 cursor-pointer">
                <X className="h-4.5 w-4.5" />
              </button>
            </div>
            <form onSubmit={handleUploadSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-[9px] font-semibold text-text-primary uppercase tracking-wider mb-1">Select File</label>
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
                    accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.png,.jpg,.jpeg"
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
                <p className="text-[8px] text-text-muted mt-1">Supported: PDF, DOC, DOCX, TXT, XLS, XLSX, PNG, JPG (Max 10MB)</p>
              </div>

              <div className="pt-3 border-t border-border-default flex justify-end space-x-2.5">
                <button type="button" onClick={() => setIsUploadOpen(false)} className="px-4 py-1.5 border border-border-default rounded-lg text-xs font-bold text-text-muted hover:bg-surface-2 cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={uploading || !selectedFile} className="px-4 py-1.5 bg-accent-color hover:bg-accent-color/90 disabled:opacity-50 text-surface-0 rounded-lg text-xs font-semibold/10 cursor-pointer inline-flex items-center gap-1.5">
                  {uploading && <Loader2 className="h-3 w-3 animate-spin" />}
                  {uploading ? 'Uploading...' : 'Upload File'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
