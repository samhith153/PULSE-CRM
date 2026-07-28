# Email/Gmail Integration - Fix Plan

## Completed Steps

### Step 1: Add missing `POST /connections/{connection_id}/sync` route in backend
- [x] Added `connections_sync` route to `gmail.py` at `POST /connections/{connection_id}/sync`
- [x] Route calls `EmailService.fetch_from_gmail()` to actually fetch real Gmail emails

### Step 2: Verify frontend `EmailsView.tsx` sync flow is correct
- [x] Frontend `syncGmail()` calls `POST /api/v1/gmail/connections/{id}/sync` ✓
- [x] Frontend `getGmailStatus()` correctly resolves connections ✓
- [x] Compose/Send UI calls `POST /api/v1/gmail/send` which exists ✓

### Step 3: Fix lint issues in frontend
- [ ] Run lint and fix reported issues

### Step 4: Fix backend test configuration (GROQ_API_KEY issue)
- [ ] Add pytest fixture to mock/override groq api key or skip groq tests
- [ ] Add proper test script in backend package.json

## Summary
The read/list/detail path and send/compose are fully wired frontend-to-backend. The only functional gap was the missing `connections/{id}/sync` route that the "Sync Gmail" button uses. This is now fixed.

