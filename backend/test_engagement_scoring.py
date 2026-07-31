"""
Test script for Engagement Features + Lead Scoring pipeline.
Tests incremental running average behavior:
  - First run: 4 emails → 2 response pairs
  - Second run: add 5th email → 3 response pairs, updated avg
"""
import asyncio
import json
import os
import sys
import uuid
from datetime import datetime, timedelta, timezone

backend_dir = os.path.abspath(os.path.dirname(__file__))
root_dir = os.path.abspath(os.path.join(backend_dir, ".."))
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from dotenv import load_dotenv
load_dotenv(os.path.join(backend_dir, ".env"))

from sqlalchemy import text
from app.database.connection import engine

RESULTS_FILE = os.path.join(backend_dir, "test_engagement_results.txt")

TEST_ORG_ID = None
TEST_LEAD_ID = None
TEST_THREAD_ID = f"test_thread_{uuid.uuid4().hex[:8]}"
TEST_EMAIL_IDS = []
TEST_FV_ID = None
TEST_SCORE_ID = None

out_lines = []


def log(msg=""):
    try:
        print(msg)
    except UnicodeEncodeError:
        print(msg.encode("utf-8", errors="replace").decode("utf-8", errors="replace"))
    out_lines.append(msg)


async def get_org_id():
    async with engine.connect() as conn:
        result = await conn.execute(text("SELECT id FROM organizations LIMIT 1"))
        row = result.fetchone()
        if row:
            return row[0]
    return None


async def create_test_lead(org_id):
    lead_id = uuid.uuid4()
    now = datetime.now(timezone.utc)
    async with engine.begin() as conn:
        await conn.execute(text("""
            INSERT INTO leads (
                id, created_at, updated_at, is_active, organization_id,
                title, status, industry, employee_count, current_crm
            ) VALUES (
                :id, :now, :now, true, :org_id,
                'Test Engagement Lead', 'contacted', 'Technology', 250, 'HubSpot'
            )
        """), {"id": str(lead_id), "now": now, "org_id": str(org_id)})
    log(f"[SETUP] Created lead: {lead_id}")
    return lead_id


async def create_base_emails(org_id, lead_id):
    """Create the 4 original test emails. Only call once."""
    email_ids = []
    now = datetime.now(timezone.utc)
    async with engine.begin() as conn:
        eid1 = uuid.uuid4()
        t1 = now - timedelta(days=3)
        await conn.execute(text("""
            INSERT INTO emails (
                id, created_at, updated_at, is_active, organization_id,
                gmail_message_id, thread_id, direction, sender, receiver,
                subject, body_preview, sent_at, is_read,
                external_entity_type, external_entity_id
            ) VALUES (
                :id, :now, :now, true, :org_id,
                :msg_id, :thread_id, 'outbound', 'rep@kalnet.com', 'prospect@techcorp.com',
                'Intro: PULSE CRM', 'Hi, would you be interested?', :sent_at, true,
                'lead', :lead_id
            )
        """), {
            "id": str(eid1), "now": now, "org_id": str(org_id),
            "msg_id": f"msg_{uuid.uuid4().hex[:8]}", "thread_id": TEST_THREAD_ID,
            "sent_at": t1, "lead_id": str(lead_id),
        })
        email_ids.append(eid1)

        eid2 = uuid.uuid4()
        t2 = now - timedelta(days=2)
        await conn.execute(text("""
            INSERT INTO emails (
                id, created_at, updated_at, is_active, organization_id,
                gmail_message_id, thread_id, direction, sender, receiver,
                subject, body_preview, sent_at, is_read,
                external_entity_type, external_entity_id
            ) VALUES (
                :id, :now, :now, true, :org_id,
                :msg_id, :thread_id, 'inbound', 'prospect@techcorp.com', 'rep@kalnet.com',
                'Re: Intro', 'Yes, interested! Can we schedule a demo?', :sent_at, true,
                'lead', :lead_id
            )
        """), {
            "id": str(eid2), "now": now, "org_id": str(org_id),
            "msg_id": f"msg_{uuid.uuid4().hex[:8]}", "thread_id": TEST_THREAD_ID,
            "sent_at": t2, "lead_id": str(lead_id),
        })
        email_ids.append(eid2)

        eid3 = uuid.uuid4()
        t3 = now - timedelta(days=1)
        await conn.execute(text("""
            INSERT INTO emails (
                id, created_at, updated_at, is_active, organization_id,
                gmail_message_id, thread_id, direction, sender, receiver,
                subject, body_preview, sent_at, is_read,
                external_entity_type, external_entity_id
            ) VALUES (
                :id, :now, :now, true, :org_id,
                :msg_id, :thread_id, 'outbound', 'rep@kalnet.com', 'prospect@techcorp.com',
                'Re: Intro', 'How about Thursday at 3 PM?', :sent_at, true,
                'lead', :lead_id
            )
        """), {
            "id": str(eid3), "now": now, "org_id": str(org_id),
            "msg_id": f"msg_{uuid.uuid4().hex[:8]}", "thread_id": TEST_THREAD_ID,
            "sent_at": t3, "lead_id": str(lead_id),
        })
        email_ids.append(eid3)

        eid4 = uuid.uuid4()
        t4 = now - timedelta(hours=6)
        await conn.execute(text("""
            INSERT INTO emails (
                id, created_at, updated_at, is_active, organization_id,
                gmail_message_id, thread_id, direction, sender, receiver,
                subject, body_preview, sent_at, is_read,
                external_entity_type, external_entity_id
            ) VALUES (
                :id, :now, :now, true, :org_id,
                :msg_id, :thread_id, 'inbound', 'prospect@techcorp.com', 'rep@kalnet.com',
                'Re: Intro', 'Thursday works. Pricing for 250 users?', :sent_at, true,
                'lead', :lead_id
            )
        """), {
            "id": str(eid4), "now": now, "org_id": str(org_id),
            "msg_id": f"msg_{uuid.uuid4().hex[:8]}", "thread_id": TEST_THREAD_ID,
            "sent_at": t4, "lead_id": str(lead_id),
        })
        email_ids.append(eid4)

    log(f"[SETUP] Created 4 base emails in thread: {TEST_THREAD_ID}")
    log(f"  Email 1: outbound (3 days ago)")
    log(f"  Email 2: inbound  (2 days ago) — ~24h response")
    log(f"  Email 3: outbound (1 day ago)")
    log(f"  Email 4: inbound  (6 hours ago) — ~18h response")
    return email_ids


async def add_new_email(org_id, lead_id, hours_ago, label=""):
    """Add a single new email to the existing thread."""
    now = datetime.now(timezone.utc)
    eid = uuid.uuid4()
    t = now - timedelta(hours=hours_ago)
    async with engine.begin() as conn:
        await conn.execute(text("""
            INSERT INTO emails (
                id, created_at, updated_at, is_active, organization_id,
                gmail_message_id, thread_id, direction, sender, receiver,
                subject, body_preview, sent_at, is_read,
                external_entity_type, external_entity_id
            ) VALUES (
                :id, :now, :now, true, :org_id,
                :msg_id, :thread_id, 'inbound', 'prospect@techcorp.com', 'rep@kalnet.com',
                'Re: Intro', 'Can we get a trial before the demo?', :sent_at, true,
                'lead', :lead_id
            )
        """), {
            "id": str(eid), "now": now, "org_id": str(org_id),
            "msg_id": f"msg_{uuid.uuid4().hex[:8]}", "thread_id": TEST_THREAD_ID,
            "sent_at": t, "lead_id": str(lead_id),
        })
    log(f"[SETUP] Added new inbound email (label={label}, sent_at={t})")
    return eid


async def create_test_email_summary(org_id):
    now = datetime.now(timezone.utc)
    summary_id = uuid.uuid4()
    async with engine.begin() as conn:
        await conn.execute(text("""
            INSERT INTO email_summaries (
                id, created_at, updated_at, is_active, organization_id,
                thread_id, summary, summary_word, sentiment, intent,
                confidence, key_points, action_items, category,
                draft_reply, follow_up_suggestion, follow_up_timing,
                processing_time_ms, model_version
            ) VALUES (
                :id, :now, :now, true, :org_id,
                :thread_id, :summary, 'demo_request', 'positive', 'demo',
                0.85, :key_points, :action_items, 'sales',
                'Thanks for confirming! I will send the calendar invite and pricing deck.',
                'Send pricing deck before the demo', 'within_24h',
                1200, 'llama-3.3-70b-versatile'
            )
        """), {
            "id": str(summary_id), "now": now, "org_id": str(org_id),
            "thread_id": TEST_THREAD_ID,
            "summary": "Prospect is interested in PULSE CRM for their 250-person team.",
            "key_points": json.dumps(["Interested in enterprise plan", "250 users", "$20k budget"]),
            "action_items": json.dumps(["Send calendar invite for Thursday 3 PM", "Send pricing deck before demo"]),
        })
    log(f"[SETUP] Created email summary for thread: {TEST_THREAD_ID}")


async def run_engagement_test(org_id, lead_id, expected_pairs, expected_avg_range, label):
    log("\n" + "=" * 70)
    log(f"  TEST: ENGAGEMENT FEATURES — {label}")
    log("=" * 70)

    from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker
    session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with session_factory() as session:
        from app.services.feature_vector_service import FeatureVectorService
        svc = FeatureVectorService(session)
        fv = await svc.compute_engagement_features(org_id, TEST_THREAD_ID, lead_id)
        await session.commit()

        if fv:
            log("\n[RESULT] FeatureVector computed and stored!")
            log("-" * 70)
            log(f"  ID:                          {fv.id}")
            log(f"  Lead ID:                     {fv.lead_id}")
            log(f"  --- Engagement Features ---")
            log(f"  average_response_time:       {fv.average_response_time} hours")
            log(f"  response_time_score:         {fv.response_time_score}")
            log(f"  num_response_pairs:          {fv.num_response_pairs}")
            log(f"  last_processed_sent_at:      {fv.last_processed_sent_at}")
            log(f"  days_since_last_outbound:    {fv.days_since_last_outbound}")
            log(f"  engagement_decay_penalty:    {fv.engagement_decay_penalty}")
            log(f"  customer_initiative_score:   {fv.customer_initiative_score}")
            log(f"  buying_stage_score:          {fv.buying_stage_score}")
            log(f"  ai_intent_category_score:    {fv.ai_intent_category_score}")
            log(f"  engagement_trend_score:      {fv.engagement_trend_score}")
            log(f"  --- Fit Features ---")
            log(f"  company_size_score:          {fv.company_size_score}")
            log(f"  industry_complexity_score:   {fv.industry_complexity_score}")
            log(f"  software_gap_score:          {fv.software_gap_score}")
            log(f"  operational_system_score:    {fv.operational_system_score}")
            log(f"  customization_potential_score: {fv.customization_potential_score}")
            log("-" * 70)

            # Verify pair count
            log(f"\n[VERIFY] Response pairs:")
            log(f"  Expected: {expected_pairs}")
            log(f"  Got:      {fv.num_response_pairs}")
            pass_pairs = fv.num_response_pairs == expected_pairs
            log(f"  STATUS:   {'PASS' if pass_pairs else 'FAIL'}")

            # Verify avg in range
            lo, hi = expected_avg_range
            log(f"\n[VERIFY] Average response time:")
            log(f"  Expected: {lo}–{hi} hours")
            log(f"  Got:      {fv.average_response_time} hours")
            pass_avg = fv.average_response_time is not None and lo <= fv.average_response_time <= hi
            log(f"  STATUS:   {'PASS' if pass_avg else 'FAIL'}")

            return fv, pass_pairs and pass_avg
        else:
            log("[RESULT] No FeatureVector returned — computation failed")
            return None, False


async def run_scoring_test(org_id, lead_id, fv):
    log("\n" + "=" * 70)
    log("  TEST: LEAD SCORING PIPELINE")
    log("=" * 70)

    sys.path.insert(0, os.path.join(root_dir, "ai"))
    from scoring.scoring_service import score_lead

    fit_features = {
        "company_size_score": fv.company_size_score or 0,
        "industry_complexity_score": fv.industry_complexity_score or 0,
        "software_gap_score": fv.software_gap_score or 0,
        "operational_system_score": fv.operational_system_score or 0,
        "customization_potential_score": fv.customization_potential_score or 0,
        "company_size": 250,
        "industry": "Technology",
        "current_crm": "HubSpot",
        "operational_system": None,
    }

    engagement_features = {
        "intent_category_score": fv.ai_intent_category_score or 0,
        "buying_stage_score": fv.buying_stage_score or 0,
        "response_time_score": fv.response_time_score or 0,
        "engagement_trend_score": fv.engagement_trend_score or 50,
        "customer_initiative_score": fv.customer_initiative_score or 0,
        "decay_penalty": fv.engagement_decay_penalty or 0,
        "days_since_last_outbound": fv.days_since_last_outbound or 0,
        "average_response_time_hours": fv.average_response_time,
        "intent_today": "demo_request",
        "buying_stage": "contacted",
        "intent_today_score": 85,
        "intent_7_days_ago_score": None,
    }

    log("\n[INPUT] Fit Features:")
    for k, v in fit_features.items():
        log(f"  {k}: {v}")

    log("\n[INPUT] Engagement Features:")
    for k, v in engagement_features.items():
        log(f"  {k}: {v}")

    result = score_lead(fit_features, engagement_features)

    log("\n" + "-" * 70)
    log("[RESULT] SCORING OUTPUT:")
    log("-" * 70)
    log(f"  Fit Score:         {result['fit']['score']}")
    log(f"  Fit Reasons:")
    for r in result["fit"]["reasons"]:
        log(f"    - {r}")
    log(f"  Engagement Score:  {result['engagement']['score']}")
    log(f"  Engagement Reasons:")
    for r in result["engagement"]["reasons"]:
        log(f"    - {r}")
    log(f"  Overall Score:     {result['overall']['score']}")
    log(f"  Tier:              {result['overall']['tier']}")
    log(f"  Raw Score:         {result['overall']['raw_score']}")
    log(f"  Top Reasons:")
    for r in result["overall"]["top_reasons"]:
        log(f"    - {r}")
    log("-" * 70)

    log("\n[VERIFY] Score ranges:")
    log(f"  Fit score 0-100:        {'PASS' if 0 <= result['fit']['score'] <= 100 else 'FAIL'}")
    log(f"  Engagement score 0-100: {'PASS' if 0 <= result['engagement']['score'] <= 100 else 'FAIL'}")
    log(f"  Overall score 0-100:    {'PASS' if 0 <= result['overall']['score'] <= 100 else 'FAIL'}")
    log(f"  Tier is valid:          {'PASS' if result['overall']['tier'] in ('Critical', 'High', 'Medium', 'Low') else 'FAIL'}")
    log(f"  Has engagement reasons: {'PASS' if len(result['engagement']['reasons']) > 0 else 'FAIL — no reasons generated'}")
    log(f"  Has fit reasons:        {'PASS' if len(result['fit']['reasons']) > 0 else 'FAIL — no reasons generated'}")
    log(f"  Has top reasons:        {'PASS' if len(result['overall']['top_reasons']) > 0 else 'FAIL'}")

    return result


async def cleanup():
    log(f"\n[CLEANUP] Removing test data...")
    async with engine.begin() as conn:
        if TEST_FV_ID:
            await conn.execute(text("DELETE FROM feature_vectors WHERE id = :id"), {"id": str(TEST_FV_ID)})
        await conn.execute(text("DELETE FROM email_summaries WHERE thread_id = :tid"), {"tid": TEST_THREAD_ID})
        await conn.execute(text("DELETE FROM emails WHERE thread_id = :tid"), {"tid": TEST_THREAD_ID})
        if TEST_LEAD_ID:
            await conn.execute(text("DELETE FROM leads WHERE id = :id"), {"id": str(TEST_LEAD_ID)})
    log("[CLEANUP] Done.")


async def run_all():
    global TEST_ORG_ID, TEST_LEAD_ID, TEST_FV_ID

    log("=" * 70)
    log("  ENGAGEMENT FEATURES — INCREMENTAL RUNNING AVERAGE TEST")
    log("=" * 70)
    log(f"  Thread ID: {TEST_THREAD_ID}")
    log(f"  Timestamp: {datetime.now(timezone.utc).isoformat()}")
    log("")

    TEST_ORG_ID = await get_org_id()
    if not TEST_ORG_ID:
        log("[ERROR] No organizations found in DB. Cannot test.")
        return
    log(f"[INFO] Using organization: {TEST_ORG_ID}")

    TEST_LEAD_ID = await create_test_lead(TEST_ORG_ID)

    # ── PASS 1: 4 emails → 2 pairs, avg ~21h ─────────────────────────────
    await create_base_emails(TEST_ORG_ID, TEST_LEAD_ID)
    await create_test_email_summary(TEST_ORG_ID)

    fv1, pass1 = await run_engagement_test(
        TEST_ORG_ID, TEST_LEAD_ID,
        expected_pairs=2,
        expected_avg_range=(19.0, 23.0),
        label="PASS 1 — 4 emails, 2 response pairs",
    )
    if fv1:
        TEST_FV_ID = fv1.id
        log(f"\n[INFO] Stored last_processed_sent_at: {fv1.last_processed_sent_at}")
        log(f"[INFO] Stored num_response_pairs: {fv1.num_response_pairs}")

    # ── PASS 2: add 5th email (inbound, 2h ago) → 3 pairs ────────────────
    # Email 5 at now-2h matches outbound Email 3 at now-24h → diff = 22h
    # New avg = (21*2 + 22) / 3 ≈ 21.33
    log("\n\n" + "#" * 70)
    log("#  ADDING 5TH EMAIL (inbound, 2h ago)")
    log("#" * 70)
    await add_new_email(TEST_ORG_ID, TEST_LEAD_ID, hours_ago=2, label="email5")

    fv2, pass2 = await run_engagement_test(
        TEST_ORG_ID, TEST_LEAD_ID,
        expected_pairs=3,
        expected_avg_range=(20.0, 23.0),
        label="PASS 2 — 5 emails, 3 response pairs, incremental update",
    )
    if fv2:
        TEST_FV_ID = fv2.id

    # ── PASS 3: recompute same data → should be idempotent ────────────────
    log("\n\n" + "#" * 70)
    log("#  RECOMPUTE (no new emails) — should be idempotent")
    log("#" * 70)
    fv3, pass3 = await run_engagement_test(
        TEST_ORG_ID, TEST_LEAD_ID,
        expected_pairs=3,
        expected_avg_range=(20.0, 23.0),
        label="PASS 3 — idempotent recompute",
    )
    if fv3:
        TEST_FV_ID = fv3.id

    # ── SCORING ────────────────────────────────────────────────────────────
    if fv3:
        await run_scoring_test(TEST_ORG_ID, TEST_LEAD_ID, fv3)

    # ── SUMMARY ────────────────────────────────────────────────────────────
    all_pass = pass1 and pass2 and pass3
    log("\n" + "=" * 70)
    log(f"  ALL TESTS {'PASSED ✓' if all_pass else 'FAILED ✗'}")
    log(f"  Pass 1 (2 pairs):  {'PASS' if pass1 else 'FAIL'}")
    log(f"  Pass 2 (3 pairs):  {'PASS' if pass2 else 'FAIL'}")
    log(f"  Pass 3 (idempotent): {'PASS' if pass3 else 'FAIL'}")
    log("=" * 70)

    await cleanup()

    log(f"\nResults written to: {RESULTS_FILE}")


if __name__ == "__main__":
    asyncio.run(run_all())
    with open(RESULTS_FILE, "w", encoding="utf-8") as f:
        f.write("\n".join(out_lines))
    print(f"\nResults saved to {RESULTS_FILE}")
