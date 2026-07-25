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
            conn.execute(text("""
                INSERT INTO feature_vectors (
                    lead_id, organization_id, feature_version, generated_at,
                    company_size_score, industry_complexity_score,
                    operational_system_score, software_gap_score,
                    customization_potential_score,
                    average_response_time, response_time_score, reply_recency_score,
                    days_since_last_outbound, engagement_decay_penalty,
                    customer_initiative_score, buying_stage_score,
                    intent_strength_score, engagement_trend_score,
                    ai_intent_category, ai_intent_category_score
                ) VALUES (
                    :lead_id, :organization_id, :feature_version, :generated_at,
                    :company_size_score, :industry_complexity_score,
                    :operational_system_score, :software_gap_score,
                    :customization_potential_score,
                    :average_response_time, :response_time_score, :reply_recency_score,
                    :days_since_last_outbound, :engagement_decay_penalty,
                    :customer_initiative_score, :buying_stage_score,
                    :intent_strength_score, :engagement_trend_score,
                    :ai_intent_category, :ai_intent_category_score
                )
            """), row.to_dict())
    print("Feature vectors upserted into database.")