# PULSE CRM — AI Services: Complete End-to-End Flow

> **Purpose:** Single source of truth for how the AI scoring/recommendation system works, where every request starts, and where data flows. Read this before making any changes to the AI pipeline.

---

## Table of Contents

1. [Three-Layer Architecture](#1-three-layer-architecture)
2. [The Unified Orchestrator: `run_lead_assessment()`](#2-the-unified-orchestrator-run_lead_assessment)
3. [How the AI Service Scores a Lead](#3-how-the-ai-service-scores-a-lead)
4. [The 5 Triggers (Where Requests Start)](#4-the-5-triggers-where-requests-start)
5. [Data Write Targets](#5-data-write-targets)
6. [Frontend Display (30s Polling)](#6-frontend-display-30s-polling)
7. [Key Rules and Constants](#7-key-rules-and-constants)
8. [Stage Mapping](#8-stage-mapping)
9. [Recommendation Paths](#9-recommendation-paths)
10. [Known Inconsistencies & Recommendations](#10-known-inconsistencies--recommendations)

---

## 1. Three-Layer Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│  FRONTEND (Next.js :3000)                                          │
│  - Never calls ai-service directly                                 │
│  - GET /api/v1/leads → scores from DB                              │
│  - POST /api/v1/ai/recommendations/batch → via backend             │
│  - Polls every 30 seconds                                          │
└────────────────────────────┬────────────────────────────────────────┘
                             │ HTTP (GET /leads, POST /ai/recommendations/batch)
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│  BACKEND (FastAPI :8000)                                           │
│  - Owns the database (PostgreSQL on Supabase)                      │
│  - Orchestrates all data gathering                                 │
│  - Calls ai-service over HTTP                                      │
│  - Persists results to lead_scores, ai_recommendations,            │
│    feature_vectors                                                 │
│  - Triggers assessments on events (4 triggers + daily cron)        │
└────────────────────────────┬────────────────────────────────────────┘
                             │ HTTP (POST /api/v1/leads/assess)
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│  AI-SERVICE (FastAPI :8001)                                        │
│  - Stateless compute (NO database access)                          │
│  - Receives raw lead data → returns scores + recommendations       │
│  - Pure Python rules engine                                        │
└─────────────────────────────────────────────────────────────────────┘
```

**Key principle:** The backend owns all data. The ai-service is a pure compute function. If the ai-service is down, the backend skips assessment and retries later via the daily refresh job.

---

## 2. The Unified Orchestrator: `run_lead_assessment()`

**File:** `backend/app/services/ai_pipeline.py` (line 115)

Every trigger funnels into this single function. It does 5 steps:

### Step 1 — Gather raw lead data from DB
```
reads: Lead (employee_count, industry, current_crm, operational_systems)
        Deal (amount, pipeline_stage.slug)
        EmailSummary (intent/summary_word)
        Email (all inbound/outbound for this lead)
```

### Step 2 — Compute email analytics
Calls `EmailStatsService.get_lead_email_stats()` (file: `backend/app/services/email_analytics.py`).
Returns:
- `inbound_count` — total inbound emails
- `initiated_count` — customer-initiated emails (see §7 for rule)
- `outbound_email_count` — total outbound emails
- `last_inbound_at` — datetime of most recent inbound email
- `days_since_last_outbound` — days since last outbound email

### Step 3 — Derive `current_stage` (buying stage)
```python
# ai_pipeline.py:_derive_current_stage()
1. If deal exists and deal.pipeline_stage.slug is in PIPELINE_STAGE_MAP:
     → use PIPELINE_STAGE_MAP[slug]  (e.g. "proposal" → "proposal_sent")
2. Fallback: lead.status (lifecycle field, e.g. "new", "contacted", "qualified")
```

### Step 4 — Get `intent`
Fetches the latest `EmailSummary.intent` or `EmailSummary.summary_word` linked to this lead. Values like `"demo_request"`, `"pricing_negotiation"`, `"positive"`, etc. (see `_INTENT_SCORE_MAP` in engagement_rules.py).

### Step 5 — Call ai-service, then persist
```
POST http://ai-service:8001/api/v1/leads/assess
  body: {lead_id, employees, industry, current_crm, operational_system,
         current_stage, intent, inbound_count, initiated_count,
         last_inbound_at, days_since_last_outbound, deal_value, tags}

Response: {fit: {score, reasons, features},
           engagement: {score, reasons, features},
           overall: {score, tier, top_reasons},
           recommendation: {action, score, reasons, all_recommendations},
           versions: {assessment_version, model_version, prompt_version}}
```

Then persists to **3 tables**:
| Table | What is stored |
|-------|---------------|
| `lead_scores` | fit_score, engagement_score, overall_score, priority_tier, fit_reasons, engagement_reasons, top_reasons |
| `ai_recommendations` | recommendation (action), reasoning, priority, metadata_json (trigger, stage, all_recommendations) |
| `feature_vectors` | All raw feature values + email stats + assessment_trigger + version metadata (audit only) |

---

## 3. How the AI Service Scores a Lead

**Files:**
- `ai-service/app/services/lead_service.py` — orchestrator
- `ai-service/app/services/scoring_service.py` — `_build_features()` + `score_lead()`
- `ai-service/app/rules/fit_score_rules.py` — fit feature computation
- `ai-service/app/rules/engagement_rules.py` — engagement feature computation
- `ai-service/app/rules/fit_score.py` — weighted fit score
- `ai-service/app/rules/engagement_score.py` — weighted engagement score
- `ai-service/app/rules/tier_rules.py` — overall + tier assignment
- `ai-service/app/rules/reason_rules.py` — human-readable reasons
- `ai-service/app/services/recommendation_service.py` — next-best-action

### 3a. Fit features (0–100 each)

| Feature | Source | Scoring |
|---------|--------|---------|
| `company_size_score` | `employees` | Small (1–50): 90, 51–200: 70, 201–1000: 50, 1001–5000: 30, 5000+: 10 |
| `industry_complexity_score` | `industry` | High complexity (IT, Finance, Healthcare): 80–95; Medium: 50–70; Low: 20–30 |
| `software_gap_score` | `current_crm`, `operational_system` | No CRM: 90, Has basic CRM: 50, Has full CRM: 20 |
| `operational_system_score` | `operational_system` | No system: 80, Basic system: 50, Advanced: 20 |
| `customization_potential_score` | derived | Based on industry + company size |

### 3b. Engagement features

| Feature | Source | Formula |
|---------|--------|---------|
| `intent_score` | `email_summaries.summary_word` | Direct lookup in `_INTENT_SCORE_MAP` (see §7) |
| `buying_stage_score` | `current_stage` (derived) | Direct lookup in `_STAGE_SCORE_MAP` (see §8) |
| `initiative_score` | `inbound_count`, `initiated_count` | `initiated / inbound × 100`, capped at 100 |
| `decay_penalty` | `last_inbound_at` | Subtractive: 0/−5/−10/−20/−30 by days since last inbound |

### 3c. Score calculation

```
fit_score       = weighted_sum(fit_features)          → [0–100]
engagement_score = weighted_sum(engagement_features) + decay_penalty  → [0–100]
raw_score       = 0.6 × fit_score + 0.4 × engagement_score
tier            = assign_tier(fit_score, engagement_score)   → Critical/High/Medium/Low
final_score     = clamp(raw_score, tier_lower, tier_upper)
```

**Tier assignment rules:**
| Tier | Condition |
|------|-----------|
| Critical | fit ≥ 70 AND engagement ≥ 70 |
| High | (fit ≥ 70 OR engagement ≥ 70) AND both ≥ 40 |
| Medium | (fit ≥ 40 AND engagement ≥ 20) OR (fit ≥ 20 AND engagement ≥ 40) |
| Low | everything else |

### 3d. Recommendation

1. Normalize `current_stage` via `BUYING_STAGE_TO_ENGINE_TITLE` map
2. Check if terminal stage (`won`, `lost`, `converted`) → no recommendation
3. Get candidate actions for current stage
4. Score each candidate based on fit, engagement, deal value, email activity
5. Return top action + top-5 candidates

---

## 4. The 5 Triggers (Where Requests Start)

### Trigger A — Lead Created
```
POST /api/v1/leads
  → lead_service.create()
    → _enqueue_lead_ai(lead.id, ..., trigger="lead_created")    [fire-and-forget]
      → _lead_ai_compute() → run_lead_assessment()
```

### Trigger B — Lead Updated / Status Changed
```
PUT /api/v1/leads/{id}
  → lead_service.update()
    → _enqueue_lead_ai(lead.id, ..., trigger="lead_updated")    [fire-and-forget]

PATCH /api/v1/leads/{id}/status
  → lead_service.update_status()
    → _enqueue_lead_ai(lead.id, ..., trigger="lead_updated")    [fire-and-forget]
```
Status transitions are FSM-enforced: `new→contacted→qualified→proposal_sent→negotiation→won/lost`.

### Trigger C — Inbound Email (most complex)
```
Gmail sync / webhook / poll
  → email_service.ingest_email()
    → email_service.sync_messages() or _incremental_sync_from_gmail()
      → For each inbound email linked to a lead:
        → asyncio.create_task(_run_assessment_background(..., trigger="inbound_email"))
        → asyncio.create_task(_safe_summarize(...))  [generates intent]
      → Both run in parallel, background
```

Also triggered by the 5-minute Gmail poll: `poll_gmail_replies()` in `main.py`.

### Trigger D — Deal Stage Change
```
PUT /api/v1/deals/{id}  (with pipeline_stage_id change)
  → deal_service.update()
    → if deal.lead_id AND pipeline_stage_id changed:
        → run_lead_assessment(db, deal.lead_id, ..., trigger="deal_stage_changed")
```
This is synchronous (within the request), unlike the lead triggers which are fire-and-forget.

### Trigger E — Daily Refresh (Fallback)
```
APScheduler cron at hour=0, minute=0  (main.py:198)
  → daily_lead_assessment()
    → For each org → For each active lead:
        → Needs reassessment if:
            (a) Never scored (scored_at is null), OR
            (b) Decay changed (current decay != stored engagement_decay_penalty), OR
            (c) Missed event (latest inbound sent_at > lead_score.scored_at)
        → If yes: run_lead_assessment(..., trigger="daily_refresh")
```
This catches leads where the ai-service was down during a trigger, or where decay has shifted since last scoring.

---

## 5. Data Write Targets

| Table | Columns | Written by | Purpose |
|-------|---------|-----------|---------|
| `lead_scores` | fit_score, engagement_score, overall_score, priority_tier, fit_reasons, engagement_reasons, top_reasons, scored_at | `run_lead_assessment()` | Display scores on lead cards |
| `ai_recommendations` | recommendation, reasoning, priority, metadata_json, generated_at | `run_lead_assessment()` + `RecommendationService.batch_generate_for_leads()` | Display next-best-action |
| `feature_vectors` | All 5 fit features + 5 engagement features + 5 email stats + 4 audit columns (trigger, versions) | `run_lead_assessment()` | Audit trail + analytics only |
| `email_summaries` | summary_word, intent, sentiment, key_points, action_items | `email_service._safe_summarize()` → `EmailSummaryService` | Feeds `intent` to scoring |
| `emails` | All email fields, direction, thread_id, external_entity_id | `email_service.ingest_email()` | Raw email storage |

---

## 6. Frontend Display (30s Polling)

**File:** `frontend/src/components/dashboard/LeadsView.tsx` (line 243)

Every 30 seconds (and on mount):

1. `getLeads()` → `GET /api/v1/leads`
   - Backend joins `lead_scores` table → returns `fit_score`, `engagement_score`, `top_reasons`, `priority_tier` on each lead
   - Renders fit/engagement bars as percentages

2. `fetchBatchRecommendations(leadIds)` → `POST /api/v1/ai/recommendations/batch`
   - Backend iterates each lead → calls `RecommendationService.generate_for_lead()` → ai-service `POST /api/v1/recommendations/recommend`
   - Stores a new `AIRecommendation` row for each lead
   - Returns top action + reason for each lead

3. Renders recommendation text on each lead card.

---

## 7. Key Rules and Constants

### Intent Score Map (`engagement_rules.py`)

| Intent | Score |
|--------|-------|
| contract_signed | 100 |
| referral | 95 |
| pricing_negotiation | 90 |
| demo_request | 85 |
| urgent | 85 |
| proposal | 80 |
| budget | 75 |
| meeting | 70 |
| positive | 65 |
| interested | 60 |
| follow_up | 40 |
| inquiry | 35 |
| introduction | 30 |
| thank_you | 20 |
| neutral | 0 |
| support | 0 |
| complaint | −50 |
| negative | −70 |
| lost | −100 |

### Decay Penalty (`engagement_rules.py`)

| Days since last inbound | Penalty |
|------------------------|---------|
| ≤ 3 | 0 |
| 4–7 | −5 |
| 8–14 | −10 |
| 15–30 | −20 |
| > 30 | −30 |

### `initiated_count` Rule (`email_analytics.py`)

An inbound email counts as customer-initiated when:
- **(a)** It opens a thread (first email in the conversation is inbound), OR
- **(b)** The customer sends another inbound email before the salesperson replies (consecutive inbound)

`initiative_score = initiated_count / inbound_count × 100` (capped at 100)

### Version Constants (`lead_schema.py`)

```python
ASSESSMENT_VERSION = "1.0"
MODEL_VERSION      = "rule-based-v1"
PROMPT_VERSION     = "rule-based-v1"
```
Returned in every `/assess` response and persisted to `feature_vectors` for audit.

---

## 8. Stage Mapping

**Single source of truth:** `backend/app/utils/stage_maps.py`

### Deal slug → buying-stage slug
| Deal pipeline slug | Buying-stage slug |
|-------------------|-------------------|
| new | new |
| qualified | qualified |
| proposal | proposal_sent |
| negotiation | negotiation |
| won | won |
| lost | lost |

### Buying-stage slug → Engagement Engine score
| Slug | Score |
|------|-------|
| new | 10 |
| contacted | 25 |
| qualified | 45 |
| proposal_sent | 80 |
| negotiation | 90 |
| won | 100 |
| lost | 0 |
| converted | 50 |

### Buying-stage slug → Recommendation Engine title
| Slug | Title |
|------|-------|
| new | New Lead |
| contacted | Contacted |
| qualified | Qualified |
| proposal_sent | Proposal Sent |
| negotiation | Negotiation |
| won | Closed Won |
| lost | Closed Lost |
| converted | Closed Won |

### Terminal stages (no recommendation generated)
`won`, `lost`, `converted`

---

## 9. Recommendation Paths

There are **3 distinct recommendation code paths** that can produce different results for the same lead:

### Path 1 — Unified `/assess` (used by `ai_pipeline.py`)
```
ai_pipeline.run_lead_assessment()
  → POST /api/v1/leads/assess
    → ai-service lead_service.assess()
      → scoring_service.score_lead()  [compute scores]
      → recommendation_service.recommend()  [compute recommendation]
    → Store in ai_recommendations + lead_scores + feature_vectors
```
Triggered by: lead created/updated, inbound email, deal stage change, daily refresh.

### Path 2 — Standalone `/recommend` (used by `RecommendationService`)
```
api/v1/ai.py batch_recommendations()
  → RecommendationService.batch_generate_for_leads()
    → RecommendationService.generate_for_lead()
      → POST /api/v1/recommendations/recommend  (ai-service)
      → Store new AIRecommendation row
```
Triggered by: frontend `fetchBatchRecommendations()` every 30s.

### Path 3 — Enhanced recommendation (legacy, still mounted)
```
api/v1/ai.py enhanced_recommendation()
  → EnhancedRecommendationService.get_enhanced_recommendation()
```
Currently not called from the frontend.

**⚠️ Paths 1 and 2 use different raw-data dictionaries and different scoring logic.** A lead can show one recommendation in the list view (Path 2) and a different one when drilled into (Path 1). See §10.

---

## 10. Known Inconsistencies & Recommendations

### R1. Three conflicting recommendation paths (BIGGEST issue)
**Problem:** Path 1 (`/assess`) and Path 2 (`/recommend`) produce different recommendations for the same lead because they use different code paths and slightly different input data.
**Impact:** Lead card shows one action; detail view may show another.
**Fix:** Make `batch_generate_for_leads` read from the already-stored `ai_recommendation` row (written by `/assess`), or switch it to call `/assess` instead of `/recommend`.

### R2. Duplicate assessments on batch email sync
**Problem:** `sync_messages()` triggers assessment for the full set of inbound leads, then `ingest_email()` ALSO triggers assessment for each individual email. On a batch sync, one lead can be assessed 2× (2 HTTP calls, 2 DB writes, though upserts prevent duplicate rows).
**Fix:** Deduplicate the set of lead IDs that need assessment in `sync_messages` before spawning background tasks.

### R3. `convert_to_deal` fires `trigger="lead_updated"` (default)
**Problem:** `lead_service.py:414` calls `_enqueue_lead_ai(lead_id, organization_id, created_by)` with default `trigger="lead_updated"`, even though the lead status just changed to CONVERTED.
**Fix:** Either use `trigger="lead_converted"` or skip assessment for terminal-stage leads.

### R4. Daily refresh uses `created_by=None`
**Problem:** `daily_lead_assessment()` calls `run_lead_assessment(db, lead_id, UUID, None, ...)`. The `None` propagates to all `upsert` calls as `created_by`.
**Impact:** Audit columns show null `created_by` for daily-scored leads. Not a hard error but inconsistent with event-triggered scoring.
**Fix:** Use the lead's `owner_id` or a system user UUID.

### R5. `PIPELINE_STAGE_MAP` lacks `converted`
**Problem:** When a lead has status `"converted"` (set by `convert_to_deal`), the `_derive_current_stage()` fallback returns `"converted"`. The engagement engine's `_STAGE_SCORE_MAP` does have `converted: 50`, and `BUYING_STAGE_SCORES` has it too. Both maps currently match.
**Risk:** If someone adds a new status without updating both maps, the lead silently gets `buying_stage_score=0`.
**Fix:** Add a test that asserts `BUYING_STAGE_SCORES.keys() == _STAGE_SCORE_MAP.keys()`.

### R6. `.env` contains plaintext secrets
**Problem:** `backend/.env` contains Supabase database URL, SMTP credentials, and Groq API keys in plaintext. If committed to git, these are exposed.
**Fix:** Add `.env` to `.gitignore` if not already. Use environment variable injection (e.g., GitHub Actions secrets, Docker env vars) for production. Audit git history for leaked secrets.

---

## Appendix: File Reference

### ai-service
| File | Purpose |
|------|---------|
| `app/main.py` | FastAPI app factory, router registration |
| `app/schemas/lead_schema.py` | `LeadAssessRequest`, `LeadAssessResponse`, version constants |
| `app/routers/lead_router.py` | `POST /assess`, `POST /score` (legacy) |
| `app/services/lead_service.py` | `assess()` — orchestrates scoring + recommendation |
| `app/services/scoring_service.py` | `score_lead()` — builds features, computes all scores |
| `app/services/recommendation_service.py` | `recommend()` — next-best-action |
| `app/rules/fit_score_rules.py` | Fit feature computation |
| `app/rules/engagement_rules.py` | Engagement feature computation + decay |
| `app/rules/fit_score.py` | Weighted fit score |
| `app/rules/engagement_score.py` | Weighted engagement score |
| `app/rules/tier_rules.py` | Overall score + tier assignment |
| `app/rules/reason_rules.py` | Human-readable reasons |

### backend
| File | Purpose |
|------|---------|
| `app/main.py` | APScheduler jobs: `daily_lead_assessment`, `poll_gmail_replies` |
| `app/services/ai_pipeline.py` | `run_lead_assessment()` — the single orchestrator |
| `app/services/ai_client.py` | HTTP client wrapping ai-service endpoints |
| `app/services/lead_service.py` | Lead CRUD + `_enqueue_lead_ai()` fire-and-forget |
| `app/services/email_service.py` | Gmail sync + `_run_assessment_background()` |
| `app/services/email_analytics.py` | `EmailStatsService` + `initiated_count` rule |
| `app/services/deal_service.py` | Deal stage change → `run_lead_assessment()` |
| `app/services/recommendation_service.py` | Standalone recommendation (Path 2) |
| `app/services/feature_vector_service.py` | Audit-only read |
| `app/utils/stage_maps.py` | `PIPELINE_STAGE_MAP`, `BUYING_STAGE_SCORES`, terminal stages |
| `app/api/v1/leads.py` | Lead CRUD endpoints |
| `app/api/v1/ai.py` | Recommendation + batch endpoints |
| `app/api/v1/feature_vectors.py` | Feature vector read + compute trigger |
| `app/models/feature_vector.py` | FeatureVector ORM (32 columns incl. 9 audit) |
| `alembic/versions/20260806_0001_add_feature_vectors_audit_columns.py` | Migration for audit columns |

### frontend
| File | Purpose |
|------|---------|
| `src/utils/api.ts` | `getLeads()`, `fetchBatchRecommendations()`, all API calls |
| `src/components/dashboard/LeadsView.tsx` | 30s polling, fit/engagement bars, recommendation display |
