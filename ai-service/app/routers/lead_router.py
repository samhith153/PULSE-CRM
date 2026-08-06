"""Lead scoring routes."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.schemas.lead_schema import LeadAssessRequest, LeadAssessResponse, LeadScoreResponse
from app.services.lead_service import LeadService

router = APIRouter(prefix="/leads", tags=["Lead Scoring"])

_service = LeadService()


@router.post("/assess", response_model=LeadAssessResponse, status_code=200)
async def assess_lead(payload: LeadAssessRequest) -> LeadAssessResponse:
    """Compute fit, engagement, overall, and recommendation for a lead."""
    try:
        return _service.assess(payload)
    except KeyError as exc:
        raise HTTPException(status_code=422, detail=f"Missing feature field: {exc}") from exc
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post("/score", response_model=LeadScoreResponse, status_code=200)
async def score_lead_legacy(payload: LeadAssessRequest) -> LeadScoreResponse:
    """Legacy /score endpoint — delegates to assess, returns fit+engagement+overall."""
    try:
        result = _service.assess(payload)
        return LeadScoreResponse(
            lead_id=result.lead_id,
            fit=result.fit,
            engagement=result.engagement,
            overall=result.overall,
        )
    except KeyError as exc:
        raise HTTPException(status_code=422, detail=f"Missing feature field: {exc}") from exc
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=str(exc)) from exc
