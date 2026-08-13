"""
Revoked Token Repository
DB-backed access-token revocation (shared across processes/workers).
"""
from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.revoked_token import RevokedToken
from app.repositories.base import BaseRepository


class RevokedTokenRepository(BaseRepository[RevokedToken]):

    def __init__(self, db: AsyncSession) -> None:
        super().__init__(RevokedToken, db)

    async def revoke(
        self,
        jti: str,
        user_id: Optional[UUID] = None,
        expires_at: Optional[datetime] = None,
    ) -> None:
        expires_at = expires_at or datetime.now(timezone.utc)
        self.db.add(RevokedToken(jti=jti, user_id=user_id, expires_at=expires_at))
        await self.db.flush()

    async def is_revoked(self, jti: str) -> bool:
        result = await self.db.execute(
            select(RevokedToken.id).where(
                RevokedToken.jti == jti,
                RevokedToken.expires_at > datetime.now(timezone.utc),
            )
        )
        return result.scalar_one_or_none() is not None

    async def purge_expired(self, now: Optional[datetime] = None) -> int:
        """Hard-delete revoked entries past their natural expiry."""
        now = now or datetime.now(timezone.utc)
        result = await self.db.execute(
            delete(RevokedToken).where(RevokedToken.expires_at < now)
        )
        await self.db.flush()
        return result.rowcount or 0
