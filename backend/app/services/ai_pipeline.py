"""
AI Assessment Pipeline — single orchestrator for all scoring triggers.

This module owns the end-to-end flow:
  1. Gather raw data from the database
  2. Compute email analytics (via EmailStatsService)
  3. Derive current_stage from deal pipeline stage / lead status
  4. Call ai-service POST /assess
  5. Persist results to lead_scores, ai_recommendations, feature_vectors

All four triggers (lead created/updated/status changed, inbound email,
deal stage change, daily fallback) call this same pipeline.

The AssessmentEvent model determines what gets recomputed:
  - LEAD_CREATED: Fit → Overall (no engagement yet)
  - LEAD_UPDATED: Fit → Overall (data changed)
  - INBOUND_EMAIL: Intent → Engagement → Overall → Recommendation
  - STAGE_CHANGED: Stage → Engagement → Overall → Recommendation
  - DAILY_REFRESH: Full recomputation
"""
from __future__ import annotations

import asyncio
from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import get_logger
from app.models.ai import AIRecommendation
from app.models.email_summary import EmailSummary
from app.models.lead_score import LeadScore
from app.models.feature_vector import FeatureVector
from app.models.email import Email
from app.repositories.ai_repository import AIRecommendationRepository
from app.repositories.deal_repository import DealRepository
from app.repositories.feature_vector_repository import FeatureVectorRepository
from app.repositories.lead_repository import LeadRepository
from app.repositories.lead_score_repository import LeadScoreRepository
from app.services.ai_client import AIClient
from app.services.email_analytics import EmailStatsService
from app.utils.stage_maps import PIPELINE_STAGE_MAP
from app.utils.assessment_events import AssessmentEvent, EVENT_COMPUTATION

logger = get_logger(__name__)


# ── Helpers ────────────────────────────────────────────────────────────


def _derive_current_stage(lead, deal) -> str:
    """
    Derive the buying-stage slug for engagement scoring.

    Priority:
      1. Linked deal's pipeline stage slug → PIPELINE_STAGE_MAP
      2. Fallback: lead.status (lifecycle field)
    """
    if deal is not None:
        pipeline_stage = getattr(deal, "pipeline_stage", None)
        if pipeline_stage is not None:
            slug = getattr(pipeline_stage, "slug", None)
            if slug and slug in PIPELINE_STAGE_MAP:
                return PIPELINE_STAGE_MAP[slug]

    return getattr(lead, "status", "new") or "new"


def _get_latest_intent(lead_id: UUID) -> Optional[str]:
    """Fetch the latest email summary intent/summary_word for a lead.
    Note: must be called within an active DB session (async).
    This is a sync helper — actual DB access happens in the caller's context.
    We'll pass the result into the pipeline instead.
    """
    # Placeholder — actual logic is in run_lead_assessment
    return None


async def _fetch_latest_intent(db: AsyncSession, lead_id: UUID) -> Optional[str]:
    """Get the latest email summary intent for a linked lead."""
    stmt = (
        select(EmailSummary)
        .join(Email, Email.thread_id == EmailSummary.thread_id)
        .where(
            Email.external_entity_id == lead_id,
            Email.is_active.is_(True),
        )
        .order_by(Email.sent_at.desc())
        .limit(1)
    )
    result = await db.execute(stmt)
    summary = result.scalar_one_or_none()
    if summary:
        logger.info("[FETCH_INTENT] Found summary for lead=%s: intent=%s summary_word=%s", lead_id, summary.intent, summary.summary_word)
        return summary.summary_word or summary.intent
    logger.warning("[FETCH_INTENT] No summary found for lead=%s", lead_id)
    return None


async def _fetch_lead_score(db: AsyncSession, lead_id: UUID, org_id: UUID) -> Optional[LeadScore]:
    """Get existing lead_score for decay comparison."""
    stmt = select(LeadScore).where(
        LeadScore.lead_id == lead_id,
        LeadScore.organization_id == org_id,
    )
    result = await db.execute(stmt)
    return result.scalar_one_or_none()


async def _fetch_feature_vector(db: AsyncSession, lead_id: UUID, org_id: UUID) -> Optional[FeatureVector]:
    """Get existing feature vector for decay comparison."""
    stmt = select(FeatureVector).where(
        FeatureVector.lead_id == lead_id,
        FeatureVector.organization_id == org_id,
    )
    result = await db.execute(stmt)
    return result.scalar_one_or_none()


# ── Main orchestrator ──────────────────────────────────────────────────


async def run_lead_assessment(
    db: AsyncSession,
    lead_id: UUID,
    organization_id: UUID,
    created_by: UUID,
    trigger: str = "lead_updated",
    intent: Optional[str] = None,
) -> Optional[dict]:
    """
    End-to-end lead assessment: gather data → call ai-service → persist.

    Parameters
    ----------
    db : AsyncSession
    lead_id : UUID
    organization_id : UUID
    created_by : UUID
    trigger : str
        One of: lead_created, lead_updated, inbound_email,
        deal_stage_changed, daily_refresh

    Returns
    -------
    dict | None  — the full assess response, or None if AI service unavailable.
    """
    from app.models.lead import Lead

    # Map trigger string to AssessmentEvent
    event = AssessmentEvent(trigger) if trigger in AssessmentEvent.__members__.values() else AssessmentEvent.LEAD_UPDATED
    computation = EVENT_COMPUTATION[event]

    lead_repo = LeadRepository(db)
    lead = await lead_repo.get_active_by_id(lead_id, organization_id)
    if not lead:
        return None

    # ── Fit data ────────────────────────────────────────────────────────
    raw_data: dict = {
        "lead_id": str(lead_id),
        "employees": lead.employee_count,
        "industry": lead.industry,
        "current_crm": lead.current_crm,
        "operational_system": lead.operational_systems,
    }

    # ── Current stage (buying stage) ────────────────────────────────────
    deal_repo = DealRepository(db)
    deal = await deal_repo.get_by_lead_id_in_org(lead_id, organization_id)
    current_stage = _derive_current_stage(lead, deal)
    raw_data["current_stage"] = current_stage

    # ── Deal value ──────────────────────────────────────────────────────
    deal_value = None
    if deal is not None and deal.amount is not None:
        deal_value = float(deal.amount)
    elif lead.estimated_value is not None:
        deal_value = float(lead.estimated_value)
    raw_data["deal_value"] = deal_value
    raw_data["tags"] = lead.tags if hasattr(lead, "tags") else None

    # ── Email analytics (only if engagement is needed) ──────────────────
    email_stats = None
    if computation["engagement"]:
        email_svc = EmailStatsService(db)
        email_stats = await email_svc.get_lead_email_stats(lead_id, organization_id)
        raw_data["inbound_count"] = email_stats["inbound_count"]
        raw_data["initiated_count"] = email_stats["initiated_count"]
        raw_data["outbound_email_count"] = email_stats["outbound_email_count"]
        raw_data["days_since_last_outbound"] = email_stats["days_since_last_outbound"]

        last_inbound = email_stats["last_inbound_at"]
        raw_data["last_inbound_at"] = last_inbound.isoformat() if last_inbound else None

        # ── Intent ──────────────────────────────────────────────────────
        # Use the intent passed from summarization (avoids race condition
        # with uncommitted email rows). Fall back to DB query.
        if intent:
            raw_data["intent"] = intent
        else:
            intent = await _fetch_latest_intent(db, lead_id)
            raw_data["intent"] = intent
        logger.info("[ASSESS_PIPELINE] lead=%s trigger=%s intent=%s inbound=%s initiated=%s last_inbound=%s",
            lead_id, trigger, intent, email_stats["inbound_count"], email_stats["initiated_count"], last_inbound)
    else:
        # Still include basic email stats for fit-only events
        email_svc = EmailStatsService(db)
        email_stats = await email_svc.get_lead_email_stats(lead_id, organization_id)
        raw_data["inbound_count"] = email_stats["inbound_count"]
        raw_data["initiated_count"] = email_stats["initiated_count"]

    # ── Call ai-service ─────────────────────────────────────────────────
    ai_client = AIClient()
    try:
        result = await ai_client.assess_lead(str(lead_id), raw_data)
    finally:
        await ai_client.close()

    if not result:
        logger.warning("[ASSESS_PIPELINE] AI service returned None for lead %s — no scores persisted", lead_id)
        return None

    logger.info("[ASSESS_PIPELINE] AI service responded for lead=%s: fit=%s engagement=%s overall=%s tier=%s",
        lead_id,
        result.get("fit", {}).get("score"),
        result.get("engagement", {}).get("score"),
        result.get("overall", {}).get("score"),
        result.get("overall", {}).get("tier"),
    )

    # ── Persist lead_scores ─────────────────────────────────────────────
    scores_data = {
        "fit_score": int(round(result["fit"]["score"])),
        "fit_reasons": result["fit"]["reasons"],
        "engagement_score": int(round(result["engagement"]["score"])),
        "engagement_reasons": result["engagement"]["reasons"],
        "overall_score": int(round(result["overall"]["score"])),
        "priority_tier": result["overall"]["tier"],
        "top_reasons": result["overall"]["top_reasons"],
    }
    score_repo = LeadScoreRepository(db)
    ls = await score_repo.upsert_for_lead(
        lead_id, organization_id, created_by, scores_data
    )

    # ── Persist ai_recommendation ───────────────────────────────────────
    rec = result.get("recommendation", {})
    if rec and rec.get("action"):
        rec_repo = AIRecommendationRepository(db)
        priority = "medium"
        if (rec.get("score") or 0) > 80:
            priority = "high"
        elif (rec.get("score") or 0) < 40:
            priority = "low"

        await rec_repo.upsert_for_lead(
            lead_id,
            organization_id,
            created_by,
            recommendation=rec["action"],
            reasoning="; ".join(rec.get("reasons", [])),
            priority=priority,
            metadata_json={
                "score": rec.get("engagement_score"),
                "stage": rec.get("stage"),
                "recommendations": rec.get("all_recommendations", []),
                "deal_value": deal_value,
                "trigger": trigger,
            },
        )

    # ── Persist feature_vectors (audit only) ────────────────────────────
    fv_repo = FeatureVectorRepository(db)
    fv_features = {
        # Fit scores
        "company_size_score": result["fit"]["features"].get("company_size_score"),
        "industry_complexity_score": result["fit"]["features"].get("industry_complexity_score"),
        "software_gap_score": result["fit"]["features"].get("software_gap_score"),
        "operational_system_score": result["fit"]["features"].get("operational_system_score"),
        "customization_potential_score": result["fit"]["features"].get("customization_potential_score"),
        # Engagement scores (audit)
        "buying_stage_score": result["engagement"]["features"].get("buying_stage_score"),
        "ai_intent_category_score": result["engagement"]["features"].get("intent_score"),
        "customer_initiative_score": result["engagement"]["features"].get("initiative_score"),
        "engagement_decay_penalty": result["engagement"]["features"].get("decay_penalty"),
        # Email stats (audit)
        "inbound_count": email_stats["inbound_count"],
        "initiated_count": email_stats["initiated_count"],
        "last_inbound_at": email_stats.get("last_inbound_at"),
        "days_since_last_inbound": result["engagement"]["features"].get("days_since_last_inbound"),
        "intent": intent,
        # Audit metadata
        "assessment_trigger": trigger,
        "assessment_version": result.get("versions", {}).get("assessment_version"),
        "model_version": result.get("versions", {}).get("model_version"),
        "prompt_version": result.get("versions", {}).get("prompt_version"),
    }
    await fv_repo.upsert_for_lead(lead_id, organization_id, created_by, fv_features)

    return result
