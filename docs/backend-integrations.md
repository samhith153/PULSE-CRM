# PULSE CRM Backend Integrations

## Security

Runtime secrets are loaded from environment variables. `SECRET_KEY`, OAuth credentials, SMTP credentials, API keys, and token encryption keys must not be committed. In production, set `ENVIRONMENT=production` and provide `SECRET_KEY` and `GMAIL_TOKEN_ENCRYPTION_KEY` explicitly.

Rate limiting is enforced by `RateLimitMiddleware` using `RATE_LIMIT_PER_MINUTE` and `RATE_LIMIT_BURST`. Exceeded requests return a standard `429` error payload.

## Gmail Integration

Gmail endpoints keep the existing `/api/v1/gmail` contracts. OAuth login builds a Google authorization URL from `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, and `GOOGLE_OAUTH_SCOPES`. OAuth callback exchanges the authorization code with Google, reads the Gmail profile, encrypts access and refresh tokens, and stores the connection.

Token refresh decrypts the stored refresh token and updates encrypted access token state. Sync uses Gmail `messages.list` and `messages.get`, parses headers/body/timestamps, and persists messages through the existing email repository. Manual sync payloads remain supported for workers and tests.

## AI Module

The AI module uses provider interfaces so future ML or LLM providers can replace rule-based implementations without API contract changes. Current providers are:

- `FeatureExtractionService`
- `RuleBasedScorer`
- `RecommendationProvider`
- `ConversationSummaryProvider`

Generated scores, recommendations, and summaries are persisted in `ai_scores`, `ai_recommendations`, and `ai_conversation_summaries`. Responses include transparent explanation, reasoning, metadata, timestamps, tenant IDs, and regeneration links in persistence.

Configuration is environment-driven: `ENABLE_AI`, `AI_PROVIDER`, `MODEL_NAME`, `OPENAI_API_KEY`, `SCORING_PROVIDER`, and `AI_TIMEOUT`.

## Events And Webhooks

Events are stored in the durable `event_outbox` table. `EventWorker` reads pending/retrying events, dispatches consumers, marks processed events, and schedules exponential retry state for failures. The in-process event bus is retained for local dispatch and tests, but durable processing is database-backed.

Webhook endpoints are available under `/api/v1/webhooks`. Registrations store subscribed event types and a signing secret. Deliveries are signed with `X-Pulse-Signature`, retried with backoff, and tracked in `webhook_deliveries`.

## File Uploads

Uploads are available under `/api/v1/uploads/avatars` and `/api/v1/uploads/attachments`. The default provider is local storage controlled by `LOCAL_STORAGE_PATH`; file size and content type are validated through environment configuration. Avatar uploads update the current user's `avatar_url`.
