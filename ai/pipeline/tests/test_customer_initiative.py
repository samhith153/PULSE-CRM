import pandas as pd
from engagement_features import customer_initiative_score


def _df(direction):
    return pd.DataFrame({"direction": [direction], "sent_at": [pd.Timestamp("2026-01-01")]})


def test_inbound_latest_returns_100():
    assert customer_initiative_score(_df("inbound")) == 100


def test_outbound_latest_returns_30():
    # reason_generator checks == 30 for "SALES DRIVEN"
    assert customer_initiative_score(_df("outbound")) == 30


def test_empty_returns_0():
    assert customer_initiative_score(pd.DataFrame(columns=["direction", "sent_at"])) == 0
