"""Lead service: orchestrates the lead scoring + recommendation workflow."""
from __future__ import annotations

from app.schemas.lead_schema import (
    FitResult, EngagementResult, OverallResult, FitFeatures, EngagementFeatures,
    RecommendationSummary, VersionInfo, LeadAssessRequest, LeadAssessResponse,
    ASSESSMENT_VERSION, MODEL_VERSION, PROMPT_VERSION,
)
from app.services.scoring_service import score_lead
from app.services.recommendation_service import recommend


class LeadService:
    """Stateless orchestrator for lead scoring + recommendation."""

    def assess(self, request: LeadAssessRequest) -> LeadAssessResponse:
        """Compute fit, engagement, overall, and recommendation for a lead."""
        # Resolve inbound_count alias
        inbound_count = request.inbound_count or request.inbound_email_count or 0

        raw = {
            "lead_id": request.lead_id,
            "employees": request.employees or request.company_size,
            "industry": request.industry,
            "current_crm": request.current_crm,
            "operational_system": request.operational_system,
            "customizations": request.customizations,
            # Engagement inputs
            "intent": request.intent or request.intent_today,
            "current_stage": request.current_stage or request.buying_stage,
            "inbound_count": inbound_count,
            "initiated_count": request.initiated_count or 0,
            "last_inbound_at": request.last_inbound_at,
            "days_since_last_outbound": request.days_since_last_outbound,
            "is_outbound": request.is_outbound,
            # Recommendation inputs
            "deal_value": request.deal_value,
            "tags": request.tags,
            "contact_id": request.lead_id,
        }

        # ── Scoring ────────────────────────────────────────────────────
        result = score_lead(raw)

        # ── Recommendation ─────────────────────────────────────────────
        rec_raw = {
            **raw,
            "score": result["engagement_score"],
            "engagement_score": result["engagement_score"],
            "last_contact_time": request.last_inbound_at,
            "is_outbound": request.is_outbound or False,
        }
        rec_result = recommend(rec_raw)

        rec_summary = RecommendationSummary()
        recs = rec_result.get("recommendations", [])
        if recs:
            top = recs[0]
            rec_summary = RecommendationSummary(
                status="recommendation",
                action=top.get("action"),
                score=top.get("score"),
                reasons=top.get("reasons", []),
                all_recommendations=recs,
                lead_id=rec_result.get("lead_id"),
                stage=rec_result.get("stage"),
                engagement_score=rec_result.get("engagement_score"),
                contact_time=rec_result.get("contact_time"),
                deal_value=rec_result.get("deal_value"),
            )

        # ── Build response ─────────────────────────────────────────────
        fit = result["features"]["fit"]
        eng = result["features"]["engagement"]

        return LeadAssessResponse(
            lead_id=result["lead_id"],
            fit=FitResult(
                score=result["fit_score"],
                reasons=result["fit_reasons"],
                features=FitFeatures(**fit),
            ),
            engagement=EngagementResult(
                score=result["engagement_score"],
                reasons=result["engagement_reasons"],
                features=EngagementFeatures(**eng),
            ),
            overall=OverallResult(
                score=result["score"],
                tier=result["tier"],
                raw_score=result["score"],
                top_reasons=result["reasons"][:5],
            ),
            recommendation=rec_summary,
            versions=VersionInfo(
                assessment_version=ASSESSMENT_VERSION,
                model_version=MODEL_VERSION,
                prompt_version=PROMPT_VERSION,
            ),
        )

    def score(self, request: LeadAssessRequest) -> LeadAssessResponse:
        """Legacy /score endpoint — delegates to assess()."""
        return self.assess(request)
