CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: users
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: roles
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT
);

-- Table: permissions
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT
);

-- Join table: roles_permissions
CREATE TABLE IF NOT EXISTS roles_permissions (
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- Join table: users_roles
CREATE TABLE IF NOT EXISTS users_roles (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- Table: companies
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    domain VARCHAR(100),
    industry VARCHAR(100),
    owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: contacts
CREATE TABLE IF NOT EXISTS contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(30),
    job_title VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: leads
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    value NUMERIC(12, 2),
    status VARCHAR(50) DEFAULT 'New',
    source VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: pipeline_stages
CREATE TABLE IF NOT EXISTS pipeline_stages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL,
    probability NUMERIC(5, 2) NOT NULL,
    display_order INTEGER NOT NULL
);

-- Table: deals
CREATE TABLE IF NOT EXISTS deals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
    contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE NOT NULL,
    stage_id UUID REFERENCES pipeline_stages(id) ON DELETE RESTRICT NOT NULL,
    owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(150) NOT NULL,
    value NUMERIC(12, 2) NOT NULL,
    status VARCHAR(30) DEFAULT 'Open',
    closed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: activities
CREATE TABLE IF NOT EXISTS activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    type VARCHAR(50) NOT NULL,
    subject VARCHAR(200) NOT NULL,
    description TEXT,
    due_date TIMESTAMP,
    status VARCHAR(30) DEFAULT 'Pending',
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: emails
CREATE TABLE IF NOT EXISTS emails (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
    contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE NOT NULL,
    message_id VARCHAR(255) UNIQUE NOT NULL,
    subject VARCHAR(255),
    body TEXT,
    sender VARCHAR(255) NOT NULL,
    recipient VARCHAR(255) NOT NULL,
    sent_at TIMESTAMP NOT NULL,
    is_incoming BOOLEAN DEFAULT TRUE,
    synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance optimization on FK columns
CREATE INDEX IF NOT EXISTS idx_companies_owner_id ON companies(owner_id);
CREATE INDEX IF NOT EXISTS idx_contacts_company_id ON contacts(company_id);
CREATE INDEX IF NOT EXISTS idx_leads_contact_id ON leads(contact_id);
CREATE INDEX IF NOT EXISTS idx_deals_company_id ON deals(company_id);
CREATE INDEX IF NOT EXISTS idx_deals_contact_id ON deals(contact_id);
CREATE INDEX IF NOT EXISTS idx_deals_stage_id ON deals(stage_id);
CREATE INDEX IF NOT EXISTS idx_deals_owner_id ON deals(owner_id);
CREATE INDEX IF NOT EXISTS idx_activities_deal_id ON activities(deal_id);
CREATE INDEX IF NOT EXISTS idx_activities_contact_id ON activities(contact_id);
CREATE INDEX IF NOT EXISTS idx_emails_deal_id ON emails(deal_id);
CREATE INDEX IF NOT EXISTS idx_emails_contact_id ON emails(contact_id);

-- Seed static tables
INSERT INTO roles (id, name, description) VALUES
  ('a8f90c42-b0c6-4767-88ea-d4b68e9f2915', 'Administrator', 'Full system access and configurations control'),
  ('b1f80c42-b0c6-4767-88ea-d4b68e9f2916', 'Sales Manager', 'Auditing, tracking pipelines, and signing off on deals'),
  ('c2f70c42-b0c6-4767-88ea-d4b68e9f2917', 'Sales Representative', 'Frontline workspace access to log and sync client pipelines')
ON CONFLICT (name) DO NOTHING;

INSERT INTO pipeline_stages (id, name, probability, display_order) VALUES
  ('d1f60c42-b0c6-4767-88ea-d4b68e9f2918', 'Qualified', 10.00, 1),
  ('e2f50c42-b0c6-4767-88ea-d4b68e9f2919', 'Proposal', 40.00, 2),
  ('f3f40c42-b0c6-4767-88ea-d4b68e9f2920', 'Under Review', 70.00, 3),
  ('a4f30c42-b0c6-4767-88ea-d4b68e9f2921', 'Won', 100.00, 4),
  ('b5f20c42-b0c6-4767-88ea-d4b68e9f2922', 'Lost', 0.00, 5)
ON CONFLICT (name) DO NOTHING;

INSERT INTO permissions (id, name, description) VALUES
  ('7a2f6448-ff35-4e08-bfb1-912c40c83a71', 'convert_leads', 'Convert inbound unqualified leads into active deals'),
  ('8b3f6448-ff35-4e08-bfb1-912c40c83a72', 'edit_deals', 'Update valuations and stages on deal entities'),
  ('9c4f6448-ff35-4e08-bfb1-912c40c83a73', 'manage_roles', 'Assign and edit operators permissions scopes')
ON CONFLICT (name) DO NOTHING;
