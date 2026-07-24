from __future__ import annotations

from uuid import uuid4

from sqlalchemy import select

from app.models.activity import ActivityTimeline
from app.models.event_outbox import EventOutbox
from app.models.organization import Organization
from app.services.event_service import EventService
from app.services.event_worker import EventWorker


async def test_event_worker_processes_outbox_and_projects_timeline(db_session):
    suffix = uuid4().hex[:12]
    organization = Organization(name=f"Worker Org {suffix}", slug=f"worker-org-{suffix}")
    db_session.add(organization)
    await db_session.flush()

    event = await EventService(db_session).record_event(
        "LEAD_CREATED",
        organization_id=organization.id,
        aggregate_type="lead",
        aggregate_id=organization.id,
        payload={"title": "Projected lead", "description": "Projected through worker"},
        source="test",
    )
    await db_session.commit()

    worker = EventWorker(session_factory=lambda: db_session)  # type: ignore[arg-type]
    processed = await worker.run_once()

    assert processed >= 1
    refreshed = await db_session.get(EventOutbox, event.id)
    assert refreshed.processing_status == "processed"
    timeline_rows = await db_session.execute(select(ActivityTimeline).where(ActivityTimeline.payload["event_id"].as_string() == str(event.id)))
    assert timeline_rows.first() is not None
