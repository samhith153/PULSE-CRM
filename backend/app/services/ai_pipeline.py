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

from app.core.config import settings
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
from app.services.workflow_service import WorkflowService
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
    lead_overrides: Optional[dict] = None,
    stage_override: Optional[str] = None,
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
    lead_overrides : dict, optional
        Fresh field values from the just-applied update. When provided,
        these are used instead of re-reading from DB (avoids stale reads
        caused by the request session not yet committing).

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

    # ── Fit data ────────────────────────────────────────────────
    # Use overrides when available (fresh data from the update call)
    # to avoid the race condition where the PUT session hasn't committed yet.
    if lead_overrides:
        raw_data: dict = {
            "lead_id": str(lead_id),
            "employees": lead_overrides.get("employee_count") or lead.employee_count,
            "industry": lead_overrides.get("industry") or lead.industry,
            "current_crm": lead_overrides.get("current_crm") or lead.current_crm,
            "operational_system": lead_overrides.get("operational_systems") or lead.operational_systems,
        }
    else:
        raw_data = {
            "lead_id": str(lead_id),
            "employees": lead.employee_count,
            "industry": lead.industry,
            "current_crm": lead.current_crm,
            "operational_system": lead.operational_systems,
        }

    # ── Current stage (buying stage) ────────────────────────────────
    deal_repo = DealRepository(db)
    deal = await deal_repo.get_by_lead_id_in_org(lead_id, organization_id)
    current_stage = _derive_current_stage(lead, deal)
    if stage_override:
        from app.utils.stage_maps import PIPELINE_STAGE_MAP
        current_stage = PIPELINE_STAGE_MAP.get(stage_override.lower(), stage_override.lower())
        logger.info("[ASSESS_PIPELINE] Stage overridden to '%s' for lead=%s", current_stage, lead_id)
    raw_data["current_stage"] = current_stage

    # ── Deal value ──────────────────────────────────────────────
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
        if intent:
            raw_data["intent"] = intent
        else:
            intent = await _fetch_latest_intent(db, lead_id)
            raw_data["intent"] = intent

        # ── Email summaries (sentiment, key points, follow-up) ──────────
        summary_stmt = (
            select(EmailSummary)
            .join(Email, Email.thread_id == EmailSummary.thread_id)
            .where(
                Email.external_entity_id == lead_id,
                Email.organization_id == organization_id,
                Email.is_active.is_(True),
            )
            .order_by(Email.sent_at.desc())
            .limit(5)
        )
        summary_result = await db.execute(summary_stmt)
        recent_summaries = list(summary_result.scalars().all())

        if recent_summaries:
            latest = recent_summaries[0]
            raw_data["email_sentiment"] = latest.sentiment
            raw_data["email_intent"] = latest.intent
            raw_data["email_key_points"] = latest.key_points or []
            raw_data["email_action_items"] = latest.action_items or []
            raw_data["email_follow_up_suggestion"] = latest.follow_up_suggestion
            raw_data["email_follow_up_timing"] = latest.follow_up_timing
            raw_data["email_summaries"] = [
                {
                    "sentiment": s.sentiment,
                    "intent": s.intent,
                    "key_points": s.key_points or [],
                    "action_items": s.action_items or [],
                    "follow_up_suggestion": s.follow_up_suggestion,
                    "follow_up_timing": s.follow_up_timing,
                    "summary": s.summary,
                }
                for s in recent_summaries
            ]

        # ── Latest email subject and preview ────────────────────────────
        latest_email_stmt = (
            select(Email)
            .where(
                Email.external_entity_id == lead_id,
                Email.organization_id == organization_id,
                Email.is_active.is_(True),
            )
            .order_by(Email.sent_at.desc())
            .limit(1)
        )
        latest_email_result = await db.execute(latest_email_stmt)
        latest_email = latest_email_result.scalar_one_or_none()
        if latest_email:
            raw_data["latest_email_subject"] = latest_email.subject
            raw_data["latest_email_preview"] = (latest_email.body_preview or "")[:200]

        logger.info("[ASSESS_PIPELINE] lead=%s trigger=%s intent=%s sentiment=%s inbound=%s initiated=%s last_inbound=%s",
            lead_id, trigger, intent, raw_data.get("email_sentiment"), email_stats["inbound_count"], email_stats["initiated_count"], last_inbound)
    else:
        # Still include basic email stats for fit-only events
        email_svc = EmailStatsService(db)
        email_stats = await email_svc.get_lead_email_stats(lead_id, organization_id)
        raw_data["inbound_count"] = email_stats["inbound_count"]
        raw_data["initiated_count"] = email_stats["initiated_count"]

    # ── Call ai-service ─────────────────────────────────────────────────
    logger.info("[ASSESS_PIPELINE] Sending payload to AI service for lead=%s trigger=%s raw_data=%s", lead_id, trigger, raw_data)
    ai_client = AIClient()
    try:
        result = await ai_client.assess_lead(str(lead_id), raw_data)
        logger.info("[ASSESS_PIPELINE] AI service returned type=%s is_none=%s", type(result).__name__, result is None)
    except Exception:
        logger.exception("[ASSESS_PIPELINE] Exception calling AI service for lead=%s", lead_id)
        result = None
    finally:
        await ai_client.close()

    if not result:
        logger.warning(
            "[ASSESS_PIPELINE] AI service UNAVAILABLE for lead %s — "
            "falling back to local rule-based scoring. "
            "Check AI_SERVICE_URL and verify %s is running.",
            lead_id, settings.AI_SERVICE_URL,
        )
        # Local fallback: use RuleBasedScorer when AI microservice is unreachable
        try:
            from app.services.ai_providers import RuleBasedScorer, FeatureExtractionService, FeatureSet
            from app.models.lead import Lead as _Lead
            from app.models.email import Email as _Email

            local_scorer = RuleBasedScorer()
            local_features = FeatureExtractionService()

            # Fetch emails for feature extraction
            email_svc = EmailStatsService(db)
            email_stats_local = await email_svc.get_lead_email_stats(lead_id, organization_id)

            # Build a minimal FeatureSet from lead fields
            feature_values = {
                "status": lead.status,
                "source": lead.source,
                "estimated_value": float(lead.estimated_value or 0),
                "deal_value": deal_value or 0,
                "has_company": bool(lead.company_id),
                "has_contact": bool(lead.contact_id),
                "has_owner": bool(lead.owner_id),
                "industry": lead.industry,
                "current_crm": lead.current_crm,
                "operational_system": lead.operational_systems,
                "current_stage": current_stage,
                "email_count": email_stats_local["inbound_count"] + email_stats_local["initiated_count"],
                "read_email_count": 0,
                "email_open_count": 0,
                "email_opened_no_reply_flag": False,
            }
            feature_set = FeatureSet(entity_type="lead", values=feature_values)
            score_result = local_scorer.score_lead(lead, feature_set)

            overall_score = score_result.score
            # Tier logic (mirrors ai-service/app/rules/tier_rules.py)
            if overall_score >= 90:
                tier = "Critical"
            elif overall_score >= 70:
                tier = "High"
            elif overall_score >= 40:
                tier = "Medium"
            else:
                tier = "Low"
            final_score = max(0, min(100, overall_score))

            result = {
                "fit": {"score": overall_score, "reasons": score_result.factors},
                "engagement": {"score": overall_score, "reasons": ["Engagement computed locally (AI service unavailable)"]},
                "overall": {"score": final_score, "tier": tier, "top_reasons": score_result.factors[:3]},
            }
            logger.info("[ASSESS_PIPELINE] Local fallback scoring: lead=%s score=%s tier=%s", lead_id, final_score, tier)
        except Exception:
            logger.exception("[ASSESS_PIPELINE] Local fallback scoring also failed for lead=%s", lead_id)
            return None

    logger.info("[ASSESS_PIPELINE] AI service responded for lead=%s: fit=%s engagement=%s overall=%s tier=%s",
        lead_id,
        result.get("fit", {}).get("score"),
        result.get("engagement", {}).get("score"),
        result.get("overall", {}).get("score"),
        result.get("overall", {}).get("tier"),
    )

    # ── Persist lead_scores ─────────────────────────────────────
    scores_data = {
        "fit_score": int(round(result["fit"]["score"])),
        "fit_reasons": result["fit"]["reasons"],
        "engagement_score": int(round(result["engagement"]["score"])),
        "engagement_reasons": result["engagement"]["reasons"],
        "overall_score": int(round(result["overall"]["score"])),
        "priority_tier": result["overall"]["tier"],
        "top_reasons": result["overall"]["top_reasons"],
    }
    logger.info("[ASSESS_PIPELINE] Persisting scores for lead=%s: %s", lead_id, scores_data)
    score_repo = LeadScoreRepository(db)
    ls = await score_repo.upsert_for_lead(
        lead_id, organization_id, created_by, scores_data
    )
    logger.info("[ASSESS_PIPELINE] Lead scores upserted: id=%s", ls.id if ls else "None")

    # ── Publish LEAD_SCORE_UPDATED SSE event ────────────────────
    try:
        from app.services.event_bus import event_bus as _sse_bus, EventEnvelope as _EE
        from uuid import uuid4 as _uuid4
        from datetime import datetime as _dt
        await _sse_bus.publish(_EE(
            event_id=_uuid4(),
            organization_id=organization_id,
            aggregate_type="lead",
            aggregate_id=lead_id,
            event_type="LEAD_SCORE_UPDATED",
            topic="leads",
            title="Lead Score Updated",
            description=f"Score recomputed for lead {lead_id}",
            payload={
                "lead_id": str(lead_id),
                "overall_score": scores_data["overall_score"],
                "fit_score": scores_data["fit_score"],
                "engagement_score": scores_data["engagement_score"],
            },
            source="ai_pipeline",
            status="processed",
            created_at=_dt.utcnow(),
            actor_id=created_by,
        ))
    except Exception:
        logger.debug("[ASSESS_PIPELINE] Failed to publish LEAD_SCORE_UPDATED SSE event", exc_info=True)

    # ── Persist ai_recommendation ───────────────────────────────
    rec = result.get("recommendation", {})
    logger.info("[ASSESS_PIPELINE] Recommendation: action=%s score=%s", rec.get("action"), rec.get("score"))
    if rec and rec.get("action"):
        rec_repo = AIRecommendationRepository(db)

        priority = "medium"
        if (rec.get("score") or 0) > 80:
            priority = "high"
        elif (rec.get("score") or 0) < 40:
            priority = "low"

        recommendation = await rec_repo.upsert_for_lead(
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
        logger.info("[ASSESS_PIPELINE] Recommendation persisted for lead=%s", lead_id)

        # AI recommendation is the source of truth for the workflow.
        workflow_service = WorkflowService(db)

        await workflow_service.sync_from_recommendation(
            recommendation=recommendation,
            lead_id=lead_id,
            organization_id=organization_id,
            created_by=created_by,
        )
    # ── Persist feature_vectors (audit only) ────────────────────────
    fv_repo = FeatureVectorRepository(db)
    fit_features = result.get("fit", {}).get("features", {})
    eng_features = result.get("engagement", {}).get("features", {})
    fv_features = {
        # Fit scores
        "company_size_score": fit_features.get("company_size_score"),
        "industry_complexity_score": fit_features.get("industry_complexity_score"),
        "software_gap_score": fit_features.get("software_gap_score"),
        "operational_system_score": fit_features.get("operational_system_score"),
        "customization_potential_score": fit_features.get("customization_potential_score"),
        # Engagement scores (audit)
        "buying_stage_score": eng_features.get("buying_stage_score"),
        "ai_intent_category_score": eng_features.get("intent_score"),
        "customer_initiative_score": eng_features.get("initiative_score"),
        "engagement_decay_penalty": eng_features.get("decay_penalty"),
        # Email stats (audit)
        "inbound_count": email_stats["inbound_count"],
        "initiated_count": email_stats["initiated_count"],
        "last_inbound_at": email_stats.get("last_inbound_at"),
        "days_since_last_inbound": eng_features.get("days_since_last_inbound"),
        "intent": intent,
        # Audit metadata
        "assessment_trigger": trigger,
        "assessment_version": result.get("versions", {}).get("assessment_version"),
        "model_version": result.get("versions", {}).get("model_version"),
        "prompt_version": result.get("versions", {}).get("prompt_version"),
    }
    logger.info("[ASSESS_PIPELINE] Persisting feature vector for lead=%s: %s", lead_id, fv_features)
    fv = await fv_repo.upsert_for_lead(lead_id, organization_id, created_by, fv_features)
    logger.info("[ASSESS_PIPELINE] Feature vector upserted: id=%s updated_at=%s", fv.id if fv else "None", fv.updated_at if fv else "None")

    return result
