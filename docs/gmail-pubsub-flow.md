# PULSE CRM — Gmail Pub/Sub Email Integration Flow

> **Purpose:** Complete documentation of how inbound/outbound emails flow through the system, from Google Pub/Sub notifications to AI lead scoring. This covers the Gmail OAuth setup, real-time email sync, and the assessment pipeline.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Gmail OAuth Connection Setup](#2-gmail-oauth-connection-setup)
3. [Pub/Sub Watch Establishment](#3-pub-sub-watch-establishment)
4. [Inbound Email Flow (Real-Time)](#4-inbound-email-flow-real-time)
5. [Outbound Email Flow](#5-outbound-email-flow)
6. [Email Ingestion & Lead Matching](#6-email-ingestion--lead-matching)
7. [AI Assessment Pipeline](#7-ai-assessment-pipeline)
8. [Watch Refresh & Health](#8-watch-refresh--health)
9. [Configuration](#9-configuration)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                        Google Gmail API                               │
│  - Watch() → sends Pub/Sub notifications on inbox changes            │
│  - History API → provides delta sync of changed messages             │
└──────────────────────┬───────────────────────────────────────────────┘
                       │ Pub/Sub push notification
                       ▼
┌──────────────────────────────────────────────────────────────────────┐
│  Google Cloud Pub/Sub                                                │
│  Topic: projects/pulse-crm-505211/topics/pulse-crm-gmail-notifications│
│  Subscription: pulse-crm-gmail-sub (push → ngrok → localhost:8000)  │
└──────────────────────┬───────────────────────────────────────────────┘
                       │ POST /api/v1/gmail/pubsub/webhook
                       ▼
┌──────────────────────────────────────────────────────────────────────┐
│  PULSE CRM Backend (FastAPI :8000)                                   │
│                                                                      │
│  ┌─────────────────┐    ┌────────────────────┐                      │
│  │ pubsub_webhook  │───▶│ _incremental_sync   │                      │
│  │ (gmail.py:132)  │    │ (email_service.py)  │                      │
│  └─────────────────┘    └────────┬───────────┘                      │
│                                  │                                   │
│                    ┌─────────────┼─────────────┐                    │
│                    ▼             ▼              ▼                    │
│             ┌──────────┐  ┌──────────┐  ┌──────────────┐           │
│             │ Ingest   │  │ Reply    │  │ Lead         │           │
│             │ Email    │  │ Match    │  │ Auto-Link    │           │
│             └────┬─────┘  └──────────┘  └──────────────┘           │
│                  │                                                   │
│                  ▼                                                   │
│  ┌──────────────────────────────────────────────────────────┐      │
│  │ Background Tasks (per lead)                               │      │
│  │  1. _summarize_thread() → AI /summarize → EmailSummary    │      │
│  │  2. _run_assessment_background() → run_lead_assessment    │      │
│  └──────────────────────────────────────────────────────────┘      │
│                  │                                                   │
│                  ▼                                                   │
│  ┌──────────────────────────────────────────────────────────┐      │
│  │ run_lead_assessment (ai_pipeline.py)                      │      │
│  │  1. Gather lead + deal data                               │      │
│  │  2. EmailStatsService.get_lead_email_stats()              │      │
│  │  3. AIClient.assess_lead() → external AI service          │      │
│  │  4. Persist: LeadScore, AIRecommendation, FeatureVector   │      │
│  │  5. WorkflowService.sync_from_recommendation()            │      │
│  └──────────────────────────────────────────────────────────┘      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 2. Gmail OAuth Connection Setup

### Flow

```
Frontend                    Backend                     Google
  │                           │                           │
  │ POST /gmail/oauth/login   │                           │
  │──────────────────────────▶│                           │
  │                           │ Generate state payload    │
  │                           │ (org_id + user_id)        │
  │◀──────────────────────────│                           │
  │ { authorization_url }     │                           │
  │                           │                           │
  │ Redirect user to Google   │                           │
  │──────────────────────────────────────────────────────▶│
  │                           │                           │
  │ User consent screen       │                           │
  │──────────────────────────────────────────────────────▶│
  │                           │                           │
  │ GET /gmail/oauth/callback │                           │
  │ ?code=AUTH_CODE           │                           │
  │──────────────────────────▶│                           │
  │                           │ exchange_code()           │
  │                           │──────────────────────────▶│
  │                           │ access_token + refresh    │
  │                           │◀──────────────────────────│
  │                           │                           │
  │                           │ get_profile()             │
  │                           │──────────────────────────▶│
  │                           │ { emailAddress }          │
  │                           │◀──────────────────────────│
  │                           │                           │
  │                           │ watch() → Pub/Sub topic   │
  │                           │──────────────────────────▶│
  │                           │ { historyId }             │
  │                           │◀──────────────────────────│
  │                           │                           │
  │                           │ connect_gmail()           │
  │                           │ → GmailConnection row     │
  │                           │                           │
  │ { connection_id }         │                           │
  │◀──────────────────────────│                           │
```

### Key Files

| File | Function | Purpose |
|------|----------|---------|
| `gmail.py:233-244` | `oauth_login()` | Generates Google authorization URL |
| `gmail.py:247-282` | `oauth_callback()` | Handles OAuth redirect, creates connection |
| `email_service.py:256-262` | `start_oauth_login()` | Builds authorization URL with state |
| `email_service.py:264-302` | `handle_oauth_callback()` | Exchanges code, creates watch, saves connection |
| `email_service.py:218-254` | `connect_gmail()` | Persists `GmailConnection` row |
| `gmail_client.py:95-102` | `watch()` | Calls Gmail API `users.watch` |

### Duplicate Connection Prevention

`handle_oauth_callback()` now deactivates any existing active connection for the same email address before creating a new one:

```python
# email_service.py:282-284
deactivated = await self.connection_repo.deactivate_by_email(organization_id, str(email_address))
if deactivated:
    logger.info("Deactivated %d existing Gmail connection(s) for %s", deactivated, email_address)
```

---

## 3. Pub/Sub Watch Establishment

### When Watches Are Created

1. **During OAuth callback** — `handle_oauth_callback()` calls `gmail_client.watch()` after token exchange
2. **On application startup** — `main.py` lifespan calls `refresh_gmail_watches()`
3. **Every 6 hours** — APScheduler periodic job calls `refresh_gmail_watches()`

### Watch Refresh Logic

```python
# email_service.py — refresh_watch_for_all_connections()
async def refresh_watch_for_all_connections(self) -> int:
    connections = await self.connection_repo.list_all_active()
    for conn in connections:
        access_token = self.gmail_client.cipher.decrypt(conn.access_token_encrypted)
        watch_response = await self.gmail_client.watch(
            access_token=access_token,
            topic_name=settings.GOOGLE_PUBSUB_TOPIC,
        )
        conn.sync_cursor = watch_response.get("historyId")
        conn.sync_status = "active"
    await self.db.flush()
    return refreshed_count
```

### Gmail Watch Expiration

- Gmail API `watch()` expires after **~7 days** (Google's maximum)
- The periodic refresh job runs every **6 hours** to prevent expiration
- On server restart, `refresh_gmail_watches()` re-establishes all watches immediately

---

## 4. Inbound Email Flow (Real-Time)

### Step-by-Step

```
1. Google detects inbox change (new email received)
       │
2. Pub/Sub pushes notification to topic
       │
3. Subscription delivers POST to ngrok → localhost:8000
       │
4. POST /api/v1/gmail/pubsub/webhook
   - Decodes base64 message.data → { historyId, emailAddress }
   - Looks up GmailConnection by email_address
   - Gets valid access token (auto-refreshes if expired)
       │
5. _incremental_sync_from_gmail(history_id)
   - Calls Gmail History API with startHistoryId
   - Collects all messageIds from messagesAdded entries
   - Fetches full message for each via get_message()
       │
6. For each message:
   a. Try reply matching:
      - Match by threadId against existing outbound emails
      - Fallback: In-Reply-To / References headers
      - Fallback: normalized subject + participant matching
   b. If no match → ingest as standalone email
       │
7. ingest_email()
   - Persist Email record to database
   - Record timeline event
   - Emit EMAIL_RECEIVED event
   - Auto-link to Lead by sender email address
       │
8. Background task (per lead):
   a. _summarize_thread() → AI /summarize → EmailSummary
   b. _run_assessment_background() → run_lead_assessment()
```

### Webhook Endpoint Details

**File:** `backend/app/api/v1/gmail.py:132-205`

- **No authentication required** (Google Pub/Sub push)
- Always returns HTTP 200 to prevent infinite retries
- Handles missing data, missing connections, and failed tokens gracefully
- Commits on success, rolls back on failure

### History API Delta Sync

**File:** `backend/app/services/email_service.py:982-1125`

```python
# Paginated loop through Gmail History API
while True:
    history = await self.gmail_client.list_history(
        access_token=access_token,
        start_history_id=start_history_id,
        page_token=page_token,
    )
    for entry in history.get("history", []):
        for msg in entry.get("messagesAdded", []):
            message_ids.add(msg["message"]["id"])
    page_token = history.get("nextPageToken")
    if not page_token:
        break
```

---

## 5. Outbound Email Flow

### Flow

```
Frontend                    Backend                     Gmail API
  │                           │                           │
  │ POST /gmail/send          │                           │
  │ { receiver, subject,      │                           │
  │   html_body, connection } │                           │
  │──────────────────────────▶│                           │
  │                           │ Load GmailConnection      │
  │                           │ Get valid access token    │
  │                           │                           │
  │                           │ Build MIME message        │
  │                           │ gmail_client.send_message │
  │                           │──────────────────────────▶│
  │                           │ { id, threadId }          │
  │                           │◀──────────────────────────│
  │                           │                           │
  │                           │ Auto-link to Lead         │
  │                           │ (match recipient email)   │
  │                           │                           │
  │                           │ ingest_email(OUTBOUND)    │
  │                           │ → Email record            │
  │                           │ → Timeline event          │
  │                           │ → Background assessment   │
  │                           │                           │
  │ { email_id }              │                           │
  │◀──────────────────────────│                           │
```

### Key Files

| File | Function | Purpose |
|------|----------|---------|
| `gmail.py:111-128` | `send_email()` | API endpoint for sending email |
| `email_service.py:656-756` | `send_email()` | Builds MIME, sends via Gmail API, ingests |
| `email_service.py:548-620` | `ingest_email()` | Persists email, links to lead, triggers assessment |
| `gmail_client.py:111-113` | `send_message()` | Base64 encodes and sends via Gmail API |

### Auto-Link to Lead

When sending an outbound email, the system automatically links it to a lead if the recipient's email matches a `Lead.email` or `Contact.email` → associated Lead.

---

## 6. Email Ingestion & Lead Matching

### `ingest_email()` Logic

```python
# email_service.py:548-620
async def ingest_email(self, ..., direction: EmailDirection, ...):
    # 1. Check for duplicate by gmail_message_id
    existing = await self.email_repo.get_by_message_id(organization_id, gmail_message_id)
    if existing:
        return existing  # Idempotent

    # 2. Auto-link to Lead
    if not external_entity_type:
        lead = await self._match_lead_by_email(organization_id, participant_email)
        if lead:
            external_entity_type = "lead"
            external_entity_id = lead.id

    # 3. Persist Email record
    email = await self.email_repo.create(...)

    # 4. Record timeline event
    await self.timeline.record(
        entity_type="email",
        entity_id=email.id,
        action="email_sent" | "email_received",
        ...
    )

    # 5. Background assessment for lead-linked emails
    if external_entity_type == "lead":
        asyncio.create_task(
            _run_assessment_background(organization_id, external_entity_id, ...)
        )

    return email
```

### Lead Matching Priority

1. **Exact match on `Lead.email`** (case-insensitive)
2. **Match on `Contact.email`** → associated Lead via `Contact.lead_id`
3. **No match** → email is ingested without lead linkage

---

## 7. AI Assessment Pipeline

### Trigger Events

| Trigger | What Runs | computation_type |
|---------|-----------|------------------|
| `inbound_email` | Engagement + Overall + Recommendation | `engagement_overall_recommendation` |
| `lead_created` | Fit + Overall + Recommendation | `fit_overall_recommendation` |
| `lead_updated` | Fit + Overall + Recommendation | `fit_overall_recommendation` |
| `deal_stage_changed` | Engagement + Overall + Recommendation | `engagement_overall_recommendation` |
| `daily_refresh` | Full (Fit + Engagement + Overall + Recommendation) | `full` |

### `run_lead_assessment()` Phases

```
Phase 1: Gather Data
  - Load Lead record (employee_count, industry, crm, systems)
  - Load linked Deal (current_stage, deal_value)
  - Map stage to buying_stage_score via PIPELINE_STAGE_MAP

Phase 2: Compute Email Analytics
  - EmailStatsService.get_lead_email_stats(lead_id, org_id)
  - Returns: inbound_count, initiated_count, outbound_count,
             days_since_last_outbound, last_inbound_at
  - Resolve email intent from EmailSummary or AI fallback

Phase 3: Call AI Service
  - POST /assess to external AI service
  - Input: lead data + email stats + deal info
  - Output: fit, engagement, overall scores + recommendation

Phase 4: Persist Results
  - LeadScore: fit_score, engagement_score, overall_score, priority_tier
  - AIRecommendation: action, reasoning, priority
  - FeatureVector: all individual feature scores + raw email stats
  - WorkflowService: create/update/supersede workflow tasks

Phase 5: Return
  - Full AI result dict (or None if AI unavailable)
```

### Email Analytics Details

**File:** `backend/app/services/email_analytics.py:113-174`

The `get_lead_email_stats()` method groups emails by thread and counts:

- **`inbound_count`**: Total inbound emails to the lead
- **`initiated_count`**: Inbound emails where the customer is driving the conversation (thread-openers or consecutive inbounds)
- **`outbound_email_count`**: Total outbound emails to the lead
- **`last_inbound_at`**: Timestamp of most recent inbound email
- **`days_since_last_outbound`**: Days since last outbound email was sent

---

## 8. Watch Refresh & Health

### Startup Refresh

```python
# main.py — lifespan()
scheduler.start()
await refresh_gmail_watches()  # Re-establish all watches on startup
```

### Periodic Refresh (Every 6 Hours)

```python
# main.py — lifespan()
scheduler.add_job(refresh_gmail_watches, "interval", hours=6, max_instances=1)
```

### Refresh Logic

```python
# main.py
async def refresh_gmail_watches():
    async with AsyncSessionFactory() as db:
        service = EmailService(db)
        refreshed = await service.refresh_watch_for_all_connections()
        await db.commit()
        return refreshed
```

### Health Indicators

| Indicator | Healthy | Warning |
|-----------|---------|---------|
| `sync_status` | `active` | `error` or `disconnected` |
| `sync_cursor` | Latest `historyId` | Stale (old value) |
| Pub/Sub notifications | Arriving within seconds | Delayed or missing |
| `refresh_gmail_watches` log | `N/N connections refreshed` | `<N connections refreshed` |

---

## 9. Configuration

### Environment Variables

```bash
# Google OAuth
GOOGLE_CLIENT_ID=244027209407-...apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-_...
GOOGLE_REDIRECT_URI=http://localhost:8000/api/v1/gmail/oauth/callback
GMAIL_TOKEN_ENCRYPTION_KEY=pulse-crm-gmail-token-key-2026

# Google Pub/Sub
GOOGLE_PROJECT_ID=pulse-crm-505211
GOOGLE_PUBSUB_TOPIC=projects/pulse-crm-505211/topics/pulse-crm-gmail-notifications
```

### GCP Setup Requirements

1. **Pub/Sub Topic:** `pulse-crm-gmail-notifications` in project `pulse-crm-505211`
2. **Pub/Sub Subscription:** `pulse-crm-gmail-sub` (push endpoint → ngrok URL)
3. **Gmail API:** Enabled in GCP Console
4. **OAuth Consent Screen:** Configured with test users
5. **ngrok:** Running and subscription endpoint updated when URL changes

### Ngrok Setup

```bash
# Start ngrok
ngrok http 8000

# Update Pub/Sub subscription (in Google Cloud Shell)
gcloud pubsub subscriptions update pulse-crm-gmail-sub \
  --push-endpoint=https://YOUR-NGROK-URL/api/v1/gmail/pubsub/webhook
```

---

## 10. Troubleshooting

### No Inbound Emails Arriving

1. **Check ngrok:** Visit `http://127.0.0.1:4040` — is it running?
2. **Check Pub/Sub subscription:** Verify endpoint URL matches ngrok URL
3. **Check Gmail watch:** Look for `Gmail watch refreshed for ...` in logs
4. **Check webhook logs:** Look for `PUBSUB WEBHOOK CALLED` in backend logs
5. **Send test email:** Send from another account to `pulsecrmkalnet@gmail.com`

### Watch Expiration

**Symptom:** Notifications stop arriving after ~7 days
**Fix:** The periodic refresh job (every 6 hours) should prevent this. Check logs for `Gmail watch refresh failed`.

### Duplicate Connection Rows

**Symptom:** Multiple active `GmailConnection` rows for the same email
**Fix:** `handle_oauth_callback()` now deactivates existing connections before creating new ones. Manually deactivate old rows:

```sql
UPDATE gmail_connections SET is_active = false
WHERE email_address = 'pulsecrmkalnet@gmail.com' AND is_active = true
ORDER BY created_at DESC OFFSET 1;
```

### Scores Not Changing

**Symptom:** Lead scores remain the same after receiving emails
**Check:**
1. Is the email linked to a lead? (Check `external_entity_type` and `external_entity_id` on the `Email` record)
2. Was the assessment triggered? (Look for `[ASSESSMENT]` in logs)
3. What are the email stats? (Check `inbound_count`, `initiated_count` in assessment payload)

### Token Expiry

**Symptom:** `Gmail watch refresh failed` with 401 error
**Fix:** The system auto-refreshes tokens. If refresh fails, the user may need to re-authorize via OAuth.

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `backend/app/api/v1/gmail.py` | All Gmail API endpoints |
| `backend/app/services/email_service.py` | Core email logic (sync, send, ingest, assess) |
| `backend/app/services/gmail_client.py` | Gmail API HTTP client |
| `backend/app/services/email_analytics.py` | Email statistics computation |
| `backend/app/services/ai_pipeline.py` | Lead assessment orchestrator |
| `backend/app/repositories/email_repository.py` | Email/GmailConnection DB queries |
| `backend/app/models/email.py` | Email and GmailConnection ORM models |
| `backend/app/main.py` | Startup hooks and scheduled jobs |
