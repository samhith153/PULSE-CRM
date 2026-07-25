'use client';
import React, { useState } from 'react';
import { Shield, Lock, Key, UserCheck, FileText, Eye } from 'lucide-react';
import { PageContainer, HeroWithScreenshot, FeatureCards, CTASection } from '@/components/shared/PageTemplates';

const SecurityScreenshot = () => (
  <div style={{ padding: '20px', background: '#f8fafc' }}>
    <div style={{ background: '#fff', borderRadius: 12, padding: '20px', border: '1px solid #e2e8f0' }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>Roles & Permissions</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {[
          { role: 'Sales Rep', users: 8, color: '#2563eb' },
          { role: 'Manager', users: 2, color: '#7c3aed' },
          { role: 'Admin', users: 1, color: '#dc2626' },
        ].map((r, i) => (
          <div key={i} style={{ padding: '16px', background: `${r.color}08`, borderRadius: 10, border: `1px solid ${r.color}20` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div style={{ height: 32, width: 32, borderRadius: 8, background: `${r.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <UserCheck size={16} color={r.color} />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>{r.role}</div>
                <div style={{ fontSize: 10, color: '#64748b' }}>{r.users} users</div>
              </div>
            </div>
            {[1, 2, 3].map((_, j) => (
              <div key={j} style={{ height: 2, width: `${80 - j * 15}%`, background: '#e2e8f0', borderRadius: 1, marginBottom: 6 }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default function SecurityRBACPage() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <PageContainer>
      <HeroWithScreenshot
        badge="Product · Security & RBAC"
        badgeIcon={Shield}
        title={<>Enterprise-grade security<br /><span style={{ color: '#7c3aed' }}>built in from day one.</span></>}
        description="SOC 2 certified. 33 granular permissions. SSO/SAML support. Full audit logs. AES-256 encryption."
        screenshot={<SecurityScreenshot />}
        onCTA={() => setModalOpen(true)}
      />

      <FeatureCards
        features={[
          { icon: Shield, title: 'SOC 2 Type II Certified', description: 'Annual third-party audits. Full compliance reports available.' },
          { icon: Lock, title: 'AES-256 Encryption', description: 'All data encrypted at rest with AWS KMS key management.' },
          { icon: Key, title: 'SSO & SAML 2.0', description: 'Okta, Azure AD, Google Workspace, or any SAML provider.' },
          { icon: UserCheck, title: '33 Granular Permissions', description: 'Fine-grained access control across all CRM resources.' },
          { icon: Eye, title: 'Audit Logs', description: 'Every action logged with timestamp, user, IP, and payload.' },
          { icon: FileText, title: 'Bcrypt Passwords', description: 'Salted and hashed. Never stored in plaintext.' },
        ]}
      />

      <CTASection
        title="Security your compliance team will approve."
        description="Start free with enterprise security enabled from day one. No add-ons."
        onCTA={() => setModalOpen(true)}
      />
    </PageContainer>
  );
}
