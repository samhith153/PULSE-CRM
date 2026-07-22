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
