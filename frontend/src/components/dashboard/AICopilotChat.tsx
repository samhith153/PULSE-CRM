'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  MessageSquareCode, 
  X, 
  Send, 
  TrendingUp, 
  Award, 
  Mail, 
  Copy, 
  Check, 
  Bot, 
  User,
  ArrowRight
} from 'lucide-react';
import { getLeads, getDeals, Lead } from '@/utils/api';

interface DealItem {
  id: string;
  title: string;
  company: string;
  value: number;
  stage: string;
  priority: string;
  owner: string;
  closeDate: string;
}

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
  type?: 'text' | 'pipeline' | 'leads' | 'email';
  data?: any;
}

export default function AICopilotChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: "Hi Alex! I'm your PulseAI Copilot. How can I help you accelerate sales today?",
      timestamp: new Date(),
      type: 'text'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Loaded data for real-time computations
  const [leads, setLeads] = useState<Lead[]>([]);
  const [deals, setDeals] = useState<DealItem[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Pre-fetch data for instant availability
    async function loadCRMData() {
      try {
        const [fetchedLeads, fetchedDeals] = await Promise.all([
          getLeads(),
          getDeals()
        ]);
        setLeads(fetchedLeads);
        setDeals(fetchedDeals as any);
      } catch (err) {
        console.error('Error fetching data for AI Copilot:', err);
      }
    }
    loadCRMData();
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const simulateBotReply = (userText: string) => {
    setIsTyping(true);
    
    setTimeout(() => {
      setIsTyping(false);
      const textLower = userText.toLowerCase();
      let botMessage: Partial<Message> = {
        id: Math.random().toString(),
        sender: 'ai',
        timestamp: new Date()
      };

      if (textLower.includes('pipeline') || textLower.includes('health') || textLower.includes('deal') || textLower.includes('forecast')) {
        // Compute pipeline metrics
        const totalValue = deals.reduce((sum, d) => sum + d.value, 0);
        const stageCounts = deals.reduce((acc, d) => {
          acc[d.stage] = (acc[d.stage] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        // Calculate weighted forecast
        const stageProbabilities: Record<string, number> = {
          'Qualified': 0.1,
          'Proposal': 0.4,
          'Under Review': 0.7,
          'Won': 1.0,
          'Lost': 0.0
        };
        const weightedForecast = deals.reduce((sum, d) => {
          const prob = stageProbabilities[d.stage] || 0;
          return sum + (d.value * prob);
        }, 0);

        botMessage.text = "Here is the real-time breakdown of your current deals pipeline:";
        botMessage.type = 'pipeline';
        botMessage.data = {
          totalValue,
          weightedForecast,
          count: deals.length,
          stages: stageCounts
        };
      } else if (textLower.includes('lead') || textLower.includes('recommend') || textLower.includes('score')) {
        // Sort leads by AI Score
        const sortedLeads = [...leads].sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).slice(0, 3);
        botMessage.text = "Based on activity velocity and lead scores, here are the top 3 high-priority leads you should follow up with:";
        botMessage.type = 'leads';
        botMessage.data = sortedLeads;
      } else if (textLower.includes('email') || textLower.includes('draft') || textLower.includes('follow up') || textLower.includes('follow-up')) {
        // Grab a lead name if available
        const leadName = leads[0]?.title || "Alex Rivera";
        const companyName = leads[0]?.company_name || leads[0]?.company_id || "TechCorp Inc.";
        const emailTemplate = `Subject: Quick follow up - Pulse CRM

Hi ${leadName.split(' ')[0]},

It was great connecting with you recently regarding ${companyName}'s CRM migration goals. 

I've put together the database migration timeline and regional security audit sheets we discussed. Let me know if you have 10 minutes for a quick call this Thursday at 2:00 PM to review these options.

Best regards,
Alex Johnson
Sales Manager, Pulse CRM`;

        botMessage.text = `Here is a custom follow-up draft for **${leadName}** (${companyName}):`;
        botMessage.type = 'email';
        botMessage.data = {
          template: emailTemplate,
          recipient: leadName
        };
      } else {
        botMessage.text = "I can help you review your pipeline, recommend priority leads, or draft professional follow-up templates. Try choosing one of the shortcuts below!";
        botMessage.type = 'text';
      }

      setMessages(prev => [...prev, botMessage as Message]);
    }, 1500);
  };

  const handleSendMessage = (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMessage: Message = {
      id: Math.random().toString(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date(),
      type: 'text'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    simulateBotReply(textToSend);
  };

  const triggerShortcut = (actionText: string) => {
    handleSendMessage(actionText);
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-accent-color/15 hover:bg-accent-color/25 dark:bg-accent-color/25 dark:hover:bg-accent-color/35 backdrop-blur-md border border-accent-color/30 flex items-center justify-center text-accent-color dark:text-chart-5 shadow-[0_8px_32px_rgba(29,78,216,0.25)] hover:scale-105 active:scale-95 transition duration-200 z-50 cursor-pointer group"
        aria-label="Ask PulseAI"
      >
        {isOpen ? (
          <X className="h-6 w-6 transition-transform duration-300 rotate-90" />
        ) : (
          <div className="relative">
            <Sparkles className="h-6 w-6 animate-pulse group-hover:rotate-12 transition-transform duration-200" />
            <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-chart-5 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-chart-5 border border-white"></span>
            </span>
          </div>
        )}
      </button>

      {/* Slide-over Chat Box */}
      {isOpen && (
        <div className="fixed bottom-22 right-6 w-[380px] max-h-[580px] h-[500px] rounded-2xl border border-border-default bg-surface-1/95 backdrop-blur-md  flex flex-col overflow-hidden z-50 animate-in slide-in-from-bottom-8 fade-in duration-300 text-text-muted">
          {/* Header */}
          <div className="bg-gradient-to-r from-accent-color to-accent-color/90 p-4 flex items-center justify-between text-white border-b border-border-default shrink-0">
            <div className="flex items-center space-x-2.5">
              <div className="h-9.5 w-9.5 rounded-xl bg-card/15 flex items-center justify-center">
                <Sparkles className="h-5.5 w-5.5 text-primary-foreground" />
              </div>
              <div>
                <h3 className="text-sm font-semibold tracking-wide text-white">PulseAI Copilot</h3>
                <div className="flex items-center space-x-1 mt-0.5">
                  <span className="h-2 w-2 rounded-full bg-status-success-text animate-pulse"></span>
                  <span className="text-[10px] text-white/90 font-bold uppercase tracking-wider">Online Sync</span>
                </div>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-primary-foreground/80 hover:text-primary-foreground transition-colors p-1 rounded-lg hover:bg-card/10"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>

          {/* Messages Grid */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin select-none">
            {messages.map((m) => {
              const isAI = m.sender === 'ai';
              return (
                <div key={m.id} className={`flex items-start space-x-2.5 ${isAI ? 'justify-start' : 'justify-end'}`}>
                  {isAI && (
                    <div className="h-7 w-7 rounded-lg bg-accent-color/10 border border-brand-accent/20 flex items-center justify-center shrink-0">
                      <Bot className="h-4 w-4 text-accent-color" />
                    </div>
                  )}
                  
                  <div className="max-w-[78%] flex flex-col space-y-1.5">
                    <div className={`p-3 rounded-xl text-xs leading-relaxed font-medium ${
                      isAI 
                        ? 'bg-surface-2 border border-border-default text-text-muted' 
                        : 'bg-accent-color text-surface-0 rounded-br-none'
                    }`}>
                      <p className="whitespace-pre-wrap">{m.text}</p>

                      {/* --- Pipeline Metric Cards --- */}
                      {isAI && m.type === 'pipeline' && m.data && (
                        <div className="mt-3.5 space-y-2.5 border-t border-border-default pt-3">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="bg-surface-0 border border-border-default p-2.5 rounded-lg text-center">
                              <p className="text-[9px] text-text-muted font-semibold uppercase">Total pipeline</p>
                              <p className="text-sm font-semibold text-text-primary mt-0.5 tabular-nums">
                                ${m.data.totalValue.toLocaleString()}
                              </p>
                            </div>
                            <div className="bg-surface-0 border border-border-default p-2.5 rounded-lg text-center">
                              <p className="text-[9px] text-text-muted font-semibold uppercase">Weighted forecast</p>
                              <p className="text-sm font-semibold text-accent-color mt-0.5 tabular-nums">
                                ${m.data.weightedForecast.toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <div className="bg-surface-0 border border-border-default p-2.5 rounded-lg">
                            <p className="text-[9px] text-text-muted font-semibold uppercase mb-1">Deals by Stage ({m.data.count})</p>
                            <div className="space-y-1">
                              {Object.entries(m.data.stages).map(([stage, count]: any) => (
                                <div key={stage} className="flex justify-between text-[10px] font-bold text-text-muted">
                                  <span>{stage}</span>
                                  <span className="tabular-nums">{count}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* --- Leads Recommended List --- */}
                      {isAI && m.type === 'leads' && m.data && (
                        <div className="mt-3.5 space-y-2 border-t border-border-default pt-3">
                          {m.data.map((lead: Lead) => (
                            <div key={lead.id} className="bg-surface-0 border border-border-default p-2.5 rounded-lg flex items-center justify-between gap-1">
                              <div className="min-w-0">
                                <p className="text-[11px] font-semibold text-text-primary truncate">{lead.title}</p>
                                <p className="text-[9px] text-accent-color font-bold truncate mt-0.5">{lead.company_name || ''}</p>
                              </div>
                              <span className="text-[10px] font-semibold bg-accent-color/15 text-accent-color px-1.5 py-0.5 rounded tabular-nums shrink-0">
                                Score: {lead.score ?? 0}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* --- Generated Email Draft Template --- */}
                      {isAI && m.type === 'email' && m.data && (
                        <div className="mt-3.5 border-t border-border-default pt-3">
                          <div className="relative bg-surface-0 border border-border-default p-2.5 rounded-lg font-mono text-[9.5px] whitespace-pre-wrap leading-normal text-text-muted/90">
                            {m.data.template}
                            <button
                              onClick={() => handleCopy(m.data.template, m.id)}
                              className="absolute top-2 right-2 p-1.5 bg-surface-2 hover:bg-surface-2/80 border border-border-default rounded text-text-muted hover:text-text-muted cursor-pointer transition-colors "
                              title="Copy email draft"
                            >
                              {copiedId === m.id ? (
                                <Check className="h-3 w-3 text-accent-color" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    <span className="text-[9px] text-text-muted self-start px-1 font-bold">
                      {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  
                  {!isAI && (
                    <div className="h-7 w-7 rounded-lg bg-accent-color flex items-center justify-center shrink-0">
                      <User className="h-4 w-4 text-surface-0" />
                    </div>
                  )}
                </div>
              );
            })}

            {isTyping && (
              <div className="flex items-start space-x-2.5 justify-start">
                <div className="h-7 w-7 rounded-lg bg-accent-color/10 border border-accent-color/20 flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4 text-accent-color animate-bounce" />
                </div>
                <div className="max-w-[78%] p-3 rounded-xl text-xs bg-surface-2 border border-border-default flex items-center space-x-1">
                  <span className="h-1.5 w-1.5 bg-muted rounded-full animate-bounce delay-100"></span>
                  <span className="h-1.5 w-1.5 bg-muted rounded-full animate-bounce delay-200"></span>
                  <span className="h-1.5 w-1.5 bg-muted rounded-full animate-bounce delay-300"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions Shortcuts Selector */}
          <div className="px-4 py-2 border-t border-border-default flex space-x-2 overflow-x-auto shrink-0 bg-surface-2/40 scrollbar-none">
            {[
              { label: '📊 Pipeline Health', text: 'Pipeline Health' },
              { label: '⚡ Recommendations', text: 'Lead recommendations' },
              { label: '📧 Draft Email', text: 'Draft follow-up email' }
            ].map((btn) => (
              <button
                key={btn.text}
                onClick={() => triggerShortcut(btn.text)}
                className="py-1 px-2.5 bg-surface-1 border border-border-default hover:border-accent-color hover:text-accent-color rounded-full text-[10px] font-bold transition whitespace-nowrap cursor-pointer "
              >
                {btn.label}
              </button>
            ))}
          </div>

          {/* Input field */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputValue);
            }} 
            className="p-3 border-t border-border-default flex items-center space-x-2 shrink-0 bg-surface-1"
          >
            <input
              type="text"
              placeholder="Ask Copilot something..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="flex-1 px-3 py-1.5 border border-border-default rounded-lg text-xs focus:outline-none focus:border-accent-color transition-colors bg-surface-0 text-text-primary placeholder-muted-foreground"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isTyping}
              className="h-8 w-8 rounded-lg bg-accent-color text-surface-0 flex items-center justify-center hover:bg-accent-color/90 disabled:opacity-50 transition cursor-pointer shrink-0"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
