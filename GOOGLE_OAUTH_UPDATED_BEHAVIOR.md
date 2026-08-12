# Google OAuth - Updated Behavior (Role-Based Access)

## New Requirement - IMPLEMENTED ✅

**ONLY existing users in the database can login via Google OAuth.**

Users authenticate with their **existing role** (admin, manager, sales_rep, etc.), NOT automatically assigned admin access.

## How It Works Now

### Authentication Flow

```
User clicks "Continue with Google"
         ↓
Google OAuth authentication
         ↓
Backend receives user email from Google
         ↓
Check if email exists in database?
    ├─ YES: Link Google account + Authenticate with existing role
    └─ NO:  REJECT with error message
         ↓
Generate JWT with user's actual role
         ↓
Redirect to appropriate dashboard based on role
```

### User Scenarios

| User Type | Email in DB? | Result |
|-----------|--------------|--------|
| Admin (existing) | ✅ Yes | ✅ Login as ADMIN → `/dashboard/admin` |
| Sales Manager (existing) | ✅ Yes | ✅ Login as SALES_MANAGER → `/dashboard/manager` |
| Sales Rep (existing) | ✅ Yes | ✅ Login as SALES_REP → `/dashboard` (base) |
| New Google User | ❌ No | ❌ REJECTED - "Not registered in PULSE CRM" |

## Key Changes Made

### 1. Backend Service (`backend/app/services/google_oauth_service.py`)

**BEFORE** (Auto-Admin):
```python
# Old behavior: Anyone who logged in got ADMIN role
if user:
    await self._assign_admin_role(user)  # Force ADMIN
else:
    user = await self._create_google_admin_user(...)  # Create new ADMIN
```

**AFTER** (Role-Based):
```python
# New behavior: Use existing role or reject
if user:
    # Keep existing role, just link Google account
    user.google_id = google_id
    user.auth_provider = "google"
    # Use user's actual role from database
else:
    # Reject authentication
    raise UnauthorizedException(
        "This Google account is not registered in PULSE CRM. "
        "Please contact your administrator to create an account for you."
    )
```

### 2. JWT Token Generation

**BEFORE**:
```python
# Always used "admin" role
access_token = create_access_token(
    role="admin",  # Hardcoded
    ...
)
```

**AFTER**:
```python
# Use user's actual role from database
user_roles = [ur.role.name for ur in user.user_roles if ur.role]
primary_role = user_roles[0] if user_roles else "sales_rep"

access_token = create_access_token(
    role=primary_role,  # Dynamic based on user
    ...
)
```

### 3. Frontend Callback (`frontend/src/app/auth/google/callback/page.tsx`)

**BEFORE**:
```typescript
// Rejected non-admin users
if (primaryRole !== 'admin') {
  setStatus('error');
  setMessage('Google login is restricted to PULSE CRM administrators.');
  return;
}
router.push('/dashboard/admin');  // Always admin dashboard
```

**AFTER**:
```typescript
// Accept all roles, redirect based on role
if (primaryRole === 'admin') {
  router.push('/dashboard/admin');
} else if (primaryRole === 'sales_manager') {
  router.push('/dashboard/manager');
} else {
  router.push('/dashboard/sales');
}
```

## How Admin Creates Users

For users to login via Google OAuth, an admin must first create their account in PULSE CRM:

### Option 1: Via Admin Dashboard (UI)
1. Admin logs into PULSE CRM
2. Goes to "Users" section
3. Clicks "Add User"
4. Enters:
   - **Email** (must match Google account email)
   - **Full Name**
   - **Role** (admin, sales_manager, sales_rep)
5. Saves user

### Option 2: Via API
```bash
POST /api/v1/users
{
  "email": "john@example.com",
  "full_name": "John Doe",
  "role": "sales_manager",
  "organization_id": "..."
}
```

### Option 3: Via Bulk Import
- Admin uploads CSV with user details
- System creates users with assigned roles

## Testing Different Roles

### Test 1: Existing Admin User
```
Given: User "admin@company.com" exists with ADMIN role
When: User logs in via Google OAuth
Then: 
  ✅ Authentication succeeds
  ✅ Google account linked to user
  ✅ Redirected to /dashboard/admin
  ✅ Has full admin permissions
```

### Test 2: Existing Sales Manager
```
Given: User "manager@company.com" exists with SALES_MANAGER role
When: User logs in via Google OAuth
Then:
  ✅ Authentication succeeds
  ✅ Google account linked to user
  ✅ Redirected to /dashboard/manager
  ✅ Has manager permissions
```

### Test 3: Existing Sales Rep
```
Given: User "sales@company.com" exists with SALES_REP role
When: User logs in via Google OAuth
Then:
  ✅ Authentication succeeds
  ✅ Google account linked to user
  ✅ Redirected to /dashboard/sales
  ✅ Has sales rep permissions
```

### Test 4: Non-Existent User
```
Given: User "newuser@company.com" does NOT exist in database
When: User tries to login via Google OAuth
Then:
  ❌ Authentication rejected
  ❌ Error message displayed:
      "This Google account is not registered in PULSE CRM. 
       Please contact your administrator to create an account for you."
  ❌ No account created
  ❌ No dashboard access
```

## Error Messages

### User Not Found
```
Status: 401 Unauthorized
Message: "This Google account is not registered in PULSE CRM. 
         Please contact your administrator to create an account for you."
```

### Invalid OAuth State
```
Status: 401 Unauthorized  
Message: "Invalid OAuth state. Please try again."
```

### Google Token Exchange Failed
```
Status: 401 Unauthorized
Message: "Failed to authenticate with Google. Please try again."
```

## Role-Based Dashboard Routing

| Role | Dashboard Route | Access Level |
|------|----------------|--------------|
| `admin` | `/dashboard/admin` | Full system access |
| `sales_manager` | `/dashboard/manager` | Team management, reports |
| `sales_rep` | `/dashboard` | Own leads, tasks (base dashboard) |

## Database Schema

Users table must have these fields for Google OAuth:
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    google_id VARCHAR(255) UNIQUE,  -- Links to Google account
    auth_provider VARCHAR(50) DEFAULT 'password',  -- 'google' or 'password'
    avatar_url TEXT,  -- Google profile picture
    organization_id UUID,
    is_verified BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    ...
);

CREATE TABLE user_roles (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    role_id UUID REFERENCES roles(id),
    assigned_at TIMESTAMP,
    ...
);

CREATE TABLE roles (
    id UUID PRIMARY KEY,
    name VARCHAR(50) UNIQUE,  -- 'admin', 'sales_manager', 'sales_rep'
    ...
);
```

## Workflow Example

### Scenario: Onboarding New Sales Manager

**Step 1: Admin Creates User**
```
Admin logs into PULSE CRM dashboard
→ Users section
→ Add User
→ Email: sarah.jones@company.com
→ Full Name: Sarah Jones
→ Role: Sales Manager
→ Save
```

**Step 2: New User Logs In**
```
Sarah goes to: http://localhost:3000/login
→ Clicks "Continue with Google"
→ Selects sarah.jones@company.com
→ Approves permissions
```

**Step 3: Backend Processing**
```
Backend receives Google authentication
→ Extracts email: sarah.jones@company.com
→ Searches database for user with this email
→ Found! User exists with SALES_MANAGER role
→ Links Google account (sets google_id, auth_provider='google')
→ Updates profile picture from Google
→ Generates JWT with role='sales_manager'
→ Redirects to /dashboard/manager
```

**Step 4: Sarah Uses System**
```
Sarah lands on Sales Manager dashboard
→ Can view team performance
→ Can assign leads to team members
→ Can generate reports
→ Cannot access admin functions (not admin role)
```

## Security Notes

1. **Email Verification**: Google accounts are marked as verified automatically
2. **No Password Required**: OAuth users don't need password (hashed_password = NULL)
3. **Role Enforcement**: Backend validates role on every API request
4. **CSRF Protection**: State parameter prevents CSRF attacks
5. **JWT Expiry**: Tokens expire after 30 minutes

## Admin Responsibilities

As an admin, you must:

1. **Create users before they can login via Google**
   - Use admin dashboard or API
   - Ensure email matches their Google account

2. **Assign appropriate roles**
   - Admin: Full system access
   - Sales Manager: Team management
   - Sales Rep: Individual access

3. **Manage user lifecycle**
   - Deactivate users when they leave
   - Update roles as needed
   - Monitor OAuth login attempts

## Testing Checklist

- [ ] Admin creates a new user with email matching Google account
- [ ] User logs in via "Continue with Google"
- [ ] User is redirected to appropriate dashboard based on role
- [ ] User has correct permissions for their role
- [ ] Non-existent email is rejected with clear error message
- [ ] Google profile picture is displayed
- [ ] User can logout and login again successfully

## Files Modified

### Backend
- `backend/app/services/google_oauth_service.py` - Removed auto-admin logic
- `backend/app/api/v1/auth.py` - Updated documentation

### Frontend  
- `frontend/src/app/auth/google/callback/page.tsx` - Role-based routing

## Configuration

No environment variable changes needed. The system automatically:
- Detects user's role from database
- Generates appropriate JWT
- Redirects to correct dashboard

## Summary

**OLD BEHAVIOR**: Anyone could login via Google → Automatically got ADMIN role

**NEW BEHAVIOR**: Only existing users can login via Google → Keep their existing role

This provides proper role-based access control while allowing convenient Google OAuth authentication for all user types in your organization.

---

**Ready to test!** 

1. Admin creates a user with any role
2. That user can now login via Google OAuth
3. They'll have the exact permissions assigned to their role

🚀
