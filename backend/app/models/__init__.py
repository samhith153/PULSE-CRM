"""
Models package.
Import all models here so Alembic auto-detects them and SQLAlchemy mapper
registration works correctly.
"""

from app.models.activity import ActivityTimeline  # noqa: F401
from app.models.company import Company  # noqa: F401
from app.models.contact import Contact  # noqa: F401
from app.models.deal import Deal  # noqa: F401
from app.models.document import Document  # noqa: F401
from app.models.email import GmailConnection, Email  # noqa: F401
from app.models.event_outbox import EventOutbox  # noqa: F401
from app.models.lead import Lead  # noqa: F401
from app.models.lead_score import LeadScore  # noqa: F401
from app.models.feature_vector import FeatureVector  # noqa: F401
from app.models.organization import Organization  # noqa: F401
from app.models.pipeline import PipelineStage  # noqa: F401
from app.models.recommendation_feature import RecommendationFeature  # noqa: F401
from app.models.role import Permission, Role, RolePermission  # noqa: F401
from app.models.user import User, UserRole  # noqa: F401
from app.models.ai import AIScore, AIRecommendation, AIConversationSummary  # noqa: F401
from app.models.ai_summary import AISummary  # noqa: F401
from app.models.webhook import WebhookEndpoint, WebhookDelivery  # noqa: F401
from app.models.calendar_event import CalendarEvent  # noqa: F401
from app.models.notification import Notification  # noqa: F401
from app.models.meeting import Meeting  # noqa: F401
from app.models.crm_task import CrmTask  # noqa: F401
from app.models.crm_call import CrmCall  # noqa: F401
from app.models.crm_note import CrmNote  # noqa: F401
from app.models.crm_email import CrmEmail  # noqa: F401
from app.models.workflow import WorkflowTask  # noqa: F401
