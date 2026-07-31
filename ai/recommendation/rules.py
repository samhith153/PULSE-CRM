"""
rules.py

Defines every candidate action the Recommendation Engine can suggest.

Each action specifies:
  - stages:      which pipeline stages this action is valid for
  - weights:     how much this action cares about each factor (must sum to 1.0)
                 Keys: s (score), u (urgency), r (reply), dv (deal value),
                       eo (email engagement), mt (meeting), rw (rep workload),
                       ct (contact time)
  - invert_*:    flips the factor (e.g. "Mark as stale" wants LOW score)

Weights are normalized per action (sum to 1.0) so every action has a fair
maximum score of 1.0.
"""

from dataclasses import dataclass


@dataclass(frozen=True)
class ActionRule:
    name: str
    stages: list[str]
    weights: dict[str, float]
    description: str = ""
    invert_s: bool = False
    invert_u: bool = False
    invert_r: bool = False
    invert_dv: bool = False
    invert_eo: bool = False
    invert_mt: bool = False
    invert_rw: bool = False
    invert_ct: bool = False


# ═══════════════════════════════════════════════════════════════════════════════
# ACTION RULES — organized by pipeline stage
#
# Weights sum to 1.0 per action for fair comparison.
# Factor keys: s, u, r, dv, eo, mt, rw, ct
# ═══════════════════════════════════════════════════════════════════════════════

ACTION_RULES: list[ActionRule] = [

    # ── NEW LEAD (just created, no contact yet) ──────────────────────────────
    ActionRule(
        name="Send introductory email",
        stages=["New Lead"],
        weights={"s": 0.35, "u": 0.30, "dv": 0.15, "eo": 0.10, "rw": 0.10},
        description="First outreach — introduce yourself and the product.",
    ),
    ActionRule(
        name="Research the prospect",
        stages=["New Lead"],
        weights={"s": 0.40, "u": 0.15, "dv": 0.25, "eo": 0.10, "rw": 0.10},
        description="Look up the prospect on LinkedIn, check their company news and tech stack.",
    ),
    ActionRule(
        name="Make a phone call",
        stages=["New Lead", "Contacted"],
        weights={"s": 0.25, "u": 0.40, "r": 0.15, "dv": 0.10, "rw": 0.10},
        description="Call directly — faster than email for initial connection.",
    ),

    # ── CONTACTED (initial contact made, waiting for response) ────────────────
    ActionRule(
        name="Send follow-up email",
        stages=["Contacted", "Qualified"],
        weights={"s": 0.20, "u": 0.35, "r": 0.25, "dv": 0.10, "eo": 0.10},
        description="Follow up on your last outreach — add value, don't just check in.",
        invert_r=True,
    ),
    ActionRule(
        name="Try a different channel",
        stages=["Contacted"],
        weights={"s": 0.20, "u": 0.30, "r": 0.25, "dv": 0.15, "eo": 0.10},
        description="Email isn't working — try LinkedIn, phone, or a mutual connection.",
        invert_r=True,
    ),
    ActionRule(
        name="Send relevant content",
        stages=["Contacted", "Qualified"],
        weights={"s": 0.30, "u": 0.20, "r": 0.20, "dv": 0.15, "eo": 0.15},
        description="Share a case study, blog post, or resource relevant to their pain point.",
    ),
    ActionRule(
        name="Schedule a discovery call",
        stages=["Contacted", "Qualified"],
        weights={"s": 0.30, "u": 0.25, "r": 0.25, "dv": 0.10, "eo": 0.10},
        description="Book a 15-minute call to qualify needs and budget.",
    ),

    # ── QUALIFIED (lead shows interest, budget confirmed) ─────────────────────
    ActionRule(
        name="Schedule a product demo",
        stages=["Qualified", "Demo Scheduled"],
        weights={"s": 0.35, "u": 0.15, "r": 0.20, "dv": 0.20, "mt": 0.10},
        description="Set up a live demo tailored to their use case.",
    ),
    ActionRule(
        name="Send pricing information",
        stages=["Qualified", "Proposal Sent"],
        weights={"s": 0.30, "u": 0.15, "r": 0.15, "dv": 0.30, "eo": 0.10},
        description="Share pricing tiers and custom enterprise quotes.",
    ),
    ActionRule(
        name="Introduce to account executive",
        stages=["Qualified"],
        weights={"s": 0.35, "u": 0.15, "r": 0.20, "dv": 0.20, "mt": 0.10},
        description="Hand off to AE for personalized deal management.",
    ),

    # ── DEMO SCHEDULED (demo is upcoming) ─────────────────────────────────────
    ActionRule(
        name="Send pre-demo agenda",
        stages=["Demo Scheduled"],
        weights={"s": 0.25, "u": 0.20, "r": 0.15, "dv": 0.15, "mt": 0.25},
        description="Send the demo agenda and ask what they want to see.",
    ),
    ActionRule(
        name="Confirm demo attendance",
        stages=["Demo Scheduled"],
        weights={"s": 0.15, "u": 0.20, "r": 0.25, "dv": 0.10, "mt": 0.30},
        description="Send a reminder 24h before — reduce no-shows.",
    ),
    ActionRule(
        name="Prepare custom demo environment",
        stages=["Demo Scheduled"],
        weights={"s": 0.35, "u": 0.10, "r": 0.10, "dv": 0.30, "mt": 0.15},
        description="Set up a sandbox with their data/use case for a personalized demo.",
    ),

    # ── PROPOSAL SENT (pricing/proposal sent) ─────────────────────────────────
    ActionRule(
        name="Follow up on proposal",
        stages=["Proposal Sent", "Negotiation"],
        weights={"s": 0.20, "u": 0.40, "r": 0.20, "dv": 0.15, "eo": 0.05},
        description="Check if they have questions about the proposal — don't let it sit.",
        invert_r=True,
    ),
    ActionRule(
        name="Address objections",
        stages=["Proposal Sent", "Negotiation"],
        weights={"s": 0.25, "u": 0.15, "r": 0.35, "dv": 0.15, "eo": 0.10},
        description="They raised concerns — tackle them directly with data and testimonials.",
    ),
    ActionRule(
        name="Send case study or testimonial",
        stages=["Proposal Sent", "Negotiation"],
        weights={"s": 0.30, "u": 0.15, "r": 0.20, "dv": 0.25, "eo": 0.10},
        description="Share proof from a similar company to build confidence.",
    ),

    # ── NEGOTIATION (actively negotiating terms) ──────────────────────────────
    ActionRule(
        name="Finalize contract terms",
        stages=["Negotiation"],
        weights={"s": 0.20, "u": 0.25, "r": 0.15, "dv": 0.30, "mt": 0.10},
        description="Lock down the final terms and get signature.",
    ),
    ActionRule(
        name="Offer value-add services",
        stages=["Negotiation"],
        weights={"s": 0.25, "u": 0.10, "r": 0.15, "dv": 0.40, "mt": 0.10},
        description="Sweeten the deal with onboarding, training, or extended support.",
    ),
    ActionRule(
        name="Escalate to manager for approval",
        stages=["Negotiation"],
        weights={"s": 0.15, "u": 0.30, "r": 0.10, "dv": 0.30, "mt": 0.10, "rw": 0.05},
        description="Need discount or custom terms — get manager sign-off.",
    ),

    # ── STALE / RE-ENGAGE (applicable to multiple mid-funnel stages) ─────────
    ActionRule(
        name="Re-engage with a breakup email",
        stages=["Contacted", "Qualified", "Demo Scheduled", "Proposal Sent"],
        weights={"s": 0.15, "u": 0.45, "r": 0.20, "dv": 0.10, "eo": 0.10},
        description="Last-resort email — 'is this still a priority?' — creates urgency.",
        invert_s=True,
        invert_r=True,
    ),
    ActionRule(
        name="Add to nurture campaign",
        stages=["Contacted", "Qualified", "Demo Scheduled"],
        weights={"s": 0.20, "u": 0.20, "r": 0.15, "dv": 0.20, "eo": 0.15, "rw": 0.10},
        description="Move to automated drip sequence — they're not ready now but may be later.",
        invert_s=True,
        invert_u=True,
    ),
]


def actions_for_stage(stage: str) -> list[ActionRule]:
    """Return only the candidate actions valid for a given pipeline stage."""
    return [rule for rule in ACTION_RULES if stage in rule.stages]
