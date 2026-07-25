"""
api.py

FastAPI routes for the Recommendation / Next-Best-Action module.

    GET /leads/{lead_id}/recommendation   -> single lead
    GET /leads/recommendations            -> bulk, for the pipeline dashboard view

`fetch_lead_features()` is a placeholder — swap it out for the real query
against the Leads/Deals/Activities tables (and the Lead Scoring module's
output) once the Data Engineer's feature table is available.
"""

from fastapi import APIRouter, HTTPException

from .engine import recommend
from .models import LeadFeatures, RecommendationResponse

router = APIRouter(prefix="/leads", tags=["recommendation"])


def fetch_lead_features(lead_id: str) -> LeadFeatures:
    """
    Placeholder data access function.

    TODO: replace with a real query against the `lead_features` table
    once the Data Engineer's feature pipeline is live. For now, returns
    fabricated demo data so the endpoint is runnable end-to-end.
    """
    # Fabricated demo data — remove once wired to the real feature table.
    demo_data = {
        "lead_00123": LeadFeatures(
            lead_id="lead_00123",
            current_score=62,
            current_stage="Contacted",
            days_since_last_activity=6,
            reply_received=False,
        )
    }
    if lead_id not in demo_data:
        raise HTTPException(status_code=404, detail=f"Lead '{lead_id}' not found")
    return demo_data[lead_id]


def fetch_all_lead_ids() -> list[str]:
    """Placeholder — replace with a real query for all leads owned by the rep."""
    return ["lead_00123"]


@router.get("/{lead_id}/recommendation", response_model=RecommendationResponse)
def get_recommendation(lead_id: str) -> RecommendationResponse:
    """Return the recommended next action + reason for a single lead."""
    features = fetch_lead_features(lead_id)
    try:
        return recommend(features)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.get("/recommendations", response_model=list[RecommendationResponse])
def get_bulk_recommendations() -> list[RecommendationResponse]:
    """Return recommendations for every lead a rep owns (pipeline view)."""
    responses = []
    for lead_id in fetch_all_lead_ids():
        features = fetch_lead_features(lead_id)
        try:
            responses.append(recommend(features))
        except ValueError:
            continue  # skip leads whose stage has no defined action rules
    return responses
