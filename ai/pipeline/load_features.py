import os
import pandas as pd
from sqlalchemy import create_engine, text

def save_feature_vectors(df):

    output_dir = os.path.join("ai", "mock_data")

    csv_path = os.path.join(output_dir, "feature_vectors.csv")
    json_path = os.path.join(output_dir, "feature_vectors.json")

    df.to_csv(csv_path, index=False)

    df.to_json(
        json_path,
        orient="records",
        indent=4
    )

    print("Feature vectors saved successfully.")



def upsert_feature_vectors(df: pd.DataFrame):
    engine = create_engine(os.environ["DATABASE_URL_SYNC"])
    with engine.begin() as conn:
        for _, row in df.iterrows():
            conn.execute(text("""
                INSERT INTO feature_vectors (
                    lead_id, organization_id, feature_version, generated_at,
                    average_response_time, response_time_score, reply_recency_score,
                    days_since_last_outbound, engagement_decay_penalty,
                    customer_initiative_score, buying_stage_score, intent_strength_score,
                    ai_intent_category, ai_intent_category_score, engagement_trend_score
                ) VALUES (
                    :lead_id, :organization_id, :feature_version, :generated_at,
                    :average_response_time, :response_time_score, :reply_recency_score,
                    :days_since_last_outbound, :engagement_decay_penalty,
                    :customer_initiative_score, :buying_stage_score, :intent_strength_score,
                    :ai_intent_category, :ai_intent_category_score, :engagement_trend_score
                )
            """), row.to_dict())