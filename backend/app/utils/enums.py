"""
Domain Enums
All string enums used across models, schemas, and services.
"""
from enum import Enum


class LeadStatus(str, Enum):
    NEW = "new"
    CONTACTED = "contacted"
    QUALIFIED = "qualified"
    PROPOSAL_SENT = "proposal_sent"
    NEGOTIATION = "negotiation"
    WON = "won"
    LOST = "lost"
    CONVERTED = "converted"


class LeadSource(str, Enum):
    WEBSITE = "website"
    REFERRAL = "referral"
    COLD_CALL = "cold_call"
    EMAIL_CAMPAIGN = "email_campaign"
    SOCIAL_MEDIA = "social_media"
    LINKEDIN = "linkedin"
    TRADE_SHOW = "trade_show"
    PARTNER = "partner"
    INBOUND = "inbound"
    OTHER = "other"


class CompanyType(str, Enum):
    PROSPECT = "prospect"
    CUSTOMER = "customer"
    PARTNER = "partner"
    COMPETITOR = "competitor"
    VENDOR = "vendor"
    OTHER = "other"


class UserStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    PENDING = "pending"


class SortOrder(str, Enum):
    ASC = "asc"
    DESC = "desc"


class DealStatus(str, Enum):
    OPEN = "open"
    QUALIFIED = "qualified"
    PROPOSAL = "proposal"
    NEGOTIATION = "negotiation"
    WON = "won"
    LOST = "lost"


class DealSortField(str, Enum):
    CREATED_AT = "created_at"
    UPDATED_AT = "updated_at"
    NAME = "name"
    AMOUNT = "amount"
    EXPECTED_CLOSE_DATE = "expected_close_date"
    PROBABILITY = "probability"


class PipelineStageSlug(str, Enum):
    NEW = "new"
    QUALIFIED = "qualified"
    PROPOSAL = "proposal"
    NEGOTIATION = "negotiation"
    WON = "won"
    LOST = "lost"


class ActivityType(str, Enum):
    NOTE = "note"
    CALL = "call"
    MEETING = "meeting"
    EMAIL = "email"
    PROPOSAL_SENT = "proposal_sent"
    STAGE_CHANGED = "stage_changed"
    DEAL_WON = "deal_won"
    DEAL_LOST = "deal_lost"
    LEAD_CONVERTED = "lead_converted"
    COMPANY_CREATED = "company_created"
    CONTACT_CREATED = "contact_created"
    LEAD_CREATED = "lead_created"
    LEAD_ASSIGNED = "lead_assigned"
    LEAD_UPDATED = "lead_updated"
    DEAL_CREATED = "deal_created"
    DEAL_UPDATED = "deal_updated"
    EMAIL_RECEIVED = "email_received"
    EMAIL_SENT = "email_sent"


class ActivityEntityType(str, Enum):
    LEAD = "lead"
    DEAL = "deal"
    CONTACT = "contact"
    COMPANY = "company"
    EMAIL = "email"
    SYSTEM = "system"


class EmailDirection(str, Enum):
    INBOUND = "inbound"
    OUTBOUND = "outbound"


class EmailSyncStatus(str, Enum):
    CONNECTED = "connected"
    SYNCING = "syncing"
    ACTIVE = "active"
    ERROR = "error"


class OrgPlan(str, Enum):
    FREE = "free"
    STARTER = "starter"
    PROFESSIONAL = "professional"
    ENTERPRISE = "enterprise"
