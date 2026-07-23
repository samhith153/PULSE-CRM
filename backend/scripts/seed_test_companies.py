"""
Test Company Data Script
────────────────────────
Commands
  seed        → Insert/generate company test data
  export      → Export companies to JSON
  validate    → Verify company data integrity

Options
  --source mock       Generate fake data (default)
  --source database   Use the real database

Environment
  PULSE_DATA_SOURCE   Overrides --source (e.g., export PULSE_DATA_SOURCE=database)

Examples
  python -m scripts.seed_test_companies seed
  python -m scripts.seed_test_companies seed --source mock
  python -m scripts.seed_test_companies export --source database
  python -m scripts.seed_test_companies validate
  export PULSE_DATA_SOURCE=database
  python -m scripts.seed_test_companies seed
"""
from __future__ import annotations

import argparse
import asyncio
import json
import os
import random
import string
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional


# ─────────────────────────────────────────────────────────────────────────────
# Realistic test data pools
# ─────────────────────────────────────────────────────────────────────────────

INDUSTRIES = [
    "Software", "Healthcare", "Finance", "Manufacturing",
    "Retail", "Energy", "Media & Entertainment", "Education",
    "Telecommunications", "Real Estate", "Transportation & Logistics",
    "Agriculture", "Construction", "Aerospace & Defense", "Automotive",
    "Biotechnology", "Consulting", "Consumer Electronics", "Cybersecurity",
    "Data Analytics", "E-Commerce", "Environmental Services", "Fintech",
    "Food & Beverage", "Gaming", "Government", "Hospitality",
    "Human Resources", "Insurance", "Legal Services", "Marketing & Advertising",
    "Mining & Metals", "Nonprofit", "Pharmaceuticals", "Public Relations",
    "Semiconductors", "Sports & Recreation", "Supply Chain Management",
    "Textiles", "Utilities", "Warehousing", "Waste Management",
]

COMPANY_TYPES = ["prospect", "customer", "partner", "competitor", "vendor", "other"]

CITIES = [
    ("San Francisco", "California", "USA"),
    ("New York", "New York", "USA"),
    ("Los Angeles", "California", "USA"),
    ("Chicago", "Illinois", "USA"),
    ("Austin", "Texas", "USA"),
    ("Boston", "Massachusetts", "USA"),
    ("Seattle", "Washington", "USA"),
    ("Denver", "Colorado", "USA"),
    ("Miami", "Florida", "USA"),
    ("Atlanta", "Georgia", "USA"),
    ("London", "England", "UK"),
    ("Manchester", "England", "UK"),
    ("Berlin", "Berlin", "Germany"),
    ("Munich", "Bavaria", "Germany"),
    ("Paris", "Ile-de-France", "France"),
    ("Amsterdam", "North Holland", "Netherlands"),
    ("Dublin", "Dublin", "Ireland"),
    ("Toronto", "Ontario", "Canada"),
    ("Vancouver", "British Columbia", "Canada"),
    ("Sydney", "New South Wales", "Australia"),
    ("Melbourne", "Victoria", "Australia"),
    ("Singapore", "Singapore", "Singapore"),
    ("Tokyo", "Tokyo", "Japan"),
    ("Mumbai", "Maharashtra", "India"),
    ("Bangalore", "Karnataka", "India"),
    ("Dubai", "Dubai", "UAE"),
    ("Sao Paulo", "Sao Paulo", "Brazil"),
    ("Mexico City", "Mexico City", "Mexico"),
    ("Lagos", "Lagos", "Nigeria"),
    ("Nairobi", "Nairobi", "Kenya"),
]

NAME_PREFIXES = [
    "Apex", "Nexus", "Core", "Pulse", "Vertex", "Horizon", "Catalyst",
    "Vanguard", "Prism", "Zenith", "Atlas", "Nova", "Quantum", "Summit",
    "Fusion", "Crest", "Bridge", "Path", "Spark", "Wave", "Edge",
    "Flow", "Drift", "Sync", "Loop", "Shift", "Leap", "Root",
    "Cloud", "Data", "Net", "Tech", "Cyber", "Bio", "Eco",
]

NAME_SUFFIXES = [
    "Solutions", "Systems", "Technologies", "Labs", "Analytics",
    "Partners", "Group", "Corp", "Inc", "Co", "Holdings",
    "Services", "Ventures", "Works", "Digital", "Innovations",
    "Networks", "Dynamics", "Strategies", "Global", "International",
    "One", "Hub", "Link", "Base", "Point", "Space", "Zone",
]

DOMAIN_TLDS = [".com", ".io", ".co", ".ai", ".tech", ".net", ".org"]

ANNUAL_REVENUE_RANGES = [
    "Under $1M",
    "$1M - $5M",
    "$5M - $10M",
    "$10M - $50M",
    "$50M - $100M",
    "$100M - $500M",
    "$500M - $1B",
    "Over $1B",
    "Not disclosed",
]

EMPLOYEE_COUNTS = [
    (1, 10), (11, 50), (51, 200), (201, 500),
    (501, 1000), (1001, 5000), (5001, 10000), (10001, 50000),
]

PHONE_CODES = ["+1", "+44", "+49", "+33", "+31", "+353", "+61", "+65", "+81", "+91", "+971", "+55"]


# ─────────────────────────────────────────────────────────────────────────────
# Company data generator
# ─────────────────────────────────────────────────────────────────────────────

@dataclass
class CompanyData:
    name: str
    domain: Optional[str] = None
    website: Optional[str] = None
    description: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    zip_code: Optional[str] = None
    industry: Optional[str] = None
    company_type: Optional[str] = None
    employee_count: Optional[int] = None
    annual_revenue: Optional[str] = None
    linkedin_url: Optional[str] = None
    twitter_url: Optional[str] = None


class CompanyDataGenerator:
    """Generates realistic test company data."""

    def __init__(self, seed: int = 42):
        self._rng = random.Random(seed)
        self._generated_names: set[str] = set()

    def _unique_name(self) -> str:
        for _ in range(1000):
            prefix = self._rng.choice(NAME_PREFIXES)
            suffix = self._rng.choice(NAME_SUFFIXES)
            name = f"{prefix} {suffix}"
            if name not in self._generated_names:
                self._generated_names.add(name)
                return name
        # Fallback: append random suffix
        base = self._rng.choice(NAME_PREFIXES)
        rand = "".join(self._rng.choices(string.ascii_lowercase, k=4))
        name = f"{base} {rand.title()}"
        self._generated_names.add(name)
        return name

    def _domain_from_name(self, name: str) -> str:
        slug = name.lower().replace(" ", "")
        tld = self._rng.choice(DOMAIN_TLDS)
        return f"{slug}{tld}"

    def _generate_one(self) -> CompanyData:
        city_idx = self._rng.randrange(len(CITIES))
        city, state, country = CITIES[city_idx]

        name = self._unique_name()
        domain = self._domain_from_name(name)
        industry = self._rng.choice(INDUSTRIES)
        company_type = self._rng.choice(COMPANY_TYPES)

        emp_low, emp_high = self._rng.choice(EMPLOYEE_COUNTS)
        employee_count = self._rng.randint(emp_low, emp_high)

        revenue = self._rng.choice(ANNUAL_REVENUE_RANGES)
        phone_code = self._rng.choice(PHONE_CODES)
        phone_num = "".join(self._rng.choices(string.digits, k=10))
        phone = f"{phone_code} {phone_num[:3]} {phone_num[3:6]} {phone_num[6:]}"

        zip_code = "".join(self._rng.choices(string.digits, k=5))

        contact_email = f"info@{domain}"

        descriptions = [
            f"{industry} company based in {city}, specializing in innovative solutions.",
            f"A {company_type} organization in the {industry} sector.",
            f"Leading provider of {industry.lower()} services with {employee_count} employees.",
        ]

        return CompanyData(
            name=name,
            domain=domain,
            website=f"https://{domain}",
            description=self._rng.choice(descriptions),
            email=contact_email,
            phone=phone,
            address=f"{self._rng.randint(100, 9999)} {self._rng.choice(['Main', 'Broad', 'Market', 'High', 'Oak'])} {self._rng.choice(['St', 'Ave', 'Blvd', 'Dr', 'Ln'])}",
            city=city,
            state=state,
            country=country,
            zip_code=zip_code,
            industry=industry,
            company_type=company_type,
            employee_count=employee_count,
            annual_revenue=revenue,
            linkedin_url=f"https://linkedin.com/company/{name.lower().replace(' ', '-')}",
            twitter_url=f"https://twitter.com/{name.lower().replace(' ', '')}",
        )

    def generate(self, count: int = 50) -> list[CompanyData]:
        return [self._generate_one() for _ in range(count)]


# ─────────────────────────────────────────────────────────────────────────────
# Database operations
# ─────────────────────────────────────────────────────────────────────────────

async def seed_mock_to_db(companies: list[CompanyData], count: int = None) -> int:
    """Insert mock companies into the database via async session."""
    try:
        from sqlalchemy import select
        from app.core.logging import get_logger
        from app.database.connection import AsyncSessionFactory
        from app.models.company import Company
        from app.models.organization import Organization
    except (ImportError, Exception) as e:
        print(f"[seed] Error: Cannot connect to database: {e}")
        print("[seed] Make sure DATABASE_URL is set in your .env file")
        print("[seed] Example: DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/pulse")
        print("[seed] Or use: python -m scripts.seed_test_companies export --source mock")
        return -1

    logger = get_logger("seed_test_companies")
    to_insert = companies[:count] if count else companies

    async with AsyncSessionFactory() as db:
        # Get first organization as target
        result = await db.execute(select(Organization))
        org = result.scalar_one_or_none()
        if not org:
            logger.error("No organization found. Run the main seeder first.")
            return 0

        seeded = 0
        for c in to_insert:
            # Skip if company name already exists in org
            exists = await db.execute(
                select(Company).where(
                    Company.name == c.name,
                    Company.organization_id == org.id,
                )
            )
            if exists.scalar_one_or_none():
                logger.debug("Skipping duplicate: %s", c.name)
                continue

            company = Company(
                name=c.name,
                domain=c.domain,
                website=c.website,
                description=c.description,
                email=c.email,
                phone=c.phone,
                address=c.address,
                city=c.city,
                state=c.state,
                country=c.country,
                zip_code=c.zip_code,
                industry=c.industry,
                company_type=c.company_type,
                employee_count=c.employee_count,
                annual_revenue=c.annual_revenue,
                linkedin_url=c.linkedin_url,
                twitter_url=c.twitter_url,
                organization_id=org.id,
            )
            db.add(company)
            seeded += 1

        await db.commit()
        logger.info("Seeded %d companies (skipped %d duplicates)", seeded, len(to_insert) - seeded)
        return seeded


async def export_mock_companies(companies: list[CompanyData]) -> dict:
    """Return mock companies as JSON-serializable dict."""
    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "count": len(companies),
        "companies": [asdict(c) for c in companies],
    }


async def export_real_companies() -> dict:
    """Read real companies from database and return as dict."""
    from sqlalchemy import select, func
    from app.core.logging import get_logger
    from app.database.connection import AsyncSessionFactory
    from app.models.company import Company

    logger = get_logger("seed_test_companies")

    async with AsyncSessionFactory() as db:
        result = await db.execute(select(Company))
        all_companies = result.scalars().all()

        logger.info("Found %d companies in database", len(all_companies))
        return {
            "exported_at": datetime.now(timezone.utc).isoformat(),
            "count": len(all_companies),
            "companies": [
                {
                    "id": str(c.id),
                    "name": c.name,
                    "domain": c.domain,
                    "industry": c.industry,
                    "city": c.city,
                    "country": c.country,
                    "employee_count": c.employee_count,
                    "annual_revenue": c.annual_revenue,
                    "company_type": c.company_type,
                }
                for c in all_companies
            ],
        }


async def validate_mock_companies(companies: list[CompanyData]) -> dict:
    """Validate generated mock companies for data quality."""
    issues = []
    for i, c in enumerate(companies):
        if not c.name:
            issues.append(f"Company {i}: missing name")
        if not c.email or "@" not in c.email:
            issues.append(f"Company {i} ({c.name}): invalid email")
        if not c.industry:
            issues.append(f"Company {i} ({c.name}): missing industry")
        if not c.city:
            issues.append(f"Company {i} ({c.name}): missing city")
        if c.employee_count is not None and c.employee_count < 0:
            issues.append(f"Company {i} ({c.name}): negative employee_count")

    return {
        "validated_at": datetime.now(timezone.utc).isoformat(),
        "total_companies": len(companies),
        "issues_count": len(issues),
        "issues": issues,
        "valid": len(issues) == 0,
    }


async def validate_real_companies() -> dict:
    """Validate real database companies for data integrity."""
    from sqlalchemy import select
    from app.core.logging import get_logger
    from app.database.connection import AsyncSessionFactory
    from app.models.company import Company

    logger = get_logger("seed_test_companies")

    async with AsyncSessionFactory() as db:
        result = await db.execute(select(Company))
        all_companies = result.scalars().all()

        issues = []
        for c in all_companies:
            if not c.name:
                issues.append(f"Company {c.id}: missing name")
            if c.email and "@" not in c.email:
                issues.append(f"Company {c.id} ({c.name}): invalid email")
            if c.employee_count is not None and c.employee_count < 0:
                issues.append(f"Company {c.id} ({c.name}): negative employee_count")
            if c.website and not c.website.startswith("http"):
                issues.append(f"Company {c.id} ({c.name}): website missing protocol")

        logger.info(
            "Validated %d companies: %d issues", len(all_companies), len(issues)
        )
        return {
            "validated_at": datetime.now(timezone.utc).isoformat(),
            "total_companies": len(all_companies),
            "issues_count": len(issues),
            "issues": issues,
            "valid": len(issues) == 0,
        }


# ─────────────────────────────────────────────────────────────────────────────
# CLI
# ─────────────────────────────────────────────────────────────────────────────

def _get_source(args) -> str:
    """Resolve --source from CLI flag or env var."""
    env_source = os.environ.get("PULSE_DATA_SOURCE")
    if args.source:
        return args.source
    if env_source:
        return env_source
    return "mock"


def _save_json(data: dict, filename: str) -> None:
    output_path = Path(__file__).parent / filename
    output_path.write_text(json.dumps(data, indent=2, default=str), encoding="utf-8")
    print(f"Saved to {output_path}")


async def cmd_seed(args) -> None:
    source = _get_source(args)
    print(f"[seed] source={source}")

    if source == "mock":
        count = getattr(args, "count", 50)
        generator = CompanyDataGenerator(seed=random.randint(1, 99999))
        companies = generator.generate(count)
        print(f"[seed] Generated {len(companies)} mock companies")

        seeded = await seed_mock_to_db(companies)
        if seeded == -1:
            return  # error already printed
        print(f"[seed] Inserted {seeded} companies into database")
    else:
        print("[seed] Cannot seed from database. Use --source mock.")


async def cmd_export(args) -> None:
    source = _get_source(args)
    print(f"[export] source={source}")

    if source == "mock":
        count = getattr(args, "count", 50)
        generator = CompanyDataGenerator(seed=42)
        companies = generator.generate(count)
        data = await export_mock_companies(companies)
        _save_json(data, "test_companies_mock.json")
        print(f"[export] Exported {len(companies)} mock companies")
    else:
        data = await export_real_companies()
        _save_json(data, "test_companies_real.json")
        print(f"[export] Exported {data['count']} companies from database")


async def cmd_validate(args) -> None:
    source = _get_source(args)
    print(f"[validate] source={source}")

    if source == "mock":
        generator = CompanyDataGenerator(seed=42)
        companies = generator.generate(50)
        result = await validate_mock_companies(companies)
    else:
        result = await validate_real_companies()

    print(f"[validate] Total: {result['total_companies']}")
    print(f"[validate] Valid: {result['valid']}")
    if result["issues_count"] > 0:
        print(f"[validate] Issues ({result['issues_count']}):")
        for issue in result["issues"][:10]:
            print(f"  - {issue}")


def _add_source_arg(parser: argparse.ArgumentParser) -> None:
    """Add --source flag to a subcommand parser."""
    parser.add_argument(
        "--source",
        choices=["mock", "database"],
        default=None,
        help="Data source: 'mock' (fake data) or 'database' (real DB). "
             "Can also set PULSE_DATA_SOURCE env var. Default: mock",
    )


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="seed_test_companies",
        description="Generate, export, and validate test company data.",
    )

    sub = parser.add_subparsers(dest="command", help="Command to run")

    # seed
    seed_parser = sub.add_parser("seed", help="Insert/generate company test data")
    _add_source_arg(seed_parser)
    seed_parser.add_argument("--count", type=int, default=50, help="Number of companies to generate (default: 50)")

    # export
    export_parser = sub.add_parser("export", help="Export companies to JSON")
    _add_source_arg(export_parser)
    export_parser.add_argument("--count", type=int, default=50, help="Number of companies to generate (mock mode, default: 50)")

    # validate
    validate_parser = sub.add_parser("validate", help="Verify company data integrity")
    _add_source_arg(validate_parser)

    return parser


async def main() -> None:
    parser = build_parser()
    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        return

    handlers = {
        "seed": cmd_seed,
        "export": cmd_export,
        "validate": cmd_validate,
    }

    await handlers[args.command](args)


if __name__ == "__main__":
    asyncio.run(main())
