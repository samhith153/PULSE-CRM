"""
Feature Vector Service
Computes and persists feature vectors for leads using fit and engagement feature engineering modules.
"""
import asyncio
import sys
import os
from typing import Optional
from uuid import UUID

<<<<<<< HEAD
from sqlalchemy import select
=======
>>>>>>> origin/new-ui
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.feature_vector import FeatureVector
from app.repositories.feature_vector_repository import FeatureVectorRepository
from app.repositories.lead_repository import LeadRepository
from app.core.logging import get_logger

<<<<<<< HEAD

def _days_since_last_outbound(records: list) -> int | None:
    """Days since last outbound email (pure-Python replacement for pandas version)."""
    outbound = [r for r in records if r["direction"] == "outbound"]
    if not outbound:
        return None
    latest = max(r["sent_at"] for r in outbound if r["sent_at"])
    tz = latest.tzinfo or timezone.utc
    now = datetime.now(tz)
    return (now - latest).days


def _customer_initiative_score(records: list) -> int:
    """Score based on latest email direction (pure-Python replacement for pandas version)."""
    if not records:
        return 0
    latest = max(records, key=lambda r: r["sent_at"] or datetime.min.replace(tzinfo=timezone.utc))
    if latest["direction"] == "inbound":
        return 100
    elif latest["direction"] == "outbound":
        return 30
    return 0


# Log file for scoring results
SCORING_LOG_FILE = os.path.join(os.path.dirname(__file__), "..", "..", "scoring_log.txt")


def _write_scoring_log(lead_id, thread_id, engagement_features, scores):
    """Append scoring results to a log file."""
    try:
        lines = []
        lines.append(f"\n{'='*70}")
        lines.append(f"SCORING LOG — {datetime.now(timezone.utc).isoformat()}")
        lines.append(f"Lead ID:     {lead_id}")
        lines.append(f"Thread ID:   {thread_id}")
        lines.append(f"--- Engagement Features ---")
        for k, v in engagement_features.items():
            lines.append(f"  {k}: {v}")
        lines.append(f"--- Scores ---")
        lines.append(f"  Fit Score:         {scores.get('fit_score')}")
        lines.append(f"  Fit Reasons:")
        for r in scores.get("fit_reasons", []):
            lines.append(f"    - {r}")
        lines.append(f"  Engagement Score:  {scores.get('engagement_score')}")
        lines.append(f"  Engagement Reasons:")
        for r in scores.get("engagement_reasons", []):
            lines.append(f"    - {r}")
        lines.append(f"  Overall Score:     {scores.get('overall_score')}")
        lines.append(f"  Tier:              {scores.get('priority_tier')}")
        lines.append(f"  Top Reasons:")
        for r in scores.get("top_reasons", []):
            lines.append(f"    - {r}")
        lines.append(f"{'='*70}\n")
        with open(SCORING_LOG_FILE, "a", encoding="utf-8") as f:
            f.write("\n".join(lines))
    except Exception as e:
        logger.warning("Failed to write scoring log: %s", e)

=======
>>>>>>> origin/new-ui
# Add root directory to sys.path so we can import from ai.pipeline
root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../"))
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

try:
    from ai.pipeline.fit_features import compute_fit_features
except ImportError:
    compute_fit_features = None

logger = get_logger(__name__)


class FeatureVectorService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = FeatureVectorRepository(db)
        self.lead_repo = LeadRepository(db)

    async def compute_and_store_for_lead(
        self, lead_id: UUID, organization_id: UUID, created_by: Optional[UUID] = None
    ) -> Optional[FeatureVector]:
        lead = await self.lead_repo.get_active_by_id(lead_id, organization_id)
        if not lead:
            return None

        lead_dict = {
            "employees": lead.employee_count,
            "industry": lead.industry,
            "operational_system": lead.operational_systems or getattr(lead, "operational_system", None),
            "current_crm": lead.current_crm,
        }

<<<<<<< HEAD
        logger.debug("FEATURE VECTOR COMPUTATION FOR LEAD: %s", lead_id)
        logger.debug("INPUT VALUES: %s", lead_dict)
=======
        # Print input values to console
        print(f"\n{'='*60}")
        print(f"FEATURE VECTOR COMPUTATION FOR LEAD: {lead_id}")
        print(f"{'='*60}")
        print(f"INPUT VALUES:")
        print(f"  employees: {lead_dict['employees']}")
        print(f"  industry: {lead_dict['industry']}")
        print(f"  operational_system: {lead_dict['operational_system']}")
        print(f"  current_crm: {lead_dict['current_crm']}")
        print(f"{'-'*60}")
>>>>>>> origin/new-ui

        fit_scores = {}
        if compute_fit_features:
            try:
                fit_scores = compute_fit_features(lead_dict)
<<<<<<< HEAD
                logger.debug("COMPUTED FIT SCORES: %s", fit_scores)
=======
                # Print computed fit scores
                print(f"COMPUTED FIT SCORES:")
                for key, value in fit_scores.items():
                    print(f"  {key}: {value}")
>>>>>>> origin/new-ui
            except Exception as e:
                logger.error("Error computing fit features", extra={"error": str(e)})

        features_data = {
            "company_size_score": fit_scores.get("company_size_score"),
            "industry_complexity_score": fit_scores.get("industry_complexity_score"),
            "software_gap_score": fit_scores.get("software_gap_score"),
            "operational_system_score": fit_scores.get("operational_system_score"),
            "customization_potential_score": fit_scores.get("customization_potential_score"),
        }

<<<<<<< HEAD
        # Also populate buying_stage_score from lead status — this is available
        # without email data and significantly impacts engagement scoring.
        if buying_stage_score and lead.status:
            features_data["buying_stage_score"] = buying_stage_score(lead.status)

        logger.debug("FEATURES TO BE STORED IN DATABASE: %s", features_data)
=======
        # Print final features to be stored
        print(f"FEATURES TO BE STORED IN DATABASE:")
        for key, value in features_data.items():
            print(f"  {key}: {value}")
        print(f"{'='*60}\n")
>>>>>>> origin/new-ui

        fv = await self.repo.upsert_for_lead(
            lead_id=lead_id,
            organization_id=organization_id,
            created_by=created_by,
            features=features_data,
        )
        return fv

<<<<<<< HEAD
    async def compute_engagement_features(
        self,
        organization_id: UUID,
        thread_id: str,
        lead_id: UUID,
        created_by: Optional[UUID] = None,
    ) -> Optional[FeatureVector]:
        """Compute engagement features for a lead from email thread data.

        Uses a persistent running average for response time.
        Reads stored accumulators (avg_response_time, num_response_pairs,
        last_processed_sent_at) from the FeatureVector, processes only
        NEW inbound emails (those after last_processed_sent_at), and
        updates the running average incrementally:

            new_avg = (old_avg * old_pairs + response_hours) / (old_pairs + 1)
        """
        if response_time_score is None:
            logger.warning("Engagement feature modules not available – skipping")
            return None

        # ── Read existing accumulators ────────────────────────────────────
        existing_fv = await self.repo.get_by_lead_id(lead_id, organization_id)
        old_avg = existing_fv.average_response_time if existing_fv and existing_fv.average_response_time is not None else 0.0
        old_pairs = existing_fv.num_response_pairs if existing_fv and existing_fv.num_response_pairs is not None else 0
        cutoff = existing_fv.last_processed_sent_at if existing_fv else None

        # ── Query all emails in thread ────────────────────────────────────
        emails = await self.email_repo.list_thread_history(organization_id, thread_id)
        if not emails:
            return None

        # Build sorted email records (pure Python, no pandas)
        email_records = sorted(
            [{"direction": e.direction, "sent_at": e.sent_at} for e in emails],
            key=lambda r: r["sent_at"] or datetime.min.replace(tzinfo=timezone.utc),
        )

        # Filter to only NEW emails (after cutoff)
        if cutoff is not None:
            cutoff_ts = cutoff if isinstance(cutoff, datetime) else datetime.fromisoformat(str(cutoff))
            new_records = [r for r in email_records if r["sent_at"] and r["sent_at"] > cutoff_ts]
        else:
            new_records = email_records

        # ── Incremental running average ───────────────────────────────────
        avg_time = old_avg
        num_pairs = old_pairs
        new_pairs_found = 0

        for rec in new_records:
            if rec["direction"] == "inbound":
                inbound_ts = rec["sent_at"]
                for prev in reversed(email_records):
                    if prev["sent_at"] >= inbound_ts:
                        continue
                    if prev["direction"] == "outbound":
                        diff_hours = (inbound_ts - prev["sent_at"]).total_seconds() / 3600
                        avg_time = (avg_time * num_pairs + diff_hours) / (num_pairs + 1)
                        num_pairs += 1
                        new_pairs_found += 1
                        break

        avg_response_hours = round(avg_time, 2) if num_pairs > 0 else None

        # ── Compute other engagement features from FULL thread ────────────
        outbound_records = [r for r in email_records if r["direction"] == "outbound"]
        if outbound_records:
            latest_outbound = max(r["sent_at"] for r in outbound_records)
            tz = latest_outbound.tzinfo or timezone.utc
            now = datetime.now(tz)
            days_idle = (now - latest_outbound).days
        else:
            days_idle = None

        lead = await self.lead_repo.get_active_by_id(lead_id, organization_id)
        lead_status = lead.status if lead else None

        stmt = select(EmailSummary).where(EmailSummary.thread_id == thread_id)
        result = await self.db.execute(stmt)
        summary = result.scalar_one_or_none()
        intent_category = summary.summary_word if summary else None

        rt_score = response_time_score(avg_response_hours)
        days_val = _days_since_last_outbound(email_records) if days_since_last_outbound else days_idle
        decay = engagement_decay_penalty(days_idle) if engagement_decay_penalty else 0
        ci_score = _customer_initiative_score(email_records) if customer_initiative_score else 0
        bs_score = buying_stage_score(lead_status) if buying_stage_score else 0
        intent_score_val = ai_intent_category_score(intent_category) if ai_intent_category_score else 0
        trend = engagement_trend_score(None, None) if engagement_trend_score else 50

        # ── Determine new cutoff ──────────────────────────────────────────
        new_cutoff = max((r["sent_at"] for r in email_records if r["sent_at"]), default=None)

        features_data = {
            "average_response_time": avg_response_hours,
            "response_time_score": rt_score,
            "num_response_pairs": num_pairs,
            "last_processed_sent_at": new_cutoff,
            "days_since_last_outbound": days_idle,
            "engagement_decay_penalty": decay,
            "customer_initiative_score": ci_score,
            "buying_stage_score": bs_score,
            "ai_intent_category_score": intent_score_val,
            "engagement_trend_score": trend,
        }

        logger.debug(
            "ENGAGEMENT FEATURES FOR LEAD: %s (thread: %s) "
            "previous_avg=%sh, previous_pairs=%s, new_pairs_found=%s, "
            "avg_response_hours=%s (total pairs=%s) features=%s",
            lead_id, thread_id, old_avg, old_pairs, new_pairs_found,
            avg_response_hours, num_pairs, features_data,
        )

        fv = await self.repo.upsert_for_lead(
            lead_id=lead_id,
            organization_id=organization_id,
            created_by=created_by,
            features=features_data,
        )

        # ── Compute engagement/overall scores and persist to lead_scores ──
        try:
            from app.services.lead_scoring_service import LeadScoringService
            scoring_svc = LeadScoringService(self.db)
            lead_score = await scoring_svc.compute_and_store_scores(
                lead_id, organization_id, created_by
            )
            await self.db.commit()

            # Write scoring log (off the event loop to avoid blocking)
            if lead_score:
                scores_dict = {
                    "fit_score": lead_score.fit_score,
                    "fit_reasons": lead_score.fit_reasons or [],
                    "engagement_score": lead_score.engagement_score,
                    "engagement_reasons": lead_score.engagement_reasons or [],
                    "overall_score": lead_score.overall_score,
                    "priority_tier": lead_score.priority_tier,
                    "top_reasons": lead_score.top_reasons or [],
                }
                await asyncio.to_thread(
                    _write_scoring_log, lead_id, thread_id, features_data, scores_dict
                )
                logger.info(
                    "Scoring complete for lead %s: overall=%s tier=%s",
                    lead_id, lead_score.overall_score, lead_score.priority_tier,
                )
        except Exception as e:
            logger.error("Failed to compute scores after engagement features: %s", e)

        return fv

=======
>>>>>>> origin/new-ui
    async def get_by_lead_id(
        self, lead_id: UUID, organization_id: UUID
    ) -> Optional[FeatureVector]:
        return await self.repo.get_by_lead_id(lead_id, organization_id)
