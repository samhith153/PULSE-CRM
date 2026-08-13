'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Mail, Phone, Building2, Plus, Briefcase,
  ClipboardList, Calendar, PhoneCall, MessageSquare, RefreshCw
} from 'lucide-react';
import { toast } from '@/lib/toast';
import {
  type CrmActivity, getContacts, getCompanies, getDeals, getLead, getCrmActivities,
} from '@/utils/api';

interface ContextPanelProps {
  activity: CrmActivity;
  onTabChange?: (tab: string) => void;
}

type SidebarTab = 'info' | 'conversations';

interface ResolvedContact {
  name: string;
  company: string;
  phone: string;
  email: string;
}

interface ResolvedDeal {
  id: string;
  name: string;
  value: number;
  stage: string;
  closeDate: string;
}

function mapDeal(d: any): ResolvedDeal {
  return {
    id: String(d.id),
    name: d.title || d.name || 'Untitled Deal',
    value: Number(d.value || d.amount || 0),
    stage: d.stage || '',
    closeDate: d.closeDate || d.expected_close_date || '',
  };
}

export default function ContextPanel({ activity, onTabChange }: ContextPanelProps) {
  const router = useRouter();
  const [tab, setTab] = useState<SidebarTab>('info');
  const [loading, setLoading] = useState(true);
  const [contact, setContact] = useState<ResolvedContact | null>(null);
  const [deals, setDeals] = useState<ResolvedDeal[]>([]);
  const [related, setRelated] = useState<CrmActivity[]>([]);

  const relType = activity.related_entity_type;
  const relId = activity.related_record_id;

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        // Other activities logged against the same related record —
        // used for Open Activities counts and the Conversations tab.
        const activitiesResult = await getCrmActivities({ page_size: 100 });
        const sameRecord = relId
          ? activitiesResult.data.filter(a => a.related_record_id === relId && a.id !== activity.id)
          : [];
        if (!cancelled) setRelated(sameRecord);

        if (relType === 'contact' && relId) {
          const contacts = await getContacts();
          const found: any = contacts.find((c: any) => String(c.id) === String(relId));
          if (found && !cancelled) {
            setContact({
              name: found.name || 'Unknown Contact',
              company: found.company || '',
              phone: found.phone || '',
              email: found.email || '',
            });
          }
          const allDeals = await getDeals();
          const matched = allDeals.filter((d: any) => String(d.contact_id) === String(relId));
          if (!cancelled) setDeals(matched.map(mapDeal));
        } else if (relType === 'company' && relId) {
          const companies = await getCompanies();
          const found: any = companies.find((c: any) => String(c.id) === String(relId));
          if (found && !cancelled) {
            setContact({
              name: found.name || 'Unknown Company',
              company: found.name || '',
              phone: found.phone || '',
              email: found.email || '',
            });
          }
          const allDeals = await getDeals();
          const matched = allDeals.filter((d: any) => String(d.company_id) === String(relId));
          if (!cancelled) setDeals(matched.map(mapDeal));
        } else if (relType === 'deal' && relId) {
          const allDeals = await getDeals();
          const found: any = allDeals.find((d: any) => String(d.id) === String(relId));
          if (found && !cancelled) {
            setContact({
              name: found.contact_name || found.company || 'Unknown Contact',
              company: found.company || '',
              phone: '',
              email: '',
            });
            setDeals([mapDeal(found)]);
          }
        } else if (relType === 'lead' && relId) {
          const lead = await getLead(relId);
          if (lead && !cancelled) {
            setContact({
              name: lead.contact_name || lead.title || 'Unknown Lead',
              company: lead.company_name || '',
              phone: lead.contact_phone || '',
              email: lead.contact_email || '',
            });
            if (lead.estimated_value) {
              setDeals([{
                id: lead.id,
                name: lead.title || 'Lead Opportunity',
                value: lead.estimated_value,
                stage: lead.status || '',
                closeDate: '',
              }]);
            }
          }
        } else {
          setContact(null);
          setDeals([]);
        }
      } catch {
        if (!cancelled) { setContact(null); setDeals([]); }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [relType, relId, activity.id]);

  const handlePhoneClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!contact?.phone) return;
    window.location.href = `tel:${contact.phone}`;
    toast.info(`Dialing ${contact.name} at ${contact.phone}...`);
  };

  const handleEmailClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!contact?.email) return;
    if (onTabChange) {
      onTabChange('emails');
      toast.info(`Redirecting to emails to compose mail to ${contact.email}...`);
    } else {
      window.location.href = `mailto:${contact.email}`;
    }
  };

  const openCounts = {
    tasks: related.filter(a => a.activity_type === 'task' && a.status?.toLowerCase() !== 'completed').length,
    meetings: related.filter(a => a.activity_type === 'meeting' && a.status?.toLowerCase() !== 'completed').length,
    calls: related.filter(a => a.activity_type === 'call' && a.status?.toLowerCase() !== 'completed').length,
  };

  return (
    <div className="space-y-4">
      {/* Tab Switch */}
      <div className="flex border border-border rounded-lg p-0.5 bg-secondary/30 select-none">
        <button
          onClick={() => setTab('info')}
          className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${tab === 'info' ? 'bg-brand-blue text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
        >
          Info
        </button>
        <button
          onClick={() => setTab('conversations')}
          className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${tab === 'conversations' ? 'bg-brand-blue text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
        >
          Conversations
        </button>
      </div>

      {loading ? (
        <div className="bg-card border border-border rounded-2xl p-6 flex items-center justify-center text-xs text-muted-foreground font-semibold">
          <RefreshCw className="size-4 animate-spin text-brand-blue mr-2" /> Loading context...
        </div>
      ) : tab === 'info' ? (
        <div className="space-y-4">
          {/* Contact / Company Card */}
          <div className="bg-card border border-border rounded-2xl p-4 hover:shadow-nav transition duration-300">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 border-b border-border pb-1.5 mb-3">
              Contact Information
            </h4>
            {contact ? (
              <>
                <div className="flex items-center gap-3">
                  <div className="size-11 rounded-full bg-brand-purple/15 text-brand-purple flex items-center justify-center border border-brand-purple/20 font-black text-sm select-none shrink-0">
                    {contact.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-foreground">{contact.name}</p>
                    {contact.company && (
                      <p className="truncate text-[10px] text-muted-foreground flex items-center mt-0.5 font-semibold">
                        <Building2 className="size-3 mr-1" />
                        {contact.company}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 space-y-2 border-t border-border/60 pt-3">
                  {contact.email && (
                    <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold">
                      <span className="flex items-center gap-2 truncate">
                        <Mail className="size-3.5 shrink-0" />
                        <span className="truncate">{contact.email}</span>
                      </span>
                      <button onClick={handleEmailClick} className="p-1 hover:bg-secondary rounded text-brand-purple cursor-pointer transition-colors" title="Send Email">
                        <Mail className="size-3.5" />
                      </button>
                    </div>
                  )}
                  {contact.phone && (
                    <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold">
                      <span className="flex items-center gap-2 truncate">
                        <Phone className="size-3.5 shrink-0" />
                        <span className="truncate">{contact.phone}</span>
                      </span>
                      <button onClick={handlePhoneClick} className="p-1 hover:bg-secondary rounded text-brand-cyan cursor-pointer transition-colors" title="Call">
                        <Phone className="size-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button onClick={handlePhoneClick} disabled={!contact.phone} className="flex items-center justify-center gap-1.5 py-1.5 border border-border bg-secondary/20 hover:bg-secondary/50 text-foreground rounded-lg text-[10px] font-bold transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
                    <Phone className="size-3" /> <span>Contact</span>
                  </button>
                  <button onClick={handleEmailClick} disabled={!contact.email} className="flex items-center justify-center gap-1.5 py-1.5 border border-border bg-secondary/20 hover:bg-secondary/50 text-foreground rounded-lg text-[10px] font-bold transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
                    <Mail className="size-3" /> <span>Send Email</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-6 text-xs text-muted-foreground/75 border border-dashed border-border/80 rounded-xl bg-secondary/15 select-none font-semibold">
                No linked contact for this activity.
              </div>
            )}
          </div>

          {/* Linked Deals Card */}
          <div className="bg-card border border-border rounded-2xl p-4 hover:shadow-nav transition duration-300">
            <div className="flex items-center justify-between border-b border-border pb-1.5 mb-3">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 leading-none">
                Linked Deals
              </h4>
              <button onClick={() => toast.success('Deal selection picker opened!')} className="text-[9px] font-bold text-brand-purple hover:underline flex items-center gap-0.5 cursor-pointer leading-none">
                <Plus size={10} /> New
              </button>
            </div>

            {deals.length > 0 ? (
              <div className="space-y-3">
                {deals.map(d => (
                  <div key={d.id} className="space-y-2 pb-3 border-b border-border/40 last:border-0 last:pb-0">
                    <div className="flex items-start gap-2.5">
                      <div className="h-8 w-8 rounded-lg bg-brand-blue/10 text-brand-blue flex items-center justify-center border border-brand-blue/20 shrink-0">
                        <Briefcase size={14} />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-foreground leading-snug">{d.name}</p>
                        {d.closeDate && (
                          <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">
                            Est. Close: <span className="text-foreground">{d.closeDate}</span>
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between items-center bg-secondary/10 border border-border/40 rounded-xl p-2.5">
                      <div>
                        <p className="text-[8px] font-extrabold uppercase tracking-wider text-muted-foreground/75 leading-none">Value</p>
                        <p className="text-xs font-black text-brand-blue tabular-nums mt-1 leading-none">
                          ₹{(Number(d.value) / 100000).toFixed(1)}L
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[8px] font-extrabold uppercase tracking-wider text-muted-foreground/75 leading-none">Stage</p>
                        <span className="inline-block mt-1 text-[8px] font-bold px-1.5 py-0.5 rounded bg-brand-purple/10 text-brand-purple uppercase tracking-wider">
                          {d.stage}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-muted-foreground/75 border border-dashed border-border/80 rounded-xl bg-secondary/15 select-none font-semibold">
                No linked deals found.
              </div>
            )}
          </div>

          {/* Open Activities Count */}
          <div className="bg-card border border-border rounded-2xl p-4 hover:shadow-nav transition duration-300">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 border-b border-border pb-1.5 mb-3">
              Open Activities Count
            </h4>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Tasks', count: openCounts.tasks, icon: ClipboardList, color: 'text-brand-purple bg-brand-purple/10 border-brand-purple/15', filter: 'task' },
                { label: 'Meetings', count: openCounts.meetings, icon: Calendar, color: 'text-brand-blue bg-brand-blue/10 border-brand-blue/15', filter: 'meeting' },
                { label: 'Calls', count: openCounts.calls, icon: PhoneCall, color: 'text-brand-cyan bg-brand-cyan/10 border-brand-cyan/15', filter: 'call' },
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => router.push(`/activities?type=${item.filter}`)}
                    className="flex flex-col items-center justify-center p-2.5 border border-border/60 hover:border-brand-purple/20 bg-secondary/20 hover:bg-secondary/50 rounded-xl text-center group cursor-pointer transition duration-200"
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
      ) : (
        /* Conversations tab */
        <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 border-b border-border pb-1.5 mb-1 flex items-center gap-1.5">
            <MessageSquare size={12} className="text-brand-purple" />
            Conversation Log
          </h4>
          {related.length === 0 ? (
            <div className="text-center py-8 text-xs text-muted-foreground/75 border border-dashed border-border/80 rounded-xl bg-secondary/15 select-none font-semibold">
              No other logged activity for this record yet.
            </div>
          ) : (
            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {related
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .map(a => (
                  <div key={a.id} className="bg-secondary/20 border border-border/50 rounded-lg p-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded bg-brand-purple/10 text-brand-purple">{a.activity_type}</span>
                      <span className="text-[9px] text-muted-foreground font-mono">{new Date(a.created_at).toLocaleDateString('en-IN')}</span>
                    </div>
                    <p className="text-xs font-bold text-foreground mt-1.5 truncate">{a.subject}</p>
                    {a.owner_name && <p className="text-[9px] text-muted-foreground mt-0.5">by {a.owner_name}</p>}
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}