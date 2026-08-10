'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { PageContainer } from '@/components/shared/PageTemplates';
import { BookOpen, Calendar, Clock, ArrowRight, Sparkles, Shield, Mail, BarChart2, Code, Zap } from 'lucide-react';

const FEATURED_POST = {
  title: 'How Pulse CRM scores leads without a black box',
  excerpt: 'A deep-dive into the rule-based scoring engine: how Fit (60%) + Engagement (40%) produces a transparent 0–100 score with human-readable reasons — and why we chose math over ML for v1.',
  author: 'Kiran D.',
  date: 'Jul 20, 2026',
  readTime: '7 min read',
  category: 'Engineering',
  icon: Sparkles,
  color: '#2563EB',
};

const RECENT_POSTS = [
  {
    title: 'Building a FSM pipeline with FastAPI and SQLAlchemy 2.0',
    excerpt: 'How we implemented strict finite-state machine deal stage transitions at the service layer, with validation that rejects invalid jumps before they reach the database.',
    author: 'Kiran D.',
    date: 'Jul 15, 2026',
    readTime: '6 min read',
    category: 'Engineering',
    icon: Code,
    color: '#2563eb',
  },
  {
    title: 'Gmail OAuth2 + Groq/Llama for email intelligence',
    excerpt: 'Why we chose Groq with Llama 3.3-70B for thread summarisation, how the OAuth2 sync works under the hood, and how intent tags feed directly into lead scoring.',
    author: 'Kiran D.',
    date: 'Jul 10, 2026',
    readTime: '8 min read',
    category: 'AI',
    icon: Mail,
    color: '#059669',
  },
  {
    title: 'Designing 33 RBAC permissions with FastAPI Depends()',
    excerpt: 'A walkthrough of how Pulse implements resource:action permission strings, how require_permission() is injected at the route level, and why that keeps business logic clean.',
    author: 'Kiran D.',
    date: 'Jul 6, 2026',
    readTime: '5 min read',
    category: 'Security',
    icon: Shield,
    color: '#dc2626',
  },
  {
    title: 'Live dashboard KPIs with async SQLAlchemy aggregates',
    excerpt: 'How the /api/v1/dashboard endpoint computes leads-by-status, pipeline value, win rate, and activity feed in a single async query pass without N+1 problems.',
    author: 'Kiran D.',
    date: 'Jul 2, 2026',
    readTime: '5 min read',
    category: 'Backend',
    icon: BarChart2,
    color: '#d97706',
  },
  {
    title: 'Multi-tenant CRM with organization_id scoping',
    excerpt: 'Every table in the Pulse schema has an organization_id column. Here is how we enforce it in repositories and why it makes cross-tenant data leaks structurally impossible.',
    author: 'Kiran D.',
    date: 'Jun 28, 2026',
    readTime: '4 min read',
    category: 'Architecture',
    icon: Zap,
    color: '#9333ea',
  },
  {
    title: 'Next-best-action: recommendations without ML',
    excerpt: 'How the Pulse recommendation engine uses a weighted formula (score + urgency + reply factor) to rank candidate actions and surface the one most likely to move the deal forward.',
    author: 'Kiran D.',
    date: 'Jun 24, 2026',
    readTime: '6 min read',
    category: 'AI',
    icon: Sparkles,
    color: '#2563EB',
  },
];

const CATEGORIES = ['All Posts', 'Engineering', 'AI', 'Security', 'Backend', 'Architecture'];

export default function BlogPage() {
  return (
    <PageContainer>
      <section style={{ marginTop: 64, padding: '80px 48px', background: 'linear-gradient(180deg, #EFF6FF 0%, #fff 100%)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', textAlign: 'center' }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', background: '#EFF6FF', border: '1px solid #DBEAFE', borderRadius: 100, marginBottom: 20 }}>
            <BookOpen size={13} color="#2563EB" />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#2563EB', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Blog</span>
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            style={{ fontSize: 'clamp(36px,5vw,56px)', fontWeight: 900, color: '#0f172a', lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: 16 }}>
            Engineering & AI Insights
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            style={{ fontSize: 18, color: '#475569', lineHeight: 1.7, maxWidth: 580, margin: '0 auto 40px' }}>
            Technical deep-dives on building Pulse CRM — scoring engines, FSM pipelines, RBAC, Gmail sync, and more.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
            {CATEGORIES.map((cat, i) => (
              <button key={cat} style={{ padding: '8px 18px', background: i === 0 ? '#2563EB' : '#fff', color: i === 0 ? '#fff' : '#64748b', border: `1.5px solid ${i === 0 ? '#2563EB' : '#e2e8f0'}`, borderRadius: 100, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                {cat}
              </button>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Featured Post */}
      <section style={{ padding: '60px 48px', background: '#fff' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            whileHover={{ y: -4 }}
            style={{ display: 'grid', gridTemplateColumns: '1.5fr 0.5fr', gap: 40, background: 'linear-gradient(135deg, #EFF6FF 0%, #fff 100%)', borderRadius: 24, overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 8px 24px rgba(124,58,237,0.10)', cursor: 'pointer' }}>
            <div style={{ padding: 48 }}>
              <span style={{ display: 'inline-block', padding: '6px 14px', background: '#2563EB', color: '#fff', fontSize: 11, fontWeight: 700, borderRadius: 6, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 20 }}>Featured</span>
              <h2 style={{ fontSize: 32, fontWeight: 900, color: '#0f172a', lineHeight: 1.2, letterSpacing: '-0.02em', marginBottom: 16 }}>{FEATURED_POST.title}</h2>
              <p style={{ fontSize: 16, color: '#475569', lineHeight: 1.7, marginBottom: 24 }}>{FEATURED_POST.excerpt}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Calendar size={13} color="#64748b" />
                  <span style={{ fontSize: 13, color: '#64748b' }}>{FEATURED_POST.date}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Clock size={13} color="#64748b" />
                  <span style={{ fontSize: 13, color: '#64748b' }}>{FEATURED_POST.readTime}</span>
                </div>
              </div>
              <button style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', background: '#2563EB', color: '#fff', fontSize: 14, fontWeight: 700, borderRadius: 100, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                Read Article <ArrowRight size={16} />
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#EFF6FF', padding: 40 }}>
              <div style={{ height: 80, width: 80, borderRadius: '50%', background: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={40} color="#fff" />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Recent Posts */}
      <section style={{ padding: '40px 48px 100px', background: '#f8fafc' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <h2 style={{ fontSize: 28, fontWeight: 900, color: '#0f172a', marginBottom: 32, letterSpacing: '-0.02em' }}>Recent Posts</h2>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
            {RECENT_POSTS.map((post, i) => {
              const Icon = post.icon;
              return (
                <motion.div key={i}
                  variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } }}
                  whileHover={{ y: -6, boxShadow: '0 12px 32px rgba(0,0,0,0.10)' }}
                  style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', border: '1px solid #e2e8f0', cursor: 'pointer', transition: 'box-shadow 0.3s' }}>
                  <div style={{ height: 100, background: `${post.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid #e2e8f0' }}>
                    <div style={{ height: 56, width: 56, borderRadius: '50%', background: post.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={28} color="#fff" />
                    </div>
                  </div>
                  <div style={{ padding: 24 }}>
                    <span style={{ display: 'inline-block', padding: '4px 12px', background: '#EFF6FF', color: '#2563EB', fontSize: 11, fontWeight: 700, borderRadius: 6, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>{post.category}</span>
                    <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', lineHeight: 1.35, marginBottom: 10 }}>{post.title}</h3>
                    <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6, marginBottom: 16 }}>{post.excerpt}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 12, borderTop: '1px solid #f1f5f9' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Calendar size={11} color="#94a3b8" />
                        <span style={{ fontSize: 11, color: '#64748b' }}>{post.date}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Clock size={11} color="#94a3b8" />
                        <span style={{ fontSize: 11, color: '#64748b' }}>{post.readTime}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>
    </PageContainer>
  );
}
