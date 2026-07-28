'use client';

import React, { useState, useMemo } from 'react';
import { 
  Flame, 
  Mail, 
  Phone, 
  Calendar, 
  Sparkles,
  Info 
} from 'lucide-react';

interface ActivityCell {
  dateStr: string;
  allCount: number;
  emails: number;
  calls: number;
  meetings: number;
}

export default function ActivityHeatmap() {
  const [filterType, setFilterType] = useState<'all' | 'emails' | 'calls' | 'meetings'>('all');
  const [hoveredCell, setHoveredCell] = useState<{
    cell: ActivityCell;
    x: number;
    y: number;
  } | null>(null);

  // Generate mock activity data for 16 weeks (112 days)
  const heatmapData = useMemo(() => {
    const data: ActivityCell[] = [];
    const today = new Date();
    // Start from 112 days ago
    const startDate = new Date();
    startDate.setDate(today.getDate() - 111);

    // Seed repeatable pseudorandom generator so it looks nice and doesn't flicker
    let seed = 42;
    const random = () => {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    };

    for (let i = 0; i < 112; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);

      // Determine typical CRM activity profiles
      const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;
      let emailWeight = isWeekend ? 0 : Math.floor(random() * 8);
      let callWeight = isWeekend ? 0 : Math.floor(random() * 6);
      let meetingWeight = isWeekend ? 0 : (random() > 0.7 ? Math.floor(random() * 3) : 0);

      // Occasionally add highly active spike days
      if (!isWeekend && random() > 0.9) {
        emailWeight += 8;
        callWeight += 5;
        meetingWeight += 2;
      }

      data.push({
        dateStr: currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        emails: emailWeight,
        calls: callWeight,
        meetings: meetingWeight,
        allCount: emailWeight + callWeight + meetingWeight
      });
    }
    return data;
  }, []);

  // Split cells into columns representing 16 weeks (each column has 7 cells)
  const columns = useMemo(() => {
    const cols: ActivityCell[][] = [];
    for (let i = 0; i < heatmapData.length; i += 7) {
      cols.push(heatmapData.slice(i, i + 7));
    }
    return cols;
  }, [heatmapData]);

  // Determine active count based on current filter type
  const getActiveCount = (cell: ActivityCell) => {
    if (filterType === 'emails') return cell.emails;
    if (filterType === 'calls') return cell.calls;
    if (filterType === 'meetings') return cell.meetings;
    return cell.allCount;
  };

  // Determine background color weight dynamically
  const getCellColor = (count: number) => {
    if (count === 0) return 'bg-slate-100 dark:bg-slate-800';
    
    // Scale color density based on filter type threshold
    let limit = 8;
    if (filterType === 'meetings') limit = 3;
    else if (filterType === 'calls') limit = 6;

    const intensity = Math.min(count / limit, 1);
    
    if (intensity <= 0.25) return 'bg-brand-accent/20 border-brand-accent/15';
    if (intensity <= 0.5) return 'bg-brand-accent/40 border-brand-accent/30';
    if (intensity <= 0.75) return 'bg-brand-accent/70 border-brand-accent/60';
    return 'bg-brand-accent border-transparent';
  };

  const handleMouseEnter = (e: React.MouseEvent, cell: ActivityCell) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setHoveredCell({
      cell,
      x: rect.left + window.scrollX + rect.width / 2,
      y: rect.top + window.scrollY - 75
    });
  };

  const handleMouseLeave = () => {
    setHoveredCell(null);
  };

  return (
    <div className="bg-white border border-brand-border-purple/20 rounded-xl p-5 shadow-sm/5 hover:-translate-y-0.5 hover:shadow-md hover:border-brand-border-purple/40 transition-all duration-300 relative text-brand-text">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5 pb-3 border-b border-brand-border-purple/15">
        <div className="flex items-start space-x-2.5">
          <div className="h-9 w-9 rounded-xl bg-brand-accent/15 flex items-center justify-center text-brand-accent border border-brand-accent/25 shrink-0 animate-pulse">
            <Flame className="h-4.5 w-4.5" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-brand-heading">Sales Activity Heatmap</h3>
            <p className="text-[10px] text-slate-400 font-bold mt-0.5 uppercase tracking-wider">Historical Engagement Heatmap</p>
          </div>
        </div>

        {/* Filter controls */}
        <div className="flex bg-slate-50 dark:bg-slate-900 border border-brand-border-purple/20 p-1 rounded-lg self-start sm:self-center">
          {[
            { id: 'all', label: 'All', icon: Flame },
            { id: 'emails', label: 'Emails', icon: Mail },
            { id: 'calls', label: 'Calls', icon: Phone },
            { id: 'meetings', label: 'Meetings', icon: Calendar }
          ].map((type) => {
            const Icon = type.icon;
            const isSelected = filterType === type.id;
            return (
              <button
                key={type.id}
                onClick={() => setFilterType(type.id as any)}
                className={`flex items-center space-x-1.5 px-2.5 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                  isSelected 
                    ? 'bg-brand-accent text-white shadow-sm' 
                    : 'text-slate-400 hover:text-brand-text hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="h-3 w-3" />
                <span>{type.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Heatmap Grid Frame */}
      <div className="flex flex-col overflow-x-auto scrollbar-none py-1">
        <div className="flex min-w-[700px] justify-center items-start">
          
          {/* Weekday indicators */}
          <div className="flex flex-col justify-between h-[105px] text-[9px] font-bold text-slate-400 mr-2.5 pt-1.5 select-none text-right w-6 shrink-0">
            <span>Mon</span>
            <span>Wed</span>
            <span>Fri</span>
          </div>

          {/* Grid Blocks */}
          <div className="flex flex-col">
            {/* Month Labels along top */}
            <div className="flex justify-between w-full text-[9px] font-bold text-slate-400 mb-1 px-1 select-none">
              <span>February</span>
              <span>March</span>
              <span>April</span>
              <span>May</span>
            </div>

            <div className="flex space-x-1">
              {columns.map((column, colIdx) => (
                <div key={colIdx} className="flex flex-col space-y-1">
                  {column.map((cell, rowIdx) => {
                    const count = getActiveCount(cell);
                    return (
                      <div
                        key={rowIdx}
                        onMouseEnter={(e) => handleMouseEnter(e, cell)}
                        onMouseLeave={handleMouseLeave}
                        className={`h-3 w-3 rounded-[3px] border border-black/5 dark:border-white/5 transition-all duration-150 cursor-pointer hover:scale-120 ${getCellColor(count)}`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Grid Legend & Info Footer */}
      <div className="flex items-center justify-between mt-4 text-[9.5px] font-bold text-slate-400 select-none">
        <div className="flex items-center space-x-1.5">
          <Info className="h-3.5 w-3.5 text-slate-400" />
          <span>Intensity shifts depending on filtered actions count.</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span>Less</span>
          <div className="h-2.5 w-2.5 rounded-[2px] bg-slate-100 dark:bg-slate-800" />
          <div className="h-2.5 w-2.5 rounded-[2px] bg-brand-accent/20" />
          <div className="h-2.5 w-2.5 rounded-[2px] bg-brand-accent/40" />
          <div className="h-2.5 w-2.5 rounded-[2px] bg-brand-accent/70" />
          <div className="h-2.5 w-2.5 rounded-[2px] bg-brand-accent" />
          <span>More</span>
        </div>
      </div>

      {/* Floating Hover Tooltip */}
      {hoveredCell && (
        <div 
          className="fixed bg-slate-900 text-white text-[10px] leading-relaxed p-2.5 rounded-lg shadow-xl z-50 pointer-events-none -translate-x-1/2 border border-slate-700 animate-in fade-in zoom-in-95 duration-150"
          style={{ left: hoveredCell.x, top: hoveredCell.y }}
        >
          <p className="font-extrabold text-[11px] border-b border-slate-700 pb-1 mb-1.5">{hoveredCell.cell.dateStr}</p>
          <div className="space-y-0.5 font-semibold text-slate-300">
            <div className="flex justify-between space-x-4">
              <span>📧 Emails Sent:</span>
              <span className="text-white font-extrabold tabular-nums">{hoveredCell.cell.emails}</span>
            </div>
            <div className="flex justify-between space-x-4">
              <span>📞 Calls Made:</span>
              <span className="text-white font-extrabold tabular-nums">{hoveredCell.cell.calls}</span>
            </div>
            <div className="flex justify-between space-x-4">
              <span>📅 Meetings Logged:</span>
              <span className="text-white font-extrabold tabular-nums">{hoveredCell.cell.meetings}</span>
            </div>
            <div className="flex justify-between space-x-4 border-t border-slate-700/50 pt-1 mt-1 font-extrabold text-brand-secondary-accent">
              <span>Total Activity:</span>
              <span className="text-white tabular-nums">{hoveredCell.cell.allCount}</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
