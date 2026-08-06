"""
Feature Vector Service (audit-only)

Stores assessment features for analytics, training, auditing, and debugging.
All scoring logic lives in the ai-service; this service only persists
the feature values returned by the assessment pipeline.
"""
import asyncio
import sys
import os

from typing import Optional
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.feature_vector import FeatureVector
from app.repositories.feature_vector_repository import FeatureVectorRepository
from app.repositories.lead_repository import LeadRepository
from app.core.logging import get_logger

# Add root directory to sys.path so we can import from ai.pipeline
root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../"))
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

try:
    from ai.pipeline.fit_features import compute_fit_features
except ImportError:
    compute_fit_features = None

logger = get_logger(__name__)


class FeatureVectorService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = FeatureVectorRepository(db)
        self.lead_repo = LeadRepository(db)

    async def compute_and_store_for_lead(
        self, lead_id: UUID, organization_id: UUID, created_by: Optional[UUID] = None
    ) -> Optional[FeatureVector]:
        lead = await self.lead_repo.get_active_by_id(lead_id, organization_id)
        if not lead:
            return None

        lead_dict = {
            "employees": lead.employee_count,
            "industry": lead.industry,
            "operational_system": lead.operational_systems or getattr(lead, "operational_system", None),
            "current_crm": lead.current_crm,
        }

        # Print input values to console
        print(f"\n{'='*60}")
        print(f"FEATURE VECTOR COMPUTATION FOR LEAD: {lead_id}")
        print(f"{'='*60}")
        print(f"INPUT VALUES:")
        print(f"  employees: {lead_dict['employees']}")
        print(f"  industry: {lead_dict['industry']}")
        print(f"  operational_system: {lead_dict['operational_system']}")
        print(f"  current_crm: {lead_dict['current_crm']}")
        print(f"{'-'*60}")

        fit_scores = {}
        if compute_fit_features:
            try:
                fit_scores = compute_fit_features(lead_dict)
                # Print computed fit scores
                print(f"COMPUTED FIT SCORES:")
                for key, value in fit_scores.items():
                    print(f"  {key}: {value}")
            except Exception as e:
                logger.error("Error computing fit features", extra={"error": str(e)})

        features_data = {
            "company_size_score": fit_scores.get("company_size_score"),
            "industry_complexity_score": fit_scores.get("industry_complexity_score"),
            "software_gap_score": fit_scores.get("software_gap_score"),
            "operational_system_score": fit_scores.get("operational_system_score"),
            "customization_potential_score": fit_scores.get("customization_potential_score"),
        }

        # Print final features to be stored
        print(f"FEATURES TO BE STORED IN DATABASE:")
        for key, value in features_data.items():
            print(f"  {key}: {value}")
        print(f"{'='*60}\n")

        fv = await self.repo.upsert_for_lead(
            lead_id=lead_id,
            organization_id=organization_id,
            created_by=created_by,
            features=features_data,
        )
        return fv

    async def store_from_assessment(
        self,
        lead_id: UUID,
        organization_id: UUID,
        features: dict,
        created_by: Optional[UUID] = None,
    ) -> Optional[FeatureVector]:
        """Upsert feature vector from assessment pipeline results."""
        return await self.repo.upsert_for_lead(
            lead_id=lead_id,
            organization_id=organization_id,
            created_by=created_by,
            features=features,
        )


    async def get_by_lead_id(
        self, lead_id: UUID, organization_id: UUID
    ) -> Optional[FeatureVector]:
        return await self.repo.get_by_lead_id(lead_id, organization_id)
