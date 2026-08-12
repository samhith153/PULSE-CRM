"""
Rising Interest Service — orchestrates the rising interest scoring pipeline.

Receives raw trend data (from the backend over HTTP), calls the pure scoring
rule in app.rules.rising_interest_score, and returns the structured result.

This module is stateless — no database access.
"""
from __future__ import annotations

import logging
from typing import Any

from app.rules.rising_interest_score import calculate_rising_interest
from app.schemas.rising_interest_schema import (
    RisingInterestRequest,
    RisingInterestResult,
    BatchRisingInterestRequest,
    BatchRisingInterestResponse,
)

logger = logging.getLogger(__name__)


class RisingInterestService:
    """Stateless orchestrator for rising-interest scoring."""

    def assess(self, request: RisingInterestRequest) -> RisingInterestResult:
        """Compute the rising interest score for a single lead."""
        data = request.model_dump()

        result = calculate_rising_interest(data)

        logger.info(
            "[RISING_INTEREST] lead_id=%s score=%s trend=%s",
            result.get("lead_id"),
            result.get("score"),
            result.get("trend"),
        )

        return RisingInterestResult(**result)

    def assess_batch(self, request: BatchRisingInterestRequest) -> BatchRisingInterestResponse:
        """Compute rising interest for multiple leads at once."""
        results: dict[str, RisingInterestResult] = {}

        for lead in request.leads:
            try:
                data = lead.model_dump()
                result = calculate_rising_interest(data)
                results[lead.lead_id] = RisingInterestResult(**result)
            except Exception:
                logger.exception(
                    "[RISING_INTEREST] Failed for lead %s — skipping", lead.lead_id
                )
                results[lead.lead_id] = RisingInterestResult(
                    lead_id=lead.lead_id,
                    score=0.0,
                    trend="Stable",
                    factors={},
                    reasons=["Scoring failed — insufficient data."],
                )

        return BatchRisingInterestResponse(results=results)
