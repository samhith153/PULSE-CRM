import os
import pandas as pd
from sqlalchemy import create_engine
from dotenv import load_dotenv

load_dotenv()


def load_real_emails(organization_id: str) -> pd.DataFrame:
    engine = create_engine(os.environ["DATABASE_URL_SYNC"])
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
    df = pd.read_sql(query, engine, params={"org_id": organization_id})
    df["lead_id"] = df["lead_id"].astype(str)
    return df


def load_real_leads(organization_id: str) -> pd.DataFrame:
    engine = create_engine(os.environ["DATABASE_URL_SYNC"])
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
    df = pd.read_sql(query, engine, params={"org_id": organization_id})
    df["lead_id"] = df["lead_id"].astype(str)
    return df

def load_email_activity_signals(organization_id: str) -> pd.DataFrame:
    engine = create_engine(os.environ["DATABASE_URL_SYNC"])
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
    return pd.read_sql(query, engine, params={"org_id": organization_id})


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