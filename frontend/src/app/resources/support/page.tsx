'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { PageContainer } from '@/components/shared/PageTemplates';
import { Headphones, MessageCircle, Mail, Phone, Clock, CheckCircle, Zap, ArrowRight } from 'lucide-react';

const SUPPORT_OPTIONS = [
  {
    icon: MessageCircle,
    title: 'Live Chat',
    description: 'Get instant help from our support team in real-time.',
    availability: '24/7 Available',
    responseTime: 'Average: 2 mins',
    color: '#7c3aed',
    cta: 'Start Chat',
  },
  {
    icon: Mail,
    title: 'Email Support',
    description: 'Send us detailed questions and get comprehensive answers.',
    availability: 'Mon-Fri 9AM-6PM',
    responseTime: 'Average: 4 hours',
    color: '#2563eb',
    cta: 'Send Email',
  },
  {
    icon: Phone,
    title: 'Phone Support',
    description: 'Speak directly with our technical experts for urgent issues.',
    availability: 'Enterprise Only',
    responseTime: 'Immediate',
    color: '#059669',
    cta: 'Call Now',
  },
];

const SUPPORT_RESOURCES = [
  {
    icon: Headphones,
    title: 'Documentation',
    description: 'Comprehensive guides and tutorials',
    link: '/resources/documentation',
  },
  {
    icon: MessageCircle,
    title: 'Community Forums',
    description: 'Connect with other users',
    link: '/resources/community',
  },
  {
    icon: Zap,
    title: 'Status Page',
    description: 'Check system performance',
    link: '#',
  },
];

const SUPPORT_FEATURES = [
  'Priority ticket routing',
  'Dedicated account manager',
  'Custom SLA agreements',
  'Onboarding & training',
  'API integration support',
  'Regular health checks',
];

export default function SupportPage() {
  return (
    <PageContainer>
      {/* Hero Section */}
      <section style={{ marginTop: 64, padding: '80px 48px', background: 'linear-gradient(180deg, #f5f3ff 0%, #fff 100%)', position: 'relative', overflow: 'hidden' }}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.1 }}
          transition={{ duration: 1 }}
          style={{ position: 'absolute', top: -100, left: -100, width: 600, height: 600, background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 1280, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', background: '#f5f3ff', border: '1px solid #ede9fe', borderRadius: 100, marginBottom: 20 }}>
            <Headphones size={13} color="#7c3aed" />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Support</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{ fontSize: 'clamp(36px,5vw,56px)', fontWeight: 900, color: '#0f172a', lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: 16 }}>
            We're Here to Help
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{ fontSize: 18, color: '#475569', lineHeight: 1.7, maxWidth: 640, margin: '0 auto 40px' }}>
            Get the support you need, when you need it. Our expert team is ready to assist you 24/7.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            {['99.9% Uptime SLA', '24/7 Monitoring', 'Enterprise Support'].map((feature, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 100 }}>
                <CheckCircle size={14} color="#059669" />
                <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{feature}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Support Options */}
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
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
            {SUPPORT_OPTIONS.map((option, i) => {
              const Icon = option.icon;
              return (
                <motion.div
                  key={i}
                  variants={{
                    hidden: { opacity: 0, y: 30 },
                    visible: { opacity: 1, y: 0 }
                  }}
                  whileHover={{ y: -8, boxShadow: `0 16px 40px ${option.color}20` }}
                  style={{ padding: 36, background: `linear-gradient(135deg, ${option.color}08 0%, #fff 100%)`, borderRadius: 20, border: `1.5px solid ${option.color}20`, cursor: 'pointer', transition: 'box-shadow 0.3s', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, background: `${option.color}08`, borderRadius: '50%', filter: 'blur(40px)' }} />
                  <div style={{ height: 64, width: 64, borderRadius: 16, background: option.color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, boxShadow: `0 8px 24px ${option.color}40`, position: 'relative' }}>
                    <Icon size={30} color="#fff" strokeWidth={2} />
                  </div>
                  <h3 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 10 }}>{option.title}</h3>
                  <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6, marginBottom: 20 }}>{option.description}</p>
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <Clock size={14} color={option.color} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{option.availability}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Zap size={14} color={option.color} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#64748b' }}>{option.responseTime}</span>
                    </div>
                  </div>
                  <button style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px', background: option.color, color: '#fff', fontSize: 14, fontWeight: 700, borderRadius: 100, border: 'none', cursor: 'pointer', fontFamily: 'inherit', width: '100%', justifyContent: 'center' }}>
                    {option.cta} <ArrowRight size={16} />
                  </button>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Enterprise Support Features */}
      <section style={{ padding: '80px 48px', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}>
            <h2 style={{ fontSize: 40, fontWeight: 900, color: '#fff', lineHeight: 1.2, letterSpacing: '-0.03em', marginBottom: 16 }}>
              Enterprise Support
            </h2>
            <p style={{ fontSize: 16, color: '#94a3b8', lineHeight: 1.7, marginBottom: 32 }}>
              Get dedicated support tailored to your organization's needs with premium SLAs and personalized assistance.
            </p>
            <button style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 28px', background: '#7c3aed', color: '#fff', fontSize: 15, fontWeight: 700, borderRadius: 100, border: 'none', cursor: 'pointer', boxShadow: '0 8px 24px rgba(124,58,237,0.5)', fontFamily: 'inherit' }}>
              Contact Sales <ArrowRight size={16} />
            </button>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {SUPPORT_FEATURES.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 20px', background: 'rgba(255,255,255,0.05)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)' }}>
                <CheckCircle size={18} color="#7c3aed" strokeWidth={2.5} />
                <span style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>{feature}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Additional Resources */}
      <section style={{ padding: '60px 48px 100px', background: '#f8fafc' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 32, fontWeight: 900, color: '#0f172a', marginBottom: 12, letterSpacing: '-0.02em' }}>More Resources</h2>
          <p style={{ fontSize: 16, color: '#64748b', marginBottom: 40 }}>Explore additional ways to get help and stay informed.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
            {SUPPORT_RESOURCES.map((resource, i) => {
              const Icon = resource.icon;
              return (
                <motion.a
                  key={i}
                  href={resource.link}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ y: -4 }}
                  style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 24, background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', textDecoration: 'none', cursor: 'pointer' }}>
                  <div style={{ height: 48, width: 48, borderRadius: 12, background: '#f5f3ff', border: '1px solid #ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={22} color="#7c3aed" />
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <h4 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>{resource.title}</h4>
                    <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>{resource.description}</p>
                  </div>
                </motion.a>
              );
            })}
          </div>
        </div>
      </section>
    </PageContainer>
  );
}
