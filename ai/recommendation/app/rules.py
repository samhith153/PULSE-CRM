"""
rules.py

Defines every candidate action the Recommendation Engine can suggest.

Each action specifies:
  - stages:    which pipeline stages this action is even valid for
  - weights:   how much this action cares about score (s), urgency (u),
               and reply status (r). Missing keys are simply not used.
  - invert_s / invert_u / invert_r:
               flips the factor. e.g. "Mark as stale" wants a LOW score
               and HIGH urgency, not the other way around.

This table IS the Phase 1 "model" — no ML required yet. Stage 3 replaces
this file's logic with a trained model, but keeps the same output shape
(see engine.py), so nothing downstream needs to change.
"""

from dataclasses import dataclass, field
from typing import Optional


@dataclass(frozen=True)
class ActionRule:
    name: str
    stages: list[str]
    weights: dict[str, float]  # keys: "s" (score), "u" (urgency), "r" (reply)
    invert_s: bool = False
    invert_u: bool = False
    invert_r: bool = False


ACTION_RULES: list[ActionRule] = [
    ActionRule(
        name="Send follow-up",
        stages=["Contacted", "Qualified"],
        weights={"u": 0.5, "r": 0.3, "s": 0.2},
        invert_r=True,  # weighs heavier when there's been NO reply
    ),
    ActionRule(
        name="Schedule demo",
        stages=["Qualified", "Demo Scheduled"],
        weights={"s": 0.6, "u": 0.2, "r": 0.2},
        invert_u=True,  # weighs heavier when the lead is still FRESH
    ),
    ActionRule(
        name="Send proposal",
        stages=["Demo Scheduled", "Negotiation"],
        weights={"s": 0.5, "r": 0.3, "u": 0.2},
        invert_u=True,
    ),
    ActionRule(
        name="Mark as stale",
        stages=["Contacted", "Qualified", "Demo Scheduled"],
        weights={"u": 0.7, "s": 0.3},
        invert_s=True,  # weighs heavier when score is LOW
    ),
    ActionRule(
        name="Escalate to manager",
        stages=["Negotiation"],
        weights={"s": 0.5, "u": 0.5},
    ),
]


def actions_for_stage(stage: str) -> list[ActionRule]:
    """Return only the candidate actions valid for a given pipeline stage."""
    return [rule for rule in ACTION_RULES if stage in rule.stages]
