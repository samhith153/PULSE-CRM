"""
Pagination helper — builds SQLAlchemy SELECT statements with
count, limit, and offset applied consistently across all list endpoints.
"""
from typing import Any, List, Tuple, TypeVar

from sqlalchemy import Select, func, select
from sqlalchemy.ext.asyncio import AsyncSession

ModelT = TypeVar("ModelT")


async def paginate(
    db: AsyncSession,
    query: Select,
    page: int,
    page_size: int,
) -> Tuple[List[Any], int]:
    """
    Execute a paginated query and return (items, total_count).

    Args:
        db: Active async database session.
        query: Base SELECT statement (no limit/offset applied yet).
        page: 1-indexed page number.
        page_size: Number of items per page.

    Returns:
        Tuple of (list of ORM objects, total row count).
    """
    # Total count using a subquery for accuracy
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar_one()

    # Paginated items
    offset = (page - 1) * page_size
    paginated_query = query.limit(page_size).offset(offset)
    result = await db.execute(paginated_query)
    items = result.scalars().all()

    return list(items), total
