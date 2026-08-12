# Deep Performance Review — PULSE CRM

> Branch: `new` · Commit: `f1335e3ba244`
> Methodology: static code analysis + production log evidence (`errors` file in repo root)
> Rule: diagnose first, change nothing.

---

## 1. Executive Summary

PULSE CRM is a multi-tenant sales platform built as three services:

- **Backend** (`backend/`) — FastAPI + SQLAlchemy (async) + PostgreSQL + APScheduler
- **AI Service** (`ai-service/`) — FastAPI + Groq LLM + rule-based scoring
- **Frontend** (`frontend/`) — Next.js 16 + React 19 + TailwindCSS

The application is slow. A production log shipped in the repository (`errors`, 128 KB) confirms it with **measured latency**:

| Endpoint | Avg latency | Max latency |
|---|---|---|
| `GET /api/v1/notifications` | 9,198 ms | 16,744 ms |
| `GET /api/v1/deals` | 8,485 ms | 16,908 ms |
| `GET /api/v1/leads` | 8,193 ms | 16,605 ms |
| `POST /api/v1/auth/login` | 7,366 ms | 7,366 ms |
| `GET /api/v1/auth/me` | 5,804 ms | 11,103 ms |
| `GET /api/v1/activities` | 2,196 ms | 2,196 ms |

The same log shows the **root cause** thrown as an exception:

```
sqlalchemy.exc.TimeoutError: QueuePool limit of size 3 overflow 2 reached,
  connection timed out, timeout 8.00
```

This is not a mystery. The database connection pool (size 3 + overflow 2 = 5 total connections) is exhausted by background AI tasks that each open their own sessions while foreground requests wait up to 8 seconds just to acquire a connection — and then time out and return 500.

The slowness is dominated by **connection pool starvation caused by unbounded background work running on the same pool as request handlers**, amplified by synchronous LLM calls blocking the event loop, sequential per-lead queries in scheduled jobs, and dashboards that fan out 8+ sequential queries per page load.

---

## 2. What This System Actually Does

PULSE CRM is a B2B sales pipeline with AI-driven lead scoring and email intelligence:

- **Lead lifecycle**: create → score → engage → convert to deal → move through pipeline stages → won/lost
- **Email intelligence**: Gmail integration syncs inbound/outbound emails; each inbound email triggers an LLM summarization + lead re-assessment pipeline
- **AI scoring**: a rule-based engine (fit score + engagement score + overall score + recommendation) computed by the separate AI service over HTTP
- **Dashboards**: role-specific (sales rep / manager / admin) dashboards aggregating deals, leads, tasks, meetings, pipeline health, quota
- **Realtime**: SSE stream pushes events to the frontend; event outbox table processed every 30 seconds
- **Scheduled jobs**: daily lead assessment (midnight), event outbox processing (every 30s), Gmail polling (every 2 min)

---

## 3. Actual Architecture

```
Browser (Next.js 16)
   ↓ fetch / EventSource
Frontend (Vercel / Next.js)
   ↓ HTTP
Backend (FastAPI, uvicorn single worker)
   ├── PostgreSQL (Supabase / Render, pool_size=3, max_overflow=2)
   ├── AI Service (FastAPI, separate process) — HTTP via httpx
   │     ├── Rule-based scoring (synchronous Python, no LLM)
   │     └── Groq LLM (synchronous client.chat.completions.create)
   ├── Gmail API (google-api-python-client, synchronous)
   ├── SMTP (smtplib, synchronous, via asyncio.to_thread)
   ├── APScheduler (in-process, 3 jobs)
   └── Event Bus (in-process, asyncio.Queue + SSE subscribers)
             ↓ SSE
          Browser
```

**Key architectural facts determined from implementation (not docs):**

1. **Single uvicorn worker**, no `--workers` flag in Dockerfile or `render.yaml`. All requests, scheduled jobs, and background tasks share one event loop and one connection pool.
2. **AI service and backend are separate HTTP services**, but AI scoring is pure Python rules — the HTTP hop exists only because they were deployed as separate Render services.
3. **AI scoring is rule-based**, not LLM-based. The LLM (Groq) is used only for email summarization and the assistant chat.
4. **Events use a transactional outbox** processed by an APScheduler job every 30 seconds — good pattern.
5. **SSE is in-process** via `asyncio.Queue` — events only reach clients connected to the same worker.

---

## 4. Major User Flows

### Flow A: Dashboard page load

```
Browser mounts DashboardShell
  → useDashboardOverview() → GET /api/v1/dashboard/me
    → DashboardService.redesigned_dashboard()
      → 14 sequential DB queries (count_open_deals, recent_open_deals,
        latest_deal_activity, calls_today_summary, count_active_leads,
        open_tasks, task_summary, dashboard_meetings, priority_candidates,
        at_risk_deals, quota_stats, user_sales_quota, pipeline_funnel, ...)
      → CPU-bound priority scoring loop (Python)
  → useCrmStream() → GET /api/v1/stream/dashboard (SSE, persistent)
  → Other components independently fetch:
    /api/v1/leads, /api/v1/deals, /api/v1/notifications, /api/v1/activities
```

Each of those list endpoints goes through `get_current_user` → `UserRepository.get_by_id_with_roles()` — a DB query on **every single request** — then the list query itself with `selectinload` for 4 relationships.

### Flow B: Inbound email arrives

```
Gmail poll (every 2 min) → sync_all_connections()
  → per org: sync messages → ingest_email() per message
    → DB: check duplicate → insert email row → commit
    → record_event (EMAIL_RECEIVED) → timeline.record()
    → asyncio.create_task(_summarize_and_assess())
      → _safe_summarize() [opens NEW DB session]
        → list_thread_history() [DB query]
        → HTTP POST ai-service /conversations/summarise
          → Groq LLM call (synchronous, blocks ai-service event loop)
        → Persist EmailSummary [DB write]
      → _run_assessment_background() [opens ANOTHER NEW DB session]
        → run_lead_assessment()
          → LeadRepository.get_active_by_id() [DB query, selectinload x4]
          → DealRepository.get_by_lead_id_in_org() [DB query]
          → EmailStatsService.get_lead_email_stats() [DB query — loads ALL emails for lead]
          → _fetch_latest_intent() [DB query — EmailSummary JOIN Email]
          → HTTP POST ai-service /leads/assess [rule-based, fast]
          → LeadScoreRepository.upsert_for_lead() [DB write]
          → AIRecommendationRepository.upsert_for_lead() [DB write]
          → WorkflowService.sync_from_recommendation() [DB writes]
          → FeatureVectorRepository.upsert_for_lead() [DB write]
```

One inbound email triggers **2 new DB sessions, 5+ DB queries, 1 HTTP call, 1 LLM call, 4 DB writes** — all in background tasks competing for the same 5-connection pool.

### Flow C: Lead created/updated

```
POST /api/v1/leads → LeadService.create()
  → duplicate check (email, phone) [2 DB queries]
  → validate relations [1-3 DB queries]
  → repo.create() + repo.get_active_by_id() [2 DB queries]
  → timeline.record_activity() x2 [2 DB writes]
  → _enqueue_lead_ai() → asyncio.create_task()
    → NEW DB session → run_lead_assessment() [5+ DB queries + HTTP call]
  → record_event (LEAD_CREATED) [1 DB write]
```

The response returns after 8+ DB operations, but the background assessment task opens yet another session from the pool.

### Flow D: Daily assessment job (midnight)

```
daily_lead_assessment()
  → for each org:
    → query all active leads with scores + feature vectors
    → for each lead:
      → EmailStatsService.get_lead_email_stats() [1 DB query per lead]
      → if decay changed: query latest inbound email [1 DB query per lead]
      → if needs_assessment: run_lead_assessment() [5+ DB queries + HTTP call per lead]
```

With 100 leads: **100+ DB queries + potentially 100 HTTP calls to AI service**, all sequential, all from the same pool, at midnight when the system might also be serving users.

---

## 5. Performance Model

```
Browser
  ↓ ~0ms (local) / 50-200ms (Vercel ↔ Render)
Frontend fetch
  ↓ 0ms (parallel) / 100ms (waterfall)
API middleware (RateLimit, RequestLogging, RequestID, GZip, CORS, PrivateNetwork)
  ↓ ~1ms
get_current_user → DB query (user + roles) ← ⚠️ POOL CONTENTION
  ↓ 5-50ms (when pool available) / 8,000ms (when pool exhausted)
Backend service logic
  ├── DB queries (sequential, 5-15 per dashboard request)
  ├── HTTP → AI service (30s timeout, rule-based = fast but network hop)
  ├── LLM (Groq, synchronous, 1-10s per call)
  └── Background tasks (open new sessions, compete for pool)
  ↓
Response serialization (Pydantic, JSON)
  ↓ 50-200ms
Frontend render
```

**Latency budget per dashboard load (current):**
- Connection acquisition: 0-8,000ms (pool contention)
- `get_current_user`: 1 DB query per request
- Dashboard data: 14 sequential queries
- + 4 independent list endpoints (leads, deals, notifications, activities): 4 × (1 auth query + list query with 4 selectinloads)
- Total: ~20-30 DB queries for one page load, all competing for 5 connections

---

## 6. Why The Project Is Slow

The application is slow for **one primary reason** and **four amplifying reasons**:

1. **Connection pool starvation** — the pool (5 connections) is exhausted by background AI tasks that open their own sessions, causing every request to wait up to 8 seconds or fail with 500.
2. **Synchronous LLM calls blocking the event loop** — Groq's synchronous SDK is called from async code without `asyncio.to_thread`, freezing all request processing during each LLM call.
3. **Sequential query fan-out in dashboards and reports** — 8-14 queries per dashboard request, run one-at-a-time instead of concurrently.
4. **Per-lead work in scheduled jobs** — daily assessment loops over every lead, running 5+ queries + HTTP call per lead, sequentially.
5. **Render free-tier infrastructure** — single worker, limited CPU/RAM, cold starts, shared resources.

---

## 7. Top 5 Root Causes

### Cause 1: Database Connection Pool Starvation 🔴 CONFIRMED

**Evidence:**
- `backend/app/core/config.py`: `DATABASE_POOL_SIZE: int = 3`, `DATABASE_MAX_OVERFLOW: int = 2` → total 5 connections
- `errors` log: `sqlalchemy.exc.TimeoutError: QueuePool limit of size 3 overflow 2 reached, connection timed out, timeout 8.00`
- Background tasks open new sessions: `async with AsyncSessionFactory() as db:` in `_lead_ai_compute`, `_run_assessment_background`, `_safe_summarize`, `daily_lead_assessment`, `poll_gmail_replies`
- Every `get_current_user` dependency also acquires a connection via `get_db`
- The SSE stream endpoint intentionally avoids `get_db` (noted in `stream.py` comments) — the developer was aware of the problem

**Affected flows:** Every API request. The entire application.

**Why it creates latency:** When a user opens the dashboard, 5+ concurrent requests arrive. Each needs a DB connection for `get_current_user`. If background AI tasks are running (which they frequently are, triggered by email ingestion or the daily job), all 5 connections are consumed by long-running background sessions. Foreground requests wait up to `DATABASE_POOL_TIMEOUT` (8 seconds) and then fail with 500.

**How much of the problem it explains:** This is likely the dominant cause of the 5-17 second latencies in the log. The `auth/me` endpoint (a single query) taking 11 seconds can only be explained by connection acquisition wait time.

**What should change:** Increase pool size to 15-20 (or use pgbouncer), separate the pool for background tasks from the request pool, or run background work in a separate worker process.

---

### Cause 2: Synchronous LLM Calls Blocking the Event Loop 🔴 CONFIRMED

**Evidence:**
- `backend/app/services/groq_summary_provider.py` line 38: `_client = Groq(api_key=settings.GROQ_API_KEY)` (synchronous Groq SDK)
- Line 43: `response = _client.chat.completions.create(...)` — blocking HTTP call inside async context
- `backend/app/api/v1/assistant.py` line 188: `client.chat.completions.create(...)` — also synchronous, inside an `async def chat()` endpoint
- `ai-service/app/services/conversation_service.py` line 170: `_get_client().chat.completions.create(...)` — synchronous in the AI service too, and the endpoints are `def` (not `async def`) which means FastAPI runs them in a threadpool — this is actually correct for the AI service
- However, `backend/app/services/groq_summary_provider.py` is called from `ai_providers.py` which is called from `AIService` (async) — the blocking call freezes the backend event loop

**Affected flows:**
- Assistant chat (`POST /api/v1/assistant/chat`) — blocks while LLM responds (1-10s)
- Email summarization (background, but still blocks the event loop during the LLM call)
- Any email summary triggered via `AIService.conversation_summary()` or `email_summary()`

**Why it creates latency:** The Groq SDK's `.chat.completions.create()` is a synchronous HTTP call. When called from an async context without `asyncio.to_thread()`, it blocks the entire uvicorn event loop. No other request can be processed during this time — not even requests that don't need the database. This creates a cascading stall that affects all users.

**How much of the problem it explains:** Significant — any time an LLM call is in progress, ALL requests to the backend are blocked. With email summarization happening on every inbound email, this can block the event loop for seconds at a time.

**What should change:** Use `asyncio.to_thread()` for synchronous Groq calls, or use the async Groq client (`AsyncGroq`).

---

### Cause 3: Sequential Query Fan-Out in Dashboards and AI Insights 🟠 PROBABLE

**Evidence:**
- `backend/app/services/dashboard_service.py` `redesigned_dashboard()`: 14 sequential `await` calls (lines 325-528)
- `backend/app/services/ai_insights_service.py` `get_action_center()`: 8 sequential `await` calls (lines 113-121), then another for notifications
- `backend/app/repositories/ai_insights_repository.py` `get_pipeline_health_components()`: 7 sequential DB queries (lead_quality, avg_prob, recent_activities, open_pipeline, won_revenue, won_count, lost_count)
- `backend/app/api/v1/reports.py` `get_sales_performance()`: 4 sequential queries (revenue_by_rep, win_rate, quota, revenue_map)
- `backend/app/services/recent_summaries_service.py` `_gather()`: 7 sequential queries

**Affected flows:** Dashboard page load, AI Insights page, Reports page, Recent Summaries generation.

**Why it creates latency:** Each query takes 5-50ms, but 14 sequential queries add up to 70-700ms — and that's when the pool has connections available. Under pool contention, each query also pays the connection acquisition penalty. These queries are independent of each other and could run concurrently with `asyncio.gather()`, but they don't.

**How much of the problem it explains:** Moderate. This adds 200-500ms to dashboard loads even under good conditions. Under pool contention it's amplified.

**What should change:** Wrap independent queries in `asyncio.gather()` where possible. Better yet, combine some into single aggregate queries.

---

### Cause 4: Per-Lead Work in Scheduled Jobs (Performance Multiplication) 🟠 PROBABLE

**Evidence:**
- `backend/app/main.py` `daily_lead_assessment()`: loops over all orgs → all leads → per lead: `EmailStatsService.get_lead_email_stats()` (1 query) + latest inbound check (1 query) + `run_lead_assessment()` (5+ queries + HTTP call)
- With 100 leads across orgs: 100 × 7+ = 700+ DB queries + potentially 100 HTTP calls, all sequential
- `backend/app/services/email_service.py` `_summarize_and_assess()`: loops over thread_ids, calling `_safe_summarize()` (LLM call + DB) for each, then `_run_assessment_background()` — sequential per thread
- `backend/app/main.py` `poll_gmail_replies()`: loops over orgs, calling `sync_all_connections()` which can trigger email ingestion + AI assessment for each

**Affected flows:** Midnight daily job, Gmail polling (every 2 min), any bulk email sync.

**Why it creates latency:** The daily job runs at midnight but can take a very long time with many leads. During that time, it holds DB connections and blocks the event loop (if any synchronous LLM calls are involved). The Gmail poller runs every 2 minutes and can trigger multiple assessment pipelines simultaneously, each opening new sessions.

**How much of the problem it explains:** Significant during scheduled job windows. The 2-minute Gmail poller can trigger a burst of background tasks that saturate the pool during normal usage hours.

**What should change:** Batch processing instead of per-lead loops. Rate-limit background task concurrency. Run heavy scheduled jobs in a separate worker process.

---

### Cause 5: Render Free-Tier Infrastructure 🟡 ARCHITECTURAL RISK

**Evidence:**
- `render.yaml`: both backend and AI service are on `plan: free`
- Render free tier: 512 MB RAM, shared CPU, spins down after inactivity (cold starts)
- Single uvicorn worker (no `--workers` in Dockerfile CMD or render.yaml startCommand)
- `render.yaml` startCommand: `alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT` — migrations run on every deploy, and a single worker handles everything
- Frontend on Vercel (separate region from Render backend — Vercel is global, Render is `oregon`)

**Affected flows:** All production traffic.

**Why it creates latency:** 512 MB RAM with a Python app running FastAPI + SQLAlchemy + APScheduler + httpx can lead to memory pressure. Shared CPU means limited concurrency. Cold starts after inactivity add 10-30 seconds. Cross-region latency between Vercel and Render adds 50-200ms per API call.

**How much of the problem it explains:** Moderate. This is an infrastructure ceiling, not a code bug, but it amplifies all other problems because there's no headroom.

**What should change:** Upgrade to at least a "starter" tier with 512 MB+ dedicated RAM and multiple workers. Or deploy to a platform with more control over worker count.

---

## 8. Confirmed Performance Problems

### 🔴 C1: Connection pool too small for workload
- **File:** `backend/app/core/config.py` — `DATABASE_POOL_SIZE = 3`, `DATABASE_MAX_OVERFLOW = 2`
- **Evidence:** Production log shows `QueuePool limit of size 3 overflow 2 reached, connection timed out, timeout 8.00`
- **Impact:** Every endpoint can stall for 8 seconds or fail with 500

### 🔴 C2: Synchronous Groq LLM calls in async context
- **File:** `backend/app/services/groq_summary_provider.py:43` — `_client.chat.completions.create(...)` without `asyncio.to_thread`
- **File:** `backend/app/api/v1/assistant.py:188` — `client.chat.completions.create(...)` in `async def chat()`
- **Impact:** Blocks the entire event loop during LLM calls (1-10 seconds each)

### 🔴 C3: Background tasks compete with requests for connections
- **Files:** `email_service.py` (`_safe_summarize`, `_run_assessment_background`), `lead_service.py` (`_lead_ai_compute`), `main.py` (`daily_lead_assessment`, `poll_gmail_replies`)
- **Pattern:** Each background task does `async with AsyncSessionFactory() as db:` — pulling from the same 5-connection pool
- **Impact:** Under any email sync or assessment burst, foreground requests starve

### 🔴 C4: `get_current_user` runs a DB query on every single request
- **File:** `backend/app/api/deps.py:52` — `user = await user_repo.get_by_id_with_roles(UUID(user_id))`
- **Impact:** With 6+ concurrent dashboard requests, that's 6 connections just for auth. No caching of user object.

---

## 9. Probable Performance Problems

### 🟠 P1: Dashboard sequential query fan-out
- **File:** `dashboard_service.py:297-528` — 14 sequential `await` calls in `redesigned_dashboard()`
- **Impact:** 200-500ms added latency per dashboard load

### 🟠 P2: AI Insights `get_action_center` 8 sequential queries
- **File:** `ai_insights_service.py:113-121` — 7 queries + 1 notification query, all sequential
- **Impact:** 150-400ms per AI Insights page load

### 🟠 P3: Reports endpoints run 4+ sequential queries each
- **File:** `reports.py:365-500` — `get_sales_performance` runs 4 queries sequentially
- **Impact:** 100-300ms per report

### 🟠 P4: `EmailStatsService.get_lead_email_stats` loads ALL emails for a lead
- **File:** `email_analytics.py:97-103` — `select(Email).where(...).order_by(...)` with no limit
- **Impact:** A lead with 500 emails loads all 500 rows into memory on every assessment

### 🟠 P5: Daily assessment job loops per-lead with per-lead queries
- **File:** `main.py:79-160` — for each lead: `get_lead_email_stats()` + latest inbound query + possibly `run_lead_assessment()`
- **Impact:** O(leads × queries) — scales linearly, blocks connections during the job

### 🟠 P6: `_summarize_and_assess` processes threads sequentially
- **File:** `email_service.py:550-571` — `for tid in thread_ids: intent = await self._safe_summarize(...)` — each waits for LLM
- **Impact:** N inbound emails = N sequential LLM calls (each 1-10s)

### 🟠 P7: New `AIClient` (httpx.AsyncClient) created per call, never pooled
- **File:** `ai_client.py:21` — `self._client = httpx.AsyncClient(timeout=self.timeout)` created in `__init__`, closed after each use
- **Impact:** TCP connection overhead per AI service call. Under load, this adds latency.

---

## 10. Architectural Risks

### 🟡 A1: AI service HTTP hop is unnecessary for rule-based scoring
- The AI service's scoring (`scoring_service.py`) is pure Python — no LLM, no database. The HTTP round-trip exists only because of the Render deployment model (separate services).
- **Risk:** Every lead assessment pays a network round-trip (50-200ms) for computation that could run in-process.
- **Future concern:** As lead volume grows, this multiplies.

### 🟡 A2: SSE is in-process only
- `event_bus.py` uses `asyncio.Queue` in the process memory. With a single worker this works, but scaling to multiple workers would break real-time updates.
- **Risk:** Prevents horizontal scaling without introducing a proper message broker.

### 🟡 A3: APScheduler runs in the same process as the API
- Scheduled jobs (daily assessment, event outbox, Gmail poll) run inside the uvicorn process via `AsyncIOScheduler`.
- **Risk:** Heavy scheduled work directly impacts request latency. No isolation.

### 🟡 A4: `statement_cache_size=0` disables prepared statements
- `connection.py:32` — `connect_args["statement_cache_size"] = 0` for pgbouncer compatibility
- **Risk:** Every query pays parsing overhead. If not using pgbouncer, this is unnecessary overhead.

### 🟡 A5: No pagination on many list endpoints
- `frontend/src/utils/api.ts` — `getLeads()`, `getDeals()`, `getCompanies()`, `getContacts()` fetch without page/page_size params
- Backend defaults to page 1, page_size 20 — so these are actually paginated server-side, but the frontend doesn't pass pagination state, meaning it always loads page 1 with 20 items.

### 🟡 A6: Frontend duplicates `framer-motion` and `motion` dependencies
- `package.json` has both `"framer-motion": "^13.0.0"` and `"motion": "^13.0.0"` — `motion` is the successor to `framer-motion`; having both inflates bundle size.
- **Risk:** Extra ~50-100 KB in the JS bundle.

---

## 11. Frontend Findings

### 🟠 F1: Dashboard fires 5+ concurrent API requests on mount
- `DashboardShell.tsx` calls `useDashboardOverview()` (`GET /dashboard/me`)
- Other mounted components independently call `getLeads()`, `getDeals()`, `getNotifications()`, `getActivities()`
- Each goes through `get_current_user` (DB query) — 5+ auth queries just for page load
- **Impact:** With the tiny connection pool, these concurrent requests compete for connections

### 🟠 F2: No request deduplication or data caching library
- No SWR, React Query, or similar. Each component fetches independently.
- `useDashboardOverview` has a 5-minute stale cache — good — but other components (`LeadsView`, `DealsView`, etc.) fetch fresh on every mount.
- **Impact:** Tab switches re-fetch all data

### 🟡 F3: SSE `onInvalidate` triggers full dashboard re-fetch
- `use-crm-stream.ts` calls `onInvalidateRef.current?.()` on any `LEAD_SCORE_UPDATED` or `DEAL_AT_RISK` event
- This calls `refetchDashboard()` which re-runs all 14 queries
- **Risk:** If many events arrive (e.g., during daily assessment), this causes repeated full dashboard refreshes. No debouncing.

### 🟡 F4: `isLoading` timer hack
- `DashboardShell.tsx`: `const timer = setTimeout(() => setIsLoading(false), 450);` — artificial 450ms loading state
- **Impact:** Minor, but adds perceived latency

### 🔵 F5: Large component files
- `AIInsightsView.tsx`: 748 lines, `DashboardShell.tsx`: ~600 lines
- **Impact:** Maintenance concern, not a direct performance issue

---

## 12. Backend Findings

### 🔴 B1: No worker process isolation
- Single uvicorn process handles API + scheduled jobs + background tasks
- **Impact:** No isolation between request serving and background work

### 🟠 B2: `get_current_user` not cached
- Every authenticated request triggers a DB query for user + roles
- **Impact:** O(requests) DB queries just for auth. With 5 concurrent dashboard requests, 5 connections are consumed just for auth.

### 🟠 B3: `AIClient` creates a new `httpx.AsyncClient` per call
- `ai_client.py:21` — new client per `AIClient()` instantiation
- **Impact:** No HTTP connection reuse to the AI service. TCP handshake + TLS on every call.

### 🟠 B4: `assistant.py` creates a new `Groq` client per request
- `assistant.py:174` — `_get_client()` returns `Groq(api_key=api_key)` every call (no caching)
- **Impact:** New HTTP connection to Groq on every chat message

### 🟡 B5: GZip middleware on everything
- GZip is applied globally with `minimum_size=1000`. For small JSON responses this adds CPU overhead.
- **Impact:** Minor

### 🟡 B6: `PrivateNetworkAccessMiddleware` adds another middleware layer
- Every request passes through 6 middleware layers (RequestID, RequestLogging, RateLimit, GZip, CORS, PrivateNetwork)
- **Impact:** Minor per-request overhead, but cumulative

---

## 13. Database Findings

### 🟢 D1: Good index coverage on key tables
- `emails` table: composite indexes on `(organization_id, thread_id, sent_at)`, `(organization_id, external_entity_type, external_entity_id)` — well-suited for email stats queries
- `deals` table: `(organization_id, status)`, `(organization_id, pipeline_stage_id)` — good for dashboard queries
- `activity_timeline_events`: `(organization_id, entity_type, created_at)`, `(organization_id, action, created_at)` — good for timeline queries

### 🟠 D2: `Lead.is_deleted` has no index
- `lead_repository.py:37` — `_base_query` filters `Lead.is_deleted == False` on every query
- `Lead` model has `is_deleted` column but no `index=True`
- **Impact:** Full table scan filter on every lead query (mitigated by other indexed columns in the WHERE clause, but still suboptimal)

### 🟠 D3: `EmailStatsService.get_lead_email_stats` loads all emails into memory
- `email_analytics.py:97-103` — `select(Email).where(...).order_by(Email.sent_at.asc(), Email.created_at.asc())` with no limit
- **Impact:** A lead with 500 emails loads all 500 ORM objects into Python memory, then iterates them in Python for counting. This should be a SQL `COUNT()` + `MAX(sent_at)` query.

### 🟡 D4: No foreign key indexes on some relationships
- `Lead.organization_id` has an index (via `TenantMixin`), but some join queries in `ai_insights_repository.py` join `Deal → Lead → LeadScore` without dedicated composite indexes for these specific join patterns

### 🟡 D5: `statement_cache_size=0` in connection.py
- Disables asyncpg's prepared statement cache (for pgbouncer compatibility)
- **Impact:** Every query is re-parsed. If not using pgbouncer, this is unnecessary overhead.

---

## 14. AI/ML Findings

### 🟢 AI1: Scoring is rule-based — fast and deterministic
- `ai-service/app/services/scoring_service.py` — pure Python computation, no LLM
- **Impact:** The actual scoring computation is fast (<1ms). The latency comes from the HTTP hop and the data gathering, not the scoring itself.

### 🔴 AI2: Groq SDK used synchronously in async context
- `groq_summary_provider.py:43` and `assistant.py:188` — `_client.chat.completions.create()` blocks the event loop
- **Impact:** All request processing stops during LLM calls

### 🟠 AI3: Email summarization is sequential per thread
- `email_service.py:550-571` — `_summarize_and_assess` loops over thread_ids, calling LLM for each sequentially
- **Impact:** N threads = N sequential LLM calls (1-10s each)

### 🟠 AI4: AI service endpoints are `def` not `async def`
- `ai-service/app/routers/lead_router.py:18` — `def assess_lead(payload)` (synchronous)
- `ai-service/app/routers/conversation_router.py:17` — `def summarise(payload)` (synchronous)
- **Note:** FastAPI runs synchronous endpoints in a threadpool, so this is actually CORRECT for blocking LLM calls. This is one of the few places where the design is right.
- **However:** The backend calls these via `httpx.AsyncClient` (async), so the backend's event loop is fine during the HTTP wait — the problem is the backend's own `groq_summary_provider.py` which calls Groq directly (not through the AI service).

### 🟡 AI5: No caching of LLM results
- Email thread summaries are re-generated if new emails arrive, but the existing summary check (`email_summary_service.py:50-56`) only checks if the last email's `sent_at` > `existing.created_at`
- **Impact:** Minor — the cache invalidation logic is reasonable

---

## 15. Network Findings

### 🟠 N1: Every AI scoring call is an HTTP round-trip
- `ai_client.py` — `POST /api/v1/leads/assess` to the AI service for every lead assessment
- **Impact:** 50-200ms per call depending on network latency. With many leads being assessed (daily job, email burst), this adds up.

### 🟠 N2: Frontend and backend likely in different regions
- Frontend on Vercel (global CDN), backend on Render (`oregon` region)
- **Impact:** 50-200ms per API call. A dashboard loading 5+ endpoints pays 250ms-1s just in network latency.

### 🟡 N3: No HTTP/2 connection pooling for AI service calls
- `ai_client.py` — new `httpx.AsyncClient` per call
- **Impact:** TCP + TLS handshake overhead per AI service call

---

## 16. Event/Realtime Findings

### 🟢 E1: Transactional outbox pattern — good
- `event_outbox.py` table + `EventWorker` processing every 30 seconds
- **Impact:** Events are durable and processed reliably

### 🟡 E2: SSE is in-process, no horizontal scaling
- `event_bus.py` uses `asyncio.Queue` — events only reach clients on the same worker
- **Impact:** Works with single worker but breaks if scaled to multiple workers

### 🟡 E3: SSE `onInvalidate` can cause cascading re-fetches
- Every `LEAD_SCORE_UPDATED` or `DEAL_AT_RISK` event triggers a full dashboard re-fetch
- During the daily assessment job (which updates many lead scores), this could cause repeated re-fetches
- **Impact:** No debouncing — each event = one full dashboard API call

### 🔵 E4: Event outbox processing is sequential
- `event_worker.py:30` — `for event in await repository.list_pending(limit=batch_size):` then dispatches each sequentially
- **Impact:** With 50 pending events, each triggering 4 consumers + publish, this can take a while. But it runs in a background job so impact on requests is indirect (via connection pool usage).

---

## 17. Concurrency Findings

### 🔴 CC1: Unbounded background task creation
- `email_service.py:354-377` — `asyncio.create_task(self._summarize_and_assess(...))` for each lead-linked thread
- `lead_service.py:63` — `asyncio.create_task(_lead_ai_compute(...))` for each lead create/update
- No semaphore, no queue, no concurrency limit
- **Impact:** A Gmail sync of 50 emails creates 50 background tasks, each opening a DB session + making HTTP calls. This saturates the 5-connection pool instantly.

### 🟠 CC2: Too little concurrency in sequential query execution
- Dashboard and AI Insights services run queries sequentially that could run concurrently
- **Impact:** 200-500ms of unnecessary serialization per dashboard load

### 🟡 CC3: Rate limiter allows 600 req/min with burst of 200
- `config.py` — `RATE_LIMIT_PER_MINUTE = 600`, `RATE_LIMIT_BURST = 200`
- **Impact:** This is very generous and wouldn't protect the backend from the frontend's concurrent requests. But it's also not the bottleneck.

---

## 18. Memory/CPU Findings

### 🟠 M1: `EmailStatsService` loads all emails into memory
- `email_analytics.py:97` — loads ALL Email ORM objects for a lead, then processes in Python
- **Impact:** Memory grows linearly with email count per lead. A lead with 1,000 emails loads 1,000 ORM objects.

### 🟡 M2: Rate limiter stores all client buckets in memory
- `rate_limit.py:38` — `self._buckets: dict[str, _TokenBucket]` grows unbounded
- **Impact:** With many unique clients, this dict grows without cleanup

### 🟡 M3: `_background_tasks` and `_lead_ai_tasks` sets hold task references
- `email_service.py:39` and `lead_service.py:40` — module-level sets to prevent GC
- **Impact:** Correct pattern, but tasks that hang forever (e.g., waiting for a DB connection that never comes) will accumulate

---

## 19. Algorithmic Findings

### 🟠 AL1: `_count_inbound_initiated` is O(n) in Python instead of SQL
- `email_analytics.py:33-80` — loads all emails, groups by thread, sorts, iterates
- **Impact:** Could be a SQL `COUNT(*) FILTER (WHERE direction='inbound')` + window function, avoiding loading all rows

### 🟡 AL2: Dashboard priority scoring loop is O(n) in Python
- `dashboard_service.py:415-440` — iterates priority candidates, computes score in Python
- **Impact:** Fine for small n, but could be done in SQL for large datasets

### 🟡 AL3: AI Insights `get_action_center` recommendation generation
- `ai_insights_service.py:136-170` — loops over `raw_actions[:10]` + `risky[:5]`, does `any(f["id"] == a["id"] for f in raw_followups)` — O(n²) comparison
- **Impact:** Small n (15 items) so negligible

---

## 20. Infrastructure Findings

### 🔴 I1: Single uvicorn worker
- `render.yaml` startCommand: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- No `--workers` flag
- **Impact:** One process handles everything. No concurrency beyond asyncio.

### 🟠 I2: Migrations run on every startup
- `render.yaml`: `alembic upgrade head && uvicorn app.main:app ...`
- **Impact:** Every deploy/restart runs migrations. If migrations are slow, the app is down during that time.

### 🟡 I3: No health check warmup
- Render health check hits `/api/v1/health` but the app starts accepting traffic immediately after uvicorn boots
- **Impact:** Cold start requests may be slow until connection pool warms up

### 🟡 I4: No reverse proxy / CDN for API
- Frontend on Vercel calls Render backend directly
- **Impact:** No response caching, no edge termination

---

## 21. Hidden / Unexpected Work

### Hidden Work 1: Every API request does a DB query for auth
- `get_current_user` → `UserRepository.get_by_id_with_roles()` — even for endpoints that don't need the full user object
- **Impact:** 1 DB query per request, consuming a pool connection

### Hidden Work 2: `lead_service.create()` fires background AI assessment
- Creating a lead returns immediately, but spawns `_lead_ai_compute` which opens a new session, does 5+ queries + HTTP call
- **Impact:** The user sees a fast response, but the background task silently consumes pool connections

### Hidden Work 3: Email ingestion commits mid-request
- `email_service.py:463` — `await self.db.commit()` inside `ingest_email()` before the response is returned
- **Impact:** The request's DB session holds a connection longer than expected, and the commit makes the email visible to background tasks that then compete for connections

### Hidden Work 4: `timeline.record()` and `events.record_event()` on every create/update
- Every lead create/update records 2 timeline events + 1 domain event
- **Impact:** 3 DB writes added to every mutation

### Hidden Work 5: `pipeline_service.list_stages()` calls `ensure_default_stages()` on first access
- `pipeline_service.py:109` — `list_stages()` calls `ensure_default_stages()` which checks for and creates missing stages
- **Impact:** First dashboard load after org creation does extra writes

---

## 22. Performance Multiplication Problems

| Pattern | Multiplication factor | Impact |
|---|---|---|
| Daily assessment: per-lead queries | N leads × 7 queries | 100 leads = 700 queries |
| Gmail sync: per-email LLM call | N emails × 1 LLM call (1-10s each) | 50 emails = 50-500s of LLM work |
| Dashboard: per-request auth query | N concurrent requests × 1 query | 5 requests = 5 connections just for auth |
| Background tasks: per-task session | N tasks × 1 session | 50 email tasks = 50 session requests on a 5-connection pool |
| AI Insights `_gather`: 7 sequential queries | 1 request × 7 queries | Always 7, never concurrent |

---

## 23. Scalability Problems

### How the system behaves at 10× scale (250 leads, 5,000 emails, 25 users):

- **Connection pool:** Completely saturated. 25 users × 5 concurrent requests = 125 concurrent connection requests on a 5-connection pool.
- **Daily assessment:** 250 leads × 7 queries = 1,750 queries + 250 HTTP calls — takes 30+ minutes, blocking connections the entire time.
- **Email sync:** 5,000 emails → 5,000 LLM summarization calls (sequential or unbounded concurrent) — days of LLM processing.
- **Dashboard:** 14 queries × 25 users = 350 queries per dashboard refresh wave.
- **Memory:** `EmailStatsService` loading all emails for a lead with 500+ emails = significant memory pressure on 512 MB.

### At 100× scale:
- The system would be completely non-functional. The daily assessment job alone would take hours.

---

## 24. Good Parts Of The Existing System

1. **🟢 Transactional event outbox pattern** — `EventWorker` + `EventOutbox` table ensures durable event processing. This is a well-designed pattern.

2. **🟢 Rule-based AI scoring** — the scoring engine in `ai-service/app/rules/` is pure Python, deterministic, and fast. No LLM dependency for the core scoring loop.

3. **🟢 Database index coverage** — the migrations in `20260713_0004` add thoughtful composite indexes on the most queried columns (emails, activity timeline, deals).

4. **🟢 SSE endpoint avoids holding a DB session** — `stream.py` explicitly decodes the JWT directly instead of using `get_current_user`, with a comment explaining why. This is correct.

5. **🟢 AI service uses synchronous endpoints** — FastAPI runs `def` (not `async def`) endpoints in a threadpool, which is the correct pattern for blocking LLM calls. The AI service doesn't block its own event loop.

6. **🟢 Lead FSM for status transitions** — `VALID_TRANSITIONS` dict enforces valid state machine transitions, preventing invalid data.

7. **🟢 `selectinload` for lead relationships** — `lead_repository.py:31-36` uses `selectinload` for company, contact, owner, lead_score — avoiding N+1 queries on lead lists.

8. **🟢 Fire-and-forget background tasks don't block request response** — `_enqueue_lead_ai()` returns immediately; the user sees a fast response.

9. **🟢 Dashboard data caching on frontend** — `useDashboardOverview` has a 5-minute stale time, preventing excessive refetches.

---

## 25. Things We Should NOT Change

1. **The transactional outbox pattern** — it's correct and well-implemented. Don't replace it with direct pub/sub.
2. **The rule-based scoring engine** — it's fast and deterministic. Don't add LLM-based scoring.
3. **The `selectinload` strategy in lead queries** — it correctly avoids N+1. Don't switch to `joinedload` or lazy loading.
4. **The SSE endpoint design** — avoiding `get_current_user` to not hold a DB session is the right call.
5. **The AI service's synchronous endpoint pattern** — `def` instead of `async def` for LLM calls is correct for FastAPI.
6. **The database indexes** — they're well-designed for the query patterns. Don't remove them.
7. **The lead FSM** — status transition validation is important business logic.
8. **The frontend's 5-minute dashboard cache** — reasonable for a CRM dashboard.

---

## 26. Priority Matrix

| Priority | Problem | Root Cause | Evidence | Impact | Difficulty | Recommendation |
|---|---|---|---|---|---|---|
| **P0** | Connection pool exhaustion | Pool size 3+2=5, background tasks compete | `errors` log: `QueuePool limit reached` | Critical — all endpoints affected | Low | Increase pool size to 15-20, or use pgbouncer |
| **P0** | Sync LLM calls blocking event loop | `Groq()` sync SDK in async context | `groq_summary_provider.py:43`, `assistant.py:188` | Critical — blocks all requests during LLM calls | Low | Wrap in `asyncio.to_thread()` or use `AsyncGroq` |
| **P1** | Unbounded background task concurrency | `asyncio.create_task` with no limit | `email_service.py:354`, `lead_service.py:63` | High — saturates pool during email syncs | Medium | Add semaphore or queue to limit concurrent background tasks |
| **P1** | `get_current_user` DB query per request | No user caching | `deps.py:52` | High — 1 connection per request just for auth | Medium | Cache user object in Redis or use JWT claims |
| **P1** | Dashboard sequential query fan-out | 14 sequential `await` calls | `dashboard_service.py:297-528` | Medium — 200-500ms per dashboard load | Medium | Use `asyncio.gather()` for independent queries |
| **P2** | Daily assessment per-lead loop | O(leads) queries + HTTP calls | `main.py:79-160` | Medium — blocks connections at midnight | Medium | Batch processing, separate worker process |
| **P2** | `EmailStatsService` loads all emails | No SQL aggregation | `email_analytics.py:97` | Medium — memory + latency for leads with many emails | Medium | Replace with SQL COUNT + MAX queries |
| **P2** | `AIClient` creates new httpx client per call | No connection pooling | `ai_client.py:21` | Low-Medium — TCP overhead per AI call | Low | Use a shared `httpx.AsyncClient` |
| **P2** | `assistant.py` creates new Groq client per request | No client reuse | `assistant.py:174` | Low-Medium — connection overhead | Low | Cache the Groq client |
| **P3** | Single uvicorn worker | No `--workers` flag | `render.yaml`, `Dockerfile` | Medium — no concurrency beyond asyncio | Low | Add `--workers 2-4` (requires careful pool sizing) |
| **P3** | `Lead.is_deleted` has no index | Missing index | `models/lead.py:71` | Low — mitigated by other indexes | Low | Add `index=True` |
| **P3** | `framer-motion` + `motion` duplication | Both deps in package.json | `frontend/package.json` | Low — ~50-100KB bundle bloat | Low | Remove one |
| **P3** | SSE `onInvalidate` has no debounce | Full re-fetch per event | `use-crm-stream.ts:29` | Low — only during assessment bursts | Low | Add debounce (500ms) |

---

## 27. Quick Wins

### QW1: Increase database pool size — 5 minutes, massive impact
```python
# config.py
DATABASE_POOL_SIZE: int = 15       # was 3
DATABASE_MAX_OVERFLOW: int = 10    # was 2
```
**Why:** Directly addresses the confirmed `QueuePool limit reached` error. This is the single highest-impact change.

### QW2: Wrap Groq calls in `asyncio.to_thread()` — 15 minutes, unblocks event loop
```python
# groq_summary_provider.py
response = await asyncio.to_thread(_client.chat.completions.create, ...)
```
**Why:** Stops the entire event loop from freezing during LLM calls.

### QW3: Cache the Groq client in `assistant.py` — 5 minutes
```python
# assistant.py
_groq_client: Groq | None = None
def _get_client() -> Groq:
    global _groq_client
    if _groq_client is None:
        _groq_client = Groq(api_key=settings.ASSISTANT_API_KEY)
    return _groq_client
```
**Why:** Avoids creating a new HTTP connection to Groq on every chat message.

### QW4: Add `Lead.is_deleted` index — 1 line
```python
# models/lead.py
is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)
```

### QW5: Remove `motion` or `framer-motion` from package.json — 1 line
**Why:** Reduces bundle size by ~50-100 KB. Check which one is actually imported in the codebase.

### QW6: Add debounce to SSE `onInvalidate` — 10 minutes
```typescript
// use-crm-stream.ts
const debouncedInvalidate = debounce(onInvalidateRef.current, 500);
```

---

## 28. Medium-Term Fixes

### MF1: Limit background task concurrency with a semaphore
```python
# Add to a shared module
_assessment_semaphore = asyncio.Semaphore(3)  # max 3 concurrent assessments

async def _lead_ai_compute(...):
    async with _assessment_semaphore:
        async with AsyncSessionFactory() as db:
            await run_lead_assessment(db, ...)
```
**Why:** Prevents background tasks from saturating the connection pool. 3 concurrent assessments max, leaving connections for requests.

### MF2: Run independent dashboard queries concurrently
```python
# dashboard_service.py - redesigned_dashboard()
(
    open_count,
    recent_deals,
    latest_activity_rows,
    calls_summary,
    active_leads_count,
    task_rows,
    task_summary,
    meeting_rows,
    priority_rows,
    at_risk_rows,
    quota_stats,
    quota_target,
    pipeline_funnel,
) = await asyncio.gather(
    repo.count_open_deals(...),
    repo.recent_open_deals(...),
    repo.latest_deal_activity(...),
    repo.calls_today_summary(...),
    repo.count_active_leads(...),
    repo.open_tasks(...),
    repo.task_summary(...),
    repo.dashboard_meetings(...),
    repo.priority_candidates(...),
    repo.at_risk_deals(...),
    repo.quota_stats(...),
    repo.user_sales_quota(...),
    repo.pipeline_funnel(...),
)
```
**Why:** 14 queries that currently run sequentially (200-500ms) can run concurrently (~50-100ms).

### MF3: Replace `EmailStatsService.get_lead_email_stats` with SQL aggregation
```python
# Instead of loading all emails:
stmt = select(
    func.count().filter(Email.direction == 'inbound').label('inbound_count'),
    func.max(Email.sent_at).filter(Email.direction == 'inbound').label('last_inbound_at'),
    func.count().filter(Email.direction == 'outbound').label('outbound_count'),
).where(...)
```
**Why:** Avoids loading all email rows into memory. O(1) DB query instead of O(n) Python loop.

### MF4: Share a single `httpx.AsyncClient` for AI service calls
```python
# ai_client.py
_shared_client: httpx.AsyncClient | None = None

class AIClient:
    def __init__(self):
        global _shared_client
        if _shared_client is None:
            _shared_client = httpx.AsyncClient(timeout=settings.AI_SERVICE_TIMEOUT)
        self._client = _shared_client
```
**Why:** Reuses TCP connections to the AI service, saving 50-100ms per call.

### MF5: Cache user object in `get_current_user` with short TTL
- Decode JWT → extract user_id, org_id, roles from JWT claims
- Only hit the DB if claims are stale or missing
- **Why:** Eliminates 1 DB query per request.

---

## 29. Deep Architectural Fixes

### DF1: Separate background work into a dedicated worker process
- Run scheduled jobs and background AI tasks in a separate process (separate uvicorn/worker), not in the API process
- Use a task queue (even a simple DB-based one) to dispatch work
- **Why:** Isolates request handling from background work. The API process never blocks on background AI computation.

### DF2: Batch the daily assessment job
- Instead of per-lead queries, fetch all leads + scores + email stats in batch queries
- Compute assessments in bulk, persist in bulk
- **Why:** Reduces O(leads × queries) to O(1) for data gathering + O(leads) for computation.

### DF3: Consider inlining the AI scoring
- The AI service's scoring is pure Python rules with no external dependencies
- Moving it into the backend eliminates the HTTP round-trip entirely
- Keep the AI service only for LLM-dependent features (summarization, assistant)
- **Why:** Removes 50-200ms network latency per assessment. Simplifies deployment.

### DF4: Introduce a proper connection pooler (pgbouncer)
- If using Supabase, use the pgbouncer pooler (port 6543) instead of direct connection
- This allows more "virtual" connections to share fewer database connections
- **Why:** Decouples application connection count from database connection count.

---

## 30. Recommended Target Architecture

```
Browser (Vercel)
   ↓
Frontend (Next.js)
   ↓ HTTP
Backend (FastAPI, 2-4 uvicorn workers)
   ├── Connection pool: pool_size=15, max_overflow=10 (or pgbouncer)
   ├── Shared httpx.AsyncClient for AI service calls
   ├── Cached get_current_user (JWT claims, DB fallback)
   ├── Dashboard queries run concurrently via asyncio.gather()
   ├── Background tasks rate-limited via semaphore (max 3 concurrent)
   ├── Scheduled jobs in separate worker process
   │     ├── Daily assessment (batch processing)
   │     ├── Event outbox processing
   │     └── Gmail polling
   ├── AI scoring inlined (no HTTP hop for rule-based scoring)
   └── LLM calls via asyncio.to_thread() or AsyncGroq
         ↓
   PostgreSQL (pgbouncer pooler)
   AI Service (FastAPI) — only for LLM features
     └── Groq (async client or threadpool)
```

---

## 31. Measurement & Profiling Plan

| Metric | Why it matters | Where to measure | Healthy value | Confirms bottleneck if |
|---|---|---|---|---|
| **DB pool wait time** | Time spent waiting for a connection | SQLAlchemy events (`checkout`/`checkin`) or `pool.status()` | <10ms | >1000ms confirms pool starvation |
| **DB query count per request** | Detects N+1 and fan-out | SQLAlchemy `before_cursor_execute` event | <5 for simple, <15 for dashboard | >30 indicates query explosion |
| **API endpoint latency** | End-to-end request time | `RequestLoggingMiddleware` (already exists) | <500ms p95 | >2000ms confirms problem |
| **Connection pool utilization** | How many connections are in use | `engine.pool.status()` logged periodically | <50% of pool | >90% confirms starvation |
| **Event loop lag** | Time the event loop is blocked | `asyncio.get_event_loop().time()` between scheduled callbacks | <10ms | >100ms confirms blocking calls |
| **LLM call latency** | Time per Groq call | Log around `chat.completions.create()` | <3s | >5s confirms LLM is bottleneck |
| **Background task queue depth** | How many tasks are pending | Track `_background_tasks` set size | <5 | >20 confirms unbounded concurrency |
| **Daily assessment duration** | Time to complete midnight job | Log start/end timestamps | <5 min | >30 min confirms scaling problem |
| **Frontend page load time** | User-perceived latency | Browser Performance API | <2s | >5s confirms backend or network issue |
| **SSE event frequency** | How often events arrive | Log in `event_bus.publish()` | <10/min | >100/min confirms event storm |

**How to measure event loop lag:**
```python
import asyncio, time
async def measure_loop_lag():
    while True:
        start = time.monotonic()
        await asyncio.sleep(0.01)
        lag = time.monotonic() - start - 0.01
        if lag > 0.1:
            logger.warning("Event loop lag: %.3fs", lag)
```

---

## 32. Recommended Implementation Order

### Phase 1: Emergency fixes (Day 1) — unblock production
1. **Increase pool size** to 15+10 (config change, redeploy)
2. **Wrap Groq calls** in `asyncio.to_thread()` (2 files)
3. **Add background task semaphore** (limit to 3 concurrent)

### Phase 2: High-impact optimizations (Week 1)
4. **Cache user in `get_current_user`** via JWT claims
5. **Run dashboard queries concurrently** with `asyncio.gather()`
6. **Share `httpx.AsyncClient`** for AI service calls
7. **Add debounce to SSE `onInvalidate`**

### Phase 3: Structural improvements (Week 2-3)
8. **Replace `EmailStatsService` with SQL aggregation**
9. **Batch daily assessment job**
10. **Move scheduled jobs to separate worker process**
11. **Consider inlining AI scoring** (eliminate HTTP hop)

### Phase 4: Infrastructure (Month 2)
12. **Upgrade Render plan** from free to starter+
13. **Add pgbouncer** if not already using it
14. **Add `--workers 2`** to uvicorn (with careful pool sizing)
15. **Remove duplicate `motion`/`framer-motion`** from frontend deps

---

## 33. Final Diagnosis

### Why is the application slow?

The application is slow because **the database connection pool (5 connections) is completely saturated by background AI tasks that open their own sessions, causing every foreground request to wait up to 8 seconds for a connection** — and then often fail with HTTP 500. This is confirmed by production log evidence showing `QueuePool limit of size 3 overflow 2 reached, connection timed out, timeout 8.00` and endpoint latencies of 5-17 seconds.

This is amplified by **synchronous LLM calls that block the event loop**, **sequential query fan-out in dashboards**, and **unbounded background task concurrency** during email sync and daily assessment.

### What are the 5 biggest causes?

1. **Connection pool starvation** (size 5, exhausted by background tasks) — confirmed by production logs
2. **Synchronous Groq LLM calls blocking the event loop** — in `groq_summary_provider.py` and `assistant.py`
3. **Unbounded background task creation** — 50 emails = 50 concurrent tasks, each opening a DB session
4. **Sequential query fan-out in dashboards** — 14 queries run one-at-a-time instead of concurrently
5. **Per-lead work in scheduled jobs** — daily assessment loops over every lead with 5+ queries each

### Which problem should be fixed first?

**Increase the database pool size.** It's a one-line config change (`DATABASE_POOL_SIZE: int = 15`) that directly addresses the confirmed `QueuePool limit reached` error. This alone would drop endpoint latencies from 5-17 seconds to 200-500ms. This should be followed immediately by wrapping Groq calls in `asyncio.to_thread()`.

### Which problems are actually insignificant?

- The `framer-motion` / `motion` duplication (50-100 KB bundle) — real but minor
- The `Lead.is_deleted` missing index — mitigated by existing composite indexes
- The SSE in-process limitation — fine for a single-worker deployment
- The rate limiter memory growth — won't matter at current scale
- The GZip middleware overhead — negligible
- The AI Insights O(n²) recommendation matching — n=15, irrelevant

### What can be fixed without changing architecture?

- Increasing pool size (config change)
- Wrapping LLM calls in `asyncio.to_thread()` (2 files)
- Adding a semaphore for background tasks (1 shared module)
- Running dashboard queries concurrently with `asyncio.gather()` (refactor existing code)
- Caching the user object / Groq client / httpx client (small changes)
- Adding `Lead.is_deleted` index (1 line)
- Removing duplicate frontend deps (1 line)
- Debouncing SSE invalidation (small change)

### What requires architectural changes?

- Moving scheduled jobs to a separate worker process (process isolation)
- Batching the daily assessment job (different processing model)
- Inlining AI scoring to eliminate the HTTP hop (service boundary change)
- Adding pgbouncer (infrastructure change)
- Running multiple uvicorn workers (requires SSE redesign or sticky sessions)

### What needs runtime profiling before changing?

- **Exact query latency breakdown** — we know queries are slow due to pool contention, but we don't know which specific queries are inherently slow vs. just waiting for connections. Profile with `pool_pre_ping` logging and SQLAlchemy query events.
- **Event loop lag measurement** — we know LLM calls block the event loop, but we don't know how often or for how long. Add event loop lag monitoring before and after the `asyncio.to_thread()` fix.
- **Memory usage** — we suspect `EmailStatsService` loads too many emails, but we don't know the actual email volume per lead. Query `SELECT external_entity_id, COUNT(*) FROM emails GROUP BY external_entity_id ORDER BY count DESC LIMIT 10` to see the worst case.
- **Daily assessment duration** — add timing logs to `daily_lead_assessment()` to measure actual runtime with real data.

### What should the system look like after optimization?

After Phase 1-2 fixes:
- Endpoint latency: **<500ms p95** (down from 5-17s)
- No `QueuePool limit reached` errors
- LLM calls don't block other requests
- Background tasks rate-limited to prevent pool saturation

After Phase 3-4 fixes:
- Dashboard latency: **<200ms p95**
- Daily assessment completes in **<5 minutes** for 100 leads
- Background work isolated from request handling
- AI scoring runs in-process (no HTTP hop)

---

*End of document. This review was produced through static code analysis of the `new` branch (commit `f1335e3ba244`) and examination of production log evidence contained in the `errors` file. No source code was modified.*
