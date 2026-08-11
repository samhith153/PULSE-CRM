"""
Global Search Route
GET /api/v1/search?q=<term>&page=1&page_size=20&entity_type=leads
"""
from __future__ import annotations

from typing import Any, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import func, or_, select

from app.api.deps import CurrentUser, DBSession, require_permission
from app.models.company import Company
from app.models.contact import Contact
from app.models.deal import Deal
from app.models.lead import Lead
from app.schemas.common import StandardResponse

router = APIRouter(dependencies=[Depends(require_permission("activity:read"))])

_ENTITY_TYPES = {"leads", "contacts", "companies", "deals"}
_DEFAULT_LIMIT_PER_TYPE = 5


class SearchResultItem(BaseModel):
    id: str
    title: str
    description: str
    category: str
    type: str
    db_id: str
    status: Optional[str] = None
    email: Optional[str] = None


@router.get(
    "",
    response_model=StandardResponse[list[SearchResultItem]],
    summary="Global CRM Search",
    description=(
        "Full-text search across Leads, Contacts, Companies and Deals. "
        "Returns up to `limit` results per entity type (default 5). "
        "Optionally filter to a single entity type with `entity_type`."
    ),
    tags=["Search"],
)
async def global_search(
    current_user: CurrentUser,
    db: DBSession,
    q: str = Query(..., min_length=2, max_length=200, description="Search query string"),
    entity_type: Optional[str] = Query(
        default=None,
        description="Restrict results to: leads | contacts | companies | deals",
    ),
    limit: int = Query(default=5, ge=1, le=25, description="Max results per entity type"),
) -> dict:
    """
    Searches active, non-deleted records only.
    Applies organization_id scoping on every query.
    """
    org_id = current_user.organization_id
    term = f"%{q.strip()}%"
    results: list[SearchResultItem] = []

    # Normalise entity_type filter
    et = entity_type.lower() if entity_type else None
    if et and et not in _ENTITY_TYPES:
        et = None  # ignore unknown values, search all

    # ── 1. Leads ─────────────────────────────────────────────────────────────
    if et is None or et == "leads":
        stmt = (
            select(Lead)
            .where(
                Lead.organization_id == org_id,
                Lead.is_active.is_(True),
                Lead.is_deleted.is_(False),
                or_(
                    Lead.title.ilike(term),
                    Lead.company_name.ilike(term),
                    Lead.email.ilike(term),
                    Lead.phone.ilike(term),
                ),
            )
            .order_by(Lead.created_at.desc())
            .limit(limit)
        )
        for lead in (await db.execute(stmt)).scalars().all():
            title = lead.title or lead.email or str(lead.id)
            company = lead.company_name or "—"
            results.append(
                SearchResultItem(
                    id=f"lead_{lead.id}",
                    title=title,
                    description=f"Lead · {company}",
                    category="Search Results",
                    type="leads",
                    db_id=str(lead.id),
                    status=lead.status,
                    email=lead.email,
                )
            )

    # ── 2. Contacts ───────────────────────────────────────────────────────────
    if et is None or et == "contacts":
        stmt = (
            select(Contact)
            .where(
                Contact.organization_id == org_id,
                Contact.is_active.is_(True),
                Contact.is_deleted.is_(False),
                or_(
                    Contact.first_name.ilike(term),
                    Contact.last_name.ilike(term),
                    Contact.email.ilike(term),
                    Contact.phone.ilike(term),
                    func.concat(Contact.first_name, " ", Contact.last_name).ilike(term),
                ),
            )
            .order_by(Contact.created_at.desc())
            .limit(limit)
        )
        for contact in (await db.execute(stmt)).scalars().all():
            name = f"{contact.first_name or ''} {contact.last_name or ''}".strip() or contact.email or str(contact.id)
            results.append(
                SearchResultItem(
                    id=f"contact_{contact.id}",
                    title=name,
                    description=f"Contact · {contact.email or '—'}",
                    category="Search Results",
                    type="contacts",
                    db_id=str(contact.id),
                    email=contact.email,
                )
            )

    # ── 3. Companies ──────────────────────────────────────────────────────────
    if et is None or et == "companies":
        stmt = (
            select(Company)
            .where(
                Company.organization_id == org_id,
                Company.is_active.is_(True),
                Company.is_deleted.is_(False),
                or_(
                    Company.name.ilike(term),
                    Company.domain.ilike(term),
                    Company.industry.ilike(term),
                ),
            )
            .order_by(Company.created_at.desc())
            .limit(limit)
        )
        for company in (await db.execute(stmt)).scalars().all():
            results.append(
                SearchResultItem(
                    id=f"company_{company.id}",
                    title=company.name,
                    description=f"Company · {company.industry or 'Account'}",
                    category="Search Results",
                    type="companies",
                    db_id=str(company.id),
                )
            )

    # ── 4. Deals ──────────────────────────────────────────────────────────────
    if et is None or et == "deals":
        stmt = (
            select(Deal)
            .where(
                Deal.organization_id == org_id,
                Deal.is_active.is_(True),
                Deal.is_deleted.is_(False),
                or_(
                    Deal.name.ilike(term),
                    Deal.description.ilike(term),
                    Deal.notes.ilike(term),
                ),
            )
            .order_by(Deal.created_at.desc())
            .limit(limit)
        )
        for deal in (await db.execute(stmt)).scalars().all():
            results.append(
                SearchResultItem(
                    id=f"deal_{deal.id}",
                    title=deal.name,
                    description=f"Deal · {deal.status or 'open'}",
                    category="Search Results",
                    type="deals",
                    db_id=str(deal.id),
                    status=deal.status,
                )
            )

    return {"success": True, "message": "Search complete", "data": results}
