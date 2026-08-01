# KALNET PULSE CRM — Database Schema Reference

**Project:** KALNET PULSE – Enterprise Sales & Marketing CRM  
**Backend:** FastAPI + SQLAlchemy 2.0 (Async) + PostgreSQL  
**Total Tables:** 11  
**Migrations:** 2 Alembic migration files  
**Last Updated:** July 2026

---

## Table of Contents

1. [Entity Relationship Overview](#entity-relationship-overview)
2. [Design Principles](#design-principles)
3. [Table: organizations](#1-organizations)
4. [Table: users](#2-users)
5. [Table: roles](#3-roles)
6. [Table: permissions](#4-permissions)
7. [Table: role_permissions](#5-role_permissions)
8. [Table: user_roles](#6-user_roles)
9. [Table: companies](#7-companies)
10. [Table: contacts](#8-contacts)
11. [Table: leads](#9-leads)
12. [Table: deals](#10-deals)
13. [Table: activities](#11-activities)
14. [RBAC Permission Map](#rbac-permission-map)
15. [Migration History](#migration-history)

---

## Entity Relationship Overview

```
organizations
    ├── users          (1 org → many users)
    ├── companies      (1 org → many companies)
    ├── contacts       (1 org → many contacts)
    ├── leads          (1 org → many leads)
    ├── deals          (1 org → many deals)
    └── activities     (1 org → many activities)

roles ──< role_permissions >── permissions
users ──< user_roles        >── roles

companies ──< contacts
companies ──< leads
companies ──< deals

contacts  ──< leads
contacts  ──< deals
contacts  ──< activities

leads     ──o deals        (lead can be converted to deal)
leads     ──< activities

deals     ──< activities
```

---

## Design Principles

| Principle | Implementation |
|-----------|---------------|
| **UUID Primary Keys** | All tables use `UUID` as PK — no integer sequences |
| **Audit Timestamps** | Every table has `created_at`, `updated_at` (TIMESTAMPTZ) |
| **Soft Delete** | Domain tables use `is_deleted = false` — no hard deletes |
| **Multi-Tenancy** | All domain tables have `organization_id` FK — every query is org-scoped |
| **Active Flag** | `is_active` column on all tables for quick enable/disable |
| **FK Behavior** | `CASCADE` for ownership, `SET NULL` for optional links, `RESTRICT` for critical deps |
| **Indexes** | All FKs and frequently filtered columns are indexed |
| **Constraints** | Unique constraints prevent duplicates within org scope |

---

## 1. organizations

> Root multi-tenant entity. Every user, company, contact, lead, deal, and activity belongs to one organization.

**Migration:** `0001_initial_schema.py`

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` | UUID | NOT NULL | uuid4 | Primary Key |
| `name` | VARCHAR(255) | NOT NULL | — | UNIQUE |
| `slug` | VARCHAR(100) | NOT NULL | — | UNIQUE, indexed |
| `description` | TEXT | NULL | — | |
| `website` | VARCHAR(500) | NULL | — | |
| `phone` | VARCHAR(30) | NULL | — | |
| `email` | VARCHAR(255) | NULL | — | |
| `address` | TEXT | NULL | — | |
| `city` | VARCHAR(100) | NULL | — | |
| `country` | VARCHAR(100) | NULL | — | |
| `timezone` | VARCHAR(50) | NOT NULL | `UTC` | |
| `logo_url` | VARCHAR(500) | NULL | — | |
| `plan` | VARCHAR(50) | NOT NULL | `free` | free / pro / enterprise |
| `max_users` | INTEGER | NOT NULL | `5` | seat limit |
| `is_active` | BOOLEAN | NOT NULL | `true` | |
| `is_deleted` | BOOLEAN | NOT NULL | `false` | soft delete |
| `created_at` | TIMESTAMPTZ | NOT NULL | `now()` | |
| `updated_at` | TIMESTAMPTZ | NOT NULL | `now()` | |

**Indexes:** `id`, `slug`, `is_active`  
**Unique Constraints:** `name`, `slug`

---

## 2. users

> CRM operators — admins, managers, and sales reps. Not to be confused with contacts (external customers).

**Migration:** `0001_initial_schema.py`

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` | UUID | NOT NULL | uuid4 | Primary Key |
| `email` | VARCHAR(255) | NOT NULL | — | UNIQUE, indexed |
| `full_name` | VARCHAR(255) | NOT NULL | — | |
| `hashed_password` | VARCHAR(255) | NOT NULL | — | bcrypt hash |
| `avatar_url` | VARCHAR(500) | NULL | — | |
| `phone` | VARCHAR(30) | NULL | — | |
| `job_title` | VARCHAR(100) | NULL | — | |
| `organization_id` | UUID FK | NOT NULL | — | → organizations (RESTRICT) |
| `is_active` | BOOLEAN | NOT NULL | `true` | |
| `is_verified` | BOOLEAN | NOT NULL | `false` | email verified |
| `is_superuser` | BOOLEAN | NOT NULL | `false` | |
| `is_deleted` | BOOLEAN | NOT NULL | `false` | soft delete |
| `email_verification_token` | VARCHAR(255) | NULL | — | |
| `email_verification_sent_at` | TIMESTAMPTZ | NULL | — | |
| `password_reset_token` | VARCHAR(255) | NULL | — | indexed |
| `password_reset_expires_at` | TIMESTAMPTZ | NULL | — | |
| `last_login_at` | TIMESTAMPTZ | NULL | — | |
| `last_login_ip` | VARCHAR(45) | NULL | — | IPv4/IPv6 |
| `timezone` | VARCHAR(50) | NOT NULL | `UTC` | |
| `locale` | VARCHAR(10) | NOT NULL | `en` | |
| `created_at` | TIMESTAMPTZ | NOT NULL | `now()` | |
| `updated_at` | TIMESTAMPTZ | NOT NULL | `now()` | |

**Indexes:** `id`, `email`, `organization_id`, `is_active`, `password_reset_token`  
**Unique Constraints:** `email`  
**Foreign Keys:** `organization_id → organizations.id` (RESTRICT)

---

## 3. roles

> Named RBAC roles. System-defined and not editable by end users.

**Migration:** `0001_initial_schema.py`  
**Seeded values:** `admin`, `manager`, `sales_rep`

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` | UUID | NOT NULL | uuid4 | Primary Key |
| `name` | VARCHAR(50) | NOT NULL | — | UNIQUE (admin / manager / sales_rep) |
| `display_name` | VARCHAR(100) | NOT NULL | — | Human-readable label |
| `description` | TEXT | NULL | — | |
| `is_system` | BOOLEAN | NOT NULL | `true` | system-defined, non-deletable |
| `is_active` | BOOLEAN | NOT NULL | `true` | |
| `created_at` | TIMESTAMPTZ | NOT NULL | `now()` | |
| `updated_at` | TIMESTAMPTZ | NOT NULL | `now()` | |

**Indexes:** `id`, `is_active`  
**Unique Constraints:** `name`

---

## 4. permissions

> Atomic permission units. Format: `resource:action` (e.g. `company:create`).

**Migration:** `0001_initial_schema.py`  
**Seeded count:** 33 permissions

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` | UUID | NOT NULL | uuid4 | Primary Key |
| `codename` | VARCHAR(100) | NOT NULL | — | UNIQUE (e.g. `lead:assign`) |
| `name` | VARCHAR(200) | NOT NULL | — | Human label |
| `description` | TEXT | NULL | — | |
| `resource` | VARCHAR(50) | NOT NULL | — | indexed (user, company, lead…) |
| `action` | VARCHAR(50) | NOT NULL | — | indexed (create, read, update…) |
| `is_active` | BOOLEAN | NOT NULL | `true` | |
| `created_at` | TIMESTAMPTZ | NOT NULL | `now()` | |
| `updated_at` | TIMESTAMPTZ | NOT NULL | `now()` | |

**Indexes:** `id`, `resource`, `action`, `is_active`  
**Unique Constraints:** `codename`

---

## 5. role_permissions

> Junction table — assigns permissions to roles (M2M).

**Migration:** `0001_initial_schema.py`

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| `id` | UUID | NOT NULL | Primary Key |
| `role_id` | UUID FK | NOT NULL | → roles (CASCADE) |
| `permission_id` | UUID FK | NOT NULL | → permissions (CASCADE) |

**Indexes:** `role_id`, `permission_id`  
**Unique Constraints:** `(role_id, permission_id)`

---

## 6. user_roles

> Junction table — assigns roles to users (M2M).

**Migration:** `0001_initial_schema.py`

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| `id` | UUID | NOT NULL | Primary Key |
| `user_id` | UUID FK | NOT NULL | → users (CASCADE) |
| `role_id` | UUID FK | NOT NULL | → roles (CASCADE) |
| `assigned_by` | UUID | NULL | UUID of the user who granted the role |
| `assigned_at` | TIMESTAMPTZ | NOT NULL | Timestamp of assignment |

**Indexes:** `user_id`, `role_id`  
**Unique Constraints:** `(user_id, role_id)`

---

## 7. companies

> B2B account records — businesses tracked in the CRM. One organization owns many companies.

**Migration:** `0001_initial_schema.py`

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` | UUID | NOT NULL | uuid4 | Primary Key |
| `name` | VARCHAR(255) | NOT NULL | — | UNIQUE per org |
| `domain` | VARCHAR(255) | NULL | — | indexed |
| `website` | VARCHAR(500) | NULL | — | |
| `description` | TEXT | NULL | — | |
| `email` | VARCHAR(255) | NULL | — | |
| `phone` | VARCHAR(30) | NULL | — | |
| `fax` | VARCHAR(30) | NULL | — | |
| `address` | TEXT | NULL | — | |
| `city` | VARCHAR(100) | NULL | — | |
| `state` | VARCHAR(100) | NULL | — | |
| `country` | VARCHAR(100) | NULL | — | |
| `zip_code` | VARCHAR(20) | NULL | — | |
| `industry` | VARCHAR(100) | NULL | — | |
| `company_type` | VARCHAR(50) | NULL | — | |
| `employee_count` | INTEGER | NULL | — | |
| `annual_revenue` | VARCHAR(50) | NULL | — | |
| `linkedin_url` | VARCHAR(500) | NULL | — | |
| `twitter_url` | VARCHAR(500) | NULL | — | |
| `owner_id` | UUID FK | NULL | — | → users (SET NULL) |
| `organization_id` | UUID FK | NOT NULL | — | → organizations (CASCADE) |
| `created_by` | UUID | NULL | — | user who created |
| `is_active` | BOOLEAN | NOT NULL | `true` | |
| `is_deleted` | BOOLEAN | NOT NULL | `false` | soft delete |
| `created_at` | TIMESTAMPTZ | NOT NULL | `now()` | |
| `updated_at` | TIMESTAMPTZ | NOT NULL | `now()` | |

**Indexes:** `id`, `name`, `domain`, `organization_id`, `owner_id`, `is_active`  
**Unique Constraints:** `(organization_id, name)`  
**Foreign Keys:** `owner_id → users.id` (SET NULL), `organization_id → organizations.id` (CASCADE)

---

## 8. contacts

> Individual people — external customers or prospects. Each contact belongs to one organization and optionally one company.

**Migration:** `0001_initial_schema.py`

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` | UUID | NOT NULL | uuid4 | Primary Key |
| `first_name` | VARCHAR(100) | NOT NULL | — | |
| `last_name` | VARCHAR(100) | NOT NULL | — | |
| `email` | VARCHAR(255) | NOT NULL | — | UNIQUE per org, indexed |
| `phone` | VARCHAR(30) | NULL | — | |
| `mobile` | VARCHAR(30) | NULL | — | |
| `avatar_url` | VARCHAR(500) | NULL | — | |
| `job_title` | VARCHAR(100) | NULL | — | |
| `department` | VARCHAR(100) | NULL | — | |
| `linkedin_url` | VARCHAR(500) | NULL | — | |
| `twitter_url` | VARCHAR(500) | NULL | — | |
| `address` | TEXT | NULL | — | |
| `city` | VARCHAR(100) | NULL | — | |
| `country` | VARCHAR(100) | NULL | — | |
| `notes` | TEXT | NULL | — | |
| `owner_id` | UUID FK | NULL | — | → users (SET NULL) |
| `organization_id` | UUID FK | NOT NULL | — | → organizations (CASCADE) |
| `company_id` | UUID FK | NULL | — | → companies (SET NULL) |
| `created_by` | UUID | NULL | — | |
| `is_active` | BOOLEAN | NOT NULL | `true` | |
| `is_deleted` | BOOLEAN | NOT NULL | `false` | soft delete |
| `created_at` | TIMESTAMPTZ | NOT NULL | `now()` | |
| `updated_at` | TIMESTAMPTZ | NOT NULL | `now()` | |

**Indexes:** `id`, `email`, `organization_id`, `company_id`, `owner_id`, `is_active`  
**Unique Constraints:** `(organization_id, email)`  
**Foreign Keys:** `organization_id → organizations.id` (CASCADE), `company_id → companies.id` (SET NULL), `owner_id → users.id` (SET NULL)

---

## 9. leads

> Early-stage sales opportunities. Tracks a potential deal from first contact through qualification.

**Migration:** `0001_initial_schema.py`

**Lead Statuses (FSM):**
```
new → contacted → qualified → proposal_sent → negotiation → won
                                                          → lost
```

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` | UUID | NOT NULL | uuid4 | Primary Key |
| `title` | VARCHAR(255) | NOT NULL | — | |
| `description` | TEXT | NULL | — | |
| `status` | VARCHAR(50) | NOT NULL | `new` | indexed — see FSM above |
| `source` | VARCHAR(50) | NULL | — | indexed (website, referral, cold_call…) |
| `interest` | VARCHAR(100) | NULL | — | product/service of interest |
| `estimated_value` | NUMERIC(15,2) | NULL | — | |
| `currency` | VARCHAR(3) | NOT NULL | `USD` | ISO 4217 |
| `score` | INTEGER | NULL | — | AI lead score (populated by AI module) |
| `notes` | TEXT | NULL | — | |
| `close_reason` | TEXT | NULL | — | reason when won/lost |
| `owner_id` | UUID FK | NULL | — | → users (SET NULL) |
| `organization_id` | UUID FK | NOT NULL | — | → organizations (CASCADE) |
| `company_id` | UUID FK | NULL | — | → companies (SET NULL) |
| `contact_id` | UUID FK | NULL | — | → contacts (SET NULL) |
| `created_by` | UUID | NULL | — | |
| `is_active` | BOOLEAN | NOT NULL | `true` | |
| `is_deleted` | BOOLEAN | NOT NULL | `false` | soft delete |
| `created_at` | TIMESTAMPTZ | NOT NULL | `now()` | |
| `updated_at` | TIMESTAMPTZ | NOT NULL | `now()` | |

**Indexes:** `id`, `status`, `source`, `organization_id`, `company_id`, `contact_id`, `owner_id`, `is_active`  
**Foreign Keys:** `organization_id` (CASCADE), `company_id` (SET NULL), `contact_id` (SET NULL), `owner_id` (SET NULL)

---

## 10. deals

> Qualified sales opportunities — converted from leads or created directly. Managed on the Kanban pipeline board.

**Migration:** `0002_deals_and_activities.py`

**Deal Stages (FSM):**
```
new → qualified → proposal → negotiation → won
                                         → lost
```

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` | UUID | NOT NULL | uuid4 | Primary Key |
| `title` | VARCHAR(255) | NOT NULL | — | indexed |
| `description` | TEXT | NULL | — | |
| `stage` | VARCHAR(50) | NOT NULL | `new` | indexed — see FSM above |
| `priority` | VARCHAR(20) | NOT NULL | `medium` | low / medium / high |
| `amount` | NUMERIC(15,2) | NULL | — | expected deal value |
| `currency` | VARCHAR(3) | NOT NULL | `USD` | ISO 4217 |
| `probability` | INTEGER | NULL | — | win probability 0–100 |
| `expected_close_date` | DATE | NULL | — | target close date |
| `closed_at` | TIMESTAMPTZ | NULL | — | actual close timestamp |
| `close_reason` | TEXT | NULL | — | |
| `notes` | TEXT | NULL | — | |
| `organization_id` | UUID FK | NOT NULL | — | → organizations (CASCADE) |
| `lead_id` | UUID FK | NULL | — | → leads (SET NULL) — nullable (direct entry allowed) |
| `contact_id` | UUID FK | NULL | — | → contacts (SET NULL) |
| `company_id` | UUID FK | NULL | — | → companies (SET NULL) |
| `owner_id` | UUID FK | NULL | — | → users (SET NULL) |
| `created_by` | UUID | NULL | — | |
| `is_active` | BOOLEAN | NOT NULL | `true` | |
| `is_deleted` | BOOLEAN | NOT NULL | `false` | soft delete |
| `created_at` | TIMESTAMPTZ | NOT NULL | `now()` | |
| `updated_at` | TIMESTAMPTZ | NOT NULL | `now()` | |

**Indexes:** `id`, `title`, `stage`, `organization_id`, `lead_id`, `contact_id`, `company_id`, `owner_id`, `is_active`  
**Foreign Keys:** `organization_id` (CASCADE), `lead_id` (SET NULL), `contact_id` (SET NULL), `company_id` (SET NULL), `owner_id` (SET NULL)

---

## 11. activities

> Immutable event timeline — every significant action in the CRM is recorded here. Powers the activity feed on Contact, Lead, and Deal detail pages. Also consumed by the AI scoring and summarization modules.

**Migration:** `0002_deals_and_activities.py`

**Activity Types:**

| Category | Types |
|----------|-------|
| Manual | `call`, `email`, `meeting`, `note`, `task` |
| System | `status_change`, `deal_created`, `lead_converted`, `assigned` |
| AI | `ai_score_update`, `ai_recommendation`, `ai_summary` |

**Entity Types (polymorphic link):**  
`lead` | `deal` | `contact` | `company`

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` | UUID | NOT NULL | uuid4 | Primary Key |
| `activity_type` | VARCHAR(50) | NOT NULL | — | indexed — see types above |
| `title` | VARCHAR(255) | NOT NULL | — | short summary for timeline card |
| `description` | TEXT | NULL | — | full details, call notes, email body |
| `entity_type` | VARCHAR(50) | NOT NULL | — | indexed — polymorphic target type |
| `entity_id` | UUID | NOT NULL | — | indexed — polymorphic target UUID |
| `lead_id` | UUID FK | NULL | — | → leads (SET NULL) — indexed shortcut |
| `deal_id` | UUID FK | NULL | — | → deals (SET NULL) — indexed shortcut |
| `contact_id` | UUID FK | NULL | — | → contacts (SET NULL) — indexed shortcut |
| `company_id` | UUID FK | NULL | — | → companies (SET NULL) — indexed shortcut |
| `performed_by_id` | UUID FK | NULL | — | → users (SET NULL) — null = system/AI |
| `scheduled_at` | TIMESTAMPTZ | NULL | — | for future tasks/meetings |
| `completed_at` | TIMESTAMPTZ | NULL | — | |
| `metadata_json` | TEXT | NULL | — | JSON blob: AI scores, email IDs, call duration |
| `organization_id` | UUID FK | NOT NULL | — | → organizations (CASCADE) |
| `created_by` | UUID | NULL | — | |
| `is_active` | BOOLEAN | NOT NULL | `true` | |
| `created_at` | TIMESTAMPTZ | NOT NULL | `now()` | |
| `updated_at` | TIMESTAMPTZ | NOT NULL | `now()` | |

**Indexes:**
- `id`, `activity_type`, `entity_type`, `entity_id`
- `organization_id`, `lead_id`, `deal_id`, `contact_id`, `company_id`, `performed_by_id`, `is_active`
- **Composite:** `(entity_type, entity_id)` — fast timeline fetch per entity
- **Composite:** `(organization_id, created_at)` — org-wide timeline sorted by time

**Foreign Keys:** `organization_id` (CASCADE), `lead_id` (SET NULL), `deal_id` (SET NULL), `contact_id` (SET NULL), `company_id` (SET NULL), `performed_by_id` (SET NULL)

---

## RBAC Permission Map

33 permissions across 3 roles.

| Permission Codename | Admin | Manager | Sales Rep |
|---------------------|-------|---------|-----------|
| `user:create` | ✅ | ✅ | ❌ |
| `user:read` | ✅ | ✅ | ✅ |
| `user:update` | ✅ | ✅ | ❌ |
| `user:delete` | ✅ | ❌ | ❌ |
| `user:manage_roles` | ✅ | ❌ | ❌ |
| `user:activate` | ✅ | ✅ | ❌ |
| `user:deactivate` | ✅ | ✅ | ❌ |
| `org:create` | ✅ | ❌ | ❌ |
| `org:read` | ✅ | ✅ | ❌ |
| `org:update` | ✅ | ✅ | ❌ |
| `org:delete` | ✅ | ❌ | ❌ |
| `company:create` | ✅ | ✅ | ✅ |
| `company:read` | ✅ | ✅ | ✅ |
| `company:update` | ✅ | ✅ | ✅ |
| `company:delete` | ✅ | ✅ | ❌ |
| `contact:create` | ✅ | ✅ | ✅ |
| `contact:read` | ✅ | ✅ | ✅ |
| `contact:update` | ✅ | ✅ | ✅ |
| `contact:delete` | ✅ | ✅ | ❌ |
| `lead:create` | ✅ | ✅ | ✅ |
| `lead:read` | ✅ | ✅ | ✅ |
| `lead:update` | ✅ | ✅ | ✅ |
| `lead:delete` | ✅ | ✅ | ❌ |
| `lead:assign` | ✅ | ✅ | ❌ |
| `lead:convert` | ✅ | ✅ | ✅ |
| `deal:create` | ✅ | ✅ | ✅ |
| `deal:read` | ✅ | ✅ | ✅ |
| `deal:update` | ✅ | ✅ | ✅ |
| `deal:delete` | ✅ | ✅ | ❌ |
| `deal:assign` | ✅ | ✅ | ❌ |
| `deal:change_stage` | ✅ | ✅ | ✅ |
| `activity:create` | ✅ | ✅ | ✅ |
| `activity:read` | ✅ | ✅ | ✅ |
| `activity:delete` | ✅ | ✅ | ❌ |
| `report:view` | ✅ | ✅ | ✅ |
| `report:export` | ✅ | ✅ | ❌ |
| `system:admin` | ✅ | ❌ | ❌ |

---

## Migration History

| File | Revision | Tables Created | Description |
|------|----------|---------------|-------------|
| `0001_initial_schema.py` | `0001` | organizations, roles, permissions, role_permissions, users, user_roles, companies, contacts, leads | Customer & Identity Domain — full BE1 scope |
| `0002_deals_and_activities.py` | `0002` | deals, activities | Sales Pipeline & Activity Timeline — BE2 scope |

**Run migrations:**
```cmd
cd C:\Users\kiran\OneDrive\Documents\Desktop\PULSE-CRM\backend
.venv\Scripts\activate
alembic upgrade head
```

**Rollback:**
```cmd
alembic downgrade base
```

---

## Seeded Data

After running `python -m scripts.seed`:

| Entity | Count | Details |
|--------|-------|---------|
| Permissions | 33 | All permission codenames |
| Roles | 3 | admin, manager, sales_rep |
| Organization | 1 | KALNET Demo Organization |
| Users | 4 | 1 admin + 1 manager + 2 sales reps |
| Companies | 5 | Sample B2B accounts |
| Contacts | 5 | Sample contacts linked to companies |
| Leads | ~5 | Sample leads in various statuses |

**Test Credentials:**

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@kalnet-pulse.com | Admin@123456 |
| Manager | sarah.johnson@kalnet-demo.com | Demo@123456 |
| Sales Rep | mike.chen@kalnet-demo.com | Demo@123456 |
| Sales Rep | priya.sharma@kalnet-demo.com | Demo@123456 |

---

*Document generated from KALNET PULSE CRM backend source — July 2026*
