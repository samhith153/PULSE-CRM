import os
import pandas as pd
pd.set_option("display.max_columns", None)
pd.set_option("display.width", None)



from db_adapter import load_real_emails, load_real_leads
from engagement_features import (
    average_response_time, reply_recency_score,
    customer_initiative_score, buying_stage_score, intent_strength_score,
)

ORG_ID = "3a2ea57d-818f-49f3-8d88-a30844da57dc"

emails = load_real_emails(ORG_ID)
leads = load_real_leads(ORG_ID)
leads_lookup = dict(zip(leads["lead_id"], leads["status"]))

rows = []
for lead_id, group in emails.groupby("lead_id"):
    stage = leads_lookup.get(lead_id)
    rows.append({
        "lead_id": lead_id,
        "feature_version": "v1_real",
        "generated_at": pd.Timestamp.now(),
        "average_response_time": average_response_time(group),
        "reply_recency_score": reply_recency_score(group),
        "customer_initiative_score": customer_initiative_score(group),
        "buying_stage_score": buying_stage_score(stage),
        "intent_strength_score": intent_strength_score(stage),
    })



out = pd.DataFrame(rows)

output_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "mock_data")
csv_path = os.path.join(output_dir, "engagement_features_real.csv")
json_path = os.path.join(output_dir, "engagement_features_real.json")

out.to_csv(csv_path, index=False)
out.to_json(json_path, orient="records", indent=2, date_format="iso")
print(out)
print(f"\nSaved to:\n  {os.path.abspath(csv_path)}\n  {os.path.abspath(json_path)}")                         