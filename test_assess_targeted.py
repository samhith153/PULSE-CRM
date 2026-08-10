"""Targeted test: feature-vectors compute + scores check"""
import httpx, json, sys
sys.stdout.reconfigure(encoding='utf-8')

LEAD_ID = "9e283150-fa9b-42dd-9d61-5e6ef254558f"
BACKEND = "http://localhost:8000"

# Login
r = httpx.post(f"{BACKEND}/api/v1/auth/login", json={"email": "sales@gmail.com", "password": "Sales@123456"}, timeout=10)
token = r.json()["data"]["access_token"]
H = {"Authorization": f"Bearer {token}"}

# Step 1: feature-vectors compute
print("=== Step 1: feature-vectors compute ===")
r1 = httpx.post(f"{BACKEND}/api/v1/feature-vectors/leads/{LEAD_ID}/compute", headers=H, timeout=30)
print(f"Status: {r1.status_code}")
d1 = r1.json()
print(f"Message: {d1.get('message')}")
if d1.get("data"):
    d = d1["data"]
    print(f"  intent_score={d.get('ai_intent_category_score')}, stage_score={d.get('buying_stage_score')}, initiative={d.get('customer_initiative_score')}")
    print(f"  company_size={d.get('company_size_score')}, industry={d.get('industry_complexity_score')}, sw_gap={d.get('software_gap_score')}")
    print(f"  op_system={d.get('operational_system_score')}, custom={d.get('customization_potential_score')}, decay={d.get('engagement_decay_penalty')}")

# Step 2: Get lead scores
print("\n=== Step 2: Get lead scores ===")
r2 = httpx.get(f"{BACKEND}/api/v1/leads/{LEAD_ID}/scores", headers=H, timeout=10)
print(f"Status: {r2.status_code}")
if r2.status_code == 200:
    scores = r2.json()
    if scores.get("data"):
        d = scores["data"]
        print(f"  fit={d.get('fit_score')} eng={d.get('engagement_score')} overall={d.get('overall_score')} tier={d.get('priority_tier')}")
        print(f"  fit_reasons={d.get('fit_reasons', [])[:2]}")
        print(f"  eng_reasons={d.get('engagement_reasons', [])[:2]}")
else:
    print(f"  {r2.text[:300]}")

# Step 3: Get lead recommendations
print("\n=== Step 3: Get lead recommendations ===")
r3 = httpx.get(f"{BACKEND}/api/v1/leads/{LEAD_ID}/recommendations", headers=H, timeout=10)
print(f"Status: {r3.status_code}")
if r3.status_code == 200:
    recs = r3.json()
    if recs.get("data"):
        d = recs["data"]
        print(f"  recommendation={d.get('recommendation')} priority={d.get('priority')}")
        print(f"  reasoning={d.get('reasoning', '')[:200]}")
else:
    print(f"  {r3.text[:300]}")

# Step 4: Now test the SAME payload through the AI service directly
print("\n=== Step 4: AI service direct (matching backend payload) ===")
payload = {
    "lead_id": LEAD_ID,
    "employees": d1.get("data", {}).get("company_size_score") if d1.get("data") else None,
    "industry": None,
    "current_crm": None,
    "operational_system": None,
    "current_stage": "new",
    "deal_value": None,
    "tags": None,
    "inbound_count": 5,
    "initiated_count": 3,
    "outbound_email_count": 2,
    "days_since_last_outbound": 1,
    "last_inbound_at": "2026-08-07T12:00:00Z",
    "intent": "buy"
}
r4 = httpx.post("http://localhost:8001/api/v1/leads/assess", json=payload, timeout=30)
print(f"Status: {r4.status_code}")
if r4.status_code == 200:
    d = r4.json()
    print(f"  fit={d['fit']['score']} eng={d['engagement']['score']} overall={d['overall']['score']} tier={d['overall']['tier']}")
    print(f"  rec={d['recommendation']['action']}")
else:
    print(f"  {r4.text[:500]}")

# Step 5: Check if the feature_vector table has stale data
print("\n=== Step 5: Direct feature-vector check ===")
r5 = httpx.get(f"{BACKEND}/api/v1/feature-vectors/leads/{LEAD_ID}", headers=H, timeout=10)
print(f"Status: {r5.status_code}")
if r5.status_code == 200:
    fv = r5.json()
    if fv.get("data"):
        d = fv["data"]
        print(f"  updated_at={d.get('updated_at')}")
        print(f"  intent_score={d.get('ai_intent_category_score')}")
else:
    print(f"  {r5.text[:300]}")

print("\n=== Done ===")
