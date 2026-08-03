from db_adapter import load_real_emails
from engagement_features import average_response_time, reply_recency_score, customer_initiative_score

import pandas as pd
pd.set_option("display.max_columns", None)
pd.set_option("display.width", None)

real_emails = load_real_emails("3a2ea57d-818f-49f3-8d88-a30844da57dc")
print(real_emails)  # print everything first, no filtering yet

lead_emails = real_emails[real_emails["lead_id"] == "3fa85f64-5717-4562-b3fc-2c963f66afa6"]

print("row count:", len(lead_emails))
print("directions:", lead_emails["direction"].value_counts())
print()
print("avg_response_time:", average_response_time(lead_emails))
print("reply_recency_score:", reply_recency_score(lead_emails))
print("customer_initiative_score:", customer_initiative_score(lead_emails))