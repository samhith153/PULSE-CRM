'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { PageContainer } from '@/components/shared/PageTemplates';
import { BookOpen, Calendar, Clock, TrendingUp, User, ArrowRight } from 'lucide-react';

const FEATURED_POST = {
  title: 'The Future of Sales: AI-Powered CRM Revolution',
  excerpt: 'Discover how artificial intelligence is transforming the way sales teams work, from predictive analytics to intelligent automation.',
  author: 'Sarah Johnson',
  date: 'Jan 15, 2026',
  readTime: '8 min read',
  category: 'Product',
  image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop',
};

const RECENT_POSTS = [
  {
    title: '10 Ways to Improve Your Sales Pipeline',
    excerpt: 'Learn proven strategies to optimize your sales funnel and close more deals faster.',
    author: 'Michael Chen',
    date: 'Jan 12, 2026',
    readTime: '5 min read',
    category: 'Tips',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop',
  },
  {
    title: 'Customer Success Stories: Enterprise Edition',
    excerpt: 'How leading companies transformed their sales operations with Pulse CRM.',
    author: 'Emily Parker',
    date: 'Jan 10, 2026',
    readTime: '6 min read',
    category: 'Case Study',
    image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=300&fit=crop',
  },
  {
    title: 'Email Intelligence: Best Practices Guide',
    excerpt: 'Master email automation and personalization to engage prospects effectively.',
    author: 'David Lee',
    date: 'Jan 8, 2026',
    readTime: '7 min read',
    category: 'Guide',
    image: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400&h=300&fit=crop',
  },
  {
    title: 'Revenue Analytics Metrics That Matter',
    excerpt: 'Track the KPIs that actually drive growth and revenue in your organization.',
    author: 'Jessica Taylor',
    date: 'Jan 5, 2026',
    readTime: '6 min read',
    category: 'Analytics',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop',
  },
  {
    title: 'Security Best Practices for Sales Teams',
    excerpt: 'Protect your customer data and maintain compliance with enterprise-grade security.',
    author: 'Robert Martinez',
    date: 'Jan 3, 2026',
    readTime: '5 min read',
    category: 'Security',
    image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=400&h=300&fit=crop',
  },
  {
    title: 'Automation Workflows for Modern Sales',
    excerpt: 'Save time and boost productivity with intelligent workflow automation.',
    author: 'Amanda White',
    date: 'Jan 1, 2026',
    readTime: '8 min read',
    category: 'Automation',
    image: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400&h=300&fit=crop',
  },
];

const CATEGORIES = ['All Posts', 'Product', 'Tips', 'Case Study', 'Guide', 'Analytics', 'Security', 'Automation'];

export default function BlogPage() {
  return (
    <PageContainer>
      {/* Hero Section */}
      <section style={{ marginTop: 64, padding: '80px 48px', background: 'linear-gradient(180deg, #f5f3ff 0%, #fff 100%)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', textAlign: 'center' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', background: '#f5f3ff', border: '1px solid #ede9fe', borderRadius: 100, marginBottom: 20 }}>
            <BookOpen size={13} color="#7c3aed" />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Blog</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{ fontSize: 'clamp(36px,5vw,56px)', fontWeight: 900, color: '#0f172a', lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: 16 }}>
            Insights & Updates
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{ fontSize: 18, color: '#475569', lineHeight: 1.7, maxWidth: 640, margin: '0 auto 40px' }}>
            The latest news, insights, and best practices from the Pulse CRM team.
          </motion.p>
          
          {/* Category Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
            {CATEGORIES.map((cat, i) => (
              <button
                key={cat}
                style={{
                  padding: '8px 18px',
                  background: i === 0 ? '#7c3aed' : '#fff',
                  color: i === 0 ? '#fff' : '#64748b',
                  border: `1.5px solid ${i === 0 ? '#7c3aed' : '#e2e8f0'}`,
                  borderRadius: 100,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  transition: 'all 0.2s',
                }}>
                {cat}
              </button>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Featured Post */}
      <section style={{ padding: '60px 48px', background: '#fff' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ y: -8 }}
            style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 40, background: 'linear-gradient(135deg, #f5f3ff 0%, #fff 100%)', borderRadius: 24, overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 8px 24px rgba(124,58,237,0.12)', cursor: 'pointer' }}>
            <div style={{ padding: 48 }}>
              <span style={{ display: 'inline-block', padding: '6px 14px', background: '#7c3aed', color: '#fff', fontSize: 11, fontWeight: 700, borderRadius: 6, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 20 }}>
                Featured
              </span>
              <h2 style={{ fontSize: 32, fontWeight: 900, color: '#0f172a', lineHeight: 1.2, letterSpacing: '-0.02em', marginBottom: 16 }}>
                {FEATURED_POST.title}
              </h2>
              <p style={{ fontSize: 16, color: '#475569', lineHeight: 1.7, marginBottom: 24 }}>
                {FEATURED_POST.excerpt}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <User size={14} color="#64748b" />
                  <span style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>{FEATURED_POST.author}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Calendar size={14} color="#64748b" />
                  <span style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>{FEATURED_POST.date}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Clock size={14} color="#64748b" />
                  <span style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>{FEATURED_POST.readTime}</span>
                </div>
              </div>
              <button style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', background: '#7c3aed', color: '#fff', fontSize: 14, fontWeight: 700, borderRadius: 100, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                Read Article <ArrowRight size={16} />
              </button>
            </div>
            <div style={{ position: 'relative', minHeight: 400, background: `url(${FEATURED_POST.image}) center/cover` }} />
          </motion.div>
        </div>
      </section>

      {/* Recent Posts Grid */}
      <section style={{ padding: '60px 48px 100px', background: '#f8fafc' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <h2 style={{ fontSize: 28, fontWeight: 900, color: '#0f172a', marginBottom: 32, letterSpacing: '-0.02em' }}>Recent Posts</h2>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.1 } }
            }}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
            {RECENT_POSTS.map((post, i) => (
              <motion.div
                key={i}
                variants={{
                  hidden: { opacity: 0, y: 30 },
                  visible: { opacity: 1, y: 0 }
                }}
                whileHover={{ y: -8, boxShadow: '0 12px 32px rgba(0,0,0,0.12)' }}
                style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', border: '1px solid #e2e8f0', cursor: 'pointer', transition: 'box-shadow 0.3s' }}>
                <div style={{ height: 200, background: `url(${post.image}) center/cover` }} />
                <div style={{ padding: 24 }}>
                  <span style={{ display: 'inline-block', padding: '4px 12px', background: '#f5f3ff', color: '#7c3aed', fontSize: 11, fontWeight: 700, borderRadius: 6, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
                    {post.category}
                  </span>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', lineHeight: 1.3, marginBottom: 10 }}>
                    {post.title}
                  </h3>
                  <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6, marginBottom: 16 }}>
                    {post.excerpt}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 12, borderTop: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <User size={12} color="#94a3b8" />
                      <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>{post.author}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Clock size={12} color="#94a3b8" />
                      <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>{post.readTime}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </PageContainer>
  );
}
