from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import auth, companies, contacts, leads, deals, timeline, gmail, users

from database import engine
import models

app = FastAPI(
    title="Pulse CRM REST API",
    description="Backend business logic and synchronization controllers for Pulse CRM",
    version="1.0.0"
)

@app.on_event("startup")
def startup_event():
    # Create all tables if they don't exist
    models.Base.metadata.create_all(bind=engine)
    
    # Seed the database
    from database import SessionLocal
    from uuid import UUID
    
    db = SessionLocal()
    try:
        # Seed Roles
        if db.query(models.Role).first() is None:
            roles = [
                models.Role(
                    id=UUID('a8f90c42-b0c6-4767-88ea-d4b68e9f2915'),
                    name='Administrator',
                    description='Full system access and configurations control'
                ),
                models.Role(
                    id=UUID('b1f80c42-b0c6-4767-88ea-d4b68e9f2916'),
                    name='Sales Manager',
                    description='Auditing, tracking pipelines, and signing off on deals'
                ),
                models.Role(
                    id=UUID('c2f70c42-b0c6-4767-88ea-d4b68e9f2917'),
                    name='Sales Representative',
                    description='Frontline workspace access to log and sync client pipelines'
                )
            ]
            db.add_all(roles)
            db.commit()

        # Seed Pipeline Stages
        if db.query(models.PipelineStage).first() is None:
            stages = [
                models.PipelineStage(
                    id=UUID('d1f60c42-b0c6-4767-88ea-d4b68e9f2918'),
                    name='Qualified',
                    probability=10.00,
                    display_order=1
                ),
                models.PipelineStage(
                    id=UUID('e2f50c42-b0c6-4767-88ea-d4b68e9f2919'),
                    name='Proposal',
                    probability=40.00,
                    display_order=2
                ),
                models.PipelineStage(
                    id=UUID('f3f40c42-b0c6-4767-88ea-d4b68e9f2920'),
                    name='Under Review',
                    probability=70.00,
                    display_order=3
                ),
                models.PipelineStage(
                    id=UUID('a4f30c42-b0c6-4767-88ea-d4b68e9f2921'),
                    name='Won',
                    probability=100.00,
                    display_order=4
                ),
                models.PipelineStage(
                    id=UUID('b5f20c42-b0c6-4767-88ea-d4b68e9f2922'),
                    name='Lost',
                    probability=0.00,
                    display_order=5
                )
            ]
            db.add_all(stages)
            db.commit()

        # Seed Permissions
        if db.query(models.Permission).first() is None:
            permissions = [
                models.Permission(
                    id=UUID('7a2f6448-ff35-4e08-bfb1-912c40c83a71'),
                    name='convert_leads',
                    description='Convert inbound unqualified leads into active deals'
                ),
                models.Permission(
                    id=UUID('8b3f6448-ff35-4e08-bfb1-912c40c83a72'),
                    name='edit_deals',
                    description='Update valuations and stages on deal entities'
                ),
                models.Permission(
                    id=UUID('9c4f6448-ff35-4e08-bfb1-912c40c83a73'),
                    name='manage_roles',
                    description='Assign and edit operators permissions scopes'
                )
            ]
            db.add_all(permissions)
            db.commit()

        # Seed default User (Sarah Johnson)
        sarah = db.query(models.User).filter(models.User.email == 'sarah.j@pulse.crm').first()
        if sarah is None:
            sarah = models.User(
                id=UUID('f1f80c42-b0c6-4767-88ea-d4b68e9f2929'),
                email='sarah.j@pulse.crm',
                password_hash='pbkdf2:sha256:260000$hashedpassword',
                full_name='Sarah Johnson'
            )
            # Add Administrator role
            role = db.query(models.Role).filter(models.Role.name == 'Administrator').first()
            if role:
                sarah.roles.append(role)
            db.add(sarah)
            db.commit()

        # Seed Companies
        if db.query(models.Company).first() is None:
            companies = [
                models.Company(
                    id=UUID('e1f80c42-b0c6-4767-88ea-d4b68e9f2930'),
                    name='TechCorp',
                    domain='techcorp.com',
                    industry='Technology',
                    owner_id=sarah.id
                ),
                models.Company(
                    id=UUID('e2f80c42-b0c6-4767-88ea-d4b68e9f2931'),
                    name='Sparta Creative',
                    domain='spartacreative.io',
                    industry='Design/Creative',
                    owner_id=sarah.id
                ),
                models.Company(
                    id=UUID('e3f80c42-b0c6-4767-88ea-d4b68e9f2932'),
                    name='Empiric Logistics',
                    domain='empiriclogistics.com',
                    industry='Logistics',
                    owner_id=sarah.id
                )
            ]
            db.add_all(companies)
            db.commit()

        # Seed Contacts
        if db.query(models.Contact).first() is None:
            contacts = [
                models.Contact(
                    id=UUID('c1f80c42-b0c6-4767-88ea-d4b68e9f2940'),
                    company_id=UUID('e1f80c42-b0c6-4767-88ea-d4b68e9f2930'),
                    first_name='Alex',
                    last_name='Rivera',
                    email='alex.rivera@techcorp.com',
                    phone='+1 (555) 019-2834',
                    job_title='Director of Security'
                ),
                models.Contact(
                    id=UUID('c2f80c42-b0c6-4767-88ea-d4b68e9f2941'),
                    company_id=UUID('e2f80c42-b0c6-4767-88ea-d4b68e9f2931'),
                    first_name='Helena',
                    last_name='Troy',
                    email='helena.t@spartacreative.io',
                    phone='+1 (555) 014-9821',
                    job_title='Creative Lead'
                ),
                models.Contact(
                    id=UUID('c3f80c42-b0c6-4767-88ea-d4b68e9f2942'),
                    company_id=UUID('e3f80c42-b0c6-4767-88ea-d4b68e9f2932'),
                    first_name='Marcus',
                    last_name='Vance',
                    email='marcus.v@empiric.com',
                    phone='+1 (555) 012-3456',
                    job_title='VP of Infrastructure'
                )
            ]
            db.add_all(contacts)
            db.commit()

        # Seed Leads
        if db.query(models.Lead).first() is None:
            leads = [
                models.Lead(
                    id=UUID('a1f80c42-b0c6-4767-88ea-d4b68e9f2950'),
                    contact_id=UUID('c1f80c42-b0c6-4767-88ea-d4b68e9f2940'),
                    title='SSO Config Approved & Security Review',
                    description='We reviewed the SSO guidelines you sent. Our compliance team approved the SAML setup but they have some questions regarding custom SLAs and liability limits.',
                    value=120000.0,
                    status='New',
                    source='Website'
                ),
                models.Lead(
                    id=UUID('a2f80c42-b0c6-4767-88ea-d4b68e9f2951'),
                    contact_id=UUID('c2f80c42-b0c6-4767-88ea-d4b68e9f2941'),
                    title='Pricing Inquiry - Custom Enterprise Tier',
                    description='I was looking over the custom analytics dashboard tiers on your pricing page. We have around 40 designers who need priority SLA support.',
                    value=45000.0,
                    status='New',
                    source='Referral'
                )
            ]
            db.add_all(leads)
            db.commit()

        # Seed Deals
        if db.query(models.Deal).first() is None:
            deals = [
                models.Deal(
                    id=UUID('d1f80c42-b0c6-4767-88ea-d4b68e9f2960'),
                    lead_id=UUID('a1f80c42-b0c6-4767-88ea-d4b68e9f2950'),
                    company_id=UUID('e1f80c42-b0c6-4767-88ea-d4b68e9f2930'),
                    contact_id=UUID('c1f80c42-b0c6-4767-88ea-d4b68e9f2940'),
                    stage_id=UUID('d1f60c42-b0c6-4767-88ea-d4b68e9f2918'),
                    owner_id=sarah.id,
                    name='SSO Deployment & Enterprise Expansion',
                    value=120000.0,
                    status='Open'
                ),
                models.Deal(
                    id=UUID('d2f80c42-b0c6-4767-88ea-d4b68e9f2961'),
                    lead_id=UUID('a2f80c42-b0c6-4767-88ea-d4b68e9f2951'),
                    company_id=UUID('e2f80c42-b0c6-4767-88ea-d4b68e9f2931'),
                    contact_id=UUID('c2f80c42-b0c6-4767-88ea-d4b68e9f2941'),
                    stage_id=UUID('e2f50c42-b0c6-4767-88ea-d4b68e9f2919'),
                    owner_id=sarah.id,
                    name='Design Agency Analytics Tier',
                    value=45000.0,
                    status='Open'
                )
            ]
            db.add_all(deals)
            db.commit()
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

# CORS configurations for cross-origin frontend browser calls
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adapt to specific domains in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all endpoint routers
app.include_router(auth.router)
app.include_router(companies.router)
app.include_router(contacts.router)
app.include_router(leads.router)
app.include_router(deals.router)
app.include_router(timeline.router)
app.include_router(gmail.router)
app.include_router(users.router)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "Pulse CRM REST API",
        "version": "1.0.0",
        "documentation": "/docs"
    }
