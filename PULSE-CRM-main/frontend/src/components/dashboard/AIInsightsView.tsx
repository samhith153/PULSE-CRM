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
      <div className="border border-border rounded-2xl p-5 flex items-start space-x-3.5">
        <div className="h-10 w-10 rounded-xl bg-brand-purple flex items-center justify-center text-primary-foreground shrink-0">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-sans text-2xl text-foreground font-bold">AI Copilot Insights</h2>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed font-semibold max-w-2xl">
            Real-time recommendations powered by predictive lead scoring, conversation intelligence, compliance mapping, and contact velocity.
          </p>
        </div>
      </div>

      {/* Main Grid split */}
      <div className="grid grid-cols-12 gap-6">
        
        {/* Left Side: AI Action Center 4-Grid (8 columns) */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="font-semibold text-foreground text-sm mb-4 flex items-center">
              <BrainCircuit className="h-4.5 w-4.5 mr-2 text-brand-purple" />
              <span>AI Action Center</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Immediate Action */}
              <div className="bg-secondary border border-border rounded-xl p-4 flex flex-col justify-between min-h-[220px]">
                <div>
                  <div className="flex justify-between items-center pb-2 border-b border-border mb-3">
                    <h4 className="text-xs font-semibold text-destructive uppercase tracking-wider flex items-center">
                      <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />
                      <span>Immediate Action</span>
                    </h4>
                    <span className="text-[9px] font-semibold bg-destructive/10 text-destructive px-1.5 py-0.5 rounded-full">
                      P1 Urgent
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div className="p-2.5 bg-card border border-destructive/10 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-semibold text-foreground">Helena Troy</span>
                        <span className="text-[9px] font-semibold text-destructive bg-destructive/10 px-1.5 py-0.5 rounded">95 Score</span>
                      </div>
                      <p className="text-[9px] text-muted-foreground mt-1 font-semibold leading-relaxed">High seat potential. Priority SLA requirements.</p>
                    </div>
                    <div className="p-2.5 bg-card border border-destructive/10 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-semibold text-foreground">Alex Rivera</span>
                        <span className="text-[9px] font-semibold text-destructive bg-destructive/10 px-1.5 py-0.5 rounded">88 Score</span>
                      </div>
                      <p className="text-[9px] text-muted-foreground mt-1 font-semibold leading-relaxed">SSO setup complete. Ready for NDA/Legal contract.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Follow Up Due */}
              <div className="bg-secondary border border-border rounded-xl p-4 flex flex-col justify-between min-h-[220px]">
                <div>
                  <div className="flex justify-between items-center pb-2 border-b border-border mb-3">
                    <h4 className="text-xs font-semibold text-amber-600 uppercase tracking-wider flex items-center">
                      <Clock className="h-3.5 w-3.5 mr-1.5" />
                      <span>Follow Up Due</span>
                    </h4>
                    <span className="text-[9px] font-semibold bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded-full">
                      Missed
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div className="p-2.5 bg-card border border-amber-100 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-semibold text-foreground">Sparta Creative</span>
                        <span className="text-[9px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">Overdue 3d</span>
                      </div>
                      <p className="text-[9px] text-muted-foreground mt-1 font-semibold leading-relaxed">Missed scheduled demo call. Immediate rescheduling required.</p>
                    </div>
                    <div className="p-2.5 bg-card border border-amber-100 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-semibold text-foreground">TechCorp Inc.</span>
                        <span className="text-[9px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">Overdue 5d</span>
                      </div>
                      <p className="text-[9px] text-muted-foreground mt-1 font-semibold leading-relaxed">No response to final pricing quote sent last week.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rising Interest */}
              <div className="bg-secondary border border-border rounded-xl p-4 flex flex-col justify-between min-h-[220px]">
                <div>
                  <div className="flex justify-between items-center pb-2 border-b border-border mb-3">
                    <h4 className="text-xs font-semibold text-brand-cyan uppercase tracking-wider flex items-center">
                      <Flame className="h-3.5 w-3.5 mr-1.5 animate-pulse" />
                      <span>Rising Interest</span>
                    </h4>
                    <span className="text-[9px] font-semibold bg-brand-cyan/15 text-brand-cyan px-1.5 py-0.5 rounded-full">
                      Spiking
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div className="p-2.5 bg-card border border-border rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-semibold text-foreground">Marcus Aurelius</span>
                        <span className="text-[9px] font-semibold text-brand-cyan bg-brand-cyan/15 px-1.5 py-0.5 rounded">Score 78</span>
                      </div>
                      <p className="text-[9px] text-muted-foreground mt-1 font-semibold leading-relaxed">Engagement spiked 45%. Reviewing integrations documentation.</p>
                    </div>
                    <div className="p-2.5 bg-card border border-border rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-semibold text-foreground">Empire Group</span>
                        <span className="text-[9px] font-semibold text-brand-cyan bg-brand-cyan/15 px-1.5 py-0.5 rounded">Score 74</span>
                      </div>
                      <p className="text-[9px] text-muted-foreground mt-1 font-semibold leading-relaxed">Opened product proposal email 5 times in the last 24h.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Going Cold */}
              <div className="bg-secondary border border-border rounded-xl p-4 flex flex-col justify-between min-h-[220px]">
                <div>
                  <div className="flex justify-between items-center pb-2 border-b border-border mb-3">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center">
                      <TrendingDown className="h-3.5 w-3.5 mr-1.5" />
                      <span>Going Cold</span>
                    </h4>
                    <span className="text-[9px] font-semibold bg-secondary text-muted-foreground px-1.5 py-0.5 rounded-full">
                      At Risk
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div className="p-2.5 bg-card border border-border rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-semibold text-foreground">David Hume</span>
                        <span className="text-[9px] font-semibold text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">Score 41</span>
                      </div>
                      <p className="text-[9px] text-muted-foreground mt-1 font-semibold leading-relaxed">No response to follow-ups in 14d. Budget constraints cited.</p>
                    </div>
                    <div className="p-2.5 bg-card border border-border rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-semibold text-foreground">Liberty Corp</span>
                        <span className="text-[9px] font-semibold text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">Score 35</span>
                      </div>
                      <p className="text-[9px] text-muted-foreground mt-1 font-semibold leading-relaxed">Inbound lead inactive for 21 days since discovery call.</p>
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
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="font-semibold text-foreground text-sm mb-3.5 flex items-center">
              <ShieldCheck className="h-4.5 w-4.5 mr-2 text-brand-purple" />
              <span>Pipeline Health Index</span>
            </h3>

            <div className="text-center py-4 bg-secondary border border-border rounded-xl">
              <span className="text-4xl font-serif text-foreground font-normal tabular-nums">94<span className="text-sm font-sans text-muted-foreground">/100</span></span>
              <p className="text-[10px] text-brand-cyan font-semibold mt-1.5">▲ Excellent Velocity (+3% vs yesterday)</p>
            </div>
            <p className="text-[9px] text-muted-foreground font-semibold mt-3 leading-relaxed">
              Calculated using meeting logs frequency, contract proposal response times, and target ratios.
            </p>
          </div>

          {/* Daily Priorities checklist */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="font-semibold text-foreground text-sm mb-4 flex items-center">
              <CheckSquare className="h-4.5 w-4.5 mr-2 text-brand-purple" />
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
                      isChecked ? 'bg-brand-purple border-brand-purple text-primary-foreground' : 'border-border bg-background'
                    }`}>
                      {isChecked && <Check className="h-3 w-3" strokeWidth={3} />}
                    </div>
                    <div className={isChecked ? 'line-through opacity-55' : ''}>
                      <div className="flex justify-between items-center w-full gap-2">
                        <h4 className="text-[11px] font-semibold text-foreground leading-tight">{item.title}</h4>
                        <span className={`text-[8px] font-bold shrink-0 ${item.priority === 'High' ? 'text-destructive' : 'text-muted-foreground'}`}>{item.priority}</span>
                      </div>
                      <p className="text-[9px] text-muted-foreground mt-0.5 leading-relaxed font-semibold">{item.desc}</p>
                      <p className="text-[9px] text-brand-purple font-semibold mt-1">Value: {item.dealValue}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Conversation Intelligence Section - Bhavani Summarization */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="font-semibold text-foreground text-sm mb-4 flex items-center">
          <BrainCircuit className="h-4.5 w-4.5 mr-2 text-brand-purple" />
          <span>Conversation Intelligence</span>
          <span className="ml-2 text-[9px] font-semibold text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">Bhavani</span>
        </h3>

        <div className="grid grid-cols-12 gap-4">
          {/* Sentiment Breakdown */}
          <div className="col-span-12 lg:col-span-4 p-4 border border-border rounded-xl bg-secondary">
            <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center">
              <Smile className="h-3.5 w-3.5 mr-1.5 text-brand-purple" />
              Sentiment Breakdown
            </h4>
            <div className="space-y-2.5">
              <div>
                <div className="flex justify-between text-[10px] font-semibold text-foreground mb-1">
                  <span className="flex items-center"><Smile className="h-3 w-3 text-brand-cyan mr-1" /> Positive</span>
                  <span className="tabular-nums">3</span>
                </div>
                <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-brand-cyan rounded-full" style={{ width: '60%' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[10px] font-semibold text-foreground mb-1">
                  <span className="flex items-center"><Meh className="h-3 w-3 text-amber-500 mr-1" /> Neutral</span>
                  <span className="tabular-nums">1</span>
                </div>
                <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: '20%' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[10px] font-semibold text-foreground mb-1">
                  <span className="flex items-center"><Frown className="h-3 w-3 text-destructive mr-1" /> Negative</span>
                  <span className="tabular-nums">1</span>
                </div>
                <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-destructive rounded-full" style={{ width: '20%' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Intent Distribution */}
          <div className="col-span-12 lg:col-span-4 p-4 border border-border rounded-xl bg-secondary">
            <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center">
              <Target className="h-3.5 w-3.5 mr-1.5 text-brand-purple" />
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
                  <div className="flex justify-between text-[10px] font-semibold text-foreground mb-1">
                    <span>{item.label}</span>
                    <span className="tabular-nums">{item.count}</span>
                  </div>
                  <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-brand-purple rounded-full" style={{ width: `${item.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[9px] text-muted-foreground font-semibold mt-3 leading-relaxed">
              Based on email thread analysis via Groq LLM
            </p>
          </div>

          {/* Recent Summaries with Follow-up */}
          <div className="col-span-12 lg:col-span-4 p-4 border border-border rounded-xl bg-secondary">
            <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center">
              <MessageSquare className="h-3.5 w-3.5 mr-1.5 text-brand-purple" />
              Recent Summaries
            </h4>
            <div className="space-y-2.5">
              {[
                { from: 'Alex Rivera', summary: 'SAML config approved, questions on liability SLAs.', sentiment: 'positive', category: 'sales', followUp: 'Follow up tomorrow with proposal' },
                { from: 'Helena Troy', summary: 'Pricing inquiry for 40-seat enterprise tier.', sentiment: 'neutral', category: 'sales', followUp: 'Follow up in 2 days with pricing' },
                { from: 'Marcus Aurelius', summary: 'Compliance audit files sent, awaiting feedback.', sentiment: 'positive', category: 'support', followUp: 'Follow up in 3 days' },
              ].map((item, i) => (
                <div key={i} className="p-2.5 bg-card border border-border rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] font-semibold text-foreground">{item.from}</span>
                    <div className="flex items-center space-x-1">
                      <span className={`text-[7px] font-bold px-1 py-0.5 rounded ${
                        item.category === 'sales' ? 'bg-brand-cyan/15 text-brand-cyan' :
                        item.category === 'urgent' ? 'bg-destructive/10 text-destructive' :
                        'bg-secondary text-muted-foreground'
                      }`}>{item.category}</span>
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${
                        item.sentiment === 'positive' ? 'bg-brand-cyan/15 text-brand-cyan' :
                        item.sentiment === 'negative' ? 'bg-destructive/10 text-destructive' :
                        'bg-secondary text-muted-foreground'
                      }`}>{item.sentiment}</span>
                    </div>
                  </div>
                  <p className="text-[9px] text-muted-foreground font-semibold leading-relaxed">{item.summary}</p>
                  <p className="text-[8px] text-amber-600 font-semibold mt-1">⏰ {item.followUp}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-[9px] text-brand-purple font-semibold flex items-center">
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

