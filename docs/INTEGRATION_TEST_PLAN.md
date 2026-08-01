# PULSE-CRM Integration Test Plan

## Overview
Comprehensive integration test suite for the PULSE-CRM system, designed for Q/A Integration Engineers.

## System Architecture
- **Backend:** FastAPI + SQLAlchemy 2.0 Async + PostgreSQL
- **Frontend:** Next.js 16 (React 19) + Tailwind CSS
- **AI:** Summarization + Feature Engineering Pipeline
- **External:** Gmail Integration, Event Bus

## Current Test Coverage (12 modules)
| Module | Test File | Coverage |
|--------|-----------|----------|
| Auth | test_auth.py | ✅ Complete |
| RBAC | test_rbac.py | ✅ Complete |
| Users | test_users.py | ✅ Complete |
| Companies | test_companies.py | ✅ Complete |
| Contacts | test_contacts.py | ✅ Complete |
| Leads | test_leads.py | ✅ Complete |
| Deals | test_deals.py | ✅ Complete |
| Pipeline | test_pipeline.py | ✅ Complete |
| Validation | test_validation.py | ✅ Complete |
| Events | test_events.py | ✅ Complete |
| Health | test_health.py | ✅ Complete |
| New Modules | test_new_modules.py | ✅ Complete |

## Priority 1: End-to-End Workflow Tests (Week 1)

### 1.1 Lead-to-Deal Conversion Workflow
**File:** `backend/tests/test_integration_e2e_workflows.py`

```python
# Test: Complete lead lifecycle
# 1. Create company
# 2. Create contact linked to company
# 3. Create lead linked to contact
# 4. Transition lead through FSM (new → contacted → qualified → proposal_sent → negotiation → won)
# 5. Convert lead to deal
# 6. Verify deal created with correct linked data
# 7. Verify activity timeline recorded
```

### 1.2 User Registration → Login → CRUD → Logout
**File:** `backend/tests/test_integration_e2e_workflows.py`

```python
# Test: User lifecycle
# 1. Register new user
# 2. Login with credentials
# 3. Access protected resources
# 4. Update user profile
# 5. Logout
# 6. Verify token invalidated
```

### 1.3 Password Reset Flow
**File:** `backend/tests/test_integration_e2e_workflows.py`

```python
# Test: Password reset end-to-end
# 1. Register user
# 2. Request forgot-password
# 3. Verify email sent (mock)
# 4. Reset password with token
# 5. Login with new password
# 6. Verify old password rejected
```

---

## Priority 2: Cross-Module Integration Tests (Week 2)

### 2.1 Linked Data Integrity
**File:** `backend/tests/test_integration_cross_module.py`

```python
# Test: Contact → Company → Lead → Deal chain
# 1. Create company
# 2. Create contact with company_id
# 3. Create lead with contact_id and company_id
# 4. Convert lead to deal
# 5. Verify deal has correct company_id, contact_id
# 6. Delete company → verify cascade behavior
```

### 2.2 Lead Assignment Flow
**File:** `backend/tests/test_integration_cross_module.py`

```python
# Test: Lead ownership transfer
# 1. Create lead (owned by user A)
# 2. Assign lead to user B
# 3. Verify lead.owner_id updated
# 4. Verify user B can access lead
# 5. Verify user A still has access (if permitted)
```

### 2.3 Pipeline Stage → Deal Update
**File:** `backend/tests/test_integration_cross_module.py`

```python
# Test: Pipeline move updates deal
# 1. Create deal in stage A
# 2. Move deal to stage B via pipeline/move
# 3. Verify deal.stage_id updated
# 4. Verify deal.probability updated
# 5. Verify activity timeline recorded
```

---

## Priority 3: Security Integration Tests (Week 3)

### 3.1 Token Expiration & Refresh
**File:** `backend/tests/test_integration_security.py`

```python
# Test: Token lifecycle
# 1. Register user, get tokens
# 2. Use access token (should work)
# 3. Simulate time passing (mock)
# 4. Use expired token (should fail)
# 5. Use refresh token
# 6. Get new access token
# 7. Use new token (should work)
```

### 3.2 Concurrent Session Handling
**File:** `backend/tests/test_integration_security.py`

```python
# Test: Multiple sessions
# 1. Login from device A
# 2. Login from device B
# 3. Both tokens should work
# 4. Logout from device A
# 5. Device B token should still work
# 6. Verify token invalidation on logout
```

### 3.3 Injection Prevention
**File:** `backend/tests/test_integration_security.py`

```python
# Test: SQL injection attempts
# 1. Create company with name: "'; DROP TABLE companies; --"
# 2. Verify data stored safely
# 3. Search for company with injection attempt
# 4. Verify no SQL errors
```

### 3.4 RBAC Permission Boundaries
**File:** `backend/tests/test_integration_security.py`

```python
# Test: Role-based access
# 1. Register admin user
# 2. Register regular user
# 3. Admin can access /users
# 4. Regular user cannot access /users
# 5. Regular user can access /leads
# 6. Verify permission error codes
```

---

## Priority 4: API Contract & Error Handling (Week 4)

### 4.1 Response Format Consistency
**File:** `backend/tests/test_integration_api_contract.py`

```python
# Test: All endpoints follow consistent format
# 1. Success response: { success: true, data: {...} }
# 2. Error response: { success: false, error_code: "...", message: "..." }
# 3. Pagination response: { data: [...], meta: { page, page_size, total } }
```

### 4.2 CORS Configuration
**File:** `backend/tests/test_integration_api_contract.py`

```python
# Test: CORS headers
# 1. Send OPTIONS request
# 2. Verify Access-Control-Allow-Origin
# 3. Verify Access-Control-Allow-Methods
# 4. Verify Access-Control-Allow-Headers
```

### 4.3 Error Response Codes
**File:** `backend/tests/test_integration_api_contract.py`

```python
# Test: Consistent error codes
# 1. 401 → UNAUTHORIZED
# 2. 404 → NOT_FOUND
# 3. 409 → DUPLICATE_RESOURCE
# 4. 422 → VALIDATION_ERROR
# 5. 500 → INTERNAL_SERVER_ERROR
```

---

## Priority 5: Database Integration (Week 5)

### 5.1 Transaction Rollback
**File:** `backend/tests/test_integration_database.py`

```python
# Test: Transaction isolation
# 1. Start transaction
# 2. Create company
# 3. Raise exception
# 4. Verify rollback (company not persisted)
```

### 5.2 Cascade Deletes
**File:** `backend/tests/test_integration_database.py`

```python`
# Test: Foreign key cascades
# 1. Create company with contacts
# 2. Delete company
# 3. Verify contacts deleted (or nullified)
```

### 5.3 Unique Constraints
**File:** `backend/tests/test_integration_database.py`

```python
# Test: Database-level uniqueness
# 1. Create company "Test Corp"
# 2. Attempt duplicate in parallel
# 3. Verify one succeeds, one fails with 409
```

---

## Test Execution Commands

```bash
# Run all integration tests
pytest backend/tests/test_integration_* -v

# Run specific priority
pytest backend/tests/test_integration_e2e_workflows.py -v

# Run with coverage
pytest backend/tests/test_integration_* --cov=app --cov-report=html

# Run in parallel (faster)
pytest backend/tests/test_integration_* -n auto
```

---

## Success Criteria

- [ ] All E2E workflow tests pass
- [ ] All cross-module integration tests pass
- [ ] All security integration tests pass
- [ ] All API contract tests pass
- [ ] All database integration tests pass
- [ ] Code coverage > 80% for integration tests
- [ ] No critical bugs found during testing

---

## Notes for New Q/A Engineers

1. **Start with Priority 1** - These tests provide immediate value
2. **Use existing fixtures** - Leverage `conftest.py` fixtures (client, auth_headers, db_session)
3. **Follow naming convention** - `test_<module>_<scenario>_<expected>`
4. **Document test cases** - Add docstrings explaining what each test verifies
5. **Run tests before commit** - Always run `pytest` before pushing changes

---

## Quick Reference: Key Files

### Backend Structure
```
backend/
├── app/
│   ├── api/v1/router.py          # All API routes
│   ├── core/config.py            # Environment settings
│   ├── core/security.py          # JWT + bcrypt
│   ├── core/permissions.py       # RBAC registry
│   ├── models/                   # SQLAlchemy ORM models
│   ├── schemas/                  # Pydantic V2 schemas
│   ├── repositories/             # DB access layer
│   ├── services/                 # Business logic
│   └── middlewares/              # Request handling
├── tests/
│   ├── conftest.py               # Shared fixtures
│   ├── test_auth.py              # Auth tests
│   ├── test_rbac.py              # RBAC tests
│   ├── test_leads.py             # Lead tests
│   └── ...                       # Other test modules
└── requirements.txt
```

### Key Endpoints to Test
| Endpoint | Method | Description |
|----------|--------|-------------|
| /api/v1/auth/register | POST | Register org + admin |
| /api/v1/auth/login | POST | Get JWT tokens |
| /api/v1/leads/{id}/convert | POST | Convert lead to deal |
| /api/v1/pipeline/move | PATCH | Move deal between stages |
| /api/v1/gmail/sync | POST | Sync Gmail messages |
| /api/v1/ai/jobs | POST | Trigger AI job |

### Existing Fixtures (conftest.py)
- `client` - AsyncClient with DB override
- `auth_headers` - JWT authorization headers
- `db_session` - Test database session
- `seed_roles` - Pre-seeded roles/permissions
- `registered_user` - Pre-registered test user
