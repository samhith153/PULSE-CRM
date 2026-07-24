'use client';
import React from 'react';
import FeaturePage, { FPData } from '@/components/shared/FeaturePage';
import { Shield, Lock, Key, UserCheck, FileText, Eye } from 'lucide-react';

const SecurityMockup = () => (
  <div>
    <div style={{ marginBottom:18 }}>
      <p style={{ fontSize:16, fontWeight:800, color:'#0f172a', margin:'0 0 4px' }}>Roles & Permissions</p>
      <p style={{ fontSize:12, color:'#64748b', margin:0 }}>33 granular permissions across all CRM resources · 3 default roles</p>
    </div>
    <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:20 }}>
      {[
        { role:'Sales Representative', users:8, color:'#2563eb', permissions:['View Own Deals','Edit Own Contacts','View Team Pipeline','Create Activities','Send Emails','Access API'] },
        { role:'Sales Manager', users:2, color:'#7c3aed', permissions:['All Rep Permissions','View All Deals','Edit Team Contacts','Assign Leads','Run Reports','Manage Workflows'] },
        { role:'System Administrator', users:1, color:'#dc2626', permissions:['All Manager Permissions','Manage Users','Manage Roles','Configure Integrations','Audit Logs','SSO Settings'] },
      ].map(r=>(
        <div key={r.role} style={{ padding:'16px', background:'#fff', borderRadius:12, border:'1px solid #e2e8f0' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
            <div>
              <p style={{ fontSize:13, fontWeight:700, color:'#0f172a', margin:'0 0 4px' }}>{r.role}</p>
              <span style={{ fontSize:11, color:'#64748b' }}>{r.users} users</span>
            </div>
            <div style={{ height:32, width:32, borderRadius:8, background:`${r.color}10`, border:`1px solid ${r.color}30`, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <UserCheck size={15} color={r.color} />
            </div>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
            {r.permissions.slice(0,4).map(p=>(
              <div key={p} style={{ display:'flex', alignItems:'center', gap:6 }}>
                <div style={{ height:4, width:4, borderRadius:'50%', background:r.color, flexShrink:0 }} />
                <span style={{ fontSize:11, color:'#475569' }}>{p}</span>
              </div>
            ))}
            <span style={{ fontSize:10, color:'#94a3b8', marginTop:4 }}>+ {r.permissions.length - 4} more permissions</span>
          </div>
        </div>
      ))}
    </div>
    {/* Permissions matrix */}
    <div style={{ background:'#f8fafc', borderRadius:12, border:'1px solid #e2e8f0', padding:'16px', overflow:'auto' }}>
      <p style={{ fontSize:12, fontWeight:700, color:'#0f172a', margin:'0 0 12px' }}>Permissions Matrix</p>
      <table style={{ width:'100%', fontSize:11, borderCollapse:'collapse' }}>
        <thead>
          <tr style={{ borderBottom:'1.5px solid #e2e8f0' }}>
            <th style={{ textAlign:'left', padding:'8px 12px', color:'#64748b', fontWeight:700 }}>Resource</th>
            <th style={{ textAlign:'center', padding:'8px 12px', color:'#2563eb', fontWeight:700 }}>Rep</th>
            <th style={{ textAlign:'center', padding:'8px 12px', color:'#7c3aed', fontWeight:700 }}>Manager</th>
            <th style={{ textAlign:'center', padding:'8px 12px', color:'#dc2626', fontWeight:700 }}>Admin</th>
          </tr>
        </thead>
        <tbody>
          {[
            { resource:'Deals', rep:'Own', mgr:'All', adm:'All' },
            { resource:'Contacts', rep:'Own', mgr:'Team', adm:'All' },
            { resource:'Companies', rep:'Read', mgr:'Edit', adm:'Full' },
            { resource:'Leads', rep:'Assigned', mgr:'All', adm:'All' },
            { resource:'Reports', rep:'Basic', mgr:'Custom', adm:'Full' },
            { resource:'Users', rep:'—', mgr:'—', adm:'Manage' },
            { resource:'Integrations', rep:'Use', mgr:'Use', adm:'Configure' },
            { resource:'Audit Logs', rep:'—', mgr:'View', adm:'Export' },
          ].map((row,i)=>(
            <tr key={i} style={{ borderBottom:'1px solid #f1f5f9' }}>
              <td style={{ padding:'10px 12px', color:'#0f172a', fontWeight:600 }}>{row.resource}</td>
              <td style={{ padding:'10px 12px', textAlign:'center', color:'#475569' }}>{row.rep}</td>
              <td style={{ padding:'10px 12px', textAlign:'center', color:'#475569' }}>{row.mgr}</td>
              <td style={{ padding:'10px 12px', textAlign:'center', color:'#475569' }}>{row.adm}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    {/* Security features */}
    <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginTop:18 }}>
      {[
        { icon:Lock, label:'AES-256 Encryption', desc:'Data at rest', color:'#059669' },
        { icon:Shield, label:'TLS 1.3', desc:'Data in transit', color:'#2563eb' },
        { icon:Key, label:'bcrypt Passwords', desc:'Salted & hashed', color:'#7c3aed' },
        { icon:Eye, label:'Audit Logs', desc:'Every action logged', color:'#d97706' },
        { icon:FileText, label:'SOC 2 Type II', desc:'Certified compliant', color:'#dc2626' },
        { icon:UserCheck, label:'SSO / SAML 2.0', desc:'Enterprise auth', color:'#059669' },
      ].map(f=>{
        const Icon=f.icon;
        return(
          <div key={f.label} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', background:'#fff', borderRadius:10, border:'1px solid #e2e8f0' }}>
            <div style={{ height:32, width:32, borderRadius:8, background:`${f.color}10`, border:`1px solid ${f.color}30`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <Icon size={14} color={f.color} />
            </div>
            <div>
              <p style={{ fontSize:11, fontWeight:700, color:'#0f172a', margin:'0 0 2px' }}>{f.label}</p>
              <p style={{ fontSize:10, color:'#64748b', margin:0 }}>{f.desc}</p>
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

const data: FPData = {
  badge:'Product · Security & RBAC',
  badgeIcon: Shield,
  heroTitle: <>Enterprise-grade security<br /><span style={{ color:'#7c3aed' }}>built in from day one.</span></>,
  heroDesc:'Pulse CRM is SOC 2 Type II certified with role-based access control, 33 granular permissions, SSO/SAML support, full audit logs, and AES-256 encryption — giving your compliance and security teams confidence.',
  overviewTitle:'Security that meets enterprise standards',
  overviewDesc:'Pulse CRM is designed for regulated industries. From banking to healthcare to government contractors — our security posture supports your most stringent requirements.',
  capabilities:[
    { icon:Shield, title:'SOC 2 Type II Certified', desc:'Pulse undergoes annual third-party audits for security, availability, and confidentiality controls. Full attestation reports available on request.' },
    { icon:Lock, title:'AES-256 Encryption at Rest', desc:'All database records are encrypted with AES-256 keys managed by AWS KMS. Encryption keys are rotated quarterly and never stored alongside data.' },
    { icon:Key, title:'Bcrypt Password Hashing', desc:'User passwords are salted and hashed using bcrypt with a cost factor of 12. Passwords are never stored in plaintext or reversible encryption.' },
    { icon:UserCheck, title:'SSO & SAML 2.0 Support', desc:'Enterprise plans include single sign-on via Okta, Azure AD, Google Workspace, or any SAML 2.0 identity provider. MFA enforcement is supported.' },
    { icon:Eye, title:'Comprehensive Audit Logs', desc:'Every user action — deal edited, contact deleted, role changed — is logged with timestamp, user ID, IP address, and full payload. Logs are retained for 7 years.' },
    { icon:FileText, title:'33 Granular Permissions', desc:'Pulse supports 33 individual permissions across contacts, deals, companies, leads, reports, users, and integrations. Every role is a customisable permission set.' },
  ],
  howItWorksTitle:'How RBAC works in Pulse CRM',
  steps:[
    { step:'01', title:'Users are assigned to roles', desc:'Every Pulse user has one role: Sales Representative, Sales Manager, or System Administrator (default roles). Admins can create custom roles by cloning an existing role and toggling specific permissions.' },
    { step:'02', title:'Permissions define access scope', desc:'Each role has a permission set: "view own deals", "edit all contacts", "manage users", etc. The Pulse backend checks permissions on every API request using JWT claims embedded in the auth token.' },
    { step:'03', title:'Resources are filtered by role', desc:'When a Sales Rep loads the Deals page, the backend SQL query includes a WHERE clause: owner_id = current_user_id. Managers see all deals; reps see only their own. The filter is enforced at the database layer.' },
    { step:'04', title:'Audit logs capture everything', desc:'Before and after every write operation, Pulse logs the action to the audit_logs table: who made the change, what resource was affected, what changed (diff), and when. Logs are immutable and write-only.' },
    { step:'05', title:'SSO bypasses password storage', desc:'When SSO is enabled, users authenticate via your identity provider. Pulse receives a SAML assertion, validates the signature, and creates a JWT session token. Passwords never touch Pulse servers.' },
  ],
  statsTitle:'Security & compliance built for enterprise',
  statsDesc:'Pulse CRM meets the strictest enterprise security requirements out of the box.',
  stats:[
    { stat:'SOC 2', label:'Type II Certified', desc:'Annual audits by independent third-party assessors' },
    { stat:'33', label:'Granular permissions', desc:'Fine-grained access control across all CRM resources' },
    { stat:'100%', label:'Actions logged', desc:'Every edit, delete, create, and access captured in audit logs' },
    { stat:'AES-256', label:'Encryption at rest', desc:'All data encrypted with industry-standard AES-256' },
  ],
  mockupTitle:'Security & RBAC — exactly as it appears in Pulse CRM',
  mockup:<SecurityMockup />,
  ctaTitle:'Security your compliance team will approve.',
  ctaDesc:'Start your free 14-day trial with enterprise-grade security enabled from day one. No add-ons. No upsells.',
};

export default function SecurityRBACPage() { return <FeaturePage data={data} />; }
