"""
Stage mapping constants (single source of truth).

PIPELINE_STAGE_MAP maps deal pipeline stage slugs to buying-stage slugs
used by the Engagement Engine for the Buying Stage Score.

BUYING_STAGES lists all valid buying-stage slugs and their numeric scores
so the backend and ai-service stay in sync.
"""

# ── Deal slug → buying-stage slug ──────────────────────────────────────
PIPELINE_STAGE_MAP: dict[str, str] = {
    "new": "new",
    "contacted": "contacted",
    "qualified": "qualified",
    "proposal": "proposal_sent",
    "proposal_sent": "proposal_sent",
    "negotiation": "negotiation",
    "won": "won",
    "lost": "lost",
}

# ── Valid buying-stage slugs and their Engagement-Engine scores ────────
BUYING_STAGE_SCORES: dict[str, int] = {
    "new": 10,
    "contacted": 25,
    "qualified": 45,
    "proposal_sent": 80,
    "negotiation": 90,
    "won": 100,
    "lost": 0,
    "converted": 50,
}

# ── Buying-stage slug → recommendation-engine stage title ──────────────
BUYING_STAGE_TO_ENGINE_TITLE: dict[str, str] = {
    "new": "New Lead",
    "contacted": "Contacted",
    "qualified": "Qualified",
    "proposal_sent": "Proposal Sent",
    "negotiation": "Negotiation",
    "won": "Closed Won",
    "lost": "Closed Lost",
    "converted": "Closed Won",
}

TERMINAL_BUYING_STAGES = {"won", "lost", "converted"}
