"""
rules.py

Defines every candidate action the Recommendation Engine can suggest.

Each action specifies:
  - stages:    which pipeline stages this action is even valid for
  - weights:   how much this action cares about score (s), urgency (u),
               reply status (r), deal value (dv), email open count (eo),
               meeting attendance (mt), rep workload (rw), and contact time (ct).
               Missing keys are simply not used.
  - invert_s / invert_u / invert_r / invert_dv / etc.:
               flips the factor. e.g. "Mark as stale" wants a LOW score
               and HIGH urgency, not the other way around.

This table IS the Phase 1 "model" — no ML required yet. Stage 3 replaces
this file's logic with a trained model, but keeps the same output shape
(see engine.py), so nothing downstream needs to change.
"""

from dataclasses import dataclass
from typing import Optional


@dataclass(frozen=True)
class ActionRule:
    name: str
    stages: list[str]
    weights: dict[str, float]  # keys: "s" (score), "u" (urgency), "r" (reply), "dv" (deal value), "eo" (email open), "mt" (meeting), "rw" (rep workload), "ct" (contact time)
    invert_s: bool = False
    invert_u: bool = False
    invert_r: bool = False
    invert_dv: bool = False
    invert_eo: bool = False
    invert_mt: bool = False
    invert_rw: bool = False
    invert_ct: bool = False


ACTION_RULES: list[ActionRule] = [
    ActionRule(
        name="Send follow-up",
        stages=["Contacted", "Qualified"],
        weights={"u": 0.5, "r": 0.3, "s": 0.2, "dv": 0.1, "eo": 0.1, "rw": 0.05},
        invert_r=True,  # weighs heavier when there's been NO reply
    ),
    ActionRule(
        name="Schedule demo",
        stages=["Qualified", "Demo Scheduled"],
        weights={"s": 0.6, "u": 0.2, "r": 0.2, "dv": 0.15, "mt": 0.1},
        invert_u=True,  # weighs heavier when the lead is still FRESH
    ),
    ActionRule(
        name="Send proposal",
        stages=["Demo Scheduled", "Negotiation"],
        weights={"s": 0.5, "r": 0.3, "u": 0.2, "dv": 0.15, "mt": 0.15, "ct": 0.05},
        invert_u=True,
    ),
    ActionRule(
        name="Mark as stale",
        stages=["Contacted", "Qualified", "Demo Scheduled"],
        weights={"u": 0.7, "s": 0.3, "rw": 0.1, "eo": 0.05},
        invert_s=True,  # weighs heavier when score is LOW
    ),
    ActionRule(
        name="Escalate to manager",
        stages=["Negotiation"],
        weights={"s": 0.5, "u": 0.5, "dv": 0.15, "mt": 0.1, "rw": 0.1},
    ),
]


def actions_for_stage(stage: str) -> list[ActionRule]:
    """Return only the candidate actions valid for a given pipeline stage."""
    return [rule for rule in ACTION_RULES if stage in rule.stages]
