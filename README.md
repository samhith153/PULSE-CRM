# PULSE CRM

> Enterprise sales & marketing CRM with AI-powered lead scoring, next-best-action recommendations, and conversation intelligence.

---

## Live Demo

**[pulse-crm-eight-pearl.vercel.app](https://pulse-crm-eight-pearl.vercel.app/)**

> **Note:** The backend is hosted on Render's free tier. Render spins down services after ~15 minutes of inactivity, so the first request after idle may take **30-60 seconds** while the server cold-starts. Subsequent requests are fast.

---

## Overview

PULSE CRM is a full-stack, multi-tenant CRM platform designed for sales teams that need more than a contact database. It combines traditional pipeline management with an AI backbone that scores leads, recommends actions, detects going-cold signals, and generates conversation intelligence — all in real time.

**Three independent services** communicate over HTTP:

| Service | Framework | Purpose |
|---------|-----------|---------|
| **Frontend** | Next.js 16 + React 19 + Tailwind 4 | Dashboard, pipeline boards, reports |
| **Backend** | FastAPI + SQLAlchemy 2.0 (async) | REST API, auth, RBAC, email sync |
| **AI Service** | FastAPI + Groq LLM | Scoring, recommendations, summaries |

---

## Features

### Core CRM
- **Lead Management** — full lifecycle tracking with status, score, owner, and activity history
- **Deal Pipeline** — configurable stages, drag-and-drop board, win/loss tracking, close reasons
- **Contacts & Companies** — linked entities with relationship graphs and activity timelines
- **Email Integration** — Gmail OAuth2 + Pub/Sub push sync, Brevo SMTP relay, AI-powered summaries with intent & sentiment analysis
- **Calendar & Meetings** — Google Calendar sync, meeting transcripts, daily agenda views
- **Documents** — file uploads with Supabase or local storage
- **Tasks & Activities** — CRM activity logging (calls, emails, notes) with timeline views

### AI & Intelligence
- **Lead Scoring** — weighted rule-based scoring combining fit, engagement, buying stage, and email activity
- **Next-Best-Action Recommendations** — AI-generated action plans with reasoning, priority, and confidence
- **Batch Recommendations** — score and recommend across all open leads in a single API call
- **Conversation Intelligence** — LLM-powered email summaries, intent detection, sentiment analysis, and trend tracking
- **Rising Interest Detection** — identifies leads showing increased engagement
- **Going-Cold Detection** — alerts when high-value leads go silent
- **AI Copilot Chat** — assistant for natural language queries about your pipeline

### Dashboards & Analytics
- **Role-Based Home Views** — tailored dashboards for Sales Reps, Managers, and Admins
- **Pipeline Funnel** — visual conversion funnel across stages
- **Quota Pace Tracking** — closed-won revenue vs. target with on-track/behind indicators
- **Deals at Risk** — stalled, low-probability, or negative-sentiment deals flagged automatically
- **Priority Queue** — AI-ranked leads surfaced by score and tier
- **Reports** — interactive charts with hover tooltips across all three role views

### Workflow & Automation
- **AI Workflows** — automated lead nurturing sequences generated from recommendations
- **Event Outbox** — durable event processing with retry and backoff
- **Scheduled Jobs** — daily lead assessment refresh, Gmail watch renewal, AI service keep-alive
- **SSE Real-Time Streaming** — live dashboard updates via Server-Sent Events

### Security & Access Control
- **JWT + bcrypt** authentication with refresh token rotation
- **Google OAuth2** sign-in
- **RBAC** — 33 permissions across admin, manager, and sales_rep roles
- **Rate Limiting** — global, auth-specific, and password-reset-specific tiers
- **Security Headers** — CSP, HSTS, X-Frame-Options, and more
- **Token Revocation** — AES-encrypted Gmail tokens, revoked token tracking

---

## Architecture

```
                    +-----------------+
                    |     Vercel      |
                    |    Frontend     |
                    |  Next.js :3000  |
                    +--------+--------+
                             |  /api/v1/* proxy (Next.js rewrites)
                    +--------v--------+
                    |     Render      |
                    |    Backend      |
                    |  FastAPI :8000  |
                    +--+-----------+--+
                       |           |
              +--------v--+  +----v-----------+
              | Supabase  |  |   Render       |
              | Postgres  |  |  AI Service    |
              |    16     |  | FastAPI :8001  |
              +-----------+  +------+--------+
                                    |
                              +-----v-----+
                              |  Groq LLM  |
                              |  (API)     |
                              +-----------+
```

The frontend proxies all `/api/v1/*` calls to the backend via Next.js rewrites, eliminating CORS issues. The backend communicates with the AI service over HTTP. All database access is async (asyncpg + SQLAlchemy 2.0).

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16, React 19, TypeScript 5, Tailwind CSS 4, Framer Motion, Lucide Icons |
| **Backend** | Python 3.11, FastAPI, SQLAlchemy 2.0 (async), Alembic, Pydantic v2 |
| **AI Service** | Python 3.11, FastAPI, Groq SDK, httpx |
| **Database** | PostgreSQL 16 (Supabase or self-hosted) |
| **Auth** | JWT (python-jose), bcrypt, Google OAuth2 |
| **Email** | Gmail API + Pub/Sub, Brevo SMTP relay |
| **Deployment** | Render (backend + AI), Vercel (frontend), Supabase (DB) |
| **Testing** | Playwright (E2E), pytest (unit) |
| **CI/CD** | GitHub Actions (push + nightly E2E runs) |

---

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 20+
- PostgreSQL 16+ (or a Supabase project)
- A Groq API key (for AI features)

### 1. Clone and configure

```bash
git clone https://github.com/samhith153/PULSE-CRM.git
cd PULSE-CRM
cp .env.example backend/.env
cp .env.example ai-service/.env
```

Edit `backend/.env` (and `ai-service/.env`) with your database URL, secret key, and API keys. See [Environment Variables](#environment-variables) for the full list.

### 2. Start with Docker (recommended)

```bash
cd docker
docker compose up -d
```

This starts PostgreSQL, the backend, and the AI service. Then start the frontend:

```bash
cd frontend
npm install
npm run dev
```

### 3. Start manually

**Database:**

```bash
cd backend
python -m venv venv
source venv/bin/activate  # or .venv\Scripts\activate on Windows
pip install -r requirements.txt
alembic upgrade head
```

**Backend:**

```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

**AI Service:**

```bash
cd ai-service
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8001
```

**Frontend:**

```bash
cd frontend
npm install
npm run dev
```

### 4. Start all at once (Windows)

```powershell
.\start-all-services.ps1
```

This launches all three services and reports their status.

---

## Environment Variables

Copy `.env.example` to both `backend/.env` and `ai-service/.env`. Required variables are marked with **(required)**.

### Database

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | — | **(required)** PostgreSQL connection string (port 6543 for Supabase transaction pooler) |
| `DIRECT_URL` | — | Direct connection for Alembic migrations (port 5432 for Supabase) |
| `DATABASE_POOL_SIZE` | `25` | Connection pool size |
| `DATABASE_MAX_OVERFLOW` | `20` | Max overflow connections |

### Security

| Variable | Default | Description |
|----------|---------|-------------|
| `SECRET_KEY` | — | **(required in production)** JWT signing key |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `30` | JWT access token lifetime |
| `REFRESH_TOKEN_EXPIRE_DAYS` | `7` | Refresh token lifetime |

### Authentication

| Variable | Default | Description |
|----------|---------|-------------|
| `GOOGLE_CLIENT_ID` | — | Google OAuth2 client ID (for sign-in + Gmail sync) |
| `GOOGLE_CLIENT_SECRET` | — | Google OAuth2 client secret |
| `GMAIL_TOKEN_ENCRYPTION_KEY` | — | AES key for encrypting Gmail tokens at rest |

### AI / LLM

| Variable | Default | Description |
|----------|---------|-------------|
| `GROQ_API_KEY` | — | Groq API key for lead recommendations |
| `ASSISTANT_API_KEY` | — | Groq API key for the AI copilot chat |
| `ASSISTANT_MODEL` | `openai/gpt-oss-120b` | LLM model for the copilot |
| `AI_SERVICE_URL` | `http://localhost:8001` | AI microservice URL |

### Email

| Variable | Default | Description |
|----------|---------|-------------|
| `SMTP_HOST` | `smtp-relay.brevo.com` | SMTP relay host |
| `SMTP_PORT` | `587` | SMTP port |
| `SMTP_USER` | — | SMTP username |
| `SMTP_PASSWORD` | — | SMTP password |

### Frontend

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | Backend API URL for the frontend |

See `.env.example` for the complete list including rate limiting, CORS, storage, and logging options.

---

## Project Structure

```
PULSE-CRM/
├── frontend/                    # Next.js 16 frontend
│   ├── src/
│   │   ├── app/                 # App router (32 dashboard routes)
│   │   ├── components/
│   │   │   └── dashboard/       # 55 React components
│   │   ├── hooks/               # Custom hooks (SSE, charts, CRM stream)
│   │   └── utils/
│   │       └── api.ts           # All API client functions (2600+ lines)
│   ├── playwright-dashboard.config.ts
│   └── package.json
│
├── backend/                     # FastAPI backend
│   ├── app/
│   │   ├── api/v1/              # 40 route modules
│   │   ├── models/              # 33 SQLAlchemy models
│   │   ├── repositories/        # 41 data access layers
│   │   ├── schemas/             # 35 Pydantic schemas
│   │   ├── services/            # 55 business logic services
│   │   └── core/                # Config, logging, exceptions
│   ├── alembic/versions/        # 49 migration scripts
│   ├── tests/                   # pytest unit tests
│   └── requirements.txt
│
├── ai-service/                  # AI microservice
│   ├── app/
│   │   ├── routers/             # 4 API routers
│   │   ├── services/            # Scoring, recommendations, LLM
│   │   ├── prompts/             # LLM prompt templates
│   │   └── rules/               # Rule-based scoring engine
│   └── requirements.txt
│
├── docker/
│   └── docker-compose.yml       # PostgreSQL + backend + AI service
│
├── docs/                        # Architecture & integration docs
├── tests/                       # Playwright E2E test suites
├── render.yaml                  # Render deployment manifest
├── .env.example                 # Environment variable template
└── start-all-services.ps1       # Windows launcher script
```

---

## API Documentation

When running in development mode, interactive API docs are available at:

- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

The backend exposes **38 router modules** under `/api/v1/`, including:

| Endpoint Prefix | Purpose |
|----------------|---------|
| `/api/v1/leads` | Lead CRUD, status updates, conversion |
| `/api/v1/deals` | Deal CRUD, pipeline management |
| `/api/v1/pipeline` | Pipeline stages, move deals between stages |
| `/api/v1/ai` | Recommendations, batch scoring, deal insights |
| `/api/v1/ai-insights` | Going-cold, rising interest, daily priorities, conversation intelligence |
| `/api/v1/dashboard` | Role-specific dashboards (admin, manager, sales-rep) |
| `/api/v1/workflows` | AI-driven lead workflows and task management |
| `/api/v1/gmail` | Gmail OAuth, sync, Pub/Sub webhook |
| `/api/v1/emails` | Email listing, summaries, read status |
| `/api/v1/reports` | Reports and analytics by role |
| `/api/v1/auth` | Register, login, Google OAuth, password reset |
| `/api/v1/users` | User management, team assignment |
| `/api/v1/roles` | RBAC roles and permissions |
| `/api/v1/assistant` | AI copilot chat |

---

## Testing

### E2E Tests (Playwright)

```bash
cd frontend
npm run test:e2e
```

Runs 15+ test suites across Chromium, Firefox, and WebKit. Tests cover authentication, lead management, deal pipeline, dashboard views, and more.

### Unit Tests (pytest)

```bash
cd backend
pytest
```

---

## Deployment

### Production (Render + Vercel)

The `render.yaml` manifest defines three services:

1. **pulse-crm-backend** — FastAPI on Render (Python runtime)
2. **pulse-crm-ai** — AI microservice on Render (Python runtime)
3. **pulse-crm-migrate** — Alembic migration job (run after deploys with new migrations)

Frontend is deployed to Vercel and configured to proxy API calls to the backend.

### Database Migrations

After pulling changes that include new Alembic migrations:

```bash
cd backend
alembic upgrade head
```

On Render, trigger the `pulse-crm-migrate` job manually or set it up as a post-deploy hook.

---

## License

Proprietary — Kalnet PULSE CRM. All rights reserved.
