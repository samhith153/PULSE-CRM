# Engagement Features: Correctness Fixes + Inbound Trigger

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Make the `ai/pipeline/engagement_features.py` scoring logic correct, and ensure engagement features recompute when an inbound email arrives (the behavior the user expects), instead of only on a 5-minute global batch.

**Architecture:** `engagement_features.py` is a pure-function feature-engineering module consumed only by `ai/pipeline/export_real_features.py`, which `backend/app/main.py:recompute_features()` runs on a 5-minute APScheduler interval over every org. The inbound email path (`backend/app/main.py:poll_gmail_replies` → `EmailService.sync_all_connections`) stores emails and emits an `EMAIL_RECEIVED` event but never recomputes features. We will (1) fix the logic bugs, (2) make `recompute_features` callable incrementally per lead, and (3) hook a per-lead/per-org feature recompute into the inbound email event so scores stay fresh.

**Tech Stack:** Python 3.11, pandas, SQLAlchemy (async), APScheduler, FastAPI. No new dependencies.

---

## Critical context (read before implementing)

**The functions do NOT currently trigger on inbound mail.** Confirmed by code search:
- `engagement_features` is imported only by `ai/pipeline/export_real_features.py` and `ai/pipeline/test_real_data.py`.
- `export_real_features.py` is invoked solely by `recompute_features()` in `backend/app/main.py:60`, scheduled at `backend/app/main.py:120` as `scheduler.add_job(recompute_features, "interval", minutes=5)`.
- Inbound handler `poll_gmail_replies()` (`main.py:88`, every 2 min) → `EmailService.sync_all_connections()` persists `Email` rows and `record_email_received()`. No feature recompute.
- Real-time scoring path `backend/app/services/lead_scoring_service.py` reads precomputed `feature_vectors` columns and feeds `ai/scoring/engagement_engine.calculate_engagement_score`. It never calls the pandas functions directly.

**Bugs found in the current logic:**
1. `customer_initiative_score()` returns `100 / 30 / 0`, but `ai/scoring/reason_generator.py:185` checks `== 60` (a phantom "MIXED" branch). The `60` branch is dead — only `100`/`30`/`0` ever match.
2. `engagement_trend_score()` is always called as `engagement_trend_score(None, None)` in `export_real_features.py:63` → always returns `50`. The trend feature is effectively dead.
3. `ai_intent_category_score` is always fed `None` (`export_real_features.py:60`) → intent scoring contributes nothing.
4. `average_response_time()` returns `None` (not `0`) for `<2` emails; downstream `response_time_score(None)` returns `0` — acceptable but the `export_real_features` row stores `None` in a `Float` column, which is fine.

**Assumptions:**
- `load_real_emails(ORG_ID)` (in `ai/pipeline/db_adapter.py`) returns a DataFrame with columns `lead_id`, `direction` (`"inbound"`/`"outbound"`), `sent_at` (timestamp). Verify before Phase C.
- `EMAIL_RECEIVED` events carry `aggregate_id` = email id and a resolvable `lead_id` in payload (confirm in `email_service.py`).

---

## Phase A — Fix the pure-function logic

### Task 1: Fix `customer_initiative_score` return values to match `reason_generator`

**Objective:** Make the initiative score and its reason text consistent.

**Files:**
- Modify: `ai/pipeline/engagement_features.py` (`customer_initiative_score`)
- Modify: `ai/scoring/reason_generator.py:183-190`

**Step 1: Write failing test**

Create: `ai/pipeline/tests/test_customer_initiative.py`
```python
import pandas as pd
from engagement_features import customer_initiative_score

def _df(direction):
    return pd.DataFrame({"direction": [direction], "sent_at": [pd.Timestamp("2026-01-01")]})

def test_inbound_latest_returns_100():
    assert customer_initiative_score(_df("inbound")) == 100

def test_outbound_latest_returns_30():
    # reason_generator checks == 30 for "SALES DRIVEN"
    assert customer_initiative_score(_df("outbound")) == 30

def test_empty_returns_0():
    assert customer_initiative_score(pd.DataFrame(columns=["direction", "sent_at"])) == 0
```

**Step 2: Run test to verify failure**
Run: `cd ai/pipeline && python -m pytest tests/test_customer_initiative.py -v`
Expected: FAIL (file/dir may not exist yet) — create the `tests/` dir first.

**Step 3: Make the function correct + align reason_generator**
The function already returns `100/30/0`, which is correct. The only change needed is in `reason_generator.py`: remove the dead `== 60` branch (or change the function to return `60` for "mixed" — but we have no mixed signal, so delete the branch).

In `ai/scoring/reason_generator.py:185-186`, change:
```python
    elif customer_initiative_score == 60:
        reasons.append(f"🔄 MIXED - Both sides initiating → Healthy two-way conversation")
```
to a no-op (delete those two lines). Keep `100/30/0` branches.

**Step 4: Run test to verify pass**
Run: `cd ai/pipeline && python -m pytest tests/test_customer_initiative.py -v`
Expected: 3 passed.

**Step 5: Commit**
```bash
git add ai/pipeline/engagement_features.py ai/scoring/reason_generator.py ai/pipeline/tests/test_customer_initiative.py
git commit -m "fix: align customer_initiative_score with reason_generator (drop dead 60 branch)"
```

### Task 2: Make `engagement_trend_score` use real inputs

**Objective:** Stop hard-coding `None` for trend so the feature is meaningful.

**Files:**
- Modify: `ai/pipeline/export_real_features.py:63`

**Step 1: Write failing test**
Create: `ai/pipeline/tests/test_trend.py`
```python
from engagement_features import engagement_trend_score

def test_strong_positive():
    assert engagement_trend_score(100, 70) == 100

def test_dead_branch_currently_returns_50():
    # documents current broken behavior we are replacing
    assert engagement_trend_score(None, None) == 50
```

**Step 2: Run test to verify current behavior**
Run: `cd ai/pipeline && python -m pytest tests/test_trend.py -v`
Expected: 2 passed (documents the dead path).

**Step 3: Pass real intent scores**
In `export_real_features.py`, replace:
```python
        "engagement_trend_score": engagement_trend_score(None, None),
```
with computation from the lead's latest vs 7-day-old email intent. Since real LLM intent isn't plumbed yet, derive a proxy from `customer_initiative_score` today vs a stored previous snapshot — OR, minimally, pass the current `buying_stage_score` as both `intent_today` and a previously-saved stage. For this plan, implement the minimal correct call:
```python
        # Trend requires historical intent; fall back to stage score as proxy until LLM intent lands.
        stage_score = buying_stage_score(stage)
        engagement_trend_score: engagement_trend_score(stage_score, stage_score),  # stable (50) until history exists
```
This keeps it honest (returns 50 = "stable/unknown") without pretending to have trend data.

**Step 4: Run test**
Run: `cd ai/pipeline && python -m pytest tests/test_trend.py -v`
Expected: 2 passed.

**Step 5: Commit**
```bash
git add ai/pipeline/export_real_features.py ai/pipeline/tests/test_trend.py
git commit -m "fix: stop hard-coding None into engagement_trend_score"
```

### Task 3: Unit tests for every remaining feature function

**Objective:** Lock down `average_response_time`, `response_time_score`, `days_since_last_outbound`, `engagement_decay_penalty`, `ai_intent_category_score`, `buying_stage_score`, `reply_recency_score`.

**Files:**
- Create: `ai/pipeline/tests/test_engagement_features.py`

**Step 1: Write tests**
```python
import pandas as pd
from engagement_features import (
    average_response_time, response_time_score, days_since_last_outbound,
    engagement_decay_penalty, ai_intent_category_score, buying_stage_score,
    reply_recency_score,
)

def test_average_response_time_basic():
    df = pd.DataFrame({
        "thread_id": [1,1],
        "direction": ["outbound","inbound"],
        "sent_at": [pd.Timestamp("2026-01-01 09:00"), pd.Timestamp("2026-01-01 11:00")],
    })
    assert average_response_time(df) == 2.0

def test_average_response_time_single_email_is_none():
    df = pd.DataFrame({"thread_id":[1],"direction":["inbound"],"sent_at":[pd.Timestamp("2026-01-01")]})
    assert average_response_time(df) is None

def test_response_time_score_buckets():
    assert response_time_score(None) == 0
    assert response_time_score(1) == 100
    assert response_time_score(4) == 90
    assert response_time_score(12) == 75
    assert response_time_score(48) == 55
    assert response_time_score(120) == 30
    assert response_time_score(200) == 10

def test_days_since_last_outbound_requires_outbound():
    df = pd.DataFrame({"direction":["inbound"],"sent_at":[pd.Timestamp("2026-01-01")]})
    assert days_since_last_outbound(df) is None

def test_engagement_decay_penalty_buckets():
    assert engagement_decay_penalty(None) == 0
    assert engagement_decay_penalty(3) == 0
    assert engagement_decay_penalty(7) == -2
    assert engagement_decay_penalty(14) == -5
    assert engagement_decay_penalty(30) == -10
    assert engagement_decay_penalty(60) == -20
    assert engagement_decay_penalty(90) == -30

def test_ai_intent_category_score_known():
    assert ai_intent_category_score("contract_signed") == 100
    assert ai_intent_category_score("lost") == -100
    assert ai_intent_category_score("unknown_thing") == 0

def test_buying_stage_score_known():
    assert buying_stage_score("won") == 100
    assert buying_stage_score("new") == 10
    assert buying_stage_score(None) == 0
    assert buying_stage_score("nonexistent") == 0

def test_reply_recency_score_buckets():
    future = pd.Timestamp.now() + pd.Timedelta(days=1)
    old = pd.Timestamp.now() - pd.Timedelta(days=30)
    assert reply_recency_score(pd.DataFrame({"sent_at":[future]})) == 100  # <=1 day
    assert reply_recency_score(pd.DataFrame({"sent_at":[old]})) == 20      # >14 days
```

**Step 2: Run tests**
Run: `cd ai/pipeline && python -m pytest tests/test_engagement_features.py -v`
Expected: all passed. If any fail, fix the function to match the documented spec (the tests encode the spec from the docstrings).

**Step 3: Commit**
```bash
git add ai/pipeline/tests/test_engagement_features.py
git commit -m "test: unit tests for all engagement_features functions"
```

---

## Phase B — Make `recompute_features` incremental

### Task 4: Add `--lead-id` support to `export_real_features.py`

**Objective:** Allow recomputing a single lead instead of the whole org (needed for inbound triggering).

**Files:**
- Modify: `ai/pipeline/export_real_features.py:22-32`

**Step 1: Add the argument + filter**
Change the argparse + loop:
```python
parser.add_argument("--org-id", required=True)
parser.add_argument("--lead-id", default=None)
args = parser.parse_args()
ORG_ID = args.org_id

emails = load_real_emails(ORG_ID)
leads = load_real_leads(ORG_ID)
leads_lookup = leads.set_index("lead_id").to_dict(orient="index")

if args.lead_id:
    emails = emails[emails["lead_id"] == args.lead_id]
    leads_lookup = {args.lead_id: leads_lookup.get(args.lead_id, {})}

rows = []
for lead_id, group in emails.groupby("lead_id"):
    ...
```

**Step 2: Smoke test (manual, needs DB)**
Run: `cd ai/pipeline && python export_real_features.py --org-id <ORG> --lead-id <LEAD>`
Expected: prints a single-lead DataFrame, no crash. (DB reachable only in the user's environment.)

**Step 3: Commit**
```bash
git add ai/pipeline/export_real_features.py
git commit -m "feat: support --lead-id incremental recompute in export_real_features"
```

### Task 5: Expose a `recompute_lead(org_id, lead_id)` helper in `main.py`

**Objective:** Wrap the subprocess call so the inbound path can invoke it directly.

**Files:**
- Modify: `backend/app/main.py:60-86` (`recompute_features`)

**Step 1: Add helper**
```python
def recompute_lead_features(org_id: str, lead_id: str | None = None):
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    pipeline_script = os.path.join(project_root, "..", "ai", "pipeline", "export_real_features.py")
    cmd = [sys.executable, pipeline_script, "--org-id", str(org_id)]
    if lead_id:
        cmd += ["--lead-id", str(lead_id)]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"Feature recompute failed for lead {lead_id} org {org_id}:", result.stderr)
    else:
        print(f"Feature recompute completed for lead {lead_id} org {org_id}.")
```

**Step 2: Refactor `recompute_features` to call it**
Replace the per-org loop body to call `recompute_lead_features(org_id)`.

**Step 3: Commit**
```bash
git add backend/app/main.py
git commit -m "refactor: extract recompute_lead_features helper for incremental use"
```

---

## Phase C — Trigger on inbound email

### Task 6: Hook feature recompute into the inbound email flow

**Objective:** When an inbound email is stored, recompute that lead's engagement features (the user's expectation).

**Files:**
- Modify: `backend/app/services/email_service.py` (after `record_email_received`) OR `backend/app/main.py:poll_gmail_replies`

**Step 1: Determine lead linkage**
In `email_service.py`, find where `record_email_received` is called and confirm the payload includes `lead_id`. If `Email` has a `lead_id` column, read it; else resolve from thread/contact. (Read `app/models/email.py` and the sync method first.)

**Step 2: Call the recompute helper**
After the email is persisted and the event recorded, call:
```python
from app.main import recompute_lead_features
recompute_lead_features(organization_id, lead_id)
```
Do this in a `try/except` so a feature-recompute failure never breaks email storage. Prefer doing it after `db.commit()`.

**Step 3: Verify no circular import**
`app.main` imports the email service; calling `recompute_lead_features` from `email_service` creates a potential cycle. Avoid by moving `recompute_lead_features` into a small module `backend/app/services/feature_recompute_service.py` and importing it in both `main.py` and `email_service.py`.

**Step 4: Manual test (needs DB + running backend)**
Send/test an inbound email for a lead → confirm `feature_vectors` row for that lead updates within the request (or via the 5-min job as before).

**Step 5: Commit**
```bash
git add backend/app/services/feature_recompute_service.py backend/app/services/email_service.py backend/app/main.py
git commit -m "feat: recompute engagement features on inbound email"
```

---

## Phase D — Validation

### Task 7: Run the full engagement test suite
Run: `cd ai/pipeline && python -m pytest tests/ -v`
Expected: all pass.

### Task 8: Type-check backend
Run: `cd backend && .venv/Scripts/python.exe -m py_compile app/main.py app/services/email_service.py app/services/feature_recompute_service.py`
Expected: no syntax errors.

### Task 9: End-to-end manual check (user environment)
1. Start backend + frontend.
2. Trigger/simulate an inbound email for an existing lead.
3. Confirm `feature_vectors` for that lead now reflects updated `average_response_time` / `response_time_score` / `customer_initiative_score`.
4. Open the lead score view → reasons text matches the score (no dead "MIXED" branch).

---

## Risks / Trade-offs / Open questions
- **DB dependency:** `pytest` here can't run (Supabase unreachable from agent env, env contaminated). Tests must be run by the user in their environment. Plan documents exact commands.
- **Subprocess cost:** Calling `export_real_features.py` per inbound email spawns a Python process each time. For low email volume this is fine; for high volume, debounce (e.g., mark lead dirty and batch in the 5-min job). Phase C uses the existing per-org job as fallback regardless.
- **Intent scoring gap:** `ai_intent_category_score` has no real LLM input yet; it stays `None` → `0`. Out of scope to wire the LLM here; noted as a follow-up.
- **Lead linkage:** Confirm `Email.lead_id` exists before Task 6; if not, the inbound hook should resolve lead from contact/thread.
- **Circular import:** Resolved by extracting `feature_recompute_service.py` (Task 6, Step 3).
