import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Numeric, Boolean, ForeignKey, Table, Integer, Text, UUID
from sqlalchemy.orm import relationship
from database import Base

# Association Table: Many-to-Many Roles & Permissions
roles_permissions = Table(
    'roles_permissions',
    Base.metadata,
    Column('role_id', UUID(as_uuid=True), ForeignKey('roles.id', ondelete='CASCADE'), primary_key=True),
    Column('permission_id', UUID(as_uuid=True), ForeignKey('permissions.id', ondelete='CASCADE'), primary_key=True)
)

# Association Table: Many-to-Many Users & Roles
users_roles = Table(
    'users_roles',
    Base.metadata,
    Column('user_id', UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), primary_key=True),
    Column('role_id', UUID(as_uuid=True), ForeignKey('roles.id', ondelete='CASCADE'), primary_key=True)
)


class User(Base):
    __tablename__ = 'users'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    roles = relationship('Role', secondary=users_roles, back_populates='users')
    owned_companies = relationship('Company', back_populates='owner')
    owned_deals = relationship('Deal', back_populates='owner')
    created_activities = relationship('Activity', back_populates='creator')


class Role(Base):
    __tablename__ = 'roles'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(50), unique=True, nullable=False)
    description = Column(Text, nullable=True)

    # Relationships
    users = relationship('User', secondary=users_roles, back_populates='roles')
    permissions = relationship('Permission', secondary=roles_permissions, back_populates='roles')


class Permission(Base):
    __tablename__ = 'permissions'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text, nullable=True)

    # Relationships
    roles = relationship('Role', secondary=roles_permissions, back_populates='permissions')


class Company(Base):
    __tablename__ = 'companies'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(150), nullable=False)
    domain = Column(String(100), nullable=True)
    industry = Column(String(100), nullable=True)
    owner_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    owner = relationship('User', back_populates='owned_companies')
    contacts = relationship('Contact', back_populates='company', cascade='all, delete-orphan')
    deals = relationship('Deal', back_populates='company', cascade='all, delete-orphan')


class Contact(Base):
    __tablename__ = 'contacts'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey('companies.id', ondelete='CASCADE'), nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(255), nullable=False, index=True)
    phone = Column(String(30), nullable=True)
    job_title = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    company = relationship('Company', back_populates='contacts')
    leads = relationship('Lead', back_populates='contact', cascade='all, delete-orphan')
    deals = relationship('Deal', back_populates='contact', cascade='all, delete-orphan')
    emails = relationship('Email', back_populates='contact', cascade='all, delete-orphan')


class Lead(Base):
    __tablename__ = 'leads'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    contact_id = Column(UUID(as_uuid=True), ForeignKey('contacts.id', ondelete='CASCADE'), nullable=False)
    title = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    value = Column(Numeric(12, 2), nullable=True)
    status = Column(String(50), default='New')  # New, Contacted, Qualified, Lost
    source = Column(String(50), nullable=True)  # Website, Cold Call, Referral, etc.
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    contact = relationship('Contact', back_populates='leads')
    deals = relationship('Deal', back_populates='lead')


class PipelineStage(Base):
    __tablename__ = 'pipeline_stages'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(50), nullable=False, unique=True)
    probability = Column(Numeric(5, 2), nullable=False)  # Win probability percentage
    display_order = Column(Integer, nullable=False)

    # Relationships
    deals = relationship('Deal', back_populates='stage')


class Deal(Base):
    __tablename__ = 'deals'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    lead_id = Column(UUID(as_uuid=True), ForeignKey('leads.id', ondelete='SET NULL'), nullable=True)
    company_id = Column(UUID(as_uuid=True), ForeignKey('companies.id', ondelete='CASCADE'), nullable=False)
    contact_id = Column(UUID(as_uuid=True), ForeignKey('contacts.id', ondelete='CASCADE'), nullable=False)
    stage_id = Column(UUID(as_uuid=True), ForeignKey('pipeline_stages.id', ondelete='RESTRICT'), nullable=False)
    owner_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    name = Column(String(150), nullable=False)
    value = Column(Numeric(12, 2), nullable=False)
    status = Column(String(30), default='Open')  # Open, Won, Lost
    closed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    lead = relationship('Lead', back_populates='deals')
    company = relationship('Company', back_populates='deals')
    contact = relationship('Contact', back_populates='deals')
    stage = relationship('PipelineStage', back_populates='deals')
    owner = relationship('User', back_populates='owned_deals')
    activities = relationship('Activity', back_populates='deal', cascade='all, delete-orphan')
    emails = relationship('Email', back_populates='deal', cascade='all, delete-orphan')


class Activity(Base):
    __tablename__ = 'activities'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    deal_id = Column(UUID(as_uuid=True), ForeignKey('deals.id', ondelete='CASCADE'), nullable=True)
    contact_id = Column(UUID(as_uuid=True), ForeignKey('contacts.id', ondelete='SET NULL'), nullable=True)
    type = Column(String(50), nullable=False)  # Call, Meeting, Task, Note
    subject = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    due_date = Column(DateTime, nullable=True)
    status = Column(String(30), default='Pending')  # Completed, Pending
    created_by = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    deal = relationship('Deal', back_populates='activities')
    contact = relationship('Contact')
    creator = relationship('User', back_populates='created_activities')


class Email(Base):
    __tablename__ = 'emails'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    deal_id = Column(UUID(as_uuid=True), ForeignKey('deals.id', ondelete='SET NULL'), nullable=True)
    contact_id = Column(UUID(as_uuid=True), ForeignKey('contacts.id', ondelete='CASCADE'), nullable=False)
    message_id = Column(String(255), unique=True, nullable=False, index=True)
    subject = Column(String(255), nullable=True)
    body = Column(Text, nullable=True)
    sender = Column(String(255), nullable=False)
    recipient = Column(String(255), nullable=False)
    sent_at = Column(DateTime, nullable=False)
    is_incoming = Column(Boolean, default=True)
    synced_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    deal = relationship('Deal', back_populates='emails')
    contact = relationship('Contact', back_populates='emails')
