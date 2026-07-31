import os
import argparse
import pandas as pd

pd.set_option("display.max_columns", None)
pd.set_option("display.width", None)

from db_adapter import load_real_emails, load_real_leads
from engagement_features import (
    average_response_time, response_time_score, reply_recency_score,
    days_since_last_outbound, engagement_decay_penalty,
    customer_initiative_score, buying_stage_score, intent_strength_score,
    engagement_trend_score,
)
from fit_features import (
    company_size_score, industry_complexity_score,
    operational_system_score, software_gap_score,
    customization_potential_score,
)
from load_features import save_feature_vectors_csv, upsert_feature_vectors_db

parser = argparse.ArgumentParser()
parser.add_argument("--org-id", required=True)
parser.add_argument("--lead-id", default=None, help="Recompute a single lead instead of the whole org")
args = parser.parse_args()
ORG_ID = args.org_id

emails = load_real_emails(ORG_ID)
leads = load_real_leads(ORG_ID)
leads_lookup = leads.set_index("lead_id").to_dict(orient="index")

if args.lead_id:
    emails = emails[emails["lead_id"] == str(args.lead_id)]
    leads_lookup = {str(args.lead_id): leads_lookup.get(str(args.lead_id), {})}

rows = []
for lead_id, group in emails.groupby("lead_id"):
    lead_info = leads_lookup.get(lead_id, {})
    stage = lead_info.get("status")
    avg_resp = average_response_time(group)
    days_idle = days_since_last_outbound(group)

    industry_score = industry_complexity_score(lead_info.get("industry"))
    opsys_score = operational_system_score(lead_info.get("operational_system"))
    size_score = company_size_score(lead_info.get("employee_count"))
    gap_score = software_gap_score(lead_info.get("current_crm"))
    custom_score = customization_potential_score(industry_score, opsys_score, gap_score)

    rows.append({
        "lead_id": lead_id,
        "organization_id": ORG_ID,
        "feature_version": "v1_real",
        "created_by": None,

        "company_size_score": size_score,
        "industry_complexity_score": industry_score,
        "software_gap_score": gap_score,
        "operational_system_score": opsys_score,
        "customization_potential_score": custom_score,

        "average_response_time": avg_resp,
        "response_time_score": response_time_score(avg_resp),
        "days_since_last_outbound": days_idle,
        "engagement_decay_penalty": engagement_decay_penalty(days_idle),
        "ai_intent_category_score": None,
        "buying_stage_score": buying_stage_score(stage),
        "customer_initiative_score": customer_initiative_score(group),
        # Trend requires historical intent; until LLM intent is plumbed, use the
        # current buying-stage score as both endpoints -> stable (50) rather than
        # a fake "None" that always mapped to 50 anyway.
        "engagement_trend_score": engagement_trend_score(buying_stage_score(stage), buying_stage_score(stage)),
    })

out = pd.DataFrame(rows)
save_feature_vectors_csv(out)
upsert_feature_vectors_db(out)
print(out)