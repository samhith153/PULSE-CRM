'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { PageContainer } from '@/components/shared/PageTemplates';
import { Users, MessageCircle, BookOpen, Award, TrendingUp, Sparkles, Calendar, ArrowRight } from 'lucide-react';

const COMMUNITY_STATS = [
  { value: '15K+', label: 'Active Members', description: 'Growing community' },
  { value: '50K+', label: 'Conversations', description: 'Helpful discussions' },
  { value: '200+', label: 'Events', description: 'Webinars & meetups' },
];

const COMMUNITY_CHANNELS = [
  {
    icon: MessageCircle,
    title: 'Discussion Forums',
    description: 'Connect with peers, ask questions, and share best practices with the community.',
    members: '12K+ members',
    color: '#7c3aed',
  },
  {
    icon: BookOpen,
    title: 'Knowledge Base',
    description: 'Access guides, tutorials, and resources created by the community.',
    members: '5K+ articles',
    color: '#2563eb',
  },
  {
    icon: Calendar,
    title: 'Events & Webinars',
    description: 'Join live sessions, workshops, and networking events with industry experts.',
    members: '200+ events',
    color: '#059669',
  },
  {
    icon: Award,
    title: 'Champions Program',
    description: 'Become a certified Pulse CRM expert and help others succeed.',
    members: '500+ champions',
    color: '#d97706',
  },
  {
    icon: TrendingUp,
    title: 'Success Stories',
    description: 'Get inspired by real customer stories and case studies.',
    members: '100+ stories',
    color: '#dc2626',
  },
  {
    icon: Sparkles,
    title: 'Beta Program',
    description: 'Be the first to try new features and shape the product roadmap.',
    members: '1K+ testers',
    color: '#9333ea',
  },
];

export default function CommunityPage() {
  return (
    <PageContainer>
      {/* Hero Section */}
      <section style={{ marginTop: 64, padding: '80px 48px', background: 'linear-gradient(180deg, #f5f3ff 0%, #fff 100%)', position: 'relative', overflow: 'hidden' }}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.1 }}
          transition={{ duration: 1 }}
          style={{ position: 'absolute', top: -100, right: -100, width: 600, height: 600, background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 1280, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', background: '#f5f3ff', border: '1px solid #ede9fe', borderRadius: 100, marginBottom: 20 }}>
            <Users size={13} color="#7c3aed" />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Community</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{ fontSize: 'clamp(36px,5vw,56px)', fontWeight: 900, color: '#0f172a', lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: 16 }}>
            Join the Pulse CRM Community
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{ fontSize: 18, color: '#475569', lineHeight: 1.7, maxWidth: 640, margin: '0 auto 40px' }}>
            Connect with thousands of sales professionals, share insights, and grow together.
          </motion.p>
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.98 }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 28px', background: '#7c3aed', color: '#fff', fontSize: 15, fontWeight: 700, borderRadius: 100, border: 'none', cursor: 'pointer', boxShadow: '0 8px 24px rgba(124,58,237,0.4)', fontFamily: 'inherit' }}>
            Join Community <ArrowRight size={16} />
          </motion.button>
        </div>
      </section>

      {/* Stats Section */}
      <section style={{ padding: '60px 48px', background: '#fff' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.15 } }
            }}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24 }}>
            {COMMUNITY_STATS.map((stat, i) => (
              <motion.div
                key={i}
                variants={{
                  hidden: { opacity: 0, scale: 0.8 },
                  visible: { opacity: 1, scale: 1 }
                }}
                whileHover={{ y: -8 }}
                style={{ padding: 40, background: 'linear-gradient(135deg, #f5f3ff 0%, #fff 100%)', borderRadius: 20, border: '1px solid #ede9fe', textAlign: 'center', boxShadow: '0 4px 16px rgba(124,58,237,0.08)' }}>
                <div style={{ fontSize: 48, fontWeight: 900, color: '#0f172a', marginBottom: 12, letterSpacing: '-0.03em' }}>{stat.value}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>{stat.label}</div>
                <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>{stat.description}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Community Channels */}
      <section style={{ padding: '60px 48px 100px', background: '#f8fafc' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ fontSize: 36, fontWeight: 900, color: '#0f172a', marginBottom: 12, textAlign: 'center', letterSpacing: '-0.02em' }}>
            Explore Community Channels
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            style={{ fontSize: 16, color: '#64748b', textAlign: 'center', maxWidth: 600, margin: '0 auto 48px' }}>
            Find the perfect space to connect, learn, and contribute.
          </motion.p>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.1 } }
            }}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
            {COMMUNITY_CHANNELS.map((channel, i) => {
              const Icon = channel.icon;
              return (
                <motion.div
                  key={i}
                  variants={{
                    hidden: { opacity: 0, y: 30 },
                    visible: { opacity: 1, y: 0 }
                  }}
                  whileHover={{ y: -8, boxShadow: `0 12px 32px ${channel.color}25` }}
                  style={{ padding: 32, background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', cursor: 'pointer', transition: 'box-shadow 0.3s' }}>
                  <div style={{ height: 56, width: 56, borderRadius: 14, background: `${channel.color}14`, border: `1px solid ${channel.color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                    <Icon size={26} color={channel.color} />
                  </div>
                  <h3 style={{ fontSize: 19, fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>{channel.title}</h3>
                  <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6, marginBottom: 16 }}>{channel.description}</p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: channel.color }}>{channel.members}</span>
                    <ArrowRight size={16} color={channel.color} />
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
