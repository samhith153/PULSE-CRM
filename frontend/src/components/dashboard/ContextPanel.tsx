'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { 
  User, 
  Mail, 
  Phone, 
  Building2, 
  Plus, 
  Briefcase, 
  TrendingUp, 
  ArrowRight,
  ClipboardList,
  Calendar,
  PhoneCall
} from 'lucide-react';
import { toast } from '@/lib/toast';

interface ContextPanelProps {
  contactName?: string;
  phoneNumber?: string;
  emailAddress?: string;
  companyName?: string;
  dealInfo?: {
    id: string;
    name: string;
    value: string | number;
    stage: string;
    closeDate: string;
  };
  openCounts?: {
    tasks: number;
    meetings: number;
    calls: number;
  };
}

export default function ContextPanel({
  contactName = "Marcus Aurelius",
  phoneNumber = "+91 99887 76655",
  emailAddress = "marcus.aurelius@rome.com",
  companyName = "Acme Corporation",
  dealInfo = {
    id: "deal-1",
    name: "Enterprise SSO Migration",
    value: 4500000,
    stage: "Negotiation",
    closeDate: "2026-09-30"
  },
  openCounts = {
    tasks: 3,
    meetings: 1,
    calls: 2
  }
}: ContextPanelProps) {
  const router = useRouter();

  const handlePhoneClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.location.href = `tel:${phoneNumber}`;
    toast.info(`Dialing ${contactName} at ${phoneNumber}...`);
  };

  const handleEmailClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.location.href = `mailto:${emailAddress}`;
    toast.info(`Drafting email to ${emailAddress}...`);
  };

  const handleAddDealLink = () => {
    toast.success("Deal selection picker opened!");
  };

  return (
    <div className="space-y-[var(--space-4)]">
      
      {/* Contact Profile Card */}
      <div className="bg-card border border-border rounded-2xl p-[var(--space-4)] hover:shadow-nav transition-all duration-300">
        <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 border-b border-border pb-1.5 mb-[var(--space-3)]">
          Contact Information
        </h4>
        <div className="flex items-center gap-3">
          <div className="size-11 rounded-full bg-brand-purple/15 text-brand-purple flex items-center justify-center border border-brand-purple/20 font-black text-sm select-none shrink-0">
            {contactName.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-foreground">{contactName}</p>
            <p className="truncate text-[10px] text-muted-foreground flex items-center mt-0.5 font-semibold">
              <Building2 className="size-3 mr-1" />
              {companyName}
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-2 border-t border-border/60 pt-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold">
            <span className="flex items-center gap-2 truncate">
              <Mail className="size-3.5 shrink-0" />
              <span className="truncate">{emailAddress}</span>
            </span>
            <button 
              onClick={handleEmailClick}
              className="p-1 hover:bg-secondary rounded text-brand-purple cursor-pointer transition-colors"
              title="Send Email"
            >
              <Mail className="size-3.5" />
            </button>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold">
            <span className="flex items-center gap-2 truncate">
              <Phone className="size-3.5 shrink-0" />
              <span className="truncate">{phoneNumber}</span>
            </span>
            <button 
              onClick={handlePhoneClick}
              className="p-1 hover:bg-secondary rounded text-brand-cyan cursor-pointer transition-colors"
              title="Call Phone"
            >
              <Phone className="size-3.5" />
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button 
            onClick={handlePhoneClick}
            className="flex items-center justify-center gap-1.5 py-1.5 border border-border bg-secondary/20 hover:bg-secondary/50 text-foreground rounded-lg text-[10px] font-bold transition-all cursor-pointer"
          >
            <Phone className="size-3" />
            <span>Quick Call</span>
          </button>
          <button 
            onClick={handleEmailClick}
            className="flex items-center justify-center gap-1.5 py-1.5 border border-border bg-secondary/20 hover:bg-secondary/50 text-foreground rounded-lg text-[10px] font-bold transition-all cursor-pointer"
          >
            <Mail className="size-3" />
            <span>Send Email</span>
          </button>
        </div>
      </div>

      {/* Linked Deal card */}
      <div className="bg-card border border-border rounded-2xl p-[var(--space-4)] hover:shadow-nav transition-all duration-300">
        <div className="flex items-center justify-between border-b border-border pb-1.5 mb-[var(--space-3)]">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 leading-none">
            Related Deal
          </h4>
          <button 
            onClick={handleAddDealLink}
            className="text-[9px] font-bold text-brand-purple hover:underline flex items-center gap-0.5 cursor-pointer leading-none"
          >
            <Plus size={10} /> Link Deal
          </button>
        </div>

        {dealInfo ? (
          <div className="space-y-3.5">
            <div className="flex items-start gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-brand-blue/10 text-brand-blue flex items-center justify-center border border-brand-blue/20 shrink-0">
                <Briefcase size={14} />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-foreground leading-snug">{dealInfo.name}</p>
                <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">
                  Est. Close: <span className="text-foreground">{dealInfo.closeDate}</span>
                </p>
              </div>
            </div>

            <div className="flex justify-between items-center bg-secondary/10 border border-border/40 rounded-xl p-2.5">
              <div>
                <p className="text-[8px] font-extrabold uppercase tracking-wider text-muted-foreground/75 leading-none">Value</p>
                <p className="text-xs font-black text-brand-blue tabular-nums mt-1 leading-none">
                  ₹{(Number(dealInfo.value) / 100000).toFixed(1)}L
                </p>
              </div>
              <div className="text-right">
                <p className="text-[8px] font-extrabold uppercase tracking-wider text-muted-foreground/75 leading-none">Stage</p>
                <span className="inline-block mt-1 text-[8px] font-bold px-1.5 py-0.5 rounded bg-brand-purple/10 text-brand-purple uppercase tracking-wider">
                  {dealInfo.stage}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-xs text-muted-foreground/75 border border-dashed border-border/80 rounded-xl bg-secondary/15 select-none font-semibold">
            No linked deals found.
          </div>
        )}
      </div>

      {/* Linked Open Activities Count Card */}
      <div className="bg-card border border-border rounded-2xl p-[var(--space-4)] hover:shadow-nav transition-all duration-300">
        <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 border-b border-border pb-1.5 mb-[var(--space-3)]">
          Open Activities Count
        </h4>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Tasks", count: openCounts.tasks, icon: ClipboardList, color: "text-brand-purple bg-brand-purple/10 border-brand-purple/15", filter: "tasks" },
            { label: "Meetings", count: openCounts.meetings, icon: Calendar, color: "text-brand-blue bg-brand-blue/10 border-brand-blue/15", filter: "meetings" },
            { label: "Calls", count: openCounts.calls, icon: PhoneCall, color: "text-brand-cyan bg-brand-cyan/10 border-brand-cyan/15", filter: "calls" }
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <button
                key={idx}
                onClick={() => router.push(`/activities?type=${item.filter}`)}
                className="flex flex-col items-center justify-center p-2.5 border border-border/60 hover:border-brand-purple/20 bg-secondary/20 hover:bg-secondary/50 rounded-xl text-center group cursor-pointer transition-all duration-200"
              >
                <div className={`size-7 rounded-lg flex items-center justify-center border shrink-0 ${item.color}`}>
                  <Icon size={12} strokeWidth={2.25} />
                </div>
                <p className="text-[14px] font-black text-foreground mt-2 leading-none">{item.count}</p>
                <p className="text-[8px] font-bold text-muted-foreground group-hover:text-foreground mt-1 uppercase tracking-wide leading-none">{item.label}</p>
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
}
