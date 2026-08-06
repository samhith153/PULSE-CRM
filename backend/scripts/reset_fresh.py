"""
Fresh Reset Script
==================
Resets the CRM database to a clean demo state while preserving email data.

Preserved:  emails, email_events, gmail_connections (re-linked to new admin)
Reused:     existing organization (avoid cascade-deleting emails/gmail)
Re-seeded:  permissions, roles, companies, contacts, leads
Fresh:      3 user accounts with known credentials

Run:  python -m scripts.reset_fresh
"""
import asyncio
import json
from datetime import datetime, timezone
from sqlalchemy import select, text

from app.core.logging import setup_logging, get_logger
from app.core.security import hash_password
from app.database.connection import AsyncSessionFactory
from app.models.organization import Organization
from app.models.user import User, UserRole
from scripts.seed import (
    seed_permissions,
    seed_roles,
    seed_organization,
    seed_companies,
    seed_contacts,
    seed_leads,
)

logger = get_logger("reset_fresh")

TABLES_TO_CLEAR = [
    "activity_timeline_events",
    "ai_summaries",
    "calendar_events",
    "companies",
    "contacts",
    "deals",
    "event_outbox",
    "feature_vectors",
    "lead_scores",
    "leads",
    "pipeline_stages",
]

NEW_ACCOUNTS = [
    ("admin",     "admin@pulsecrm.com",  "Admin@123456",  "System Administrator"),
    ("manager",   "manager@pulsecrm.com", "Manager@123456", "Sales Manager"),
    ("sales_rep", "sales@pulsecrm.com",   "Sales@123456",   "Sales Representative"),
]


async def reset() -> None:
    async with AsyncSessionFactory() as db:
        # ── 1. Back up gmail_connections before users are deleted ──────────
        saved_gmail: list[dict] = []
        result = await db.execute(
            text("SELECT * FROM gmail_connections")
        )
        for row in result.mappings().all():
            saved_gmail.append(dict(row))
        if saved_gmail:
            logger.info("Saved %d gmail_connections for re-link", len(saved_gmail))

        # ── 2. Re-use existing organization (don't delete; emails FK to it) ─
        result = await db.execute(
            select(Organization).where(Organization.slug == "kalnet-demo")
        )
        org = result.scalar_one_or_none()
        if not org:
            org = await seed_organization(db)
            logger.info("Created new organization: %s", org.name)
        else:
            logger.info("Reusing existing organization: %s", org.name)

        # ── 3. Clear all tenant data ──────────────────────────────────────
        for table in TABLES_TO_CLEAR:
            await db.execute(text(f"DELETE FROM {table}"))
            logger.info("  Cleared: %s", table)

        # ── 4. Delete old users + their role assignments ──────────────────
        await db.execute(text("DELETE FROM user_roles"))
        await db.execute(text("DELETE FROM users"))
        logger.info("  Cleared: users + user_roles")

        # ── 5. Re-seed permissions & roles (idempotent) ───────────────────
        perm_map = await seed_permissions(db)
        role_map = await seed_roles(db, perm_map)

        # ── 6. Create 3 fresh user accounts ───────────────────────────────
        created_users: dict[str, User] = {}
        for role_name, email, password, full_name in NEW_ACCOUNTS:
            role = role_map[role_name]
            user = User(
                email=email,
                full_name=full_name,
                hashed_password=hash_password(password),
                organization_id=org.id,
                is_verified=True,
                is_active=True,
            )
            db.add(user)
            await db.flush()
            db.add(UserRole(
                user_id=user.id,
                role_id=role.id,
                assigned_by=user.id,
                assigned_at=datetime.now(timezone.utc),
            ))
            created_users[role_name] = user
            logger.info("  Created user: %s (%s / %s)", email, role_name, password)

        # ── 7. Re-link saved gmail_connections ──────────────────────────
        admin = created_users["admin"]
        await db.execute(text("DELETE FROM gmail_connections"))
        if saved_gmail:
            user_cycle = list(created_users.values())
            col_names = ", ".join(saved_gmail[0].keys())
            placeholders = ", ".join(f":{c}" for c in saved_gmail[0].keys())
            for i, data in enumerate(saved_gmail):
                data["user_id"] = user_cycle[i % len(user_cycle)].id
                data["organization_id"] = org.id
                clean = {}
                for k, v in data.items():
                    if isinstance(v, (dict, list)):
                        clean[k] = json.dumps(v)
                    else:
                        clean[k] = v
                await db.execute(
                    text(f"INSERT INTO gmail_connections ({col_names}) VALUES ({placeholders})"),
                    clean,
                )
            logger.info("Re-linked %d gmail_connections", len(saved_gmail))

        # ── 8. Re-seed demo data (companies → contacts → leads) ───────────
        companies = await seed_companies(db, org, admin)
        contacts = await seed_contacts(db, org, companies, admin)
        await seed_leads(db, org, companies, contacts, admin)

        await db.commit()
        logger.info("Fresh reset complete!")
        print()
        print("=" * 60)
        print("  Fresh reset complete!")
        print()
        print("  Accounts:")
        for role_name, email, password, *_ in NEW_ACCOUNTS:
            print(f"    {role_name:12s}  {email:30s}  {password}")
        print()
        print("  Organization:  KALNET Demo Organization (kalnet-demo)")
        print("  Demo data:     5 companies, 5 contacts, 5 leads")
        print("=" * 60)


if __name__ == "__main__":
    setup_logging()
    asyncio.run(reset())
