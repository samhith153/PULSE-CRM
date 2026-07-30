# Frontend-Backend Integration Report

Date: 2026-07-28
Branch: Integration/Ajith

## Summary

Backend exposes a large API surface under `/api/v1`. The frontend has corresponding helper functions in `frontend/src/utils/api.ts`, but many dashboard views still rely on local mock data. Below is the current integration state and the remaining work to make the app fully functional end-to-end.

---

## Verified / Already Integrated

| Area | Status | Notes |
|------|--------|-------|
| Auth: Register | ✅ Integrated | `register()` in `api.ts` calls `/api/v1/auth/register`. Friendly error messages mapped for password + duplicate org. Backend `/register` validated via FastAPI docs => 201. |
| Auth: Login | ✅ Integrated | `login()` in `api.ts` calls `/api/v1/auth/login`. |
| Auth UI: Demo button | ✅ UX done | Click shows “Thanks for your interest! We will get back to you soon.” |
| Auth UI: Google button | ✅ UX done | Disabled with “Google Sign-In is available soon.” |
| Backend error mapping | ✅ Integrated | `backend/app/api/v1/auth.py` wraps register exceptions into `HTTPException` with existing domain status/detail. |

---

## Partially Integrated

| Area | Gap |
|------|-----|
| Leads | `getLeads`, `createLead`, `convertLead` exist in `api.ts`, but it’s not confirmed whether all leads views use them or still use `MOCK_LEADS`. |
| Contacts | `getContacts`, `createContact` exist in `api.ts`, but usage in `ContactsView` is not yet verified. |
| Companies | `getCompanies`, `createCompany` exist in `api.ts`, but usage in `CompaniesView` is not yet verified. |
| Deals | `getDeals`, `updateDealStage` exist in `api.ts`, but usage in `DealsView` / pipeline is not yet verified. |
| Emails | `syncGmail`, `sendGmailEmail`, `getEmails` exist in `api.ts`, but view-level integration is not yet verified. |
| Activities | `getActivities` exists, but dashboard activity views may still use local timelines/mocks. |
| Summarization | `summarizeThread`, `getSummaryByThread` exist, but it is not confirmed whether AI/Conversation Intelligence views are wired. |
| Gmail OAuth | `startGmailOAuth`, `completeGmailOAuth`, `getGmailConnections`, `getGmailStatus` exist, but UI gating/auth flow is not yet verified. |

---

## Suspected Mock-Heavy Views (Likely Need Backend Wiring)

These frontend files were found but are not yet confirmed backend-integrated:
- `frontend/src/components/dashboard/EmailsView.tsx`
- `frontend/src/components/dashboard/ActivitiesView.tsx`
- `frontend/src/components/dashboard/CompaniesView.tsx`
- `frontend/src/components/dashboard/ContactsView.tsx`
- `frontend/src/components/dashboard/LeadsView.tsx`
- `frontend/src/components/dashboard/DealsView.tsx` / `PipelineView.tsx`
- `frontend/src/components/dashboard/AICopilotChat.tsx`
- `frontend/src/components/dashboard/AIInsightsView.tsx`
- `frontend/src/components/dashboard/AutomationView.tsx`
- `frontend/src/components/dashboard/ProductsView.tsx`
- `frontend/src/components/dashboard/AuditLogsView.tsx`
- `frontend/src/components/dashboard/SettingsView.tsx`

---

## Recommended Next Steps

1. Audit one “suspected mock-heavy” view at a time:
   - Open the component file.
   - Search for `MOCK_` or hardcoded arrays.
   - If found, replace with `api.ts` calls.
2. Verify actual backend response shapes:
   - Frontend treats `(json.data ?? json) as T`.
   - Confirm each backend route returns either `StandardResponse[Model]` or raw model so selectors don’t accidentally return empty arrays.
3. Validate auth gating:
   - Some views may render without tokens. Add a `useEffect` redirect to login if `getToken()` is null and route is protected.
4. Run a smoke pass after each group of integrations:
   - Frontend: `npm run dev`
   - Backend: `uvicorn` / configured entrypoint
   - Confirm Network tab hits `/api/v1/*` and renders real data.

---

## Backend Route Surface (from source)

The backend currently mounts these routers under `/api/v1`:
- `/health`
- `/auth`
- `/users`
- `/organizations`
- `/companies`
- `/contacts`
- `/leads`
- `/deals`
- `/activity`
- `/activities`
- `/timeline`
- `/pipeline`
- `/gmail`
- `/smtp`
- `/emails`
- `/dashboard`
- `/ai`
- `/recommendation-features`
- `/events`
- `/webhooks`
- `/uploads`
- `/brevo`
- `/summarization`

If you want, I can start the audit with one file (e.g., `LeadsView.tsx`) and make it data-fetch from the backend instead of mocks.
