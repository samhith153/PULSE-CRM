"""
backend/services/recommendation_service.py

Service layer for recommendations.
Fetches lead data from database and calls the AI recommendation engine.

This is the bridge between the backend API and the AI/scoring module.
"""

from backend.repositories.lead_repository import LeadRepository
from backend.repositories.feature_vector_repository import FeatureVectorRepository
from ai.scoring.engine import generate_recommendation
import logging
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


class RecommendationService:
    """
    Generates next-best-action recommendations for leads.
    
    Fetches lead data from database, calls AI engine, returns recommendation.
    """
    
    def __init__(
        self,
        lead_repo: LeadRepository,
        feature_repo: FeatureVectorRepository
    ):
        self.lead_repo = lead_repo
        self.feature_repo = feature_repo
    
    async def get_recommendation(self, lead_id: str) -> dict:
        """
        Generate recommendation for a lead
        
        STEP 1: Fetch lead data from database
        STEP 2: Prepare data for recommendation engine
        STEP 3: Call AI engine's generate_recommendation()
        STEP 4: Return recommendation to caller
        
        Returns:
        {
            "lead_id": "lead_123",
            "recommended_action": "Schedule demo",
            "reason": "Lead score is 75/100...",
            "current_score": 75,
            "current_stage": "Qualified",
            "all_candidates": [...]
        }
        """
        
        try:
            # STEP 1: Fetch lead from database
            lead = await self.lead_repo.get_by_id(lead_id)
            if not lead:
                logger.warning(f"Lead {lead_id} not found")
                raise ValueError(f"Lead {lead_id} not found")
            
            # STEP 2: Fetch feature vector (contains fit + engagement scores)
            feature_vector = await self.feature_repo.get_by_lead_id(lead_id)
            
            # STEP 3: Get engagement history for "days_since_last_activity"
            # (This would come from email timestamps or activity log)
            days_since_last = self._calculate_days_since_last_activity(lead_id)
            
            # STEP 4: Prepare comprehensive lead data for recommendation engine
            lead_dict = {
                # Required fields
                "lead_id": lead_id,
                "current_score": lead.lead_score,
                "current_stage": lead.pipeline_stage or "New Lead",
                "days_since_last_activity": days_since_last,
                "reply_received": self._has_reply(lead_id),
                
                # Optional fields (can be None)
                "deal_value": lead.deal_value,
                "email_open_count": self._count_email_opens(lead_id),
                "email_opened_no_reply_flag": self._check_opened_no_reply(lead_id),
                "meeting_attendance_status": lead.meeting_attendance_status,
                "rep_active_action_count": self._count_rep_actions(lead_id),
                "best_contact_time_slot": lead.best_contact_time,
            }
            
            logger.info(f"Prepared lead data for recommendation: {lead_id}")
            
            # STEP 5: Call the AI recommendation engine
            recommendation = generate_recommendation(lead_dict)
            
            if "error" in recommendation:
                logger.error(f"Recommendation generation failed: {recommendation['error']}")
                raise ValueError(recommendation["error"])
            
            logger.info(
                f"✓ Recommendation generated for {lead_id}: {recommendation['recommended_action']}"
            )
            
            return recommendation
            
        except Exception as e:
            logger.error(f"Error generating recommendation for {lead_id}: {e}")
            raise
    
    def _calculate_days_since_last_activity(self, lead_id: str) -> int:
        """
        Calculate days since last activity (email, call, etc.)
        
        This should query your activity/email log table.
        For now, returning a placeholder.
        """
        # TODO: Query email_activities or activity_log table
        # Get most recent sent_at timestamp
        # Return days between now and that timestamp
        return 5  # Placeholder
    
    def _has_reply(self, lead_id: str) -> bool:
        """Check if customer replied to last email"""
        # TODO: Query emails table
        # Get last outbound email (direction="outbound")
        # Check if there's an inbound email (direction="inbound") after it
        return False  # Placeholder
    
    def _count_email_opens(self, lead_id: str) -> int:
        """Count how many emails this lead opened"""
        # TODO: Query email_tracking table or email_opens field
        return 0  # Placeholder
    
    def _check_opened_no_reply(self, lead_id: str) -> bool:
        """Check if latest email was opened but no reply sent"""
        # TODO: Query email tracking
        return False  # Placeholder
    
    def _count_rep_actions(self, lead_id: str) -> int:
        """Count how many active actions the assigned rep has"""
        # TODO: Query tasks/actions table for this rep
        return 5  # Placeholder


# ═══════════════════════════════════════════════════════════════════
# HOW TO USE THIS IN YOUR BACKEND
# ═══════════════════════════════════════════════════════════════════
#
# Option 1: From API Route
# ─────────────────────────
#
# In backend/api/v1/leads.py:
#
# from backend.services.recommendation_service import RecommendationService
# from backend.api.deps import get_recommendation_service
#
# @router.get("/{lead_id}/recommendation")
# async def get_lead_recommendation(
#     lead_id: str,
#     recommendation_service: RecommendationService = Depends(get_recommendation_service)
# ):
#     """Get next-best-action recommendation for a lead"""
#     recommendation = await recommendation_service.get_recommendation(lead_id)
#     return recommendation
#
# Then visit: http://localhost:8000/api/v1/leads/lead_123/recommendation
#
# ─────────────────────────────────────────────────────────────────────
#
# Option 2: From Lead Service (Automatic)
# ─────────────────────────────────────────
#
# In backend/services/lead_service.py:
#
# class LeadService:
#     def __init__(self, ..., recommendation_service):
#         self.recommendation_service = recommendation_service
#     
#     async def get_lead_with_recommendation(self, lead_id: str):
#         lead = await self.lead_repo.get_by_id(lead_id)
#         recommendation = await self.recommendation_service.get_recommendation(lead_id)
#         
#         return {
#             "lead": lead,
#             "recommendation": recommendation
#         }
#
# ─────────────────────────────────────────────────────────────────────
#
# Option 3: Add to Dependency Injection
# ───────────────────────────────────────
#
# In backend/api/deps.py:
#
# def get_recommendation_service(
#     lead_repo: LeadRepository = Depends(get_lead_repository),
#     feature_repo: FeatureVectorRepository = Depends(get_feature_vector_repository)
# ) -> RecommendationService:
#     return RecommendationService(lead_repo, feature_repo)
#
# ═══════════════════════════════════════════════════════════════════
