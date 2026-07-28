import os

DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "postgresql://postgres:postgres@localhost:5432/pulse-crm"
)

JWT_SECRET_KEY = os.getenv(
    "JWT_SECRET_KEY", 
    "your-jwt-supabase-secret-hash-super-secure-default-key-for-development"
)

JWT_ALGORITHM = "HS256"

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
GOOGLE_REDIRECT_URI = os.getenv(
    "GOOGLE_REDIRECT_URI", 
    "http://localhost:8000/gmail/oauth/callback"
)

BREVO_API_KEY = os.getenv("BREVO_API_KEY", "")
BREVO_API_URL = os.getenv("BREVO_API_URL", "https://api.brevo.com/v3/smtp/email")
BREVO_WEBHOOK_SECRET = os.getenv("BREVO_WEBHOOK_SECRET", "")

FROM_EMAIL = os.getenv("FROM_EMAIL", "noreply@kalnet.com")
FROM_NAME = os.getenv("FROM_NAME", "Kalnet CRM")
