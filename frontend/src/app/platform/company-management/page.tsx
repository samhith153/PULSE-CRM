'use client';
import React from 'react';
import { Building2, Users, DollarSign, Globe, ArrowRight, BarChart2, MapPin } from 'lucide-react';
import { PageContainer, HeroWithScreenshot, FeatureCards, CTASection } from '@/components/shared/PageTemplates';

const CompanyScreenshot = () => (
  <div style={{ padding: '20px', background: '#f8fafc' }}>
    <div style={{ background: '#fff', borderRadius: 12, padding: '16px', border: '1px solid #e2e8f0' }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>Companies</div>
      {[
        { name: 'TechCorp Industries', employees: '250-500', revenue: '$12.5M', location: 'San Francisco, CA', deals: 3 },
        { name: 'Acme Corporation', employees: '50-100', revenue: '$4.2M', location: 'New York, NY', deals: 2 },
        { name: 'GlobalStart Labs', employees: '10-50', revenue: '$890K', location: 'Austin, TX', deals: 1 },
      ].map((c, i) => (
        <div key={i} style={{ padding: '12px 0', borderBottom: i < 2 ? '1px solid #f1f5f9' : 'none' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>{c.name}</div>
            <div style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: '#EFF6FF', color: '#2563EB', fontWeight: 600 }}>{c.deals} deals</div>
          </div>
          <div style={{ display: 'flex', gap: 12, fontSize: 10, color: '#64748b' }}>
            <span><Users size={9} style={{ verticalAlign: 'middle' }} /> {c.employees}</span>
            <span><DollarSign size={9} style={{ verticalAlign: 'middle' }} /> {c.revenue}</span>
            <span><MapPin size={9} style={{ verticalAlign: 'middle' }} /> {c.location}</span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default function CompanyManagementPage() {
  return (
    <PageContainer>
      <HeroWithScreenshot
        badge="Platform"
        badgeIcon={Building2}
        title={<>Manage organizations <span style={{ color: '#2563EB' }}>in one place</span></>}
        description="Track company information, revenue, employee count, and all associated contacts and deals. Get a complete organizational view."
        screenshot={<CompanyScreenshot />}
      />
      <FeatureCards features={[
        { icon: Building2, title: 'Company Profiles', description: 'Rich company profiles with industry, size, revenue, and location data. Enriched from public sources.' },
        { icon: Users, title: 'Contact Mapping', description: 'See all contacts within a company. Understand organizational hierarchies and decision-making chains.' },
        { icon: DollarSign, title: 'Revenue Tracking', description: 'Track annual revenue and company size to prioritize high-value accounts.' },
        { icon: BarChart2, title: 'Deal Association', description: 'Link companies to deals and track total pipeline value per organization.' },
        { icon: Globe, title: 'Industry Insights', description: 'Categorize companies by industry and segment for targeted sales strategies.' },
        { icon: MapPin, title: 'Location Data', description: 'Track company locations for territory planning and regional sales strategies.' },
      ]} />
      <CTASection
        title="Organize your company database"
        description="Start building your organizational intelligence today."
      />
    </PageContainer>
  );
}
