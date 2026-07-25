import os
import pandas as pd
from sqlalchemy import create_engine


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
    """
    df = pd.read_sql(query, engine, params={"org_id": organization_id})
    df["lead_id"] = df["lead_id"].astype(str)
    return df


def load_real_leads(organization_id: str) -> pd.DataFrame:
    engine = create_engine(os.environ["DATABASE_URL_SYNC"])
    query = """
        SELECT id AS lead_id, status
        FROM leads
        WHERE organization_id = %(org_id)s
    """
    df = pd.read_sql(query, engine, params={"org_id": organization_id})
    df["lead_id"] = df["lead_id"].astype(str)
    return df