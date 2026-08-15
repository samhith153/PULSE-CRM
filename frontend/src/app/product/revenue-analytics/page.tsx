'use client';
import React from 'react';
import { BarChart2, TrendingUp, Users, Target, Medal, Trophy } from 'lucide-react';
import { PageContainer, HeroWithScreenshot, Statistics, CTASection } from '@/components/shared/PageTemplates';
import { motion } from 'framer-motion';

const AnalyticsScreenshot = () => (
  <div style={{ padding: '20px', background: '#f8fafc' }}>
    <div style={{ background: '#fff', borderRadius: 12, padding: '20px', border: '1px solid #e2e8f0' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'Revenue (Q4)', value: '₹98.4L', color: '#2563EB' },
          { label: 'Deals Closed', value: '57', color: '#059669' },
          { label: 'Win Rate', value: '64%', color: '#2563eb' },
          { label: 'Avg Deal Size', value: '₹1.72L', color: '#d97706' },
        ].map((kpi, i) => (
          <div key={i} style={{ padding: '14px', background: `${kpi.color}08`, borderRadius: 10, border: `1px solid ${kpi.color}20` }}>
            <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600, marginBottom: 6 }}>{kpi.label}</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: kpi.color }}>{kpi.value}</div>
          </div>
        ))}
      </div>
      <div style={{ height: 80, background: '#f8fafc', borderRadius: 10, display: 'flex', alignItems: 'flex-end', gap: 4, padding: '10px' }}>
        {[40, 55, 45, 70, 60, 85, 75, 90].map((h, i) => (
          <div key={i} style={{ flex: 1, height: `${h}%`, background: '#2563EB', borderRadius: '4px 4px 0 0', opacity: 0.7 + (i * 0.04) }} />
        ))}
      </div>
    </div>
  </div>
);

export default function RevenueAnalyticsPage() {
  return (
    <PageContainer>
      <HeroWithScreenshot
        badge="Product · Revenue Analytics"
        badgeIcon={BarChart2}
        title={<>Real-time revenue data,<br /><span style={{ color: '#2563EB' }}>not last week's exports.</span></>}
        description="Live dashboards with pipeline metrics, funnel analysis, rep leaderboards, and AI forecasting — updated every second."
        screenshot={<AnalyticsScreenshot />}
      />

      {/* Feature Highlight */}
      <section style={{ padding: '80px 48px', background: '#fff' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "0px" }}
            transition={{ duration: 0.6 }}
            style={{ background: 'linear-gradient(135deg, #EFF6FF 0%, #fff 100%)', padding: 32, borderRadius: 16, border: '1px solid #DBEAFE' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#2563EB', marginBottom: 16 }}>Rep Leaderboard — Live</div>
            {[
              { rank: 1, name: 'Alex R.', revenue: '₹24.1L' },
              { rank: 2, name: 'Jordan L.', revenue: '₹19.8L' },
              { rank: 3, name: 'Sam T.', revenue: '₹17.2L' },
            ].map((rep, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px', background: '#fff', borderRadius: 10, marginBottom: 10, border: '1px solid #e2e8f0' }}>
                {rep.rank === 1
                  ? <Trophy size={22} style={{ color: '#F59E0B' }} />
                  : <Medal size={22} style={{ color: rep.rank === 2 ? '#94A3B8' : '#CD7F32' }} />}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{rep.name}</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>Q4 2025</div>
                </div>
                <div style={{ fontSize: 16, fontWeight: 900, color: '#2563EB' }}>{rep.revenue}</div>
              </div>
            ))}
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "0px" }}
            transition={{ duration: 0.6, delay: 0.2 }}>
            <h2 style={{ fontSize: 36, fontWeight: 900, color: '#0f172a', marginBottom: 16, letterSpacing: '-0.02em' }}>Every metric, always current</h2>
            <p style={{ fontSize: 16, color: '#64748b', lineHeight: 1.7, marginBottom: 24 }}>
              Pulse Analytics pulls data directly from your live pipeline. No manual exports. No scheduled refreshes. Every chart updates the moment deals move.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { icon: BarChart2, text: 'Pipeline telemetry dashboard' },
                { icon: TrendingUp, text: 'Weighted revenue forecasting' },
                { icon: Users, text: 'Rep performance leaderboards' },
                { icon: Target, text: 'Funnel conversion analysis' },
              ].map(({ icon: Icon, text }, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ height: 36, width: 36, borderRadius: 8, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={16} color="#2563EB" />
                  </div>
                  <span style={{ fontSize: 15, color: '#0f172a', fontWeight: 500 }}>{text}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <Statistics
        stats={[
          { value: '/api/v1', label: 'Dashboard endpoint', description: 'Role-scoped KPIs returned in a single async query' },
          { value: '40+', label: 'REST endpoints', description: 'Full API for custom integrations via Swagger UI' },
          { value: 'RBAC', label: 'Scoped views', description: 'Reps see their data; managers see the full team' },
        ]}
      />

      <CTASection
        title="See your revenue clearly."
        description="14-day free trial. Full access to dashboards, forecasting, and leaderboards."
      />
    </PageContainer>
  );
}
