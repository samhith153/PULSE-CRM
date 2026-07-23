# KALNET PULSE CRM — Backend API

Enterprise-grade CRM backend built with **FastAPI**, **SQLAlchemy 2.0 Async**, **Pydantic V2**, and **PostgreSQL** (Supabase-compatible).

---

## Architecture

```
backend/
├── app/
│   ├── api/
│   │   ├── deps.py          # JWT auth + RBAC dependencies
│   │   └── v1/
│   │       ├── auth.py      # Register, login, tokens, passwords
│   │       ├── users.py     # User CRUD + role assignment
│   │       ├── organizations.py
│   │       ├── companies.py
│   │       ├── contacts.py
│   │       ├── leads.py     # FSM status transitions
│   │       ├── health.py
│   │       └── router.py
│   ├── core/
│   │   ├── config.py        # pydantic-settings (12-factor)
│   │   ├── security.py      # JWT + bcrypt
│   │   ├── permissions.py   # RBAC registry
│   │   ├── exceptions.py    # Domain exception hierarchy
│   │   └── logging.py       # JSON / text structured logging
│   ├── database/
│   │   ├── base.py          # DeclarativeBase + AuditMixin
│   │   └── connection.py    # Async engine + get_db()
│   ├── models/              # SQLAlchemy ORM models
│   ├── schemas/             # Pydantic V2 request/response schemas
│   ├── repositories/        # Repository Pattern (DB access)
│   ├── services/            # Service Layer (business logic)
│   ├── middlewares/         # Request ID, logging, exception handler
│   └── utils/               # Enums, pagination, response builder
├── alembic/                 # Database migrations
├── scripts/
│   └── seed.py              # DB seeder
├── tests/                   # pytest test suite
├── Dockerfile
├── requirements.txt
└── .env.example
```

---

## Quick Start

### 1. Clone and setup

```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
# Linux/macOS:
source .venv/bin/activate

pip install -r requirements.txt
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env — set DATABASE_URL and SECRET_KEY
```

### 3. Start PostgreSQL

```bash
# Using Docker:
cd ../docker
docker-compose up db -d
```

### 4. Run migrations

```bash
cd backend
alembic upgrade head
```

### 5. Seed the database

```bash
python -m scripts.seed
```

### 6. Start the API

```bash
uvicorn app.main:app --reload --port 8000
```

Open Swagger UI: http://localhost:8000/docs

---

## API Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/v1/auth/register | Register org + admin user |
| POST | /api/v1/auth/login | Get JWT tokens |
| POST | /api/v1/auth/refresh | Refresh access token |
| POST | /api/v1/auth/forgot-password | Request reset email |
| POST | /api/v1/auth/reset-password | Reset with token |
| GET | /api/v1/auth/me | Current user profile |
| GET | /api/v1/users | List users (paginated) |
| POST | /api/v1/users | Create user |
| PUT | /api/v1/users/{id} | Update user |
| POST | /api/v1/users/{id}/roles | Assign roles |
| POST | /api/v1/users/{id}/activate | Activate user |
| POST | /api/v1/users/{id}/deactivate | Deactivate user |
| GET | /api/v1/companies | List companies |
| POST | /api/v1/companies | Create company |
| GET | /api/v1/contacts | List contacts |
| POST | /api/v1/contacts | Create contact |
| GET | /api/v1/leads | List leads (filterable) |
| POST | /api/v1/leads | Create lead |
| PATCH | /api/v1/leads/{id}/status | FSM status transition |
| POST | /api/v1/leads/{id}/assign | Assign lead owner |
| POST | /api/v1/leads/{id}/convert | Convert lead to deal |
| GET | /api/v1/deals | List deals (search/filter/sort) |
| POST | /api/v1/deals | Create deal |
| GET | /api/v1/deals/{id} | Get deal by ID |
| PUT | /api/v1/deals/{id} | Update deal |
| DELETE | /api/v1/deals/{id} | Delete deal |
| GET | /api/v1/health | System health check |

---

## Running Tests

```bash
# Install test extras (aiosqlite)
pip install aiosqlite

# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html
```

---

## Docker

```bash
# Build and run everything
cd docker
docker-compose up --build

# With pgAdmin
docker-compose --profile dev up
```

---

## Default Seeded Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@kalnet-pulse.com | Admin@123456 |
| Manager | sarah.johnson@kalnet-demo.com | Demo@123456 |
| Sales Rep | mike.chen@kalnet-demo.com | Demo@123456 |
