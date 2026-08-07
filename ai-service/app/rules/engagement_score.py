"""
Engagement Score Engine

Ported and updated from ai/scoring/weights.py + ai/scoring/engagement_engine.py.

Changes from original:
-  Removed response_time    — weak/noisy proxy, superseded by initiative + decay
-  Removed engagement_trend — derived metric, NOT an independent feature.
                              Feeding it back in creates a feedback loop.
                              Trend is computed separately for UI/analytics only.

Final feature set (3 weighted peers + 1 subtractive modifier):
    intent_category   — what the lead is saying         (35%)
    buying_stage      — where they are in the funnel    (40%)
    customer_initiative — who is driving the conversation (25%)
    decay_penalty     — how recently the lead engaged   (subtractive modifier, not weighted)
"""

# ============================================================
# WEIGHTS
# ============================================================

ENGAGEMENT_WEIGHTS = {
    "intent_category":    0.35,
    "buying_stage":       0.40,
    "customer_initiative": 0.25,
}

# decay_penalty is intentionally absent from ENGAGEMENT_WEIGHTS.
# It is a subtractive modifier applied after the weighted sum,
# not a peer feature with its own weight.
# Value range: 0 to -30 (see engagement_features.py — decay_penalty()).


# ============================================================
# SCORING FUNCTION
# ============================================================

def calculate_engagement_score(features: dict) -> float:
    """
    Parameters
    ----------
    features : dict
        Output of compute_engagement_features() from engagement_features.py.
        Expected keys:
            intent_score          int       (from _INTENT_SCORE_MAP, -100..100)
            buying_stage_score    int       (from _STAGE_SCORE_MAP, 0..100)
            initiative_score      float     (initiated/inbound ratio, 0..100)
            decay_penalty         int       (0 to -30, subtractive modifier)

    Returns
    -------
    float : final engagement score clamped to [0, 100]
    """

    base_score = (
        features["intent_score"]        * ENGAGEMENT_WEIGHTS["intent_category"]
        + features["buying_stage_score"] * ENGAGEMENT_WEIGHTS["buying_stage"]
        + features["initiative_score"]   * ENGAGEMENT_WEIGHTS["customer_initiative"]
    )

    # decay_penalty is negative (or 0) — directly subtracted from base.
    # NOT multiplied by a weight. This was an explicit design decision:
    # decay measures lead silence, which penalizes the score by a fixed
    # amount rather than scaling proportionally with the other features.
    final_score = base_score + features.get("decay_penalty", 0)

    return round(max(0, min(100, final_score)), 2)