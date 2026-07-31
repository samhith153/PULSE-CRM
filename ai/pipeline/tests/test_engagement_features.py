import pandas as pd
from engagement_features import (
    average_response_time,
    response_time_score,
    days_since_last_outbound,
    engagement_decay_penalty,
    ai_intent_category_score,
    buying_stage_score,
    reply_recency_score,
    customer_initiative_score,
)


def test_average_response_time_basic():
    df = pd.DataFrame({
        "thread_id": [1, 1],
        "direction": ["outbound", "inbound"],
        "sent_at": [pd.Timestamp("2026-01-01 09:00"), pd.Timestamp("2026-01-01 11:00")],
    })
    assert average_response_time(df) == 2.0


def test_average_response_time_ignores_unanswered_outbound():
    # outbound with no following inbound -> no replies -> None
    df = pd.DataFrame({
        "thread_id": [1],
        "direction": ["outbound"],
        "sent_at": [pd.Timestamp("2026-01-01 09:00")],
    })
    assert average_response_time(df) is None


def test_average_response_time_single_email_is_none():
    df = pd.DataFrame({
        "thread_id": [1],
        "direction": ["inbound"],
        "sent_at": [pd.Timestamp("2026-01-01")],
    })
    assert average_response_time(df) is None


def test_response_time_score_buckets():
    assert response_time_score(None) == 0
    assert response_time_score(1) == 100
    assert response_time_score(4) == 90
    assert response_time_score(12) == 75
    assert response_time_score(48) == 55
    assert response_time_score(120) == 30
    assert response_time_score(200) == 10


def test_days_since_last_outbound_requires_outbound():
    df = pd.DataFrame({
        "direction": ["inbound"],
        "sent_at": [pd.Timestamp("2026-01-01")],
    })
    assert days_since_last_outbound(df) is None


def test_days_since_last_outbound_recent():
    df = pd.DataFrame({
        "direction": ["outbound"],
        "sent_at": [pd.Timestamp.now() - pd.Timedelta(days=1)],
    })
    assert days_since_last_outbound(df) == 1


def test_engagement_decay_penalty_buckets():
    assert engagement_decay_penalty(None) == 0
    assert engagement_decay_penalty(3) == 0
    assert engagement_decay_penalty(7) == -2
    assert engagement_decay_penalty(14) == -5
    assert engagement_decay_penalty(30) == -10
    assert engagement_decay_penalty(60) == -20
    assert engagement_decay_penalty(90) == -30


def test_ai_intent_category_score_known():
    assert ai_intent_category_score("contract_signed") == 100
    assert ai_intent_category_score("lost") == -100
    assert ai_intent_category_score("unknown_thing") == 0
    assert ai_intent_category_score(None) == 0


def test_buying_stage_score_known():
    assert buying_stage_score("won") == 100
    assert buying_stage_score("new") == 10
    assert buying_stage_score(None) == 0
    assert buying_stage_score("nonexistent") == 0


def test_reply_recency_score_buckets():
    future = pd.Timestamp.now() + pd.Timedelta(days=1)
    old = pd.Timestamp.now() - pd.Timedelta(days=30)
    assert reply_recency_score(pd.DataFrame({"sent_at": [future]})) == 100  # <=1 day
    assert reply_recency_score(pd.DataFrame({"sent_at": [old]})) == 20      # >14 days


def test_customer_initiative_score_values():
    inbound = pd.DataFrame({"direction": ["inbound"], "sent_at": [pd.Timestamp("2026-01-01")]})
    outbound = pd.DataFrame({"direction": ["outbound"], "sent_at": [pd.Timestamp("2026-01-01")]})
    empty = pd.DataFrame(columns=["direction", "sent_at"])
    assert customer_initiative_score(inbound) == 100
    assert customer_initiative_score(outbound) == 30
    assert customer_initiative_score(empty) == 0
