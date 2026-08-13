"""
Refresh Token Repository
Server-side persistence and rotation for refresh tokens.
"""
from datetime import datetime, timezone
from typing import List, Optional
from uuid import UUID

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.refresh_token import RefreshToken
from app.repositories.base import BaseRepository


class RefreshTokenRepository(BaseRepository[RefreshToken]):

    def __init__(self, db: AsyncSession) -> None:
        super().__init__(RefreshToken, db)

    async def get_by_hash(self, token_hash: str) -> Optional[RefreshToken]:
        stmt = select(RefreshToken).where(RefreshToken.token_hash == token_hash)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def create(
        self,
        user_id: UUID,
        token_hash: str,
        expires_at: datetime,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> RefreshToken:
        return await super().create(
            user_id=user_id,
            token_hash=token_hash,
            expires_at=expires_at,
            ip_address=ip_address,
            user_agent=user_agent,
        )

    async def revoke(self, token: RefreshToken, replaced_by_hash: Optional[str] = None) -> None:
        """Revoke a single token, optionally chaining it to its replacement."""
        await self.db.execute(
            update(RefreshToken)
            .where(RefreshToken.id == token.id)
            .values(
                revoked_at=datetime.now(timezone.utc),
                replaced_by_hash=replaced_by_hash,
            )
        )
        await self.db.flush()

    async def revoke_all_for_user(self, user_id: UUID, except_hash: Optional[str] = None) -> int:
        """Revoke every active refresh token for a user (password change / security event).

        Returns the number of tokens revoked.
        """
        stmt = update(RefreshToken).where(
            RefreshToken.user_id == user_id,
            RefreshToken.revoked_at.is_(None),
        )
        if except_hash:
            stmt = stmt.where(RefreshToken.token_hash != except_hash)
        result = await self.db.execute(
            stmt.values(revoked_at=datetime.now(timezone.utc))
        )
        await self.db.flush()
        return result.rowcount or 0

    async def list_active_for_user(self, user_id: UUID) -> List[RefreshToken]:
        stmt = select(RefreshToken).where(
            RefreshToken.user_id == user_id,
            RefreshToken.revoked_at.is_(None),
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def delete_expired(self, before: datetime) -> int:
        """Housekeeping: hard-delete expired or revoked tokens older than `before`."""
        from sqlalchemy import delete

        stmt = delete(RefreshToken).where(
            (RefreshToken.expires_at < before) | (RefreshToken.revoked_at < before)
        )
        result = await self.db.execute(stmt)
        await self.db.flush()
        return result.rowcount or 0
