# Inbound-Email → Engagement/Recommendation Recompute

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Make engagement (and recommendation) scoring actually recompute when an inbound email arrives for a lead — fixing the gap where inbound email flows through but no feature/score recompute fires.

**Architecture:** Inbound Gmail polling stores emails and emits `EMAIL_RECEIVED` events but never links them to leads (`external_entity_id` is `None` in the logs), so the per-lead recompute guard never triggers. We will (1) ensure the 5-min batch recompute actually runs (it was silently failing on `DATABASE_URL_SYNC`), (2) resolve a lead for each inbound email so the per-inbound hook can fire, and (3) optionally refresh recommendations. The recompute itself calls `ai/pipeline/export_real_features.py` which writes `feature_vectors` rows consumed by `lead_scoring_service`.

**Tech Stack:** Python 3.11, FastAPI, SQLAlchemy (async), APScheduler, pandas, subprocess.

---

## Evidence from `log.txt` (why this plan exists)

- `EMAIL_RECEIVED` events processed (many), each with `"external_entity_id": None, "external_entity_type": None` → **inbound emails are NOT linked to leads**.
- Only 2 lines mention `recompute`: the 5-min `recompute_features` APScheduler job "executed successfully" (lines 2474, 2477). No per-lead feature output, no "Feature recompute completed" — consistent with the subprocess failing because `DATABASE_URL_SYNC` was unset (now fixed in `ai/pipeline/db_adapter.py`).
- Zero `engagement` / `recommendation` / `score_lead` log lines tied to inbound.
- The inbound hook added in `backend/app/services/email_service.py` is NOT in this build (log predates uncommitted edits) AND would not fire anyway because of the `None` lead linkage.

---

## Phase A — Make the batch recompute actually run (verification + safety)

### Task 1: Confirm `db_adapter` derives a working sync URL

**Objective:** Ensure `export_real_features.py` can connect (it previously KeyError'd on `DATABASE_URL_SYNC`).

**Files:**
- Verify: `ai/pipeline/db_adapter.py` (`_sync_db_url` present — added earlier)

**Step 1: Dry-run the sync-URL resolver**
Run: `cd ai/pipeline && python -c "import db_adapter; print(db_adapter._sync_db_url())"`
Expected: prints a `postgresql+psycopg://...` URL derived from `DATABASE_URL` (no `asyncpg`).

**Step 2: Confirm psycopg driver is available**
Run: `cd backend && .venv/Scripts/python.exe -c "import psycopg; print('ok')"`
Expected: `ok`. If `ModuleNotFoundError`, add `psycopg[binary]` to backend requirements.

**Step 3: Commit (if a driver install was needed)**
```bash
git add backend/requirements.txt
git commit -m "chore: add psycopg driver for pandas feature export"
```

### Task 2: Add structured logging to `recompute_lead_features`

**Objective:** So future logs show whether recompute succeeded per org/lead (currently `print()` output isn't captured by the scheduler logger).

**Files:**
- Modify: `backend/app/services/feature_recompute_service.py` (already logs via `logger.info/warning`)

**Step 1: Verify the service logs at INFO on success and WARNING on failure**
Read `feature_recompute_service.py`; confirm both branches exist (they do from earlier edit).

**Step 2: No code change needed if present — otherwise add:**
```python
logger.info("Feature recompute completed for org=%s lead=%s", org_id, lead_id)
logger.warning("Feature recompute failed for org=%s lead=%s: %s", org_id, lead_id, result.stderr)
```

**Step 3: Commit**
```bash
git add backend/app/services/feature_recompute_service.py
git commit -m "chore: structured logging for feature recompute"
```

---

## Phase B — Link inbound emails to leads

This is the root cause: without a lead link, the per-inbound hook can never fire.

### Task 3: Resolve lead_id from inbound email in `ingest_email`

**Objective:** Populate `external_entity_id` / `external_entity_type="lead"` on inbound email so the recompute hook and downstream features work.

**Files:**
- Modify: `backend/app/services/email_service.py` (`ingest_email`, around line 451–544)

**Step 1: Decide resolution strategy (pick ONE, document choice)**
Options:
- (a) Thread/contact mapping: look up the email thread's linked lead via `Conversation`/`Contact` → `lead_id`.
- (b) Sender-domain match: match `sender` domain to a company → its primary lead.
- (c) Explicit param: the caller (Gmail sync) already knows `external_entity_id` but currently passes `None`.

**Step 2: Add a helper `resolve_lead_id_for_email(sender, thread_id, organization_id)`**
```python
async def _resolve_lead_id(self, sender: str, thread_id: Optional[str], organization_id: UUID) -> Optional[UUID]:
    # TODO: implement via contact/thread lookup; return None if unresolved
    return None
```

**Step 3: In `ingest_email`, when `direction == INBOUND` and `external_entity_id is None`, call the resolver and set `external_entity_type="lead"` if found**
```python
if direction == EmailDirection.INBOUND and external_entity_id is None:
    resolved = await self._resolve_lead_id(sender, thread_id, organization_id)
    if resolved is not None:
        external_entity_id = resolved
        external_entity_type = "lead"
```
(Place before the `email_repo.create(...)` call so the stored row carries the link.)

**Step 4: Add a unit/integration test** (needs DB; run in user env)
Assert that an inbound email from a known lead's contact results in `external_entity_id` set.

**Step 5: Commit**
```bash
git add backend/app/services/email_service.py
git commit -m "feat: resolve lead link for inbound emails"
```

---

## Phase C — Fire recompute on inbound (already mostly wired; verify + harden)

### Task 4: Verify the existing inbound hook fires for linked leads

**Objective:** Confirm `ingest_email` calls `recompute_lead_features` when a lead is linked.

**Files:**
- Verify: `backend/app/services/email_service.py` (lines ~521–546, added earlier)

**Step 1: Structural check**
Run: `grep -n "recompute_lead_features(str(organization_id)" backend/app/services/email_service.py`
Expected: 1 match inside the `direction == INBOUND` + `external_entity_type == "lead"` block.

**Step 2: Confirm guard order** — hook must come AFTER the lead-link resolution from Task 3, so the guard sees the resolved link. Re-read the method; move the hook below the resolution if needed.

**Step 3: Commit (only if reordering was needed)**
```bash
git add backend/app/services/email_service.py
git commit -m "fix: order inbound recompute after lead resolution"
```

### Task 5: Debounce per-inbound subprocess spawns

**Objective:** Avoid spawning a Python process per inbound email under high volume (the 5-min batch remains the safety net).

**Files:**
- Modify: `backend/app/services/feature_recompute_service.py`

**Step 1: Add an in-process debounce (e.g., mark lead dirty, flush every N seconds) OR simply rely on the batch job and make the inbound call best-effort (already best-effort). Document the chosen approach.**

**Step 2: If debouncing, add a small dict of `pending_lead_ids` with a flush timer; otherwise no change.**

**Step 3: Commit (if changed)**
```bash
git add backend/app/services/feature_recompute_service.py
git commit -m "perf: debounce inbound feature recompute"
```

---

## Phase D — Recommendation refresh (optional, confirm with user)

### Task 6: Trigger recommendation refresh on inbound

**Objective:** If the user wants `ai_insights_service` / `ai_providers` email-engagement recommendations to refresh on inbound, wire it.

**Files:**
- Modify: `backend/app/services/email_service.py` (after recompute) OR a new `recommendation_refresh_service.py`

**Step 1: Inspect `ai_insights_service._generate_recommendation` entrypoints** to find a callable refresh.
**Step 2: Call it (best-effort) when a lead is linked on inbound.**
**Step 3: Commit**
```bash
git add backend/app/services/email_service.py
git commit -m "feat: refresh recommendations on inbound email"
```

> NOTE: Ask the user before Task 6 — recommendation refresh may be out of scope / expensive. The core ask is engagement score.

---

## Phase E — Validation

### Task 7: Type-check + compile backend
Run: `cd backend && .venv/Scripts/python.exe -m py_compile app/main.py app/services/email_service.py app/services/feature_recompute_service.py`
Expected: no syntax errors.

### Task 8: Re-run engagement feature unit tests
Run: `cd ai/pipeline && python -m pytest tests/ -q`
Expected: 17 passed.

### Task 9: End-to-end in user environment
1. Start backend + DB reachable.
2. Send/sync an inbound email that resolves to a lead.
3. Confirm in logs: `Feature recompute completed for org=… lead=…` appears right after the `EMAIL_RECEIVED` event (not just on the 5-min tick).
4. Query `feature_vectors` for that lead → `average_response_time` / `response_time_score` / `customer_initiative_score` updated.
5. Open the lead score view → reasons text matches score (no dead "MIXED" branch).

---

## Risks / Trade-offs / Open questions
- **Lead linkage is the hard part.** If inbound emails can't be reliably mapped to a lead (no contact/thread link), the per-inbound recompute will rarely fire and the 5-min batch remains the de-facto source. Task 3 must pick a robust resolution strategy.
- **DB reachability:** `export_real_features.py` needs Supabase reachable. In the agent env it isn't, so Tasks 1/8/9 must be run by the user.
- **Subprocess cost:** per-inbound `subprocess.run` spawns a Python interpreter; Task 5 debounces if volume is high.
- **Recommendation scope:** Task 6 is optional — confirm with user before implementing.
- **Log capture:** scheduler `print()` output wasn't captured in `log.txt`; Task 2 switches to the `logger` so future runs are observable.
