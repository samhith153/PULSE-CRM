'use client';
import React from 'react';
import { UserCheck, Mail, Phone } from 'lucide-react';
import { PageContainer, HeroWithScreenshot, Statistics, CTASection } from '@/components/shared/PageTemplates';

const ContactScreenshot = () => (
  <div style={{ padding: '20px', background: '#f8fafc' }}>
    <div style={{ background: '#EFF6FF', borderRadius: 12, padding: '20px', border: '1px solid #DBEAFE' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{ height: 40, width: 40, borderRadius: 10, background: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <UserCheck size={20} color="#fff" />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1D4ED8' }}>Contact Management</div>
          <div style={{ fontSize: 11, color: '#2563EB' }}>Organized · Connected · Accessible</div>
        </div>
      </div>
      <div style={{ background: '#fff', borderRadius: 10, padding: '14px', border: '1px solid #DBEAFE' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>Sarah Johnson</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <Mail size={14} color="#64748b" />
          <span style={{ fontSize: 12, color: '#64748b' }}>sarah.johnson@techcorp.com</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Phone size={14} color="#64748b" />
          <span style={{ fontSize: 12, color: '#64748b' }}>+1 (555) 123-4567</span>
        </div>
        <div style={{ marginTop: 12, fontSize: 11, color: '#2563EB', fontWeight: 600 }}>Last contacted: 2 days ago</div>
      </div>
    </div>
  </div>
);

export default function ContactManagementPage() {
  return (
    <PageContainer>
      <HeroWithScreenshot
        badge="Platform · CRM Core"
        badgeIcon={UserCheck}
        title={<>Keep customer contacts<br /><span style={{ color: '#2563EB' }}>organized.</span></>}
        description="Store and manage all your customer contacts with their complete communication history. Never lose context on your relationships."
        screenshot={<ContactScreenshot />}
      />

      <Statistics
        stats={[
          { value: 'Complete', label: 'Contact Profiles', description: 'All details and communication history' },
          { value: 'Linked', label: 'Company Association', description: 'Contacts linked to their organizations' },
          { value: 'Tracked', label: 'Interaction History', description: 'Every email, call, and meeting logged' },
        ]}
      />

      <CTASection
        title="Organize your customer relationships."
        description="Keep every contact detail and interaction history in one accessible place."
      />
    </PageContainer>
  );
}
