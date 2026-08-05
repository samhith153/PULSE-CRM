'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  X, 
  Send, 
  Copy, 
  Check, 
  Bot, 
  User
} from 'lucide-react';
import { sendAssistantMessage } from '@/utils/api';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
  suggestions?: string[];
}

export default function AICopilotChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: "Hi! I'm PULSE Assistant. I can help you with anything in the CRM — from managing leads to understanding pipeline stages. What would you like to know?",
      timestamp: new Date(),
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const getUserRole = (): string => {
    if (typeof window === 'undefined') return 'sales_rep';
    return localStorage.getItem('pulse-crm-role') || 'sales_rep';
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      const userRole = getUserRole();
      const result = await sendAssistantMessage(textToSend, userRole);

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: result.response,
        timestamp: new Date(),
        suggestions: result.suggestions,
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error: any) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: "Sorry, I couldn't process your request. Please try again or ask your admin for help.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputValue);
    }
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
<<<<<<< HEAD
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-gradient-to-tr from-brand-accent to-brand-secondary-accent border border-brand-border-purple/35 flex items-center justify-center text-white shadow-[0_8px_30px_rgba(121,87,251,0.25)] hover:scale-105 active:scale-95 transition-all duration-200 z-50 cursor-pointer group"
        aria-label="Ask PULSE Assistant"
=======
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-gradient-to-tr from-brand-accent to-brand-secondary-accent border border-border flex items-center justify-center text-primary-foreground shadow-[0_8px_30px_rgba(121,87,251,0.25)] hover:scale-105 active:scale-95 transition-all duration-200 z-50 cursor-pointer group"
        aria-label="Ask PulseAI"
>>>>>>> origin/new-ui
      >
        {isOpen ? (
          <X className="h-6 w-6 transition-transform duration-300 rotate-90" />
        ) : (
          <div className="relative">
            <Sparkles className="h-6 w-6 animate-pulse group-hover:rotate-12 transition-transform duration-200" />
            <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-sky-500 border border-white"></span>
            </span>
          </div>
        )}
      </button>

      {/* Slide-over Chat Box */}
      {isOpen && (
        <div className="fixed bottom-22 right-6 w-[380px] max-h-[580px] h-[500px] rounded-2xl border border-border bg-card/95 backdrop-blur-md  flex flex-col overflow-hidden z-50 animate-in slide-in-from-bottom-8 fade-in duration-300 text-muted-foreground">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-900 to-indigo-950 p-4 flex items-center justify-between text-white border-b border-border shrink-0">
            <div className="flex items-center space-x-2.5">
              <div className="h-9.5 w-9.5 rounded-xl bg-white/10 flex items-center justify-center">
                <Sparkles className="h-5.5 w-5.5 text-white" />
              </div>
              <div>
<<<<<<< HEAD
                <h3 className="text-sm font-black tracking-wide">PULSE Assistant</h3>
                <div className="flex items-center space-x-1 mt-0.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="text-[10px] text-white/85 font-bold uppercase tracking-wider">CRM Help</span>
=======
                <h3 className="text-sm font-semibold tracking-wide">PulseAI Copilot</h3>
                <div className="flex items-center space-x-1 mt-0.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="text-[10px] text-primary-foreground/85 font-bold uppercase tracking-wider">Online Sync</span>
>>>>>>> origin/new-ui
                </div>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
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
                    <div className="h-7 w-7 rounded-lg bg-brand-purple/10 border border-brand-accent/20 flex items-center justify-center shrink-0">
                      <Bot className="h-4 w-4 text-brand-purple" />
                    </div>
                  )}
                  
                  <div className="max-w-[78%] flex flex-col space-y-1.5">
                    <div className={`p-3 rounded-xl text-xs leading-relaxed font-medium ${
                      isAI 
                        ? 'bg-secondary border border-border text-muted-foreground' 
                        : 'bg-brand-purple text-primary-foreground rounded-br-none'
                    }`}>
                      <p className="whitespace-pre-wrap">{m.text}</p>
<<<<<<< HEAD
                    </div>

                    {/* Suggestion Chips (only on AI messages) */}
                    {isAI && m.suggestions && m.suggestions.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {m.suggestions.map((suggestion, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="px-2 py-1 bg-brand-bg border border-brand-border-purple/20 hover:border-brand-accent hover:text-brand-accent rounded-full text-[9px] font-bold transition-all cursor-pointer shadow-sm/5"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}

                    <span className="text-[9px] text-slate-400 self-start px-1 font-bold">
=======

                      {/* --- Pipeline Metric Cards --- */}
                      {isAI && m.type === 'pipeline' && m.data && (
                        <div className="mt-3.5 space-y-2.5 border-t border-border pt-3">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="bg-background border border-border p-2.5 rounded-lg text-center">
                              <p className="text-[9px] text-muted-foreground font-semibold uppercase">Total pipeline</p>
                              <p className="text-sm font-semibold text-foreground mt-0.5 tabular-nums">
                                ${m.data.totalValue.toLocaleString()}
                              </p>
                            </div>
                            <div className="bg-background border border-border p-2.5 rounded-lg text-center">
                              <p className="text-[9px] text-muted-foreground font-semibold uppercase">Weighted forecast</p>
                              <p className="text-sm font-semibold text-brand-cyan mt-0.5 tabular-nums">
                                ${m.data.weightedForecast.toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <div className="bg-background border border-border p-2.5 rounded-lg">
                            <p className="text-[9px] text-muted-foreground font-semibold uppercase mb-1">Deals by Stage ({m.data.count})</p>
                            <div className="space-y-1">
                              {Object.entries(m.data.stages).map(([stage, count]: any) => (
                                <div key={stage} className="flex justify-between text-[10px] font-bold text-muted-foreground">
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
                        <div className="mt-3.5 space-y-2 border-t border-border pt-3">
                          {m.data.map((lead: Lead) => (
                            <div key={lead.id} className="bg-background border border-border p-2.5 rounded-lg flex items-center justify-between gap-1">
                              <div className="min-w-0">
                                <p className="text-[11px] font-semibold text-foreground truncate">{lead.title}</p>
                                <p className="text-[9px] text-brand-purple font-bold truncate mt-0.5">{lead.company_name || ''}</p>
                              </div>
                              <span className="text-[10px] font-semibold bg-brand-cyan/15 text-brand-cyan px-1.5 py-0.5 rounded tabular-nums shrink-0">
                                Score: {lead.score ?? 0}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* --- Generated Email Draft Template --- */}
                      {isAI && m.type === 'email' && m.data && (
                        <div className="mt-3.5 border-t border-border pt-3">
                          <div className="relative bg-background border border-border p-2.5 rounded-lg font-mono text-[9.5px] whitespace-pre-wrap leading-normal text-muted-foreground/90">
                            {m.data.template}
                            <button
                              onClick={() => handleCopy(m.data.template, m.id)}
                              className="absolute top-2 right-2 p-1.5 bg-secondary hover:bg-secondary/80 border border-border rounded text-muted-foreground hover:text-muted-foreground cursor-pointer transition-colors "
                              title="Copy email draft"
                            >
                              {copiedId === m.id ? (
                                <Check className="h-3 w-3 text-brand-cyan" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    <span className="text-[9px] text-muted-foreground self-start px-1 font-bold">
>>>>>>> origin/new-ui
                      {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  
                  {!isAI && (
                    <div className="h-7 w-7 rounded-lg bg-brand-purple flex items-center justify-center shrink-0">
                      <User className="h-4 w-4 text-primary-foreground" />
                    </div>
                  )}
                </div>
              );
            })}

            {isTyping && (
              <div className="flex items-start space-x-2.5 justify-start">
                <div className="h-7 w-7 rounded-lg bg-brand-purple/10 border border-brand-purple/20 flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4 text-brand-purple animate-bounce" />
                </div>
                <div className="max-w-[78%] p-3 rounded-xl text-xs bg-secondary border border-border flex items-center space-x-1">
                  <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce delay-100"></span>
                  <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce delay-200"></span>
                  <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce delay-300"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions Shortcuts Selector */}
          <div className="px-4 py-2 border-t border-border flex space-x-2 overflow-x-auto shrink-0 bg-secondary/40 scrollbar-none">
            {[
              { label: '📋 Create Lead', text: 'How do I create a lead?' },
              { label: '🔄 Convert Lead', text: 'How do I convert a lead?' },
              { label: '📊 Pipeline', text: 'How do I manage the pipeline?' },
              { label: '📧 Connect Gmail', text: 'How do I connect my Gmail?' }
            ].map((btn) => (
              <button
                key={btn.text}
<<<<<<< HEAD
                onClick={() => handleSendMessage(btn.text)}
                className="py-1 px-2.5 bg-brand-bg border border-brand-border-purple/20 hover:border-brand-accent hover:text-brand-accent rounded-full text-[10px] font-bold transition-all whitespace-nowrap cursor-pointer shadow-sm/5"
=======
                onClick={() => triggerShortcut(btn.text)}
                className="py-1 px-2.5 bg-brand-bg border border-border hover:border-brand-accent hover:text-brand-purple rounded-full text-[10px] font-bold transition-all whitespace-nowrap cursor-pointer "
>>>>>>> origin/new-ui
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
            className="p-3 border-t border-border flex items-center space-x-2 shrink-0 bg-card"
          >
            <input
              ref={inputRef}
              type="text"
              placeholder="Ask about PULSE CRM..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
<<<<<<< HEAD
              onKeyDown={handleKeyDown}
              className="flex-1 px-3 py-1.5 border border-brand-border-purple/25 rounded-lg text-xs focus:outline-none focus:border-brand-accent transition-colors bg-brand-sidebar-hover/10 text-brand-text placeholder-brand-text/50"
              disabled={isTyping}
=======
              className="flex-1 px-3 py-1.5 border border-border rounded-lg text-xs focus:outline-none focus:border-brand-accent transition-colors bg-brand-sidebar-hover/10 text-muted-foreground placeholder-brand-text/50"
>>>>>>> origin/new-ui
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isTyping}
              className="h-8 w-8 rounded-lg bg-brand-purple text-primary-foreground flex items-center justify-center hover:bg-brand-purple/90 disabled:opacity-50 transition-all cursor-pointer shrink-0"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
