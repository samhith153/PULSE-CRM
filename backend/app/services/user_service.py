"""
User Management Service
All user business logic â€” create, update, activate, deactivate, assign roles.
"""
from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import (
    ConflictException,
    DuplicateException,
    NotFoundException,
    ForbiddenException,
)
from app.core.logging import get_logger
from app.core.security import hash_password
from app.models.user import User
from app.repositories.role_repository import RoleRepository
from app.repositories.user_repository import UserRepository
from app.schemas.user import UserCreateRequest, UserUpdateRequest, UserResponse
from app.services.event_service import EventService

logger = get_logger(__name__)


class UserService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.user_repo = UserRepository(db)
        self.role_repo = RoleRepository(db)
        self.events = EventService(db)

    async def create_user(
        self,
        payload: UserCreateRequest,
        organization_id: UUID,
        created_by: UUID,
    ) -> User:
        existing = await self.user_repo.get_by_email(payload.email.lower())
        if existing:
            raise DuplicateException("User", "email", payload.email)

        user = await self.user_repo.create(
            email=payload.email.lower(),
            full_name=payload.full_name.strip(),
            hashed_password=hash_password(payload.password),
            phone=payload.phone,
            job_title=payload.job_title,
            timezone=payload.timezone,
            locale=payload.locale,
            organization_id=organization_id,
            is_verified=True,
        )

        if payload.role_ids:
            await self.user_repo.assign_roles(user, payload.role_ids, created_by)

        user = await self.user_repo.get_by_id_with_roles(user.id)
        logger.info("User created", extra={"user_id": str(user.id), "created_by": str(created_by)})
        await self.events.record_event(
            "USER_CREATED",
            organization_id=organization_id,
            actor_id=created_by,
            aggregate_type="user",
            aggregate_id=str(user.id),
            source="user_service",
            payload={
                "user_id": str(user.id),
                "email": user.email,
                "full_name": user.full_name,
                "role_ids": [str(role_id) for role_id in (payload.role_ids or [])],
            },
        )
        return user

    async def list_users(
        self,
        organization_id: UUID,
        search: Optional[str],
        page: int,
        page_size: int,
    ) -> Tuple[List[User], int]:
        return await self.user_repo.list_by_organization(
            organization_id, search, page, page_size
        )

    async def get_user(self, user_id: UUID, organization_id: UUID) -> User:
        user = await self.user_repo.get_by_id_with_roles(user_id)
        if not user or user.organization_id != organization_id:
            raise NotFoundException("User", user_id)
        return user

    async def update_user(
        self,
        user_id: UUID,
        organization_id: UUID,
        payload: UserUpdateRequest,
    ) -> User:
        user = await self.get_user(user_id, organization_id)
        update_data = payload.model_dump(exclude_none=True)
        await self.user_repo.update(user, **update_data)
        updated = await self.user_repo.get_by_id_with_roles(user.id)
        if update_data:
            await self.events.record_event(
                "USER_UPDATED",
                organization_id=organization_id,
                actor_id=user.id,
                aggregate_type="user",
                aggregate_id=str(user.id),
                source="user_service",
                payload={"user_id": str(user.id), "changes": list(update_data.keys())},
            )
        return updated

    async def activate_user(self, user_id: UUID, organization_id: UUID) -> User:
        user = await self.get_user(user_id, organization_id)
        if user.is_active:
            raise ConflictException("User is already active.")
        await self.user_repo.update(user, is_active=True)
        await self.events.record_event(
            "USER_ACTIVATED",
            organization_id=organization_id,
            actor_id=user.id,
            aggregate_type="user",
            aggregate_id=str(user.id),
            source="user_service",
            payload={"user_id": str(user.id)},
        )
        return user

    async def deactivate_user(self, user_id: UUID, organization_id: UUID, requestor_id: UUID) -> User:
        if user_id == requestor_id:
            raise ForbiddenException("You cannot deactivate your own account.")
        user = await self.get_user(user_id, organization_id)
        if not user.is_active:
            raise ConflictException("User is already inactive.")
        await self.user_repo.update(user, is_active=False)
        await self.events.record_event(
            "USER_DEACTIVATED",
            organization_id=organization_id,
            actor_id=requestor_id,
            aggregate_type="user",
            aggregate_id=str(user.id),
            source="user_service",
            payload={"user_id": str(user.id), "requestor_id": str(requestor_id)},
        )
        return user

    async def assign_roles(
        self,
        user_id: UUID,
        organization_id: UUID,
        role_ids: List[UUID],
        assigned_by: UUID,
    ) -> User:
        user = await self.get_user(user_id, organization_id)
        await self.user_repo.assign_roles(user, role_ids, assigned_by)
        updated = await self.user_repo.get_by_id_with_roles(user.id)
        await self.events.record_event(
            "USER_ROLES_ASSIGNED",
            organization_id=organization_id,
            actor_id=assigned_by,
            aggregate_type="user",
            aggregate_id=str(user.id),
            source="user_service",
            payload={
                "user_id": str(user.id),
                "role_ids": [str(role_id) for role_id in role_ids],
                "assigned_by": str(assigned_by),
            },
        )
        return updated

    async def delete_user(self, user_id: UUID, organization_id: UUID, requestor_id: UUID) -> None:
        if user_id == requestor_id:
            raise ForbiddenException("You cannot delete your own account.")
        user = await self.get_user(user_id, organization_id)
        await self.user_repo.soft_delete(user)
        logger.info("User soft-deleted", extra={"user_id": str(user_id)})
        await self.events.record_event(
            "USER_DELETED",
            organization_id=organization_id,
            actor_id=requestor_id,
            aggregate_type="user",
            aggregate_id=str(user.id),
            source="user_service",
            payload={"user_id": str(user.id), "requestor_id": str(requestor_id)},
        )
