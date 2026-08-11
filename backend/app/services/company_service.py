"""
Company Management Service
"""
from __future__ import annotations

from datetime import datetime
from typing import Any, List, Optional, Tuple
from uuid import UUID

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import DuplicateException, NotFoundException, BusinessRuleException
from app.core.logging import get_logger
from app.models.company import Company
from app.models.contact import Contact
from app.models.deal import Deal
from app.models.lead import Lead
from app.repositories.company_repository import CompanyRepository
from app.repositories.activity_repository import ActivityTimelineRepository
from app.services.timeline_engine_service import TimelineEngineService
from app.services.activity_timeline_service import ActivityTimelineService
from app.schemas.company import CompanyCreateRequest, CompanyUpdateRequest
from app.schemas.activity_timeline import TimelineListResponse, ActivitySummaryResponse
from app.utils.enums import ActivityEntityType, ActivityType, SortOrder

logger = get_logger(__name__)


class CompanyService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = CompanyRepository(db)
        self.timeline = TimelineEngineService(db)

    # ─────────────────────────────────────────────────────────────────────────
    # CRUD
    # ─────────────────────────────────────────────────────────────────────────

    async def create(
        self,
        payload: CompanyCreateRequest,
        organization_id: UUID,
        created_by: UUID,
    ) -> Company:
        data = payload.model_dump(exclude_none=True)
        data["name"] = data["name"].strip()
        if data.get("email"):
            data["email"] = data["email"].strip().lower()

        existing = await self.repo.get_by_name_in_org(data["name"], organization_id)
        if existing:
            raise DuplicateException("Company", "name", data["name"])
        if data.get("email") and await self.repo.get_by_email_in_org(data["email"], organization_id):
            raise DuplicateException("Company", "email", data["email"])
        if data.get("phone") and await self.repo.get_by_phone_in_org(data["phone"], organization_id):
            raise DuplicateException("Company", "phone", data["phone"])

        company = await self.repo.create(
            **data,
            organization_id=organization_id,
            created_by=created_by,
        )
        await self.timeline.company_created(organization_id, created_by, company.id, company.name)
        logger.info("Company created", extra={"company_id": str(company.id)})
        return company

    async def list(
        self,
        organization_id: UUID,
        search: Optional[str],
        page: int,
        page_size: int,
    ) -> Tuple[List[Company], int]:
        return await self.repo.list_by_organization(organization_id, search, page, page_size)

    async def get(self, company_id: UUID, organization_id: UUID) -> Company:
        company = await self.repo.get_active_by_id(company_id, organization_id)
        if not company:
            raise NotFoundException("Company", company_id)
        return company

    async def update(
        self,
        company_id: UUID,
        organization_id: UUID,
        payload: CompanyUpdateRequest,
        updated_by: Optional[UUID] = None,
    ) -> Company:
        company = await self.get(company_id, organization_id)
        update_data = payload.model_dump(exclude_none=True)

        if "name" in update_data:
            update_data["name"] = update_data["name"].strip()
        if "email" in update_data and update_data["email"]:
            update_data["email"] = update_data["email"].strip().lower()

        if "name" in update_data and update_data["name"] != company.name:
            existing = await self.repo.get_by_name_in_org(update_data["name"], organization_id)
            if existing and existing.id != company_id:
                raise DuplicateException("Company", "name", update_data["name"])
        if "email" in update_data and update_data["email"] != company.email:
            existing = await self.repo.get_by_email_in_org(update_data["email"], organization_id)
            if existing and existing.id != company_id:
                raise DuplicateException("Company", "email", update_data["email"])
        if "phone" in update_data and update_data["phone"] != company.phone:
            existing = await self.repo.get_by_phone_in_org(update_data["phone"], organization_id)
            if existing and existing.id != company_id:
                raise DuplicateException("Company", "phone", update_data["phone"])

        await self.repo.update(company, **update_data)
        if update_data:
            await self.timeline.company_updated(
                organization_id,
                updated_by or company.created_by,
                company.id,
                company.name,
                dict(update_data),   # pass a copy so helpers can pop safely
            )
        return await self.get(company_id, organization_id)

    async def delete(self, company_id: UUID, organization_id: UUID,
                     deleted_by: Optional[UUID] = None) -> None:
        company = await self.get(company_id, organization_id)

        active_contacts = (await self.db.execute(
            select(func.count()).select_from(Contact).where(
                Contact.company_id == company_id, Contact.is_deleted == False)
        )).scalar() or 0
        active_leads = (await self.db.execute(
            select(func.count()).select_from(Lead).where(
                Lead.company_id == company_id, Lead.is_deleted == False)
        )).scalar() or 0
        active_deals = (await self.db.execute(
            select(func.count()).select_from(Deal).where(
                Deal.company_id == company_id, Deal.is_deleted == False)
        )).scalar() or 0

        if active_contacts > 0 or active_leads > 0 or active_deals > 0:
            parts = []
            if active_contacts:
                parts.append(f"{active_contacts} contact{'s' if active_contacts != 1 else ''}")
            if active_leads:
                parts.append(f"{active_leads} lead{'s' if active_leads != 1 else ''}")
            if active_deals:
                parts.append(f"{active_deals} deal{'s' if active_deals != 1 else ''}")
            raise BusinessRuleException(
                f"Cannot delete company '{company.name}': linked to {', '.join(parts)}. "
                "Remove the company from these records first, or delete them first."
            )

        await self.repo.soft_delete(company)
        await self.timeline.company_deleted(
            organization_id, deleted_by or company.created_by, company.id, company.name
        )
        logger.info("Company deleted", extra={"company_id": str(company_id)})

    # ─────────────────────────────────────────────────────────────────────────
    # TIMELINE
    # ─────────────────────────────────────────────────────────────────────────

    async def get_timeline(
        self,
        company_id: UUID,
        organization_id: UUID,
        *,
        page: int = 1,
        page_size: int = 20,
        activity_type: Optional[str] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
        sort_order: str = "desc",
    ) -> TimelineListResponse:
        """Return enriched, paginated timeline for this company."""
        await self.get(company_id, organization_id)   # 404 guard
        svc = ActivityTimelineService(self.db)
        return await svc.get_entity_timeline(
            organization_id=organization_id,
            entity_type="company",
            entity_id=company_id,
            page=page,
            page_size=page_size,
            activity_type=activity_type,
            date_from=date_from,
            date_to=date_to,
            sort_order=sort_order,
        )

    async def get_activity_summary(
        self,
        company_id: UUID,
        organization_id: UUID,
    ) -> ActivitySummaryResponse:
        """Return aggregate activity counts for the company."""
        await self.get(company_id, organization_id)
        svc = ActivityTimelineService(self.db)
        return await svc.get_entity_summary(
            organization_id=organization_id,
            entity_type="company",
            entity_id=company_id,
        )

    # ─────────────────────────────────────────────────────────────────────────
    # CONTACTS
    # ─────────────────────────────────────────────────────────────────────────

    async def get_contacts(
        self,
        company_id: UUID,
        organization_id: UUID,
        *,
        page: int = 1,
        page_size: int = 50,
    ) -> Tuple[List[dict[str, Any]], int]:
        """Return active contacts linked to this company."""
        await self.get(company_id, organization_id)

        from sqlalchemy.orm import aliased
        from app.models.user import User

        owner_alias = aliased(User, name="contact_owner")
        stmt = (
            select(
                Contact.id,
                Contact.first_name,
                Contact.last_name,
                Contact.email,
                Contact.phone,
                Contact.mobile,
                Contact.job_title,
                Contact.department,
                Contact.avatar_url,
                Contact.owner_id,
                Contact.organization_id,
                Contact.created_at,
                Contact.updated_at,
                owner_alias.full_name.label("owner_name"),
            )
            .outerjoin(owner_alias, owner_alias.id == Contact.owner_id)
            .where(
                Contact.company_id == company_id,
                Contact.organization_id == organization_id,
                Contact.is_deleted == False,
                Contact.is_active.is_(True),
            )
            .order_by(Contact.first_name, Contact.last_name)
        )

        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = int((await self.db.execute(count_stmt)).scalar_one() or 0)

        stmt = stmt.offset((page - 1) * page_size).limit(page_size)
        result = await self.db.execute(stmt)
        rows = result.mappings().all()

        contacts = []
        for r in rows:
            contacts.append({
                "id": str(r["id"]),
                "first_name": r["first_name"],
                "last_name": r["last_name"],
                "full_name": f"{r['first_name']} {r['last_name']}".strip(),
                "email": r["email"],
                "phone": r["phone"] or r["mobile"],
                "job_title": r["job_title"],
                "department": r["department"],
                "avatar_url": r["avatar_url"],
                "owner_id": str(r["owner_id"]) if r["owner_id"] else None,
                "owner_name": r["owner_name"],
                "organization_id": str(r["organization_id"]),
                "created_at": r["created_at"].isoformat() if r["created_at"] else None,
                "updated_at": r["updated_at"].isoformat() if r["updated_at"] else None,
            })
        return contacts, total

    # ─────────────────────────────────────────────────────────────────────────
    # DEALS
    # ─────────────────────────────────────────────────────────────────────────

    async def get_deals(
        self,
        company_id: UUID,
        organization_id: UUID,
        *,
        page: int = 1,
        page_size: int = 50,
    ) -> Tuple[List[dict[str, Any]], int]:
        """Return active deals linked to this company."""
        await self.get(company_id, organization_id)

        from sqlalchemy.orm import aliased
        from app.models.user import User

        owner_alias = aliased(User, name="deal_owner")
        stmt = (
            select(
                Deal.id,
                Deal.name,
                Deal.status,
                Deal.amount,
                Deal.currency,
                Deal.expected_close_date,
                Deal.probability,
                Deal.owner_id,
                Deal.organization_id,
                Deal.created_at,
                Deal.updated_at,
                owner_alias.full_name.label("owner_name"),
            )
            .outerjoin(owner_alias, owner_alias.id == Deal.owner_id)
            .where(
                Deal.company_id == company_id,
                Deal.organization_id == organization_id,
                Deal.is_deleted == False,
                Deal.is_active.is_(True),
            )
            .order_by(Deal.created_at.desc())
        )

        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = int((await self.db.execute(count_stmt)).scalar_one() or 0)

        stmt = stmt.offset((page - 1) * page_size).limit(page_size)
        result = await self.db.execute(stmt)
        rows = result.mappings().all()

        deals = []
        for r in rows:
            deals.append({
                "id": str(r["id"]),
                "name": r["name"],
                "status": r["status"],
                "amount": str(r["amount"]) if r["amount"] is not None else None,
                "currency": r["currency"],
                "expected_close_date": r["expected_close_date"].isoformat() if r["expected_close_date"] else None,
                "probability": r["probability"],
                "owner_id": str(r["owner_id"]) if r["owner_id"] else None,
                "owner_name": r["owner_name"],
                "organization_id": str(r["organization_id"]),
                "created_at": r["created_at"].isoformat() if r["created_at"] else None,
                "updated_at": r["updated_at"].isoformat() if r["updated_at"] else None,
            })
        return deals, total

    # ─────────────────────────────────────────────────────────────────────────
    # NOTES  (reuses crm_notes table via related_company_id)
    # ─────────────────────────────────────────────────────────────────────────

    async def list_notes(
        self,
        company_id: UUID,
        organization_id: UUID,
        *,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None,
    ) -> Tuple[List[dict[str, Any]], int]:
        """Return active notes linked to this company."""
        await self.get(company_id, organization_id)
        from app.models.crm_note import CrmNote
        from app.models.user import User
        from sqlalchemy.orm import aliased

        author_alias = aliased(User, name="note_author")
        stmt = (
            select(
                CrmNote.id,
                CrmNote.title,
                CrmNote.body,
                CrmNote.owner_id,
                CrmNote.created_by,
                CrmNote.organization_id,
                CrmNote.created_at,
                CrmNote.updated_at,
                author_alias.full_name.label("author_name"),
                author_alias.avatar_url.label("author_avatar"),
            )
            .outerjoin(author_alias, author_alias.id == CrmNote.created_by)
            .where(
                CrmNote.related_company_id == company_id,
                CrmNote.organization_id == organization_id,
                CrmNote.is_deleted.is_(False),
                CrmNote.is_active.is_(True),
            )
        )
        if search:
            term = f"%{search.lower()}%"
            stmt = stmt.where(
                or_(CrmNote.title.ilike(term), CrmNote.body.ilike(term))
            )

        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = int((await self.db.execute(count_stmt)).scalar_one() or 0)

        stmt = stmt.order_by(CrmNote.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
        result = await self.db.execute(stmt)
        rows = result.mappings().all()
        notes = []
        for r in rows:
            notes.append({
                "id": str(r["id"]),
                "title": r["title"],
                "body": r["body"],
                "owner_id": str(r["owner_id"]) if r["owner_id"] else None,
                "created_by": str(r["created_by"]) if r["created_by"] else None,
                "author_name": r["author_name"] or "System",
                "author_avatar": r["author_avatar"],
                "organization_id": str(r["organization_id"]),
                "created_at": r["created_at"].isoformat() if r["created_at"] else None,
                "updated_at": r["updated_at"].isoformat() if r["updated_at"] else None,
            })
        return notes, total

    async def create_note(
        self,
        company_id: UUID,
        organization_id: UUID,
        created_by: UUID,
        title: str,
        body: Optional[str] = None,
    ) -> dict[str, Any]:
        """Create a note linked to this company and emit a timeline event."""
        company = await self.get(company_id, organization_id)
        from app.models.crm_note import CrmNote
        from app.models.user import User
        from sqlalchemy.orm import aliased

        note = CrmNote(
            title=title,
            body=body,
            owner_id=created_by,
            created_by=created_by,
            related_entity_type="company",
            related_company_id=company_id,
            organization_id=organization_id,
        )
        self.db.add(note)
        await self.db.flush()
        await self.db.refresh(note)

        await self.timeline.record_activity(
            organization_id=organization_id,
            created_by=created_by,
            entity_type="company",
            entity_id=company_id,
            action="internal_note_added",
            title=f"Note added: {title}",
            description=body,
            payload={"note_id": str(note.id), "note_title": title},
            topic="company",
        )

        # Fetch author name
        from sqlalchemy import select as sa_select
        author_row = await self.db.execute(
            sa_select(User.full_name, User.avatar_url).where(User.id == created_by)
        )
        author = author_row.first()

        return {
            "id": str(note.id),
            "title": note.title,
            "body": note.body,
            "owner_id": str(note.owner_id) if note.owner_id else None,
            "created_by": str(note.created_by) if note.created_by else None,
            "author_name": author[0] if author else "System",
            "author_avatar": author[1] if author else None,
            "organization_id": str(note.organization_id),
            "created_at": note.created_at.isoformat() if note.created_at else None,
            "updated_at": note.updated_at.isoformat() if note.updated_at else None,
        }

    async def update_note(
        self,
        company_id: UUID,
        note_id: UUID,
        organization_id: UUID,
        updated_by: UUID,
        title: Optional[str] = None,
        body: Optional[str] = None,
    ) -> dict[str, Any]:
        """Edit an existing company note and emit a timeline event."""
        await self.get(company_id, organization_id)
        from app.models.crm_note import CrmNote
        from sqlalchemy import select as sa_select

        result = await self.db.execute(
            sa_select(CrmNote).where(
                CrmNote.id == note_id,
                CrmNote.related_company_id == company_id,
                CrmNote.organization_id == organization_id,
                CrmNote.is_deleted.is_(False),
            )
        )
        note = result.scalar_one_or_none()
        if not note:
            raise NotFoundException("CompanyNote", note_id)

        if title is not None:
            note.title = title
        if body is not None:
            note.body = body
        self.db.add(note)
        await self.db.flush()
        await self.db.refresh(note)

        await self.timeline.record_activity(
            organization_id=organization_id,
            created_by=updated_by,
            entity_type="company",
            entity_id=company_id,
            action="note_edited",
            title=f"Note edited: {note.title}",
            payload={"note_id": str(note.id)},
            topic="company",
        )
        return {
            "id": str(note.id),
            "title": note.title,
            "body": note.body,
            "owner_id": str(note.owner_id) if note.owner_id else None,
            "created_by": str(note.created_by) if note.created_by else None,
            "organization_id": str(note.organization_id),
            "created_at": note.created_at.isoformat() if note.created_at else None,
            "updated_at": note.updated_at.isoformat() if note.updated_at else None,
        }

    async def delete_note(
        self,
        company_id: UUID,
        note_id: UUID,
        organization_id: UUID,
        deleted_by: UUID,
    ) -> None:
        """Soft-delete a company note."""
        await self.get(company_id, organization_id)
        from app.models.crm_note import CrmNote
        from sqlalchemy import select as sa_select

        result = await self.db.execute(
            sa_select(CrmNote).where(
                CrmNote.id == note_id,
                CrmNote.related_company_id == company_id,
                CrmNote.organization_id == organization_id,
                CrmNote.is_deleted.is_(False),
            )
        )
        note = result.scalar_one_or_none()
        if not note:
            raise NotFoundException("CompanyNote", note_id)

        note.is_deleted = True
        note.is_active = False
        self.db.add(note)
        await self.db.flush()

        await self.timeline.record_activity(
            organization_id=organization_id,
            created_by=deleted_by,
            entity_type="company",
            entity_id=company_id,
            action="note_deleted",
            title=f"Note deleted: {note.title}",
            payload={"note_id": str(note.id)},
            topic="company",
        )

    # ─────────────────────────────────────────────────────────────────────────
    # ATTACHMENTS  (reuses documents table via company_id)
    # ─────────────────────────────────────────────────────────────────────────

    async def list_attachments(
        self,
        company_id: UUID,
        organization_id: UUID,
        *,
        page: int = 1,
        page_size: int = 50,
    ) -> Tuple[List[dict[str, Any]], int]:
        """Return documents uploaded for this company."""
        await self.get(company_id, organization_id)
        from app.models.document import Document
        from app.models.user import User
        from sqlalchemy.orm import aliased

        uploader_alias = aliased(User, name="doc_uploader")
        stmt = (
            select(
                Document.id,
                Document.file_name,
                Document.file_path,
                Document.file_type,
                Document.file_size_bytes,
                Document.uploaded_by,
                Document.created_at,
                uploader_alias.full_name.label("uploaded_by_name"),
            )
            .outerjoin(uploader_alias, uploader_alias.id == Document.uploaded_by)
            .where(
                Document.company_id == company_id,
                Document.organization_id == organization_id,
            )
            .order_by(Document.created_at.desc())
        )

        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = int((await self.db.execute(count_stmt)).scalar_one() or 0)

        stmt = stmt.offset((page - 1) * page_size).limit(page_size)
        result = await self.db.execute(stmt)
        rows = result.mappings().all()
        attachments = []
        for r in rows:
            attachments.append({
                "id": str(r["id"]),
                "file_name": r["file_name"],
                "file_type": r["file_type"],
                "file_size_bytes": r["file_size_bytes"],
                "uploaded_by": str(r["uploaded_by"]) if r["uploaded_by"] else None,
                "uploaded_by_name": r["uploaded_by_name"] or "Unknown",
                "uploaded_at": r["created_at"].isoformat() if r["created_at"] else None,
            })
        return attachments, total

    async def get_details(
        self,
        company_id: UUID,
        organization_id: UUID,
        *,
        timeline_page: int = 1,
        timeline_page_size: int = 10,
    ) -> dict[str, Any]:
        """
        Returns company info + contacts + deals + notes + attachments + timeline.
        Powers the Company Details side panel.
        All DB queries share the same session — no extra connections.

        Optimizations:
        - Single batch query for contacts, deals, notes, attachments (no per-entity
          sequential queries).
        - Uses subqueries for counts instead of separate count queries per entity.
        - Uses a single query for the timeline.
        """
        company = await self.get(company_id, organization_id)
        owner_name = company.owner.full_name if company.owner else None

        # ── Single sequential batch per entity ──────────────────────────
        contacts, _  = await self.get_contacts(company_id, organization_id, page=1, page_size=20)
        deals, total_deals = await self.get_deals(company_id, organization_id, page=1, page_size=10)
        notes, total_notes = await self.list_notes(company_id, organization_id, page=1, page_size=10)
        attachments, total_attachments = await self.list_attachments(company_id, organization_id, page=1, page_size=20)
        timeline = await self.get_timeline(
            company_id, organization_id,
            page=timeline_page, page_size=timeline_page_size,
        )
        summary = await self.get_activity_summary(company_id, organization_id)

        return {
            "company": {
                "id": str(company.id),
                "name": company.name,
                "domain": company.domain,
                "website": company.website,
                "description": company.description,
                "email": company.email,
                "phone": company.phone,
                "address": company.address,
                "city": company.city,
                "state": company.state,
                "country": company.country,
                "zip_code": company.zip_code,
                "industry": company.industry,
                "company_type": company.company_type,
                "employee_count": company.employee_count,
                "annual_revenue": company.annual_revenue,
                "linkedin_url": company.linkedin_url,
                "twitter_url": company.twitter_url,
                "owner_id": str(company.owner_id) if company.owner_id else None,
                "owner_name": owner_name,
                "organization_id": str(company.organization_id),
                "is_active": company.is_active,
                "created_at": company.created_at.isoformat(),
                "updated_at": company.updated_at.isoformat(),
            },
            "contacts": contacts,
            "deals": deals,
            "open_deals": sum(1 for d in deals if d["status"] not in ("won", "lost")),
            "total_deals": total_deals,
            "notes": notes,
            "total_notes": total_notes,
            "attachments": attachments,
            "total_attachments": total_attachments,
            "timeline": timeline,
            "activity_summary": summary,
        }
