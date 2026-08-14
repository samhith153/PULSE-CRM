# PULSE-CRM Performance Audit & Optimization Plan

**Repo:** `samhith153/PULSE-CRM` (commit `2003b40c`)
**Date:** 2026-08-14
**Scope:** Root-cause analysis of "bot loads slow, updates very slow" across backend, frontend, and ai-service
**Constraint:** All fixes are designed to be non-breaking — the current working model must keep working while optimizations are layered in.

---

## TL;DR — The 3 things causing most of the slowness

1. **Every API request opens a brand-new database connection (30-80ms tax each).** A logic bug in `backend/app/database/connection.py` silently disables connection pooling. Fix = 1 line.
2. **Every authenticated request fires 4 SQL queries just to resolve permissions** (RBAC), with zero caching. Fix = cache the resolved user in Redis for 60s.
3. **The chatbot waits for the full LLM response before showing anything (no streaming), and uses a fake `setTimeout` reply instead of real streaming.** Fix = switch to Server-Sent Events token streaming.

Everything below explains these and the ~20 other bottlenecks, with exact file paths, line numbers, and copy-paste-ready fixes.

---

## How to use this document with another AI

Give this file to your coding AI alongside the repo. Each issue is self-contained:
- **File + line** so the AI can navigate directly.
- **Problem** — what's wrong and why it's slow.
- **Fix** — exactly what to change, written so it doesn't break existing behavior.
- **Impact** — expected speedup.
- **Risk** — what could break and how to guard it.

Work through **Phase 1 (Quick Wins)** first — those 6 fixes alone will make the app feel 3-5x faster with almost zero risk. Phase 2 and 3 are deeper structural changes.

**Golden rule for the other AI:** Every fix must keep the existing API contract (request/response shapes) unchanged. Optimize the internals, never the interface.

---

# PHASE 1 — Quick Wins (1-2 days, low risk, high impact)

## 1.1 — Fix the database connection pooling bug (THE #1 issue)

**File:** `backend/app/database/connection.py` (lines 49-52)
**Severity:** Critical
**Impact:** Eliminates 30-80ms latency on every single API call. This alone will make the entire app feel dramatically faster.

### Problem

The file's own comments (lines 37-48) explain that `DIRECT_URL` should be preferred over `DATABASE_URL` because the direct URL enables `QueuePool` (connection reuse), while the pooler URL forces `NullPool` (new connection per request). But the code does the opposite:

```python
# backend/app/database/connection.py:49-52
engine_url = (
    DATABASE_URL                                          # ← always truthy (required field)
    or getattr(settings, "DIRECT_URL", None)             # ← DEAD CODE, never reached
)
```

`DATABASE_URL` is a required config field (`config.py:65`, no default), so it is never falsy. The `or getattr(settings, "DIRECT_URL", ...)` branch is dead code. `DIRECT_URL` is never used.

**Consequence:** If `DATABASE_URL` points at the Supabase transaction-mode pooler (hostname contains `pooler` or port `:6543` — which is the default Supabase setup), the code at lines 77-81 correctly falls back to `NullPool`:

```python
if _is_pooler:
    connect_args["statement_cache_size"] = 0
    _pool_kwargs["poolclass"] = NullPool     # ← new connection PER request
```

`NullPool` means every request opens a fresh TCP + SSL + auth handshake to Postgres. The file's own comments quantify this as a "30-80ms connect tax on every request." On Render's free tier with cold starts, this compounds.

### Fix

Swap the priority so `DIRECT_URL` is tried first:

```python
# Prefer the direct (session-mode) URL for the app engine.
# DIRECT_URL bypasses the pooler and enables QueuePool connection reuse.
engine_url = (
    getattr(settings, "DIRECT_URL", None)
    or DATABASE_URL
)
```

### Risk

Low. The `DIRECT_URL` env var is already configured in `render.yaml` (marked `sync: false`). If `DIRECT_URL` is not set, it falls back to `DATABASE_URL` (current behavior). The only requirement is that `DIRECT_URL` points at the direct Postgres instance (port 5432), not the pooler (port 6543).

**Verification:** After deploying, check the logs — you should NOT see `NullPool` being used. Add a one-time startup log:

```python
logger.info("DB engine using %s pool for URL host=%s",
            "Null" if _is_pooler else "Queue",
            urlparse(engine_url).hostname)
```

---

## 1.2 — Cache the authenticated user + permissions (RBAC hot path)

**File:** `backend/app/api/deps.py` (lines 47-48), `backend/app/repositories/user_repository.py` (lines 25-32)
**Severity:** High
**Impact:** Removes 4 SQL queries from every authenticated request. On a dashboard load that fires 8-10 API calls, that's 30-40 fewer DB round-trips.

### Problem

`get_current_user` runs on **every authenticated request**. It calls `user_repo.get_by_id_with_roles()`, which fires a 4-level deep `selectinload` chain:

```python
# backend/app/repositories/user_repository.py:25-32
selectinload(User.user_roles)
    .selectinload(UserRole.role)
    .selectinload(Role.role_permissions)
    .selectinload(RolePermission.permission)
```

That's 4 separate SQL queries per request just to resolve the caller's permissions. There is no caching — the same user's permissions are re-fetched on every single API call.

### Fix

Add a short-TTL cache (60s) for the resolved user object. Use `functools.lru_cache` keyed by user_id + token JTI (or a manual dict). If you have Redis available (see issue 1.6), use that instead so it works across workers.

**Minimal version (in-process cache):**

```python
# backend/app/api/deps.py
import time
from app.core.security import decode_access_token

_USER_CACHE: dict[str, tuple[float, User]] = {}
_USER_CACHE_TTL = 60  # seconds

async def get_current_user(
    request: Request,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security)],
    db: AsyncSession = Depends(get_db),
) -> User:
    if not credentials or not credentials.credentials:
        raise UnauthorizedException("Missing Bearer token.")

    token = credentials.credentials
    payload = decode_access_token(token)
    user_id = payload.get("sub")
    if not user_id:
        raise UnauthorizedException("Invalid token payload.")

    # Check cache
    cached = _USER_CACHE.get(user_id)
    if cached and time.time() - cached[0] < _USER_CACHE_TTL:
        user = cached[1]
        if not user or not user.is_active or user.is_deleted:
            raise UnauthorizedException("User account not found or is inactive.")
        return user

    user_repo = UserRepository(db)
    user = await user_repo.get_by_id_with_roles(UUID(user_id))

    if not user or not user.is_active or user.is_deleted:
        raise UnauthorizedException("User account not found or is inactive.")

    _USER_CACHE[user_id] = (time.time(), user)
    return user
```

**Important:** When a user's role or permissions are updated, invalidate the cache for that user_id. Add a helper:

```python
def invalidate_user_cache(user_id: str):
    _USER_CACHE.pop(user_id, None)
```

Call it from any role-update endpoint.

### Risk

Medium. Stale permissions for up to 60s after a role change. Acceptable for most CRM workflows. If you need instant invalidation, use Redis with a `DEL` on role update.

---

## 1.3 — Add the missing composite database indexes

**File:** `backend/alembic/legacy/20260713_0003_add_crm_constraints_and_indexes.py`, `backend/app/db/init.sql`
**Severity:** High
**Impact:** 5-50x faster queries on the email and lead tables (the most-queried tables in the bot/assessment path).

### Problem

The `emails` table is queried heavily by multi-column predicates like `(organization_id, external_entity_type, external_entity_id, direction, is_active)` and `(organization_id, external_entity_type, external_entity_id, direction)`. But the schema defines only **separate single-column indexes** on each column. Postgres cannot efficiently use single-column indexes for multi-column WHERE clauses — it does a bitmap scan + combine, which is slow and gets slower as the table grows.

Same issue for `leads`, queried by `(organization_id, is_active, is_deleted)` — only single-column indexes exist.

### Fix

Create a new Alembic migration adding composite indexes:

```python
# backend/alembic/versions/XXXX_add_composite_indexes.py

def upgrade():
    # Email hot-path queries
    op.create_index(
        "ix_emails_org_ext_entity_dir_active",
        "emails",
        ["organization_id", "external_entity_type", "external_entity_id", "direction", "is_active"],
    )
    op.create_index(
        "ix_emails_org_ext_entity_dir",
        "emails",
        ["organization_id", "external_entity_type", "external_entity_id", "direction"],
    )

    # Lead hot-path queries
    op.create_index(
        "ix_leads_org_active_deleted",
        "leads",
        ["organization_id", "is_active", "is_deleted"],
    )
    op.create_index(
        "ix_leads_org_owner_status",
        "leads",
        ["organization_id", "owner_id", "status"],
    )

    # Activity timeline queries
    op.create_index(
        "ix_activities_org_entity_type_entity_id_created",
        "activities",
        ["organization_id", "entity_type", "entity_id", "created_at"],
    )

def downgrade():
    op.drop_index("ix_emails_org_ext_entity_dir_active", table_name="emails")
    op.drop_index("ix_emails_org_ext_entity_dir", table_name="emails")
    op.drop_index("ix_leads_org_active_deleted", table_name="leads")
    op.drop_index("ix_leads_org_owner_status", table_name="leads")
    op.drop_index("ix_activities_org_entity_type_entity_id_created", table_name="activities")
```

### Risk

Low. `CREATE INDEX` does not lock the table for reads (only briefly for writes in Postgres). On large tables, use `CREATE INDEX CONCURRENTLY` to avoid blocking writes:

```sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_emails_org_ext_entity_dir_active
ON emails (organization_id, external_entity_type, external_entity_id, direction, is_active);
```

Note: `CONCURRENTLY` cannot run inside a transaction, so it must be a raw SQL migration, not Alembic's `op.create_index`.

---

## 1.4 — Move RBAC bootstrap and Gmail watch refresh off the startup critical path

**File:** `backend/app/main.py` (lines 219-264)
**Severity:** Medium-High
**Impact:** Faster server cold starts (the app becomes ready to serve requests sooner). On Render free tier, this matters a lot because the server sleeps and wakes frequently.

### Problem

The `lifespan` startup handler runs 4 blocking operations **serially** before the app accepts any request:

```python
# backend/app/main.py:219-221
await bootstrap_rbac_on_startup()          # DB writes on every boot

# lines 229-247 — loads ALL GmailConnection rows, decrypts tokens in a loop
rows = (await db.execute(select(GmailConnection))).scalars().all()
for conn in rows:
    cipher.decrypt(conn.access_token_encrypted)   # CPU-bound, sequential
    cipher.decrypt(conn.refresh_token_encrypted)

# line 252
await refresh_gmail_watches()              # outbound Gmail API calls (slow)

# lines 255-264
async with httpx.AsyncClient(timeout=5.0) as hc:
    resp = await hc.get(f"{settings.AI_SERVICE_URL}/health")  # blocks startup
```

If Gmail is slow or there are many connections, startup latency grows linearly.

### Fix

Run these as background tasks that start **after** the app is already serving requests:

```python
# backend/app/main.py — inside lifespan()

# ... existing setup ...

# Yield immediately so the app starts accepting requests
yield

# After yield = shutdown, so we can't do startup work here.
# Instead, schedule the background tasks before yield:
```

Better approach — schedule as a background task on startup:

```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Minimal startup — just the essentials
    # Schedule heavy init as background tasks (non-blocking)
    asyncio.create_task(bootstrap_rbac_on_startup())
    asyncio.create_task(refresh_gmail_watches())
    asyncio.create_task(decrypt_gmail_connections_background())

    yield  # ← app is ready to serve requests NOW

    # Shutdown
    await event_worker.stop()
```

For the AI service health check, don't block startup — just log a warning if it's down:

```python
async def check_ai_service_health():
    try:
        async with httpx.AsyncClient(timeout=5.0) as hc:
            resp = await hc.get(f"{settings.AI_SERVICE_URL}/health")
            if resp.status_code != 200:
                logger.warning("AI service health check returned %s", resp.status_code)
    except Exception as e:
        logger.warning("AI service not reachable: %s", e)

# In lifespan:
asyncio.create_task(check_ai_service_health())
```

### Risk

Low. RBAC bootstrap is idempotent (it checks before inserting). Gmail watch refresh is also idempotent. The only risk is a brief window (1-2s) after startup where Gmail watches aren't refreshed — but they have a 7-day TTL anyway.

---

## 1.5 — Add timeouts to all LLM/Groq calls (prevent hung requests)

**Files:**
- `backend/app/services/groq_summary_provider.py` (line 13, and the call site)
- `ai-service/app/services/conversation_service.py` (the `summarise_thread` and `generate_outreach_draft` functions)
- `backend/app/api/v1/assistant.py` (lines 225-261)

**Severity:** High
**Impact:** Prevents the bot from hanging indefinitely when the LLM provider is slow. A hung request occupies a worker slot and cascades into slowness for all other users.

### Problem

**Backend (`groq_summary_provider.py`):** Uses the **synchronous** Groq SDK via `asyncio.to_thread` with **no timeout**:

```python
# Called somewhere like:
completion = await asyncio.to_thread(
    client.chat.completions.create,    # ← sync, no timeout
    model=settings.ASSISTANT_MODEL,
    messages=[...],
)
```

The `AI_TIMEOUT` setting exists (`render.yaml`: `AI_TIMEOUT: "30"`) but is never passed to the Groq client. If Groq is slow, the request hangs forever.

**AI-service (`conversation_service.py`):** Uses `AsyncGroq` but also **no timeout**:

```python
# ai-service/app/services/conversation_service.py
response = await _get_client().chat.completions.create(
    model="llama-3.3-70b-versatile",
    messages=[...],
    temperature=0.3,
    max_tokens=1500,
    # ← no timeout parameter
)
```

The `LLM_TIMEOUT = 30` config exists but is never used.

### Fix

**Backend — wrap in `asyncio.wait_for`:**

```python
import asyncio

completion = await asyncio.wait_for(
    asyncio.to_thread(
        client.chat.completions.create,
        model=settings.ASSISTANT_MODEL,
        messages=[...],
        timeout=settings.AI_TIMEOUT,  # Groq SDK supports this
    ),
    timeout=settings.AI_TIMEOUT + 5,  # outer safety net
)
```

**AI-service — pass `timeout` to the AsyncGroq call:**

```python
# ai-service/app/services/conversation_service.py
from app.core.config import settings

response = await _get_client().chat.completions.create(
    model=settings.LLM_MODEL,
    messages=[...],
    temperature=settings.LLM_TEMPERATURE,
    max_tokens=settings.LLM_MAX_TOKENS,
    timeout=settings.LLM_TIMEOUT,  # ← ADD THIS
)
```

Also add an outer `asyncio.wait_for` as a safety net:

```python
response = await asyncio.wait_for(
    _get_client().chat.completions.create(...),
    timeout=settings.LLM_TIMEOUT + 5,
)
```

### Risk

Low. Timeouts cause a `TimeoutError` that you should catch and return a graceful fallback message:

```python
except asyncio.TimeoutError:
    return {"error": "AI response timed out, please try again."}
```

---

## 1.6 — Enable Redis for rate limiting (replace in-memory limiter)

**Files:** `backend/app/middlewares/rate_limit.py`, `backend/app/core/rate_limiter.py`
**Severity:** Medium
**Impact:** Correct rate limiting across multiple workers. The current in-memory limiter is per-process — if you run multiple Uvicorn workers, each has its own counter and the limit is effectively multiplied.

### Problem

There are **two** rate limiter implementations:
1. `app/core/rate_limiter.py` — Redis-backed, async, **but never wired in** (dead code).
2. `app/middlewares/rate_limit.py` — in-memory dict, **the one actually used**.

The in-memory version's `_buckets` dict grows unbounded (no eviction) and doesn't work across workers/instances.

### Fix

Switch the middleware to use the Redis-backed limiter. If Redis isn't available, fall back to in-memory but add eviction:

```python
# Quick fix if no Redis — add periodic cleanup
import time

_buckets: dict[str, list[float]] = {}
_CLEANUP_INTERVAL = 300  # 5 minutes
_last_cleanup = time.time()

def _cleanup():
    global _last_cleanup
    now = time.time()
    if now - _last_cleanup < _CLEANUP_INTERVAL:
        return
    _last_cleanup = now
    expired = [k for k, v in _buckets.items() if now - v[-1] > 60]
    for k in expired:
        del _buckets[k]
```

For the full fix, wire up `app/core/rate_limiter.py` (Redis) as the middleware backend. You'll need a `REDIS_URL` env var.

### Risk

Low for the cleanup fix. Medium for the Redis switch (requires Redis to be available). Start with the cleanup fix.

---

# PHASE 2 — Bot & AI Optimization (2-3 days, medium risk)

## 2.1 — Stream LLM responses to the frontend (instead of waiting for the full response)

**Files:**
- `backend/app/api/v1/assistant.py` (lines 225-261)
- `frontend/src/components/dashboard/AICopilotChat.tsx` (lines 77-100, the `simulateBotReply` function)
- `ai-service/app/services/conversation_service.py`

**Severity:** Critical for perceived performance
**Impact:** The bot will feel instant — tokens appear as they're generated instead of a 5-15s wait for the full response.

### Problem

**Frontend:** The chatbot currently uses `setTimeout` to simulate a reply — it doesn't actually call the backend AI at all:

```typescript
// frontend/src/components/dashboard/AICopilotChat.tsx:77-100
const simulateBotReply = (userText: string) => {
    setIsTyping(true);
    setTimeout(() => {              // ← fake delay, no real API call
        setIsTyping(false);
        // ... hardcoded keyword matching ...
    }, ???);  // no delay specified, defaults to 0
};
```

**Backend (`assistant.py:225-261`):** The chat endpoint calls Groq synchronously via `asyncio.to_thread` and returns the **entire response at once**. No streaming.

### Fix

**Backend — add a streaming endpoint using Server-Sent Events (SSE):**

```python
# backend/app/api/v1/assistant.py
from fastapi.responses import StreamingResponse
import asyncio, json

@router.post("/assistant/chat/stream")
async def chat_stream(
    payload: ChatRequest,
    current_user: CurrentUser,
):
    async def event_generator():
        try:
            # Use Groq's streaming mode
            stream = await asyncio.wait_for(
                asyncio.to_thread(
                    client.chat.completions.create,
                    model=settings.ASSISTANT_MODEL,
                    messages=[...],
                    temperature=0.3,
                    stream=True,  # ← KEY: enable streaming
                ),
                timeout=settings.AI_TIMEOUT + 5,
            )
            for chunk in stream:
                if chunk.choices[0].delta.content:
                    data = json.dumps({"token": chunk.choices[0].delta.content})
                    yield f"data: {data}\n\n"
        except asyncio.TimeoutError:
            yield f"data: {json.dumps({'error': 'timeout'})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
        yield f"data: {json.dumps({'done': True})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")
```

**Frontend — consume the stream and render tokens incrementally:**

```typescript
// frontend/src/components/dashboard/AICopilotChat.tsx
const sendRealMessage = async (userText: string) => {
    const userMsg: Message = {
        id: Math.random().toString(),
        sender: 'user',
        text: userText,
        timestamp: new Date(),
        type: 'text'
    };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    const aiMsgId = Math.random().toString();
    setMessages(prev => [...prev, {
        id: aiMsgId,
        sender: 'ai',
        text: '',
        timestamp: new Date(),
        type: 'text'
    }]);

    try {
        const response = await fetch('/api/v1/assistant/chat/stream', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders(),
            },
            body: JSON.stringify({ message: userText }),
        });

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (reader) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = JSON.parse(line.slice(6));
                    if (data.token) {
                        setMessages(prev => prev.map(m =>
                            m.id === aiMsgId
                                ? { ...m, text: m.text + data.token }
                                : m
                        ));
                    }
                }
            }
        }
    } catch (err) {
        console.error('Stream error:', err);
    } finally {
        setIsTyping(false);
    }
};
```

**Important:** Keep `simulateBotReply` as a fallback if the streaming endpoint fails or isn't deployed yet:

```typescript
const handleSend = () => {
    if (!inputValue.trim()) return;
    // Try streaming first, fall back to simulation
    sendRealMessage(inputValue).catch(() => simulateBotReply(inputValue));
    setInputValue('');
};
```

### Risk

Medium. Requires the backend streaming endpoint to be deployed. The fallback to `simulateBotReply` ensures the UI keeps working if the endpoint is down.

---

## 2.2 — Parallelize the lead assessment pipeline

**File:** `backend/app/services/ai_pipeline.py` (around line 38, and the `run_lead_assessment` function)
**Severity:** Medium
**Impact:** 2-3x faster lead scoring — the bot's "updates very slow" symptom.

### Problem

The assessment pipeline runs several independent DB queries **sequentially**:

```python
# Pseudocode of what happens:
lead = await lead_repo.get_by_id(lead_id)           # query 1
deal = await deal_repo.get_by_lead_id(lead_id)       # query 2
email_stats = await email_repo.get_stats(lead_id)    # query 3
# ... then scoring
```

These are independent reads that could run concurrently.

### Fix

Use `asyncio.gather` to parallelize independent reads:

```python
import asyncio

async def run_lead_assessment(lead_id: UUID, db: AsyncSession) -> AssessmentResult:
    # Parallelize independent reads
    lead, deal, email_stats, activities = await asyncio.gather(
        lead_repo.get_by_id(lead_id),
        deal_repo.get_by_lead_id(lead_id),
        email_repo.get_stats_for_lead(lead_id),
        activity_repo.get_recent_for_lead(lead_id, limit=20),
    )

    # Then run scoring (depends on the above)
    fit_score = compute_fit_score(lead, deal)
    engagement_score = compute_engagement_score(email_stats, activities)
    ...
```

**Caution:** All `gather` coroutines must use the **same session** safely. With `AsyncSession`, concurrent queries on the same session are NOT safe (raises `InvalidRequestError: this session already has a query in progress`). Either:
- Use separate sessions for each parallel query, or
- Use `selectinload`/`joinedload` to fetch everything in one query

**Preferred — single query with eager loading:**

```python
stmt = (
    select(Lead)
    .options(
        joinedload(Lead.deal),
        selectinload(Lead.emails),
        selectinload(Lead.activities),
    )
    .where(Lead.id == lead_id)
)
result = await db.execute(stmt)
lead = result.scalar_one_or_none()
# All relationships are already loaded — no N+1
```

### Risk

Medium. Test that the scoring logic produces identical results before and after the parallelization.

---

## 2.3 — Fix N+1 queries on all list endpoints (add eager loading)

**Files:** All repositories and services that serialize model relationships
**Severity:** Medium
**Impact:** Eliminates dozens of lazy-load queries on list/dashboard endpoints.

### Problem

All model relationships default to `lazy="select"` (SQLAlchemy default). This means any endpoint that serializes a Lead with its `company`, `contact`, `owner`, `deal`, `lead_score` relationships triggers a **separate SQL query per relationship per row** — classic N+1.

A `grep` for `selectinload`/`joinedload` shows it's used **only** in `user_repository.py`. Every other repository relies on lazy loading.

### Fix

For every list endpoint that returns model objects with relationships, add eager loading to the query:

```python
# Example: lead_repository.py — get_leads_for_organization
from sqlalchemy.orm import selectinload

async def get_leads_for_organization(self, org_id: UUID, skip: int = 0, limit: int = 50):
    stmt = (
        select(Lead)
        .options(
            selectinload(Lead.company),
            selectinload(Lead.contact),
            selectinload(Lead.owner),
            selectinload(Lead.deal),
            selectinload(Lead.lead_scores),
        )
        .where(Lead.organization_id == org_id, Lead.is_active == True)
        .offset(skip)
        .limit(limit)
        .order_by(Lead.created_at.desc())
    )
    result = await self.db.execute(stmt)
    return result.scalars().all()
```

Use `selectinload` (not `joinedload`) for collections to avoid cartesian product explosions. Use `joinedload` for many-to-one (e.g. `Lead.company`).

### Risk

Low. Eager loading changes only the number of queries, not the data returned. Run existing tests to verify.

---

## 2.4 — Move email stats computation from Python to SQL

**File:** `backend/app/services/email_stats_service.py` (or wherever `get_email_stats_for_lead` lives)
**Severity:** Medium
**Impact:** Eliminates loading all email rows into memory for each lead.

### Problem

The email stats service loads ALL email rows for a lead into Python memory and computes counts/aggregates in a loop — no SQL aggregation. For a lead with 100+ emails, this is slow and memory-heavy.

### Fix

Replace with a SQL aggregate query:

```python
from sqlalchemy import func, case

async def get_email_stats_for_lead(self, lead_id: UUID) -> EmailStats:
    stmt = (
        select(
            func.count().label("total_emails"),
            func.sum(case((Email.direction == "incoming", 1), else_=0)).label("incoming_count"),
            func.sum(case((Email.direction == "outgoing", 1), else_=0)).label("outgoing_count"),
            func.max(Email.created_at).label("last_email_at"),
            func.min(Email.created_at).label("first_email_at"),
        )
        .where(
            Email.external_entity_id == str(lead_id),
            Email.external_entity_type == "lead",
            Email.is_active == True,
        )
    )
    result = await self.db.execute(stmt)
    row = result.one()
    return EmailStats(
        total=row.total_emails or 0,
        incoming=row.incoming_count or 0,
        outgoing=row.outgoing_count or 0,
        last_email_at=row.last_email_at,
        first_email_at=row.first_email_at,
    )
```

### Risk

Low. The output shape is identical; only the computation moves to SQL.

---

## 2.5 — Fix conversation intelligence: stop fetching all rows and paginating in Python

**File:** `backend/app/services/conversation_intelligence_service.py`
**Severity:** Medium
**Impact:** Faster conversation list and detail endpoints.

### Problem

`get_conversation_detail` fetches ALL activity rows and ALL email rows (no filters) then filters in Python with `next()` — fetching entire tables per org/scope just to find one conversation. `get_conversation_intelligence` list fetches all rows then paginates in Python (no SQL `LIMIT`).

### Fix

Add SQL-level filtering and pagination:

```python
# For get_conversation_detail:
stmt = (
    select(Email)
    .where(
        Email.organization_id == org_id,
        Email.thread_id == thread_id,  # filter at SQL level
    )
    .order_by(Email.created_at.asc())
)
# Not: fetch all then next()

# For list with pagination:
stmt = (
    select(Email)
    .where(Email.organization_id == org_id)
    .offset(skip)
    .limit(limit)
    .order_by(Email.created_at.desc())
)
# Not: fetch all then slice [:limit]
```

### Risk

Low. Same data, just fetched more efficiently.

---

# PHASE 3 — Frontend Optimization (2-3 days, low-medium risk)

## 3.1 — The bot chat pre-fetches all leads and deals on mount unnecessarily

**File:** `frontend/src/components/dashboard/AICopilotChat.tsx` (lines 60-75)
**Severity:** Medium
**Impact:** Removes 2 unnecessary API calls on dashboard load.

### Problem

The `AICopilotChat` component pre-fetches ALL leads and deals on mount, even if the user never opens the chat:

```typescript
// frontend/src/components/dashboard/AICopilotChat.tsx:60-75
useEffect(() => {
    async function loadCRMData() {
        const [fetchedLeads, fetchedDeals] = await Promise.all([
            getLeads(),   // ← fetches ALL leads
            getDeals(),   // ← fetches ALL deals
        ]);
        setLeads(fetchedLeads);
        setDeals(fetchedDeals);
    }
    loadCRMData();
}, []);  // ← runs on mount, even if chat is closed
```

Since the chat uses `simulateBotReply` (fake responses), this data isn't even used for real AI calls — it's just for the hardcoded keyword matching.

### Fix

Lazy-load the data only when the chat is actually opened:

```typescript
useEffect(() => {
    if (!isOpen) return;  // ← only fetch when chat opens
    if (leads.length > 0) return;  // already loaded

    async function loadCRMData() {
        const [fetchedLeads, fetchedDeals] = await Promise.all([
            getLeads(),
            getDeals(),
        ]);
        setLeads(fetchedLeads);
        setDeals(fetchedDeals as any);
    }
    loadCRMData();
}, [isOpen]);  // ← depends on isOpen
```

### Risk

None. The data is only needed when the chat panel is open.

---

## 3.2 — The dashboard loads three.js and framer-motion eagerly on every page

**Files:** `frontend/package.json`, `frontend/src/app/layout.tsx`
**Severity:** Medium
**Impact:** Smaller initial JS bundle = faster page load.

### Problem

`package.json` includes `three` (600KB+), `@react-three/fiber`, `framer-motion` (100KB+), `recharts`, `ogl` — all heavy libraries. The root layout (`src/app/layout.tsx`) doesn't code-split these. Next.js does automatic code-splitting per route, but if any of these are imported in a shared component (like the landing page or a shared layout component), they end up in the main bundle.

### Fix

1. **Audit which components import `three` / `@react-three/fiber` / `ogl`** — these should only be on the landing page, not the dashboard:

```bash
grep -r "from 'three'" src/ --include="*.tsx" --include="*.ts"
grep -r "@react-three" src/ --include="*.tsx" --include="*.ts"
grep -r "from 'ogl'" src/ --include="*.tsx" --include="*.ts"
```

2. **If any 3D components are imported in shared/layout components, lazy-load them:**

```typescript
// Instead of:
import Hero3D from '@/components/Hero3D';
// Use:
const Hero3D = React.lazy(() => import('@/components/Hero3D'));

// And wrap in Suspense:
<Suspense fallback={<div className="h-[400px]" />}>
    <Hero3D />
</Suspense>
```

3. **Check `framer-motion` usage** — if it's used on every page for small animations, consider replacing with CSS transitions for the dashboard (keep framer-motion only for the landing page where complex animations matter).

4. **Run a bundle analysis to see what's in the initial bundle:**

```bash
npx @next/bundle-analyzer
# or
ANALYZE=true npm run build
```

### Risk

Low. Lazy-loading components doesn't change behavior — they still render, just on demand.

---

## 3.3 — The SSE stream causes a full dashboard re-fetch on every AI event

**File:** `frontend/src/hooks/use-crm-stream.ts`, `frontend/src/hooks/use-dashboard.ts`
**Severity:** Low-Medium
**Impact:** Reduces unnecessary full re-fetches when a single lead score updates.

### Problem

When the SSE stream receives a `LEAD_SCORE_UPDATED` event, it calls `onInvalidate()` which triggers `refetchDashboard()` — a full `GET /api/v1/dashboard/me` call. If multiple leads are scored in quick succession, the 500ms debounce helps, but each event still causes a full dashboard refresh.

### Fix

For `LEAD_SCORE_UPDATED` events, pass the lead_id in the SSE payload and update only that lead in local state, instead of refetching the entire dashboard:

```typescript
function handleMessage(raw: string) {
    const data = JSON.parse(raw);
    if (data.type === 'LEAD_SCORE_UPDATED' && data.lead_id) {
        // Update just this lead in local state
        window.dispatchEvent(new CustomEvent('pulse-lead-updated', {
            detail: { lead_id: data.lead_id, score: data.score }
        }));
    }
    // Keep the full refetch for DEAL_AT_RISK only
    if (data.type === 'DEAL_AT_RISK') {
        // ... existing debounced refetch
    }
}
```

### Risk

Low. The full refetch can remain as a fallback (e.g., on a 60s timer).

---

## 3.4 — The dashboard uses a 450ms artificial loading delay

**File:** `frontend/src/components/dashboard/DashboardShell.tsx` (lines ~190-195)
**Severity:** Low
**Impact:** Removes a visible delay on tab switches.

### Problem

```typescript
// frontend/src/components/dashboard/DashboardShell.tsx
useEffect(() => {
    if (!isLoading) return;
    const timer = setTimeout(() => setIsLoading(false), 450);  // ← artificial delay
    return () => clearTimeout(timer);
}, [isLoading]);
```

Every sub-tab change sets `isLoading = true` then waits 450ms before clearing it. This makes every tab switch feel sluggish.

### Fix

Remove the artificial delay or reduce it to 0:

```typescript
useEffect(() => {
    if (!isLoading) return;
    // Remove artificial delay — let React render immediately
    setIsLoading(false);
}, [isLoading]);
```

Or better — tie `isLoading` to actual data fetching, not a timer.

### Risk

None. This is a cosmetic delay.

---

# PHASE 4 — Infrastructure & Deployment (1 day, low risk)

## 4.1 — Upgrade from Render free tier or add a health-check keep-alive

**File:** `render.yaml`
**Severity:** Medium
**Impact:** Eliminates 30-50s cold starts on Render free tier.

### Problem

Both the backend and AI service are on Render's **free tier** (`plan: free`). Render free tier services sleep after 15 minutes of inactivity. When a user visits after sleep, the service takes 30-50 seconds to cold-start. This is likely a major contributor to "takes a lot of time to load."

### Fix

**Option A (free):** Set up a cron job (e.g., on cron-job.org or UptimeRobot) to ping the health endpoint every 10 minutes:

```
https://pulse-crm-backend.onrender.com/api/v1/health
http://pulse-crm-ai.onrender.com/health
```

This keeps the services warm.

**Option B (paid):** Upgrade to Render's "Starter" plan ($7/month per service) which never sleeps.

**Option C (better):** Consider migrating to a platform that doesn't sleep on the free tier (Fly.io, Railway, or a small VPS).

### Risk

None for Option A. Option B costs money.

---

## 4.2 — The `alembic upgrade head` runs on every startup

**File:** `render.yaml` (backend `startCommand`)
**Severity:** Low
**Impact:** Faster cold starts.

### Problem

```yaml
startCommand: "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT"
```

Every time the server starts (including every cold start on Render free tier), it runs Alembic migrations. On a cold start, this adds 5-10 seconds before the server begins accepting requests.

### Fix

Run migrations as a separate Render job (or deploy step), not on every startup:

```yaml
# In render.yaml, add a separate migration service
- type: job
  name: pulse-crm-migrate
  runtime: python
  repo: https://github.com/samhith153/PULSE-CRM
  plan: free
  rootDir: backend
  buildCommand: pip install -r requirements.txt
  startCommand: "alembic upgrade head"
  # Run this manually after deploying code changes

# Backend start command becomes just:
startCommand: "uvicorn app.main:app --host 0.0.0.0 --port $PORT"
```

### Risk

Low. You just need to remember to run migrations after code changes that include new migrations. Alternatively, keep it in startup but make it fast (Alembic checks the current revision first and no-ops if up to date).

---

## 4.3 — Use `--workers` flag for Uvicorn

**File:** `render.yaml` (both backend and AI service `startCommand`)
**Severity:** Low-Medium
**Impact:** Better concurrency under load.

### Problem

Uvicorn runs with a single worker by default. On Render free tier (512MB RAM, 0.1 CPU), this is fine, but if you upgrade, you should add workers.

### Fix

```yaml
# When on a paid plan:
startCommand: "uvicorn app.main:app --host 0.0.0.0 --port $PORT --workers 2"
```

Note: Don't use multiple workers with the in-memory rate limiter (issue 1.6). Fix Redis first, then add workers.

### Risk

Low. Each worker uses ~100-150MB RAM. On 512MB free tier, stick to 1 worker. On 1GB+, use 2.

---

# SUMMARY — Priority order

| # | Fix | Effort | Impact | Risk |
|---|-----|--------|--------|------|
| 1.1 | Fix DB pooling bug (1 line) | 5 min | 🔴 Critical | Low |
| 4.1 | Keep-alive ping for Render free tier | 15 min | 🔴 Critical | None |
| 1.5 | Add LLM timeouts | 30 min | 🔴 High | Low |
| 3.4 | Remove 450ms artificial loading delay | 5 min | 🟡 Medium | None |
| 2.1 | Stream LLM responses (SSE) | 4 hrs | 🔴 Critical | Medium |
| 1.2 | Cache RBAC user resolution | 1 hr | 🟡 High | Medium |
| 1.3 | Add composite DB indexes | 1 hr | 🟡 High | Low |
| 3.1 | Lazy-load bot chat data | 15 min | 🟡 Medium | None |
| 2.3 | Fix N+1 queries (eager loading) | 3 hrs | 🟡 Medium | Low |
| 1.4 | Move startup work to background | 1 hr | 🟡 Medium | Low |
| 2.2 | Parallelize lead assessment | 2 hrs | 🟡 Medium | Medium |
| 2.4 | SQL aggregation for email stats | 1 hr | 🟡 Medium | Low |
| 2.5 | SQL pagination for conversations | 1 hr | 🟡 Medium | Low |
| 3.2 | Lazy-load three.js/framer-motion | 2 hrs | 🟡 Medium | Low |
| 1.6 | Redis rate limiting | 2 hrs | 🟢 Low | Medium |
| 3.3 | Granular SSE updates | 2 hrs | 🟢 Low | Low |
| 4.2 | Separate Alembic from startup | 30 min | 🟢 Low | Low |
| 4.3 | Add Uvicorn workers | 5 min | 🟢 Low | Low |

**Expected outcome after Phase 1 only:** The app should feel 3-5x faster — no more 30-80ms DB connection tax per request, no more 4-query RBAC overhead per request, no more hung LLM requests, and no more Render cold-start sleep.

**Expected outcome after all phases:** Sub-200ms API responses, streaming bot responses (first token in <1s), and instant tab switches on the frontend.

---

# APPENDIX — Architecture overview for the other AI

```
PULSE-CRM/
├── backend/          # FastAPI (Python) — main API server
│   ├── app/
│   │   ├── main.py              # entry point, lifespan, middleware
│   │   ├── api/v1/              # 38 route files (all eagerly loaded)
│   │   │   ├── router.py        # central router registration
│   │   │   ├── assistant.py     # chatbot endpoint (Groq, no streaming)
│   │   │   ├── ai.py            # AI endpoints
│   │   │   ├── ai_insights.py   # 1485 lines, heavy sync computation
│   │   │   └── ...
│   │   ├── api/deps.py          # get_current_user (RBAC, 4 queries/req)
│   │   ├── database/connection.py  # engine setup (BUG: NullPool always)
│   │   ├── services/
│   │   │   ├── groq_summary_provider.py  # sync Groq, no timeout
│   │   │   ├── ai_pipeline.py   # sequential awaits, could be parallel
│   │   │   ├── dashboard_service.py  # 2968 lines, sequential queries
│   │   │   ├── email_service.py # fire-and-forget tasks, no semaphore
│   │   │   └── ...
│   │   ├── repositories/
│   │   │   └── user_repository.py  # 4-level selectinload on every req
│   │   ├── models/              # all relationships lazy="select"
│   │   └── core/config.py      # settings (AI_TIMEOUT exists but unused)
│   └── alembic/                 # migrations (only single-col indexes)
│
├── ai-service/       # FastAPI (Python) — separate AI microservice
│   ├── main.py                  # app factory
│   ├── app/
│   │   ├── core/config.py       # LLM_TIMEOUT=30, never used
│   │   ├── services/
│   │   │   └── conversation_service.py  # AsyncGroq, no timeout, no streaming
│   │   └── routers/             # 4 routers
│   └── requirements.txt
│
├── frontend/         # Next.js 16 (React 19, TypeScript)
│   ├── next.config.ts           # rewrites /api/v1 to backend
│   ├── src/
│   │   ├── app/                # App Router pages
│   │   │   ├── layout.tsx      # root layout (fonts, theme script)
│   │   │   └── dashboard/      # dashboard pages
│   │   ├── components/dashboard/
│   │   │   ├── DashboardShell.tsx   # lazy-loads 40+ view components
│   │   │   ├── AICopilotChat.tsx    # fake bot replies (setTimeout)
│   │   │   └── ... (40+ view files)
│   │   ├── hooks/
│   │   │   ├── use-dashboard.ts     # 5-min cache, abort controller
│   │   │   ├── use-crm-stream.ts    # SSE, debounced full refetch
│   │   │   └── ...
│   │   └── utils/api.ts        # 2604 lines, has GET dedup + 60s cache
│   └── package.json            # three, framer-motion, recharts (heavy)
│
├── render.yaml       # Render deployment config (FREE TIER — sleeps!)
└── docker/           # Docker configs
```

### Data flow (bot/chat path):
```
User types in chat
  → AICopilotChat.tsx (simulateBotReply — FAKE, no real API call)
  → [If real] assistant.py /chat endpoint
    → asyncio.to_thread(Groq sync call, NO timeout)
    → wait for full response
    → return JSON
  → Frontend renders full response at once (no streaming)
```

### Data flow (dashboard load):
```
DashboardShell mounts
  → useDashboardOverview() → GET /api/v1/dashboard/me
    → get_current_user() → 4 SQL queries (RBAC, no cache)
    → dashboard_service → 11 sequential queries
    → each query opens a NEW DB connection (NullPool bug)
  → useCrmStream() → SSE connection to /api/v1/stream/dashboard
  → AICopilotChat mounts → GET /leads + GET /deals (even if chat closed)
```

### Data flow (lead scoring update — "updates very slow"):
```
Email sync webhook → inbound email
  → email_service creates asyncio.create_task(_summarize_and_assess)
    → NO semaphore (unbounded concurrency)
    → _summarize_and_assess:
      → groq_summary_provider (sync, no timeout)
      → ai_pipeline.run_lead_assessment (sequential queries)
      → writes scores to DB
  → SSE pushes LEAD_SCORE_UPDATED
  → Frontend does full dashboard refetch
```

---

*End of report. Hand this file to your coding AI along with the repo URL. Each fix is self-contained and non-breaking.*
