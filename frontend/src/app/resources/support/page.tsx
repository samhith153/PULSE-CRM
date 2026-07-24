'use client';
import React, { useState } from 'react';
import Navbar from '@/components/navigation/Navbar';
import PageModal from '@/components/shared/PageModal';
import { HelpCircle, Mail, MessageCircle, BookOpen, Search, Clock, CheckCircle, ArrowRight } from 'lucide-react';

const SUPPORT_CHANNELS = [
  {
    icon: Mail,
    title: 'Email Support',
    desc: 'Get help via email from our support team',
    response: '24-hour response time',
    action: 'support@pulsecrm.io',
    color: '#7c3aed',
  },
  {
    icon: MessageCircle,
    title: 'Live Chat',
    desc: 'Chat with our support team in real-time',
    response: 'Available 9am-6pm EST',
    action: 'Start Chat',
    color: '#059669',
  },
  {
    icon: BookOpen,
    title: 'Documentation',
    desc: 'Browse guides, tutorials, and best practices',
    response: 'Instant answers',
    action: 'View Docs',
    color: '#2563eb',
  },
];

const COMMON_ISSUES = [
  {
    category: 'Authentication & Access',
    issues: [
      { q: 'I forgot my password', a: 'Click "Forgot Password" on the login page. You\'ll receive a reset link via email within 5 minutes.' },
      { q: 'Cannot access certain features', a: 'Check your role permissions in Settings > Roles. Contact your organization admin to request additional permissions.' },
      { q: 'Session keeps expiring', a: 'JWT tokens expire after 24 hours for security. Enable "Remember Me" or ask your admin to adjust session timeout settings.' },
    ],
  },
  {
    category: 'Data Management',
    issues: [
      { q: 'How do I import contacts from CSV?', a: 'Go to Contacts > Import. Download our CSV template, populate your data, and upload. We support up to 10,000 contacts per import.' },
      { q: 'Deals not showing in pipeline', a: 'Check pipeline filters and stage visibility. Ensure deals have assigned owners and valid stage values.' },
      { q: 'Deleted items by mistake', a: 'Items are soft-deleted. Admins can restore from Settings > Data Management > Deleted Items within 30 days.' },
    ],
  },
  {
    category: 'Email Integration',
    issues: [
      { q: 'Emails not syncing', a: 'Re-authorize your email connection in Settings > Integrations. Check that IMAP/SMTP settings are correct and 2FA is configured properly.' },
      { q: 'Thread linking not working', a: 'Ensure email subjects contain deal/contact references. Check Settings > Email > Thread Linking Rules for configuration.' },
      { q: 'Cannot send emails from CRM', a: 'Verify SMTP credentials and check that your email provider allows third-party apps. Gmail users need to enable "Less secure app access".' },
    ],
  },
  {
    category: 'Performance & Technical',
    issues: [
      { q: 'Dashboard loading slowly', a: 'Clear browser cache and reload. For persistent issues, check browser console for errors and contact support with error messages.' },
      { q: 'API rate limit errors', a: 'Default rate limit is 100 requests/minute. Implement exponential backoff and caching. Enterprise plans offer higher limits.' },
      { q: 'Mobile app not syncing', a: 'Ensure you have an active internet connection. Force close and reopen the app. Check Settings > Mobile > Sync Settings.' },
    ],
  },
];

const FAQS = [
  {
    q: 'What are your support hours?',
    a: 'Email support is available 24/7 with responses within 24 hours. Live chat is available Monday-Friday, 9am-6pm EST. Enterprise customers get priority support with 4-hour SLA.',
  },
  {
    q: 'Do you offer phone support?',
    a: 'Phone support is available for Enterprise plan customers. Schedule a call through your dedicated account manager or contact support@pulsecrm.io.',
  },
  {
    q: 'How do I report a bug?',
    a: 'Email support@pulsecrm.io with a detailed description, steps to reproduce, screenshots, and browser/device information. We prioritize bugs based on severity.',
  },
  {
    q: 'Can you help with custom implementation?',
    a: 'Yes. Enterprise plans include implementation support. For custom development, integrations, or consulting, contact our professional services team.',
  },
  {
    q: 'Where can I request new features?',
    a: 'Submit feature requests through our Community feedback portal or email support@pulsecrm.io. We review all suggestions and prioritize based on demand.',
  },
];

export default function SupportPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [openIssue, setOpenIssue] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div style={{ fontFamily: "'Inter',system-ui,sans-serif", background: '#fff', minHeight: '100vh' }}>
      <PageModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
      <Navbar onOpenModal={() => setModalOpen(true)} />

      {/* Hero Section */}
      <section style={{ marginTop: 64, padding: '72px 48px 56px', background: 'linear-gradient(180deg,#f5f3ff 0%,#fff 100%)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', background: '#f5f3ff', border: '1px solid #ede9fe', borderRadius: 100, marginBottom: 20 }}>
            <HelpCircle size={13} color="#7c3aed" />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Support</span>
          </div>
          <h1 style={{ fontSize: 'clamp(38px,5vw,58px)', fontWeight: 900, color: '#0f172a', lineHeight: 1.08, letterSpacing: '-0.035em', marginBottom: 16 }}>
            How Can We Help You?
          </h1>
          <p style={{ fontSize: 19, color: '#475569', lineHeight: 1.7, maxWidth: 680, marginBottom: 32 }}>
            Get instant answers to common questions, browse documentation, or contact our support team.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 0, maxWidth: 620, background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 12, padding: '4px 4px 4px 16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <Search size={16} color="#94a3b8" style={{ flexShrink: 0 }} />
            <input
              readOnly
              placeholder="Search for help articles, guides, FAQs..."
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                fontSize: 15,
                color: '#0f172a',
                padding: '10px 12px',
                fontFamily: 'inherit',
                background: 'transparent',
              }}
            />
            <button style={{ padding: '10px 18px', background: '#7c3aed', color: '#fff', fontSize: 14, fontWeight: 700, borderRadius: 9, border: 'none', cursor: 'pointer' }}>
              Search
            </button>
          </div>
        </div>
      </section>

      {/* Support Channels */}
      <section style={{ padding: '60px 48px', background: '#fff' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <h2 style={{ fontSize: 32, fontWeight: 900, color: '#0f172a', marginBottom: 32, letterSpacing: '-0.02em', textAlign: 'center' }}>
            Contact Support
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            {SUPPORT_CHANNELS.map((channel, idx) => {
              const Icon = channel.icon;
              return (
                <div
                  key={idx}
                  style={{
                    background: '#f8fafc',
                    borderRadius: 16,
                    padding: 32,
                    border: '1px solid #e2e8f0',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 28px rgba(0,0,0,0.08)';
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                  }}
                >
                  <div
                    style={{
                      height: 64,
                      width: 64,
                      borderRadius: 16,
                      background: `${channel.color}14`,
                      border: `1px solid ${channel.color}28`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 20px',
                    }}
                  >
                    <Icon size={28} color={channel.color} />
                  </div>
                  <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>{channel.title}</h3>
                  <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6, marginBottom: 12 }}>{channel.desc}</p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 16 }}>
                    <Clock size={14} color="#94a3b8" />
                    <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>{channel.response}</span>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: channel.color }}>{channel.action} →</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Common Issues */}
      <section style={{ padding: '60px 48px', background: '#f8fafc' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <h2 style={{ fontSize: 32, fontWeight: 900, color: '#0f172a', marginBottom: 32, letterSpacing: '-0.02em' }}>
            Common Issues & Solutions
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {COMMON_ISSUES.map((category, idx) => (
              <div key={idx} style={{ background: '#fff', borderRadius: 16, padding: 32, border: '1px solid #e2e8f0' }}>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 20 }}>{category.category}</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {category.issues.map((issue, i) => {
                    const key = `${idx}-${i}`;
                    const isOpen = openIssue === key;
                    return (
                      <div
                        key={i}
                        style={{
                          background: '#f8fafc',
                          border: '1.5px solid',
                          borderColor: isOpen ? '#c4b5fd' : '#e2e8f0',
                          borderRadius: 12,
                          overflow: 'hidden',
                          transition: 'border-color 0.15s',
                        }}
                      >
                        <button
                          onClick={() => setOpenIssue(isOpen ? null : key)}
                          style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 16,
                            padding: '16px 20px',
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                            textAlign: 'left',
                          }}
                        >
                          <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', lineHeight: 1.4 }}>{issue.q}</span>
                          <ArrowRight
                            size={16}
                            color="#94a3b8"
                            style={{
                              flexShrink: 0,
                              transition: 'transform 0.2s',
                              transform: isOpen ? 'rotate(90deg)' : 'rotate(0)',
                            }}
                          />
                        </button>
                        {isOpen && (
                          <div style={{ padding: '0 20px 16px' }}>
                            <div style={{ height: 1, background: '#ede9fe', marginBottom: 12 }} />
                            <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.7, margin: 0 }}>{issue.a}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* General FAQs */}
      <section style={{ padding: '60px 48px 80px', background: '#fff' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2 style={{ fontSize: 32, fontWeight: 900, color: '#0f172a', textAlign: 'center', marginBottom: 40, letterSpacing: '-0.02em' }}>
            Support FAQs
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {FAQS.map((faq, i) => (
              <div
                key={i}
                style={{
                  background: '#f8fafc',
                  border: '1.5px solid',
                  borderColor: openFaq === i ? '#c4b5fd' : '#e2e8f0',
                  borderRadius: 14,
                  overflow: 'hidden',
                  transition: 'border-color 0.15s',
                }}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 16,
                    padding: '18px 22px',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    textAlign: 'left',
                  }}
                >
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', lineHeight: 1.4 }}>{faq.q}</span>
                  <ArrowRight
                    size={17}
                    color="#94a3b8"
                    style={{
                      flexShrink: 0,
                      transition: 'transform 0.2s',
                      transform: openFaq === i ? 'rotate(90deg)' : 'rotate(0)',
                    }}
                  />
                </button>
                {openFaq === i && (
                  <div style={{ padding: '0 22px 18px' }}>
                    <div style={{ height: 1, background: '#ede9fe', marginBottom: 14 }} />
                    <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.75, margin: 0 }}>{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '80px 48px', background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)', textAlign: 'center' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <h2 style={{ fontSize: 38, fontWeight: 900, color: '#ffffff', letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: 14 }}>
            Still Need Help?
          </h2>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.85)', marginBottom: 32 }}>
            Our support team is ready to assist you. We typically respond within 24 hours.
          </p>
          <button
            onClick={() => (window.location.href = 'mailto:support@pulsecrm.io')}
            style={{
              padding: '14px 32px',
              background: '#ffffff',
              color: '#7c3aed',
              fontSize: 15,
              fontWeight: 700,
              borderRadius: 100,
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
              transition: 'transform 0.15s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.transform = 'scale(1.03)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
            }}
          >
            Contact Support →
          </button>
        </div>
      </section>

      <footer style={{ padding: '36px 48px', background: '#0f172a', color: '#475569', textAlign: 'center' }}>
        <p style={{ fontSize: 14 }}>© 2026 Pulse CRM Inc. All rights reserved.</p>
      </footer>
    </div>
  );
}
