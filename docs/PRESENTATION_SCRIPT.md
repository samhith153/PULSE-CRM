# KALNET PULSE CRM — Complete 25-Minute Presentation Script

> **Project:** KALNET PULSE — Enterprise Sales & Marketing CRM  
> **Team:** Manoj, Sathwika, Kiran, Samhith, Bhavani, Aswitha, Om, Ajith  
> **Duration:** 25 minutes  
> **Audience:** Professors, Mentors, Technical Reviewers

---

## 1. EXECUTIVE SUMMARY

KALNET PULSE CRM is an enterprise-grade Customer Relationship Management system built with **FastAPI** (backend), **Next.js** (frontend), and **PostgreSQL** (database). It features **AI-powered lead scoring**, a **rule-based recommendation engine**, **AI conversation summarization** via Groq/Llama 3.3, and **Gmail OAuth2 integration**. The system supports **multi-tenancy**, **RBAC with 33 granular permissions**, and an **FSM-based pipeline** for deal management. The project consists of 11 database tables, 40+ REST API endpoints, and 89 passing tests.

**Current Status:** Core CRM functionality is complete and operational. AI modules are rule-based (Phase 1), with ML-based enhancements planned for Phase 2.

---

## 2. PROJECT ANALYSIS

### 2.1 Overall Project Objective
Build a production-grade, AI-augmented CRM that helps sales teams manage leads, track deals through a pipeline, score opportunities transparently, and close more deals — all with a clean, modern interface.

### 2.2 Problem Statement
Traditional CRMs are either:
- **Too complex** (Salesforce — requires admin teams)
- **Too simple** (spreadsheets — no AI, no pipeline)
- **Black-box AI** (scores without explanation, reducing trust)

Sales teams need a **transparent, AI-powered CRM** where every score and recommendation is explainable, and where the pipeline follows a clear, auditable flow.

### 2.3 Existing Problems in the Market
- Opaque lead scoring algorithms
- No built-in conversation intelligence
- Complex setup and configuration
- Expensive per-seat pricing
- Poor API design and documentation

### 2.4 Proposed Solution — KALNET PULSE CRM
- **Transparent AI:** Every score is backed by human-readable reasons (e.g., "High deal value + email engagement")
- **Rule-based recommendation engine:** No black box — every action is explained by contributing factors
- **AI conversation summarization:** Groq/Llama 3.3 analyzes email threads, extracts intent, sentiment, and key points
- **FSM pipeline:** Finite state machine ensures deals move through auditable stages
- **Multi-tenant RBAC:** 3 roles, 33 permissions, organization-scoped data isolation
- **RESTful API:** 40+ endpoints with Swagger/ReDoc documentation

---

## 3. SYSTEM ARCHITECTURE

### Simple Version

```
User Browser (Next.js)
    │
    ▼
REST API (FastAPI) ────► PostgreSQL
    │
    ▼
AI Services (Rule-based + Groq/Llama)
    │
    ▼
External Integrations (Gmail, Brevo)
```

### Technical Version

```
Frontend (Next.js 16 + React 19)
    │  HTTP/HTTPS (JSON)
    ▼
CORS Middleware ← GZip Middleware ← Rate Limit ← Request ID
    │
    ▼
API Router (/api/v1)
    │
    ├── Auth Router — JWT tokens, bcrypt, refresh
    ├── Leads Router — CRUD + convert + score
    ├── Deals Router — CRUD + stage transitions
    ├── Pipeline Router — FSM stage management
    ├── Companies Router — CRUD + search
    ├── Contacts Router — CRUD + search
    ├── Gmail Router — OAuth2, sync, send
    ├── AI Router — scoring, recommendations, summarization
    ├── Dashboard Router — Admin/Manager/Rep KPIs
    ├── Webhooks Router — event-driven delivery
    ├── Events Router — event outbox pattern
    ├── Uploads Router — file upload
    ├── Brevo Router — email marketing
    └── Notifications Router — in-app notifications
    │
    ▼
Service Layer (Business Logic)
    │
    ├── AuthService — registration, login, password reset
    ├── LeadService — CRUD, conversion, scoring
    ├── DealService — CRUD, pipeline transitions
    ├── RecommendationEngineService — enhanced recommendations
    ├── TimelineEngineService — activity feed
    ├── AiProviders — scoring, recommendation, summarization providers
    ├── BrevoService — email marketing integration
    ├── EventBus — event-driven architecture
    └── EventWorker — background event processing
    │
    ▼
Repository Layer (Data Access)
    │
    ├── LeadRepository, DealRepository, CompanyRepository
    ├── ContactRepository, UserRepository, OrganizationRepository
    ├── EmailRepository, ActivityRepository, PipelineRepository
    ├── AIScoreRepository, AIRecommendationRepository
    └── EventRepository, NotificationRepository
    │
    ▼
Database (PostgreSQL 16 — 11 tables, async via asyncpg)
    │
    ▼
AI Services (Rule-based scoring + Groq/Llama 3.3 summarization)
    │
    ▼
External Integrations (Gmail API, Brevo SMTP, Webhooks)
```

### Request Lifecycle

```
1. User clicks "Save Lead" in Next.js UI
2. Frontend → POST /api/v1/leads (with JWT in Authorization header)
3. RateLimitMiddleware checks request frequency
4. RequestIDMiddleware adds correlation ID
5. RequestLoggingMiddleware logs the request
6. API Router matches to leads router
7. Dependency: CurrentUser extracted from JWT
8. Dependency: DBSession (async SQLAlchemy session)
9. Router calls LeadService.create_lead()
10. Service validates data → calls LeadRepository.create()
11. Repository executes async INSERT via SQLAlchemy 2.0
12. Service logs activity via ActivityTimelineRepository
13. Service triggers event via EventBus (outbox pattern)
14. Response flows back through middleware chain
15. Frontend updates UI with returned data
```

---

## 4. DATABASE ANALYSIS

### 4.1 Entity Relationship Diagram

```
organizations
    ├── users (1 org → many users)
    │   └── user_roles (users ↔ roles M2M)
    ├── companies (1 org → many companies)
    │   ├── contacts (1 company → many contacts)
    │   ├── leads (1 company → many leads)
    │   └── deals (1 company → many deals)
    ├── contacts (1 org → many contacts)
    │   ├── leads (1 contact → many leads)
    │   └── deals (1 contact → many deals)
    ├── leads (1 org → many leads)
    │   ├── deals (1 lead → 0-1 deal, unique constraint)
    │   ├── lead_scores (1 lead → 1 score)
    │   ├── feature_vectors (1 lead → 1 vector)
    │   └── recommendation_features (1 lead → many features)
    ├── deals (1 org → many deals)
    │   └── pipeline_stages (FK to stages)
    ├── pipeline_stages (1 org → many stages)
    ├── roles (system-defined)
    │   ├── role_permissions (roles ↔ permissions M2M)
    │   └── user_roles (users ↔ roles M2M)
    ├── permissions (atomic resource:action units)
    ├── activity_timeline_events (polymorphic audit log)
    ├── emails (Gmail-synced messages)
    ├── email_summaries (AI-generated summaries)
    ├── gmail_connections (OAuth2 connection per user)
    ├── ai_scores (AI-generated scores)
    ├── ai_recommendations (AI-generated recommendations)
    ├── ai_conversation_summaries (AI conversation summaries)
    ├── calendar_events
    ├── documents (file uploads)
    ├── notifications (in-app notifications)
    ├── webhook_endpoints / webhook_deliveries
    └── event_outbox (outbox pattern for events)
```

### 4.2 Key Tables

**organizations** — Root multi-tenant entity. Contains `plan` (free/pro/enterprise), `max_users` seat limit, and `is_deleted` soft delete. Backend APIs: Auth endpoints (register creates org), Admin dashboard.

**users** — CRM operators. Contains `hashed_password` (bcrypt), `email_verification_token`, `password_reset_token`, `last_login_at`, `last_login_ip`, `timezone`, `locale`. Multi-tenant via `organization_id` FK (RESTRICT). Backend APIs: `/auth/*`, `/users/*`.

**roles** — System-defined RBAC roles: `admin`, `manager`, `sales_rep`. Seeded with `is_system=true`. Backend APIs: `/roles/*`.

**permissions** — 33 atomic permissions in `resource:action` format (e.g., `lead:create`, `deal:change_stage`). Backend APIs: `/roles/permissions/*`.

**companies** — B2B accounts. Unique `(organization_id, name)` constraint. `company_type` enum (prospect/customer/partner/competitor/vendor). Backend APIs: `/companies/*`.

**contacts** — Individual people. Unique `(organization_id, email)` constraint. `full_name` computed property. Backend APIs: `/contacts/*`.

**leads** — Sales opportunities. Status FSM: `new → contacted → qualified → proposal_sent → negotiation → won/lost/converted`. Has `estimated_value`, `source`, `interest`, `industry`. Backend APIs: `/leads/*`.

**deals** — Qualified opportunities. Linked to leads via `lead_id` (unique constraint ensures 1:1). Stage FSM: `new → qualified → proposal → negotiation → won/lost`. Has `amount`, `probability`, `expected_close_date`. Backend APIs: `/deals/*`, `/pipeline/*`.

**pipeline_stages** — Configurable deal stages per org. Fields: `name`, `slug`, `color`, `sort_order`, `probability`, `is_default`. Backend APIs: `/pipeline/stages/*`.

**activity_timeline_events** — Immutable audit log. Polymorphic: `entity_type` + `entity_id` composites. Tracks all CRM actions. Backend APIs: `/activities/*`, `/timeline/*`.

**ai_scores** — Generated scores. `entity_type` (lead/deal), `score` (0-100), `confidence`, `provider`, `explanation` (JSON array of human-readable reasons). Backend APIs: `/ai/*`, `/lead-scores/*`.

**ai_recommendations** — Generated recommendations. `entity_type`, `entity_id`, `recommendation` (text), `reasoning`, `priority`, `provider`. Backend APIs: `/ai/*`.

**emails** — Gmail-synced messages. `direction` (inbound/outbound), `thread_id`, `gmail_message_id`, `is_read`, `email_open_count`, `attachment_metadata`. Backend APIs: `/emails/*`, `/gmail/*`.

### 4.3 Design Principles

| Principle | Implementation |
|-----------|---------------|
| UUID Primary Keys | All tables use UUID, no integer sequences |
| Audit Timestamps | `created_at`, `updated_at` (TIMESTAMPTZ) on every table |
| Soft Delete | `is_deleted = false` — no hard deletes on domain tables |
| Multi-Tenancy | All domain tables have `organization_id` FK |
| Active Flag | `is_active` column for quick enable/disable |
| FK Behavior | CASCADE for ownership, SET NULL for optional links, RESTRICT for critical deps |
| Indexes | All FKs and frequently filtered columns are indexed |
| Constraints | Unique constraints prevent duplicates within org scope |

---

## 5. BACKEND ANALYSIS

### 5.1 Technology Stack

- **Framework:** FastAPI 0.104.1 (async, automatic OpenAPI docs)
- **ORM:** SQLAlchemy 2.0 (async via asyncpg)
- **Migration:** Alembic (8 migration versions)
- **Auth:** python-jose (JWT), passlib (bcrypt)
- **Validation:** Pydantic 2.5
- **AI/LLM:** Groq SDK, LangChain, Google Generative AI
- **Email:** Google API client (Gmail), Brevo API
- **Background Tasks:** APScheduler (feature recompute every 5min, event outbox every 15s)
- **Testing:** pytest 7.4, pytest-asyncio, pytest-cov
- **Logging:** structlog (JSON format)
- **Caching:** Redis (configured)
- **Rate Limiting:** In-memory sliding window (60 req/min, burst 10)

### 5.2 Folder Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                    # FastAPI app factory, lifespan, middleware
│   ├── api/
│   │   ├── deps.py                # Dependencies (CurrentUser, DBSession)
│   │   └── v1/
│   │       ├── router.py          # Aggregates all routers
│   │       ├── auth.py            # JWT auth endpoints
│   │       ├── ai.py              # AI scoring, recommendations
│   │       ├── ai_insights.py     # AI insights
│   │       ├── activities.py      # Activity timeline
│   │       ├── brevo.py           # Brevo email marketing
│   │       ├── calendar.py        # Calendar events
│   │       ├── companies.py       # Companies CRUD
│   │       ├── contacts.py        # Contacts CRUD
│   │       ├── dashboard.py       # Admin/Manager/Rep dashboards
│   │       ├── deals.py           # Deals CRUD
│   │       ├── documents.py       # Document uploads
│   │       ├── emails.py          # Email listing
│   │       ├── events.py          # Event outbox
│   │       ├── feature_vectors.py # Feature vectors
│   │       ├── gmail.py           # Gmail OAuth2 + sync
│   │       ├── health.py          # Health check
│   │       ├── leads.py           # Leads CRUD + convert
│   │       ├── lead_scores.py     # Lead scores
│   │       ├── notifications.py   # In-app notifications
│   │       ├── organizations.py   # Org management
│   │       ├── pipeline.py        # Pipeline stage transitions
│   │       ├── recommendation_features.py
│   │       ├── roles.py           # RBAC role management
│   │       ├── smtp.py            # SMTP configuration
│   │       ├── summarization.py   # AI conversation summarization
│   │       ├── timeline.py        # Entity timeline
│   │       ├── uploads.py         # File uploads
│   │       ├── users.py           # User management
│   │       └── webhooks.py        # Webhook endpoints
│   ├── controllers/               # Business logic layer (under development)
│   ├── core/
│   │   ├── config.py              # Pydantic Settings (60+ env vars)
│   │   ├── exceptions.py          # Custom exceptions
│   │   ├── logging.py             # structlog setup
│   │   └── permissions.py         # Permission resolution
│   ├── database/
│   │   ├── __init__.py
│   │   ├── base.py                # Declarative Base + AuditMixin + TenantMixin
│   │   └── session.py             # Async session factory
│   ├── middlewares/
│   │   ├── exception_handler.py   # Global exception handlers
│   │   ├── logging.py             # Request logging
│   │   ├── private_network.py     # Private network access
│   │   ├── rate_limit.py          # Sliding window rate limiter
│   │   └── request_id.py          # Correlation ID
│   ├── models/                    # 20+ SQLAlchemy models
│   │   ├── __init__.py            # Import all models for Alembic
│   │   ├── activity.py            # ActivityTimeline
│   │   ├── ai.py                  # AIScore, AIRecommendation, AIConversationSummary
│   │   ├── ai_summary.py          # AISummary
│   │   ├── calendar_event.py
│   │   ├── company.py             # Company
│   │   ├── contact.py             # Contact
│   │   ├── deal.py                # Deal
│   │   ├── document.py            # Document
│   │   ├── email.py               # Email, GmailConnection
│   │   ├── email_summary.py       # EmailSummary
│   │   ├── event_outbox.py        # EventOutbox
│   │   ├── feature_vector.py      # FeatureVector
│   │   ├── lead.py                # Lead
│   │   ├── lead_score.py          # LeadScore
│   │   ├── notification.py        # Notification
│   │   ├── organization.py        # Organization
│   │   ├── pipeline.py            # PipelineStage
│   │   ├── recommendation_feature.py
│   │   ├── role.py                # Role, Permission, RolePermission
│   │   ├── user.py                # User, UserRole
│   │   └── webhook.py             # WebhookEndpoint, WebhookDelivery
│   ├── repositories/             # Data access layer (repository pattern)
│   │   ├── activity_repository.py
│   │   ├── ai_repository.py
│   │   ├── company_repository.py
│   │   ├── contact_repository.py
│   │   ├── deal_repository.py
│   │   ├── email_repository.py
│   │   ├── event_repository.py
│   │   ├── lead_repository.py
│   │   ├── organization_repository.py
│   │   ├── pipeline_repository.py
│   │   └── user_repository.py
│   ├── schemas/                   # Pydantic schemas for request/response
│   │   ├── ai.py                  # AI schemas
│   │   ├── auth.py                # Auth schemas
│   │   ├── common.py              # StandardResponse, pagination
│   │   ├── email.py               # Email schemas
│   │   └── ... (domain schemas)
│   ├── services/                  # Business logic layer
│   │   ├── ai_providers.py        # Scoring, recommendation, summarization providers
│   │   ├── auth_service.py        # Auth logic
│   │   ├── brevo_service.py       # Brevo integration
│   │   ├── event_bus.py           # Event-driven architecture
│   │   ├── event_worker.py        # Background event processing
│   │   ├── recommendation_engine_service.py
│   │   ├── timeline_engine_service.py
│   │   └── upload_service.py
│   ├── templates/                 # Email templates
│   └── utils/
│       └── enums.py               # 12+ string enums
├── migrations/ (Alembic)
├── tests/ (pytest suite)
├── Dockerfile
└── requirements.txt
```

### 5.3 Key API Endpoints

**Authentication:**
- `POST /api/v1/auth/register` — Register new org + admin user, returns JWT tokens
- `POST /api/v1/auth/login` — Login with email + password, returns JWT tokens
- `POST /api/v1/auth/refresh` — Refresh expired access token
- `POST /api/v1/auth/forgot-password` — Request password reset email
- `POST /api/v1/auth/reset-password` — Reset password with token
- `POST /api/v1/auth/change-password` — Change own password (authenticated)
- `GET /api/v1/auth/me` — Get current user profile with permissions

**Leads:**
- `GET /api/v1/leads` — List leads (paginated, filterable)
- `POST /api/v1/leads` — Create lead
- `GET /api/v1/leads/{id}` — Get lead detail
- `PUT /api/v1/leads/{id}` — Update lead
- `DELETE /api/v1/leads/{id}` — Soft delete lead
- `POST /api/v1/leads/{id}/convert` — Convert lead to deal

**Deals:**
- `GET /api/v1/deals` — List deals
- `POST /api/v1/deals` — Create deal
- `GET /api/v1/deals/{id}` — Get deal detail
- `PUT /api/v1/deals/{id}` — Update deal
- `DELETE /api/v1/deals/{id}` — Soft delete deal

**Pipeline:**
- `GET /api/v1/pipeline/stages` — List pipeline stages
- `PATCH /api/v1/pipeline/move` — Move deal to different stage

**Dashboard:**
- `GET /api/v1/dashboard/admin` — Admin-level KPIs (orgs, users, revenue, top reps)
- `GET /api/v1/dashboard/manager` — Manager-level KPIs (team revenue, forecast, pipeline health)
- `GET /api/v1/dashboard/sales-rep` — Sales rep KPIs (personal revenue, win rate, deals by stage)
- `GET /api/v1/dashboard/manager/forecast` — Manager forecast with pipeline coverage

**AI:**
- `POST /api/v1/ai/score/{entity_type}/{entity_id}` — Score a lead or deal
- `POST /api/v1/ai/recommend/{entity_type}/{entity_id}` — Generate recommendations
- `POST /api/v1/ai/summarize` — Summarize conversation
- `GET /api/v1/lead-scores/{lead_id}` — Get lead score
- `GET /api/v1/recommendation-features/{lead_id}` — Get recommendation features

**Gmail:**
- `GET /api/v1/gmail/oauth/login` — Start Gmail OAuth2 flow
- `POST /api/v1/gmail/oauth/callback` — Complete OAuth2 callback
- `GET /api/v1/gmail/connections` — List Gmail connections
- `POST /api/v1/gmail/connections/{id}/sync` — Sync emails
- `POST /api/v1/gmail/send` — Send email via Gmail

**Companies/Contacts:**
- CRUD endpoints with pagination, search, filtering
- `GET /api/v1/companies` — List companies (with contact count, deal count)
- `GET /api/v1/contacts` — List contacts (filterable by company)

---

## 6. FRONTEND ANALYSIS

### 6.1 Technology Stack

- **Framework:** Next.js 16 (App Router), React 19
- **Styling:** Tailwind CSS 4, Framer Motion 12
- **Icons:** Lucide React 1.23
- **Language:** TypeScript 5
- **Testing:** Playwright (E2E)
- **Linting:** ESLint 9

### 6.2 Pages & Components

**Landing Page (`PulseLandingPage.tsx`):**
- Hero section with animated dashboard mockup
- Features grid (6 cards: Live Dashboard, AI Lead Scoring, FSM Deal Pipeline, Gmail Intelligence, Revenue Analytics, Enterprise Security)
- How It Works section (3 steps: Connect → AI Works for You → Close)
- Platform orbit diagram with 6 interactive nodes
- Testimonials (3 customer stories)
- Trust badges (JWT+RBAC, REST API, Async FastAPI, Groq/Llama)
- Dark footer with newsletter signup
- Auth modal integration

**Auth Modal (`AuthModal.tsx`):**
- Sign-in / Sign-up toggle
- Registration: name, company, email, password
- Login: email, password
- JWT token management (sessionStorage)
- Role detection from API response
- Google Sign-In placeholder (coming soon)

**Dashboard Views:**
- Admin dashboard (org-wide KPIs)
- Manager dashboard (team performance)
- Sales rep dashboard (personal metrics)
- Pipeline view (Kanban-style)
- Email inbox (Gmail-synced)
- Leads, Contacts, Companies CRUD pages
- Integrations view

**Reusable Components:**
- `Navbar` — Navigation with auth state
- `AuthModal` — Authentication modal
- Various card components, charts, tables

### 6.3 State Management & API Layer

- **API Layer** (`utils/api.ts`): Centralized API client with:
  - JWT token management (sessionStorage)
  - Auth headers injection
  - Error handling with user-friendly messages
  - TypeScript interfaces for all entities
  - Pagination support
  - Dashboard KPI types (Admin, Manager, SalesRep)
  - Gmail sync, summarization, notification APIs
  - Document upload/download APIs

- **State:** Session-based (sessionStorage for auth tokens, localStorage for role/user)
- **Routing:** Next.js App Router (file-based routing)

### 6.4 UI Flow

```
Landing Page (PulseLandingPage)
    │
    ▼
Auth Modal (Sign Up / Sign In)
    │
    ▼
Dashboard (role-scoped: Admin/Manager/Rep)
    │
    ├── Companies ──► Create, Edit, Delete, View
    ├── Contacts ──► Create, Edit, Delete, View
    ├── Leads ──► Create, Edit, Convert to Deal, Score
    ├── Deals ──► Create, Edit, Stage Transition
    ├── Pipeline ──► Kanban-style stage management
    ├── Emails ──► Gmail sync, read, send
    ├── AI Modules ──► Scores, Recommendations, Summaries
    ├── Reports ──► Dashboard KPIs
    └── Integrations ──► Gmail, Brevo, Webhooks
```

---

## 7. AI MODULES ANALYSIS

### 7.1 Lead Scoring Engine (Samhith — Rule-based, NOT ML)

**Location:** `ai/scoring/`

**Architecture:**
```
scoring_service.py (entry point)
    ├── fit_engine.py — calculates fit score (0-100)
    ├── engagement_engine.py — calculates engagement score (0-100)
    ├── overall_engine.py — combines fit + engagement into overall score + tier
    ├── reason_generator.py — generates human-readable explanations
    └── weights.py — weight configuration for fit and engagement factors
```

**Fit Score Components (weights from `weights.py`):**
- `company_size` (15%) — Employee count, revenue
- `industry_complexity` (25%) — Industry vertical
- `software_gap` (30%) — Whether they use a CRM already
- `operational_system_fit` (20%) — Tech stack compatibility
- `customization_potential` (10%) — Customization needs

**Engagement Score Components (weights from `weights.py`):**
- `intent_category` (35%) — AI-detected intent from email analysis
- `buying_stage` (25%) — Where they are in the buying journey
- `response_time` (15%) — How quickly they respond
- `engagement_trend` (15%) — Direction of engagement over time
- `customer_initiative` (10%) — Who drives the conversation

**Overall Score:**
```
fit_score * 0.6 + engagement_score * 0.4 → overall_score
```
Tier thresholds: Critical (90+), High (75-89), Medium (50-74), Low (<50)

**Key Feature: Transparency**
Every score includes `top_reasons` — the 3 most influential factors, extracted from actual business data, not score comparisons.

### 7.2 Recommendation Engine (Om — Rule-based, NOT ML)

**Location:** `ai/recommendation/`

**Architecture:**
```
engine.py (entry point)
    ├── rules.py — ActionRule definitions + stage-based filtering
    └── models.py — LeadFeatures, RecommendationResult, RecommendationResponse
```

**Candidate Actions (from `rules.py`):**
1. **Send follow-up** — For Contacted/Qualified stages, weighted by urgency + lack of reply
2. **Schedule demo** — For Qualified/Demo Scheduled stages, weighted by score + freshness
3. **Send proposal** — For Demo Scheduled/Negotiation stages, weighted by score + engagement
4. **Mark as stale** — For Contacted/Qualified/Demo Scheduled, weighted by urgency + low score
5. **Escalate to manager** — For Negotiation stage, weighted by score + urgency

**Weight Formula:**
```
weight(action) = w_s * score_norm + w_u * urgency + w_r * reply_factor
              + w_dv * deal_value_norm + w_eo * email_open_norm
              + w_mt * meeting_factor + w_rw * rep_workload_norm
              + w_ct * contact_time_factor
```

**New Features (6 enhanced features from `recommendation_engine_service.py`):**
1. `deal_value` — Normalized up to $500k
2. `email_open_count` — Up to 10 opens = max engagement
3. `email_opened_no_reply_flag` — Detects interested-but-stuck leads
4. `meeting_attendance_status` — ATTENDED/NO_SHOW/RESCHEDULED
5. `rep_active_action_count` — Inverse workload consideration
6. `best_contact_time_slot` — Optimal time analysis from historical data

**Transparency:** Every recommendation includes a `reason` derived from the single highest-contributing factor. No black-box decisions.

### 7.3 AI Conversation Summarization (Bhavani — Groq/Llama 3.3)

**Location:** `ai/summarization/`

**Architecture:**
```
agent.py (entry point)
    ├── config.py — Groq API configuration, model selection
    ├── models.py — SummariseResponse dataclass
    └── database.py — Database operations for storing summaries
```

**LLM Integration:**
- **Provider:** Groq (Llama 3.3 70B)
- **Prompt:** 11-task structured prompt covering:
  1. One-sentence summary
  2. Summary word (for lead scoring — 18 categories)
  3. Sentiment analysis (positive/neutral/negative)
  4. Intent detection (demo/buy/negotiate/followup/decline/other)
  5. Confidence score (0.0-1.0)
  6. Key points extraction (2-5 points)
  7. Action items extraction
  8. Email category classification (sales/support/general/urgent)
  9. Draft reply generation
  10. Follow-up suggestion with timing
  11. Follow-up timing selection

**Output:** Returns `SummariseResponse` with 13 fields including `processing_time_ms` and `model_version`.

**Backend Integration:**
- `POST /api/v1/summarization/summarise` — Summarize an email thread
- `GET /api/v1/summarization/summary/{thread_id}` — Retrieve stored summary

**Status:** Currently operational with Groq API. Requires `GROQ_API_KEY` environment variable.

### 7.4 Data Engineering Pipeline (Aswitha)

**Location:** `ai/pipeline/`

**Components:**
- `engagement_features.py` — Feature engineering for engagement scoring:
  - `average_response_time()` — Calculates average response time in hours
  - `response_time_score()` — Maps response time to 0-100 score
  - `days_since_last_outbound()` — Tracks recency of sales outreach
  - `engagement_decay_penalty()` — Applies decay penalty for stale leads
  - `ai_intent_category_score()` — Maps AI intent to engagement score
  - `buying_stage_score()` — Maps lead status to buying stage score
  - `customer_initiative_score()` — Detects who drives conversation
  - `engagement_trend_score()` — Measures trend over 7 days
  - `reply_recency_score()` — Scores based on latest email activity

- `export_real_features.py` — Exports computed features to CSV/JSON for analysis
- `fit_features.py` — Feature fitting and normalization
- `test_real_data.py` — Testing with real data
- `db_adapter.py` — Database adapter for feature extraction

**Data Flow:** Emails → Feature Engineering → Feature Vectors → Scoring Engine → Lead Score

---

## 8. INTEGRATIONS

### 8.1 Gmail Integration
- **OAuth2 Flow:** Google OAuth2 with scopes for read, modify, send
- **Sync:** Per-user Gmail connections, auto-sync via API
- **Features:** Thread grouping, inbound/outbound tracking, attachment metadata
- **Endpoints:** `/api/v1/gmail/*`

### 8.2 Brevo (Sendinblue) Integration
- **Purpose:** Email marketing campaigns
- **Endpoints:** `/api/v1/brevo/*`
- **Status:** Basic integration implemented

### 8.3 Webhooks
- **Event-driven architecture** with webhook delivery
- **Event outbox pattern** for reliable event processing
- **Retry logic** with configurable max attempts
- **Endpoints:** `/api/v1/webhooks/*`

### 8.4 SMTP
- **Purpose:** Transactional emails (password reset, notifications)
- **Configuration:** Configurable SMTP host, port, TLS
- **Endpoints:** `/api/v1/smtp/*`
- **Status:** Currently under development

---

## 9. DEPLOYMENT

### 9.1 Docker Compose

```yaml
services:
  db: postgres:16-alpine (port 5432)
  api: FastAPI backend (port 8000)
  pgadmin: optional dev tool (port 5050, dev profile)
```

### 9.2 Render Deployment
- **Configuration:** `render.yaml` at project root
- **Root Dir:** `backend/`
- **Build Command:** Standard Python build
- **Start Command:** Uvicorn with app factory

### 9.3 Frontend Deployment
- **Platform:** Vercel (configured in `next.config.ts`)
- **Build:** `next build` with TypeScript compilation
- **Environment Variables:** `NEXT_PUBLIC_API_URL` pointing to backend

### 9.4 Environment Variables
- `DATABASE_URL` — PostgreSQL connection string (async)
- `SECRET_KEY` — JWT signing key
- `GMAIL_TOKEN_ENCRYPTION_KEY` — Gmail token encryption
- `GROQ_API_KEY` — Groq LLM API key
- `BREVO_API_KEY` — Brevo API key
- `CORS_ORIGINS` — Allowed origins (comma-separated)
- 50+ additional configuration variables in `Settings` class

---

## 10. COMPLETE 25-MINUTE PRESENTATION SCRIPT

---

### MODULE 1: MANOJ — Frontend Engineer (5 Minutes)

**Slide 1: Title Slide**
- **Content:** KALNET PULSE CRM — Enterprise CRM with AI-Powered Lead Scoring
- **Team Members listed**

**Speaker Notes:**
"Good morning/afternoon, respected professors, mentors, and reviewers. I'm Manoj, the Frontend Engineer on the KALNET PULSE CRM project. Over the next 5 minutes, I'll walk you through the problem we're solving, our objectives, and the user-facing side of our system."

**Slide 2: Problem Statement & Objectives**
- **Content:** 
  - Problem: CRMs are either too complex (Salesforce) or too simple (spreadsheets)
  - AI scores are opaque — sales teams don't trust black-box recommendations
  - Objective: Build a transparent, AI-powered CRM with explainable scores
- **Speaker Notes:**
"Traditional CRMs fall into two camps — enterprise solutions like Salesforce that require dedicated admin teams, or simple spreadsheets that offer zero intelligence. More importantly, AI-powered CRMs often present scores as black-box numbers. Sales teams ask 'Why is this lead scored 89?' and get no answer. Our objective was to build a CRM where every score and recommendation comes with a transparent, human-readable explanation."

**Slide 3: Landing Page**
- **Content:** Screenshot of PulseLandingPage.tsx
- **Demo Action:** Open the landing page
- **Speaker Notes:**
"Our landing page was built with Next.js 16 and React 19, using Framer Motion for smooth animations. It features a hero section with a live dashboard mockup, an interactive orbit diagram showing all six platform modules, customer testimonials, and a clean authentication flow. Let me show you the sign-up process."

**Slide 4: Authentication UI**
- **Content:** AuthModal.tsx screenshot
- **Demo Action:** Click "Start Free Trial" → Show sign-up modal
- **Speaker Notes:**
"Our auth modal supports both sign-in and sign-up flows. On registration, we create a new organization and an admin user simultaneously. The system uses JWT tokens with access and refresh token pairs, stored securely in sessionStorage. We also have password reset, email verification, and role-based redirects."

**Slide 5: Dashboard & CRM Navigation**
- **Content:** Dashboard screenshots (Admin/Manager/Rep views)
- **Demo Action:** Navigate through dashboard tabs
- **Speaker Notes:**
"The dashboard is role-scoped — admins see organization-wide KPIs including total revenue, user counts, and top sales reps. Managers see team performance, pipeline health, and forecast projections. Sales reps see their own metrics — win rate, deal cycle time, and revenue trends. All data comes from dedicated dashboard API endpoints."

**Slide 6: Frontend Architecture**
- **Content:** Architecture diagram showing component tree
- **Speaker Notes:**
"Our frontend uses Next.js App Router with TypeScript. We have a centralized API layer in `utils/api.ts` that handles all HTTP communication, JWT token management, and error handling. The UI is styled with Tailwind CSS 4 and uses Lucide React for icons. We have 89 passing tests in our backend pytest suite, and Playwright configured for E2E testing."

**Slide 7: Technologies Used**
- **Content:** Tech stack logos
- **Speaker Notes:**
"To summarize the frontend stack: Next.js 16 with React 19, TypeScript for type safety, Tailwind CSS 4 for styling, Framer Motion for animations, and Lucide React for icons. The frontend communicates with our FastAPI backend via RESTful JSON APIs."

**Transition:**
"With that overview of the user interface, let me hand over to Sathwika, who will explain the backend architecture and database design that powers everything you just saw."

---

### MODULE 2: SATHWIKA — Backend Engineer + Database (5 Minutes)

**Slide 8: Backend Architecture**
- **Content:** Layered architecture diagram (Router → Service → Repository → Database)
- **Speaker Notes:**
"Thank you, Manoj. I'm Sathwika, and I'll explain the backend architecture. We built PULSE CRM using FastAPI, a modern async Python framework. The architecture follows a strict layered pattern: Routers handle HTTP concerns, Services contain business logic, Repositories manage data access, and Models define the database schema. This separation ensures testability and maintainability."

**Slide 9: REST APIs & Folder Structure**
- **Content:** API endpoint list + folder tree
- **Speaker Notes:**
"We have over 40 REST endpoints organized into 25+ router modules under `/api/v1/`. Each domain — leads, deals, companies, contacts, pipeline, AI — has its own router, service, repository, and model. The folder structure is domain-driven, making it easy to navigate and extend. All endpoints are documented automatically via Swagger at `/docs` and ReDoc at `/redoc`."

**Slide 10: Repository Pattern**
- **Content:** Repository class diagram
- **Speaker Notes:**
"We use the Repository pattern to abstract database access. Each repository encapsulates all queries for a specific entity. For example, `LeadRepository` has methods like `get_active_by_id()`, `list_by_organization()`, `search()`, and `create()`. This pattern makes it easy to unit test services by mocking repositories, and it centralizes query logic."

**Slide 11: Database Design**
- **Content:** ER diagram showing all 11 tables
- **Speaker Notes:**
"Our database has 11 core tables with PostgreSQL 16. The design follows these principles: UUID primary keys for all tables, audit timestamps on every row, soft deletes using `is_deleted` flags, multi-tenancy via `organization_id` on all domain tables, and proper foreign key constraints with CASCADE or SET NULL behavior."

**Slide 12: Tables & Relationships**
- **Content:** Table relationship diagram
- **Speaker Notes:**
"The key relationships are: One Organization has many Users, Companies, Contacts, Leads, and Deals. A Company has many Contacts. A Contact has many Leads. A Lead can be converted to one Deal (unique constraint ensures 1:1). Users have Roles via a many-to-many relationship through `user_roles`. Roles have Permissions via `role_permissions`. We also have an `activity_timeline_events` table for immutable audit logging, tied polymorphically to any entity."

**Slide 13: Authentication & Authorization**
- **Content:** JWT flow + RBAC permission matrix
- **Speaker Notes:**
"Authentication uses JWT access tokens (30-minute expiry) and refresh tokens (7-day expiry). Passwords are hashed with bcrypt. For authorization, we have 3 seeded roles: admin, manager, and sales_rep — with 33 granular permissions in `resource:action` format. For example, `lead:create`, `deal:change_stage`, `user:delete`. The `@require_permissions` dependency checks permissions before every protected endpoint."

**Slide 14: API Flow Example**
- **Content:** Request lifecycle diagram
- **Speaker Notes:**
"Let me trace a complete request. When a user saves a lead, the frontend sends a POST to `/api/v1/leads` with a JWT in the Authorization header. The RateLimitMiddleware, RequestIDMiddleware, and LoggingMiddleware process it first. Then the router calls `LeadService.create_lead()`, which validates data, calls `LeadRepository.create()` for the INSERT, logs activity via `ActivityTimelineRepository`, triggers an event through the EventBus, and returns the response."

**Transition:**
"Now I'd like to call Kiran to the stage, who will discuss our landing page implementation and additional backend contributions."

---

### MODULE 3: KIRAN — Backend Engineer + Landing Page (3 Minutes)

**Slide 15: Landing Page Implementation**
- **Content:** Landing page component breakdown
- **Speaker Notes:**
"Thank you, Sathwika. I'm Kiran, and I focused on the landing page implementation and backend routing. The landing page is a single-page React component built with TypeScript. It features scroll-reveal animations, a live dashboard mockup, an interactive orbit diagram with six clickable modules, and a responsive design that works across all screen sizes."

**Slide 16: Backend Contributions**
- **Content:** Workflow/event system diagram
- **Speaker Notes:**
"On the backend, I contributed to the routing infrastructure and workflow implementation. We use APScheduler for background tasks — feature recomputation runs every 5 minutes, and the event outbox processor runs every 15 seconds. The EventBus pattern allows services to emit events without knowing who consumes them, enabling loose coupling."

**Slide 17: Performance & Scalability**
- **Content:** Performance metrics slide
- **Speaker Notes:**
"We've implemented several performance optimizations: GZip compression for responses over 1KB, in-memory rate limiting with a sliding window (60 requests per minute with burst of 10), connection pooling with SQLAlchemy async sessions, and indexed database queries. For future scalability, the architecture supports horizontal scaling of the API layer, Redis caching, and database read replicas."

**Transition:**
"Let me now hand over to Samhith, who will explain the heart of our AI system — the Lead Scoring Engine."

---

### MODULE 4: SAMHITH — Lead Scoring Engineer (3 Minutes)

**Slide 18: Lead Scoring Engine**
- **Content:** Scoring architecture diagram
- **Speaker Notes:**
"Thank you, Kiran. I'm Samhith, and I built the Lead Scoring Engine. Let me be upfront — our scoring is currently rule-based, not ML. We made this design choice intentionally to ensure complete transparency. Every score comes with a list of human-readable reasons explaining exactly why a lead scored what it did."

**Slide 19: Scoring Parameters**
- **Content:** Weight distribution chart
- **Speaker Notes:**
"Our scoring engine evaluates two dimensions: **Fit** (60% weight) and **Engagement** (40% weight). Fit considers company size, industry complexity, whether they already use a CRM (software gap), operational system compatibility, and customization potential. Engagement considers the AI-detected intent category, buying stage, response time, engagement trend, and customer initiative."

**Slide 20: Rule Engine & Transparency**
- **Content:** Score breakdown example
- **Speaker Notes:**
"Let me show you a real example. A lead with status 'qualified' might start at 35. If they have a deal value of $150,000, that adds 20 points. If they've opened 5+ emails, that's another 10 points. If they're missing a company link, that's -4 points. The final score might be 78, putting them in the 'High' tier. And the system generates reasons like 'High deal value $150,000 significantly increases priority' and 'High email engagement (5 opens) indicates strong interest.' No black box."

**Slide 21: Future ML Improvements**
- **Content:** ML migration roadmap
- **Speaker Notes:**
"While we're rule-based in Phase 1, Phase 2 will migrate to ML models. The feature engineering pipeline is already built — we export features to CSV, have normalization logic, and the scoring output format is designed to be model-agnostic. We plan to train a gradient boosting model on historical conversion data, and later experiment with neural networks for pattern detection."

**Transition:**
"Now let me hand over to Bhavani, who will explain our AI Summarization module."

---

### MODULE 5: BHAVANI — AI Summarization Engineer (2 Minutes)

**Slide 22: AI Summarization Overview**
- **Content:** Summarization flow diagram
- **Speaker Notes:**
"Thank you, Samhith. I'm Bhavani, and I built the AI Conversation Summarization module. Our system uses Groq's Llama 3.3 70B model to analyze email threads and extract structured insights. The summarization runs as a microservice that can be called independently."

**Slide 23: LLM Integration & Prompt Engineering**
- **Content:** Prompt structure diagram
- **Speaker Notes:**
"Our prompt is carefully engineered with 11 specific tasks. The LLM generates: a one-sentence summary, a summary word for lead scoring (from 18 categories like 'demo_request', 'pricing_negotiation', 'contract_signed'), sentiment analysis, intent detection, confidence scoring, key points, action items, email category, draft reply, follow-up suggestion, and follow-up timing. The response is returned as structured JSON."

**Slide 24: Benefits & Business Value**
- **Content:** Sample output cards
- **Speaker Notes:**
"This module saves sales reps hours of reading time. Instead of scrolling through an entire email thread, they get a one-sentence summary, key points, and a suggested action — all in real-time. The summary word feeds directly into the lead scoring engine, creating a continuous intelligence loop between conversation analysis and scoring."

**Transition:**
"Aswitha will now explain the data engineering pipeline that powers our AI modules."

---

### MODULE 6: ASWITHA — Data Engineering (2 Minutes)

**Slide 25: Data Pipeline**
- **Content:** Data flow diagram
- **Speaker Notes:**
"Thank you, Bhavani. I'm Aswitha, and I built the data engineering pipeline. Our pipeline takes raw email data from the database, runs it through feature engineering functions, and produces feature vectors that feed into the scoring engine. The pipeline is designed for batch processing with scheduled recomputation."

**Slide 26: Feature Engineering Functions**
- **Content:** Feature function examples
- **Speaker Notes:**
"I implemented several key feature engineering functions. `average_response_time()` calculates how quickly a lead responds to sales emails — this is a strong engagement signal. `engagement_decay_penalty()` applies a -30 point penalty if no outreach has happened in 60+ days. `ai_intent_category_score()` maps the LLM's intent detection to a numerical score — for example, 'contract_signed' maps to 100, while 'lost' maps to -100."

**Slide 27: Database Optimization**
- **Content:** Index optimization examples
- **Speaker Notes:**
"On the database side, I focused on query optimization. We added composite indexes on `(entity_type, entity_id)` for the activity timeline — this is our most queried pattern. We also added indexes on `organization_id` combined with `created_at` for org-scoped time-series queries. The feature vector table is designed for efficient bulk reads during scoring."

**Transition:**
"Om will now explain the Recommendation Engine."

---

### MODULE 7: OM — Recommendation System (2 Minutes)

**Slide 28: Recommendation Engine**
- **Content:** Recommendation flow diagram
- **Speaker Notes:**
"Thank you, Aswitha. I'm Om, and I built the Recommendation Engine. While Samhith's scoring engine tells you *which* leads are hot, my engine tells you *what to do* with them. The system suggests the next best action for every lead, based on their current stage and behavior."

**Slide 29: How Recommendations Are Generated**
- **Content:** Weight formula + candidate actions
- **Speaker Notes:**
"Our engine evaluates 5 candidate actions: Send follow-up, Schedule demo, Send proposal, Mark as stale, and Escalate to manager. Each action is scored using a weighted formula that considers 8 factors: lead score, urgency, reply status, deal value, email engagement, meeting attendance, rep workload, and optimal contact time. The action with the highest weight wins."

**Slide 30: Business Value**
- **Content:** Recommendation examples
- **Speaker Notes:**
"The key insight is that different stages need different actions. A 'Contacted' lead who hasn't replied gets a 'Send follow-up' recommendation. A 'Qualified' lead with high score and fresh engagement gets 'Schedule demo'. A 'Negotiation' deal with high value might get 'Escalate to manager'. Each recommendation includes a reason explaining the top contributing factor, so sales reps always know *why* a suggestion was made."

**Transition:**
"Finally, let me call Ajith to discuss integration, testing, and deployment."

---

### MODULE 8: AJITH — Integration and Testing (3 Minutes)

**Slide 31: Integration Architecture**
- **Content:** Integration diagram (Gmail, Brevo, Webhooks)
- **Speaker Notes:**
"Thank you, Om. I'm Ajith, and I handled integration, testing, and deployment. Our system integrates with three external services. Gmail via OAuth2 for email sync and sending. Brevo for email marketing campaigns. And a webhook system for event-driven integrations with external platforms."

**Slide 32: Gmail Integration Deep Dive**
- **Content:** OAuth2 flow diagram
- **Speaker Notes:**
"The Gmail integration uses Google OAuth2 with scopes for read, modify, and send. Each user connects their Gmail account independently. Once connected, emails are synced with thread grouping, direction tracking (inbound/outbound), and attachment metadata. The sync endpoint returns the number of new emails synced and a cursor for incremental sync."

**Slide 33: Testing Strategy**
- **Content:** Test coverage report
- **Speaker Notes:**
"We have 89 pytest tests covering all major modules. The test suite includes: `test_auth.py` for registration, login, token refresh, password reset; `test_leads.py`, `test_deals.py`, `test_companies.py`, `test_contacts.py` for CRUD operations; `test_pipeline.py` for stage transitions; `test_rbac.py` for permission enforcement; `test_recommendation_features.py` for AI features; `test_ai_upload_webhook_security.py` for security; and `test_health.py` for health checks."

**Slide 34: Deployment & Challenges**
- **Content:** Docker + Render deployment setup
- **Speaker Notes:**
"We deploy using Docker Compose with PostgreSQL 16, the FastAPI backend, and optional pgAdmin. The backend is also configured for Render deployment. Some challenges we faced: ensuring async compatibility across all database operations, managing the monorepo import path for AI modules, and handling Gmail OAuth2 token refresh securely."

**Slide 35: Future Scope**
- **Content:** Roadmap slide
- **Speaker Notes:**
"Our future roadmap includes: ML-based lead scoring replacing the rule engine, personalized recommendations using collaborative filtering, sentiment trend analysis over time, mobile app development, and enhanced integrations with Slack, Salesforce, and HubSpot."

**Closing:**
"Thank you all for your time and attention. We believe KALNET PULSE CRM demonstrates a practical, transparent approach to AI-powered sales management. We're happy to answer any questions."

---

## 11. DEMO FLOW

### Step-by-Step Demo Actions

1. **Landing Page** — Open the landing page, show the hero section
2. **Orbit Diagram** — Click on each of the 6 nodes (Gmail Sync, AI Scoring, Analytics, Pipeline, Next Action, Contacts) to show descriptions
3. **Sign Up** — Click "Start Free Trial" → Fill in name, company, email, password → Submit
4. **Dashboard** — After login, show the role-scoped dashboard
5. **Companies** — Navigate to Companies → Show list → Create a new company
6. **Contacts** — Navigate to Contacts → Show list filtered by company → Create a contact
7. **Leads** — Navigate to Leads → Show list → Create a lead linked to a company/contact
8. **Lead Scoring** — Show the AI score for a lead with reasons
9. **Lead Conversion** — Convert a lead to a deal
10. **Pipeline** — Navigate to Pipeline → Show Kanban board → Move a deal between stages
11. **Recommendations** — Show next-best-action recommendations for a lead
12. **Gmail Sync** — Show Gmail connection status → Sync emails → View synced emails
13. **Summarization** — Show AI conversation summary for an email thread
14. **Reports** — Navigate to Dashboard → Show KPIs (Admin/Manager/Rep views)

---

## 12. FACULTY QUESTIONS & ANSWERS

### 30+ Likely Questions with Ideal Answers

**Q1: Why did you choose rule-based AI instead of ML?**
A: We chose rule-based for Phase 1 to ensure complete transparency. Every score and recommendation is explainable, which builds trust with sales teams. ML models will be introduced in Phase 2 once we have sufficient historical data.

**Q2: How does multi-tenancy work?**
A: Every domain table has an `organization_id` foreign key. All queries are scoped to the user's organization. The `TenantMixin` base class provides the `organization_id` and `created_by` columns automatically.

**Q3: How do you handle JWT token refresh?**
A: Access tokens expire in 30 minutes. Refresh tokens expire in 7 days. The `/auth/refresh` endpoint accepts a valid refresh token and returns a new access + refresh token pair. The frontend stores tokens in sessionStorage.

**Q4: What's the difference between a Lead and a Deal?**
A: A Lead is an early-stage opportunity — someone who might be interested. A Deal is a qualified opportunity that has passed qualification checks. Leads can be converted to Deals via the `/leads/{id}/convert` endpoint, which creates a Deal and a Company from the Lead data.

**Q5: How does the FSM pipeline work?**
A: Deals follow a strict finite state machine: New → Qualified → Proposal → Negotiation → Won/Lost. Each stage transition is validated. The `pipeline_stages` table makes stages configurable per organization, with custom names, colors, and sort orders.

**Q6: How does the recommendation engine know which action to suggest?**
A: Each action is scored using a weighted formula with 8 factors: lead score, urgency, reply status, deal value, email engagement, meeting attendance, rep workload, and contact time. The action with the highest score wins. The top contributing factor becomes the explanation.

**Q7: How do you ensure data security?**
A: We use bcrypt password hashing, JWT with configurable expiry, 33 granular RBAC permissions, soft deletes instead of hard deletes, CORS configuration, rate limiting, and request ID tracking for audit trails.

**Q8: How does the conversation summarization work?**
A: We use Groq's Llama 3.3 70B model. A structured prompt with 11 tasks extracts summary, sentiment, intent, key points, action items, and follow-up suggestions. The response is validated as JSON and stored in the database.

**Q9: What testing framework do you use?**
A: We use pytest with pytest-asyncio for async tests, pytest-cov for coverage reporting. We have 89 tests covering auth, CRUD operations, pipeline transitions, RBAC, AI features, and security.

**Q10: How do you handle database migrations?**
A: We use Alembic with 8 migration versions. Running `alembic upgrade head` applies all pending migrations. Each migration is versioned and reversible with `alembic downgrade`.

**Q11: What's the event outbox pattern?**
A: The event outbox pattern ensures reliable event delivery. When a service creates an event, it writes to the `event_outbox` table in the same database transaction. A background worker processes the outbox every 15 seconds, delivering events to webhooks and consumers.

**Q12: How does the Gmail OAuth2 flow work?**
A: The frontend calls `/gmail/oauth/login` to get a Google authorization URL. The user authorizes in Google's UI. Google redirects to our callback with a code. The backend exchanges the code for tokens, encrypts them, and stores them in the `gmail_connections` table.

**Q13: How do you calculate the lead score?**
A: The score combines Fit (60%) and Engagement (40%). Fit considers company size, industry, CRM gap, and operational fit. Engagement considers intent, buying stage, response time, trend, and initiative. Each sub-factor has weights defined in `ai/scoring/weights.py`.

**Q14: What happens when a lead is converted to a deal?**
A: The `/leads/{id}/convert` endpoint creates a Deal record linked to the Lead, creates a Company if not already linked, creates a Contact if not already linked, updates the Lead status to 'converted', and logs an activity event.

**Q15: How do you handle file uploads?**
A: Files are uploaded via `/api/v1/uploads` with configurable size limits (10MB default) and content type validation. Files are stored locally in the `uploads/` directory and served as static files. Document metadata is stored in the `documents` table.

**Q16: What's the difference between the admin, manager, and sales rep dashboards?**
A: Admin sees organization-wide KPIs (total revenue, user counts, top companies, system alerts). Manager sees team performance (pipeline health, forecast, rep quota attainment, deals at risk). Sales rep sees personal metrics (win rate, deal cycle, revenue trend, individual pipeline).

**Q17: How is the pipeline health calculated?**
A: Pipeline health score is calculated from stage distribution, deal velocity, and conversion rates. The `pipeline_coverage_ratio` compares pipeline value to quota target. A ratio above 3x is considered "Healthy," below 1x is "Critical."

**Q18: How does the email sync work?**
A: After Gmail OAuth2 authorization, the sync endpoint fetches recent emails, groups them by thread, classifies direction (inbound/outbound), extracts attachments, and stores them in the `emails` table. The sync uses Gmail's cursor-based pagination for incremental syncs.

**Q19: Can you explain the RBAC permission model?**
A: We have 3 roles: admin, manager, sales_rep. Each role has a set of permissions in `resource:action` format (e.g., `lead:create`, `deal:delete`). The `@require_permissions` decorator checks if the current user's roles include the required permission. Permissions are resolved dynamically from the database.

**Q20: How do you handle soft deletes?**
A: Domain tables have an `is_deleted` boolean column. All queries filter with `WHERE is_deleted = false`. The DELETE endpoint sets `is_deleted = true` and `updated_at = now()`. Admin users have access to a "restore" endpoint that sets `is_deleted = false`.

**Q21: What is the architecture of the recommendation engine?**
A: The engine has three layers: `rules.py` defines candidate actions with stage-specific weights, `engine.py` scores each action using a weighted formula with 8 normalized factors, and `recommendation_engine_service.py` extends this with 6 enhanced features (deal value, email opens, meeting attendance, etc.).

**Q22: How does the dashboard data aggregation work?**
A: Each dashboard endpoint runs multiple database queries to aggregate KPIs. For example, the admin dashboard queries: total organizations, users by status, companies added this month, leads by stage, revenue by period, top sales reps by deals closed, and recent activities. Aggregation happens at the SQL level using `GROUP BY` and window functions.

**Q23: What's the plan for ML-based scoring?**
A: Phase 2 will replace the rule-based engine with a gradient boosting model (XGBoost or LightGBM) trained on historical conversion data. The feature engineering pipeline is already built. The scoring interface is model-agnostic, so the switch will be seamless.

**Q24: How do you handle database connection pooling?**
A: We use SQLAlchemy's async engine with asyncpg. The pool size is configured in settings (default: 10 connections, max overflow: 20, pool timeout: 30s, pool recycle: 1800s). This ensures efficient connection reuse.

**Q25: What is the role of the event bus?**
A: The EventBus is a publish-subscribe system. Services emit events (e.g., "lead.created", "deal.stage_changed") without knowing who consumes them. Consumers register handlers for specific event types. Events are persisted in the `event_outbox` table for reliable delivery.

**Q26: How does the rate limiting work?**
A: We use an in-memory sliding window algorithm. Each client (identified by IP or X-Forwarded-For header) has a deque of request timestamps. If the count exceeds 60 requests in a 60-second window, the request is rejected with a 429 status code. The burst limit allows 10 requests in quick succession.

**Q27: How do you ensure API backward compatibility?**
A: The API is versioned under `/api/v1/`. We use Pydantic schemas for request/response validation. Adding new fields to responses doesn't break existing clients. Deprecated endpoints are marked in Swagger docs and maintained for a transition period.

**Q28: What's the most challenging part of the project?**
A: The most challenging aspect was ensuring async compatibility across the entire backend stack — FastAPI, SQLAlchemy 2.0 async, asyncpg, and the event system. Another challenge was managing the monorepo import path so that the `ai/` package is importable from the `backend/` directory.

**Q29: How does the system handle Gmail token expiration?**
A: Gmail tokens are stored encrypted in the `gmail_connections` table. The `token_expires_at` field tracks expiration. Before each sync, the system checks if the token is expired. If so, it uses the refresh token to obtain a new access token from Google.

**Q30: Can you explain the notification system?**
A: The notification system stores in-app notifications in the `notifications` table. Notifications are created for overdue tasks, today's meetings, pending approvals, high-priority leads, and system alerts. The frontend polls `/api/v1/notifications/unread-count` to show a badge. Users can mark notifications as read or dismiss them.

**Q31: How many API endpoints exist and how are they documented?**
A: We have 40+ endpoints across 25 routers. All are automatically documented via Swagger UI at `/docs` and ReDoc at `/redoc`. The OpenAPI specification is generated automatically by FastAPI from Pydantic schemas and route decorators.

**Q32: What is the backend-to-frontend communication pattern?**
A: The frontend communicates with the backend exclusively via RESTful JSON APIs. The frontend's `apiFetch()` function in `utils/api.ts` handles all HTTP communication, including JWT token injection, error handling, and response parsing. There is no WebSocket or server-sent events currently.

---

## 13. CHALLENGES FACED

### Realistic Implementation Challenges

1. **Async ORM Complexity:** Ensuring all database operations are truly async with SQLAlchemy 2.0 + asyncpg required careful session management and avoiding sync operations in async context.

2. **Monorepo Import Resolution:** The `ai/` package lives at the repository root, but the backend runs from `backend/`. We had to insert the repo root into `sys.path` in `main.py` to resolve imports.

3. **Gmail OAuth2 Token Management:** Handling token refresh, encryption, and secure storage of Gmail tokens required careful implementation of encryption/decryption utilities.

4. **Database Migration Management:** Coordinating 8 migration versions across multiple developers required clear versioning and documentation.

5. **Rate Limiting in Production:** The in-memory rate limiter doesn't scale across multiple instances. A Redis-based solution is planned for production.

6. **Event Outbox Reliability:** Ensuring exactly-once delivery of events while maintaining performance required careful transaction management.

7. **Frontend-Backend Type Alignment:** Maintaining TypeScript interfaces that match Pydantic schemas required manual synchronization. Auto-generation is planned.

8. **LLM Prompt Engineering:** Crafting the Groq prompt to reliably return valid JSON with all required fields required multiple iterations and fallback parsing.

---

## 14. FUTURE SCOPE

### Professional Roadmap

**Phase 2 (Next 3 Months):**
- ML-based lead scoring (gradient boosting)
- Collaborative filtering for recommendations
- Sentiment trend analysis over time
- Redis-based rate limiting
- Auto-generated TypeScript types from Pydantic schemas

**Phase 3 (6 Months):**
- Mobile app (React Native)
- Slack integration
- Salesforce data import
- Real-time notifications via WebSocket
- Advanced analytics with drill-down

**Phase 4 (12 Months):**
- Predictive lead scoring with neural networks
- Natural language pipeline queries
- Automated email sequences
- Custom dashboard builder
- Multi-language support

---

## 15. CONCLUSION

KALNET PULSE CRM is a fully functional, enterprise-grade CRM system built with modern technologies. It demonstrates:

- **Clean Architecture:** Layered backend with clear separation of concerns
- **Transparent AI:** Every score and recommendation is explainable
- **Enterprise Features:** Multi-tenancy, RBAC, audit logging, soft deletes
- **Modern Stack:** FastAPI, Next.js, PostgreSQL, TypeScript
- **Production Ready:** Docker deployment, 89 tests, Swagger docs

The project is currently in Phase 1, with all core CRM functionality operational. AI modules are rule-based with ML migration planned. The architecture is designed for extensibility, with clear interfaces between layers.

---

*Generated from KALNET PULSE CRM source code analysis — July 2026*
