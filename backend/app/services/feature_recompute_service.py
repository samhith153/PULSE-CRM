"""Service that recomputes engagement feature vectors by shelling out to the
AI pipeline's export_real_features.py script.

Extracted from backend/app/main.py so it can be called both by the scheduler
(batch, all orgs) and by the inbound-email handler (single lead) without
creating a circular import between app.main and app.services.email_service.
"""
from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path

logger = None
try:
    from app.core.logging import get_logger
except Exception:  # pragma: no cover
    import logging
    logger = logging.getLogger("feature_recompute")
else:
    logger = get_logger("feature_recompute")

_PIPELINE_SCRIPT = (
    Path(__file__).resolve().parents[2]  # backend/app/services -> backend
    / ".." / "ai" / "pipeline" / "export_real_features.py"
)


def recompute_lead_features(org_id: str, lead_id: str | None = None) -> bool:
    """Run the feature-export script for one org (optionally one lead).

    Returns True on success, False on failure (logs the stderr). Failures are
    non-fatal by design — caller should never let a feature recompute break the
    surrounding operation (e.g. storing an inbound email).
    """
    script = str(_PIPELINE_SCRIPT)
    cmd = [sys.executable, script, "--org-id", str(org_id)]
    if lead_id:
        cmd += ["--lead-id", str(lead_id)]
    try:
        result = subprocess.run(cmd, capture_output=True, text=True)
    except Exception as exc:  # noqa: BLE001
        if logger:
            logger.warning("Feature recompute subprocess error: %s", exc)
        return False
    if result.returncode != 0:
        if logger:
            logger.warning(
                "Feature recompute failed for org=%s lead=%s: %s",
                org_id, lead_id, result.stderr,
            )
        return False
    if logger:
        logger.info("Feature recompute completed for org=%s lead=%s", org_id, lead_id)
    return True
