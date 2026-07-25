"""
Test Engagement Features - Unit Tests with Mock Data

Tests each function in isolation using simulated email data.
No database connection required.
"""

import pandas as pd
from datetime import datetime, timedelta
import sys

# Import from engagement_features.py
from engagement_features import (
    average_response_time,
    response_time_score,
    days_since_last_outbound,
    engagement_decay_penalty,
    ai_intent_category_score,
    buying_stage_score,
    customer_initiative_score,
    engagement_trend_score,
)

from build_engagement_features import (
    build_engagement_features,
    calculate_engagement_score,
)


# ==================== TEST 1: Average Response Time ====================

def test_average_response_time():
    """
    Test: Calculate average response time from outbound→inbound pairs.
    
    Scenario:
    Sales sends email at 9:00 AM → Customer replies at 10:00 AM (1 hour)
    Sales sends email at 10:30 AM → Customer replies at 2:00 PM (3.5 hours)
    
    Expected average: 2.25 hours
    """
    
    print("\n" + "="*60)
    print("TEST 1: Average Response Time")
    print("="*60)
    
    emails = pd.DataFrame([
        {
            "direction": "outbound",
            "sent_at": pd.Timestamp("2024-07-20 09:00:00"),
            "sender": "sales@company.com"
        },
        {
            "direction": "inbound",
            "sent_at": pd.Timestamp("2024-07-20 10:00:00"),
            "sender": "customer@example.com"
        },
        {
            "direction": "outbound",
            "sent_at": pd.Timestamp("2024-07-20 10:30:00"),
            "sender": "sales@company.com"
        },
        {
            "direction": "inbound",
            "sent_at": pd.Timestamp("2024-07-20 14:00:00"),
            "sender": "customer@example.com"
        },
    ])
    
    result = average_response_time(emails)
    expected = 2.25
    
    print(f"Input: 4 emails (2 outbound, 2 inbound)")
    print(f"Response pair 1: 9:00 → 10:00 = 1.0 hour")
    print(f"Response pair 2: 10:30 → 14:00 = 3.5 hours")
    print(f"Result: {result} hours")
    print(f"Expected: {expected} hours")
    print(f"Status: {'✅ PASS' if abs(result - expected) < 0.1 else '❌ FAIL'}")
    
    assert result is not None, "Result should not be None"
    assert abs(result - expected) < 0.1, f"Expected {expected}, got {result}"


# ==================== TEST 2: Response Time Score ====================

def test_response_time_score():
    """
    Test: Convert average response time (hours) to score (0-100).
    
    Scenarios:
    - 1.5 hours → 100 (very fast)
    - 12 hours → 75 (moderate)
    - 48 hours → 55 (slow)
    - None → 0 (no response)
    """
    
    print("\n" + "="*60)
    print("TEST 2: Response Time Score")
    print("="*60)
    
    test_cases = [
        (1.5, 100, "Very fast (< 2 hours)"),
        (5.0, 90, "Fast (2-8 hours)"),
        (12.0, 75, "Moderate (8-24 hours)"),
        (48.0, 55, "Slow (1-3 days)"),
        (120.0, 30, "Very slow (4-7 days)"),
        (200.0, 10, "Extremely slow (> 7 days)"),
        (None, 0, "No response history"),
    ]
    
    for hours, expected_score, desc in test_cases:
        result = response_time_score(hours)
        status = "✅" if result == expected_score else "❌"
        print(f"{status} {hours} hours → {result} (expected {expected_score}) - {desc}")
        assert result == expected_score, f"Failed: {desc}"


# ==================== TEST 3: Days Since Last Outbound ====================

def test_days_since_last_outbound():
    """
    Test: Calculate days since last outbound (sales) email.
    
    Scenario: Last sales email was 5 days ago
    Expected: 5 days
    """
    
    print("\n" + "="*60)
    print("TEST 3: Days Since Last Outbound")
    print("="*60)
    
    now = datetime.now()
    five_days_ago = now - timedelta(days=5)
    
    emails = pd.DataFrame([
        {"direction": "outbound", "sent_at": five_days_ago},
        {"direction": "inbound", "sent_at": five_days_ago + timedelta(hours=2)},
    ])
    
    result = days_since_last_outbound(emails)
    
    print(f"Last outbound email: {five_days_ago.strftime('%Y-%m-%d %H:%M')}")
    print(f"Today: {now.strftime('%Y-%m-%d %H:%M')}")
    print(f"Result: {result} days")
    print(f"Expected: ~5 days")
    print(f"Status: {'✅ PASS' if result == 5 else '❌ FAIL'}")
    
    assert result == 5, f"Expected 5 days, got {result}"


# ==================== TEST 4: Engagement Decay Penalty ====================

def test_engagement_decay_penalty():
    """
    Test: Apply decay penalty based on days since last outbound.
    
    Scenarios:
    - 2 days → 0 (no penalty)
    - 6 days → -2
    - 10 days → -5
    - 20 days → -10
    - 45 days → -20
    - 65 days → -30
    """
    
    print("\n" + "="*60)
    print("TEST 4: Engagement Decay Penalty")
    print("="*60)
    
    test_cases = [
        (2, 0, "0-3 days: no penalty"),
        (6, -2, "4-7 days: -2"),
        (10, -5, "8-14 days: -5"),
        (20, -10, "15-30 days: -10"),
        (45, -20, "31-60 days: -20"),
        (65, -30, "61+ days: -30"),
    ]
    
    for days, expected_penalty, desc in test_cases:
        result = engagement_decay_penalty(days)
        status = "✅" if result == expected_penalty else "❌"
        print(f"{status} {days} days → {result} (expected {expected_penalty}) - {desc}")
        assert result == expected_penalty, f"Failed: {desc}"


# ==================== TEST 5: AI Intent Category Score ====================

def test_ai_intent_category_score():
    """
    Test: Map intent categories to scores.
    
    Scenarios:
    - contract_signed → +100 (best)
    - demo_request → +85
    - neutral → 0
    - lost → -100 (worst)
    """
    
    print("\n" + "="*60)
    print("TEST 5: AI Intent Category Score")
    print("="*60)
    
    test_cases = [
        ("contract_signed", 100, "Deal closed"),
        ("demo_request", 85, "Asking for demo"),
        ("interested", 60, "Showing interest"),
        ("neutral", 0, "Neutral tone"),
        ("lost", -100, "Deal lost"),
        ("invalid_category", 0, "Unknown category"),
    ]
    
    for category, expected_score, desc in test_cases:
        result = ai_intent_category_score(category)
        status = "✅" if result == expected_score else "❌"
        print(f"{status} '{category}' → {result} (expected {expected_score}) - {desc}")
        assert result == expected_score, f"Failed: {desc}"


# ==================== TEST 6: Buying Stage Score ====================

def test_buying_stage_score():
    """
    Test: Map buying stage to score.
    
    Stages progression: New Lead (10) → Contacted (20) → Demo (75) → Won (100)
    """
    
    print("\n" + "="*60)
    print("TEST 6: Buying Stage Score")
    print("="*60)
    
    test_cases = [
        ("New Lead", 10, "Just added"),
        ("Contacted", 20, "We reached out"),
        ("Responded", 40, "They replied"),
        ("Meeting", 60, "Scheduled meeting"),
        ("Demo", 75, "Demo given"),
        ("Proposal", 85, "Proposal sent"),
        ("Negotiation", 95, "Discussing terms"),
        ("Won", 100, "Deal closed"),
        ("Lost", 0, "Deal lost"),
        ("Unknown", 0, "Invalid stage"),
    ]
    
    for stage, expected_score, desc in test_cases:
        result = buying_stage_score(stage)
        status = "✅" if result == expected_score else "❌"
        print(f"{status} '{stage}' → {result} (expected {expected_score}) - {desc}")
        assert result == expected_score, f"Failed: {desc}"


# ==================== TEST 7: Customer Initiative Score ====================

def test_customer_initiative_score():
    """
    Test: Score based on latest email direction.
    
    Scenarios:
    - Latest is INBOUND → 100 (customer driving)
    - Latest is OUTBOUND → 30 (sales chasing)
    """
    
    print("\n" + "="*60)
    print("TEST 7: Customer Initiative Score")
    print("="*60)
    
    # Scenario 1: Customer initiated (latest is inbound)
    emails_customer_last = pd.DataFrame([
        {"direction": "outbound", "sent_at": pd.Timestamp("2024-07-20 09:00:00")},
        {"direction": "inbound", "sent_at": pd.Timestamp("2024-07-20 10:00:00")},  # Latest
    ])
    
    result = customer_initiative_score(emails_customer_last)
    print(f"✅ Latest email: INBOUND → {result} (expected 100) - Customer driving")
    assert result == 100, f"Expected 100, got {result}"
    
    # Scenario 2: Sales initiated (latest is outbound)
    emails_sales_last = pd.DataFrame([
        {"direction": "inbound", "sent_at": pd.Timestamp("2024-07-20 09:00:00")},
        {"direction": "outbound", "sent_at": pd.Timestamp("2024-07-20 10:00:00")},  # Latest
    ])
    
    result = customer_initiative_score(emails_sales_last)
    print(f"✅ Latest email: OUTBOUND → {result} (expected 30) - Sales chasing")
    assert result == 30, f"Expected 30, got {result}"


# ==================== TEST 8: Engagement Trend Score ====================

def test_engagement_trend_score():
    """
    Test: Compare engagement over 7 days.
    
    Scenarios:
    - Improved by 50 points → 100 (strong positive)
    - Improved by 15 points → 75 (positive)
    - No change → 50 (stable)
    - Declined by 80 points → 0 (strong decline)
    """
    
    print("\n" + "="*60)
    print("TEST 8: Engagement Trend Score")
    print("="*60)
    
    test_cases = [
        (85, 35, 100, "Strong improvement: 85 - 35 = +50"),
        (75, 60, 75, "Positive: 75 - 60 = +15"),
        (60, 55, 50, "Stable: 60 - 55 = +5"),
        (40, 60, 25, "Declining: 40 - 60 = -20"),
        (-100, 50, 0, "Strong decline: -100 - 50 = -150"),
        (None, 50, 50, "No data today: Unknown"),
        (60, None, 50, "No historical data: Unknown"),
    ]
    
    for today, seven_days_ago, expected_score, desc in test_cases:
        result = engagement_trend_score(today, seven_days_ago)
        status = "✅" if result == expected_score else "❌"
        print(f"{status} Today={today}, 7d_ago={seven_days_ago} → {result} (expected {expected_score}) - {desc}")
        assert result == expected_score, f"Failed: {desc}"


# ==================== TEST 9: Full Pipeline (Build Features) ====================

def test_build_engagement_features():
    """
    Test: Full pipeline - build all engagement features for multiple leads.
    """
    
    print("\n" + "="*60)
    print("TEST 9: Full Pipeline - Build Engagement Features")
    print("="*60)
    
    # Create sample leads
    leads = pd.DataFrame([
        {
            "lead_id": "lead_1",
            "buying_stage": "Demo",
            "intent_today": 85,
            "intent_7_days_ago": 40,
        },
        {
            "lead_id": "lead_2",
            "buying_stage": "Lost",
            "intent_today": -100,
            "intent_7_days_ago": 60,
        },
    ])
    
    # Create sample emails
    now = datetime.now()
    emails = pd.DataFrame([
        # Lead 1 emails
        {"external_entity_id": "lead_1", "direction": "outbound", "sent_at": now - timedelta(days=2, hours=5)},
        {"external_entity_id": "lead_1", "direction": "inbound", "sent_at": now - timedelta(days=2, hours=4)},
        {"external_entity_id": "lead_1", "direction": "outbound", "sent_at": now - timedelta(hours=2)},
        
        # Lead 2 emails (old, no recent activity)
        {"external_entity_id": "lead_2", "direction": "outbound", "sent_at": now - timedelta(days=65)},
        {"external_entity_id": "lead_2", "direction": "inbound", "sent_at": now - timedelta(days=64)},
    ])
    
    # Build features
    features = build_engagement_features(leads, emails)
    
    print(f"\nGenerated features for {len(features)} leads:")
    print(f"\nLead 1 (Engaged, Demo stage, improving trend):")
    lead1_features = features[features["lead_id"] == "lead_1"].iloc[0]
    print(f"  Response Time: {lead1_features['average_response_time_hours']} hours")
    print(f"  Response Score: {lead1_features['response_time_score']}")
    print(f"  Intent Score: {lead1_features['intent_category_score']}")
    print(f"  Stage Score: {lead1_features['buying_stage_score']}")
    print(f"  Trend Score: {lead1_features['engagement_trend_score']}")
    print(f"  Decay Penalty: {lead1_features['decay_penalty']}")
    
    print(f"\nLead 2 (Dead lead, Lost stage, no activity):")
    lead2_features = features[features["lead_id"] == "lead_2"].iloc[0]
    print(f"  Response Time: {lead2_features['average_response_time_hours']}")
    print(f"  Response Score: {lead2_features['response_time_score']}")
    print(f"  Intent Score: {lead2_features['intent_category_score']}")
    print(f"  Stage Score: {lead2_features['buying_stage_score']}")
    print(f"  Decay Penalty: {lead2_features['decay_penalty']}")
    
    # Verify structure
    assert len(features) == 2, "Should have 2 feature rows"
    assert "response_time_score" in features.columns, "Missing response_time_score"
    assert "intent_category_score" in features.columns, "Missing intent_category_score"
    print("\n✅ Feature structure validated")


# ==================== TEST 10: Calculate Engagement Score ====================

def test_calculate_engagement_score():
    """
    Test: Calculate final engagement score from features.
    
    Scenarios:
    - Lead 1: Strong engagement → High score
    - Lead 2: Dead lead → Low score
    """
    
    print("\n" + "="*60)
    print("TEST 10: Calculate Engagement Score")
    print("="*60)
    
    # Build features first
    leads = pd.DataFrame([
        {
            "lead_id": "lead_hot",
            "buying_stage": "Demo",
            "intent_today": 85,
            "intent_7_days_ago": 40,
        },
        {
            "lead_id": "lead_cold",
            "buying_stage": "Lost",
            "intent_today": -100,
            "intent_7_days_ago": 60,
        },
    ])
    
    now = datetime.now()
    emails = pd.DataFrame([
        {"external_entity_id": "lead_hot", "direction": "outbound", "sent_at": now - timedelta(hours=2)},
        {"external_entity_id": "lead_hot", "direction": "inbound", "sent_at": now - timedelta(hours=1)},
        {"external_entity_id": "lead_cold", "direction": "outbound", "sent_at": now - timedelta(days=70)},
    ])
    
    features = build_engagement_features(leads, emails)
    
    # Calculate scores
    print("\nCalculating engagement scores:")
    for _, feature_row in features.iterrows():
        score_result = calculate_engagement_score(feature_row)
        
        lead_id = score_result["lead_id"]
        engagement_score = score_result["engagement_score"]
        level = score_result["engagement_level"]
        
        print(f"\nLead: {lead_id}")
        print(f"  Engagement Score: {engagement_score}/100")
        print(f"  Level: {level}")
        print(f"  Base Score: {score_result['base_score']}")
        print(f"  Decay Penalty: {score_result['decay_penalty']}")
        
        # Verify ranges
        assert 0 <= engagement_score <= 100, f"Score out of range: {engagement_score}"
        assert level in ["High", "Medium", "Low", "Minimal"], f"Invalid level: {level}"
    
    print("\n✅ All engagement scores calculated and validated")


# ==================== RUN ALL TESTS ====================

def run_all_tests():
    """Run all unit tests."""
    
    print("\n" + "="*70)
    print("ENGAGEMENT ENGINE - UNIT TESTS (WITH MOCK DATA)")
    print("="*70)
    
    tests = [
        test_average_response_time,
        test_response_time_score,
        test_days_since_last_outbound,
        test_engagement_decay_penalty,
        test_ai_intent_category_score,
        test_buying_stage_score,
        test_customer_initiative_score,
        test_engagement_trend_score,
        test_build_engagement_features,
        test_calculate_engagement_score,
    ]
    
    passed = 0
    failed = 0
    
    for test in tests:
        try:
            test()
            passed += 1
        except AssertionError as e:
            print(f"\n❌ TEST FAILED: {e}")
            failed += 1
        except Exception as e:
            print(f"\n❌ TEST ERROR: {e}")
            failed += 1
    
    print("\n" + "="*70)
    print(f"TEST SUMMARY: {passed} passed, {failed} failed")
    print("="*70)
    
    return failed == 0


if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)