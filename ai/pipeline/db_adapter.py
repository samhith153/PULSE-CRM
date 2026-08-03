import os
import pandas as pd
from sqlalchemy import create_engine
from dotenv import load_dotenv

load_dotenv()


def _sync_db_url() -> str:
    """Return a synchronous DB URL for pandas.read_sql.

    `DATABASE_URL` is async (postgresql+asyncpg://). pandas/psycopg2 needs a
    sync driver, so derive it from DATABASE_URL when DATABASE_URL_SYNC is unset.
    """
    sync = os.environ.get("DATABASE_URL_SYNC")
    if sync:
        return sync
    async_url = os.environ.get("DATABASE_URL", "")
    if not async_url:
        raise RuntimeError("DATABASE_URL is not configured")
    # postgresql+asyncpg:// -> postgresql+psycopg:// (or postgresql://)
    if "+asyncpg" in async_url:
        return async_url.replace("+asyncpg", "+psycopg")
    if async_url.startswith("postgresql://"):
        return async_url.replace("postgresql://", "postgresql+psycopg://", 1)
    return async_url


def _get_engine():
    return create_engine(_sync_db_url(), pool_size=1, max_overflow=2, pool_pre_ping=True)


def load_real_emails(organization_id: str, lead_id: str | None = None) -> pd.DataFrame:
    engine = _get_engine()
    params: dict = {"org_id": organization_id}
    if lead_id:
        query = """
            SELECT
                external_entity_id AS lead_id,
                sender, receiver, direction, sent_at, raw_payload,
                CASE WHEN raw_payload->>'status' = 'replied' THEN 'Yes' ELSE 'No' END AS replied
            FROM emails
            WHERE organization_id = %(org_id)s
              AND receiver NOT LIKE '%%example.com%%'
              AND sender NOT LIKE '%%example.com%%'
              AND external_entity_id IN (SELECT id FROM leads)
              AND external_entity_id = %(lead_id)s
        """
        params["lead_id"] = lead_id
    else:
        query = """
            SELECT
                external_entity_id AS lead_id,
                sender, receiver, direction, sent_at, raw_payload,
                CASE WHEN raw_payload->>'status' = 'replied' THEN 'Yes' ELSE 'No' END AS replied
            FROM emails
            WHERE organization_id = %(org_id)s
              AND receiver NOT LIKE '%%example.com%%'
              AND sender NOT LIKE '%%example.com%%'
              AND external_entity_id IN (SELECT id FROM leads)
        """
    df = pd.read_sql(query, engine, params=params)
    df["lead_id"] = df["lead_id"].astype(str)
    engine.dispose()
    return df


def load_real_leads(organization_id: str, lead_id: str | None = None) -> pd.DataFrame:
    engine = _get_engine()
    params: dict = {"org_id": organization_id}
    if lead_id:
        query = """
            SELECT
                l.id AS lead_id,
                l.status,
                COALESCE(c.industry, l.industry) AS industry,
                COALESCE(c.current_crm, l.current_crm) AS current_crm,
                COALESCE(c.operational_system, l.operational_systems) AS operational_system,
                COALESCE(c.employee_count, l.employee_count) AS employee_count
            FROM leads l
            LEFT JOIN companies c ON c.id = l.company_id
            WHERE l.organization_id = %(org_id)s
              AND l.id = %(lead_id)s
        """
        params["lead_id"] = lead_id
    else:
        query = """
            SELECT
                l.id AS lead_id,
                l.status,
                COALESCE(c.industry, l.industry) AS industry,
                COALESCE(c.current_crm, l.current_crm) AS current_crm,
                COALESCE(c.operational_system, l.operational_systems) AS operational_system,
                COALESCE(c.employee_count, l.employee_count) AS employee_count
            FROM leads l
            LEFT JOIN companies c ON c.id = l.company_id
            WHERE l.organization_id = %(org_id)s
        """
    df = pd.read_sql(query, engine, params=params)
    df["lead_id"] = df["lead_id"].astype(str)
    engine.dispose()
    return df

def load_email_activity_signals(organization_id: str) -> pd.DataFrame:
    engine = _get_engine()
    query = """
        SELECT
            external_entity_id AS lead_id,
            direction,
            sent_at,
            raw_payload->>'status' AS status
        FROM emails
        WHERE organization_id = %(org_id)s
          AND receiver NOT LIKE '%%example.com%%'
          AND sender NOT LIKE '%%example.com%%'
        ORDER BY sent_at DESC
    """
    df = pd.read_sql(query, engine, params={"org_id": organization_id})
    engine.dispose()
    return df


def compute_reply_and_activity(emails: pd.DataFrame) -> dict:
    if emails.empty:
        return {"reply_received_flag": False, "days_since_last_activity": None, "last_activity_type": None}

    latest = emails.iloc[0]
    reply_received_flag = latest["status"] == "replied" or latest["direction"] == "inbound"

    last_activity_type = "reply" if latest["direction"] == "inbound" else "email_sent"

    latest_time = pd.to_datetime(latest["sent_at"])
    now = pd.Timestamp.now(tz=latest_time.tzinfo) if latest_time.tzinfo else pd.Timestamp.now()
    days_since_last_activity = (now - latest_time).days

    return {
        "reply_received_flag": reply_received_flag,
        "days_since_last_activity": days_since_last_activity,
        "last_activity_type": last_activity_type,
    }
