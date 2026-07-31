"""Test recommendation engine — imports from ai/recommendation/ module."""
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from ai.recommendation import generate_recommendation, is_terminal, STAGE_MAP

tests = [
    {
        "label": "Brand new lead, no data",
        "data": {
            "lead_id": "test-1",
            "current_score": 0.0,
            "current_stage": "New Lead",
            "days_since_last_activity": 0,
            "reply_received": False,
        },
    },
    {
        "label": "New lead, high score, $120K deal",
        "data": {
            "lead_id": "test-2",
            "current_score": 85.0,
            "current_stage": "New Lead",
            "days_since_last_activity": 0,
            "reply_received": False,
            "deal_value": 120000,
        },
    },
    {
        "label": "Contacted, no reply, 5 days stale",
        "data": {
            "lead_id": "test-3",
            "current_score": 65.0,
            "current_stage": "Contacted",
            "days_since_last_activity": 5,
            "reply_received": False,
            "outbound_email_count": 3,
            "inbound_email_count": 0,
        },
    },
    {
        "label": "Contacted, replied, engaged",
        "data": {
            "lead_id": "test-4",
            "current_score": 70.0,
            "current_stage": "Contacted",
            "days_since_last_activity": 1,
            "reply_received": True,
            "outbound_email_count": 2,
            "inbound_email_count": 2,
        },
    },
    {
        "label": "Qualified, high score, $120K, met",
        "data": {
            "lead_id": "test-5",
            "current_score": 85.0,
            "current_stage": "Qualified",
            "days_since_last_activity": 2,
            "reply_received": True,
            "deal_value": 120000,
            "outbound_email_count": 5,
            "inbound_email_count": 4,
            "meeting_attendance_status": "ATTENDED",
        },
    },
    {
        "label": "Demo Scheduled, fresh, attended",
        "data": {
            "lead_id": "test-6",
            "current_score": 78.0,
            "current_stage": "Demo Scheduled",
            "days_since_last_activity": 1,
            "reply_received": True,
            "deal_value": 80000,
            "meeting_attendance_status": "ATTENDED",
        },
    },
    {
        "label": "Proposal Sent, no response, 7 days",
        "data": {
            "lead_id": "test-7",
            "current_score": 80.0,
            "current_stage": "Proposal Sent",
            "days_since_last_activity": 7,
            "reply_received": False,
            "deal_value": 95000,
            "outbound_email_count": 4,
            "inbound_email_count": 0,
        },
    },
    {
        "label": "Negotiation, stale 10 days, no-show",
        "data": {
            "lead_id": "test-8",
            "current_score": 90.0,
            "current_stage": "Negotiation",
            "days_since_last_activity": 10,
            "reply_received": False,
            "deal_value": 250000,
            "outbound_email_count": 6,
            "inbound_email_count": 0,
            "meeting_attendance_status": "NO_SHOW",
        },
    },
    {
        "label": "Contacted, 3 emails no reply, 10 days",
        "data": {
            "lead_id": "test-9",
            "current_score": 45.0,
            "current_stage": "Contacted",
            "days_since_last_activity": 10,
            "reply_received": False,
            "outbound_email_count": 3,
            "inbound_email_count": 0,
        },
    },
    {
        "label": "Proposal Sent, lead replied with questions",
        "data": {
            "lead_id": "test-10",
            "current_score": 82.0,
            "current_stage": "Proposal Sent",
            "days_since_last_activity": 1,
            "reply_received": True,
            "deal_value": 150000,
            "outbound_email_count": 3,
            "inbound_email_count": 2,
        },
    },
    {
        "label": "Won lead (terminal)",
        "data": {
            "lead_id": "test-11",
            "current_score": 95.0,
            "current_stage": "Won",
            "days_since_last_activity": 0,
            "reply_received": True,
        },
    },
    {
        "label": "Negotiation, $300K, attended",
        "data": {
            "lead_id": "test-12",
            "current_score": 88.0,
            "current_stage": "Negotiation",
            "days_since_last_activity": 3,
            "reply_received": True,
            "deal_value": 300000,
            "meeting_attendance_status": "ATTENDED",
        },
    },
]

print("=" * 80)
print("  PULSE CRM - AI RECOMMENDATION ENGINE TEST")
print("  (imported from ai/recommendation/ module)")
print("=" * 80)
print(f"\n  STAGE_MAP: {STAGE_MAP}")
print(f"  is_terminal('won'): {is_terminal('won')}")
print(f"  is_terminal('new'): {is_terminal('new')}")

for i, test in enumerate(tests, 1):
    stage = test["data"]["current_stage"]
    if is_terminal(stage.lower()):
        print(f"\n[{i:2d}] {test['label']}")
        print("-" * 60)
        print(f"  SKIP: terminal stage '{stage}'")
        continue

    print(f"\n[{i:2d}] {test['label']}")
    print("-" * 60)
    result = generate_recommendation(test["data"])
    if result.get("error"):
        print(f"  ERROR: {result['error']}")
    else:
        print(f"  ACTION: {result['recommended_action']}")
        print(f"  REASON: {result['reason']}")
        top3 = result.get("all_candidates", [])[:3]
        print(f"  TOP 3:  " + " | ".join(
            f"{c['action']} ({c['weight']:.2f})" for c in top3
        ))

print("\n" + "=" * 80)
print("  DONE")
print("=" * 80)
