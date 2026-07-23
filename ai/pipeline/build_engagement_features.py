import pandas as pd
from datetime import datetime

from engagement_features import (
    average_response_time,
    reply_recency_score,
    customer_initiative_score,
    buying_stage_score,
    intent_strength_score,
)


def build_engagement_features(leads, emails):

    engagement_rows = []

    for _, lead in leads.iterrows():

        lead_emails = emails[emails["lead_id"] == lead["lead_id"]]

        avg_response = average_response_time(lead_emails)

        reply_score = reply_recency_score(lead_emails)

        initiative = customer_initiative_score(lead_emails)

        buying_score = buying_stage_score(
            lead.get("buying_stage")
        )

        intent_score = intent_strength_score(
            lead.get("buying_stage")
        )
        engagement_rows.append({

            "lead_id": lead["lead_id"],

            "feature_version": "v1",

            "generated_at": datetime.now(),

            "average_response_time": avg_response,

            "reply_recency_score": reply_score,

            "customer_initiative_score": initiative,

            "buying_stage_score": buying_score,

            "intent_strength_score": intent_score

        })

    return pd.DataFrame(engagement_rows)