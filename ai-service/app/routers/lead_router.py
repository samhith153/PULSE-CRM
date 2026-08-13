"""Lead scoring routes."""
from __future__ import annotations

import json
import logging

from fastapi import APIRouter, HTTPException

from app.schemas.lead_schema import LeadAssessRequest, LeadAssessResponse, LeadScoreResponse
from app.services.lead_service import LeadService

router = APIRouter(prefix="/leads", tags=["Lead Scoring"])
logger = logging.getLogger(__name__)

_service = LeadService()


@router.post("/assess", response_model=LeadAssessResponse, status_code=200)
def assess_lead(payload: LeadAssessRequest) -> LeadAssessResponse:
    """Compute fit, engagement, overall, and recommendation for a lead."""
    try:
        logger.info("[AI-ASSESS] Incoming payload: %s", json.dumps(payload.model_dump(), default=str))
        return _service.assess(payload)
    except KeyError as exc:
        logger.exception("[AI-ASSESS] KeyError for lead %s", payload.lead_id)
        raise HTTPException(status_code=422, detail=f"Missing feature field: {exc}") from exc
    except Exception as exc:  # noqa: BLE001
        logger.exception("[AI-ASSESS] 500 error for lead %s", payload.lead_id)
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post("/score", response_model=LeadScoreResponse, status_code=200)
def score_lead_legacy(payload: LeadAssessRequest) -> LeadScoreResponse:
    """Legacy /score endpoint — delegates to assess, returns fit+engagement+overall."""
    try:
        logger.info("[AI-SCORE] Incoming payload: %s", json.dumps(payload.model_dump(), default=str))
        result = _service.assess(payload)
        return LeadScoreResponse(
            lead_id=result.lead_id,
            fit=result.fit,
            engagement=result.engagement,
            overall=result.overall,
        )
    except KeyError as exc:
        logger.exception("[AI-SCORE] KeyError for lead %s", payload.lead_id)
        raise HTTPException(status_code=422, detail=f"Missing feature field: {exc}") from exc
    except Exception as exc:  # noqa: BLE001
        logger.exception("[AI-SCORE] 500 error for lead %s", payload.lead_id)
        raise HTTPException(status_code=500, detail=str(exc)) from exc
