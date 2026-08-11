"""
TEMP seed script — generate 10 leads with all data fields filled.
Run from backend/:  python -m scripts.seed_leads
"""
from __future__ import annotations

import asyncio
import random

from sqlalchemy import select, func

from app.database.connection import AsyncSessionFactory
from app.models.lead import Lead
from app.models.organization import Organization
from app.models.user import User


NAMES = [
    ("Alice Johnson", "alice.johnson@gmail.com"),
    ("Brian Carter", "brian.carter@outlook.com"),
    ("Priya Sharma", "priya.sharma@gmail.com"),
    ("Daniel Kim", "daniel.kim@yahoo.com"),
    ("Sofia Rossi", "sofia.rossi@gmail.com"),
    ("James O'Connor", "james.oconnor@outlook.com"),
    ("Meera Patel", "meera.patel@gmail.com"),
    ("Liam Nguyen", "liam.nguyen@yahoo.com"),
    ("Hannah Weber", "hannah.weber@gmail.com"),
    ("Omar Farouk", "omar.farouk@outlook.com"),
]

COMPANIES = [
    "Acme Corp", "Vertex Solutions", "Nova Industries", "Quantum Analytics",
    "Horizon Health", "Crest Financial", "Pulse Digital", "Atlas Manufacturing",
    "Zenith Software", "Bridge Logistics",
]

TITLES = [
    "Interested in the Professional plan",
    "Requested a demo of the AI copilot",
    "Following up on email campaign",
    "Wants to migrate from existing CRM",
    "Needs revenue analytics dashboard",
    "Evaluating RBAC for enterprise",
    "Asked about Gmail integration",
    "Looking for pipeline automation",
    "Wants sales reports for managers",
    "Interested in multi-org setup",
]

DESCRIPTIONS = [
    "Found us via Google search, wants pricing details and a walkthrough.",
    "Came through a referral, mainly interested in AI lead scoring.",
    "Responded to the Q3 email campaign, wants to see a live demo.",
    "Currently on a legacy CRM and wants a smoother migration path.",
    "Needs a dashboard for their sales leadership team.",
    "Security-first buyer, wants to understand role permissions.",
    "Wants to sync their Gmail to track email conversations.",
    "Looking for automation for follow-up tasks and reminders.",
    "Wants monthly sales reports broken down by rep.",
    "Interested in running multiple teams in one workspace.",
]

INDUSTRIES = [
    "Software", "Healthcare", "Finance", "Manufacturing",
    "Retail", "Energy", "Media & Entertainment", "Education",
    "Telecommunications", "Real Estate",
]

SOURCES = [
    "website", "referral", "email_campaign", "cold_call",
    "linkedin", "trade_show", "partner", "inbound",
]

INTERESTS = [
    "AI Copilot", "Revenue Analytics", "Pipeline Automation",
    "Email Intelligence", "Security & RBAC", "Sales Reporting",
]

CRMS = ["HubSpot", "Salesforce", "Zoho", "Pipedrive", "Freshsales", "None"]

LOCATIONS = [
    "San Francisco, CA", "New York, NY", "Austin, TX", "London, UK",
    "Berlin, Germany", "Toronto, ON", "Sydney, AU", "Bangalore, IN",
    "Dubai, UAE", "Singapore",
]

OPERATIONAL_SYSTEMS = [
    "Salesforce, Slack, Google Workspace",
    "HubSpot, Outlook, Zoom",
    "Zoho CRM, Slack, Asana",
    "Pipedrive, Teams, Mailchimp",
    "Freshsales, Google Workspace",
    "None — starting fresh",
    "Salesforce, Jira, Slack",
    "HubSpot, Trello, Gmail",
]

STATUSES = [
    "new", "contacted", "qualified", "proposal_sent", "negotiation",
]


async def seed() -> None:
    async with AsyncSessionFactory() as db:
        org = (await db.execute(select(Organization).limit(1))).scalar_one_or_none()
        if not org:
            print("[seed_leads] ERROR: No organization found in the database.")
            return

        users = (await db.execute(select(User).limit(5))).scalars().all()
        owners = [u.id for u in users] or [None]

        count = (await db.execute(select(func.count(Lead.id)))).scalar_one()
        print(f"[seed_leads] Found org={org.name!r}, {count} existing leads, {len(owners)} owner(s)")

        rng = random.Random(20260810)
        created = 0
        for i in range(10):
            full_name, email = NAMES[i]
            first, last = full_name.split(" ", 1)

            lead = Lead(
                title=TITLES[i],
                description=DESCRIPTIONS[i],
                email=email,
                phone=f"+1 415 555 {rng.randint(1000, 9999)}",
                company_name=COMPANIES[i],
                job_title=rng.choice(["VP of Sales", "Sales Manager", "Operations Director", "CEO", "IT Manager"]),
                status=rng.choice(STATUSES),
                source=rng.choice(SOURCES),
                interest=rng.choice(INTERESTS),
                industry=INDUSTRIES[i],
                employee_count=rng.choice([25, 60, 120, 300, 800, 1500, 5000]),
                current_crm=rng.choice(CRMS),
                location=LOCATIONS[i],
                operational_systems=rng.choice(OPERATIONAL_SYSTEMS),
                estimated_value=rng.choice([5000, 12000, 25000, 45000, 80000, 150000]),
                currency="USD",
                owner_id=rng.choice(owners),
                is_deleted=False,
                notes=f"Seeded test lead {i + 1} — {first} was referred by the marketing team.",
                close_reason=None,
                organization_id=org.id,
            )
            db.add(lead)
            created += 1

        await db.commit()
        print(f"[seed_leads] Inserted {created} leads.")


if __name__ == "__main__":
    asyncio.run(seed())
