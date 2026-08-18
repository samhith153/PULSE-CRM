"""Recommendation routes."""
from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException

logger = logging.getLogger(__name__)

from app.schemas.recommendation_schema import (
    BatchRecommendationRequest,
    BatchRecommendationResponse,
    RecommendationRequest,
    RecommendationResponse,
)
from app.services.recommendation_service import recommend

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])


def _request_to_dict(payload: RecommendationRequest) -> dict:
    data = {k: v for k, v in payload.model_dump().items() if v is not None and k != "context"}
    data["contact_id"] = data.get("lead_id")
    return data


@router.post("/recommend", response_model=RecommendationResponse, status_code=200)
async def generate_recommendation(payload: RecommendationRequest) -> RecommendationResponse:
    """Generate next-best-action recommendations for a lead."""
    try:
        result = recommend(_request_to_dict(payload))
        return RecommendationResponse(**result)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post("/batch", response_model=BatchRecommendationResponse, status_code=200)
async def batch_recommendations(payload: BatchRecommendationRequest) -> BatchRecommendationResponse:
    """Generate recommendations for multiple leads at once."""
    results: dict[str, RecommendationResponse] = {}

    for lead in payload.leads:
        try:
            result = recommend(_request_to_dict(lead))
            results[lead.lead_id] = RecommendationResponse(**result)
        except Exception as exc:  # noqa: BLE001
            logger.exception(
                "recommend() failed for lead %s (stage=%s): %s",
                lead.lead_id,
                lead.buying_stage or lead.current_stage,
                exc,
            )
            results[lead.lead_id] = RecommendationResponse(
                lead_id=lead.lead_id,
                stage=lead.buying_stage or lead.current_stage or "New Lead",
            )

    return BatchRecommendationResponse(recommendations=results)
