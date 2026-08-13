# Google Cloud Console Integration — Setup Guide

**Date:** 2026-08-06
**Scope:** Replace Gmail polling with Google Pub/Sub real-time notifications

---

## Current State

The app currently polls Gmail every 5 minutes via `poll_gmail_replies()` in `main.py:173`. This:
- Hits rate limits with many connected accounts
- Introduces up to 5-minute latency
- Holds DB connections during slow Gmail API calls

**What already exists:**
- `POST /api/v1/gmail/webhook` endpoint (receives Pub/Sub notifications)
- `email_service.webhook_sync()` (processes webhook-triggered sync)
- Full OAuth2 flow (`/gmail/oauth/login` + `/gmail/oauth/callback`)

**What needs to happen:** Set up Google Cloud Console → configure Pub/Sub → remove polling job.

---

## Step 1 — Google Cloud Console Setup

### 1.1 Create or select a project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (e.g., `pulse-crm`) or select existing
3. Note the **Project ID** (e.g., `pulse-crm-12345`)

### 1.2 Enable Gmail API

1. Navigate to **APIs & Services → Library**
2. Search for **Gmail API**
3. Click **Enable**

### 1.3 Create OAuth 2.0 credentials

1. Navigate to **APIs & Services → Credentials**
2. Click **+ Create Credentials → OAuth client ID**
3. Application type: **Web application**
4. Name: `PULSE CRM Backend`
5. **Authorized redirect URIs** — add your callback URL:
   - Local dev: `http://localhost:8000/api/v1/gmail/oauth/callback`
   - Production: `https://your-domain.com/api/v1/gmail/oauth/callback`
6. Click **Create**
7. Copy the **Client ID** and **Client Secret**

### 1.4 Configure OAuth consent screen

1. Navigate to **APIs & Services → OAuth consent screen**
2. User type: **External** (or Internal if using Google Workspace)
3. App name: `PULSE CRM`
4. Add scopes:
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `https://www.googleapis.com/auth/gmail.modify`
   - `https://www.googleapis.com/auth/gmail.send`
5. Add test users (your team emails) while in testing mode
6. Publish app when ready for production

---

## Step 2 — Set Up Pub/Sub (Real-time Webhooks)

### 2.1 Enable Pub/Sub API

1. Navigate to **APIs & Services → Library**
2. Search for **Cloud Pub/Sub API**
3. Click **Enable**

### 2.2 Create a topic

```bash
# Using gcloud CLI
gcloud pubsub topics create pulse-crm-gmail-notifications
```

Or via Console:
1. Navigate to **Pub/Sub → Topics**
2. Click **Create Topic**
3. Topic ID: `pulse-crm-gmail-notifications`

### 2.3 Create a subscription

```bash
# Using gcloud CLI
gcloud pubsub subscriptions create pulse-crm-gmail-sub \
  --topic=pulse-crm-gmail-notifications \
  --push-endpoint=https://your-domain.com/api/v1/gmail/webhook \
  --push-auth-service-account=pulse-crm@your-project.iam.gserviceaccount.com
```

Or via Console:
1. Navigate to **Pub/Sub → Subscriptions → Create Subscription**
2. Subscription ID: `pulse-crm-gmail-sub`
3. Topic: `pulse-crm-gmail-notifications`
4. Delivery type: **Push**
5. Endpoint URL: `https://your-domain.com/api/v1/gmail/webhook`
6. Authentication: Select a service account (see Step 2.4)

### 2.4 Create a service account (for Pub/Sub push authentication)

1. Navigate to **IAM & Admin → Service Accounts**
2. Click **Create Service Account**
3. Name: `pulse-crm-pubsub`
4. Role: **Pub/Sub Publisher**
5. Create a JSON key → download it
6. Grant this service account the **Pub/Sub Publisher** role on the topic

### 2.5 Set up domain-wide delegation (for Gmail watch)

The Gmail `users.watch` API requires domain-wide delegation if using a Google Workspace account. For personal Gmail accounts, each user authorizes via OAuth.

---

## Step 3 — Implement Gmail Watch in Backend

### 3.1 Add Gmail watch to connection flow

When a user connects Gmail, call `users.watch` to start receiving notifications:

```python
# In email_service.py, after successful OAuth callback:
async def connect_gmail(self, ..., access_token, ...):
    # ... existing connection logic ...

    # Start watching for new messages
    watch_response = await self.gmail_client.watch(
        access_token=access_token,
        topic_name="projects/pulse-crm-12345/topics/pulse-crm-gmail-notifications",
    )

    # Store history_id from watch response for incremental sync
    connection.sync_cursor = watch_response.get("historyId")

    return connection
```

### 3.2 Add `watch` method to `GmailClient`

```python
async def watch(self, access_token: str, topic_name: str, label_id: str = "INBOX") -> dict:
    """Start watching for new messages via Pub/Sub."""
    return await self._post(
        "watch",
        access_token,
        json={
            "topicName": topic_name,
            "labelIds": [label_id],
            "labelFilterBehavior": "INCLUDE",
        },
    )
```

### 3.3 Update webhook handler

The existing `webhook_sync()` needs to:
1. Verify the Pub/Sub signature
2. Parse the Gmail history ID from the notification
3. Use `users.history.list` to get changed messages since last sync
4. Process each new/changed message

```python
# In email_service.py
async def webhook_sync(self, organization_id, created_by, payload):
    # 1. Verify Pub/Sub signature
    # 2. Decode the base64 notification data
    # 3. Extract historyId and emailAddress
    # 4. Find the GmailConnection for this email
    # 5. Call gmail.history.list(startHistoryId=connection.sync_cursor)
    # 6. Process each messageAdded event
    # 7. Update connection.sync_cursor to new historyId
```

---

## Step 4 — Remove Gmail Polling

### 4.1 Remove the polling job from `main.py`

Delete the `poll_gmail_replies` function and its scheduler registration:

```python
# REMOVE these from main.py:

async def poll_gmail_replies():
    """Poll connected Gmail accounts for new inbound messages / replies."""
    ...

# In lifespan(), REMOVE this line:
scheduler.add_job(poll_gmail_replies, "interval", minutes=5)
```

### 4.2 Remove the backoff global variable

```python
# REMOVE from main.py:
_gmail_backoff: int = 0
```

---

## Step 5 — Environment Variables

Add to your `.env` / Supabase secrets:

```env
# Google Cloud Console
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=https://your-domain.com/api/v1/gmail/oauth/callback

# Gmail token encryption (generate with: python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())")
GMAIL_TOKEN_ENCRYPTION_KEY=your-generated-key

# Google Cloud project (for Pub/Sub topic path)
GOOGLE_PROJECT_ID=pulse-crm-12345
GOOGLE_PUBSUB_TOPIC=pulse-crm-gmail-notifications
```

---

## Step 6 — Token Refresh Handling

Gmail access tokens expire after 1 hour. The backend already has:
- `POST /gmail/refresh` endpoint
- `EmailService.refresh_token()` method
- `GmailClient.refresh_access_token()` 

For long-lived connections, add a background job to proactively refresh tokens before expiry:

```python
# In main.py lifespan
async def refresh_expiring_tokens():
    """Refresh Gmail tokens that expire within 10 minutes."""
    from datetime import datetime, timedelta, timezone
    from app.models.email import GmailConnection

    async with AsyncSessionFactory() as db:
        cutoff = datetime.now(timezone.utc) + timedelta(minutes=10)
        result = await db.execute(
            select(GmailConnection).where(
                GmailConnection.is_active.is_(True),
                GmailConnection.token_expires_at < cutoff,
            )
        )
        for conn in result.scalars():
            try:
                svc = EmailService(db)
                await svc.refresh_token(conn.organization_id, conn.user_id, ...)
            except Exception:
                logger.warning("Token refresh failed for %s", conn.email_address)
        await db.commit()

# In lifespan, add scheduler job:
scheduler.add_job(refresh_expiring_tokens, "interval", minutes=15)
```

---

## Step 7 — Testing

### 7.1 Test OAuth flow locally

1. Set `GOOGLE_REDIRECT_URI=http://localhost:8000/api/v1/gmail/oauth/callback`
2. Start backend on port 8000
3. Call `GET /api/v1/gmail/oauth/login` → opens Google consent screen
4. After authorization, callback saves the connection

### 7.2 Test Pub/Sub locally (using ngrok)

```bash
# Start your backend
uvicorn app.main:app --port 8000

# Expose local server
ngrok http 8000

# Update Google Cloud Console:
# - Set redirect URI to ngrok URL
# - Update Pub/Sub subscription endpoint to ngrok URL

# Send a test email to your connected Gmail account
# Verify webhook receives the notification
```

### 7.3 Verify in Google Cloud Console

1. Navigate to **Pub/Sub → Subscriptions**
2. Check `pulse-crm-gmail-sub` for delivered messages
3. Check **Logs** for any delivery failures

---

## Migration Checklist

| Task | Status |
|------|--------|
| Create Google Cloud project | ⬜ |
| Enable Gmail API | ⬜ |
| Create OAuth 2.0 credentials | ⬜ |
| Configure OAuth consent screen | ⬜ |
| Create Pub/Sub topic | ⬜ |
| Create Pub/Sub subscription (push) | ⬜ |
| Create service account for Pub/Sub | ⬜ |
| Add `GmailClient.watch()` method | ⬜ |
| Update `connect_gmail()` to call `watch` | ⬜ |
| Update `webhook_sync()` handler | ⬜ |
| Remove `poll_gmail_replies()` from main.py | ⬜ |
| Add token refresh scheduler job | ⬜ |
| Set environment variables | ⬜ |
| Test OAuth flow locally | ⬜ |
| Test Pub/Sub with ngrok | ⬜ |
| Deploy to production | ⬜ |

---

## Files to Modify

| File | Change |
|------|--------|
| `backend/app/services/gmail_client.py` | Add `watch()` method |
| `backend/app/services/email_service.py` | Update `connect_gmail()` to call `watch`; update `webhook_sync()` handler |
| `backend/app/main.py` | Remove `poll_gmail_replies()`, remove `_gmail_backoff`, remove scheduler job, add token refresh job |
| `backend/app/core/config.py` | Add `GOOGLE_PROJECT_ID`, `GOOGLE_PUBSUB_TOPIC` settings |
| `backend/app/api/v1/gmail.py` | No changes (webhook endpoint already exists) |
