'use client';
import React from 'react';
import { Activity, Calendar, CheckCircle, Clock, ArrowRight, Users, Bell } from 'lucide-react';
import { PageContainer, HeroWithScreenshot, FeatureCards, CTASection } from '@/components/shared/PageTemplates';

const TasksScreenshot = () => (
  <div style={{ padding: '20px', background: '#f8fafc' }}>
    <div style={{ background: '#fff', borderRadius: 12, padding: '16px', border: '1px solid #e2e8f0' }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>Today's Tasks</div>
      {[
        { task: 'Follow up with Sarah Chen', type: 'Email', due: '10:00 AM', priority: 'High', done: true },
        { task: 'Demo call with Acme Inc', type: 'Call', due: '2:00 PM', priority: 'High', done: false },
        { task: 'Send proposal to GlobalStart', type: 'Email', due: '4:00 PM', priority: 'Medium', done: false },
        { task: 'Update deal stage for Partnership', type: 'Internal', due: '5:00 PM', priority: 'Low', done: false },
      ].map((t, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: i < 3 ? '1px solid #f1f5f9' : 'none' }}>
          <div style={{ width: 18, height: 18, borderRadius: 4, border: t.done ? 'none' : '1.5px solid #e2e8f0', background: t.done ? '#16a34a' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {t.done && <CheckCircle size={12} color="#fff" />}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: t.done ? '#94a3b8' : '#0f172a', textDecoration: t.done ? 'line-through' : 'none' }}>{t.task}</div>
            <div style={{ fontSize: 10, color: '#64748b' }}>{t.type}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, color: '#64748b' }}>{t.due}</div>
            <div style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: t.priority === 'High' ? '#fef2f2' : t.priority === 'Medium' ? '#fef9c3' : '#f1f5f9', color: t.priority === 'High' ? '#dc2626' : t.priority === 'Medium' ? '#ca8a04' : '#64748b', fontWeight: 600 }}>{t.priority}</div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default function TasksFollowUpsPage() {
  return (
    <PageContainer>
      <HeroWithScreenshot
        badge="Platform"
        badgeIcon={Activity}
        title={<>Keep sales activities <span style={{ color: '#2563EB' }}>on schedule</span></>}
        description="Intelligent task management with AI-suggested next actions. Never miss a follow-up with automated reminders and priority scoring."
        screenshot={<TasksScreenshot />}
      />
      <FeatureCards features={[
        { icon: Activity, title: 'Activity Logging', description: 'Automatic logging of calls, emails, and meetings. Every interaction is captured without manual entry.' },
        { icon: Bell, title: 'Smart Reminders', description: 'AI-powered reminders based on lead priority and engagement. Follow up at the right time, every time.' },
        { icon: Calendar, title: 'Calendar Sync', description: 'Two-way calendar integration. Tasks and meetings sync automatically with Google Calendar.' },
        { icon: CheckCircle, title: 'Task Completion', description: 'Track task completion rates and identify patterns. Improve follow-up consistency across your team.' },
        { icon: Clock, title: 'Priority Scoring', description: 'Tasks automatically prioritized by lead score, deal value, and urgency. Focus on what matters most.' },
        { icon: Users, title: 'Team Accountability', description: 'Track individual and team task completion. Identify bottlenecks and improve sales discipline.' },
      ]} />
      <CTASection
        title="Never miss a follow-up again"
        description="Start managing sales activities with intelligent prioritization."
      />
    </PageContainer>
  );
}
