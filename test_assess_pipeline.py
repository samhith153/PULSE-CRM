"""
End-to-end test: Inbound email → Summarize → Assess pipeline.

Tests each stage individually and logs results to test_assess_results.log.
"""
import httpx
import json
import sys
import time
from datetime import datetime, timezone, timedelta

sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')

RESULTS_FILE = "test_assess_results.log"
BACKEND_URL = "http://localhost:8000"
AI_URL = "http://localhost:8001"

TEST_LEAD_ID = "9e283150-fa9b-42dd-9d61-5e6ef254558f"
TEST_ORG_ID = "5e7614cc-0b8f-4cd3-93d2-01b00f8063d0"
TEST_EMAIL = "sales@gmail.com"
TEST_PASSWORD = "Sales@123456"

results = []


def log_result(stage, status, detail=""):
    entry = f"[{datetime.now().isoformat()}] [{stage}] {status} | {detail}"
    results.append(entry)
    print(entry)


def save_results():
    with open(RESULTS_FILE, "w", encoding="utf-8") as f:
        f.write("\n".join(results))
    print(f"\nResults saved to {RESULTS_FILE}")


# ── Stage 1: Check services are up ──────────────────────────────────────
def test_services():
    log_result("STAGE_1", "=== Checking services ===")

    try:
        r = httpx.get(f"{AI_URL}/health", timeout=5)
        log_result("AI_SERVICE", "UP" if r.status_code == 200 else f"DOWN ({r.status_code})", r.text[:200])
    except Exception as e:
        log_result("AI_SERVICE", "DOWN", str(e))
        return False

    try:
        r = httpx.get(f"{BACKEND_URL}/docs", timeout=5, follow_redirects=True)
        log_result("BACKEND", "UP" if r.status_code == 200 else f"STATUS {r.status_code}", "")
    except Exception as e:
        log_result("BACKEND", "DOWN", str(e))
        return False

    return True


# ── Stage 2: Login and get token ────────────────────────────────────────
def login():
    log_result("STAGE_2", "=== Logging in ===")
    try:
        r = httpx.post(f"{BACKEND_URL}/api/v1/auth/login", json={
            "email": TEST_EMAIL, "password": TEST_PASSWORD
        }, timeout=10)
        if r.status_code == 200:
            resp = r.json()
            data = resp.get("data", resp)
            token = data.get("access_token") or data.get("token")
            log_result("LOGIN", "OK", f"token={token[:20]}..." if token else f"no token, keys={list(resp.keys())}")
            return token
        else:
            log_result("LOGIN", f"FAIL ({r.status_code})", r.text[:500])
            return None
    except Exception as e:
        log_result("LOGIN", "ERROR", str(e))
        return None


# ── Stage 3: Get lead data ─────────────────────────────────────────────
def get_lead(token):
    log_result("STAGE_3", "=== Fetching lead data ===")
    headers = {"Authorization": f"Bearer {token}"}
    try:
        r = httpx.get(f"{BACKEND_URL}/api/v1/leads/{TEST_LEAD_ID}", headers=headers, timeout=10)
        if r.status_code == 200:
            lead = r.json()
            log_result("GET_LEAD", "OK", f"title={lead.get('title')} status={lead.get('status')} email={lead.get('email')}")
            return lead
        else:
            log_result("GET_LEAD", f"FAIL ({r.status_code})", r.text[:500])
            return None
    except Exception as e:
        log_result("GET_LEAD", "ERROR", str(e))
        return None


# ── Stage 4: Test AI service /assess directly ──────────────────────────
def test_ai_assess_directly():
    log_result("STAGE_4", "=== Testing AI service /assess directly ===")

    test_cases = [
        {
            "name": "Typical inbound (intent=buy, stage=new, 5 inbound/3 initiated)",
            "payload": {
                "lead_id": TEST_LEAD_ID,
                "employees": None, "industry": None, "current_crm": None,
                "operational_system": None, "current_stage": "new",
                "deal_value": None, "tags": None,
                "inbound_count": 5, "initiated_count": 3,
                "outbound_email_count": 2, "days_since_last_outbound": 1,
                "last_inbound_at": datetime.now(timezone.utc).isoformat(),
                "intent": "buy"
            }
        },
        {
            "name": "With employee data (100 employees, IT industry, no CRM)",
            "payload": {
                "lead_id": TEST_LEAD_ID,
                "employees": 100, "industry": "IT", "current_crm": "no crm",
                "operational_system": "no structured system", "current_stage": "qualified",
                "deal_value": 50000, "tags": ["enterprise"],
                "inbound_count": 10, "initiated_count": 7,
                "outbound_email_count": 3, "days_since_last_outbound": 0,
                "last_inbound_at": datetime.now(timezone.utc).isoformat(),
                "intent": "demo"
            }
        },
        {
            "name": "Edge case: no emails, no intent, null everything",
            "payload": {
                "lead_id": TEST_LEAD_ID,
                "employees": None, "industry": None, "current_crm": None,
                "operational_system": None, "current_stage": "new",
                "deal_value": None, "tags": None,
                "inbound_count": 0, "initiated_count": 0,
                "outbound_email_count": 0, "days_since_last_outbound": None,
                "last_inbound_at": None, "intent": None
            }
        },
        {
            "name": "Edge case: tags=None, is_outbound missing (mimics backend payload)",
            "payload": {
                "lead_id": TEST_LEAD_ID,
                "employees": None, "industry": None, "current_crm": None,
                "operational_system": None, "current_stage": "new",
                "deal_value": None, "tags": None,
                "inbound_count": 2, "initiated_count": 1,
                "outbound_email_count": 1, "days_since_last_outbound": 3,
                "last_inbound_at": (datetime.now(timezone.utc) - timedelta(days=3)).isoformat(),
                "intent": "followup"
            }
        },
    ]

    for tc in test_cases:
        log_result("AI_TEST", f"--- {tc['name']} ---")
        try:
            r = httpx.post(f"{AI_URL}/api/v1/leads/assess", json=tc["payload"], timeout=30)
            if r.status_code == 200:
                body = r.json()
                fit = body.get("fit", {}).get("score", "?")
                eng = body.get("engagement", {}).get("score", "?")
                overall = body.get("overall", {}).get("score", "?")
                tier = body.get("overall", {}).get("tier", "?")
                rec = body.get("recommendation", {}).get("action", "none")
                log_result("AI_TEST", f"200 OK — fit={fit} eng={eng} overall={overall} tier={tier} rec={rec}")
            else:
                log_result("AI_TEST", f"{r.status_code} FAIL", r.text[:1000])
        except Exception as e:
            log_result("AI_TEST", "ERROR", str(e))


# ── Stage 5: Test backend /feature-vectors/leads/{id}/compute endpoint ──
def test_backend_assess(token):
    log_result("STAGE_5", "=== Testing backend lead assessment (feature-vectors compute) ===")
    headers = {"Authorization": f"Bearer {token}"}
    try:
        r = httpx.post(f"{BACKEND_URL}/api/v1/feature-vectors/leads/{TEST_LEAD_ID}/compute",
                       headers=headers, timeout=30)
        log_result("BACKEND_ASSESS", f"{r.status_code}", r.text[:1000])
    except Exception as e:
        log_result("BACKEND_ASSESS", "ERROR", str(e))


# ── Stage 6: Test the email stats endpoint ─────────────────────────────
def test_email_stats(token):
    log_result("STAGE_6", "=== Testing email stats ===")
    headers = {"Authorization": f"Bearer {token}"}
    try:
        r = httpx.get(f"{BACKEND_URL}/api/v1/leads/{TEST_LEAD_ID}/email-stats",
                      headers=headers, timeout=10)
        if r.status_code == 200:
            stats = r.json()
            log_result("EMAIL_STATS", "OK", json.dumps(stats, default=str)[:500])
        else:
            log_result("EMAIL_STATS", f"{r.status_code}", r.text[:500])
    except Exception as e:
        log_result("EMAIL_STATS", "ERROR", str(e))


# ── Stage 7: Test the backfill endpoint (triggers summarize + assess) ──
def test_backfill(token):
    log_result("STAGE_7", "=== Testing backfill (summarize + assess) ===")
    headers = {"Authorization": f"Bearer {token}"}
    try:
        r = httpx.post(f"{BACKEND_URL}/api/v1/emails/backfill/{TEST_LEAD_ID}",
                       headers=headers, timeout=60)
        log_result("BACKFILL", f"{r.status_code}", r.text[:1000])
    except Exception as e:
        log_result("BACKFILL", "ERROR", str(e))


# ── Main ────────────────────────────────────────────────────────────────
def main():
    log_result("MAIN", "=== PULSE-CRM Pipeline E2E Test ===")
    log_result("MAIN", f"Backend: {BACKEND_URL}, AI: {AI_URL}")
    log_result("MAIN", f"Lead: {TEST_LEAD_ID}")

    # Step 1: Services up?
    if not test_services():
        log_result("MAIN", "ABORT — services not running")
        save_results()
        return

    # Step 2: Login
    token = login()
    if not token:
        log_result("MAIN", "ABORT — login failed")
        save_results()
        return

    # Step 3: Get lead
    lead = get_lead(token)

    # Step 4: Test AI service directly
    test_ai_assess_directly()

    # Step 5: Test backend assess
    test_backend_assess(token)

    # Step 6: Email stats
    test_email_stats(token)

    # Step 7: Backfill (full pipeline)
    test_backfill(token)

    log_result("MAIN", "=== Test complete ===")
    save_results()


if __name__ == "__main__":
    main()
