import os
import pandas as pd
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()


def _sync_db_url() -> str:
    sync = os.environ.get("DATABASE_URL_SYNC")
    if sync:
        return sync
    async_url = os.environ.get("DATABASE_URL", "")
    if not async_url:
        raise RuntimeError("DATABASE_URL is not configured")
    if "+asyncpg" in async_url:
        return async_url.replace("+asyncpg", "+psycopg")
    if async_url.startswith("postgresql://"):
        return async_url.replace("postgresql://", "postgresql+psycopg://", 1)
    return async_url


def _get_engine():
    return create_engine(_sync_db_url(), pool_size=1, max_overflow=2, pool_pre_ping=True)


def save_feature_vectors_csv(df: pd.DataFrame, path: str = "feature_vectors.csv") -> None:
    df.to_csv(path, index=False)
    print(f"Saved {len(df)} feature vectors to {path}")


UPSERT_SQL = text("""
    INSERT INTO feature_vectors (
        lead_id, organization_id, feature_version, created_by,
        company_size_score, industry_complexity_score, software_gap_score,
        operational_system_score, customization_potential_score,
        average_response_time, response_time_score, num_response_pairs,
        last_processed_sent_at,
        days_since_last_outbound, engagement_decay_penalty,
        ai_intent_category_score, buying_stage_score,
        customer_initiative_score, engagement_trend_score
    ) VALUES (
        :lead_id, :org_id, :feature_version, :created_by,
        :company_size_score, :industry_complexity_score, :software_gap_score,
        :operational_system_score, :customization_potential_score,
        :average_response_time, :response_time_score, :num_response_pairs,
        :last_processed_sent_at,
        :days_since_last_outbound, :engagement_decay_penalty,
        :ai_intent_category_score, :buying_stage_score,
        :customer_initiative_score, :engagement_trend_score
    )
    ON CONFLICT (lead_id) DO UPDATE SET
        feature_version = EXCLUDED.feature_version,
        company_size_score = EXCLUDED.company_size_score,
        industry_complexity_score = EXCLUDED.industry_complexity_score,
        software_gap_score = EXCLUDED.software_gap_score,
        operational_system_score = EXCLUDED.operational_system_score,
        customization_potential_score = EXCLUDED.customization_potential_score,
        average_response_time = EXCLUDED.average_response_time,
        response_time_score = EXCLUDED.response_time_score,
        num_response_pairs = EXCLUDED.num_response_pairs,
        last_processed_sent_at = EXCLUDED.last_processed_sent_at,
        days_since_last_outbound = EXCLUDED.days_since_last_outbound,
        engagement_decay_penalty = EXCLUDED.engagement_decay_penalty,
        ai_intent_category_score = EXCLUDED.ai_intent_category_score,
        buying_stage_score = EXCLUDED.buying_stage_score,
        customer_initiative_score = EXCLUDED.customer_initiative_score,
        engagement_trend_score = EXCLUDED.engagement_trend_score
""")


def upsert_feature_vectors_db(df: pd.DataFrame) -> int:
    engine = _get_engine()
    upserted = 0

    with engine.begin() as conn:
        for _, row in df.iterrows():
            conn.execute(UPSERT_SQL, {
                "lead_id": row["lead_id"],
                "org_id": row["organization_id"],
                "feature_version": row.get("feature_version", "v1_real"),
                "created_by": row.get("created_by"),
                "company_size_score": row.get("company_size_score"),
                "industry_complexity_score": row.get("industry_complexity_score"),
                "software_gap_score": row.get("software_gap_score"),
                "operational_system_score": row.get("operational_system_score"),
                "customization_potential_score": row.get("customization_potential_score"),
                "average_response_time": row.get("average_response_time"),
                "response_time_score": row.get("response_time_score"),
                "num_response_pairs": row.get("num_response_pairs"),
                "last_processed_sent_at": row.get("last_processed_sent_at"),
                "days_since_last_outbound": row.get("days_since_last_outbound"),
                "engagement_decay_penalty": row.get("engagement_decay_penalty"),
                "ai_intent_category_score": row.get("ai_intent_category_score"),
                "buying_stage_score": row.get("buying_stage_score"),
                "customer_initiative_score": row.get("customer_initiative_score"),
                "engagement_trend_score": row.get("engagement_trend_score"),
            })
            upserted += 1

    engine.dispose()
    print(f"Upserted {upserted} feature vectors into database")
    return upserted
