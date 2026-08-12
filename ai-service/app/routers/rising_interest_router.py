"""
Rising Interest routes — exposes the dynamic trend-based scoring engine.
"""
from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException

from app.schemas.rising_interest_schema import (
    BatchRisingInterestRequest,
    BatchRisingInterestResponse,
    RisingInterestRequest,
    RisingInterestResult,
)
from app.services.rising_interest_service import RisingInterestService

router = APIRouter(prefix="/rising-interest", tags=["Rising Interest"])
logger = logging.getLogger(__name__)

_service = RisingInterestService()


@router.post("/assess", response_model=RisingInterestResult, status_code=200)
def assess_rising_interest(payload: RisingInterestRequest) -> RisingInterestResult:
    """Compute a dynamic 0-100 rising-interest score from activity trends."""
    try:
        return _service.assess(payload)
    except Exception as exc:
        logger.exception("[RISING_INTEREST] 500 error for lead %s", payload.lead_id)
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post("/batch", response_model=BatchRisingInterestResponse, status_code=200)
def batch_rising_interest(payload: BatchRisingInterestRequest) -> BatchRisingInterestResponse:
    """Compute rising interest for multiple leads at once."""
    try:
        return _service.assess_batch(payload)
    except Exception as exc:
        logger.exception("[RISING_INTEREST] Batch 500 error")
        raise HTTPException(status_code=500, detail=str(exc)) from exc
