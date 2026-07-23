
import redis
import json
import os
from typing import Optional, Any

# Simple in-memory cache (no Redis required)
class MemoryCache:
    def __init__(self):
        self._cache = {}
    
    def get(self, key: str) -> Optional[Any]:
        return self._cache.get(key)
    
    def set(self, key: str, value: Any, ttl: int = 3600):
        self._cache[key] = value
    
    def delete(self, key: str):
        if key in self._cache:
            del self._cache[key]

# Try Redis, fallback to memory
try:
    redis_client = redis.Redis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379"))
    redis_client.ping()
    cache = redis_client
    print("✅ Redis connected")
except:
    cache = MemoryCache()
    print("⚠️ Using in-memory cache (Redis not available)")

def get_cached_summary(thread_id: str) -> Optional[dict]:
    """Get cached summary."""
    try:
        if hasattr(cache, 'get'):
            data = cache.get(f"summary:{thread_id}")
            if data:
                return json.loads(data) if isinstance(data, str) else data
    except:
        pass
    return None

def cache_summary(thread_id: str, summary: dict, ttl: int = 3600):
    """Cache summary."""
    try:
        if hasattr(cache, 'setex'):
            cache.setex(f"summary:{thread_id}", ttl, json.dumps(summary))
        elif hasattr(cache, 'set'):
            cache.set(f"summary:{thread_id}", summary)
    except:
        pass