import os
import pandas as pd
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()


def save_feature_vectors_csv(df: pd.DataFrame):
    output_dir = os.path.join("ai", "mock_data")
    df.to_csv(os.path.join(output_dir, "feature_vectors.csv"), index=False)
    df.to_json(os.path.join(output_dir, "feature_vectors.json"), orient="records", indent=4)
    print("Feature vectors saved to CSV/JSON.")


def upsert_feature_vectors_db(df: pd.DataFrame):
    engine = create_engine(os.environ["DATABASE_URL_SYNC"])
    with engine.begin() as conn:
        for _, row in df.iterrows():
            data = row.to_dict()
            conn.execute(text("""
                INSERT INTO feature_vectors (
                    lead_id, organization_id, created_by,
                    average_response_time, response_time_score,
                    days_since_last_outbound, engagement_decay_penalty,
                    ai_intent_category_score, buying_stage_score,
                    customer_initiative_score, engagement_trend_score,
                    company_size_score, industry_complexity_score,
                    software_gap_score, operational_system_score,
                    customization_potential_score
                ) VALUES (
                    :lead_id, :organization_id, :created_by,
                    :average_response_time, :response_time_score,
                    :days_since_last_outbound, :engagement_decay_penalty,
                    :ai_intent_category_score, :buying_stage_score,
                    :customer_initiative_score, :engagement_trend_score,
                    :company_size_score, :industry_complexity_score,
                    :software_gap_score, :operational_system_score,
                    :customization_potential_score
                )
                ON CONFLICT (lead_id) DO UPDATE SET
                    average_response_time = EXCLUDED.average_response_time,
                    response_time_score = EXCLUDED.response_time_score,
                    days_since_last_outbound = EXCLUDED.days_since_last_outbound,
                    engagement_decay_penalty = EXCLUDED.engagement_decay_penalty,
                    ai_intent_category_score = EXCLUDED.ai_intent_category_score,
                    buying_stage_score = EXCLUDED.buying_stage_score,
                    customer_initiative_score = EXCLUDED.customer_initiative_score,
                    engagement_trend_score = EXCLUDED.engagement_trend_score,
                    company_size_score = EXCLUDED.company_size_score,
                    industry_complexity_score = EXCLUDED.industry_complexity_score,
                    software_gap_score = EXCLUDED.software_gap_score,
                    operational_system_score = EXCLUDED.operational_system_score,
                    customization_potential_score = EXCLUDED.customization_potential_score,
                    updated_at = now()
            """), data)
    print("Feature vectors upserted (one row per lead, updated in place).")