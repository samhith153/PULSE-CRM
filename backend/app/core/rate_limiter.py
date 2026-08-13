"""
Redis-backed rate limiting for multi-worker deployments.

Replaces the in-memory token-bucket dictionaries in rate_limit.py with
Redis-based counters so that rate limits are enforced consistently across
all workers (gunicorn/uvicorn with multiple processes).

Uses a sliding-window counter approach:
- Key: ratelimit:{client_key}:{window_start}
- Each request increments the counter for the current window
- Expire the key after the window duration
"""

from __future__ import annotations

import logging
import time
from typing import Optional

import redis.asyncio as redis

from app.core.config import settings

logger = logging.getLogger(__name__)

# ── Redis connection ──────────────────────────────────────────────────────────

_redis_client: Optional[redis.Redis] = None


async def get_redis() -> redis.Redis:
    """Lazily create a shared Redis connection (per-worker singleton)."""
    global _redis_client
    if _redis_client is None:
        redis_url = getattr(settings, "REDIS_URL", None)
        if not redis_url:
            raise RuntimeError(
                "REDIS_URL is not configured. Rate limiting requires Redis "
                "for multi-worker deployments."
            )
        _redis_client = redis.from_url(
            redis_url,
            encoding="utf-8",
            decode_responses=True,
        )
    return _redis_client


async def close_redis() -> None:
    """Close the Redis connection on app shutdown."""
    global _redis_client
    if _redis_client is not None:
        await _redis_client.aclose()
        _redis_client = None


# ── Sliding-window rate limiter ───────────────────────────────────────────────

class RedisRateLimiter:
    """Sliding-window rate limiter backed by Redis.

    Each client gets a per-minute counter.  The window slides in 1-second
    buckets for finer granularity, but we collapse to a single key per
    minute for simplicity and low Redis churn.

    Keys are of the form:  ratelimit:{scope}:{client_key}:{window_epoch_minute}
    """

    def __init__(
        self,
        scope: str,
        requests_per_minute: int,
        burst: int,
        enabled: bool = True,
    ) -> None:
        self.scope = scope
        self.rpm = requests_per_minute
        self.burst = burst
        self.enabled = enabled

    async def check(self, client_key: str) -> tuple[bool, int]:
        """Return (allowed, remaining).

        Uses a simplified approach: increment a per-minute counter and check
        against the burst limit.  The counter expires at the end of the minute.
        """
        if not self.enabled:
            return True, self.burst

        try:
            r = await get_redis()
        except RuntimeError as exc:
            logger.warning("Redis unavailable for rate limiting: %s — allowing request", exc)
            return True, self.burst

        now = time.time()
        window_key = self._window_key(client_key, now)

        pipe = r.pipeline()
        pipe.incr(window_key)
        pipe.expire(window_key, 65)  # 65s to cover clock skew across minute boundary
        results = await pipe.execute()
        current = results[0]

        allowed = current <= self.burst
        remaining = max(0, self.burst - current)
        return allowed, remaining

    def _window_key(self, client_key: str, now: float) -> str:
        window_minute = int(now // 60)
        return f"ratelimit:{self.scope}:{client_key}:{window_minute}"

    async def reset(self, client_key: str) -> None:
        """Clear rate-limit state for a client (e.g. on auth failure cleanup)."""
        try:
            r = await get_redis()
            pattern = f"ratelimit:{self.scope}:{client_key}:*"
            async for key in r.scan_iter(match=pattern):
                await r.delete(key)
        except Exception:
            logger.debug("Failed to reset rate-limit keys for %s", client_key)


# ── Pre-configured limiters ───────────────────────────────────────────────────

# Global rate limiter (all non-auth endpoints)
_global_limiter: Optional[RedisRateLimiter] = None


def get_global_limiter() -> Optional[RedisRateLimiter]:
    global _global_limiter
    if _global_limiter is None and settings.ENABLE_RATE_LIMIT:
        _global_limiter = RedisRateLimiter(
            scope="global",
            requests_per_minute=settings.RATE_LIMIT_PER_MINUTE,
            burst=settings.RATE_LIMIT_BURST,
            enabled=settings.ENABLE_RATE_LIMIT,
        )
    return _global_limiter


# Auth rate limiter (login, refresh, google oauth)
_auth_limiter: Optional[RedisRateLimiter] = None


def get_auth_limiter() -> Optional[RedisRateLimiter]:
    global _auth_limiter
    if _auth_limiter is None and settings.ENABLE_RATE_LIMIT:
        _auth_limiter = RedisRateLimiter(
            scope="auth",
            requests_per_minute=settings.AUTH_RATE_LIMIT_PER_MINUTE,
            burst=settings.AUTH_RATE_LIMIT_BURST,
            enabled=settings.ENABLE_RATE_LIMIT,
        )
    return _auth_limiter


# Password reset rate limiter
_pw_reset_limiter: Optional[RedisRateLimiter] = None


def get_pw_reset_limiter() -> Optional[RedisRateLimiter]:
    global _pw_reset_limiter
    if _pw_reset_limiter is None and settings.ENABLE_RATE_LIMIT:
        _pw_reset_limiter = RedisRateLimiter(
            scope="pw_reset",
            requests_per_minute=settings.PASSWORD_RESET_RATE_LIMIT_PER_MINUTE,
            burst=settings.PASSWORD_RESET_RATE_LIMIT_BURST,
            enabled=settings.ENABLE_RATE_LIMIT,
        )
    return _pw_reset_limiter
