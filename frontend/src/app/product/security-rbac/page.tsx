'use client';
import React from 'react';
import { Shield, Lock, Key, UserCheck } from 'lucide-react';
import { PageContainer, HeroWithScreenshot, FeatureCards, CTASection } from '@/components/shared/PageTemplates';
import { motion } from 'framer-motion';

const SecurityScreenshot = () => (
  <div style={{ padding: '20px', background: '#f8fafc' }}>
    <div style={{ background: '#fff', borderRadius: 12, padding: '20px', border: '1px solid #e2e8f0' }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>3 Roles · 33 Permissions</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { role: 'Admin', perms: 33, color: '#2563EB' },
          { role: 'Manager', perms: 30, color: '#2563eb' },
          { role: 'Sales Rep', perms: 18, color: '#059669' },
        ].map((r, i) => (
          <div key={i} style={{ padding: '14px', background: `${r.color}08`, borderRadius: 10, border: `1px solid ${r.color}20`, textAlign: 'center' }}>
            <div style={{ height: 32, width: 32, borderRadius: 8, background: `${r.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
              <UserCheck size={15} color={r.color} />
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>{r.role}</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: r.color }}>{r.perms}</div>
            <div style={{ fontSize: 10, color: '#64748b' }}>permissions</div>
          </div>
        ))}
      </div>
      <div style={{ background: '#f8fafc', borderRadius: 10, padding: '12px', border: '1px solid #e2e8f0' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 8 }}>PERMISSION FORMAT: resource:action</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {['lead:read', 'lead:create', 'deal:assign', 'company:delete', 'user:manage'].map((p, i) => (
            <div key={i} style={{ padding: '4px 10px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 11, fontWeight: 600, color: '#2563EB', fontFamily: 'monospace' }}>{p}</div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export default function SecurityRBACPage() {
  return (
    <PageContainer>
      <HeroWithScreenshot
        badge="Product · Security & RBAC"
        badgeIcon={Shield}
        title={<>3 roles. 33 permissions.<br /><span style={{ color: '#2563EB' }}>Zero guesswork.</span></>}
        description="Pulse uses JWT-based authentication with role-based access control. Every endpoint is protected by permission checks using FastAPI's dependency injection. Passwords are bcrypt-hashed, tokens are short-lived, and every resource supports soft-delete for audit-safe data management."
        screenshot={<SecurityScreenshot />}
      />

      <section style={{ padding: '80px 48px', background: '#fff' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'start' }}>
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <h2 style={{ fontSize: 32, fontWeight: 900, color: '#0f172a', marginBottom: 16, letterSpacing: '-0.02em' }}>How RBAC is implemented</h2>
            <p style={{ fontSize: 15, color: '#64748b', lineHeight: 1.7, marginBottom: 20 }}>
              Every route handler in the FastAPI backend has a <code style={{ background: '#EFF6FF', padding: '2px 6px', borderRadius: 4, fontSize: 13, color: '#2563EB' }}>require_permission()</code> dependency injected. The permission is checked at the route level — no logic leaks into services or repositories.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                'JWT access token (30 min) + refresh token (7 days)',
                'Passwords hashed with bcrypt via passlib',
                'Permissions stored as resource:action strings (e.g. lead:assign)',
                'Admin → 33 perms, Manager → 30, Sales Rep → 18',
                'Soft-delete on all 11 tables — data is never hard-deleted',
                'Organization-level multi-tenancy on every resource',
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#2563EB', marginTop: 6, flexShrink: 0 }} />
                  <span style={{ fontSize: 14, color: '#374151', lineHeight: 1.5 }}>{item}</span>
                </div>
              ))}
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
            style={{ background: '#f8fafc', padding: 28, borderRadius: 16, border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 14 }}>All 33 permissions cover:</div>
            {[
              { resource: 'Companies', actions: 'create, read, update, delete, list' },
              { resource: 'Contacts', actions: 'create, read, update, delete, list' },
              { resource: 'Leads', actions: 'create, read, update, delete, assign, convert' },
              { resource: 'Deals', actions: 'create, read, update, delete, assign' },
              { resource: 'Activities', actions: 'create, read, update, delete' },
              { resource: 'Users / Roles', actions: 'manage, assign, deactivate' },
            ].map((item, i) => (
              <div key={i} style={{ padding: '10px 14px', background: '#fff', borderRadius: 8, marginBottom: 8, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{item.resource}</div>
                <div style={{ fontSize: 11, color: '#64748b', fontFamily: 'monospace' }}>{item.actions}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      <FeatureCards
        features={[
          { icon: Shield, title: 'Dependency-injected auth', description: 'require_permission() on every route. Business logic never touches auth checks.' },
          { icon: Lock, title: 'bcrypt + passlib', description: 'All passwords salted and hashed. Never stored in plaintext anywhere in the system.' },
          { icon: Key, title: 'JWT access + refresh tokens', description: '30-minute access tokens. 7-day refresh tokens. Clean logout invalidates session.' },
          { icon: UserCheck, title: 'Multi-tenant isolation', description: 'Every resource has organization_id. Cross-org data access is structurally impossible.' },
        ]}
      />

      <CTASection
        title="Security your team can trust."
        description="RBAC, bcrypt, JWT, soft-delete, and multi-tenancy — built in from day one."
      />
    </PageContainer>
  );
}
