'use client';

import React, { useState } from 'react';
import { X, Check } from 'lucide-react';

interface ReportBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (report: { title: string; time: string }) => void;
}

export default function ReportBuilderModal({ isOpen, onClose, onSave }: ReportBuilderModalProps) {
  const [title, setTitle] = useState('');
  const [metric, setMetric] = useState('Sales');
  const [range, setRange] = useState('This Month');
  const [chartType, setChartType] = useState('Line Chart');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave({
      title: title.trim(),
      time: `Generated just now`
    });

    setTitle('');
    setMetric('Sales');
    setRange('This Month');
    setChartType('Line Chart');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div 
        className="bg-card border border-border rounded-xl  w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-border flex justify-between items-center bg-secondary">
          <h3 className="font-bold text-foreground text-sm">Create Custom Report</h3>
          <button 
            onClick={onClose} 
            className="text-muted-foreground hover:text-muted-foreground p-1 rounded-md hover:bg-slate-150 transition-all duration-150 cursor-pointer"
            aria-label="Close modal"
          >
            <X className="h-4.5 w-4.5" strokeWidth={1.75} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-foreground uppercase tracking-wider mb-1.5">
              Report Title
            </label>
            <input
              type="text"
              required
              placeholder="e.g., Sales Performance Q3"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg text-xs text-muted-foreground placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-accent/15 focus:border-brand-accent transition-all duration-200"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-foreground uppercase tracking-wider mb-1.5">
                Metric Category
              </label>
              <select
                value={metric}
                onChange={(e) => setMetric(e.target.value)}
                className="w-full px-3 py-2 border border-border bg-card rounded-lg text-xs text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-accent/15 focus:border-brand-accent cursor-pointer"
              >
                <option>Sales</option>
                <option>Pipeline</option>
                <option>Activities</option>
                <option>Marketing</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-foreground uppercase tracking-wider mb-1.5">
                Time Range
              </label>
              <select
                value={range}
                onChange={(e) => setRange(e.target.value)}
                className="w-full px-3 py-2 border border-border bg-card rounded-lg text-xs text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-accent/15 focus:border-brand-accent cursor-pointer"
              >
                <option>This Week</option>
                <option>This Month</option>
                <option>This Quarter</option>
                <option>Custom Range</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-foreground uppercase tracking-wider mb-1.5">
              Visualization Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['Line Chart', 'Donut Chart', 'Funnel Chart'].map((type) => {
                const isSelected = chartType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setChartType(type)}
                    className={`py-1.5 px-1 text-center rounded-lg text-[10px] font-bold border transition-all duration-150 cursor-pointer ${
                      isSelected 
                        ? 'border-brand-accent bg-brand-sidebar-hover/20 text-brand-purple ' 
                        : 'border-border hover:border-border text-muted-foreground/75'
                    }`}
                  >
                    {type}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action buttons with elegant heights, padding, and accent colors */}
          <div className="pt-4 border-t border-border flex space-x-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 border border-border rounded-lg text-xs font-bold text-muted-foreground/75 hover:bg-secondary transition-all duration-150 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center space-x-1 px-4 py-1.5 bg-brand-purple hover:bg-brand-purple/90 text-primary-foreground rounded-lg text-xs font-bold  hover: transition-all duration-150 cursor-pointer"
            >
              <Check className="h-3.5 w-3.5" strokeWidth={2} />
              <span>Generate Report</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
