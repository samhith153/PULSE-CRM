'use client';
import React, { useState } from 'react';
import Navbar from '@/components/navigation/Navbar';
import PageModal from '@/components/shared/PageModal';
import { MessageCircle, Users, ArrowRight, Star, Zap, Award, CheckCircle } from 'lucide-react';

const THREADS = [
  { title: 'How do you handle lead-to-deal conversion in your Pulse workflow?', replies: 24, views: 312, tag: 'Workflow', author: 'Alex R.', time: '2h ago', hot: true },
  { title: 'AI Copilot scoring seems off for B2B SaaS leads — any tips to calibrate?', replies: 18, views: 220, tag: 'AI', author: 'Sarah M.', time: '4h ago', hot: true },
  { title: 'Feature request: bulk deal stage updates from the list view', replies: 41, views: 540, tag: 'Feature Request', author: 'Jordan L.', time: '1d ago', hot: false },
  { title: 'Gmail sync suddenly stopped — fixed it by re-authorising OAuth scope', replies: 9, views: 87, tag: 'Troubleshooting', author: 'Casey T.', time: '1d ago', hot: false },
  { title: 'Building a Zapier integration with Pulse REST API — my experience', replies: 15, views: 198, tag: 'Integrations', author: 'Riley K.', time: '2d ago', hot: false },
  { title: 'Custom roles: can I restrict a manager to see only their region\'s deals?', replies: 7, views: 64, tag: 'Permissions', author: 'Morgan P.', time: '3d ago', hot: false },
];

const TAG_C: Record<string, { color: string; bg: string }> = {
  Workflow: { color: '#7c3aed', bg: '#f5f3ff' },
  AI: { color: '#9333ea', bg: '#fdf4ff' },
  'Feature Request': { color: '#d97706', bg: '#fffbeb' },
  Troubleshooting: { color: '#dc2626', bg: '#fef2f2' },
  Integrations: { color: '#2563eb', bg: '#eff6ff' },
  Permissions: { color: '#059669', bg: '#f0fdf4' },
};

export default function CommunityPage() {
  const [modalOpen, setModalOpen] = useState(false);
  return (
    <div style={{ fontFamily: "'Inter',system-ui,sans-serif", background: '#fff', minHeight: '100vh' }}>
      <PageModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
      <Navbar onOpenModal={() => setModalOpen(true)} />
      <section style={{ marginTop: 64, padding: '72px 48px 56px', background: 'linear-gradient(180deg,#f5f3ff 0%,#fff 100%)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr auto', gap: 40, alignItems: 'center' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', background: '#f5f3ff', border: '1px solid #ede9fe', borderRadius: 100, marginBottom: 20 }}>
              <MessageCircle size={13} color="#7c3aed" />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Community</span>
            </div>
            <h1 style={{ fontSize: 'clamp(38px,5vw,54px)', fontWeight: 900, color: '#0f172a', lineHeight: 1.08, letterSpacing: '-0.035em', marginBottom: 16 }}>Join 5,000+ Pulse CRM users</h1>
            <p style={{ fontSize: 19, color: '#475569', lineHeight: 1.7, maxWidth: 560, marginBottom: 28 }}>Ask questions, share workflows, request features, and connect with the Pulse CRM team and community — on Slack and our community forum.</p>
            <div style={{ display: 'flex', gap: 14 }}>
              <button style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 28px', background: '#7c3aed', color: '#fff', fontSize: 15, fontWeight: 700, borderRadius: 100, border: 'none', cursor: 'pointer', boxShadow: '0 8px 24px rgba(124,58,237,0.3)' }}>
                Join Slack Community <ArrowRight size={16} />
              </button>
              <button style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 24px', background: 'transparent', border: '1.5px solid #e2e8f0', color: '#0f172a', fontSize: 15, fontWeight: 600, borderRadius: 100, cursor: 'pointer' }}>
                Browse Forum
              </button>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {[
              { icon: Users, val: '5,000+', label: 'Members', color: '#7c3aed' },
              { icon: MessageCircle, val: '12,400+', label: 'Threads', color: '#2563eb' },
              { icon: Star, val: '4.9/5', label: 'Rating', color: '#d97706' },
              { icon: Zap, val: '< 2h', label: 'Avg reply time', color: '#059669' },
            ].map(s => {
              const Icon = s.icon;
              return (
                <div key={s.label} style={{ padding: '18px', background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
                  <Icon size={20} color={s.color} style={{ marginBottom: 8 }} />
                  <div style={{ fontSize: 22, fontWeight: 900, color: s.color, marginBottom: 3 }}>{s.val}</div>
                  <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>{s.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section style={{ padding: '48px 48px 80px', background: '#fff' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 340px', gap: 32 }}>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', marginBottom: 20 }}>Recent Discussions</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {THREADS.map((t, i) => {
                const tc = TAG_C[t.tag] ?? { color: '#475569', bg: '#f8fafc' };
                return (
                  <div key={i} style={{ padding: '20px 24px', background: '#f8fafc', borderRadius: 14, border: '1px solid #e2e8f0', cursor: 'pointer', transition: 'box-shadow .15s, transform .15s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(0,0,0,.07)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'none'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                          {t.hot && <span style={{ fontSize: 10, fontWeight: 700, color: '#dc2626', background: '#fef2f2', padding: '2px 8px', borderRadius: 20 }}>🔥 Hot</span>}
                          <span style={{ fontSize: 11, fontWeight: 700, color: tc.color, background: tc.bg, padding: '2px 9px', borderRadius: 20 }}>{t.tag}</span>
                        </div>
                        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 8, lineHeight: 1.4 }}>{t.title}</h3>
                        <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>
                          <span>by {t.author} · {t.time}</span>
                          <span>💬 {t.replies} replies</span>
                          <span>👁 {t.views} views</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ padding: '24px', background: '#f5f3ff', borderRadius: 16, border: '1px solid #ede9fe' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>Community Guidelines</h3>
              {['Be respectful and constructive', 'Search before posting', 'Share your Pulse version', 'Tag posts correctly', 'Celebrate others\' wins'].map(g => (
                <div key={g} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <CheckCircle size={14} color="#7c3aed" />
                  <span style={{ fontSize: 13, color: '#475569' }}>{g}</span>
                </div>
              ))}
            </div>
            <div style={{ padding: '24px', background: '#f8fafc', borderRadius: 16, border: '1px solid #e2e8f0' }}>
              <Award size={24} color="#d97706" style={{ marginBottom: 12 }} />
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>Top Contributors</h3>
              {['Alex Rivera — 240 helpful answers', 'Sarah Chen — 187 answers', 'Jordan Blake — 142 answers'].map((m, i) => (
                <p key={i} style={{ fontSize: 13, color: '#475569', margin: '0 0 6px' }}>#{i + 1} {m}</p>
              ))}
            </div>
          </div>
        </div>
      </section>
      <footer style={{ padding: '36px 48px', background: '#0f172a', color: '#475569', textAlign: 'center' }}>
        <p style={{ fontSize: 14 }}>© 2026 Pulse CRM Inc. All rights reserved.</p>
      </footer>
    </div>
  );
}
