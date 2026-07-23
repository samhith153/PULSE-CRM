"""
Database Seeder
───────────────
Run with:   python -m scripts.seed
Seeds:      Permissions → Roles → Organization → Admin user →
            Sample users (Manager, Sales Rep) →
            Sample Companies → Sample Contacts → Sample Leads
"""
import asyncio
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.logging import setup_logging, get_logger
from app.core.security import hash_password
from app.core.permissions import Permission, Role, ROLE_PERMISSIONS
from app.database.connection import AsyncSessionFactory
from app.models.organization import Organization
from app.models.role import Role as RoleModel, Permission as PermissionModel, RolePermission
from app.models.user import User, UserRole
from app.models.company import Company
from app.models.contact import Contact
from app.models.lead import Lead

setup_logging()
logger = get_logger("seeder")


# ─────────────────────────────────────────────────────────────────────────────
# Permissions
# ─────────────────────────────────────────────────────────────────────────────
async def seed_permissions(db: AsyncSession) -> dict[str, PermissionModel]:
    perm_map: dict[str, PermissionModel] = {}
    for perm in Permission:
        resource, action = perm.value.split(":")
        result = await db.execute(
            select(PermissionModel).where(PermissionModel.codename == perm.value)
        )
        existing = result.scalar_one_or_none()
        if existing:
            perm_map[perm.value] = existing
        else:
            p = PermissionModel(
                codename=perm.value,
                name=perm.value.replace(":", " ").replace("_", " ").title(),
                resource=resource,
                action=action,
            )
            db.add(p)
            await db.flush()
            perm_map[perm.value] = p
    logger.info("Seeded %d permissions", len(perm_map))
    return perm_map


# ─────────────────────────────────────────────────────────────────────────────
# Roles
# ─────────────────────────────────────────────────────────────────────────────
async def seed_roles(
    db: AsyncSession, perm_map: dict[str, PermissionModel]
) -> dict[str, RoleModel]:
    display = {
        Role.ADMIN: "Administrator",
        Role.MANAGER: "Sales Manager",
        Role.SALES_REP: "Sales Representative",
    }
    role_map: dict[str, RoleModel] = {}

    for role in Role:
        result = await db.execute(
            select(RoleModel).where(RoleModel.name == role.value)
        )
        existing = result.scalar_one_or_none()
        if existing:
            r = existing
        else:
            r = RoleModel(
                name=role.value,
                display_name=display[role],
                is_system=True,
            )
            db.add(r)
            await db.flush()
        role_map[role.value] = r

        # Assign permissions
        for perm in ROLE_PERMISSIONS.get(role, set()):
            perm_model = perm_map.get(perm.value)
            if not perm_model:
                continue
            rp_result = await db.execute(
                select(RolePermission).where(
                    RolePermission.role_id == r.id,
                    RolePermission.permission_id == perm_model.id,
                )
            )
            if not rp_result.scalar_one_or_none():
                db.add(RolePermission(role_id=r.id, permission_id=perm_model.id))

    await db.flush()
    logger.info("Seeded %d roles", len(role_map))
    return role_map


# ─────────────────────────────────────────────────────────────────────────────
# Organization
# ─────────────────────────────────────────────────────────────────────────────
async def seed_organization(db: AsyncSession) -> Organization:
    result = await db.execute(
        select(Organization).where(Organization.slug == "kalnet-demo")
    )
    existing = result.scalar_one_or_none()
    if existing:
        return existing

    org = Organization(
        name="KALNET Demo Organization",
        slug="kalnet-demo",
        description="Seed demo organization for KALNET PULSE CRM",
        plan="enterprise",
        max_users=100,
        timezone="UTC",
    )
    db.add(org)
    await db.flush()
    logger.info("Seeded organization: %s", org.name)
    return org


# ─────────────────────────────────────────────────────────────────────────────
# Admin user
# ─────────────────────────────────────────────────────────────────────────────
async def seed_admin_user(
    db: AsyncSession, org: Organization, admin_role: RoleModel
) -> User:
    result = await db.execute(
        select(User).where(User.email == settings.FIRST_SUPERUSER_EMAIL)
    )
    existing = result.scalar_one_or_none()
    if existing:
        return existing

    user = User(
        email=settings.FIRST_SUPERUSER_EMAIL,
        full_name=settings.FIRST_SUPERUSER_FULL_NAME,
        hashed_password=hash_password(settings.FIRST_SUPERUSER_PASSWORD),
        organization_id=org.id,
        is_verified=True,
        is_superuser=True,
        is_active=True,
    )
    db.add(user)
    await db.flush()

    db.add(UserRole(
        user_id=user.id,
        role_id=admin_role.id,
        assigned_by=user.id,
        assigned_at=datetime.now(timezone.utc),
    ))
    await db.flush()
    logger.info("Seeded admin user: %s", user.email)
    return user


# ─────────────────────────────────────────────────────────────────────────────
# Sample users
# ─────────────────────────────────────────────────────────────────────────────
async def seed_sample_users(
    db: AsyncSession,
    org: Organization,
    manager_role: RoleModel,
    sales_role: RoleModel,
) -> list[User]:
    sample = [
        ("Sarah Johnson", "sarah.johnson@kalnet-demo.com", manager_role),
        ("Mike Chen", "mike.chen@kalnet-demo.com", sales_role),
        ("Priya Sharma", "priya.sharma@kalnet-demo.com", sales_role),
    ]
    users: list[User] = []
    for full_name, email, role in sample:
        result = await db.execute(select(User).where(User.email == email))
        existing = result.scalar_one_or_none()
        if existing:
            users.append(existing)
            continue
        u = User(
            email=email,
            full_name=full_name,
            hashed_password=hash_password("Demo@123456"),
            organization_id=org.id,
            is_verified=True,
            is_active=True,
        )
        db.add(u)
        await db.flush()
        db.add(UserRole(
            user_id=u.id,
            role_id=role.id,
            assigned_by=u.id,
            assigned_at=datetime.now(timezone.utc),
        ))
        await db.flush()
        users.append(u)
        logger.info("Seeded user: %s", email)
    return users


# ─────────────────────────────────────────────────────────────────────────────
# Companies
# ─────────────────────────────────────────────────────────────────────────────
async def seed_companies(
    db: AsyncSession, org: Organization, admin: User
) -> list[Company]:
    companies_data = [
        {"name": "TechNova Solutions", "industry": "Software",
         "website": "https://technova.io", "city": "San Francisco", "country": "USA"},
        {"name": "Global Retail Corp", "industry": "Retail",
         "website": "https://globalretail.com", "city": "New York", "country": "USA"},
        {"name": "DataBridge Analytics", "industry": "Data & Analytics",
         "website": "https://databridge.ai", "city": "Austin", "country": "USA"},
        {"name": "HealthFirst Medical", "industry": "Healthcare",
         "website": "https://healthfirst.med", "city": "Boston", "country": "USA"},
        {"name": "GreenEnergy Partners", "industry": "Energy",
         "website": "https://greenenergy.co", "city": "Denver", "country": "USA"},
    ]
    companies: list[Company] = []
    for data in companies_data:
        result = await db.execute(
            select(Company).where(
                Company.name == data["name"],
                Company.organization_id == org.id,
            )
        )
        existing = result.scalar_one_or_none()
        if existing:
            companies.append(existing)
            continue
        c = Company(
            **data,
            organization_id=org.id,
            created_by=admin.id,
            owner_id=admin.id,
        )
        db.add(c)
        await db.flush()
        companies.append(c)
    logger.info("Seeded %d companies", len(companies))
    return companies


# ─────────────────────────────────────────────────────────────────────────────
# Contacts
# ─────────────────────────────────────────────────────────────────────────────
async def seed_contacts(
    db: AsyncSession,
    org: Organization,
    companies: list[Company],
    admin: User,
) -> list[Contact]:
    contacts_data = [
        {"first_name": "Alice", "last_name": "Walker",
         "email": "alice.walker@technova.io", "job_title": "CTO", "company_idx": 0},
        {"first_name": "Bob", "last_name": "Martinez",
         "email": "bob.martinez@globalretail.com", "job_title": "VP Sales", "company_idx": 1},
        {"first_name": "Carol", "last_name": "Zhang",
         "email": "carol.zhang@databridge.ai", "job_title": "CEO", "company_idx": 2},
        {"first_name": "David", "last_name": "Kim",
         "email": "david.kim@healthfirst.med", "job_title": "Procurement Manager", "company_idx": 3},
        {"first_name": "Eva", "last_name": "Brown",
         "email": "eva.brown@greenenergy.co", "job_title": "Director of Operations", "company_idx": 4},
    ]
    contacts: list[Contact] = []
    for data in contacts_data:
        result = await db.execute(
            select(Contact).where(
                Contact.email == data["email"],
                Contact.organization_id == org.id,
            )
        )
        existing = result.scalar_one_or_none()
        if existing:
            contacts.append(existing)
            continue
        company_idx = data.pop("company_idx")
        c = Contact(
            **data,
            organization_id=org.id,
            created_by=admin.id,
            owner_id=admin.id,
            company_id=companies[company_idx].id if companies else None,
        )
        db.add(c)
        await db.flush()
        contacts.append(c)
    logger.info("Seeded %d contacts", len(contacts))
    return contacts


# ─────────────────────────────────────────────────────────────────────────────
# Leads
# ─────────────────────────────────────────────────────────────────────────────
async def seed_leads(
    db: AsyncSession,
    org: Organization,
    companies: list[Company],
    contacts: list[Contact],
    admin: User,
) -> None:
    leads_data = [
        {"title": "TechNova — Enterprise License Upgrade",
         "status": "qualified", "source": "referral",
         "estimated_value": "25000.00", "company_idx": 0, "contact_idx": 0},
        {"title": "Global Retail — CRM Implementation",
         "status": "proposal_sent", "source": "website",
         "estimated_value": "80000.00", "company_idx": 1, "contact_idx": 1},
        {"title": "DataBridge — Analytics Module",
         "status": "new", "source": "linkedin",
         "estimated_value": "15000.00", "company_idx": 2, "contact_idx": 2},
        {"title": "HealthFirst — Compliance Suite",
         "status": "negotiation", "source": "cold_call",
         "estimated_value": "120000.00", "company_idx": 3, "contact_idx": 3},
        {"title": "GreenEnergy — Dashboard Subscription",
         "status": "won", "source": "email_campaign",
         "estimated_value": "9500.00", "company_idx": 4, "contact_idx": 4},
    ]
    for data in leads_data:
        result = await db.execute(
            select(Lead).where(
                Lead.title == data["title"],
                Lead.organization_id == org.id,
            )
        )
        if result.scalar_one_or_none():
            continue
        company_idx = data.pop("company_idx")
        contact_idx = data.pop("contact_idx")
        lead = Lead(
            **data,
            organization_id=org.id,
            created_by=admin.id,
            owner_id=admin.id,
            company_id=companies[company_idx].id if companies else None,
            contact_id=contacts[contact_idx].id if contacts else None,
            close_reason="Signed contract" if data.get("status") == "won" else None,
        )
        db.add(lead)
    await db.flush()
    logger.info("Seeded sample leads")


# ─────────────────────────────────────────────────────────────────────────────
# Entry point
# ─────────────────────────────────────────────────────────────────────────────
async def run_seed() -> None:
    async with AsyncSessionFactory() as db:
        try:
            perm_map = await seed_permissions(db)
            role_map = await seed_roles(db, perm_map)
            org = await seed_organization(db)
            admin = await seed_admin_user(db, org, role_map["admin"])
            await seed_sample_users(db, org, role_map["manager"], role_map["sales_rep"])
            companies = await seed_companies(db, org, admin)
            contacts = await seed_contacts(db, org, companies, admin)
            await seed_leads(db, org, companies, contacts, admin)
            await db.commit()
            logger.info("✅ Seed complete!")
        except Exception as exc:
            await db.rollback()
            logger.exception("❌ Seed failed: %s", exc)
            raise


if __name__ == "__main__":
    asyncio.run(run_seed())
