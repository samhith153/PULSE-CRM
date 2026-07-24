'use client';

import React, { useState } from 'react';
import { 
  Sparkles, 
  Award, 
  AlertTriangle, 
  Flame, 
  CheckSquare, 
  TrendingUp, 
  ArrowUpRight,
  ShieldCheck,
  Check
} from 'lucide-react';

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
            Real-time recommendations generated using predictive lead scoring, compliance mapping status, and contact velocity.
          </p>
        </div>
      </div>

      {/* Main Grid split */}
      <div className="grid grid-cols-12 gap-6">
        
        {/* Left Side: Score Distribution & Top Prospects (8 columns) */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          
          {/* Top Leads */}
          <div className="bg-white border border-brand-border-purple/20 rounded-xl p-5 shadow-sm/5">
            <h3 className="font-extrabold text-brand-heading text-sm mb-4 flex items-center">
              <Award className="h-4.5 w-4.5 mr-2 text-brand-accent" />
              <span>Top CRM prospects</span>
            </h3>

            <div className="space-y-3.5">
              {topLeads.map((lead, idx) => (
                <div key={idx} className="p-4 border border-brand-border-purple/20 rounded-xl bg-slate-50/50 flex justify-between items-start">
                  <div>
                    <h4 className="text-xs font-extrabold text-brand-heading">{lead.name}</h4>
                    <p className="text-[10px] text-brand-accent font-bold mt-0.5">{lead.company}</p>
                    <p className="text-[10px] text-brand-text/75 mt-2 leading-relaxed font-semibold">{lead.reason}</p>
                  </div>
                  <span className="text-xs font-extrabold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded tabular-nums shrink-0">
                    Score: {lead.score}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Lead Score Distribution progress bars */}
          <div className="bg-white border border-brand-border-purple/20 rounded-xl p-5 shadow-sm/5">
            <h3 className="font-extrabold text-brand-heading text-sm mb-4 flex items-center">
              <TrendingUp className="h-4.5 w-4.5 mr-2 text-brand-accent" />
              <span>Lead Score Distribution</span>
            </h3>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-[10px] font-extrabold text-brand-heading mb-1.5">
                  <span>Hot Leads (Score 80+)</span>
                  <span className="tabular-nums">2 leads</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '66%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[10px] font-extrabold text-brand-heading mb-1.5">
                  <span>Warm Nurturing (Score 50-79)</span>
                  <span className="tabular-nums">1 lead</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: '33%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[10px] font-extrabold text-brand-heading mb-1.5">
                  <span>At-Risk / Cold (Score &lt;50)</span>
                  <span className="tabular-nums">1 lead</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500 rounded-full" style={{ width: '33%' }} />
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
    </div>
  );
}
