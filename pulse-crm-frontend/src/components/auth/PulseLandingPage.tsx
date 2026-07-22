'use client';

import React, { useState } from 'react';
import { 
  Mail, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles, 
  Layers, 
  Activity, 
  Loader2,
  X,
  LayoutDashboard,
  CheckCircle2,
  Lock,
  ChevronRight,
  TrendingUp,
  Award,
  Zap,
  Users
} from 'lucide-react';

interface PulseLandingPageProps {
  onLogin: (role: 'representative' | 'manager' | 'admin') => void;
}

export default function PulseLandingPage({ onLogin }: PulseLandingPageProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Interactive Product Suite Tab State
  const [activeTab, setActiveTab] = useState(0);
  
  // Login Role Selection State
  const [selectedRole, setSelectedRole] = useState<'representative' | 'manager' | 'admin'>('manager');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsModalOpen(false);
      onLogin(selectedRole);
    }, 1200); // Simulated loading
  };

  const handleGoogleLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsModalOpen(false);
      onLogin(selectedRole);
    }, 1200);
  };

  // Premium product suites definitions with light-mode software mockups
  const productSuites = [
    {
      title: 'Sales & Pipeline',
      icon: LayoutDashboard,
      badge: 'Revenue Acceleration',
      heading: 'Manage deals & automate sales stages',
      desc: 'Move deals through customizable funnel columns, coordinate sales reps on a live revenue leaderboard, and instantly log updates.',
      features: [
        'Interactive kanban deal pipeline boards',
        'Sales rep revenue leaderboards',
        'Win/loss analysis reason codes'
      ],
      color: 'from-purple-600 to-indigo-600',
      mockup: (
        <div className="w-full h-full p-4 flex flex-col justify-between bg-white text-slate-900 rounded-xl shadow-md border border-slate-200/90">
          <div className="flex justify-between items-center pb-2.5 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
              <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">Active Deals Board</span>
            </div>
            <span className="text-[9px] text-slate-400 font-semibold">Updated just now</span>
          </div>
          {/* Light Kanban Board */}
          <div className="grid grid-cols-3 gap-2 flex-1 mt-3">
            {[
              { col: 'Qualified', name: 'Acme Corp', val: '$120,000', tag: 'High Priority' },
              { col: 'Proposal', name: 'Initech Inc', val: '$85,000', tag: 'Under Review' },
              { col: 'Negotiation', name: 'Stark Ind.', val: '$230,000', tag: 'Closing Soon' }
            ].map((card, i) => (
              <div key={i} className="bg-slate-50/80 p-2.5 rounded-lg border border-slate-200/70 flex flex-col justify-between hover:border-slate-300 transition-colors">
                <div>
                  <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">{card.col}</span>
                  <span className="text-[10.5px] font-bold text-slate-800 mt-1 block truncate">{card.name}</span>
                </div>
                <div className="mt-2">
                  <span className="text-[10px] text-indigo-600 font-extrabold block">{card.val}</span>
                  <span className="text-[7.5px] font-semibold text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200 mt-1 inline-block">{card.tag}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      title: 'Smart Emails',
      icon: Mail,
      badge: 'Unified Communications',
      heading: 'Integrated inbox syncing & timeline logs',
      desc: 'Keep client communications linked natively to deals. Sync thread timelines automatically and utilize templates to reach contacts faster.',
      features: [
        'Real-time background Gmail syncing',
        'Thread timeline logging by deal and contact',
        'Templates and rapid-fire replies'
      ],
      color: 'from-blue-600 to-cyan-600',
      mockup: (
        <div className="w-full h-full p-4 flex flex-col justify-between bg-white text-slate-900 rounded-xl shadow-md border border-slate-200/90">
          <div className="flex justify-between items-center pb-2.5 border-b border-slate-100">
            <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">Communication Timeline</span>
            <span className="text-[9px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">Live Sync</span>
          </div>
          <div className="space-y-2 mt-3 flex-1 overflow-hidden">
            {[
              { from: 'Alex Rivera', sub: 'Proposal revisions finalized & SLA approved', time: '10m ago' },
              { from: 'Helena Troy', sub: 'Inquiry regarding custom enterprise tier', time: '1h ago' },
              { from: 'Marcus Vance', sub: 'Contract signed & dispatched to team', time: '3h ago' }
            ].map((mail, i) => (
              <div key={i} className="bg-slate-50/70 p-2.5 rounded-lg border border-slate-200/60 flex justify-between items-center text-[10px]">
                <div className="min-w-0 flex-1 pr-2">
                  <span className="font-bold text-slate-800 truncate block">{mail.from}</span>
                  <span className="text-[9px] text-slate-500 truncate block mt-0.5">{mail.sub}</span>
                </div>
                <span className="text-[8px] text-slate-400 shrink-0 font-medium">{mail.time}</span>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      title: 'AI Co-pilot',
      icon: Sparkles,
      badge: 'Sales Intelligence',
      heading: 'Automated deal forecasts & priority insights',
      desc: 'Get smart suggestions, draft custom client responses, look up deal progress, and compute forecasting models with a floating Copilot.',
      features: [
        'Interactive AI chat prompt actions',
        'Automated priority rankings for leads',
        'Live summary generators for deals timeline'
      ],
      color: 'from-violet-600 to-purple-600',
      mockup: (
        <div className="w-full h-full p-4 flex flex-col justify-between bg-white text-slate-900 rounded-xl shadow-md border border-slate-200/90">
          <div className="flex justify-between items-center pb-2.5 border-b border-slate-100">
            <div className="flex items-center space-x-1.5">
              <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
              <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">PulseAI Assistant</span>
            </div>
            <span className="text-[8px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">GPT-4o Ready</span>
          </div>
          <div className="space-y-2 mt-3 flex-1 text-[9.5px]">
            <div className="bg-slate-100/70 p-2.5 rounded-lg border border-slate-200/60 text-slate-600 font-medium">
              Summarize the status of Acme Corp deal.
            </div>
            <div className="bg-indigo-50/70 p-2.5 rounded-lg border border-indigo-100 text-slate-800 font-medium leading-relaxed">
              ✨ <span className="font-bold text-indigo-950">Acme Corp ($120k):</span> Security review passed. Next step: Final sign-off meeting scheduled for Thursday.
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Advanced Analytics',
      icon: Activity,
      badge: 'Real-time Telemetry',
      heading: 'Pipeline telemetry & conversion tracking',
      desc: 'Visualize team contributions with activity heatmaps. Trace conversion metrics across your pipeline step-by-step.',
      features: [
        'Sales rep activity heatmap widget',
        'Stepped radial progress rings chart',
        'Custom report builder dashboard grids'
      ],
      color: 'from-emerald-600 to-teal-600',
      mockup: (
        <div className="w-full h-full p-4 flex flex-col justify-between bg-white text-slate-900 rounded-xl shadow-md border border-slate-200/90">
          <div className="flex justify-between items-center pb-2.5 border-b border-slate-100">
            <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">Conversion Analytics</span>
            <Activity className="h-3.5 w-3.5 text-emerald-600" />
          </div>
          <div className="mt-3 flex-1 flex flex-col justify-between">
            <div className="text-[9.5px] text-slate-500 font-medium">Funnel Conversion Rate:</div>
            <div className="flex items-center space-x-6 mt-1">
              <svg className="h-16 w-16 transform -rotate-90 select-none shrink-0" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="14" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                <circle cx="18" cy="18" r="10.5" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                <circle cx="18" cy="18" r="14" fill="none" stroke="#6366f1" strokeWidth="3" strokeDasharray="87.9" strokeDashoffset="25.5" strokeLinecap="round" />
                <circle cx="18" cy="18" r="10.5" fill="none" stroke="#10b981" strokeWidth="3" strokeDasharray="65.9" strokeDashoffset="34.3" strokeLinecap="round" />
              </svg>
              <div className="space-y-1.5 text-[9.5px] text-left">
                <div className="flex items-center space-x-1.5">
                  <span className="h-2 w-2 rounded-full bg-indigo-600 shrink-0"></span>
                  <span className="text-slate-700 font-bold">Qualified → Proposal: 71%</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0"></span>
                  <span className="text-slate-700 font-bold">Proposal → Closed Won: 48%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 flex flex-col overflow-x-hidden text-white font-sans relative">
      
      {/* Soft Decorative Ambient Lighting */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-purple-400/30 blur-[140px] rounded-full pointer-events-none z-0" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-cyan-300/30 blur-[130px] rounded-full pointer-events-none z-0" />
      
      {/* 1. Top Navigation Bar with Pulse Brand Logo & Details */}
      <header className="sticky top-0 bg-slate-900/20 backdrop-blur-xl z-40 h-20 w-full flex items-center justify-between px-6 md:px-12 select-none border-b border-white/10">
        
        {/* Left: Pulse CRM Brand Logo & Navigation Links */}
        <div className="flex items-center space-x-8 md:space-x-12">
          
          {/* 3D Pulse Logo Mark & Name */}
          <div className="flex items-center space-x-3 cursor-pointer group select-none">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-pink-500 via-purple-600 to-cyan-400 p-0.5 shadow-lg shadow-pink-500/30 group-hover:scale-105 transition-transform flex items-center justify-center">
              <div className="h-full w-full bg-slate-950/80 backdrop-blur-md rounded-[14px] flex items-center justify-center">
                <Activity className="h-5 w-5 text-pink-400 group-hover:rotate-12 transition-transform" strokeWidth={2.5} />
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center space-x-1">
                <span className="text-xl font-black text-white tracking-tight font-sans">Pulse</span>
                <span className="text-xl font-black text-pink-300 font-sans">CRM</span>
              </div>
              <span className="text-[9px] font-extrabold text-cyan-300 uppercase tracking-widest leading-none">
                AI Revenue Engine
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="hidden lg:flex items-center space-x-7 text-xs font-bold tracking-wide">
            <a href="#" className="text-pink-300 hover:text-white transition-colors font-extrabold">Home</a>
            <a href="#suite" className="text-white/85 hover:text-white transition-colors">Read More</a>
            <a href="#features" className="text-white/85 hover:text-white transition-colors">Contact</a>
            <a href="#" onClick={() => setIsModalOpen(true)} className="text-white/85 hover:text-white transition-colors">Sign Up</a>
          </div>
        </div>

        {/* Right Auth Action Pill Buttons */}
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-2 bg-white text-indigo-700 hover:bg-slate-100 rounded-full text-xs font-extrabold shadow-md hover:shadow-lg hover:scale-105 transition-all cursor-pointer"
          >
            Log in
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-2 bg-pink-500/30 border border-pink-400/50 hover:bg-pink-500/50 text-white rounded-full text-xs font-extrabold transition-all cursor-pointer shadow-xs"
          >
            Register
          </button>
        </div>
      </header>

      {/* 2. Main Hero Section (Matching image composition with 3D Figures) */}
      <section className="relative w-full py-12 md:py-20 bg-transparent flex items-center justify-center px-8 md:px-16 z-10 flex-1">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          {/* Left Column: Core Value Pitch (Restored Original Text & CTAs) */}
          <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
            
            {/* Sleek Live Announcement Badge */}
            <div className="inline-flex items-center space-x-2 px-3.5 py-1 bg-white/20 backdrop-blur-md border border-white/30 rounded-full text-white text-xs font-semibold shadow-xs">
              <span className="h-2 w-2 rounded-full bg-pink-400 animate-pulse"></span>
              <span>Pulse CRM 2.0 is now live</span>
              <ChevronRight className="h-3.5 w-3.5 text-white/80" />
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.12] drop-shadow-md font-sans">
              The intelligent CRM built for{' '}
              <span className="text-pink-300 drop-shadow-sm font-black">
                high-growth teams.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-white/90 font-medium leading-relaxed max-w-xl mx-auto lg:mx-0">
              Pulse unifies deal pipelines, automated email syncing, rep leaderboards, and real-time AI copilot assistance into one intuitive, high-performance workspace.
            </p>

            {/* Restored CTA Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 pt-2 justify-center lg:justify-start">
              <button 
                onClick={() => setIsModalOpen(true)}
                className="px-7 py-3.5 bg-pink-500 hover:bg-pink-600 text-white rounded-full text-xs font-extrabold shadow-lg shadow-pink-500/40 hover:shadow-pink-500/60 hover:scale-105 transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <span>Start 14-Day Free Trial</span>
                <ArrowRight className="h-4 w-4" />
              </button>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="px-7 py-3.5 bg-white/15 backdrop-blur-md border border-white/40 hover:bg-white/25 text-white rounded-full text-xs font-extrabold shadow-sm hover:scale-105 transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <span>Book Live Demo</span>
              </button>
            </div>

            {/* Restored Trust Bullets */}
            <ul className="flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-2 text-xs font-semibold text-white/90 select-none pt-2">
              <li className="flex items-center space-x-1.5">
                <CheckCircle2 className="h-4 w-4 text-cyan-300" />
                <span>14-day free trial</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <CheckCircle2 className="h-4 w-4 text-cyan-300" />
                <span>No credit card required</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <CheckCircle2 className="h-4 w-4 text-cyan-300" />
                <span>2-minute setup</span>
              </li>
            </ul>
          </div>

          {/* Right Column: Dynamic 3D Figure Scene (No static images) */}
          <div className="lg:col-span-6 flex justify-center items-center">
            <div className="relative w-full max-w-lg h-[400px] flex items-center justify-center select-none perspective-[1000px]">
              
              {/* Ambient Glow behind 3D figures */}
              <div className="absolute inset-0 bg-gradient-to-tr from-cyan-300/30 via-pink-400/20 to-purple-500/30 blur-3xl rounded-full transform -translate-y-4 pointer-events-none" />

              {/* 3D Scene Assembly */}
              <div className="relative w-full h-full flex items-center justify-center transform-style-3d group">

                {/* 1. Dual 3D Rotating Pink Gears (Left / Behind) */}
                <div className="absolute left-6 bottom-20 z-10 transform -rotate-12 group-hover:rotate-0 transition-transform duration-700 ease-out">
                  {/* Main Large 3D Pink Gear */}
                  <div className="relative w-28 h-28 animate-[spin_25s_linear_infinite]">
                    <svg viewBox="0 0 100 100" className="w-full h-full filter drop-shadow-[0_15px_25px_rgba(225,29,72,0.4)]">
                      <defs>
                        <linearGradient id="pinkGearGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#fb7185" />
                          <stop offset="50%" stopColor="#f43f5e" />
                          <stop offset="100%" stopColor="#be123c" />
                        </linearGradient>
                      </defs>
                      <path
                        fill="url(#pinkGearGrad)"
                        d="M50,30 A20,20 0 1,0 50,70 A20,20 0 1,0 50,30 Z M50,0 L56,10 L68,6 L70,18 L82,18 L80,30 L90,36 L84,46 L92,54 L84,62 L90,72 L80,78 L82,90 L70,90 L68,102 L56,98 L50,108 L44,98 L32,102 L30,90 L18,90 L20,78 L10,72 L16,62 L8,54 L16,46 L6,36 L16,30 L14,18 L26,18 L28,6 L40,10 Z"
                      />
                      <circle cx="50" cy="50" r="14" fill="#67e8f9" opacity="0.9" />
                    </svg>
                  </div>
                  
                  {/* Secondary Pink Gear */}
                  <div className="absolute -top-10 -left-6 w-18 h-18 animate-[spin_18s_linear_infinite_reverse]">
                    <svg viewBox="0 0 100 100" className="w-full h-full filter drop-shadow-[0_10px_20px_rgba(244,63,94,0.35)]">
                      <path
                        fill="url(#pinkGearGrad)"
                        d="M50,30 A20,20 0 1,0 50,70 A20,20 0 1,0 50,30 Z M50,0 L56,10 L68,6 L70,18 L82,18 L80,30 L90,36 L84,46 L92,54 L84,62 L90,72 L80,78 L82,90 L70,90 L68,102 L56,98 L50,108 L44,98 L32,102 L30,90 L18,90 L20,78 L10,72 L16,62 L8,54 L16,46 L6,36 L16,30 L14,18 L26,18 L28,6 L40,10 Z"
                      />
                      <circle cx="50" cy="50" r="14" fill="#38bdf8" opacity="0.9" />
                    </svg>
                  </div>
                </div>

                {/* 2. 3D Floating Profile Contact Badge (Top Left) */}
                <div className="absolute top-10 left-16 z-30 bg-white/95 backdrop-blur-md p-3 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.18)] border border-white/80 flex items-center space-x-3 animate-[bounce_4s_easeInOut_infinite] transform hover:scale-105 transition-transform">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <div className="h-2 w-14 bg-slate-300 rounded-full" />
                    <div className="h-1.5 w-9 bg-cyan-500 rounded-full mt-1.5" />
                  </div>
                </div>

                {/* 3. 3D SaaS Cloud Base (Center Bottom) */}
                <div className="absolute bottom-4 z-20 w-80 sm:w-96 flex flex-col items-center justify-center filter drop-shadow-[0_25px_40px_rgba(30,58,138,0.4)] animate-[pulse_6s_easeInOut_infinite]">
                  <div className="relative w-full h-32 bg-gradient-to-r from-sky-300 via-cyan-400 to-blue-500 rounded-[50px] flex items-center justify-center shadow-inner border border-white/50">
                    
                    {/* Volumetric Cloud Bubbles for 3D depth */}
                    <div className="absolute -top-12 left-8 w-24 h-24 bg-gradient-to-tr from-sky-200 to-cyan-300 rounded-full border-t-2 border-white/80" />
                    <div className="absolute -top-16 left-22 w-32 h-32 bg-gradient-to-tr from-cyan-300 to-blue-400 rounded-full border-t-2 border-white/80" />
                    <div className="absolute -top-10 right-10 w-28 h-28 bg-gradient-to-tr from-blue-300 to-indigo-500 rounded-full border-t-2 border-white/70" />
                    
                    {/* Extruded White "SaaS" 3D Text */}
                    <span className="relative z-10 text-5xl font-black text-white tracking-widest font-sans filter drop-shadow-[0_8px_16px_rgba(30,58,138,0.6)]">
                      SaaS
                    </span>
                  </div>
                </div>

                {/* 4. 3D Character Sitting on SaaS Cloud with Laptop */}
                <div className="absolute top-12 right-14 z-30 flex flex-col items-center select-none pointer-events-none transform group-hover:translate-y-[-4px] transition-transform duration-500">
                  <svg viewBox="0 0 200 220" className="w-48 h-52 filter drop-shadow-[0_20px_30px_rgba(0,0,0,0.3)]">
                    {/* Hair & Head */}
                    <path d="M100 30 C 85 30 80 50 85 65 C 90 75 110 75 115 65 C 120 50 115 30 100 30 Z" fill="#7c2d12" />
                    <circle cx="100" cy="50" r="16" fill="#fde047" opacity="0.95" />
                    <circle cx="100" cy="50" r="14" fill="#fed7aa" />
                    <path d="M92 40 C 95 32 105 32 108 40" fill="#7c2d12" />

                    {/* White Shirt Torso */}
                    <path d="M84 66 L116 66 L124 120 L76 120 Z" fill="#ffffff" />
                    {/* Black Tie */}
                    <polygon points="98,66 102,66 103,95 100,100 97,95" fill="#0f172a" />

                    {/* Dark Trousers / Legs in sitting posture */}
                    <path d="M76 120 L124 120 L135 155 L108 175 L98 140 L88 175 L65 155 Z" fill="#0f172a" />
                    {/* Shoes */}
                    <ellipse cx="60" cy="158" rx="8" ry="4" fill="#1e293b" />
                    <ellipse cx="140" cy="158" rx="8" ry="4" fill="#1e293b" />

                    {/* Laptop held on lap */}
                    <rect x="78" y="105" width="44" height="26" rx="4" fill="#1e293b" stroke="#0f172a" strokeWidth="2" />
                    <polygon points="72,131 128,131 122,137 78,137" fill="#475569" />
                    <text x="100" y="122" textAnchor="middle" fill="#38bdf8" fontSize="7" fontWeight="bold" fontFamily="sans-serif">CRM</text>

                    {/* Active Wi-Fi Signal Waves */}
                    <path d="M126 98 A 10 10 0 0 1 136 108" fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" className="animate-pulse" />
                    <path d="M129 93 A 15 15 0 0 1 143 108" fill="none" stroke="#38bdf8" strokeWidth="2.5" opacity="0.7" strokeLinecap="round" className="animate-pulse" />
                  </svg>
                </div>

              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Brand Social Trust Bar */}
      <section className="py-10 bg-white/10 backdrop-blur-md border-y border-white/20 select-none z-10">
        <div className="w-full max-w-6xl mx-auto px-6 md:px-12 text-center">
          <p className="text-xs font-bold text-white/80 uppercase tracking-wider mb-6">
            Trusted by fast-growing sales teams & enterprise organizations
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 opacity-90 transition-all duration-300">
            {['TechCorp', 'Sparta Creative', 'Empiric Logistics', 'Acme Systems', 'Initech Global'].map((company, idx) => (
              <span key={idx} className="font-black text-base text-white tracking-tight drop-shadow-sm hover:scale-105 transition-transform cursor-default">
                {company}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Metrics Statistics Band */}
      <section id="metrics" className="py-20 bg-transparent relative overflow-hidden select-none z-10">
        <div className="w-full max-w-6xl mx-auto px-6 md:px-12 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { label: 'Active Business Seats', val: '14,820+', desc: '+18.4% quarterly growth', color: 'text-indigo-600', icon: Users },
            { label: 'Deals Closed Natively', val: '432,050+', desc: '$124M total pipeline value', color: 'text-indigo-600', icon: Award },
            { label: 'AI Prediction Accuracy', val: '98.4%', desc: '1.2s avg response latency', color: 'text-indigo-600', icon: Sparkles },
            { label: 'Pipeline Velocity Boost', val: '3.4x', desc: 'Saves 8.2 hrs / rep / week', color: 'text-indigo-600', icon: Zap }
          ].map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div key={idx} className="p-6 bg-white/15 backdrop-blur-lg border border-white/30 rounded-2xl relative group overflow-hidden shadow-xl hover:bg-white/20 hover:border-white/50 hover:scale-[1.02] transition-all duration-300">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] text-white/80 font-bold uppercase tracking-wider">{stat.label}</span>
                  <div className="h-9 w-9 rounded-xl bg-pink-500/20 border border-pink-400/40 flex items-center justify-center text-pink-200">
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                </div>
                <span className="text-3xl sm:text-4xl font-black text-white block tracking-tight drop-shadow-sm">{stat.val}</span>
                <span className="text-xs text-white/80 font-medium block mt-1.5">{stat.desc}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. Interactive Product Suite Grid */}
      <section id="suite" className="py-24 bg-transparent border-t border-white/20 flex flex-col items-center justify-center px-6 md:px-12 z-10">
        <div className="w-full max-w-6xl space-y-12">
          
          {/* Header Title */}
          <div className="text-center space-y-3">
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight drop-shadow-sm font-sans">
              A complete platform to power your revenue engine
            </h2>
            <p className="text-base sm:text-lg text-white/85 font-medium max-w-xl mx-auto leading-relaxed">
              Consolidate your tools into one cohesive solution. Pulse connects every stage of your customer journey from lead intake to deal closing.
            </p>
          </div>

          {/* Interactive Tabs Navigation */}
          <div className="flex flex-wrap justify-center gap-2.5 p-2 bg-black/20 backdrop-blur-md border border-white/25 rounded-2xl max-w-2xl mx-auto select-none">
            {productSuites.map((suite, idx) => {
              const Icon = suite.icon;
              const isActive = activeTab === idx;
              return (
                <button
                  key={idx}
                  onClick={() => setActiveTab(idx)}
                  className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive 
                      ? 'bg-white text-indigo-900 shadow-lg scale-105' 
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-indigo-600' : 'text-white/70'}`} />
                  <span>{suite.title}</span>
                </button>
              );
            })}
          </div>

          {/* Active Tab Preview Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center pt-4">
            
            {/* Left Column: Selected Feature Copy */}
            <div className="lg:col-span-6 space-y-6 text-left animate-in fade-in slide-in-from-left-2 duration-300">
              <span className="inline-block px-3.5 py-1 rounded-full text-xs font-extrabold bg-pink-500/30 text-pink-200 border border-pink-400/50">
                {productSuites[activeTab].badge}
              </span>
              <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight drop-shadow-sm">
                {productSuites[activeTab].heading}
              </h3>
              <p className="text-base text-white/90 font-medium leading-relaxed">
                {productSuites[activeTab].desc}
              </p>
              
              {/* Feature Bullet List */}
              <ul className="space-y-3 pt-1 text-sm font-semibold text-white/95">
                {productSuites[activeTab].features.map((feature, i) => (
                  <li key={i} className="flex items-center space-x-3">
                    <CheckCircle2 className="h-5 w-5 text-cyan-300 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Activate Button */}
              <button
                onClick={() => setIsModalOpen(true)}
                className="mt-4 px-6 py-3 bg-pink-500 hover:bg-pink-600 text-white text-xs font-extrabold rounded-full flex items-center space-x-2 cursor-pointer shadow-lg shadow-pink-500/30 hover:scale-105 transition-all"
              >
                <span>Explore {productSuites[activeTab].title}</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Right Column: Selected Dynamic Preview Mockup */}
            <div className="lg:col-span-6 flex justify-center lg:justify-end animate-in fade-in slide-in-from-right-2 duration-300">
              <div className="w-full max-w-md h-72 relative flex items-center justify-center p-1.5 bg-white/15 backdrop-blur-xl border border-white/30 rounded-3xl shadow-2xl">
                {productSuites[activeTab].mockup}
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 5. Visual Features Showcase Grid (Bento Style) */}
      <section id="features" className="py-24 bg-transparent border-t border-white/20 flex flex-col items-center justify-center px-6 md:px-12 relative overflow-hidden z-10">
        
        <div className="w-full max-w-6xl space-y-12 relative z-10">
          <div className="text-center space-y-3">
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight drop-shadow-sm font-sans">
              Designed for modern sales execution
            </h2>
            <p className="text-base sm:text-lg text-white/85 font-medium max-w-xl mx-auto leading-relaxed">
              Every detail is crafted to increase rep efficiency, improve deal velocity, and provide clear management visibility.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: 'Visual Revenue Growth',
                desc: 'Live financial forecasting and deal pacing charts dynamically updated from touchpoints.',
                badge: 'Analytics',
                chart: (
                  <svg className="w-full h-24 mt-4 select-none" viewBox="0 0 120 40">
                    <defs>
                      <linearGradient id="barGradA" x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stopColor="#ec4899" /><stop offset="100%" stopColor="#f472b6" /></linearGradient>
                      <linearGradient id="barGradB" x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stopColor="#38bdf8" /><stop offset="100%" stopColor="#7dd3fc" /></linearGradient>
                      <linearGradient id="barGradC" x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stopColor="#34d399" /><stop offset="100%" stopColor="#6ee7b7" /></linearGradient>
                    </defs>
                    <rect x="15" y="20" width="10" height="20" rx="2" fill="url(#barGradA)" />
                    <rect x="35" y="12" width="10" height="28" rx="2" fill="url(#barGradB)" />
                    <rect x="55" y="6" width="10" height="34" rx="2" fill="url(#barGradC)" />
                    <rect x="75" y="16" width="10" height="24" rx="2" fill="url(#barGradA)" />
                    <rect x="95" y="2" width="10" height="38" rx="2" fill="url(#barGradC)" />
                  </svg>
                )
              },
              {
                title: 'Predictive Lead Scoring',
                desc: 'AI algorithms score leads and deals based on buyer engagement signals and velocity.',
                badge: 'AI Scoring',
                chart: (
                  <div className="flex items-center justify-center space-x-6 mt-4 h-24 select-none">
                    <div className="relative h-20 w-20 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 40 40">
                        <circle cx="20" cy="20" r="16" fill="transparent" stroke="rgba(255,255,255,0.2)" strokeWidth="3" />
                        <circle cx="20" cy="20" r="16" fill="transparent" stroke="#ec4899" strokeWidth="3" strokeDasharray="100.5" strokeDashoffset="14" strokeLinecap="round" />
                      </svg>
                      <span className="absolute text-xs font-black text-white">86%</span>
                    </div>
                    <div className="space-y-1.5 text-xs font-bold text-white/90 text-left">
                      <div className="flex items-center space-x-1.5">
                        <span className="h-2 w-2 rounded-full bg-pink-400 shrink-0"></span>
                        <span>Priority A: 86%</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <span className="h-2 w-2 rounded-full bg-cyan-300 shrink-0"></span>
                        <span>Priority B: 52%</span>
                      </div>
                    </div>
                  </div>
                )
              },
              {
                title: 'Leaderboards & Milestones',
                desc: 'Track sales rep milestones and activity logs in real time to drive sales productivity.',
                badge: 'Motivation',
                chart: (
                  <div className="space-y-2 mt-4 h-24 flex flex-col justify-center select-none text-xs font-bold text-white/90">
                    {[
                      { name: 'Alex R.', val: 'w-[90%]', rev: '$120K' },
                      { name: 'Helena T.', val: 'w-[75%]', rev: '$98K' },
                      { name: 'Marcus V.', val: 'w-[55%]', rev: '$75K' }
                    ].map((rep, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="w-16 truncate text-left">{rep.name}</span>
                        <div className="flex-1 mx-2.5 bg-white/20 h-2 rounded-full overflow-hidden">
                          <div className={`h-full ${rep.val} bg-pink-400 rounded-full`}></div>
                        </div>
                        <span className="w-10 text-right font-black text-white">{rep.rev}</span>
                      </div>
                    ))}
                  </div>
                )
              },
              {
                title: 'Role-Based Access Control',
                desc: 'Tailored permissions and custom workspace views for Reps, Managers, and System Admins.',
                badge: 'Security',
                chart: (
                  <div className="flex items-center justify-center space-x-2 mt-6 h-24 select-none">
                    <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white/20 text-white border border-white/30">System Admin</span>
                    <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-pink-500/30 text-pink-200 border border-pink-400/50">Sales Manager</span>
                  </div>
                )
              },
              {
                title: 'No-Code Automation Builder',
                desc: 'Construct automated lead routing, follow-up tasks, and webhook notifications visually.',
                badge: 'Automation',
                chart: (
                  <div className="flex items-center justify-center space-x-2 mt-6 h-24 select-none">
                    <div className="bg-white/20 border border-white/30 p-2.5 rounded-lg text-[9px] font-bold text-white shadow-2xs flex items-center space-x-1.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-400"/>
                      <span>Lead Form Event</span>
                    </div>
                    <div className="h-0.5 w-6 bg-white/40 relative">
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 border-y-3 border-l-3 border-y-transparent border-l-white/70"/>
                    </div>
                    <div className="bg-white/20 border border-white/30 p-2.5 rounded-lg text-[9px] font-bold text-white shadow-2xs flex items-center space-x-1.5">
                      <span className="h-2 w-2 rounded-full bg-pink-400"/>
                      <span>Assign Sales Rep</span>
                    </div>
                  </div>
                )
              },
              {
                title: 'Engagement Telemetry',
                desc: 'Analyze reply velocities, touchpoint recency, and customer engagement metrics dynamically.',
                badge: 'Insights',
                chart: (
                  <div className="space-y-2 mt-4 h-24 flex flex-col justify-center select-none text-xs font-semibold text-white/90 px-1">
                    <div className="flex justify-between border-b border-white/15 pb-1"><span>Buyer Engagement</span><span className="text-emerald-300 font-extrabold">High (85/100)</span></div>
                    <div className="flex justify-between border-b border-white/15 pb-1"><span>Reply Velocity</span><span className="text-cyan-300 font-extrabold">12 mins avg</span></div>
                    <div className="flex justify-between border-b border-white/15 pb-1"><span>Touchpoint Recency</span><span className="text-white font-extrabold">Today</span></div>
                  </div>
                )
              }
            ].map((feature, idx) => (
              <div key={idx} className="bg-white/15 backdrop-blur-lg border border-white/30 rounded-3xl p-6 shadow-xl hover:bg-white/25 hover:border-white/50 hover:scale-[1.02] transition-all duration-300 flex flex-col justify-between h-[300px]">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-pink-200 px-3 py-1 rounded-full bg-pink-500/30 border border-pink-400/50 inline-block mb-3">
                    {feature.badge}
                  </span>
                  <h3 className="text-lg font-bold text-white text-left">{feature.title}</h3>
                  <p className="text-xs text-white/85 font-medium leading-relaxed mt-1.5 text-left">{feature.desc}</p>
                </div>
                <div className="w-full shrink-0">
                  {feature.chart}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer with Pulse Logo & Details */}
      <footer className="bg-slate-950/80 backdrop-blur-xl text-white/80 py-12 px-6 md:px-12 select-none border-t border-white/20 z-10">
        <div className="w-full max-w-6xl mx-auto space-y-8">
          
          {/* Top Footer Row: Logo, Title & Brand Details */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-white/10">
            <div className="flex items-center space-x-3">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-pink-500 to-indigo-600 p-0.5 shadow-md flex items-center justify-center">
                <div className="h-full w-full bg-slate-950/80 rounded-[10px] flex items-center justify-center">
                  <Activity className="h-4 w-4 text-pink-400" strokeWidth={2.5} />
                </div>
              </div>
              <div>
                <div className="flex items-center space-x-1">
                  <span className="text-lg font-black text-white tracking-tight font-sans">Pulse</span>
                  <span className="text-lg font-black text-pink-300 font-sans">CRM</span>
                </div>
                <p className="text-[11px] text-white/70 font-medium">
                  Next-Generation AI Revenue Copilot &amp; Enterprise Deal Telemetry.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-6 text-xs font-semibold text-white/80">
              <a href="#" className="hover:text-pink-300 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-pink-300 transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-pink-300 transition-colors">Security Standards</a>
            </div>
          </div>

          {/* Bottom Copyright Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-white/60">
            <span>&copy; {new Date().getFullYear()} Pulse CRM Inc. All rights reserved.</span>
            <span>Powered by <span className="text-white font-extrabold">Kalnet</span></span>
          </div>

        </div>
      </footer>

      {/* 8. Light-Mode Auth Login Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop blur overlay */}
          <div 
            onClick={() => setIsModalOpen(false)}
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs cursor-pointer"
          />
          
          {/* Modal Container Card */}
          <div className="w-full max-w-md bg-white border border-slate-200/90 rounded-2xl p-8 shadow-2xl flex flex-col justify-between text-slate-900 relative z-10 animate-in zoom-in-95 duration-150">
            {/* Close trigger */}
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer border-0 bg-transparent"
              aria-label="Close modal"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Header titles */}
            <div className="text-left mb-6">
              <h2 className="font-sans text-2xl font-extrabold text-slate-900 tracking-tight">Welcome back</h2>
              <p className="text-xs text-slate-500 mt-1 font-medium">Log in to access your Pulse workspace</p>
            </div>

            {/* Email form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Email address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="h-4 w-4" strokeWidth={2} />
                  </div>
                  <input
                    type="email"
                    required
                    disabled={isLoading}
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-xs text-slate-900 bg-slate-50/50 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white transition-colors shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Workspace Access Role
                </label>
                <select
                  disabled={isLoading}
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs text-slate-900 bg-slate-50/50 focus:outline-none focus:border-indigo-600 focus:bg-white transition-colors shadow-2xs font-semibold cursor-pointer"
                >
                  <option value="representative">Sales Representative</option>
                  <option value="manager">Sales Manager</option>
                  <option value="admin">System Administrator</option>
                </select>
              </div>

              {/* Login Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !email.trim()}
                className="w-full flex items-center justify-center space-x-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Continue to Workspace</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            {/* Divider line */}
            <div className="relative flex items-center my-5">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink mx-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">or</span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            {/* Continue with Google */}
            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full flex items-center justify-center space-x-2.5 py-2.5 border border-slate-200/90 hover:border-slate-300 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 transition-all cursor-pointer shadow-2xs bg-white"
            >
              {/* Google SVG Logo */}
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* Security shield badge */}
            <div className="flex items-center justify-center space-x-1.5 mt-5 text-xs font-medium text-slate-500">
              <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>SOC2 compliant & 256-bit encrypted</span>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
