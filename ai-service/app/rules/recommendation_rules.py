"""
recommendation_rules.py — ported exactly from ai/recommendation/rules.py.

Defines every candidate action the Recommendation Engine can suggest.
Each action specifies:
  - stages:    which pipeline stages this action is even valid for
  - weights:   how much this action cares about score (s), urgency (u),
               reply status (r), deal value (dv), email open count (eo),
               meeting attendance (mt), rep workload (rw), and contact time (ct).
  - invert_*:  flips the factor.
"""

from dataclasses import dataclass


@dataclass(frozen=True)
class ActionRule:
    name: str
    stages: list[str]
    weights: dict[str, float]
    invert_s: bool = False
    invert_u: bool = False
    invert_r: bool = False
    invert_dv: bool = False
    invert_eo: bool = False
    invert_mt: bool = False
    invert_rw: bool = False
    invert_ct: bool = False


ACTION_RULES: list[ActionRule] = [
    # ── New Lead ────────────────────────────────────────────────────────
    ActionRule(
        name="Research the prospect",
        stages=["New Lead"],
        weights={"s": 0.6, "u": 0.2, "ct": 0.1, "dv": 0.05},
    ),
    ActionRule(
        name="Send introductory email",
        stages=["New Lead"],
        weights={"s": 0.4, "u": 0.2, "dv": 0.15, "ct": 0.1},
    ),
    # ── Contacted ───────────────────────────────────────────────────────
    ActionRule(
        name="Send follow-up email",
        stages=["Contacted", "Qualified"],
        weights={"u": 0.5, "r": 0.3, "s": 0.2, "dv": 0.1, "eo": 0.1},
        invert_r=True,
    ),
    ActionRule(
        name="Make a phone call",
        stages=["Contacted", "Qualified"],
        weights={"u": 0.4, "r": 0.3, "s": 0.2, "ct": 0.1},
        invert_r=True,
    ),
    ActionRule(
        name="Try a different channel",
        stages=["Contacted"],
        weights={"u": 0.5, "eo": 0.3, "r": 0.2},
        invert_r=True,
        invert_eo=True,
    ),
    ActionRule(
        name="Mark as stale",
        stages=["Contacted", "Qualified"],
        weights={"u": 0.7, "s": 0.3, "eo": 0.05},
        invert_s=True,
    ),
    # ── Qualified ───────────────────────────────────────────────────────
    ActionRule(
        name="Schedule a product demo",
        stages=["Qualified"],
        weights={"s": 0.6, "u": 0.2, "r": 0.2, "dv": 0.15, "mt": 0.1},
        invert_u=True,
    ),
    ActionRule(
        name="Send relevant content",
        stages=["Qualified"],
        weights={"s": 0.4, "eo": 0.3, "u": 0.2, "dv": 0.1},
    ),
    # ── Proposal Sent ───────────────────────────────────────────────────
    ActionRule(
        name="Follow up on proposal",
        stages=["Proposal Sent"],
        weights={"u": 0.5, "s": 0.3, "dv": 0.15, "ct": 0.05},
    ),
    ActionRule(
        name="Send case study or testimonial",
        stages=["Proposal Sent", "Negotiation"],
        weights={"s": 0.4, "dv": 0.3, "u": 0.2},
    ),
    ActionRule(
        name="Address objections",
        stages=["Proposal Sent", "Negotiation"],
        weights={"r": 0.4, "dv": 0.3, "s": 0.2, "u": 0.1},
    ),
    # ── Negotiation ─────────────────────────────────────────────────────
    ActionRule(
        name="Finalize contract terms",
        stages=["Negotiation"],
        weights={"s": 0.5, "dv": 0.3, "u": 0.2},
    ),
    ActionRule(
        name="Escalate to manager for approval",
        stages=["Negotiation"],
        weights={"s": 0.4, "u": 0.4, "dv": 0.15, "mt": 0.1, "rw": 0.1},
    ),
    ActionRule(
        name="Offer value-add services",
        stages=["Negotiation"],
        weights={"s": 0.5, "dv": 0.3, "u": 0.2},
    ),
]


def actions_for_stage(stage: str) -> list[ActionRule]:
    """Return only the candidate actions valid for a given pipeline stage."""
    return [rule for rule in ACTION_RULES if stage in rule.stages]
