import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Config:
    # LLM
    LLM_API_KEY = os.getenv("SUMMARIZATION_API_KEY")
    LLM_MODEL = os.getenv("SUMMARIZATION_MODEL", "gemini-1.5-pro")
    LLM_TEMPERATURE = float(os.getenv("SUMMARIZATION_TEMPERATURE", "0.3"))
    LLM_MAX_TOKENS = int(os.getenv("SUMMARIZATION_MAX_TOKENS", "200"))
    LLM_TIMEOUT = int(os.getenv("SUMMARIZATION_TIMEOUT", "5000"))
    
    # Database
    DATABASE_URL = os.getenv("DATABASE_URL")
    SUPABASE_URL = os.getenv("SUPABASE_URL")
    SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
    
    # Redis
    REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
    
    # Auth
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
    
    # Logging
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
    LOG_FORMAT = os.getenv("LOG_FORMAT", "json")
    
    # Module
    PORT = int(os.getenv("SUMMARIZATION_PORT", "8003"))
    
    # Timeouts
    SUMMARISE_TIMEOUT = 30  # seconds
    BATCH_SIZE = 10
    
    # Fallback
    MIN_CONFIDENCE_THRESHOLD = 0.3
    MAX_RETRIES = 1

# THIS IS THE IMPORTANT PART - Create an instance of Config
config = Config()