"""
Lead Scoring Service
Computes fit, engagement, and overall priority scores by feeding feature vector data
through the AI scoring pipeline, and persists results onto the Lead model.
"""
import sys
import os
from typing import Optional
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.lead import Lead
from app.repositories.lead_repository import LeadRepository
from app.repositories.feature_vector_repository import FeatureVectorRepository
from app.core.logging import get_logger

# Add root directory to sys.path so we can import from ai.scoring
root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../"))
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

try:
    from ai.scoring.scoring_service import score_lead
except ImportError:
    score_lead = None

logger = get_logger(__name__)


class LeadScoringService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.lead_repo = LeadRepository(db)
        self.feature_vector_repo = FeatureVectorRepository(db)

    async def compute_and_store_scores(
        self, lead_id: UUID, organization_id: UUID, created_by: Optional[UUID] = None
    ) -> Optional[Lead]:
        lead = await self.lead_repo.get_active_by_id(lead_id, organization_id)
        if not lead:
            return None

        fv = await self.feature_vector_repo.get_by_lead_id(lead_id, organization_id)
        if not fv:
            return None

        # ── Build fit_features dict ──────────────────────────────────────────
        fit_features = {
            "company_size_score": fv.company_size_score or 0,
            "industry_complexity_score": fv.industry_complexity_score or 0,
            "software_gap_score": fv.software_gap_score or 0,
            "operational_system_score": fv.operational_system_score or 0,
            "customization_potential_score": fv.customization_potential_score or 0,
            # Raw values for reason_generator
            "company_size": lead.employee_count,
            "industry": lead.industry,
            "current_crm": lead.current_crm,
            "operational_system": lead.operational_systems,
        }

        # ── Build engagement_features dict ────────────────────────────────────
        engagement_features = {
            "intent_category_score": fv.ai_intent_category_score or 0,
            "buying_stage_score": fv.buying_stage_score or 0,
            "response_time_score": fv.response_time_score or 0,
            "engagement_trend_score": fv.engagement_trend_score or 0,
            "customer_initiative_score": fv.customer_initiative_score or 0,
            "decay_penalty": fv.engagement_decay_penalty or 0,
            "days_since_last_outbound": fv.days_since_last_outbound or 0,
            # Raw values for reason_generator
            "average_response_time_hours": fv.average_response_time,
            "intent_today": None,
            "buying_stage": None,
            "intent_today_score": 0,
            "intent_7_days_ago_score": 0,
        }

        # ── Console output: INPUT ────────────────────────────────────────────
        print(f"\n{'='*60}")
        print(f"LEAD SCORING COMPUTATION FOR LEAD: {lead_id}")
        print(f"{'='*60}")
        print(f"FIT FEATURES INPUT:")
        for k, v in fit_features.items():
            print(f"  {k}: {v}")
        print(f"{'-'*60}")
        print(f"ENGAGEMENT FEATURES INPUT:")
        for k, v in engagement_features.items():
            print(f"  {k}: {v}")
        print(f"{'-'*60}")

        # ── Compute scores ───────────────────────────────────────────────────
        result = None
        if score_lead:
            try:
                result = score_lead(fit_features, engagement_features)
            except Exception as e:
                logger.error("Error computing lead scores", extra={"error": str(e)})
        else:
            logger.warning("ai.scoring.scoring_service not available")
            return lead

        # ── Console output: RESULTS ──────────────────────────────────────────
        print(f"SCORING RESULTS:")
        print(f"  fit_score: {result['fit']['score']}")
        print(f"  fit_reasons: {result['fit']['reasons']}")
        print(f"  engagement_score: {result['engagement']['score']}")
        print(f"  engagement_reasons: {result['engagement']['reasons']}")
        print(f"  overall_score: {result['overall']['score']}")
        print(f"  tier: {result['overall']['tier']}")
        print(f"  top_reasons: {result['overall']['top_reasons']}")
        print(f"{'='*60}\n")

        # ── Persist onto Lead model ──────────────────────────────────────────
        update_data = {
            "fit_score": int(round(result["fit"]["score"])),
            "engagement_score": int(round(result["engagement"]["score"])),
            "score": int(round(result["overall"]["score"])),
            "priority_tier": result["overall"]["tier"],
            "top_reasons": result["overall"]["top_reasons"],
        }
        await self.lead_repo.update(lead, **update_data)

        return await self.lead_repo.get_active_by_id(lead_id, organization_id)
