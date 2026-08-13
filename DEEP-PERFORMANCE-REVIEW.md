# DEEP-PERFORMANCE-REVIEW.md
## PULSE-CRM — End-to-End Performance Audit

**Repository:** `samhith153/PULSE-CRM`
**Original audit:** 2026-08-13 @ `d068be13b1263c8d933676ca6fae96cadd215fb7`
**Re-verified:** 2026-08-13 @ `4449dac` (line-by-line against current codebase)
**Confidence legend:** CONFIRMED (verified in code) · LIKELY (strong code evidence) · POSSIBLE (needs runtime verification) · FIXED (no longer present) · PARTIALLY FIXED (improved, root cause remains)

---

## 0. Re-verification Status (HEAD `4449dac`, 2026-08-13)

This review was re-verified claim-by-claim against the current codebase. **All five P0 findings and most P1 findings still hold.** The table below shows what changed since the original audit; sections marked ⚠ in the body contain corrections or added context.

| # | Finding (original doc) | Status at HEAD `4449dac` |
|---|------------------------|--------------------------|
| 1 | NullPool = new DB connection per request | **STILL ACTIVE.** `connection.py` still selects `NullPool` when `DATABASE_URL` contains `pooler`/`:6543`. A new `DIRECT_URL` (session-mode 5432) setting now exists, but only Alembic consumes it (`alembic/env.py`) — the app engine is still built from `DATABASE_URL` only. |
| 2 | `get_current_user` DB query per request | **STILL ACTIVE.** `deps.py` — no caching added. |
| 3 | AI service sync `def` endpoints | **STILL ACTIVE — broader than documented.** `conversation_router.py` (`/summarise`, `/draft-email`) uses the sync `groq.Groq` client, and `lead_router.py` (`/assess`, `/score`) is also sync `def` (rule-based, so only the conversation endpoints block on the LLM). |
| 4 | `manager_kpi` 16 sequential queries | **STILL ACTIVE.** Lines 1150-1783, 16 `self.db.execute` calls, 0 `asyncio.gather`. |
| 5 | Gmail Pub/Sub webhook blocks on full sync | **STILL ACTIVE.** All code paths now return 200 (try/except around sync work) but the full sync still runs inside the HTTP request. |
| 6 | Gmail messages fetched one-by-one | **STILL ACTIVE.** `email_service.py:1033`. |
| 7 | bcrypt on event loop | **STILL ACTIVE.** `auth_service.py:140`. |
| 8 | In-memory rate limiter, unbounded growth | **STILL ACTIVE.** `rate_limit.py` `_buckets` defaultdicts, never evicted. |
| 9 | Event outbox: no row locking | **PARTIALLY FIXED.** Still no `FOR UPDATE SKIP LOCKED`, but the outbox now has retry/backoff: `processing_status` (`pending`/`retrying`/`failed`), `attempts`, `next_attempt_at`, and `mark_retry` with exponential backoff (`event_repository.py`). |
| 10 | Daily assessment: sequential per-lead | **PARTIALLY FIXED.** The N+1 was eliminated — email stats and latest-inbound timestamps are now batch-fetched in 2 queries (`main.py:daily_lead_assessment`), and only leads passing `needs_assessment` (never scored / decay changed / missed event) are processed. The per-lead sequential `run_lead_assessment` loop remains (no `Semaphore`/parallelism). |
| 11 | SSE in-memory, per-org, single-worker | **STILL ACTIVE.** `event_bus.py` + `stream.py` unchanged. |
| 12 | GmailClient new httpx client per call | **STILL ACTIVE.** `gmail_client.py:123,144,154`. |
| 13 | Notification polling every 20s | **STILL ACTIVE.** `useNotifications.ts:25`. |
| 14 | Dashboard `/me` — "9 concurrent queries" | **CORRECTED.** `/dashboard/me` (`sales_rep_command_center`) runs **11 sequential** queries. The code contains a comment documenting that `asyncio.gather` on a single session raised "concurrent operations are not permitted" and the method was reverted to sequential. |
| 15 | Pagination COUNT subquery (was LIKELY) | **UPGRADED to CONFIRMED.** `pagination.py` still renders `SELECT count(*) FROM (SELECT …)`. The docstring claims it avoids the subquery pattern, but `select_from(query)` on a full `Select` still wraps it in a subquery. |
| 16 | Fire-and-forget `create_task` untracked | **PARTIALLY FIXED.** Tasks are now tracked in a module-level `_background_tasks` set with `add_done_callback(discard)` (`email_service.py:53,426-570,1138`). Still no concurrency cap (Semaphore) and still lost on restart. |
| 17 | `admin_kpi` already parallelized | **CONFIRMED (8 gathers)** — and it documents the required workaround: `await self.db.connection()` before `asyncio.gather` to avoid the asyncpg "another operation is in progress" race. |

### New findings at HEAD `4449dac` (not in the original audit)

1. **Supabase Storage uses the synchronous `supabase` client inside async endpoints** (`backend/app/api/v1/documents.py:26-66,127,158,188`). `get_supabase().storage.from_(...).upload() / create_signed_url() / download() / remove()` are blocking HTTP calls made directly on the event loop — every document upload/download freezes the entire backend for the duration of the storage round-trip. Fix: wrap in `asyncio.to_thread()`, or call the Supabase Storage REST API via an async httpx client. (See Section 11.1.)
2. **`DIRECT_URL` (session-mode, port 5432) now exists in config and `render.yaml`, but the app engine ignores it.** Wiring `DIRECT_URL` into the engine with `QueuePool` implements the Phase-2 fix (MT-1) with zero new infrastructure — Alembic already uses it. (See Section 6.1.)
3. **The dashboard parallelization recommendation must be qualified.** `sales_rep_command_center` documents that naive `asyncio.gather` on a single `AsyncSession` fails with "concurrent operations are not permitted". Parallelizing requires the pre-checkout `await self.db.connection()` pattern (as `admin_kpi` does) or separate sessions; otherwise the safer win is combining COUNT queries with `FILTER (WHERE ...)`. (See Sections 6.3/6.4.)

---

## 1. Executive Summary

PULSE-CRM is a multi-tenant sales CRM built on a **Next.js 16** frontend (Vercel), a **FastAPI** backend (Render free tier), a separate **FastAPI AI microservice** (Render free tier), **Supabase PostgreSQL**, and **Gmail/Google Pub/Sub** integration. It includes lead scoring, AI summarization (Groq LLM), real-time SSE, an event-outbox pattern, and APScheduler background jobs.

The application has serious, systemic performance problems that compound under load:

1. **NullPool against the Supabase pooler** means every single request opens a brand-new TCP+TLS+auth database connection (30–80ms tax per request, CONFIRMED). This is the single largest latency source.
2. **Every authenticated request triggers a DB query** for the full user + roles (`get_current_user`), adding another round-trip on top of the NullPool cost.
3. **Dashboard endpoints issue 13–16 sequential database queries** in methods like `manager_kpi` (633 lines, 16 sequential `db.execute` calls, zero `asyncio.gather`).
4. **The Gmail Pub/Sub webhook synchronously processes the entire history sync inside the HTTP response** — fetching messages one-by-one (no `batchGet`) and blocking the event loop.
5. **The AI service's `/conversations/summarise` and `/draft-email` endpoints are `def` (synchronous), not `async def`** — they make blocking Groq LLM calls that freeze the entire AI service event loop for 2–30 seconds per call.
6. **The in-process event bus and SSE subscribers are in-memory only** — they cannot survive restarts, don't work across multiple workers, and the SSE channel is per-organization (all users in an org share one queue).
7. **The daily lead assessment batch job calls `run_lead_assessment` sequentially for every lead** in every organization — each call does ~4–8 DB queries plus an HTTP call to the AI service, all in a single async loop with no parallelism. *(Partially fixed since the original audit: email stats and inbound timestamps are now batch-fetched, and only leads passing `needs_assessment` are processed — see §0.)*
8. **Render free tier** means cold starts: the backend and AI service spin down after inactivity, so the first request after idle takes 30–60 seconds.

### Estimated current latency profile (single user, warm)

| Flow | Estimated p50 | Estimated p99 | Dominant cost |
|------|--------------|---------------|---------------|
| Login | ~400ms | ~2s | bcrypt on event loop + NullPool connect |
| Dashboard load (`/me`) | ~300ms | ~2s | 11 sequential queries on one session (gather reverted) |
| Dashboard load (`/sales-rep`) | ~1.5s | ~8s | 13 sequential DB queries + AI service cold start |
| Dashboard load (`/manager`) | ~2s | ~10s | 16 sequential DB queries |
| Lead list (20 items) | ~200ms | ~1s | 2 queries (well-eager-loaded) + NullPool |
| Lead detail | ~150ms | ~800ms | NullPool connect |
| Gmail webhook sync (10 messages) | ~5s | ~30s | 10 sequential `get_message` calls + AI summarize |
| AI summarization | ~2–5s | ~30s | Blocking Groq call on AI service event loop |

All times are **ESTIMATED** from static code analysis. Real measurement requires the instrumentation described in Section 24.

---

## 2. Complete System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         USER (Browser)                                  │
│  Next.js 16 App (Vercel)                                                │
│  ├── sessionStorage JWT (access + refresh)                              │
│  ├── In-flight GET dedup + 60s response cache (api.ts)                  │
│  ├── SSE: fetch-based EventSource → /api/v1/stream/dashboard            │
│  ├── Polling: notifications every 20s (useNotifications.ts)             │
│  └── No SWR/React Query — custom fetch + manual useState/useEffect      │
└──────────────────────┬──────────────────────────────────────────────────┘
                       │ HTTPS
┌──────────────────────▼──────────────────────────────────────────────────┐
│  BACKEND (Render free tier, single uvicorn worker)                      │
│  FastAPI async                                                          │
│  ├── Middleware stack: RequestID → Logging → SecurityHeaders            │
│  │   → AuthRateLimit (in-memory token bucket)                          │
│  │   → RateLimit (in-memory token bucket)                               │
│  │   → GZip → PrivateNetwork → CORS                                     │
│  ├── Auth: JWT (HS256), get_current_user does DB query per request      │
│  ├── DB: SQLAlchemy 2.0 async (asyncpg)                                │
│  │   NullPool when using Supabase pooler (:6543)                        │
│  ├── APScheduler:                                                      │
│  │   - Event outbox worker (every 30s)                                  │
│  │   - Daily lead assessment (midnight cron)                            │
│  │   - Gmail watch refresh (every 6h)                                  │
│  ├── Event bus: in-process asyncio.Queue + subscriber set               │
│  ├── SSE endpoint: /stream/dashboard (in-memory subscriber per org)    │
│  ├── Gmail: httpx async client, Pub/Sub push webhook                   │
│  ├── AI client: shared httpx.AsyncClient → AI service                  │
│  ├── Storage: local filesystem (uploads/) + Supabase Storage           │
│  │   (sync `supabase` client called directly in async routes)          │
│  └── DIRECT_URL (5432) defined but only used by Alembic migrations     │
└──────┬──────────────────┬───────────────────┬──────────────────────────┘
       │                  │                   │
       ▼                  ▼                   ▼
┌──────────────┐  ┌──────────────┐  ┌────────────────────┐
│ Supabase PG  │  │ AI Service   │  │ Google APIs       │
│ (pooler      │  │ (Render free │  │ - OAuth2           │
│  :6543)      │  │  tier)       │  │ - Gmail API       │
│              │  │ FastAPI      │  │ - Pub/Sub push    │
│ Tables:      │  │ ├── Scoring  │  └────────────────────┘
│ - leads      │  │   (rule-based│
│ - deals      │  │    sync)     │
│ - emails     │  │ ├── Recs     │
│ - lead_scores│  │ ├── Conv AI   │
│ - feature_   │  │ │  (Groq LLM │
│    vectors   │  │ │   sync def!)│
│ - event_     │  │ └── Rising   │
│    outbox    │  │    interest   │
│ - notifs     │  │               │
│ - activities │  │ Groq:         │
│ - + 20 more  │  │ llama-3.3-70b │
└──────────────┘  └──────────────┘
```

### Components

| Component | Technology | Hosting | Scaling concern |
|-----------|-----------|---------|-----------------|
| Frontend | Next.js 16 (App Router), React 19, Tailwind 4 | Vercel | Auto-scaled (serverless functions) |
| Backend | FastAPI, SQLAlchemy 2.0 async, asyncpg | Render free tier | Single worker, cold starts |
| AI service | FastAPI, Groq SDK | Render free tier | Single worker, cold starts, sync endpoints |
| Database | Supabase PostgreSQL (PgBouncer pooler) | Supabase | Connection limits on free tier |
| Background jobs | APScheduler (in-process) | Render backend process | Lost on restart, single-worker only |
| Real-time | SSE via StreamingResponse | Render backend process | In-memory, single-worker only |
| Email/SMTP | Brevo (smtp-relay.brevo.com) | External | N/A |
| Storage | Local filesystem (`uploads/`) + Supabase Storage for documents | Render ephemeral disk + Supabase bucket | Local uploads lost on redeploy; documents persisted |

---

## 3. Request / Data Flow

### 3.1 Synchronous request flow (dashboard load)

```
User clicks Dashboard
  ↓
Frontend: useDashboardOverview hook
  → GET /api/v1/dashboard/me (cached 5 min client-side, 60s api cache)
  ↓
Network: HTTPS to Render backend (~50ms Vercel→Render, but +30-60s if cold start)
  ↓
Backend middleware stack:
  RequestID → Logging → SecurityHeaders → AuthRateLimit → RateLimit
  → GZip → PrivateNetwork → CORS
  (~2-5ms middleware overhead, but in-memory rate limiter allocates per-IP buckets)
  ↓
Auth: get_current_user dependency
  → decode JWT (CPU, ~0.1ms)
  → UserRepository.get_by_id_with_roles(user_id)
    → DB query: SELECT user + JOIN user_roles + JOIN roles
    → NullPool opens NEW connection: TCP + TLS + auth (~30-80ms)
    → Execute query (~2-5ms)
    → Connection released (closed, not pooled)
  ↓
Dashboard endpoint handler
  → DashboardService.sales_rep_command_center()
    → 11 sequential db.execute calls on ONE shared session/connection
      (asyncio.gather was tried and reverted — asyncpg raises
      "concurrent operations are not permitted" on a shared connection)
    → Each query: ~2-5ms, serialized → Total: ~11 × 15ms incl. RTT = ~150ms DB time
  ↓
Pydantic response serialization (~5-20ms for nested models)
  ↓
GZip compression (~1-2ms)
  ↓
Response → Frontend
  ↓
Frontend: setState → React re-render of dashboard widgets
  (~10-50ms depending on widget count)
```

### 3.2 Asynchronous / event-driven flows

**Gmail inbound email → AI assessment:**

```
Google Pub/Sub push → POST /api/v1/gmail/pubsub/webhook
  ↓
Webhook handler (SYNCHRONOUS — blocks HTTP response):
  1. Decode base64 message data
  2. Query GmailConnection by email_address (DB)
  3. Refresh OAuth token if expired (HTTP to Google)
  4. _incremental_sync_from_gmail:
     a. list_history (Gmail API) — sequential pages
     b. For EACH message_id: get_message (Gmail API) — SEQUENTIAL, one-by-one
     c. ingest_email (DB insert)
     d. If lead-linked: asyncio.create_task(_summarize_and_assess)
  5. db.commit()
  6. Return "OK" (HTTP 200)
  ↓
Background task (_summarize_and_assess, fire-and-forget):
  → Open NEW DB session
  → Fetch thread emails from DB
  → Call AI service: POST /conversations/summarise
    → AI service (SYNC def!): Groq LLM call (2-30s, blocks event loop)
    → Parse JSON response
  → Save EmailSummary
  → run_lead_assessment:
    → Gather lead data (5-8 DB queries)
    → Call AI service: POST /leads/assess
    → Persist lead_scores, recommendations, feature_vectors (3 DB writes)
```

**Event outbox processing (every 30s):**

```
APScheduler → process_event_outbox
  ↓
EventWorker.run_once(batch_size=50):
  1. Open DB session
  2. SELECT * FROM event_outbox WHERE status='pending' LIMIT 50
     (NO FOR UPDATE SKIP LOCKED — concurrent workers would duplicate)
  3. For each event (sequential):
     a. TimelineProjectionConsumer.handle() → DB insert
     b. NotificationConsumer.handle() → DB insert
     c. EmailProjectionConsumer.handle() → no-op (just logs)
     d. LoggingConsumer.handle() → logs
     e. event_bus.publish() → in-memory queue + SSE subscriber push
     f. mark_processed() → DB update
  4. db.commit()
```

---

## 4. Performance Hotspots (ranked)

### P0 — Critical

| # | Hotspot | Location | Impact |
|---|---------|----------|--------|
| 1 | NullPool = new DB connection per request | `connection.py:51-59` | 30-80ms added to EVERY request; pooler exhaustion at scale |
| 2 | `get_current_user` DB query on every request | `deps.py:33-50` | Extra round-trip on every authenticated request |
| 3 | AI service sync endpoints blocking event loop | `conversation_router.py:30,55` | LLM call freezes entire AI service for 2-30s |
| 4 | Dashboard `manager_kpi`: 16 sequential queries | `dashboard_service.py` | 2-10s dashboard load |
| 5 | Gmail webhook blocks on full sync | `gmail.py:pubsub_webhook` | Pub/Sub redelivery storms; event loop blocked |

### P1 — High

| # | Hotspot | Location | Impact |
|---|---------|----------|--------|
| 6 | Gmail messages fetched one-by-one (no batchGet) | `email_service.py:1033` | N × 200-400ms per sync |
| 7 | bcrypt `verify_password` on event loop | `auth_service.py:140` | ~250-400ms CPU blocking all coroutines |
| 8 | In-memory rate limiter (not Redis) | `rate_limit.py:63` | Per-worker only, unbounded memory growth |
| 9 | Event outbox: no row locking | `event_worker.py:run_once` | Duplicate processing with multiple workers |
| 10 | Daily assessment: sequential AI calls per lead | `main.py:daily_lead_assessment` | Hours of sequential processing; no parallelism |
| 11 | SSE: org-level channel, in-memory only | `stream.py`, `event_bus.py` | No multi-worker, all org users share one queue |
| 12 | GmailClient creates new httpx client per call | `gmail_client.py:_post,_get` | No connection reuse for Gmail API |

### P2 — Medium

| # | Hotspot | Location | Impact |
|---|---------|----------|--------|
| 13 | Notification polling every 20s | `useNotifications.ts:17` | 3 req/min per active tab, even if idle |
| 14 | `get_db` auto-commits on every request (even reads) | `connection.py:85` | Unnecessary commit overhead on GET endpoints |
| 15 | Pagination wraps query in COUNT subquery | `pagination.py` | Extra full-count scan on every page |
| 16 | Conversation intelligence N+1: `get_entity_signals` per row | `conversation_intelligence_service.py` | N+1 in list views |
| 17 | `asyncio.create_task` fire-and-forget in email ingest | `email_service.py:548-564` | Lost on restart, no error tracking, unbounded |
| 18 | Heavy frontend deps: three.js, framer-motion, recharts | `package.json` | Large JS bundle, slow initial load |
| 19 | `useDashboardOverview` has `data` in useCallback deps | `use-dashboard.ts:53` | Refetch callback changes on every data update |
| 20 | Forecast service: 6-month + 4-quarter sequential loops | `forecast_service.py` | 10 sequential queries for forecast view |

---

## 5. Frontend Performance Analysis

### 5.1 No data-fetching library (CONFIRMED)

**WHERE:** `frontend/src/utils/api.ts`, all hooks in `frontend/src/hooks/`

**WHAT:** The app uses a hand-rolled `apiFetch` wrapper with `sessionStorage` tokens, manual `useState`/`useEffect` patterns, a 60-second GET cache (`_getCache`), and in-flight request deduplication (`_inflight`). There is no SWR, React Query, or similar library.

**WHY it matters:** No automatic background refetch on reconnect, no request deduplication across remounted components beyond the basic `_inflight` map, no optimistic updates, no garbage collection of cache entries. The `_getCache` Map grows unbounded — entries are only evicted on error.

**Impact:** Returning to a dashboard tab after navigating away triggers a full re-fetch every time (unless within 60s cache window). No stale-while-revalidate pattern means users see loading spinners on every navigation.

**Fix:** Adopt TanStack Query (React Query). It provides caching, dedup, background refetch, and stale-while-revalidate out of the box. Migrate `useDashboardOverview`, `useNotifications`, `useCurrentUser` to use `useQuery`.

**Trade-offs:** Adds ~13KB to bundle. Requires refactoring all hooks. But eliminates the custom cache/dedup code entirely.

### 5.2 Notification polling every 20 seconds (CONFIRMED)

**WHERE:** `frontend/src/hooks/useNotifications.ts:25` — `const POLL_INTERVAL_MS = 20000;`

**WHAT:** `useNotifications` sets up a `setInterval` that calls `refresh()` every 20 seconds. Each poll calls `getNotifications(1, 20)` which hits `GET /api/v1/notifications?page=1&page_size=20`. The app already has an SSE connection (`useCrmStream`) that could push notification events.

**WHY it's wasteful:** With 100 active users each keeping a tab open, that's 100 × 3 = 300 requests/minute just for notification polling. Each request goes through the full middleware stack + `get_current_user` DB query + NullPool connection. The SSE stream already delivers real-time events — the polling is redundant.

**Impact:** 3 req/min/user of pure waste. At 1000 users = 50 req/s just for notifications.

**Fix:** Replace polling with SSE-driven updates. The event bus already publishes notification events; the SSE stream should deliver them. Keep a single initial fetch on mount, then rely on SSE for updates. Fall back to polling only if SSE is disconnected.

### 5.3 `useDashboardOverview` — stale closure in useCallback (CONFIRMED)

**WHERE:** `frontend/src/hooks/use-dashboard.ts:56` — `}, [data]);`

**WHAT:** The `fetch` callback depends on `data` in its dependency array. Every time `data` changes (after a successful fetch), the `fetch` function is recreated. The `refetch` callback depends on `fetch`, so it also changes. Any component consuming `refetch` will re-render.

**WHY it matters:** The `useEffect` at line 65 has `[]` deps (with eslint-disable), so it won't re-run — but any child components receiving `refetch` as a prop will re-render unnecessarily.

**Fix:** Remove `data` from the dependency array. Use a ref (`dataRef`) to check freshness inside the callback.

### 5.4 Heavy bundle dependencies (CONFIRMED)

**WHERE:** `frontend/package.json`

**WHAT:** The bundle includes:
- `three` + `@react-three/fiber` (~600KB minified) — 3D library, used for what?
- `framer-motion` + `motion` (both! ~100KB) — redundant; `motion` is the successor to `framer-motion`
- `recharts` (~400KB) — chart library
- `@dnd-kit/core` + `@dnd-kit/sortable` — drag-and-drop
- `embla-carousel-react` — carousel
- `fuse.js` — fuzzy search (client-side)

**WHY it matters:** `three` alone can add 500KB+ to the initial bundle. If 3D is only used on a marketing page, it should be dynamically imported. Having both `framer-motion` and `motion` is redundant.

**Impact:** Estimated 1.5–2.5MB initial JS bundle. On 3G/mobile, that's 5-10 seconds of TTI.

**Fix:** Audit which pages actually use `three`/`@react-three/fiber`. If only on landing/marketing pages, use `next/dynamic` to lazy-load. Remove `motion` if `framer-motion` is sufficient (or vice versa). Consider `next/dynamic` for `recharts` on dashboard pages.

### 5.5 SSE connection management (CONFIRMED — good)

**WHERE:** `frontend/src/hooks/use-crm-stream.ts`

**WHAT:** The SSE hook uses `fetch` with `ReadableStream` (not native `EventSource`) to send the JWT via Authorization header. It has proper cleanup on unmount (`AbortController.abort()`), exponential backoff (2s→30s), and 500ms debounce on invalidation events.

**Assessment:** This is well-implemented. The only concern is that it creates one SSE connection per component that uses it (if multiple components call `useCrmStream`). Should be singleton.

### 5.6 `useCurrentUser` duplicate fetch on profile-updated event (CONFIRMED)

**WHERE:** `frontend/src/hooks/useCurrentUser.ts:49-91`

**WHAT:** The hook listens for a `pulse-profile-updated` custom event (line 79) and calls `run()` which does `getCurrentUser()` → `GET /api/v1/auth/me`. The `load()` function (line 49) does the same. Both are defined and both can fire (e.g. avatar upload triggers both `load()` via `refresh()` and the event listener).

**Fix:** Consolidate to a single fetch path. Use a ref to deduplicate.

---

## 6. Backend Performance Analysis

### 6.1 NullPool — new DB connection per request (P0, CONFIRMED)

**WHERE:** `backend/app/database/connection.py:51-59`

**WHAT:** When `DATABASE_URL` contains `pooler` or `:6543` (Supabase pooler), the engine uses `NullPool`. Every `AsyncSessionFactory()` checkout opens a new physical connection (TCP + TLS + asyncpg auth) and closes it on release.

**WHY it's slow:** A pooled connection checkout is ~0.2-1ms. A fresh connect to Supabase over TLS is 30-80ms. Every request pays this tax before its first query runs. The comment acknowledges this is deliberate (to avoid PgBouncer transaction-state desync), but it trades correctness for massive per-request latency.

**Impact at scale:**
- 1 user: +40ms per request (imperceptible)
- 10 users: +40ms each; DB CPU rises from constant connect/auth
- 100 users: Supabase pooler backend connections churn; p95 climbs sharply
- 1000 users: pooler exhausts backend connections; new connects fail with `too many connections`

**Fix:** Connect to Supabase using **session-mode** pooler (port 5432) instead of transaction-mode (port 6543). Session-mode maintains a dedicated backend connection per client connection, so SQLAlchemy's `QueuePool` works correctly with `pool_pre_ping=True`. Use `pool_size=10, max_overflow=5` (conservative for Supabase free tier's ~60 connection limit). This eliminates the per-request connection setup cost entirely.

**⚠ 2026-08-13 update:** `DIRECT_URL` (session-mode, port 5432) is now defined in `config.py` and `render.yaml` and used by Alembic (`alembic/env.py`), but `connection.py` still builds the engine exclusively from `DATABASE_URL`. Wiring the engine to `DIRECT_URL` with `QueuePool` implements this fix with zero new infrastructure.

If you must stay on transaction-mode pooler: use `NullPool` but add a **read replica** or **connection-side caching** (e.g., Supabase's connection pooler with `prepared statement cache` enabled). But the real fix is session-mode.

**Trade-offs:** Session-mode pooler uses more backend connections (one per app connection, not multiplexed). With `pool_size=10`, that's 10 persistent backend connections — well within Supabase limits. The trade-off is correctness (no transaction-state issues) + speed (no reconnect) at the cost of slightly more DB memory per idle connection.

**Verification:** Add timing instrumentation around `engine.connect()` — measure `time.monotonic()` before and after. Compare p50/p95 connection acquisition time before and after the change. Target: <5ms p95.

### 6.2 `get_current_user` DB query on every request (P0, CONFIRMED)

**WHERE:** `backend/app/api/deps.py:33-50`

**WHAT:** The `get_current_user` dependency calls `UserRepository.get_by_id_with_roles(UUID(user_id))` on every authenticated request. This does a `SELECT` with `JOIN user_roles` and `JOIN roles`. Combined with NullPool, this means every request does: (1) open connection (30-80ms) + (2) execute user+roles query (2-5ms) + (3) close connection.

**WHY it's slow:** The user record and its roles change rarely (maybe once per session). Yet we query them on every single API call.

**Impact:** Adds a full DB round-trip (including connection setup with NullPool) to every authenticated request. At 100 concurrent users, that's 100 concurrent user-lookup queries all competing for fresh connections.

**Fix:** Decode the JWT payload and extract roles/permissions from the token itself (they're already signed). Issue JWTs that include `roles` and `permissions` claims. On token refresh, re-query and re-encode. Use a short-lived in-memory cache (e.g., `cachetools.TTLCache` with 60s TTL, keyed by user_id) as an intermediate step if you don't want to change the JWT structure.

```python
_user_cache = TTLCache(maxsize=1000, ttl=60)

async def get_current_user(credentials, db):
    payload = decode_access_token(credentials.credentials)
    user_id = payload["sub"]
    if user_id in _user_cache:
        return _user_cache[user_id]
    user = await user_repo.get_by_id_with_roles(UUID(user_id))
    _user_cache[user_id] = user
    return user
```

**Trade-offs:** 60s staleness on role/permission changes. If a user is deactivated, they can still act for up to 60s. Acceptable for most CRM operations. For critical operations (role changes, password changes), clear the cache entry.

**Verification:** Log `get_current_user` execution time. Before: 30-85ms. After: <0.1ms on cache hit, 30-85ms on miss (~1/60 requests).

### 6.3 Dashboard `manager_kpi`: 16 sequential queries (P0, CONFIRMED)

**WHERE:** `backend/app/services/dashboard_service.py` — `manager_kpi` method (633 lines)

**WHAT:** The `manager_kpi` method issues 16 `db.execute` calls with **zero** `asyncio.gather` calls. Each query is sequential — the next doesn't start until the previous completes. With NullPool, each query also may involve connection overhead (though within a single session, the connection is reused for the session's lifetime).

**WHY it's slow:** 16 sequential DB round-trips, each ~2-10ms query time + network latency to Supabase (~10-20ms RTT). Total: 16 × 15ms = ~240ms minimum, likely 1-3s in practice.

**Impact:** Manager dashboard takes 2-10 seconds to load. At 10 concurrent managers, all 160 queries compete for DB connections.

**Fix:** Group independent queries into `asyncio.gather()` calls. The `admin_kpi` method already does this correctly (8 gather calls) — replicate that pattern, **but note the constraint below**. Even better, combine COUNT queries into a single query using `CASE WHEN` or `UNION ALL`:
```sql
SELECT
  COUNT(*) FILTER (WHERE status='active') AS active_leads,
  COUNT(*) FILTER (WHERE status='won') AS won_leads,
  COUNT(*) FILTER (WHERE priority_tier='high') AS high_priority
FROM leads WHERE organization_id = :org_id
```
This collapses 3-5 COUNT queries into 1.

**Trade-offs:** Combined queries are harder to read and maintain. But the latency improvement is worth it. Add comments explaining each column.

**⚠ 2026-08-13 caveat (important):** You cannot simply wrap `db.execute` calls on the **same** `AsyncSession` in `asyncio.gather`. asyncpg raises `concurrent operations are not permitted` (see the comment in `sales_rep_command_center`, lines ~2758, which documents that gather was attempted and reverted). `admin_kpi` makes it work by first calling `await self.db.connection()` to pre-checkout the connection before gathering. Alternatives: use one session per gather branch (costs extra NullPool connections), or prefer the combined `FILTER (WHERE ...)` COUNT queries, which are single-statement and avoid the problem entirely.

### 6.4 `sales_rep_kpi`: 827 lines, 13 sequential queries (P1, CONFIRMED)

**WHERE:** `backend/app/services/dashboard_service.py` — `sales_rep_kpi` method (lines ~1784-2611)

**WHAT:** 827-line method with 13 `db.execute` calls and only 1 `asyncio.gather`. Revenue-by-company-size loop (5 queries), activity-heatmap loop (5 queries), plus daily/quarterly/yearly/monthly revenue loops.

**Fix:** Same as 6.3 — `asyncio.gather` for independent queries, `FILTER (WHERE ...)` for COUNT aggregation.

### 6.5 `get_db` auto-commits on every request, including reads (P2, CONFIRMED)

**WHERE:** `backend/app/database/connection.py:85` — `await session.commit()`

**WHAT:** The `get_db` dependency always commits after yielding the session, even for GET (read-only) requests. This adds an unnecessary `COMMIT` round-trip to every read endpoint.

**Fix:** Make the commit conditional — only commit if the session has pending changes (`session.in_transaction()` and `session.is_modified()`), or split into `get_db_read` (no commit) and `get_db_write` (commit) dependencies.

**Trade-offs:** Read-only sessions are simpler. Need to ensure write endpoints use the write dependency.

### 6.6 bcrypt password verification on the event loop (P1, CONFIRMED)

**WHERE:** `backend/app/services/auth_service.py:140` — `verify_password(payload.password, user.hashed_password or "")`

**WHAT:** `verify_password` calls `passlib`'s bcrypt verifier directly in the async `login` method. Bcrypt (12 rounds) takes ~250-400ms of CPU. This blocks the event loop — no other coroutine can execute during this time.

**Impact:** During a login, all other in-flight requests are blocked for 250-400ms. At 10 concurrent logins (unlikely but possible), each waits 250-400ms × 10 = 2.5-4 seconds.

**Fix:** Wrap in `asyncio.to_thread()`:
```python
password_valid = await asyncio.to_thread(
    verify_password, payload.password, user.hashed_password or ""
)
```

**Trade-offs:** Uses a thread from the default `ThreadPoolExecutor` (limited to ~40 threads). Fine for login volume. If password verification is needed at high volume (unlikely), consider a dedicated thread pool.

### 6.7 In-memory rate limiter (P1, CONFIRMED)

**WHERE:** `backend/app/middlewares/rate_limit.py:63` — `self._buckets: dict[str, _TokenBucket] = defaultdict(...)`

**WHAT:** The active middleware uses in-memory `defaultdict`-based token buckets. There IS a Redis-backed `RedisRateLimiter` in `core/rate_limiter.py`, but `main.py` wires the in-memory middleware, not the Redis one.

**WHY it matters:**
1. Rate limits are per-worker only. With multiple uvicorn workers, each worker has its own bucket — a user can make `RATE_LIMIT_PER_MINUTE × num_workers` requests per minute.
2. The `_buckets` dict grows unbounded — every unique IP gets an entry that never expires. Over days/weeks, this is a memory leak.
3. On Render free tier (single worker), this is less severe but still a leak.

**Fix:** Wire the Redis-backed limiter (`core/rate_limiter.py`) when REDIS_URL is available, falling back to in-memory for dev. Add a cleanup sweep (periodic task that removes entries older than 2 minutes).

**Trade-offs:** Adds Redis as a dependency. The Redis limiter already gracefully degrades to "allow" if Redis is down.

### 6.8 Pagination wraps query in COUNT subquery (P2, CONFIRMED)

**WHERE:** `backend/app/utils/pagination.py`

**WHAT:** CONFIRMED — `paginate()` still executes `select(func.count()).select_from(query)` where `query` is a full `Select`, which SQLAlchemy renders as `SELECT COUNT(*) FROM (SELECT ... )`. The DB executes the full filtered query (including JOINs) just to count rows, on every page. Note the docstring claims this "avoid[s] the expensive subquery-to-subquery pattern" — that is incorrect; the subquery wrap is still emitted. The one mitigation: the base queries passed in are typically simple single-table selects, so the wrap is cheap for unfiltered small tables but grows with filter complexity.

**Fix:** For list endpoints where exact count isn't needed, use a "has more" cursor-based approach (fetch `page_size + 1` rows; if you got N+1, there's a next page). For endpoints where exact count is needed, ensure the COUNT query uses covering indexes. Cache the count for a short TTL (30s) since it doesn't need to be real-time.

---

## 7. Database Performance Analysis

### 7.1 Connection pool configuration

**Current state (CONFIRMED):**
- NullPool when using Supabase pooler (every request = new connection)
- If direct connection: `pool_size=25, max_overflow=20, pool_timeout=20s, pool_recycle=300s`
- `statement_cache_size=0` (asyncpg prepared statements disabled for pooler compatibility)
- `pool_pre_ping=True` (adds a `SELECT 1` before every checkout)

**Analysis:** The NullPool configuration is the root cause of the connection problem. Even with the direct-connection QueuePool, `pool_pre_ping=True` adds a `SELECT 1` round-trip before every checkout, which is unnecessary if `pool_recycle` is set correctly (connections are recycled before they go stale).

**Supabase free tier limits:** ~60 max connections. With NullPool, every active request holds a connection for the full request duration. At 60 concurrent requests, you're at the limit. With QueuePool(pool_size=10), you'd use 10 persistent connections with multiplexing.

### 7.2 Missing `FOR UPDATE SKIP LOCKED` in event worker (P1, CONFIRMED)

**WHERE:** `backend/app/repositories/event_repository.py` — `list_pending` method

**WHAT:** The event outbox worker's `list_pending` does `SELECT ... WHERE processing_status IN ('pending','retrying') ... LIMIT 50` without any row locking. If multiple workers run (future scaling), they'll all fetch the same 50 events and process them in parallel — duplicate notifications, duplicate timeline entries.

**⚠ 2026-08-13 update:** The outbox now has retry/backoff machinery that didn't exist at the original audit: `processing_status` (`pending`/`retrying`/`failed`), `attempts`, `next_attempt_at`, and `mark_retry` with exponential backoff (`2 ** attempts` minutes, up to 5 attempts). This improves reliability but does not fix the missing row locking.

**Fix:** Add `WITH FOR UPDATE SKIP LOCKED` to the query:
```python
stmt = select(EventOutbox).where(...).limit(batch_size).with_for_update(skip_locked=True)
```
And process within a transaction so the locks are held until commit.

### 7.3 Foreign key indexes (LIKELY — need verification)

The migration files show several index additions (`20260811_0001_add_performance_indexes.py`, `20260810_0001_add_company_email_phone_duplicate_indexes.py`), which suggests the team is aware of index needs. However, need to verify:
- `emails.organization_id` + `external_entity_id` + `external_entity_type` composite index (used in email stats queries)
- `emails.thread_id` index (used in thread lookups)
- `lead_scores.lead_id` + `organization_id` composite index
- `activities.entity_id` + `entity_type` composite index

**Verification:** Run `pg_stat_statements` on Supabase to find the slowest queries, then `EXPLAIN ANALYZE` on each to check for seq scans.

### 7.4 Email stats queries (LIKELY)

**WHERE:** `backend/app/services/email_analytics.py` — `get_lead_email_stats`, `batch_get_lead_email_stats`

**WHAT:** These methods likely run `COUNT(*)` + `MAX(sent_at)` queries on the `emails` table filtered by `organization_id`, `external_entity_id`, `direction`, and `is_active`. Without a composite index on `(organization_id, external_entity_id, direction, is_active, sent_at)`, these will seq-scan on large tables.

**Fix:** Create a composite index:
```sql
CREATE INDEX idx_emails_org_entity_dir_sent
ON emails (organization_id, external_entity_id, direction, sent_at DESC)
WHERE is_active = true;
```

---

## 8. AI/ML Performance Analysis

### 8.1 AI service endpoints are `def` (sync), not `async def` (P0, CONFIRMED)

**WHERE:** `ai-service/app/routers/conversation_router.py:30,55`

```python
@router.post("/summarise", ...)
def summarise(payload: ConversationRequest) -> ConversationResponse:  # SYNC!

@router.post("/draft-email", ...)
def draft_email(payload: DraftEmailRequest) -> DraftEmailResponse:  # SYNC!
```

**WHAT:** Both AI service conversation endpoints are defined as `def` (synchronous), not `async def`. FastAPI runs sync endpoints in a threadpool (limited to ~40 threads). But the `summarise_thread` function calls `_get_client().chat.completions.create(...)` which is the **synchronous** Groq SDK — it blocks the thread for 2-30 seconds.

**WHY it's catastrophic:** With a 40-thread pool, 40 concurrent summarization requests will exhaust the threadpool. The 41st request will wait until one completes. At 40 × 5s average = 200 seconds of backlog. Worse: the Groq call is a blocking HTTP call, so the thread is idle-waiting, not computing.

**Impact:**
- 1 user: ~2-5s per summarization (fine)
- 10 concurrent: ~2-5s each (fine, 10 threads used)
- 40 concurrent: ~2-5s each (threadpool full but OK)
- 41+ concurrent: requests queue, p99 jumps to minutes

**Fix:** 
1. Change endpoints to `async def`.
2. Use the **async** Groq client (`groq.AsyncGroq`) instead of `groq.Groq`.
3. Or use `httpx.AsyncClient` to call the Groq API directly with async.

```python
from groq import AsyncGroq
_async_client = AsyncGroq(api_key=...)

@router.post("/summarise")
async def summarise(payload: ConversationRequest) -> ConversationResponse:
    ...
    response = await _async_client.chat.completions.create(...)
```

**Note:** The backend's `groq_summary_provider.py` (line 49) already uses `asyncio.to_thread` to wrap the sync Groq call — this is a band-aid, not a real fix. It uses a thread, but at least doesn't block the backend's event loop. The AI service has no such protection.

**⚠ 2026-08-13 update:** The sync-`def` pattern is broader than originally documented — `lead_router.py` endpoints `/assess` and `/score` are also `def` (synchronous). They are rule-based (no LLM call), so they don't block for seconds, but they still occupy FastAPI's threadpool (default ~40 threads) and add thread-switching overhead to every assessment call.

### 8.2 Scoring service is purely synchronous rule-based (CONFIRMED — OK for now)

**WHERE:** `ai-service/app/services/scoring_service.py`

**WHAT:** The `score_lead` function is synchronous, but it's pure Python computation (no I/O, no LLM calls). It computes fit features, engagement features, and overall score from deterministic rules. This is fast (<1ms).

**Assessment:** This is fine. The scoring is rule-based and doesn't need to be async. However, the scoring is called via HTTP from the backend (`ai_client.py:assess_lead`), adding network round-trip latency. For rule-based scoring that doesn't need a separate service, consider moving it into the backend to eliminate the HTTP call entirely.

### 8.3 AI assessment pipeline — sequential DB + HTTP (P2, CONFIRMED)

**WHERE:** `backend/app/services/ai_pipeline.py:run_lead_assessment`

**WHAT:** The pipeline does:
1. `lead_repo.get_active_by_id` (DB query 1)
2. `deal_repo.get_by_lead_id_in_org` (DB query 2)
3. `email_svc.get_lead_email_stats` (DB query 3)
4. `_fetch_latest_intent` (DB query 4, if no intent passed)
5. `ai_client.assess_lead` (HTTP to AI service — 50ms-30s)
6. `score_repo.upsert_for_lead` (DB write 5)
7. `rec_repo.upsert_for_lead` (DB write 6)
8. `workflow_service.sync_from_recommendation` (DB write 7)
9. `fv_repo.upsert_for_lead` (DB write 8)

Steps 1-4 are sequential DB queries that could be parallelized with `asyncio.gather`. Steps 6-9 are sequential writes that could potentially be batched.

**Fix:** Parallelize the data-gathering phase:
```python
lead, deal, email_stats, intent = await asyncio.gather(
    lead_repo.get_active_by_id(lead_id, org_id),
    deal_repo.get_by_lead_id_in_org(lead_id, org_id),
    email_svc.get_lead_email_stats(lead_id, org_id),
    _fetch_latest_intent(db, lead_id) if not intent else _return_none(),
)
```

### 8.4 Daily assessment calls AI sequentially for every lead (P1, PARTIALLY FIXED)

**WHERE:** `backend/app/main.py:daily_lead_assessment`

**WHAT:** The daily batch job loops over every organization, then every lead in that organization, calling `run_lead_assessment` sequentially. Each call still does ~4-8 DB queries + 1 HTTP call to the AI service.

**⚠ 2026-08-13 update:** The N+1 queries were eliminated. The job now (a) batch-fetches email stats for all leads in one query (`EmailStatsService.batch_get_lead_email_stats`), (b) batch-fetches latest inbound timestamps in one query, and (c) only calls `run_lead_assessment` for leads that pass `needs_assessment` (never scored, decay changed, or missed a newer inbound event). For an org with 1000 leads where most are fresh, the daily job now mostly does 2 cheap queries + a handful of assessments. **The per-lead loop is still fully sequential — no `Semaphore`/`asyncio.gather` — so a large backlog (or a slow AI service) still serializes into hours.**

**Fix:** Use `asyncio.gather` with bounded concurrency (`asyncio.Semaphore(10)`) to process leads in parallel batches of 10:
```python
sem = asyncio.Semaphore(10)
async def assess_with_limit(lead_id):
    async with sem:
        await run_lead_assessment(db_new, lead_id, org_id, ...)
await asyncio.gather(*[assess_with_limit(lid) for lid in lead_ids_needing_assessment])
```

**Trade-offs:** Higher DB connection usage (10 concurrent sessions). With NullPool, that's 10 concurrent connections to Supabase — acceptable. Need to ensure the AI service can handle 10 concurrent requests (it can't currently — see 8.1).

### 8.5 No caching of AI results (P2, CONFIRMED)

**WHERE:** `ai_pipeline.py` — every assessment call goes to the AI service, even if nothing changed.

**WHAT:** There's no check whether the input data has changed since the last assessment. If a lead's data hasn't changed, the assessment will produce the same result. The daily assessment job does check `needs_assessment` (decay change, missed events), but on-demand triggers (lead updated) always re-run the full pipeline.

**Fix:** Add a hash of the input `raw_data` dict to the `feature_vectors` table. Before calling the AI service, compute the hash and skip if it matches the stored hash (unless forced).

---

## 9. Network Performance Analysis

### 9.1 GmailClient creates a new httpx client per API call (P1, CONFIRMED)

**WHERE:** `backend/app/services/gmail_client.py:_post` and `_get` methods

**WHAT:** Every Gmail API call creates a new `httpx.AsyncClient`:
```python
async with httpx.AsyncClient(timeout=settings.AI_TIMEOUT) as client:
    response = await client.post(...)
```

This means no HTTP connection reuse, no keepalive, no connection pooling. Every Gmail API call does TCP+TLS handshake to `gmail.googleapis.com`.

**WHY it's slow:** TLS handshake to Google APIs: ~100-200ms. With 10 messages to fetch: 10 × 200ms = 2s just in handshakes.

**Fix:** Create a shared `httpx.AsyncClient` singleton (like `ai_client.py` does):
```python
_shared_gmail_client: httpx.AsyncClient | None = None

def _get_gmail_client() -> httpx.AsyncClient:
    global _shared_gmail_client
    if _shared_gmail_client is None or _shared_gmail_client.is_closed:
        _shared_gmail_client = httpx.AsyncClient(
            timeout=settings.AI_TIMEOUT,
            limits=httpx.Limits(max_connections=20, max_keepalive_connections=10),
        )
    return _shared_gmail_client
```

### 9.2 Backend → AI service: HTTP call for rule-based scoring (P2, LIKELY)

**WHERE:** `backend/app/services/ai_pipeline.py:120` — `ai_client.assess_lead(str(lead_id), raw_data)`

**WHAT:** The assessment pipeline calls the AI service over HTTP even when `AI_PROVIDER=rule_based` (the default). The AI service's scoring is pure Python rules — no model inference. This adds a network round-trip (50-200ms to Render + back, or 30-60s on cold start) for work that could be done in-process.

**Fix:** When `SCORING_PROVIDER=rule_based`, run the scoring logic in-process (import the rules directly into the backend). Reserve the HTTP call for LLM-based summarization/drafting. This eliminates 50-200ms (or 30-60s on cold start) from every assessment.

### 9.3 Render free tier cold starts (P0, CONFIRMED — infrastructure)

**WHERE:** `render.yaml` — `plan: free` for both backend and AI service

**WHAT:** Render's free tier spins down web services after 15 minutes of inactivity. The next request must cold-start the service, which takes 30-60+ seconds (Python startup + module imports + DB connection + AI service health check).

**Impact:** Every first request after 15 minutes of idle takes 30-60 seconds. This is catastrophic for UX. The startup health check (`main.py:lifespan`) also calls the AI service, which might itself be cold-starting — compounding the delay.

**Fix:** Upgrade to Render's paid tier (which keeps services warm), or move to a platform that doesn't spin down (Fly.io, Railway, a VPS). Alternatively, set up an external uptime monitor (e.g., UptimeRobot) that pings the health endpoint every 10 minutes to keep the service warm.

**Trade-offs:** Paid tier costs money. UptimeRobot pinging is a hack that wastes compute. The right answer is to use a platform designed for always-on availability.

---

## 10. Gmail / Google / PubSub Analysis

### 10.1 Pub/Sub webhook processes entire sync synchronously (P0, CONFIRMED)

**WHERE:** `backend/app/api/v1/gmail.py:pubsub_webhook` (lines ~135-185)

**WHAT:** The webhook handler:
1. Decodes the Pub/Sub message
2. Looks up the GmailConnection
3. Refreshes the OAuth token (HTTP to Google)
4. Calls `_incremental_sync_from_gmail` or `fetch_from_gmail`
5. Commits the DB transaction
6. Returns "OK"

All of this happens synchronously within the HTTP response. Google Pub/Sub expects a quick 200 response (within ~10 seconds); if it doesn't get one, it redelivers the message.

**WHY it's slow:** The sync involves listing history, fetching each message individually, ingesting into the DB, and potentially triggering AI summarization. For 10 messages, this takes 5-30 seconds. The webhook holds the response open for the entire duration.

**Impact:** At 100 concurrent Pub/Sub notifications (e.g., a burst of emails to multiple users), the single Render worker is overwhelmed — each request takes 5-30s, and they're all competing for the event loop. Pub/Sub redelivers, compounding the load.

**Fix:** Decouple acknowledgement from processing:
```python
@router.post("/pubsub/webhook")
async def pubsub_webhook(request_body: dict, background_tasks: BackgroundTasks):
    # Parse and validate
    ...
    # Enqueue processing as a background task
    background_tasks.add_task(process_gmail_sync, connection_id, history_id)
    return HTMLResponse("OK", status_code=200)  # Ack immediately
```

**⚠ 2026-08-13 update:** The webhook now wraps all processing in try/except and **always returns 200** (including on sync failure), so Pub/Sub won't redeliver on application errors. This is an improvement, but the full sync (token refresh → `list_history` → N× `get_message` → DB ingest → AI summarization) still executes inside the HTTP request, blocking the event loop and holding the connection. The decoupling fix above remains the right target.

Or better: write the `(connection_id, history_id)` to a Postgres `gmail_sync_queue` table, and have a background worker process it with `FOR UPDATE SKIP LOCKED`.

**Trade-offs:** Background processing means errors are invisible to the webhook caller. Need a dead-letter queue and monitoring. But the latency improvement is essential.

### 10.2 Messages fetched one-by-one, no `batchGet` (P1, CONFIRMED)

**WHERE:** `backend/app/services/email_service.py:1033` — `msg = await self.gmail_client.get_message(access_token, message_id)`

**WHAT:** For each message ID in the history diff, the code makes a separate `GET /gmail/v1/users/me/messages/{id}` call. Gmail's API supports `POST /gmail/v1/users/me/messages/batchGet` which can fetch up to 1000 messages in one call.

**WHY it's slow:** N messages = N sequential HTTPS round-trips to Google. Each takes 100-400ms. 20 messages = 2-8 seconds.

**Fix:** Collect all message IDs first, then batch-fetch:
```python
# Instead of:
for msg_id in message_ids:
    msg = await self.gmail_client.get_message(access_token, msg_id)

# Do:
messages = await self.gmail_client.batch_get_messages(access_token, message_ids)
```

Implement `batch_get_messages` in `gmail_client.py` using Gmail's batchGet endpoint. Process in chunks of 50-100 to avoid oversized responses.

### 10.3 No webhook idempotency at notification level (P1, CONFIRMED)

**WHERE:** `backend/app/api/v1/gmail.py:pubsub_webhook`

**WHAT:** There's no deduplication at the Pub/Sub notification level. The only dedup is at the message level (`ingest_email` checks if a message with the same `gmail_message_id` already exists). But a redelivered notification still re-runs the entire `list_history` + `get_message` calls before hitting the message-level dedup.

**Fix:** Store processed `(connection_id, history_id)` pairs in a `processed_gmail_notifications` table with a unique constraint. On receiving a notification, check if this `history_id` has already been processed — if so, return 200 immediately without any Google API calls.

### 10.4 OAuth token refresh in request path (P2, LIKELY)

**WHERE:** `backend/app/services/email_service.py:_access_token_for_connection`

**WHAT:** Every time a Gmail API call is needed, the code checks if the access token is expired and refreshes it if so. This refresh is an HTTP call to Google's OAuth endpoint. With the `GmailClient` creating a new `httpx.AsyncClient` per call (see 9.1), this is even slower.

**Fix:** Cache the access token in memory with its expiry time. Only refresh when the cached token is within 5 minutes of expiry. Share the cached token across all requests for the same connection.

---

## 11. Async / Concurrency Analysis

### 11.1 Event loop blocking operations (CONFIRMED)

| Operation | Location | Blocking time | Fix |
|-----------|----------|---------------|-----|
| bcrypt `verify_password` | `auth_service.py:140` | 250-400ms | `asyncio.to_thread()` |
| Groq LLM call (backend) | `groq_summary_provider.py:35` | 2-30s | Already uses `to_thread` ✓ |
| Groq LLM call (AI service) | `conversation_service.py` | 2-30s | Use `AsyncGroq` |
| Supabase Storage upload/download/signed-URL (sync `supabase` client) | `documents.py:60,127,158,188` | 50-500ms | `asyncio.to_thread()` or async httpx to Storage REST API |
| `json.dumps` on large responses | Various endpoints | 5-50ms | Acceptable |

### 11.2 Sequential operations that could be concurrent (CONFIRMED)

| Operation | Location | Sequential calls | Fix |
|-----------|----------|------------------|-----|
| Dashboard KPI queries | `dashboard_service.py` | 13-16 | `asyncio.gather` |
| AI pipeline data gathering | `ai_pipeline.py:run_lead_assessment` | 4 | `asyncio.gather` |
| Daily assessment loop | `main.py:daily_lead_assessment` | N leads | `Semaphore` + `gather` |
| Gmail message fetching | `email_service.py:1033` | N messages | `batchGet` |
| Forecast loops | `forecast_service.py` | 6+4 | `asyncio.gather` |
| Event outbox processing | `event_worker.py:run_once` | 50 events | Acceptable (sequential within transaction) |

### 11.3 `asyncio.create_task` fire-and-forget in email ingest (P2, CONFIRMED)

**WHERE:** `backend/app/services/email_service.py:548-564`

**WHAT:** When an inbound email is ingested, the code fires `asyncio.create_task(self._summarize_and_assess(...))` or `asyncio.create_task(self._safe_summarize(...))`. These tasks:
1. Are not tracked — if the process restarts, they're lost
2. Have no error handling beyond a try/except inside
3. Can accumulate unboundedly if many emails arrive at once
4. Share the main event loop, competing with user requests

**Fix:** Instead of `create_task`, enqueue the work to the event outbox or a proper task queue. The outbox pattern is already in place — just add "EMAIL_SUMMARIZE" and "LEAD_ASSESS" event types.

### 11.4 Concurrency behavior at scale

| Concurrent users | What happens | First bottleneck |
|-----------------|-------------|-----------------|
| 1 | Everything works, ~200ms-2s per page | None |
| 10 | Fine if warm; AI service cold start causes timeouts | AI service cold start |
| 50 | NullPool connection setup starts dominating; rate limiter buckets grow | DB connection churn |
| 100 | Supabase pooler connection limits hit; dashboard queries queue | DB connections |
| 1000 | System unusable — connection exhaustion, event loop blocked by sync ops | Everything simultaneously |

---

## 12. Real-Time / SSE / WebSocket Analysis

### 12.1 SSE: in-memory, per-organization, single-worker (P1, CONFIRMED)

**WHERE:** `backend/app/api/v1/stream.py`, `backend/app/services/event_bus.py`

**WHAT:** The SSE endpoint creates an `asyncio.Queue` subscriber on the `org_events_{org_id}` channel. The event bus maintains a `dict[str, set[asyncio.Queue]]` of subscribers. When an event is published, it does `q.put_nowait(event)` for each subscriber.

**Problems:**
1. **In-memory only:** If the process restarts, all SSE connections are dropped and all queued events are lost.
2. **Single-worker only:** If you scale to multiple uvicorn workers, events published on worker A won't reach subscribers on worker B.
3. **Per-organization, not per-user:** All users in the same org share one channel. If user A's lead is scored, user B receives the event too (and may trigger an unnecessary dashboard refetch).
4. **`asyncio.QueueFull` silently drops events:** If a subscriber is slow to consume, `put_nowait` raises `QueueFull` and the event is lost (line: `except asyncio.QueueFull: pass`).
5. **Unbounded subscriber set:** The `_subscribers` dict grows with each subscription and only removes on explicit `unsubscribe`. If a client disconnects without the `finally` block executing (e.g., process crash), the subscriber leaks.

**Fix for multi-worker:** Replace the in-memory event bus with Redis Pub/Sub. Each worker subscribes to Redis channels. Events are published to Redis, and each worker fans out to its local SSE subscribers. This is the standard pattern for multi-process SSE.

**Fix for per-user filtering:** Include the `user_id` in the event envelope and filter on the SSE endpoint before sending to the client. Or use per-user channels (`org_events_{org_id}_{user_id}`).

### 12.2 SSE keepalive every 15 seconds (CONFIRMED — reasonable)

**WHERE:** `stream.py:51` — `asyncio.wait_for(subscriber.get(), timeout=15.0)`

**WHAT:** If no event arrives within 15 seconds, the server sends a `: keepalive\n\n` comment frame. This prevents proxy/load-balancer timeouts.

**Assessment:** 15 seconds is reasonable. Some proxies (e.g., nginx) have a 60s default timeout, so 15s is well within the safe range.

### 12.3 Frontend SSE handling (CONFIRMED — good)

The frontend `useCrmStream` hook properly:
- Uses `fetch` with `ReadableStream` (can set Authorization header)
- Cleans up on unmount with `AbortController`
- Reconnects with exponential backoff (2s → 30s)
- Debounces invalidation events (500ms window)

The only issue: it doesn't deduplicate across multiple hook instances. If two components both call `useCrmStream()`, they create two SSE connections.

---

## 13. Memory / Resource Analysis

### 13.1 Rate limiter buckets grow unbounded (CONFIRMED)

**WHERE:** `backend/app/middlewares/rate_limit.py:63,135,139`

**WHAT:** The `_buckets` defaultdicts never evict entries. Every unique client IP gets a `_TokenBucket` that persists forever. Over weeks of operation, this can accumulate thousands of entries.

**Impact after:**
- 1 hour: ~100 entries (negligible)
- 24 hours: ~2,000 entries (~200KB, negligible)
- 7 days: ~10,000 entries (~1MB, still small but growing)

**Fix:** Add a periodic cleanup that removes entries whose bucket was last accessed >2 minutes ago. Or use `cachetools.TTLCache` with a 2-minute TTL.

### 13.2 Event bus subscriber set can leak (CONFIRMED)

**WHERE:** `backend/app/services/event_bus.py`

**WHAT:** If the SSE generator's `finally` block doesn't execute (e.g., due to an unhandled exception or process crash), the subscriber queue remains in the `_subscribers` set forever. The queue will accumulate events (consuming memory) until the process restarts.

**Fix:** Add a heartbeat check in the event bus: periodically iterate subscribers and check if their queue size exceeds a threshold (e.g., 1000 events). If so, remove them (the SSE client is likely dead).

### 13.3 `_getCache` and `_inflight` Maps in frontend grow unbounded (POSSIBLE)

**WHERE:** `frontend/src/utils/api.ts`

**WHAT:** The `_getCache` Map stores cached GET responses. Entries are only removed on error. If the user navigates to many different API endpoints, entries accumulate.

**Impact:** After extended use, the Map could hold hundreds of cached responses. Each is a Promise that may hold large JSON data. Over hours of use, this could consume significant browser memory.

**Fix:** Use an LRU cache with a max size (e.g., 50 entries). Or adopt React Query which handles this automatically.

### 13.4 Fire-and-forget `asyncio.create_task` tasks (PARTIALLY FIXED)

**WHERE:** `backend/app/services/email_service.py:53,426-570,1138`

**WHAT:** `asyncio.create_task` spawns background tasks for summarization/assessment. **⚠ 2026-08-13 update:** tasks are now tracked in a module-level `_background_tasks: set[asyncio.Task]` with `task.add_done_callback(_background_tasks.discard)` — this prevents GC of in-flight tasks and removes them on completion. However, there is **still no concurrency limit** (Semaphore) and no durability.

**Impact:** A burst of 100 emails → 100 concurrent AI service calls → AI service threadpool exhaustion (see 8.1) → timeouts → cascading failures.

**Fix:** Use `asyncio.Semaphore` to limit concurrent background tasks, or enqueue to the event outbox for durable processing.

---

## 14. API Design Analysis

### 14.1 Dashboard endpoints do too much (CONFIRMED)

**WHERE:** `backend/app/api/v1/dashboard.py`

**WHAT:** The dashboard API has multiple variants:
- `/dashboard/me` — sales rep dashboard (9 concurrent queries)
- `/dashboard/sales-rep` — detailed sales rep KPIs (13 sequential queries)
- `/dashboard/manager` — manager dashboard (16 sequential queries)
- `/dashboard/admin` — admin dashboard (7 queries with 8 gathers)

Each returns a massive JSON payload with dozens of fields. The frontend makes one call per dashboard view.

**Problem:** The endpoints are monolithic — changing one widget requires re-fetching all data. The sequential query pattern makes them slow.

**Fix:**
1. Split into widget-level endpoints: `/dashboard/kpis`, `/dashboard/revenue-trend`, `/dashboard/activity-heatmap`, etc.
2. Let the frontend fetch widgets in parallel (it already has in-flight dedup).
3. Or keep the monolithic endpoint but parallelize all queries with `asyncio.gather` and use combined `FILTER (WHERE ...)` COUNT queries.

### 14.2 `get_db` always returns a session even for health checks (POSSIBLE)

**WHERE:** `backend/app/api/v1/health.py`

**WHAT:** If the health endpoint uses `DBSession` dependency, it opens a NullPool connection just to return `{status: "ok"}`.

**Fix:** Health check should not depend on `get_db`. Use a simple `SELECT 1` on the engine directly without a full session.

---

## 15. Architecture Analysis

### 15.1 AI service separation — is it justified? (LIKELY — partially)

The AI service is a separate microservice, but:
- The scoring is pure rule-based Python (no model inference)
- The only LLM usage is Groq (external API call, not local model)
- The backend already has a `groq_summary_provider.py` that calls Groq directly

**Assessment:** The AI service separation adds a network round-trip (50-200ms, or 30-60s cold start) for rule-based computation that could run in-process. The separation is justified **only** for LLM-based summarization (to isolate blocking calls), but even that is handled via `asyncio.to_thread` in the backend already.

**Recommendation:** Move rule-based scoring into the backend (eliminate the HTTP call). Keep the AI service only for LLM calls (summarization, draft emails) if you want isolation. Or eliminate the AI service entirely and use `asyncio.to_thread` for Groq calls in the backend.

### 15.2 Event outbox + in-process event bus — redundant? (CONFIRMED)

The system has both:
1. An **event outbox** (durable, DB-backed, processed by APScheduler every 30s)
2. An **in-process event bus** (asyncio.Queue, immediate dispatch)

The outbox worker dispatches to the in-process bus after processing. This means events go through two hops: DB → outbox worker → in-process bus → SSE subscriber. The in-process bus adds no durability (it's in-memory) and no multi-worker support.

**Recommendation:** The in-process bus should be used only for SSE fan-out (real-time push). The outbox should handle all durable side-effects (notifications, timeline projections). They're already somewhat separated, but the `event_bus.publish()` call in `event_worker.py:_dispatch_outbox_event` is redundant with the outbox's own processing.

### 15.3 Background job architecture (CONFIRMED — fragile)

APScheduler runs in-process. If the process crashes or restarts:
- In-flight event outbox processing is lost (but events remain in DB, so they'll be processed on next run)
- Gmail watch refresh is lost (runs every 6h, so next run is up to 6h away)
- Daily lead assessment is lost (runs at midnight, so next run is 24h away)

**Fix:** For critical jobs, use a durable task queue (Celery, RQ, or even Postgres-based `SKIP LOCKED` queue). At minimum, add `misfire_grace_time` and `coalesce=True` to APScheduler jobs.

---

## 16. Top 20 Performance Problems

| Rank | Priority | Location | Problem | Impact |
|------|----------|----------|---------|--------|
| 1 | P0 | `connection.py:51-59` | NullPool opens new DB connection per request | +30-80ms every request |
| 2 | P0 | `conversation_router.py:30,55` | AI service sync endpoints block event loop on LLM calls | Freezes AI service 2-30s |
| 3 | P0 | `deps.py:33-50` | `get_current_user` queries DB on every request | Extra round-trip per request |
| 4 | P0 | `dashboard_service.py:manager_kpi` | 16 sequential DB queries | 2-10s dashboard load |
| 5 | P0 | `gmail.py:pubsub_webhook` | Webhook blocks on full Gmail sync | Pub/Sub redelivery storms |
| 6 | P1 | `email_service.py:1033` | Messages fetched one-by-one, no batchGet | N × 200ms per sync |
| 7 | P1 | `auth_service.py:140` | bcrypt on event loop | 250-400ms event-loop block |
| 8 | P1 | `rate_limit.py:63` | In-memory rate limiter, unbounded growth | Per-worker only, memory leak |
| 9 | P1 | `event_repository.py` | No `FOR UPDATE SKIP LOCKED` in outbox worker *(retry/backoff added since audit — §7.2)* | Duplicate processing with multi-worker |
| 10 | P1 | `main.py:daily_lead_assessment` | Sequential AI calls per lead *(N+1 batch queries fixed since audit; loop still sequential — §8.4)* | Hours of processing if backlog |
| 11 | P1 | `stream.py`, `event_bus.py` | SSE: in-memory, per-org, single-worker | No horizontal scaling |
| 12 | P1 | `gmail_client.py:_post,_get` | New httpx client per Gmail API call | No connection reuse |
| 13 | P1 | `dashboard_service.py:sales_rep_kpi` | 13 sequential queries, 827-line method | 1-8s dashboard load |
| 14 | P2 | `useNotifications.ts:17` | Polling every 20s despite SSE being available | 3 req/min wasted per user |
| 15 | P2 | `connection.py:85` | Auto-commit on read-only requests | Unnecessary COMMIT per GET |
| 16 | P2 | `ai_pipeline.py:run_lead_assessment` | Sequential DB queries in data-gathering phase | 4 sequential round-trips |
| 17 | P2 | `email_service.py:53,426-570` | Fire-and-forget `create_task` without limits *(tasks now tracked in `_background_tasks` set — §13.4)* | Unbounded concurrent AI calls |
| 18 | P2 | `package.json` | Heavy deps (three.js, framer-motion + motion, recharts) | Large bundle, slow initial load |
| 19 | P2 | `groq_summary_provider.py:35` | Sync Groq client in backend (via to_thread) | Thread pool pressure |
| 20 | P3 | `render.yaml` | Render free tier cold starts | 30-60s first request after idle |

---

## 17. Root Cause Analysis

### Why is this application slow?

The application is slow for **five root causes**, each compounding the others:

**Root Cause 1: NullPool eliminates connection reuse (infrastructure-level).**
The Supabase pooler's transaction-mode multiplexing is incompatible with SQLAlchemy's connection pool, so the developers disabled pooling entirely. This means every request pays the full connection setup cost (TCP + TLS + auth = 30-80ms). This single decision adds 30-80ms to every single API call.

**Root Cause 2: Synchronous patterns in async code (code-level).**
The AI service uses synchronous `def` endpoints for LLM calls, blocking the entire event loop. The backend uses bcrypt directly on the event loop. The Gmail webhook processes the entire sync synchronously. These patterns turn single slow operations into system-wide stalls.

**Root Cause 3: Sequential database queries instead of concurrent ones (code-level).**
Dashboard endpoints issue 13-16 sequential database queries where `asyncio.gather` could execute them concurrently. The daily assessment job processes leads sequentially. The AI pipeline gathers data sequentially. Each sequential query adds its full RTT to the response time.

**Root Cause 4: No caching of expensive, rarely-changing data (architecture-level).**
User roles are queried from the DB on every request. Rule-based scores are recomputed via HTTP calls even when input data hasn't changed. Gmail OAuth tokens are re-fetched per call. No Redis, no in-memory cache, no HTTP cache headers.

**Root Cause 5: Single-process deployment with cold starts (infrastructure-level).**
Render's free tier spins down after 15 minutes, causing 30-60s cold starts. The in-memory event bus and SSE subscribers can't scale beyond a single worker. Background jobs run in-process and are lost on restart.

---

## 18. Recommended Fixes

(Detailed in Sections 19-21 below, organized by implementation phase)

---

## 19. Quick Wins (Phase 1 — Low effort, high impact)

### QW-1: Move bcrypt to thread pool
- **File:** `backend/app/services/auth_service.py:140`
- **Change:** `password_valid = await asyncio.to_thread(verify_password, payload.password, user.hashed_password or "")`
- **Effort:** 1 line
- **Impact:** Prevents 250-400ms event-loop block on every login
- **Risk:** None
- **Validation:** Measure event-loop lag during concurrent logins

### QW-2: Parallelize AI pipeline data gathering
- **File:** `backend/app/services/ai_pipeline.py:run_lead_assessment`
- **Change:** Replace sequential `lead_repo.get_active_by_id` + `deal_repo.get_by_lead_id_in_org` + `email_svc.get_lead_email_stats` + `_fetch_latest_intent` with `asyncio.gather`
- **Effort:** ~15 lines
- **Impact:** Reduces assessment data-gathering from 4 sequential round-trips to 1
- **Risk:** Low — queries are independent
- **Validation:** Time `run_lead_assessment` before/after

### QW-3: Cache `get_current_user` with TTL
- **File:** `backend/app/api/deps.py`
- **Change:** Add `cachetools.TTLCache(maxsize=1000, ttl=60)` for user lookups
- **Effort:** ~10 lines
- **Impact:** Eliminates DB query on 59/60 authenticated requests
- **Risk:** 60s staleness on role/permission changes
- **Validation:** Log cache hit/miss ratio

### QW-4: Use shared httpx client for GmailClient
- **File:** `backend/app/services/gmail_client.py`
- **Change:** Replace per-call `httpx.AsyncClient()` with a shared singleton (like `ai_client.py`)
- **Effort:** ~15 lines
- **Impact:** Eliminates TLS handshake overhead on Gmail API calls
- **Risk:** None
- **Validation:** Measure Gmail API call latency

### QW-5: Don't commit on read-only requests
- **File:** `backend/app/database/connection.py:85`
- **Change:** Only `await session.commit()` if `session.in_transaction()` and there are pending changes
- **Effort:** ~5 lines
- **Impact:** Eliminates unnecessary COMMIT on every GET request
- **Risk:** Low — ensure write endpoints still commit
- **Validation:** DB query count per request (should drop by 1 on reads)

### QW-6: Fix AI service endpoints to `async def`
- **File:** `ai-service/app/routers/conversation_router.py:30,55`
- **Change:** `def summarise(...)` → `async def summarise(...)` and `def draft_email(...)` → `async def draft_email(...)`
- **Effort:** 2 words
- **Impact:** Prevents threadpool exhaustion; allows concurrent LLM calls
- **Risk:** Need to also make the Groq client async (`AsyncGroq`)
- **Validation:** Load test with 50 concurrent summarization requests

### QW-7: Add `FOR UPDATE SKIP LOCKED` to event outbox
- **File:** `backend/app/repositories/event_repository.py`
- **Change:** Add `.with_for_update(skip_locked=True)` to the `list_pending` query
- **Effort:** 1 line
- **Impact:** Prevents duplicate processing with multiple workers
- **Risk:** None
- **Validation:** Run two workers concurrently, verify no duplicate processing

---

## 20. Medium-Term Improvements (Phase 2 — Moderate development)

### MT-1: Switch to session-mode Supabase pooler or direct connection with QueuePool
- **File:** `backend/app/database/connection.py`
- **Change:** Use Supabase session-mode pooler (port 5432) or direct connection. Use `QueuePool(pool_size=10, max_overflow=5, pool_pre_ping=True, pool_recycle=300)`. Remove NullPool.
- **Impact:** Eliminates 30-80ms per-request connection setup cost. This is the single biggest win.
- **Risk:** Uses more backend DB connections (10 persistent). Must verify Supabase connection limits.
- **Validation:** Measure connection acquisition time (should be <5ms p95)

### MT-2: Parallelize dashboard queries with `asyncio.gather`
- **File:** `backend/app/services/dashboard_service.py` — `manager_kpi`, `sales_rep_kpi`
- **Change:** Wrap independent `db.execute` calls in `asyncio.gather`. Combine COUNT queries using `FILTER (WHERE ...)`.
- **Impact:** Reduces dashboard load from 2-10s to ~200-500ms
- **Risk:** Moderate — need to identify which queries are truly independent
- **Validation:** Time dashboard endpoints before/after; check query counts

### MT-3: Decouple Gmail Pub/Sub webhook from sync processing
- **File:** `backend/app/api/v1/gmail.py:pubsub_webhook`
- **Change:** Return 200 immediately after parsing. Enqueue sync work to a `gmail_sync_queue` table. Add a background worker (or APScheduler job running every 5s) that processes the queue with `FOR UPDATE SKIP LOCKED`.
- **Impact:** Eliminates Pub/Sub redelivery storms; webhook responds in <100ms
- **Risk:** Errors are invisible to webhook caller; need monitoring
- **Validation:** Measure webhook response time; verify no Pub/Sub redeliveries

### MT-4: Implement Gmail `batchGet` for message fetching
- **File:** `backend/app/services/gmail_client.py`, `email_service.py`
- **Change:** Add `batch_get_messages(access_token, message_ids)` method. Replace the per-message `get_message` loop with batched calls (chunks of 50).
- **Impact:** Reduces N × 200ms to N/50 × 200ms (100x for 100 messages)
- **Risk:** Large batch responses; chunk and handle errors per-batch
- **Validation:** Time sync with 50 messages before/after

### MT-5: Replace notification polling with SSE-driven updates
- **File:** `frontend/src/hooks/useNotifications.ts`
- **Change:** Remove `setInterval(refresh, 20000)`. Listen for notification events on the SSE stream. Keep initial fetch on mount only.
- **Impact:** Eliminates 3 req/min/user of wasted polling
- **Risk:** Notifications delayed if SSE disconnects; add polling fallback on SSE failure
- **Validation:** Monitor API request count per user (should drop by ~3/min)

### MT-6: Add webhook idempotency for Gmail Pub/Sub
- **File:** New `processed_gmail_notifications` table; `gmail.py:pubsub_webhook`
- **Change:** Store processed `(connection_id, history_id)` pairs. Short-circuit duplicate notifications.
- **Impact:** Eliminates duplicate Gmail API calls on redelivery
- **Risk:** Table grows; add TTL cleanup (Gmail history IDs valid ~1 week)
- **Validation:** Send duplicate Pub/Sub notifications; verify second one is a no-op

### MT-7: Move rule-based scoring into the backend
- **File:** New `backend/app/services/rule_scoring.py` (port from `ai-service/app/rules/`)
- **Change:** When `SCORING_PROVIDER=rule_based`, compute scores in-process instead of HTTP-calling the AI service.
- **Impact:** Eliminates 50-200ms (or 30-60s cold start) from every assessment
- **Risk:** Code duplication if AI service still needs the rules; extract to a shared package
- **Validation:** Time assessment before/after

### MT-8: Rate limiter cleanup + Redis wiring
- **File:** `backend/app/middlewares/rate_limit.py`, `backend/app/core/rate_limiter.py`
- **Change:** When REDIS_URL is set, use `RedisRateLimiter` instead of in-memory. Add periodic cleanup of stale in-memory buckets.
- **Impact:** Correct rate limiting across workers; bounded memory
- **Risk:** Redis dependency; graceful degradation needed
- **Validation:** Test rate limiting with 2 workers

---

## 21. Long-Term Architecture Improvements (Phase 3 — Scalability)

### LT-1: Replace in-memory event bus with Redis Pub/Sub
- **Impact:** SSE works across multiple workers; events survive process restarts
- **Effort:** Significant — rewrite `event_bus.py`, update `stream.py`
- **Risk:** Redis becomes a critical dependency; need HA Redis

### LT-2: Migrate background jobs to a durable task queue
- **Impact:** Jobs survive restarts; can scale workers independently; proper retry/DLQ
- **Options:** Celery + Redis, RQ, or Postgres-based `SKIP LOCKED` queue
- **Effort:** Moderate — extract job definitions, add worker process

### LT-3: Move off Render free tier
- **Impact:** No cold starts; can run multiple workers; proper autoscaling
- **Options:** Render paid, Fly.io, Railway, AWS ECS, a VPS
- **Effort:** Configuration only

### LT-4: Adopt TanStack Query on the frontend
- **Impact:** Proper caching, dedup, stale-while-revalidate, background refetch
- **Effort:** Refactor all hooks, but the patterns are straightforward

### LT-5: Add read replica for dashboard/report queries
- **Impact:** Offloads heavy read queries from the primary DB
- **Effort:** Supabase read replicas (available on paid plans); route read-only endpoints to replica

### LT-6: Implement cursor-based pagination for large lists
- **Impact:** Eliminates COUNT queries; constant-time pagination regardless of offset
- **Effort:** Moderate — change all list endpoints and frontend pagination components

---

## 22. Benchmarking Strategy

### What to measure

| Metric | What it tells you | Tool |
|--------|-------------------|------|
| Request latency (p50/p95/p99) | Overall API responsiveness | FastAPI middleware + Prometheus, or Datadog |
| DB query latency | Which queries are slow | SQLAlchemy event listeners, `pg_stat_statements` |
| DB connection acquisition time | NullPool cost | `time.monotonic()` around `AsyncSessionFactory()` |
| External API latency | Gmail/AI service call time | httpx event hooks, or wrap with timing |
| AI latency | LLM call duration | Custom timing in `ai_pipeline.py` |
| Queue/outbox latency | Event processing delay | Timestamp on `event_outbox.created_at` vs `processed_at` |
| Frontend page load | TTFB, FCP, TTI | Vercel Analytics, Lighthouse |
| Frontend API timing | Per-request latency | `performance.now()` in `apiFetch` |
| Memory usage | Leak detection | `psutil`, Render metrics |
| CPU usage | Saturation | Render metrics, `psutil` |
| Event-loop lag | Blocking detection | `asyncio` debug mode, `aiomonitor` |
| Error rate | Reliability | Structured logging + Sentry |

### Specific instrumentation to add

```python
# 1. Request timing middleware (already exists in RequestLoggingMiddleware — verify it logs latency)
# 2. DB query timing:
from sqlalchemy import event

@event.listens_for(engine.sync_engine, "before_cursor_execute")
def before_execute(conn, cursor, statement, parameters, context, executemany):
    context._query_start_time = time.monotonic()

@event.listens_for(engine.sync_engine, "after_cursor_execute")
def after_execute(conn, cursor, statement, parameters, context, executemany):
    duration = time.monotonic() - context._query_start_time
    if duration > 0.1:  # Log slow queries (>100ms)
        logger.warning("Slow query %.3fs: %s", duration, statement[:200])

# 3. Connection acquisition timing:
async def get_db():
    t0 = time.monotonic()
    async with AsyncSessionFactory() as session:
        t1 = time.monotonic()
        if t1 - t0 > 0.05:  # Log slow acquisitions (>50ms)
            logger.warning("Slow DB session acquisition: %.3fs", t1 - t0)
        ...
```

### Tools

| Tool | Purpose | Cost |
|------|---------|------|
| `pg_stat_statements` | Supabase built-in; slowest queries | Free |
| Sentry | Error tracking + performance | Free tier |
| Grafana Cloud | Metrics + dashboards | Free tier |
| Lighthouse CI | Frontend performance | Free |
| Locust / k6 | Load testing | Free |
| `aiomonitor` | Async introspection | Free |

---

## 23. Load Testing Strategy

### Test matrix

| Test | Endpoint/Flow | Concurrent users | RPS target | Expected p50 | Expected p95 | Expected p99 | Error rate target |
|------|--------------|-----------------|------------|-------------|-------------|-------------|-------------------|
| L1 | `GET /health` | 1 | 1 | <50ms | <100ms | <200ms | 0% |
| L2 | `GET /health` | 100 | 100 | <100ms | <500ms | <1s | 0% |
| L3 | `POST /auth/login` | 10 | 2 | ~400ms | ~1s | ~2s | 0% |
| L4 | `GET /dashboard/me` | 1 | 1 | ~300ms | ~2s | ~5s | 0% |
| L5 | `GET /dashboard/me` | 50 | 10 | ~500ms | ~3s | ~8s | <1% |
| L6 | `GET /dashboard/manager` | 10 | 2 | ~2s | ~5s | ~10s | <5% |
| L7 | `GET /leads?page=1` | 100 | 20 | ~200ms | ~1s | ~3s | <1% |
| L8 | `GET /leads?page=1` | 500 | 50 | ~500ms | ~3s | ~10s | <5% |
| L9 | `POST /gmail/pubsub/webhook` | 100 | 20 | <200ms* | <1s* | <5s* | 0% |
| L10 | `POST /ai/summarise` | 50 | 5 | ~3s | ~10s | ~30s | <10% |
| L11 | Mixed (dashboard + leads + notifications) | 100 | 30 | ~500ms | ~5s | ~15s | <5% |

*L9 targets assume webhook is decoupled (Phase 2 MT-3). Current implementation would time out.

### How to identify the bottleneck from results

1. **p50 high but p99 ≈ p50:** Systemic bottleneck (e.g., NullPool connection cost). All requests are equally slow.
2. **p50 low but p99 >> p50:** Contention (e.g., DB connection pool exhaustion under load). Some requests wait for resources.
3. **Error rate spikes at high concurrency:** Resource exhaustion (connections, memory, threadpool). Check DB connection count and error logs.
4. **Latency increases linearly with concurrency:** Sequential processing (e.g., dashboard queries). The server can't parallelize work.
5. **Latency jumps suddenly at a threshold:** Pool exhaustion (e.g., NullPool + Supabase connection limit at ~60).

### Load test execution

```bash
# k6 script example for dashboard load test
k6 run --vus 50 --duration 60s dashboard-test.js
```

```javascript
// dashboard-test.js
import http from 'k6/http';
import { check } from 'k6';

export default function () {
  const params = { headers: { Authorization: `Bearer ${__ENV.TOKEN}` } };
  const res = http.get('https://pulse-crm-backend.onrender.com/api/v1/dashboard/me', params);
  check(res, {
    'status 200': (r) => r.status === 200,
    'latency < 1s': (r) => r.timings.duration < 1000,
  });
}
```

---

## 24. Observability / Instrumentation Plan

### 24.1 Backend instrumentation

| Metric | Instrumentation | Alert threshold |
|--------|-----------------|----------------|
| Request latency | `RequestLoggingMiddleware` (already exists — verify it logs `duration_ms`) | p95 > 2s |
| DB query latency | SQLAlchemy `before_cursor_execute` / `after_cursor_execute` event listeners | > 100ms per query |
| DB connection acquisition | `time.monotonic()` around `AsyncSessionFactory()` | > 50ms |
| External API latency | httpx event hooks on `AIClient` and `GmailClient` | > 5s |
| Event outbox lag | Query: `SELECT COUNT(*) FROM event_outbox WHERE status='pending'` | > 100 pending |
| Event-loop lag | `asyncio.get_event_loop().set_debug(True)` + `aiomonitor` | > 100ms |
| Memory | `psutil.Process().memory_info().rss` logged periodically | > 500MB |
| Error rate | Sentry / structured logging | > 1% of requests |

### 24.2 Frontend instrumentation

| Metric | Instrumentation | Alert threshold |
|--------|-----------------|----------------|
| Page load (TTFB, FCP, TTI) | Vercel Analytics / `next/web-vitals` | TTI > 3s |
| API call latency | `performance.now()` in `apiFetch` wrapper | p95 > 2s |
| SSE connection status | Log connect/disconnect/reconnect events | Reconnect rate > 1/hour |
| JS bundle size | `@next/bundle-analyzer` | Initial JS > 300KB |

### 24.3 Database instrumentation

| Metric | Instrumentation | Alert threshold |
|--------|-----------------|----------------|
| Slow queries | `pg_stat_statements` (Supabase built-in) | `mean_exec_time > 100ms` |
| Connection count | `SELECT count(*) FROM pg_stat_activity` | > 80% of max |
| Index usage | `pg_stat_user_indexes` | Unused indexes on hot tables |
| Table bloat | `pgstattuple` extension | > 30% bloat |
| Lock waits | `pg_stat_activity WHERE wait_event IS NOT NULL` | > 5 concurrent waits |

---

## 25. Before vs After Performance Expectations

### Estimated improvements after implementing all phases

| Flow | Before (estimated) | After Phase 1 | After Phase 2 | After Phase 3 |
|------|-------------------|---------------|---------------|---------------|
| Login | ~400ms | ~200ms (bcrypt offloaded) | ~200ms | ~100ms |
| Dashboard `/me` | ~300ms | ~250ms | ~150ms (parallel queries) | ~100ms (cached) |
| Dashboard `/manager` | ~2-10s | ~2-8s | ~300ms (parallel + combined queries) | ~200ms |
| Lead list | ~200ms | ~150ms | ~100ms (QueuePool) | ~50ms (cached) |
| Gmail webhook | ~5-30s | ~5-30s | <100ms (decoupled) | <100ms |
| AI summarization | ~2-30s | ~2-30s | ~2-5s (async + no cold start) | ~2-5s |
| Daily assessment (1000 leads) | ~83 min | ~83 min | ~10 min (parallel) | ~5 min (parallel + in-process) |

### Expected throughput improvements

| Metric | Before | After |
|--------|--------|-------|
| Max concurrent users (warm) | ~50-100 | ~1000+ |
| Max concurrent users (cold start) | 0 (30-60s wait) | ~1000+ (no cold starts) |
| DB connections at 100 users | ~60 (NullPool, hitting limit) | ~10 (QueuePool, reused) |
| API requests/sec | ~50 | ~500+ |
| Event processing latency | 30s (outbox poll interval) | <5s |

---

## 26. Final Prioritized Action Plan

### Phase 1 — Quick Wins (1-2 days, low risk)

| # | Fix | File | Effort | Impact |
|---|-----|------|--------|--------|
| 1 | bcrypt to thread pool | `auth_service.py:140` | 1 line | Prevent event-loop block on login |
| 2 | AI service endpoints → `async def` | `conversation_router.py:30,55` | 2 words | Prevent threadpool exhaustion |
| 3 | Cache `get_current_user` (TTLCache 60s) | `deps.py` | ~10 lines | Eliminate DB query on most requests |
| 4 | Shared httpx client for GmailClient | `gmail_client.py` | ~15 lines | Connection reuse for Gmail API |
| 5 | Don't commit on reads | `connection.py:85` | ~5 lines | Eliminate unnecessary COMMIT |
| 6 | Parallelize AI pipeline data gathering | `ai_pipeline.py` | ~15 lines | 4 sequential → 1 concurrent |
| 7 | `FOR UPDATE SKIP LOCKED` in outbox worker | `event_repository.py` | 1 line | Prevent duplicate processing |

### Phase 2 — Major Performance Fixes (1-2 weeks)

| # | Fix | Effort | Impact |
|---|-----|--------|--------|
| 8 | Switch to QueuePool / session-mode pooler | Moderate | -30-80ms per request |
| 9 | Parallelize dashboard queries (`asyncio.gather` + `FILTER`) | Moderate | -2-8s on dashboard |
| 10 | Decouple Gmail webhook from sync processing | Moderate | Prevent Pub/Sub storms |
| 11 | Implement Gmail `batchGet` | Moderate | 100x faster message fetching |
| 12 | Replace notification polling with SSE | Moderate | -3 req/min/user |
| 13 | Gmail webhook idempotency | Moderate | Eliminate duplicate work |
| 14 | Move rule-based scoring into backend | Moderate | -50-200ms per assessment |
| 15 | Rate limiter cleanup + Redis wiring | Moderate | Correct multi-worker limiting |
| 16 | Parallelize daily assessment with `Semaphore` | Moderate | 8x faster batch processing |
| 17 | Uptime monitor / paid tier (no cold starts) | Low | Eliminate 30-60s cold starts |

### Phase 3 — Architecture Improvements (1-2 months)

| # | Fix | Effort | Impact |
|---|-----|--------|--------|
| 18 | Redis Pub/Sub for event bus + SSE | High | Multi-worker real-time |
| 19 | Durable task queue for background jobs | High | Survive restarts, scale workers |
| 20 | TanStack Query on frontend | Moderate | Proper caching, SWR |
| 21 | Cursor-based pagination | Moderate | Constant-time pagination |
| 22 | Read replica for dashboard queries | Moderate | Offload primary DB |
| 23 | Code-split heavy frontend deps (three.js) | Low | Smaller initial bundle |

### Phase 4 — Advanced Optimization (after measurement)

| # | Fix | When to consider |
|---|-----|-----------------|
| 24 | LLM response caching | If summarization latency is top complaint |
| 25 | Materialized views for dashboard aggregates | If dashboard queries remain slow after parallelization |
| 26 | Connection pooler (PgBouncer/Supavisor session mode) | If QueuePool is insufficient |
| 27 | CDN for static assets | If frontend load time is bottleneck |
| 28 | Partitioning for emails/activities tables | If table sizes exceed 1M rows |

---

## THE 10 MOST IMPORTANT THINGS TO FIX FIRST

### 1. NullPool → QueuePool with session-mode pooler — STILL ACTIVE (DIRECT_URL now exists but unused by the engine)
**Problem:** Every request opens a new database connection (TCP+TLS+auth = 30-80ms).
**Root Cause:** `NullPool` is used to avoid PgBouncer transaction-mode desync, but it eliminates all connection reuse.
**Exact Location:** `backend/app/database/connection.py:51-59`
**Fix:** Use Supabase session-mode pooler (port 5432) with `QueuePool(pool_size=10, max_overflow=5, pool_pre_ping=True)`.
**Why It Matters:** This adds 30-80ms to EVERY single API call. Fixing it is the single biggest latency improvement.
**Validation:** Measure connection acquisition time; should drop from 30-80ms to <5ms.

### 2. AI service sync endpoints blocking the event loop — STILL ACTIVE (also `lead_router.py` /assess + /score)
**Problem:** LLM calls freeze the entire AI service for 2-30 seconds per call.
**Root Cause:** `def summarise(...)` (sync) uses the synchronous Groq SDK, which blocks the thread/event loop.
**Exact Location:** `ai-service/app/routers/conversation_router.py:30,55`
**Fix:** Change to `async def` and use `AsyncGroq` client. Or use `asyncio.to_thread` as a stopgap.
**Why It Matters:** Under concurrent load, the AI service becomes completely unresponsive.
**Validation:** Load test 50 concurrent summarization requests; all should complete within 30s.

### 3. `get_current_user` DB query on every request — STILL ACTIVE
**Problem:** Every authenticated request queries the database for the user + roles.
**Root Cause:** The auth dependency always hits the DB instead of trusting JWT claims or caching.
**Exact Location:** `backend/app/api/deps.py:33-50`
**Fix:** Add a 60-second `TTLCache` for user lookups, or embed roles in the JWT.
**Why It Matters:** Combined with NullPool, this means every request opens a new connection AND runs a query — doubling the overhead.
**Validation:** Log cache hit/miss ratio; target >95% hit rate.

### 4. Dashboard `manager_kpi`: 16 sequential queries — STILL ACTIVE (see §6.3 gather caveat)
**Problem:** Manager dashboard takes 2-10 seconds due to sequential database queries.
**Root Cause:** No use of `asyncio.gather` — each `db.execute` waits for the previous one.
**Exact Location:** `backend/app/services/dashboard_service.py` — `manager_kpi` method (633 lines)
**Fix:** Wrap independent queries in `asyncio.gather`. Combine COUNT queries with `FILTER (WHERE ...)`.
**Why It Matters:** Dashboard is the most-used screen; 2-10s load is unacceptable.
**Validation:** Time the endpoint before/after; target <500ms p95.

### 5. Gmail Pub/Sub webhook blocks on full sync — STILL ACTIVE (now always returns 200, but sync still in-request)
**Problem:** The webhook holds the HTTP response open for the entire Gmail sync (5-30s), causing Pub/Sub redelivery storms.
**Root Cause:** Acknowledgement and processing are coupled in the same request.
**Exact Location:** `backend/app/api/v1/gmail.py:pubsub_webhook`
**Fix:** Return 200 immediately after parsing. Enqueue sync work to a Postgres queue table with `FOR UPDATE SKIP LOCKED`.
**Why It Matters:** Under burst email traffic, the single Render worker is overwhelmed and Pub/Sub amplifies the load with redeliveries.
**Validation:** Measure webhook response time; should be <100ms. Monitor Pub/Sub redelivery count.

### 6. Gmail messages fetched one-by-one (no `batchGet`) — STILL ACTIVE
**Problem:** N messages = N sequential HTTPS calls to Gmail API (N × 200-400ms).
**Root Cause:** Code calls `get_message` in a loop instead of using Gmail's `batchGet` endpoint.
**Exact Location:** `backend/app/services/email_service.py:1033`
**Fix:** Implement `batch_get_messages` in `gmail_client.py` using `POST /gmail/v1/users/me/messages/batchGet`.
**Why It Matters:** A 20-message sync takes 4-8 seconds; with `batchGet` it takes <500ms.
**Validation:** Time sync with 50 messages before/after.

### 7. bcrypt password verification on the event loop — STILL ACTIVE
**Problem:** Login blocks the event loop for 250-400ms, stalling all other requests.
**Root Cause:** `verify_password` (bcrypt, 12 rounds) is called directly in an async function.
**Exact Location:** `backend/app/services/auth_service.py:140`
**Fix:** `await asyncio.to_thread(verify_password, password, hashed_password)`
**Why It Matters:** During every login, all other in-flight requests are blocked for 250-400ms.
**Validation:** Measure event-loop lag during concurrent logins; should be <10ms.

### 8. In-memory SSE/event bus doesn't scale beyond one worker — STILL ACTIVE
**Problem:** SSE subscribers are in-memory; events don't cross worker boundaries. The system can't scale horizontally.
**Root Cause:** `EventBus` uses `asyncio.Queue` and a `dict` of subscriber sets — all in-process.
**Exact Location:** `backend/app/services/event_bus.py`, `backend/app/api/v1/stream.py`
**Fix:** Replace with Redis Pub/Sub. Each worker subscribes to Redis channels and fans out to local SSE connections.
**Why It Matters:** This is the hard ceiling on horizontal scaling. Without fixing it, you can never run multiple workers.
**Validation:** Start 2 workers, publish an event on worker A, verify it reaches an SSE client on worker B.

### 9. Daily assessment processes leads sequentially — PARTIALLY FIXED (batch queries added; loop still sequential)
**Problem:** The midnight batch job processes leads one-by-one, each with ~4-8 DB queries + 1 HTTP call. 1000 leads = hours.
**Root Cause:** No parallelism in the assessment loop.
**Exact Location:** `backend/app/main.py:daily_lead_assessment`
**Fix:** Use `asyncio.Semaphore(10)` + `asyncio.gather` to process 10 leads concurrently.
**Why It Matters:** The daily job may not finish before users start their day, meaning scores are stale.
**Validation:** Time the job with 1000 test leads; should complete in <15 minutes.

### 10. Render free tier cold starts — STILL ACTIVE (`render.yaml` still `plan: free`)
**Problem:** After 15 minutes of inactivity, the next request takes 30-60 seconds.
**Root Cause:** Render free tier spins down services; cold start requires Python startup + imports + DB connection + AI health check.
**Exact Location:** `render.yaml` — `plan: free`
**Fix:** Upgrade to paid tier, or set up an uptime monitor that pings every 10 minutes.
**Why It Matters:** No matter how fast your code is, a 30-60s cold start is catastrophic for UX. This affects every user who hasn't interacted with the app in the last 15 minutes.
**Validation:** Monitor response times; no request should take >5s when warm.

---

*End of DEEP-PERFORMANCE-REVIEW.md*
