# Google Sign-In Implementation Details

This document outlines the modifications and features implemented to enable **Google Sign-In** (OAuth 2.0 / Google Identity Services) in the PULSE CRM backend.

---

## 1. Environment & Configuration

We introduced configuration options to support Google integration dynamically without hardcoding keys.

### Configuration Fields (`app/core/config.py`)
Added settings for Google credentials and OAuth scopes:
- `GOOGLE_CLIENT_ID`: The client ID obtained from Google Cloud Console.
- `GOOGLE_CLIENT_SECRET`: Client secret for server-side OAuth flow.
- `GOOGLE_REDIRECT_URI`: OAuth redirect endpoint.
- `GOOGLE_OAUTH_SCOPES`: Permissions scopes for API integration (e.g., Gmail reading/sending).

### Environment Variables (`.env`)
The environment configuration has been updated to export the appropriate values:
```env
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:8000/api/v1/auth/callback
```

---

## 2. Dependencies

We added Google library suites to `backend/requirements.txt` to verify ID tokens and handle API integrations:
- `google-auth>=2.29.0`: Used for verifying Google ID Tokens server-side.
- `google-auth-oauthlib>=1.2.0`: Standard library for OAuth integration.
- `google-api-python-client>=2.130.0`: Google Client library for interaction with Google APIs (e.g. Gmail).

---

## 3. Pydantic Schemas (`app/schemas/auth.py`)

New schemas were added to serialize and validate incoming and outgoing request payloads:
- `GoogleLoginRequest`: Validates the Google Identity Services credential/ID token payload.
  ```python
  class GoogleLoginRequest(BaseModel):
      credential: str = Field(description="Google Identity Services credential/ID token")
  ```
- `AuthConfigResponse`: Exposes the public configuration (specifically `google_client_id`) to the client-side app so it knows which Client ID to initialize Google Sign-In with.

---

## 4. API Endpoints (`app/api/v1/auth.py`)

Two endpoints were created to expose configuration and handle authentication:

1. **`GET /api/v1/auth/config`**
   - **Summary**: Retrieve public auth configurations.
   - **Purpose**: Returns the configured `GOOGLE_CLIENT_ID` so the frontend can render the Google Sign-In button correctly.

2. **`POST /api/v1/auth/google`**
   - **Summary**: Authenticate with Google.
   - **Purpose**: Accepts the ID token credential, verifies it with Google's public keys, logs in/registers the user, and returns JWT tokens (access/refresh token).

---

## 5. Business Logic & Authentication Service (`app/services/auth_service.py`)

The core business logic is encapsulated in `AuthService.login_with_google()`:

- **Token Verification**: Verifies the ID token using `google.oauth2.id_token.verify_oauth2_token`.
- **Auto-Registration**:
  - If a user with the Google email does not exist:
    1. Creates a new Organization named after the user (e.g., `"{full_name}'s Workspace"`).
    2. Provisions the User with a randomly generated strong password, associates them with the new organization, and flags them as verified.
    3. Assigns the `admin` role to the user.
    4. Logs a `USER_REGISTERED` audit/event.
- **Login Flow**:
  - If the user exists:
    1. Checks if the account is active.
    2. Updates metadata fields (`last_login_at`, `last_login_ip`, and `avatar_url` if not already set).
    3. Logs a `USER_LOGGED_IN` audit/event.
- **Token Issue**: Generates standard access & refresh JWT tokens to authorize subsequent API requests.

---

## 6. Testing (`backend/tests/test_auth.py`)

We added test cases to verify the endpoints behave as expected:
- `test_get_auth_config`: Asserts that public configurations are returned successfully.
- `test_google_login_not_configured`: Validates error responses when Google Client ID is unconfigured or a mock token is invalid.
