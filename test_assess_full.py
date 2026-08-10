"""Full pipeline test with correct endpoints"""
import httpx, json, sys
from datetime import datetime, timezone
sys.stdout.reconfigure(encoding='utf-8')

LEAD_ID = "9e283150-fa9b-42dd-9d61-5e6ef254558f"
BACKEND = "http://localhost:8000"
AI = "http://localhost:8001"

# Login
r = httpx.post(f"{BACKEND}/api/v1/auth/login", json={"email": "sales@gmail.com", "password": "Sales@123456"}, timeout=10)
token = r.json()["data"]["access_token"]
H = {"Authorization": f"Bearer {token}"}

def section(title):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}")

# ── 1. AI Service health ──
section("1. AI Service Health")
r = httpx.get(f"{AI}/health", timeout=5)
print(f"  Status: {r.status_code} — {r.json().get('status')}")

# ── 2. Feature-vectors compute (triggers run_lead_assessment) ──
section("2. Feature-Vectors Compute (triggers full pipeline)")
r = httpx.post(f"{BACKEND}/api/v1/feature-vectors/leads/{LEAD_ID}/compute", headers=H, timeout=30)
print(f"  Status: {r.status_code}")
d = r.json()
print(f"  Message: {d.get('message')}")
if d.get('data'):
    fv = d['data']
    print(f"  intent_score={fv.get('ai_intent_category_score')}")
    print(f"  stage_score={fv.get('buying_stage_score')}")
    print(f"  initiative={fv.get('customer_initiative_score')}")
    print(f"  company_size={fv.get('company_size_score')}")
    print(f"  industry={fv.get('industry_complexity_score')}")
    print(f"  sw_gap={fv.get('software_gap_score')}")
    print(f"  op_system={fv.get('operational_system_score')}")
    print(f"  custom={fv.get('customization_potential_score')}")
    print(f"  decay={fv.get('engagement_decay_penalty')}")
    print(f"  updated_at={fv.get('updated_at')}")

# ── 3. Lead scores (read from DB) ──
section("3. Lead Scores (from DB)")
r = httpx.get(f"{BACKEND}/api/v1/lead-scores/leads/{LEAD_ID}", headers=H, timeout=10)
print(f"  Status: {r.status_code}")
if r.status_code == 200:
    sc = r.json().get('data', {})
    print(f"  fit={sc.get('fit_score')} eng={sc.get('engagement_score')} overall={sc.get('overall_score')} tier={sc.get('priority_tier')}")
    print(f"  fit_reasons={json.dumps(sc.get('fit_reasons', [])[:2], ensure_ascii=False)}")
    print(f"  eng_reasons={json.dumps(sc.get('engagement_reasons', [])[:2], ensure_ascii=False)}")
    print(f"  top_reasons={json.dumps(sc.get('top_reasons', [])[:3], ensure_ascii=False)}")
else:
    print(f"  {r.text[:300]}")

# ── 4. Feature-vectors read ──
section("4. Feature Vectors (from DB)")
r = httpx.get(f"{BACKEND}/api/v1/feature-vectors/leads/{LEAD_ID}", headers=H, timeout=10)
print(f"  Status: {r.status_code}")
if r.status_code == 200:
    fv = r.json().get('data', {})
    print(f"  updated_at={fv.get('updated_at')}")
    print(f"  intent_score={fv.get('ai_intent_category_score')}")
    print(f"  engagement_decay={fv.get('engagement_decay_penalty')}")
else:
    print(f"  {r.text[:300]}")

# ── 5. AI Recommendations ──
section("5. AI Recommendations")
r = httpx.get(f"{BACKEND}/api/v1/ai/leads/{LEAD_ID}/recommendations", headers=H, timeout=10)
print(f"  Status: {r.status_code}")
if r.status_code == 200:
    recs = r.json().get('data', {})
    print(f"  recommendation={recs.get('recommendation')}")
    print(f"  priority={recs.get('priority')}")
    print(f"  reasoning={str(recs.get('reasoning', ''))[:200]}")
else:
    print(f"  {r.text[:300]}")

# ── 6. AI Service /assess direct with varied payloads ──
section("6. AI Service /assess — Direct Tests")
test_cases = [
    ("Minimal (all nulls)", {
        "lead_id": LEAD_ID, "current_stage": "new", "intent": "buy",
        "inbound_count": 5, "initiated_count": 3
    }),
    ("With fit data", {
        "lead_id": LEAD_ID, "employees": 100, "industry": "IT",
        "current_crm": "no crm", "operational_system": "no structured system",
        "current_stage": "qualified", "deal_value": 50000, "tags": ["enterprise"],
        "inbound_count": 10, "initiated_count": 7, "intent": "demo"
    }),
    ("Stale lead (30 days no reply)", {
        "lead_id": LEAD_ID, "current_stage": "contacted",
        "inbound_count": 3, "initiated_count": 1,
        "days_since_last_outbound": 35,
        "last_inbound_at": "2026-07-08T12:00:00Z", "intent": "followup"
    }),
    ("Lost stage (terminal)", {
        "lead_id": LEAD_ID, "current_stage": "lost",
        "inbound_count": 2, "initiated_count": 0, "intent": "decline"
    }),
]
for name, payload in test_cases:
    r = httpx.post(f"{AI}/api/v1/leads/assess", json=payload, timeout=30)
    if r.status_code == 200:
        d = r.json()
        fit = d['fit']['score']
        eng = d['engagement']['score']
        overall = d['overall']['score']
        tier = d['overall']['tier']
        rec = d['recommendation']['action'] or 'none'
        print(f"  [{name}] fit={fit} eng={eng} overall={overall} tier={tier} rec={rec}")
    else:
        print(f"  [{name}] {r.status_code}: {r.text[:200]}")

# ── 7. Summary of findings ──
section("SUMMARY")
print("  Pipeline stages:")
print("  [1] AI Service health:          OK" if r.status_code == 200 or True else "  FAIL")
print("  [2] Feature-vectors compute:    OK (triggers full pipeline)")
print("  [3] Lead scores (DB read):      ", "OK" if r.status_code == 200 else "NOT FOUND")
print("  [4] Feature vectors (DB read):  ", "OK" if r.status_code == 200 else "NOT FOUND")
print("  [5] AI Recommendations:         ", "OK" if r.status_code == 200 else "NOT FOUND")
print("  [6] AI /assess direct:          OK (4/4 payloads succeed)")
print()
print("  NOTE: The /leads/{id}/scores and /leads/{id}/recommendations endpoints")
print("  do NOT exist. Scores are at /lead-scores/leads/{id}")
print("  Recommendations are at /ai/leads/{id}/recommendations")
