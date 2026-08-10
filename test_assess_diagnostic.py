"""Deep diagnostic: trace every step of run_lead_assessment"""
import httpx, json, sys, asyncio
sys.stdout.reconfigure(encoding='utf-8')

LEAD_ID = "9e283150-fa9b-42dd-9d61-5e6ef254558f"
BACKEND = "http://localhost:8000"
AI = "http://localhost:8001"

r = httpx.post(f"{BACKEND}/api/v1/auth/login", json={"email": "sales@gmail.com", "password": "Sales@123456"}, timeout=10)
token = r.json()["data"]["access_token"]
H = {"Authorization": f"Bearer {token}"}

# Step 1: Get current feature vector BEFORE compute
print("=== BEFORE COMPUTE ===")
r_fv = httpx.get(f"{BACKEND}/api/v1/feature-vectors/leads/{LEAD_ID}", headers=H, timeout=10)
if r_fv.status_code == 200:
    fv_before = r_fv.json().get("data", {})
    print(f"  Feature Vector updated_at: {fv_before.get('updated_at')}")
    print(f"  intent_score: {fv_before.get('ai_intent_category_score')}")
    print(f"  initiative: {fv_before.get('customer_initiative_score')}")
    print(f"  decay: {fv_before.get('engagement_decay_penalty')}")
    print(f"  company_size: {fv_before.get('company_size_score')}")
    print(f"  trigger: {fv_before.get('assessment_trigger')}")
else:
    print(f"  No feature vector: {r_fv.text[:200]}")

# Step 1b: Get current lead scores BEFORE
r_ls = httpx.get(f"{BACKEND}/api/v1/lead-scores/leads/{LEAD_ID}", headers=H, timeout=10)
if r_ls.status_code == 200:
    ls_before = r_ls.json().get("data", {})
    print(f"\n  Lead Score - fit={ls_before.get('fit_score')} eng={ls_before.get('engagement_score')} overall={ls_before.get('overall_score')} tier={ls_before.get('priority_tier')}")
    print(f"  scored_at: {ls_before.get('scored_at')}")
else:
    print(f"  No lead scores: {r_ls.text[:200]}")

# Step 2: Compute (triggers full pipeline)
print("\n=== RUNNING COMPUTE ===")
r_compute = httpx.post(f"{BACKEND}/api/v1/feature-vectors/leads/{LEAD_ID}/compute", headers=H, timeout=30)
print(f"  Status: {r_compute.status_code}")
compute_data = r_compute.json()
print(f"  Message: {compute_data.get('message')}")
if compute_data.get("data"):
    fv_compute = compute_data["data"]
    print(f"  returned updated_at: {fv_compute.get('updated_at')}")
    print(f"  returned intent_score: {fv_compute.get('ai_intent_category_score')}")

# Step 3: Get feature vector AFTER compute (separate request)
print("\n=== AFTER COMPUTE (separate GET) ===")
import time
time.sleep(1)  # give time for commit
r_fv2 = httpx.get(f"{BACKEND}/api/v1/feature-vectors/leads/{LEAD_ID}", headers=H, timeout=10)
if r_fv2.status_code == 200:
    fv_after = r_fv2.json().get("data", {})
    print(f"  Feature Vector updated_at: {fv_after.get('updated_at')}")
    print(f"  intent_score: {fv_after.get('ai_intent_category_score')}")
    print(f"  initiative: {fv_after.get('customer_initiative_score')}")
    print(f"  decay: {fv_after.get('engagement_decay_penalty')}")
    print(f"  trigger: {fv_after.get('assessment_trigger')}")
else:
    print(f"  No feature vector: {r_fv2.text[:200]}")

r_ls2 = httpx.get(f"{BACKEND}/api/v1/lead-scores/leads/{LEAD_ID}", headers=H, timeout=10)
if r_ls2.status_code == 200:
    ls_after = r_ls2.json().get("data", {})
    print(f"\n  Lead Score - fit={ls_after.get('fit_score')} eng={ls_after.get('engagement_score')} overall={ls_after.get('overall_score')} tier={ls_after.get('priority_tier')}")
    print(f"  scored_at: {ls_after.get('scored_at')}")
else:
    print(f"  No lead scores: {r_ls2.text[:200]}")

# Step 4: Check if anything changed
print("\n=== CHANGE DETECTION ===")
if r_fv.status_code == 200 and r_fv2.status_code == 200:
    fv_b = r_fv.json().get("data", {})
    fv_a = r_fv2.json().get("data", {})
    changes = []
    for key in fv_a:
        if fv_b.get(key) != fv_a.get(key):
            changes.append(f"  {key}: {fv_b.get(key)} -> {fv_a.get(key)}")
    if changes:
        print("  Changes detected:")
        for c in changes:
            print(c)
    else:
        print("  NO CHANGES DETECTED!")

# Step 5: Test AI service directly with same payload as backend would send
print("\n=== AI SERVICE DIRECT TEST (same trigger=lead_updated) ===")
# When trigger=lead_updated, engagement is NOT computed, so no email stats, no intent
payload_lead_updated = {
    "lead_id": LEAD_ID,
    "employees": None, "industry": None, "current_crm": None,
    "operational_system": None, "current_stage": "new",
    "deal_value": None, "tags": None,
    "inbound_count": 0, "initiated_count": 0,
}
r5 = httpx.post(f"{AI}/api/v1/leads/assess", json=payload_lead_updated, timeout=30)
print(f"  Status: {r5.status_code}")
if r5.status_code == 200:
    d = r5.json()
    print(f"  fit={d['fit']['score']} eng={d['engagement']['score']} overall={d['overall']['score']} tier={d['overall']['tier']}")
    print(f"  intent_score={d['engagement']['features']['intent_score']} initiative={d['engagement']['features']['initiative_score']}")
    print(f"  rec={d['recommendation']['action']}")
else:
    print(f"  {r5.text[:500]}")

# Step 6: Also test with email stats (like inbound_email trigger would)
print("\n=== AI SERVICE DIRECT TEST (with email stats) ===")
payload_inbound = {
    "lead_id": LEAD_ID,
    "employees": None, "industry": None, "current_crm": None,
    "operational_system": None, "current_stage": "new",
    "deal_value": None, "tags": None,
    "inbound_count": 5, "initiated_count": 3,
    "outbound_email_count": 2, "days_since_last_outbound": 1,
    "last_inbound_at": "2026-08-07T12:00:00Z",
    "intent": "buy"
}
r6 = httpx.post(f"{AI}/api/v1/leads/assess", json=payload_inbound, timeout=30)
print(f"  Status: {r6.status_code}")
if r6.status_code == 200:
    d = r6.json()
    print(f"  fit={d['fit']['score']} eng={d['engagement']['score']} overall={d['overall']['score']} tier={d['overall']['tier']}")
    print(f"  intent_score={d['engagement']['features']['intent_score']} initiative={d['engagement']['features']['initiative_score']}")
    print(f"  rec={d['recommendation']['action']}")
else:
    print(f"  {r6.text[:500]}")

# Step 7: Compare what AI returns for lead_updated vs what's stored
print("\n=== COMPARISON: AI response vs DB ===")
if r5.status_code == 200:
    ai_resp = r5.json()
    ai_fv = {
        "company_size_score": ai_resp["fit"]["features"]["company_size_score"],
        "industry_complexity_score": ai_resp["fit"]["features"]["industry_complexity_score"],
        "ai_intent_category_score": ai_resp["engagement"]["features"]["intent_score"],
        "buying_stage_score": ai_resp["engagement"]["features"]["buying_stage_score"],
        "customer_initiative_score": ai_resp["engagement"]["features"]["initiative_score"],
        "engagement_decay_penalty": ai_resp["engagement"]["features"]["decay_penalty"],
    }
    print(f"  AI would return: {json.dumps(ai_fv, default=str)}")
    if r_fv2.status_code == 200:
        db_fv = r_fv2.json().get("data", {})
        db_compare = {k: db_fv.get(k) for k in ai_fv}
        print(f"  DB currently has: {json.dumps(db_compare, default=str)}")
        for k in ai_fv:
            if ai_fv[k] != db_compare.get(k):
                print(f"  MISMATCH: {k}: AI={ai_fv[k]} DB={db_compare.get(k)}")
