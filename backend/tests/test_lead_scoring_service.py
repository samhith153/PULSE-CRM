"""Guard tests for LeadScoringService.compute_and_store_scores.

These lock the behavior introduced when the dead `except` fallback was removed
from lead_scoring_service.py:

  * the happy path delegates to run_lead_assessment, which persists the score,
    and compute_and_store_scores returns the persisted LeadScore row;
  * when run_lead_assessment returns None (AI Service unavailable), the method
    returns None cleanly instead of crashing on an undefined name.

run_lead_assessment is monkeypatched so no live AI Service is required.
"""
from __future__ import annotations

from uuid import uuid4

from app.models.lead import Lead
from app.models.lead_score import LeadScore as LeadScoreModel
from app.models.organization import Organization
from app.repositories.lead_score_repository import LeadScoreRepository
from app.services.lead_scoring_service import LeadScoringService


def _make_org(db_session, suffix: str) -> Organization:
    org = Organization(name=f"Score Org {suffix}", slug=f"score-org-{suffix}")
    db_session.add(org)
    return org


def _make_lead(db_session, org: Organization, suffix: str) -> Lead:
    lead = Lead(
        title=f"Score Lead {suffix}",
        organization_id=org.id,
        status="new",
        currency="USD",
        is_deleted=False,
    )
    db_session.add(lead)
    return lead


FAKE_ASSESSMENT = {
    "lead_id": "00000000-0000-0000-0000-000000000000",
    "fit": {"score": 80, "reasons": ["good fit"], "features": {}},
    "engagement": {"score": 60, "reasons": ["warm"], "features": {}},
    "overall": {"score": 72, "tier": "hot", "top_reasons": ["strong"]},
    "recommendation": {"action": "call", "reasons": ["now"], "score": 90},
    "versions": {"assessment_version": "1.0", "model_version": "x", "prompt_version": "x"},
}


async def test_compute_and_store_scores_returns_persisted_row(db_session, monkeypatch):
    org = _make_org(db_session, uuid4().hex[:8])
    await db_session.flush()
    lead = _make_lead(db_session, org, uuid4().hex[:8])
    await db_session.flush()

    async def fake_run(db, lead_id, organization_id, created_by=None, trigger="lead_updated"):
        # Mimic production: run_lead_assessment persists the score, returns the dict.
        await LeadScoreRepository(db).upsert_for_lead(
            lead_id, organization_id, created_by,
            {
                "fit_score": 80,
                "fit_reasons": ["good fit"],
                "engagement_score": 60,
                "engagement_reasons": ["warm"],
                "overall_score": 72,
                "priority_tier": "hot",
                "top_reasons": ["strong"],
            },
        )
        return dict(FAKE_ASSESSMENT, lead_id=str(lead_id))

    monkeypatch.setattr(
        "app.services.lead_scoring_service.run_lead_assessment", fake_run
    )

    result = await LeadScoringService(db_session).compute_and_store_scores(
        lead.id, org.id, uuid4()
    )

    assert isinstance(result, LeadScoreModel)
    assert result.lead_id == lead.id
    assert result.overall_score == 72
    assert result.priority_tier == "hot"


async def test_compute_and_store_scores_returns_none_when_pipeline_unavailable(
    db_session, monkeypatch
):
    org = _make_org(db_session, uuid4().hex[:8])
    await db_session.flush()
    lead = _make_lead(db_session, org, uuid4().hex[:8])
    await db_session.flush()

    async def fake_run_none(db, lead_id, organization_id, created_by=None, trigger="lead_updated"):
        # AI Service unreachable -> run_lead_assessment returns None (no crash).
        return None

    monkeypatch.setattr(
        "app.services.lead_scoring_service.run_lead_assessment", fake_run_none
    )

    result = await LeadScoringService(db_session).compute_and_store_scores(
        lead.id, org.id, uuid4()
    )

    assert result is None
