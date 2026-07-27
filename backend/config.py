import os
from pathlib import Path
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    f"sqlite:///{Path(__file__).parent / 'pulse-crm.db'}"
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
