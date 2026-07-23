from load_features import save_feature_vectors
from data_source import (
    get_leads,
    get_companies,
    get_activities,
    get_emails,
)

from features import (
    company_size_band,
    source_quality,
    engagement_score,
    engagement_level,
    reply_rate,
    reply_level,
    recency_days,
)
from build_fit_features import build_fit_features
from build_engagement_features import build_engagement_features
import pandas as pd

SOURCE = "database"  # Change to "mock" for mock data
def build_feature_vectors(source=SOURCE):

    leads = get_leads(source)
    companies = get_companies(source)
    activities = get_activities(source)
    # Temporary: database emails table is empty.
    # Use mock emails until backend populates email data.
    if source == "mock":
        emails = get_emails("mock")
    else:
        emails = get_emails("database")

    

    merged = leads.merge(companies, on="company_id")

    

    feature_vectors = []

    for _, lead in merged.iterrows():

        lead_id = lead["lead_id"]

        lead_activities = activities[
            activities["lead_id"] == lead_id
        ]

        lead_emails = emails[
            emails["lead_id"] == lead_id
        ]

        company_band = company_size_band(
            lead["size"]
        )

        source_score = source_quality(
            lead["source"]
        )

        engagement = engagement_score(
            lead_emails
        )

        engagement_status = engagement_level(
            engagement
        )

        reply_score = reply_rate(
            lead_emails
        )

        reply_status = reply_level(
            reply_score
        )

        recency = recency_days(
            lead_activities
        )

        feature_vector = {

            "lead_id": lead_id,

            "feature_version": "v1",

            "generated_at": str(pd.Timestamp.now()),

            "company": lead["name"],

            "company_band": company_band,

            "source": lead["source"],

            "source_score": source_score,

            "engagement_score": engagement,

            "engagement_level": engagement_status,

            "reply_rate": reply_score,

            "reply_level": reply_status,

            "recency_days": recency

        }

        feature_vectors.append(feature_vector)

    # RETURN AFTER LOOP
    return pd.DataFrame(feature_vectors)


if __name__ == "__main__":

    # Load data
    leads = get_leads(SOURCE)
    companies = get_companies(SOURCE)
    activities = get_activities(SOURCE)

    if SOURCE == "mock":
        emails = get_emails("mock")
    else:
        emails = get_emails("database")

    # -----------------------------------
    # Build Original Feature Vectors
    # -----------------------------------

    features_df = build_feature_vectors(source=SOURCE)

    print("\n===== FEATURE VECTORS =====\n")
    print(features_df.to_string(index=False))

    save_feature_vectors(features_df)

    # -----------------------------------
    # Build Fit Features
    # -----------------------------------

    fit_df = build_fit_features(
        leads,
        companies
    )

    print("\n===== FIT FEATURES =====\n")
    print(fit_df.to_string(index=False))

    fit_df.to_csv(
        "ai/mock_data/fit_features.csv",
        index=False
    )

    fit_df.to_json(
        "ai/mock_data/fit_features.json",
        orient="records",
        indent=4,
        date_format="iso"
    )

    # -----------------------------------
    # Build Engagement Features
    # -----------------------------------

    engagement_df = build_engagement_features(
        leads,
        emails
    )

    print("\n===== ENGAGEMENT FEATURES =====\n")
    print(engagement_df.to_string(index=False))

    engagement_df.to_csv(
        "ai/mock_data/engagement_features.csv",
        index=False
    )

    engagement_df.to_json(
        "ai/mock_data/engagement_features.json",
        orient="records",
        indent=4,
        date_format="iso"
    )

    print("\nAll feature pipelines executed successfully.")