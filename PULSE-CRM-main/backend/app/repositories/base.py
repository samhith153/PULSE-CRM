"""
Generic Async Repository
Provides CRUD operations for any SQLAlchemy model.
Domain-specific repositories extend this class to add custom queries.
"""
from typing import Any, Dict, Generic, List, Optional, Tuple, Type, TypeVar
from uuid import UUID

from sqlalchemy import Select, func, select, update, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.base import Base
from app.utils.pagination import paginate

ModelT = TypeVar("ModelT", bound=Base)


class BaseRepository(Generic[ModelT]):
    """
    Generic repository.
    Subclasses pass their model class to the constructor.
    """

    def __init__(self, model: Type[ModelT], db: AsyncSession) -> None:
        self.model = model
        self.db = db

    # -- Create ---------------------------------------------------------------

    async def create(self, **data: Any) -> ModelT:
        print(f"Creating {self.model.__name__}: {data}")

        instance = self.model(**data)
        self.db.add(instance)

        await self.db.flush()
        print(f"Flushed {self.model.__name__}, id={instance.id}")

        await self.db.refresh(instance)
        print(f"Refreshed {self.model.__name__}")

        return instance

    # -- Read ----------------------------------------------------------------

    async def get_by_id(self, record_id: UUID) -> Optional[ModelT]:
        result = await self.db.get(self.model, record_id)
        return result

    async def get_by_field(self, field: str, value: Any) -> Optional[ModelT]:
        stmt = select(self.model).where(
            getattr(self.model, field) == value
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_all(
        self,
        filters: Optional[Dict[str, Any]] = None,
    ) -> List[ModelT]:
        stmt = select(self.model)
        if filters:
            for field, value in filters.items():
                stmt = stmt.where(getattr(self.model, field) == value)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_paginated(
        self,
        query: Select,
        page: int,
        page_size: int,
    ) -> Tuple[List[ModelT], int]:
        return await paginate(self.db, query, page, page_size)

    # -- Update ---------------------------------------------------------------

    async def update(self, instance: ModelT, **data: Any) -> ModelT:
        for key, value in data.items():
            if value is not None or key in data:
                setattr(instance, key, value)
        self.db.add(instance)
        await self.db.flush()
        await self.db.refresh(instance)
        return instance

    # -- Delete (hard) --------------------------------------------------------

    async def delete(self, instance: ModelT) -> None:
        await self.db.delete(instance)
        await self.db.flush()

    # -- Soft Delete ----------------------------------------------------------

    async def soft_delete(self, instance: ModelT) -> ModelT:
        instance.is_deleted = True  # type: ignore[attr-defined]
        instance.is_active = False  # type: ignore[attr-defined]
        self.db.add(instance)
        await self.db.flush()
        return instance

    # -- Existence check ------------------------------------------------------

    async def exists(self, **kwargs: Any) -> bool:
        stmt = select(func.count()).select_from(self.model)
        for field, value in kwargs.items():
            stmt = stmt.where(getattr(self.model, field) == value)
        result = await self.db.execute(stmt)
        return (result.scalar_one() or 0) > 0