# Pulse CRM - Workspace Project

Welcome to the restructured **Pulse CRM** workspace. The project is organized as a client-server architecture containing a frontend React/Next.js interface, a Python FastAPI backend server, and a preconfigured PostgreSQL database schema.

## Directory Structure

```
Pulse CRM/
├── docker-compose.yml       # Orchestrates frontend, backend, and postgres containers
├── README.md                # System-wide bootstrap instructions
├── AGENTS.md                # Next.js workspace behavior rules
├── CLAUDE.md                # Workspace command references
│
├── pulse-crm-frontend/      # Next.js App Router Client (React 19 & Tailwind CSS v4)
│   ├── src/                 # Client UI routes & components
│   ├── public/              # Static SVG and web icons assets
│   ├── package.json         # Node packaging dependency locks
│   ├── Dockerfile           # Node runtime container configuration
│   └── ...
│
└── pulse-crm-backend/       # FastAPI Backend Web Server (Python 3.11)
    ├── main.py              # Application setup & routers mounting
    ├── database.py          # SQLAlchemy engine pool config
    ├── models.py            # Relational database declarative ORM models
    ├── schemas.py           # Pydantic validation rules (REST contracts)
    ├── requirements.txt     # Python server dependencies manifest
    ├── Dockerfile           # Python application container config
    ├── db/
    │   └── init.sql         # Raw SQL DDL structure schema (10 core tables)
    └── routers/             # Sub-routing endpoint handlers
        ├── auth.py          # JWT user sign-in/sign-out controllers
        ├── companies.py     # Organization profiling actions
        ├── contacts.py      # Personnel contact details roster
        ├── leads.py         # Intake leads conversion workflows
        ├── deals.py         # Opportunity boards pipelines stage updates
        ├── timeline.py      # Aggregated chronological sync feed
        ├── gmail.py         # Google API background syncing controllers
        └── users.py         # RBAC operator access level controls
```

---

## Getting Started

### Method 1: Docker Compose (Recommended)

To launch all modules (Postgres Database, FastAPI Server, and Next.js client) simultaneously in a virtualized docker network, run:

```bash
docker compose up -d --build
```

- **Next.js Frontend:** [http://localhost:3000](http://localhost:3000)
- **FastAPI API Swagger Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **FastAPI Server root:** [http://localhost:8000](http://localhost:8000)
- **Postgres Database:** localhost:5432 (credentials: `postgres`/`postgres`)

To view log streams:

```bash
docker compose logs -f
```

---

### Method 2: Manual Execution

If you prefer to run services natively on your local machine, follow these guidelines:

#### 1. Database Initialization
Deploy a PostgreSQL database instance on port `5432` with a database named `pulse-crm`, and run the SQL code in `pulse-crm-backend/db/init.sql` to instantiate schemas and seed default stages/roles.

#### 2. Backend FastAPI App
Navigate to the backend directory, configure a python sandbox environment, install dependencies, and boot the server:

```bash
cd pulse-crm-backend
python -m venv venv

# On Windows:
.\venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

#### 3. Frontend Next.js App
Navigate to the frontend directory, install npm packages, and boot the hot-reloading development server:

```bash
cd pulse-crm-frontend
pnpm install
pnpm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the client-side app.
