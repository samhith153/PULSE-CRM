'use client';
import React, { useState } from 'react';
import { Building2, Shield, Users, Zap } from 'lucide-react';
import { PageContainer, HeroWithScreenshot, FeatureCards, CTASection } from '@/components/shared/PageTemplates';

const EnterpriseScreenshot = () => (
  <div style={{ padding: '20px', background: '#f8fafc' }}>
    <div style={{ background: '#fff', borderRadius: 12, padding: '20px', border: '1px solid #e2e8f0' }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>Enterprise Features</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
        {[
          { icon: '🔐', label: 'SSO / SAML 2.0', status: 'Enabled' },
          { icon: '📊', label: 'Audit Logs', status: 'Active' },
          { icon: '🔒', label: 'SOC 2 Type II', status: 'Certified' },
          { icon: '⚡', label: 'SLA 99.9%', status: 'Guaranteed' },
        ].map((feature, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px', background: '#f8fafc', borderRadius: 8 }}>
            <span style={{ fontSize: 24 }}>{feature.icon}</span>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>{feature.label}</div>
              <div style={{ fontSize: 10, color: '#059669', fontWeight: 600 }}>✓ {feature.status}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default function EnterprisePage() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <PageContainer>
      <HeroWithScreenshot
        badge="Solutions · Enterprise"
        badgeIcon={Building2}
        title={<>Enterprise scale.<br /><span style={{ color: '#7c3aed' }}>Startup speed.</span></>}
        description="SSO, audit logs, 99.9% SLA, unlimited seats, dedicated support, and custom integrations."
        screenshot={<EnterpriseScreenshot />}
        onCTA={() => setModalOpen(true)}
      />

      <FeatureCards
        features={[
          { icon: Shield, title: 'SSO & SAML 2.0', description: 'Okta, Azure AD, Google Workspace integration with MFA enforcement.' },
          { icon: Users, title: 'Unlimited Seats', description: 'No per-user pricing. Add your entire organization.' },
          { icon: Zap, title: '99.9% SLA Guarantee', description: 'Backed by service credits and 24/7 enterprise support.' },
        ]}
      />

      <CTASection
        title="Ready for enterprise scale."
        description="Contact our sales team for custom pricing and dedicated onboarding."
        onCTA={() => setModalOpen(true)}
      />
    </PageContainer>
  );
}
