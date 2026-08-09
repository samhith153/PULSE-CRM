"""
Global Search Route
GET /api/v1/search
"""
from typing import Any

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, or_

from app.api.deps import CurrentUser, DBSession, require_permission
from app.schemas.common import StandardResponse
from app.models.lead import Lead
from app.models.contact import Contact
from app.models.company import Company
from app.models.deal import Deal

# Initialize the router, requiring basic read permissions[cite: 11]
router = APIRouter(dependencies=[Depends(require_permission("activity:read"))])

@router.get(
    "",
    response_model=StandardResponse[list[dict[str, Any]]],
    summary="Global CRM Search",
    description="Searches across Leads, Contacts, and Companies for the Command Palette.",
    tags=["Search"],
)
async def global_search(
    current_user: CurrentUser,
    db: DBSession,
    q: str = Query(..., min_length=2, description="Search query string"),
) -> dict:
    results = []

    # 1. Search Leads
    stmt_leads = select(Lead).where(
        Lead.organization_id == current_user.organization_id,
        or_(
            Lead.title.ilike(f"%{q}%"),
            Lead.company_name.ilike(f"%{q}%"),
            Lead.email.ilike(f"%{q}%")
        )
    ).limit(3)
    leads = (await db.execute(stmt_leads)).scalars().all()

    for lead in leads:
        title = lead.title or lead.email or str(lead.id)
        company = lead.company_name or "—"
        results.append({
            "id": f"lead_{lead.id}",
            "title": title,
            "description": f"Lead • {company}",
            "category": "Search Results",
            "type": "leads",
            "db_id": str(lead.id)
        })

    # 2. Search Contacts
    stmt_contacts = select(Contact).where(
        Contact.organization_id == current_user.organization_id,
        or_(
            Contact.first_name.ilike(f"%{q}%"),
            Contact.last_name.ilike(f"%{q}%"),
            Contact.email.ilike(f"%{q}%")
        )
    ).limit(3)
    contacts = (await db.execute(stmt_contacts)).scalars().all()

    for contact in contacts:
        name = f"{contact.first_name} {contact.last_name}".strip() or contact.email or str(contact.id)
        results.append({
            "id": f"contact_{contact.id}",
            "title": name,
            "description": f"Contact • {contact.email}",
            "category": "Search Results",
            "type": "contacts",
            "db_id": str(contact.id)
        })

    # 3. Search Companies
    stmt_companies = select(Company).where(
        Company.organization_id == current_user.organization_id,
        Company.name.ilike(f"%{q}%")
    ).limit(3)
    companies = (await db.execute(stmt_companies)).scalars().all()

    for company in companies:
        results.append({
            "id": f"company_{company.id}",
            "title": company.name,
            "description": "Company Account",
            "category": "Search Results",
            "type": "companies",
            "db_id": str(company.id)
        })

    # 4. Search Deals
    stmt_deals = select(Deal).where(
        Deal.organization_id == current_user.organization_id,
        or_(
            Deal.name.ilike(f"%{q}%"),
            Deal.description.ilike(f"%{q}%")
        )
    ).limit(3)
    deals = (await db.execute(stmt_deals)).scalars().all()

    for deal in deals:
        results.append({
            "id": f"deal_{deal.id}",
            "title": deal.name,
            "description": f"Deal • {deal.status or 'open'}",
            "category": "Search Results",
            "type": "deals",
            "db_id": str(deal.id)
        })

    return {"success": True, "message": "Search complete", "data": results}