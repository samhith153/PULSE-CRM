# KALNET PULSE CRM — Project Progress Summary

**Project:** KALNET PULSE – Enterprise Sales & Marketing CRM  
**Status:** Backend Engineer 1 (BE1) — ✅ COMPLETE  
**Date:** July 2026

---

## What Is This Project?

KALNET PULSE is an enterprise-grade CRM platform (similar to HubSpot / Zoho CRM / Salesforce).  
Built with **FastAPI + PostgreSQL + SQLAlchemy 2.0 (Async)** following Clean Architecture, DDD, and SOLID principles.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Language | Python 3.11+ |
| Framework | FastAPI |
| Database | PostgreSQL (Docker) |
| ORM | SQLAlchemy 2.0 Async |
| Validation | Pydantic V2 |
| Auth | JWT (Access + Refresh tokens) |
| Password | bcrypt / passlib |
| Migrations | Alembic |
| Testing | pytest + pytest-asyncio |
| Docs | Swagger UI / ReDoc |
| Container | Docker + docker-compose |

---

## Architecture

```
backend/
├── app/
│   ├── api/v1/          ← Route handlers (thin controllers)
│   ├── core/            ← Config, security, permissions, logging
│   ├── database/        ← DB connection, base models
│   ├── models/          ← SQLAlchemy ORM models
│   ├── schemas/         ← Pydantic V2 request/response schemas
│   ├── repositories/    ← Data access layer (Repository Pattern)
│   ├── services/        ← Business logic layer (Service Layer)
│   └── middlewares/     ← Request ID, logging, exception handling
├── alembic/             ← DB migrations
├── scripts/             ← Database seeder
└── tests/               ← pytest test suite
```

Pattern: **Routes → Services → Repositories → Database**  
Business logic lives only in Services. Routes are thin. Repositories handle all DB queries.

---

## What We Built — Module by Module

---

### ✅ 1. Project Setup & Architecture

- FastAPI app factory (`app/main.py`) with lifespan hooks
- Environment config via `pydantic-settings` (`.env` file)
- Structured logging (JSON + text modes)
- CORS, GZip middleware
- Request ID middleware (every request gets a unique trace ID)
- Request logging middleware
- 3-tier exception handling (custom, validation, generic)
- Standardized JSON response format across all endpoints
- Docker + `docker-compose.yml` for PostgreSQL database
- Alembic configured for async SQLAlchemy migrations
- Swagger UI at `/docs`, ReDoc at `/redoc`
- Health check endpoints (`/api/v1/health`, `/api/v1/health/ping`)

---

### ✅ 2. Database Design — 11 Tables

| Migration | Tables |
|-----------|--------|
| `0001_initial_schema` | organizations, roles, permissions, role_permissions, users, user_roles, companies, contacts, leads |
| `0002_deals_and_activities` | deals, activities |

Every table has: UUID PK · created_at · updated_at · is_active · is_deleted (soft delete) · organization_id (multi-tenancy) · indexes on all FKs

---

### ✅ 3. Authentication

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/auth/login` | POST | Email + password → JWT tokens |
| `/api/v1/auth/register` | POST | Create new user account |
| `/api/v1/auth/refresh` | POST | Get new access token via refresh token |
| `/api/v1/auth/logout` | POST | Invalidate session |
| `/api/v1/auth/forgot-password` | POST | Send reset token |
| `/api/v1/auth/reset-password` | POST | Set new password |

- JWT Access Token (30 min expiry)
- JWT Refresh Token (7 day expiry)
- Passwords hashed with bcrypt
- Token stored securely, validated on every request

---

### ✅ 4. Authorization — Full RBAC

- **3 Roles:** Admin, Manager, Sales Rep
- **33 Permissions** in format `resource:action` (e.g. `company:create`, `lead:assign`)
- `require_permission()` dependency injected on every protected endpoint
- Admin → all 33 permissions
- Manager → 30 permissions
- Sales Rep → 18 permissions
- Permission checks happen at the route level via FastAPI `Depends()`

---

### ✅ 5. User Management

| Endpoint | Description |
|----------|-------------|
| `GET /api/v1/users` | List users with pagination + search |
| `POST /api/v1/users` | Create user |
| `GET /api/v1/users/{id}` | Get user by ID |
| `PUT /api/v1/users/{id}` | Update user profile |
| `DELETE /api/v1/users/{id}` | Soft delete user |
| `POST /api/v1/users/{id}/activate` | Activate user |
| `POST /api/v1/users/{id}/deactivate` | Deactivate user |
| `POST /api/v1/users/{id}/roles` | Assign role to user |
| `DELETE /api/v1/users/{id}/roles/{role}` | Remove role |
| `POST /api/v1/users/{id}/change-password` | Change password |

---

### ✅ 6. Organization Management

| Endpoint | Description |
|----------|-------------|
| `GET /api/v1/organizations` | List organizations |
| `POST /api/v1/organizations` | Create organization |
| `GET /api/v1/organizations/{id}` | Get by ID |
| `PUT /api/v1/organizations/{id}` | Update |
| `DELETE /api/v1/organizations/{id}` | Soft delete |

- Multi-tenancy: every user/resource belongs to exactly one org
- Slug auto-generated from name

---

### ✅ 7. Company Management

| Endpoint | Description |
|----------|-------------|
| `GET /api/v1/companies` | List + search + paginate |
| `POST /api/v1/companies` | Create company |
| `GET /api/v1/companies/{id}` | Get by ID |
| `PUT /api/v1/companies/{id}` | Update |
| `DELETE /api/v1/companies/{id}` | Soft delete |

- Duplicate prevention (unique name per org)
- Website + phone validation
- Owner assignment

---

### ✅ 8. Contact Management

| Endpoint | Description |
|----------|-------------|
| `GET /api/v1/contacts` | List + search + paginate |
| `POST /api/v1/contacts` | Create contact |
| `GET /api/v1/contacts/{id}` | Get by ID |
| `PUT /api/v1/contacts/{id}` | Update |
| `DELETE /api/v1/contacts/{id}` | Soft delete |

- Email unique per organization
- Linked to Company (optional)
- Email, phone, LinkedIn validation

---

### ✅ 9. Lead Management

| Endpoint | Description |
|----------|-------------|
| `GET /api/v1/leads` | List + filter by status + paginate |
| `POST /api/v1/leads` | Create lead |
| `GET /api/v1/leads/{id}` | Get by ID |
| `PUT /api/v1/leads/{id}` | Update |
| `DELETE /api/v1/leads/{id}` | Soft delete |
| `POST /api/v1/leads/{id}/assign` | Assign to user |
| `POST /api/v1/leads/{id}/convert` | Convert to deal |

- Status FSM: new → contacted → qualified → proposal_sent → negotiation → won/lost
- Linked to Contact + Company
- AI score field ready (populated by future AI module)

---

### ✅ 10. Validation & Business Rules

- Duplicate company names blocked per org
- Duplicate contact emails blocked per org
- Phone number format validation
- URL / website format validation
- UUID format validation on all IDs
- Business rules enforced in Service layer (never in routes)
- Pydantic V2 schemas with field-level validators

---

### ✅ 11. Middleware & Utilities

| Component | Description |
|-----------|-------------|
| `RequestIDMiddleware` | Injects `X-Request-ID` header on every request |
| `RequestLoggingMiddleware` | Logs method, path, status, duration for every request |
| `ExceptionHandler` | Catches all exceptions, returns consistent JSON errors |
| `GZipMiddleware` | Compresses responses > 1KB |
| `CORSMiddleware` | Configured for frontend origin(s) |
| Pagination | `page` + `page_size` on all list endpoints |
| Search | `q` query param on list endpoints |
| Response Builder | All responses follow `{ data, message, status }` envelope |

---

### ✅ 12. API Documentation

- Swagger UI: **http://localhost:8000/docs**
- ReDoc: **http://localhost:8000/redoc**
- Every endpoint has summary, description, request/response examples, error codes
- Bearer token auth supported in Swagger (Authorize button)

---

### ✅ 13. Unit Tests — 89 Tests, All Passing

| Test File | Tests | Coverage |
|-----------|-------|----------|
| `test_health.py` | 3 | Health check endpoints |
| `test_auth.py` | 14 | Login, register, refresh, reset password |
| `test_rbac.py` | 8 | Permission enforcement per role |
| `test_users.py` | 10 | User CRUD, activate/deactivate, roles |
| `test_organizations.py` | 4 | Org CRUD |
| `test_companies.py` | 13 | Company CRUD, duplicate prevention |
| `test_contacts.py` | 10 | Contact CRUD, validation |
| `test_leads.py` | 12 | Lead CRUD, status transitions |
| `test_validation.py` | 15 | Business rule validations |

- Uses **in-memory SQLite** (no Docker needed for tests)
- Async tests with `pytest-asyncio`
- Run with: `pytest` from the backend folder

---

### ✅ 14. Database Seeder

Run `python -m scripts.seed` to populate:

| Data | Count |
|------|-------|
| Permissions | 33 |
| Roles | 3 (admin, manager, sales_rep) |
| Organization | 1 (KALNET Demo Organization) |
| Users | 4 (1 admin + 1 manager + 2 sales reps) |
| Companies | 5 |
| Contacts | 5 |
| Leads | ~5 (various statuses) |

---

### ✅ 15. Deals & Activities — Database Layer Ready

Although the API endpoints are not yet built (BE2 scope), the foundation is complete:

| Layer | Status |
|-------|--------|
| `deals` table | ✅ Migration done |
| `activities` table | ✅ Migration done |
| `Deal` ORM model | ✅ Complete |
| `Activity` ORM model | ✅ Complete |
| `DealRepository` | ✅ Complete |
| `ActivityRepository` | ✅ Complete |
| Deal permissions (33) | ✅ Seeded in RBAC |
| Activity permissions | ✅ Seeded in RBAC |
| Deal service + API routes | ⏳ BE2 to build |
| Activity service + API routes | ⏳ BE2 to build |

---

## API Endpoint Count

| Domain | Endpoints |
|--------|-----------|
| Health | 2 |
| Authentication | 6 |
| Users | 10 |
| Organizations | 5 |
| Companies | 5 |
| Contacts | 5 |
| Leads | 7 |
| **Total** | **40** |

---

## What's Next (Remaining Work)

### Backend Engineer 2 — Deals & Activities Track

| Task | Status |
|------|--------|
| Deal service layer | ⏳ Not started |
| Deal API endpoints (CRUD + stage change + assign) | ⏳ Not started |
| Activity service layer | ⏳ Not started |
| Activity API endpoints (timeline, log, list) | ⏳ Not started |
| Deal schemas (Pydantic V2) | ⏳ Not started |
| Activity schemas (Pydantic V2) | ⏳ Not started |
| Deal + Activity tests | ⏳ Not started |

### AI Track (Future)

| Module | Status |
|--------|--------|
| Lead scoring (`ai/scoring/`) | ⏳ Empty |
| Activity summarization (`ai/summarization/`) | ⏳ Empty |
| Recommendation engine (`ai/recommendation/`) | ⏳ Empty |
| AI pipeline (`ai/pipeline/`) | ⏳ Empty |

### Integrations (Future)

| Integration | Status |
|-------------|--------|
| Gmail sync | ⏳ Not started |
| Email notifications (SMTP) | ⏳ Not started |
| Supabase storage (avatars/files) | ⏳ Not started |

---

## Quick Start

```cmd
# 1. Start database
cd C:\Users\kiran\OneDrive\Documents\Desktop\PULSE-CRM\docker
docker-compose up db -d

# 2. Activate venv
cd ..\backend
.venv\Scripts\activate

# 3. Run migrations
alembic upgrade head

# 4. Seed data
python -m scripts.seed

# 5. Start server
uvicorn app.main:app --reload --port 8000
```

Open **http://localhost:8000/docs** to test all endpoints.

---

## Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@kalnet-pulse.com | Admin@123456 |
| Manager | sarah.johnson@kalnet-demo.com | Demo@123456 |
| Sales Rep | mike.chen@kalnet-demo.com | Demo@123456 |
| Sales Rep | priya.sharma@kalnet-demo.com | Demo@123456 |

---

*KALNET PULSE CRM — Backend Engineer 1 work complete. July 2026*
