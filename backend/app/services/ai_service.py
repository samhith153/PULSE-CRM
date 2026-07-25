"""AI service backed by provider interfaces and CRM data."""
from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID, uuid4

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import NotFoundException, ServiceUnavailableException
from app.models.email import Email
from app.repositories.ai_repository import AIConversationSummaryRepository, AIRecommendationRepository, AIScoreRepository
from app.repositories.deal_repository import DealRepository
from app.repositories.email_repository import EmailRepository
from app.repositories.lead_repository import LeadRepository
from app.schemas.ai import (
    AIConversationSummaryResponse,
    AIEmailSummaryResponse,
    AIJobResponse,
    AILeadScoreResponse,
    AINextBestActionResponse,
    AIRecommendationResponse,
    DealInsightResponse,
    SummaryResponse,
)
from app.services.ai_providers import (
    FeatureExtractionService,
    FeatureSet,
    get_recommendation_provider,
    get_scoring_provider,
    get_summary_provider,
)


class AIService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.deal_repo = DealRepository(db)
        self.lead_repo = LeadRepository(db)
        self.email_repo = EmailRepository(db)
        self.score_repo = AIScoreRepository(db)
        self.recommendation_repo = AIRecommendationRepository(db)
        self.summary_repo = AIConversationSummaryRepository(db)
        self.feature_service = FeatureExtractionService()
        self.scorer = get_scoring_provider()
        self.recommender = get_recommendation_provider()
        self.summarizer = get_summary_provider()

    def _ensure_enabled(self) -> None:
        if not settings.ENABLE_AI:
            raise ServiceUnavailableException("AI")

    async def create_job(self, organization_id: UUID, job_type: str, entity_type: str, entity_id: UUID | None = None) -> AIJobResponse:
        self._ensure_enabled()
        return AIJobResponse(
            job_id=uuid4(),
            job_type=job_type,
            entity_type=entity_type,
            entity_id=entity_id,
            status="queued",
            generated_at=datetime.now(timezone.utc),
        )

    async def _entity_emails(self, organization_id: UUID, entity_type: str, entity_id: UUID) -> list[Email]:
        emails, _ = await self.email_repo.list_entity_history(
            organization_id,
            entity_type,
            entity_id,
            search=None,
            page=1,
            page_size=50,
        )
        return emails

    async def lead_score(self, organization_id: UUID, lead_id: UUID) -> AILeadScoreResponse:
        self._ensure_enabled()
        lead = await self.lead_repo.get_active_by_id(lead_id, organization_id)
        if not lead:
            raise NotFoundException("Lead", lead_id)
        emails = await self._entity_emails(organization_id, "lead", lead_id)
        features = self.feature_service.lead_features(lead, emails)
        result = self.scorer.score_lead(lead, features)
        previous = await self.score_repo.latest_for_lead(organization_id, lead_id)
        await self.score_repo.create(
            organization_id=organization_id,
            lead_id=lead_id,
            entity_type="lead",
            score=result.score,
            confidence=result.confidence,
            provider=settings.SCORING_PROVIDER,
            model_name=settings.MODEL_NAME,
            explanation=result.factors,
            metadata_json=result.metadata,
            regenerated_from_id=previous.id if previous else None,
            generated_at=datetime.now(timezone.utc),
        )
        lead.score = result.score
        await self.db.flush()
        recommendation = self.recommender.recommend("lead", lead, features, result.score)
        return AILeadScoreResponse(
            lead_id=lead_id,
            status="generated",
            score=result.score,
            confidence=result.confidence,
            factors=result.factors,
            next_best_actions=recommendation.actions,
            explanation=result.factors,
            metadata=result.metadata,
            generated_at=datetime.now(timezone.utc),
        )

    async def next_best_action(self, organization_id: UUID, entity_type: str, entity_id: UUID) -> AINextBestActionResponse:
        self._ensure_enabled()
        entity = None
        score = None
        if entity_type == "lead":
            entity = await self.lead_repo.get_active_by_id(entity_id, organization_id)
            if not entity:
                raise NotFoundException("Lead", entity_id)
            emails = await self._entity_emails(organization_id, "lead", entity_id)
            features = self.feature_service.lead_features(entity, emails)
            score = self.scorer.score_lead(entity, features).score
        elif entity_type == "deal":
            entity = await self.deal_repo.get_active_by_id(entity_id, organization_id)
            if not entity:
                raise NotFoundException("Deal", entity_id)
            emails = await self._entity_emails(organization_id, "deal", entity_id)
            features = self.feature_service.deal_features(entity, emails)
            score = self.scorer.score_deal(entity, features).score
        else:
            features = FeatureSet(entity_type=entity_type, values={"status": "unknown", "email_count": 0})
        result = self.recommender.recommend(entity_type, entity, features, score)
        previous_items = await self.recommendation_repo.latest_for_entity(organization_id, entity_type, entity_id)
        previous_id = previous_items[0].id if previous_items else None
        for action in result.actions:
            await self.recommendation_repo.create(
                organization_id=organization_id,
                entity_type=entity_type,
                entity_id=entity_id,
                lead_id=entity_id if entity_type == "lead" else None,
                deal_id=entity_id if entity_type == "deal" else None,
                recommendation=action,
                reasoning=result.rationale,
                priority="high" if score and score >= 75 else "medium",
                provider=settings.AI_PROVIDER,
                metadata_json=result.metadata,
                regenerated_from_id=previous_id,
                generated_at=datetime.now(timezone.utc),
            )
        return AINextBestActionResponse(
            entity_type=entity_type,
            entity_id=entity_id,
            status="generated",
            actions=result.actions,
            rationale=result.rationale,
            reasoning=[result.rationale] if result.rationale else [],
            metadata=result.metadata,
            generated_at=datetime.now(timezone.utc),
        )

    async def conversation_summary(self, organization_id: UUID, thread_id: str) -> AIConversationSummaryResponse:
        self._ensure_enabled()
        emails = await self.email_repo.list_thread_history(organization_id, thread_id)
        result = self.summarizer.summarize_emails(emails)
        previous = await self.summary_repo.latest_for_thread(organization_id, thread_id)
        await self.summary_repo.create(
            organization_id=organization_id,
            thread_id=thread_id,
            summary=result.summary,
            bullets=result.bullets,
            provider=settings.AI_PROVIDER,
            model_name=settings.MODEL_NAME,
            metadata_json=result.metadata,
            regenerated_from_id=previous.id if previous else None,
            generated_at=datetime.now(timezone.utc),
        )
        return AIConversationSummaryResponse(
            thread_id=thread_id,
            status="generated",
            summary=result.summary,
            bullets=result.bullets,
            metadata=result.metadata,
            generated_at=datetime.now(timezone.utc),
        )

    async def email_summary(self, organization_id: UUID, email_id: UUID) -> AIEmailSummaryResponse:
        self._ensure_enabled()
        email = await self.email_repo.get_by_id_in_org(organization_id, email_id)
        if not email:
            raise NotFoundException("Email", email_id)
        result = self.summarizer.summarize_emails([email])
        previous = await self.summary_repo.latest_for_email(organization_id, email_id)
        await self.summary_repo.create(
            organization_id=organization_id,
            thread_id=email.thread_id or email.gmail_message_id,
            email_id=email_id,
            summary=result.summary,
            bullets=result.bullets,
            provider=settings.AI_PROVIDER,
            model_name=settings.MODEL_NAME,
            metadata_json=result.metadata,
            regenerated_from_id=previous.id if previous else None,
            generated_at=datetime.now(timezone.utc),
        )
        return AIEmailSummaryResponse(
            email_id=email_id,
            status="generated",
            summary=result.summary,
            key_points=result.bullets,
            metadata=result.metadata,
            generated_at=datetime.now(timezone.utc),
        )

    async def recommendations(self, organization_id: UUID, entity_type: str, entity_id: UUID | None = None) -> AIRecommendationResponse:
        self._ensure_enabled()
        if entity_id:
            action = await self.next_best_action(organization_id, entity_type, entity_id)
            return AIRecommendationResponse(
                entity_type=entity_type,
                entity_id=entity_id,
                status="generated",
                recommendations=action.actions,
                reasoning=action.reasoning,
                metadata=action.metadata,
                generated_at=action.generated_at,
            )
        return AIRecommendationResponse(
            entity_type=entity_type,
            entity_id=None,
            status="generated",
            recommendations=["Select a lead or deal to generate contextual recommendations."],
            reasoning=["Entity-level recommendations require a CRM record."],
            metadata={},
            generated_at=datetime.now(timezone.utc),
        )

    async def deal_insight(self, organization_id: UUID, deal_id: UUID) -> DealInsightResponse:
        self._ensure_enabled()
        deal = await self.deal_repo.get_active_by_id(deal_id, organization_id)
        if not deal:
            raise NotFoundException("Deal", deal_id)
        emails = await self._entity_emails(organization_id, "deal", deal_id)
        features = self.feature_service.deal_features(deal, emails)
        score = self.scorer.score_deal(deal, features)
        recommendation = self.recommender.recommend("deal", deal, features, score.score)
        previous = await self.score_repo.latest_for_deal(organization_id, deal_id)
        await self.score_repo.create(
            organization_id=organization_id,
            deal_id=deal_id,
            entity_type="deal",
            score=score.score,
            confidence=score.confidence,
            provider=settings.SCORING_PROVIDER,
            model_name=settings.MODEL_NAME,
            explanation=score.factors,
            metadata_json=score.metadata,
            regenerated_from_id=previous.id if previous else None,
            generated_at=datetime.now(timezone.utc),
        )
        return DealInsightResponse(
            deal_id=deal_id,
            status="generated",
            score=score.score,
            confidence=score.confidence,
            factors=score.factors,
            next_best_actions=recommendation.actions,
            explanation=score.factors,
            metadata=score.metadata,
            generated_at=datetime.now(timezone.utc),
        )

    async def summarize(self, organization_id: UUID, entity_type: str, prompt: str | None = None) -> SummaryResponse:
        self._ensure_enabled()
        result = self.summarizer.summarize_emails([], prompt)
        return SummaryResponse(
            entity_type=entity_type,
            entity_id=None,
            status="generated",
            summary=result.summary,
            bullets=result.bullets,
            metadata=result.metadata,
            generated_at=datetime.now(timezone.utc),
        )
