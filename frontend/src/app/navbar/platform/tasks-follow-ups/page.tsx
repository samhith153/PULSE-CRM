'use client';
import React from 'react';
import { CheckSquare, Calendar, Bell } from 'lucide-react';
import { PageContainer, HeroWithScreenshot, Statistics, CTASection } from '@/components/shared/PageTemplates';

const TasksScreenshot = () => (
  <div style={{ padding: '20px', background: '#f8fafc' }}>
    <div style={{ background: '#EFF6FF', borderRadius: 12, padding: '20px', border: '1px solid #DBEAFE' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{ height: 40, width: 40, borderRadius: 10, background: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CheckSquare size={20} color="#fff" />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1D4ED8' }}>Tasks & Follow-ups</div>
          <div style={{ fontSize: 11, color: '#2563EB' }}>Scheduled · Tracked · Completed</div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[
          { task: 'Follow up with TechCorp', time: 'Today, 2:00 PM', priority: 'High' },
          { task: 'Send proposal to Acme Inc', time: 'Tomorrow, 10:00 AM', priority: 'Medium' },
        ].map((item, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: 8, padding: '12px', border: '1px solid #DBEAFE', display: 'flex', alignItems: 'center', gap: 10 }}>
            <CheckSquare size={16} color="#2563EB" />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a' }}>{item.task}</div>
              <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>{item.time}</div>
            </div>
            <div style={{ padding: '2px 8px', background: item.priority === 'High' ? '#fef2f2' : '#eff6ff', border: `1px solid ${item.priority === 'High' ? '#fecaca' : '#dbeafe'}`, borderRadius: 4, fontSize: 10, fontWeight: 700, color: item.priority === 'High' ? '#dc2626' : '#2563eb' }}>
              {item.priority}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default function TasksFollowUpsPage() {
  return (
    <PageContainer>
      <HeroWithScreenshot
        badge="Platform · Sales Workflow"
        badgeIcon={CheckSquare}
        title={<>Keep sales activities<br /><span style={{ color: '#2563EB' }}>on schedule.</span></>}
        description="Never miss a follow-up. Schedule tasks, set reminders, and track completion. Keep your sales process moving forward."
        screenshot={<TasksScreenshot />}
      />

      <Statistics
        stats={[
          { value: 'Scheduled', label: 'Task Management', description: 'Set reminders and due dates' },
          { value: 'Prioritized', label: 'Priority Levels', description: 'Focus on what matters most' },
          { value: 'Linked', label: 'Context Tracking', description: 'Tasks linked to leads and deals' },
        ]}
      />

      <CTASection
        title="Never miss a follow-up again."
        description="Keep your sales activities organized with scheduled tasks and reminders."
      />
    </PageContainer>
  );
}
