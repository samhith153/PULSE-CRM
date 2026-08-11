"""
Test script for EmailSummaryService.
Creates a mock inbound email thread, runs summarization, and prints results.
"""
import asyncio
import os
import sys
import uuid
from datetime import datetime, timezone

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
from app.models.email_summary import EmailSummary
from app.services.email_summary_service import EmailSummaryService

TEST_THREAD_ID = f"test_thread_{uuid.uuid4().hex[:8]}"
TEST_ORG_ID = None


async def get_org_id():
    async with engine.connect() as conn:
        result = await conn.execute(text("SELECT id FROM organizations LIMIT 1"))
        row = result.fetchone()
        if row:
            return row[0]
    return None


async def create_test_emails(org_id):
    async with engine.begin() as conn:
        now = datetime.now(timezone.utc)

        await conn.execute(text("""
            INSERT INTO emails (
                id, created_at, updated_at, is_active, organization_id,
                gmail_message_id, thread_id, direction, sender, receiver,
                subject, body_preview, sent_at, is_read
            ) VALUES (
                :id1, :now, :now, true, :org_id,
                :msg1, :thread_id, 'inbound', 'sarah.johnson@edutech.com', 'rep@kalnet.com',
                'Demo Request', 'Hi, we are interested in your enterprise plan for our 500+ users. Can we schedule a demo next week?', :now, true
            )
        """), {
            "id1": str(uuid.uuid4()), "now": now, "org_id": str(org_id),
            "msg1": f"msg_inbound_{uuid.uuid4().hex[:8]}", "thread_id": TEST_THREAD_ID,
        })

        await conn.execute(text("""
            INSERT INTO emails (
                id, created_at, updated_at, is_active, organization_id,
                gmail_message_id, thread_id, direction, sender, receiver,
                subject, body_preview, sent_at, is_read
            ) VALUES (
                :id2, :now, :now, true, :org_id,
                :msg2, :thread_id, 'outbound', 'rep@kalnet.com', 'sarah.johnson@edutech.com',
                'Re: Demo Request', 'Thanks Sarah! Would Tuesday at 2 PM work for you? We can walk through the full platform.', :now, true
            )
        """), {
            "id2": str(uuid.uuid4()), "now": now, "org_id": str(org_id),
            "msg2": f"msg_outbound_{uuid.uuid4().hex[:8]}", "thread_id": TEST_THREAD_ID,
        })

        await conn.execute(text("""
            INSERT INTO emails (
                id, created_at, updated_at, is_active, organization_id,
                gmail_message_id, thread_id, direction, sender, receiver,
                subject, body_preview, sent_at, is_read
            ) VALUES (
                :id3, :now, :now, true, :org_id,
                :msg3, :thread_id, 'inbound', 'sarah.johnson@edutech.com', 'rep@kalnet.com',
                'Re: Demo Request', 'Tuesday at 2 PM works perfectly. Also, could you share pricing info beforehand? Our budget is around $15k/year.', :now, true
            )
        """), {
            "id3": str(uuid.uuid4()), "now": now, "org_id": str(org_id),
            "msg3": f"msg_inbound_{uuid.uuid4().hex[:8]}", "thread_id": TEST_THREAD_ID,
        })

    print(f"[SETUP] Created 3 test emails in thread: {TEST_THREAD_ID}")


async def run_test():
    global TEST_ORG_ID

    print("=" * 70)
    print("  EMAIL SUMMARY SERVICE - TEST")
    print("=" * 70)

    TEST_ORG_ID = await get_org_id()
    if not TEST_ORG_ID:
        print("[ERROR] No organizations found in DB. Cannot test.")
        return
    print(f"[INFO] Using organization: {TEST_ORG_ID}")

    await create_test_emails(TEST_ORG_ID)

    print(f"\n[TEST] Running summarization for thread: {TEST_THREAD_ID}")
    print("-" * 70)

    from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker
    session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with session_factory() as session:
        svc = EmailSummaryService(session)
        result = await svc.summarize_thread(TEST_ORG_ID, TEST_THREAD_ID)

        if result:
            print("\n[RESULT] EmailSummary stored successfully!")
            print("-" * 70)
            print(f"  ID:                {result.id}")
            print(f"  Thread ID:         {result.thread_id}")
            print(f"  Summary:           {result.summary}")
            print(f"  Summary Word:      {result.summary_word}")
            print(f"  Sentiment:         {result.sentiment}")
            print(f"  Intent:            {result.intent}")
            print(f"  Confidence:        {result.confidence}")
            print(f"  Key Points:        {result.key_points}")
            print(f"  Action Items:      {result.action_items}")
            print(f"  Category:          {result.category}")
            print(f"  Draft Reply:       {result.draft_reply}")
            print(f"  Follow-up Suggest: {result.follow_up_suggestion}")
            print(f"  Follow-up Timing:  {result.follow_up_timing}")
            print(f"  Processing (ms):   {result.processing_time_ms}")
            print(f"  Model Version:     {result.model_version}")
            print(f"  Created At:        {result.created_at}")
            print("-" * 70)

            from sqlalchemy import select
            stmt = select(EmailSummary).where(EmailSummary.thread_id == TEST_THREAD_ID)
            db_result = await session.execute(stmt)
            db_summary = db_result.scalar_one_or_none()
            print(f"\n[VERIFY] Re-fetched from DB: {'OK' if db_summary else 'FAILED'}")
        else:
            print("[RESULT] No summary returned - service returned None")

        await session.commit()

    print(f"\n[CLEANUP] Removing test data...")
    async with engine.begin() as conn:
        await conn.execute(text("DELETE FROM email_summaries WHERE thread_id = :tid"), {"tid": TEST_THREAD_ID})
        await conn.execute(text("DELETE FROM emails WHERE thread_id = :tid"), {"tid": TEST_THREAD_ID})
    print("[CLEANUP] Done.")

    print("\n" + "=" * 70)
    print("  TEST COMPLETE")
    print("=" * 70)


if __name__ == "__main__":
    asyncio.run(run_test())
