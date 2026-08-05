'use client';

import React, { useState, useEffect } from 'react';
import { UploadCloud, Trash2, Download, FileText, Loader2, AlertCircle } from 'lucide-react';
import { getDocuments, uploadDocument, deleteDocument, getDocumentDownloadUrl } from '@/utils/api';

interface AttachmentsTabProps {
  contactId?: string;
  dealId?: string;
  companyId?: string;
}

interface Attachment {
  id: string;
  file_name: string;
  file_type: string;
  file_size_bytes: number;
  created_at: string;
}

export default function AttachmentsTab({ contactId, dealId, companyId }: AttachmentsTabProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const fetchAttachments = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDocuments({
        contact_id: contactId,
        deal_id: dealId,
        company_id: companyId
      });
      setAttachments(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load attachments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttachments();
  }, [contactId, dealId, companyId]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await handleUpload(e.target.files[0]);
    }
  };

  const handleUpload = async (file: File) => {
    try {
      setUploading(true);
      setError(null);
      await uploadDocument(file, {
        contact_id: contactId,
        deal_id: dealId,
        company_id: companyId
      });
      await fetchAttachments();
    } catch (err: any) {
      setError(err?.message || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      await deleteDocument(id);
      setAttachments(attachments.filter((a) => a.id !== id));
    } catch (err: any) {
      setError(err?.message || 'Failed to delete file');
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 p-3 text-xs font-semibold text-rose-500 bg-rose-500/10 border border-rose-500/15 rounded-xl">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Upload Drag & Drop Zone */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-2xl p-6 text-center flex flex-col items-center justify-center transition-all ${
          dragActive
            ? 'border-brand-purple bg-brand-purple/[0.04]'
            : 'border-border bg-secondary/20 hover:bg-secondary/40'
        }`}
      >
        <input
          type="file"
          id="attachment-file-upload"
          className="hidden"
          onChange={handleFileChange}
          disabled={uploading}
        />
        <label
          htmlFor="attachment-file-upload"
          className="cursor-pointer flex flex-col items-center justify-center space-y-2 w-full h-full"
        >
          {uploading ? (
            <Loader2 className="size-8 text-brand-purple animate-spin" />
          ) : (
            <UploadCloud className="size-8 text-muted-foreground" />
          )}
          <div className="text-xs font-semibold text-foreground">
            {uploading ? 'Uploading attachment...' : 'Drag & drop file here or click to browse'}
          </div>
          <p className="text-[10px] text-muted-foreground/60">PDF, DOCX, CSV, PNG, JPG up to 10MB</p>
        </label>
      </div>

      {/* Attachments List */}
      <div className="space-y-2">
        <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
          Attachments ({attachments.length})
        </h4>

        {loading ? (
          <div className="flex items-center justify-center py-6 text-xs text-muted-foreground">
            <Loader2 className="size-4 mr-2 animate-spin" /> Loading attachments...
          </div>
        ) : attachments.length === 0 ? (
          <div className="text-center py-6 border border-border/50 rounded-xl text-xs text-muted-foreground font-semibold bg-secondary/10">
            No attachments yet — upload a document to get started
          </div>
        ) : (
          <div className="divide-y divide-border/40 border border-border/50 rounded-xl overflow-hidden bg-card">
            {attachments.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 hover:bg-secondary/30 transition-colors"
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <div className="size-8 rounded-lg bg-brand-purple/10 flex items-center justify-center text-brand-purple shrink-0">
                    <FileText className="size-4.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate max-w-[200px]" title={file.file_name}>
                      {file.file_name}
                    </p>
                    <p className="text-[10px] text-muted-foreground/70">
                      {formatSize(file.file_size_bytes)} • {new Date(file.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-1 shrink-0">
                  <a
                    href={getDocumentDownloadUrl(file.id)}
                    download
                    className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-all"
                    title="Download File"
                  >
                    <Download className="size-3.5" />
                  </a>
                  <button
                    onClick={() => handleDelete(file.id, file.file_name)}
                    className="p-1.5 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer"
                    title="Delete Attachment"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
