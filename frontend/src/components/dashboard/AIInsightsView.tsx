'use client';

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Award, 
  AlertTriangle, 
  Flame, 
  CheckSquare, 
  TrendingUp, 
  ArrowUpRight,
  ShieldCheck,
  Check,
  BrainCircuit,
  MessageSquare,
  Target,
  Smile,
  Frown,
  Meh,
  Clock,
  TrendingDown
} from 'lucide-react';
import { getAIActionCenter, AIActionCenterData } from '../../utils/api';

interface AILead {
  name: string;
  company: string;
  score: number;
  reason: string;
}

interface ActionItem {
  id: number;
  title: string;
  desc: string;
  dealValue: string;
  priority: 'High' | 'Medium';
}

export default function AIInsightsView() {
  const [actionCenter, setActionCenter] = useState<AIActionCenterData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAIActionCenter()
      .then((res) => {
        setActionCenter(res);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const [topLeads] = useState<AILead[]>([
    { name: "Helena Troy", company: "Sparta Creative", score: 95, reason: "Inbound request has high seat potential and priority SLA requirements." },
    { name: "Alex Rivera", company: "TechCorp Inc.", score: 88, reason: "SAML SSO setup cleared by engineering. Ready for legal contract." }
  ]);

  const [hotLeads] = useState<AILead[]>([
    { name: "Marcus Aurelius", company: "MedSaaS Solutions", score: 72, reason: "Evaluated competitor pricing. High priority HIPAA requirement." }
  ]);

  const [atRiskLeads] = useState<AILead[]>([
    { name: "David Hume", company: "Empiric Logistics", score: 41, reason: "Budget is out of scope. Nurturing required." }
  ]);

  const [priorities, setPriorities] = useState<ActionItem[]>([
    { id: 1, title: "Review TechCorp Contract", desc: "Liability SLA terms require legal approval review.", dealValue: "₹120,000", priority: "High" },
    { id: 2, title: "Call Marcus Aurelius", desc: "Follow up on compliance audit files download feedback.", dealValue: "₹85,000", priority: "High" },
    { id: 3, title: "Email Helena Troy", desc: "Send volumetric team discounts sheet for 40 seats.", dealValue: "₹45,000", priority: "Medium" }
  ]);

  const [checkedIds, setCheckedIds] = useState<number[]>([]);

  const handleToggle = (id: number) => {
    if (checkedIds.includes(id)) {
      setCheckedIds(checkedIds.filter(x => x !== id));
    } else {
      setCheckedIds([...checkedIds, id]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-brand-accent/5 to-brand-secondary-accent/10 border border-brand-border-purple/35 rounded-xl p-5 shadow-sm/5 flex items-start space-x-3.5">
        <div className="h-10 w-10 rounded-xl bg-brand-accent flex items-center justify-center text-white shrink-0 shadow-md">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-sans text-2xl text-brand-heading font-bold">AI Copilot Insights</h2>
          <p className="text-xs text-brand-text/80 mt-1 leading-relaxed font-bold max-w-2xl">
            Real-time recommendations powered by predictive lead scoring, conversation intelligence, compliance mapping, and contact velocity.
          </p>
        </div>
      </div>

      {/* Main Grid split */}
      <div className="grid grid-cols-12 gap-6">

        {/* Left Side: AI Action Center 4-Grid (8 columns) */}
        <div className="col-span-12 lg:col-span-8 space-y-6">

          <div className="bg-white border border-brand-border-purple/20 rounded-xl p-5 shadow-sm/5">
            <h3 className="font-extrabold text-brand-heading text-sm mb-4 flex items-center">
              <BrainCircuit className="h-4.5 w-4.5 mr-2 text-brand-accent" />
              <span>AI Action Center</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Immediate Action - Live Backend Data */}
              <div className="bg-slate-50/50 border border-brand-border-purple/15 rounded-xl p-4 flex flex-col justify-between min-h-[220px]">
                <div>
                  <div className="flex justify-between items-center pb-2 border-b border-brand-border-purple/15 mb-3">
                    <h4 className="text-xs font-extrabold text-rose-600 uppercase tracking-wider flex items-center">
                      <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />
                      <span>Immediate Action</span>
                    </h4>
                    <span className="text-[9px] font-extrabold bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded-full">
                      P1 Urgent
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    {loading ? (
                      <p className="text-[10px] text-slate-400 p-2">Loading live actions...</p>
                    ) : error ? (
                      <p className="text-[10px] text-rose-500 p-2">Failed to load actions</p>
                    ) : actionCenter?.immediateActions && actionCenter.immediateActions.length > 0 ? (
                      actionCenter.immediateActions.map((item) => (
                        <div key={item.id} className="p-2.5 bg-white border border-rose-100 rounded-lg">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-extrabold text-brand-heading">
                              {item.deal_name || item.lead_name}
                            </span>
                            <span className="text-[9px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                              ₹{item.deal_value?.toLocaleString() || 0}
                            </span>
                          </div>
                          <p className="text-[9px] text-brand-text/75 mt-1 font-semibold leading-relaxed">
                            {item.reason}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-[10px] text-slate-400 p-2">No urgent actions required.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Follow Up Due */}
              <div className="bg-slate-50/50 border border-brand-border-purple/15 rounded-xl p-4 flex flex-col justify-between min-h-[220px]">
                <div>
                  <div className="flex justify-between items-center pb-2 border-b border-brand-border-purple/15 mb-3">
                    <h4 className="text-xs font-extrabold text-amber-600 uppercase tracking-wider flex items-center">
                      <Clock className="h-3.5 w-3.5 mr-1.5" />
                      <span>Follow Up Due</span>
                    </h4>
                    <span className="text-[9px] font-extrabold bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded-full">
                      Missed
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div className="p-2.5 bg-white border border-amber-100 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-extrabold text-brand-heading">Sparta Creative</span>
                        <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">Overdue 3d</span>
                      </div>
                      <p className="text-[9px] text-brand-text/75 mt-1 font-semibold leading-relaxed">Missed scheduled demo call. Immediate rescheduling required.</p>
                    </div>
                    <div className="p-2.5 bg-white border border-amber-100 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-extrabold text-brand-heading">TechCorp Inc.</span>
                        <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">Overdue 5d</span>
                      </div>
                      <p className="text-[9px] text-brand-text/75 mt-1 font-semibold leading-relaxed">No response to final pricing quote sent last week.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rising Interest */}
              <div className="bg-slate-50/50 border border-brand-border-purple/15 rounded-xl p-4 flex flex-col justify-between min-h-[220px]">
                <div>
                  <div className="flex justify-between items-center pb-2 border-b border-brand-border-purple/15 mb-3">
                    <h4 className="text-xs font-extrabold text-emerald-600 uppercase tracking-wider flex items-center">
                      <Flame className="h-3.5 w-3.5 mr-1.5 animate-pulse" />
                      <span>Rising Interest</span>
                    </h4>
                    <span className="text-[9px] font-extrabold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-full">
                      Spiking
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div className="p-2.5 bg-white border border-emerald-100 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-extrabold text-brand-heading">Marcus Aurelius</span>
                        <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Score 78</span>
                      </div>
                      <p className="text-[9px] text-brand-text/75 mt-1 font-semibold leading-relaxed">Engagement spiked 45%. Reviewing integrations documentation.</p>
                    </div>
                    <div className="p-2.5 bg-white border border-emerald-100 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-extrabold text-brand-heading">Empire Group</span>
                        <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Score 74</span>
                      </div>
                      <p className="text-[9px] text-brand-text/75 mt-1 font-semibold leading-relaxed">Opened product proposal email 5 times in the last 24h.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Going Cold */}
              <div className="bg-slate-50/50 border border-brand-border-purple/15 rounded-xl p-4 flex flex-col justify-between min-h-[220px]">
                <div>
                  <div className="flex justify-between items-center pb-2 border-b border-brand-border-purple/15 mb-3">
                    <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider flex items-center">
                      <TrendingDown className="h-3.5 w-3.5 mr-1.5" />
                      <span>Going Cold</span>
                    </h4>
                    <span className="text-[9px] font-extrabold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded-full">
                      At Risk
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-extrabold text-brand-heading">David Hume</span>
                        <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">Score 41</span>
                      </div>
                      <p className="text-[9px] text-brand-text/75 mt-1 font-semibold leading-relaxed">No response to follow-ups in 14d. Budget constraints cited.</p>
                    </div>
                    <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-extrabold text-brand-heading">Liberty Corp</span>
                        <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">Score 35</span>
                      </div>
                      <p className="text-[9px] text-brand-text/75 mt-1 font-semibold leading-relaxed">Inbound lead inactive for 21 days since discovery call.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Health Index & Priorities (4 columns) */}
        <div className="col-span-12 lg:col-span-4 space-y-6">

          {/* Health Index */}
          <div className="bg-white border border-brand-border-purple/20 rounded-xl p-5 shadow-sm/5">
            <h3 className="font-extrabold text-brand-heading text-sm mb-3.5 flex items-center">
              <ShieldCheck className="h-4.5 w-4.5 mr-2 text-brand-accent" />
              <span>Pipeline Health Index</span>
            </h3>

            <div className="text-center py-4 bg-slate-50/50 border border-brand-border-purple/15 rounded-xl">
              <span className="text-4xl font-serif text-brand-heading font-normal tabular-nums">94<span className="text-sm font-sans text-brand-text/50">/100</span></span>
              <p className="text-[10px] text-emerald-600 font-extrabold mt-1.5">▲ Excellent Velocity (+3% vs yesterday)</p>
            </div>
            <p className="text-[9px] text-slate-400 font-bold mt-3 leading-relaxed">
              Calculated using meeting logs frequency, contract proposal response times, and target ratios.
            </p>
          </div>

          {/* Daily Priorities checklist */}
          <div className="bg-white border border-brand-border-purple/20 rounded-xl p-5 shadow-sm/5">
            <h3 className="font-extrabold text-brand-heading text-sm mb-4 flex items-center">
              <CheckSquare className="h-4.5 w-4.5 mr-2 text-brand-accent" />
              <span>Daily Priorities</span>
            </h3>

            <div className="space-y-3.5">
              {priorities.map((item) => {
                const isChecked = checkedIds.includes(item.id);
                return (
                  <div 
                    key={item.id}
                    onClick={() => handleToggle(item.id)}
                    className="flex items-start space-x-2.5 cursor-pointer"
                  >
                    <div className={`h-4.5 w-4.5 rounded border flex items-center justify-center shrink-0 mt-0.5 ${
                      isChecked ? 'bg-brand-accent border-brand-accent text-white' : 'border-brand-border-purple/35 bg-white'
                    }`}>
                      {isChecked && <Check className="h-3 w-3" strokeWidth={3} />}
                    </div>
                    <div className={isChecked ? 'line-through opacity-55' : ''}>
                      <div className="flex justify-between items-center w-full gap-2">
                        <h4 className="text-[11px] font-extrabold text-brand-heading leading-tight">{item.title}</h4>
                        <span className={`text-[8px] font-bold shrink-0 ${item.priority === 'High' ? 'text-rose-600' : 'text-slate-450'}`}>{item.priority}</span>
                      </div>
                      <p className="text-[9px] text-brand-text/75 mt-0.5 leading-relaxed font-bold">{item.desc}</p>
                      <p className="text-[9px] text-brand-accent font-extrabold mt-1">Value: {item.dealValue}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Conversation Intelligence Section - Bhavani Summarization */}
      <div className="bg-white border border-brand-border-purple/20 rounded-xl p-5 shadow-sm/5">
        <h3 className="font-extrabold text-brand-heading text-sm mb-4 flex items-center">
          <BrainCircuit className="h-4.5 w-4.5 mr-2 text-brand-accent" />
          <span>Conversation Intelligence</span>
          <span className="ml-2 text-[9px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Bhavani</span>
        </h3>

        <div className="grid grid-cols-12 gap-4">
          {/* Sentiment Breakdown */}
          <div className="col-span-12 lg:col-span-4 p-4 border border-brand-border-purple/15 rounded-xl bg-slate-50/50">
            <h4 className="text-[10px] font-extrabold text-brand-heading/70 uppercase tracking-wider mb-3 flex items-center">
              <Smile className="h-3.5 w-3.5 mr-1.5 text-brand-accent" />
              Sentiment Breakdown
            </h4>
            <div className="space-y-2.5">
              <div>
                <div className="flex justify-between text-[10px] font-bold text-brand-heading mb-1">
                  <span className="flex items-center"><Smile className="h-3 w-3 text-emerald-500 mr-1" /> Positive</span>
                  <span className="tabular-nums">3</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '60%' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[10px] font-bold text-brand-heading mb-1">
                  <span className="flex items-center"><Meh className="h-3 w-3 text-amber-500 mr-1" /> Neutral</span>
                  <span className="tabular-nums">1</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: '20%' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[10px] font-bold text-brand-heading mb-1">
                  <span className="flex items-center"><Frown className="h-3 w-3 text-rose-500 mr-1" /> Negative</span>
                  <span className="tabular-nums">1</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500 rounded-full" style={{ width: '20%' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Intent Distribution */}
          <div className="col-span-12 lg:col-span-4 p-4 border border-brand-border-purple/15 rounded-xl bg-slate-50/50">
            <h4 className="text-[10px] font-extrabold text-brand-heading/70 uppercase tracking-wider mb-3 flex items-center">
              <Target className="h-3.5 w-3.5 mr-1.5 text-brand-accent" />
              Intent Distribution
            </h4>
            <div className="space-y-2.5">
              {[
                { label: 'Follow-up', count: 2, pct: 40 },
                { label: 'Buy / Purchase', count: 1, pct: 20 },
                { label: 'Demo Request', count: 1, pct: 20 },
                { label: 'Negotiate', count: 1, pct: 20 },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between text-[10px] font-bold text-brand-heading mb-1">
                    <span>{item.label}</span>
                    <span className="tabular-nums">{item.count}</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500 rounded-full" style={{ width: `${item.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[9px] text-slate-400 font-bold mt-3 leading-relaxed">
              Based on email thread analysis via Groq LLM
            </p>
          </div>

          {/* Recent Summaries with Follow-up */}
          <div className="col-span-12 lg:col-span-4 p-4 border border-brand-border-purple/15 rounded-xl bg-slate-50/50">
            <h4 className="text-[10px] font-extrabold text-brand-heading/70 uppercase tracking-wider mb-3 flex items-center">
              <MessageSquare className="h-3.5 w-3.5 mr-1.5 text-brand-accent" />
              Recent Summaries
            </h4>
            <div className="space-y-2.5">
              {[
                { from: 'Alex Rivera', summary: 'SAML config approved, questions on liability SLAs.', sentiment: 'positive', category: 'sales', followUp: 'Follow up tomorrow with proposal' },
                { from: 'Helena Troy', summary: 'Pricing inquiry for 40-seat enterprise tier.', sentiment: 'neutral', category: 'sales', followUp: 'Follow up in 2 days with pricing' },
                { from: 'Marcus Aurelius', summary: 'Compliance audit files sent, awaiting feedback.', sentiment: 'positive', category: 'support', followUp: 'Follow up in 3 days' },
              ].map((item, i) => (
                <div key={i} className="p-2.5 bg-white border border-brand-border-purple/10 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] font-extrabold text-brand-heading">{item.from}</span>
                    <div className="flex items-center space-x-1">
                      <span className={`text-[7px] font-bold px-1 py-0.5 rounded ${
                        item.category === 'sales' ? 'bg-emerald-50 text-emerald-700' :
                        item.category === 'urgent' ? 'bg-rose-50 text-rose-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>{item.category}</span>
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${
                        item.sentiment === 'positive' ? 'bg-emerald-50 text-emerald-700' :
                        item.sentiment === 'negative' ? 'bg-rose-50 text-rose-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>{item.sentiment}</span>
                    </div>
                  </div>
                  <p className="text-[9px] text-brand-text/70 font-semibold leading-relaxed">{item.summary}</p>
                  <p className="text-[8px] text-amber-600 font-extrabold mt-1">⏰ {item.followUp}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-brand-border-purple/10">
              <p className="text-[9px] text-brand-accent font-extrabold flex items-center">
                <Sparkles className="h-3 w-3 mr-1" />
                Powered by Groq (llama-3.1-8b-instant)
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}