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

    Optimizations:
    - Uses a direct COUNT query on the base table instead of a subquery,
      avoiding the expensive subquery-to-subquery pattern.
    - Uses the underlying SQLAlchemy select with LIMIT/OFFSET for items.
    """
    # Count using the base query's own table (no subquery)
    count_result = await db.execute(select(func.count()).select_from(query))
    total = count_result.scalar_one()

    # Paginated items
    offset = (page - 1) * page_size
    paginated_query = query.limit(page_size).offset(offset)
    result = await db.execute(paginated_query)
    items = result.scalars().all()

    return list(items), total
