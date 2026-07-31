from engagement_features import engagement_trend_score


def test_strong_positive():
    assert engagement_trend_score(100, 70) == 100


def test_dead_branch_currently_returns_50():
    # documents current behavior; replaced once real intent history exists
    assert engagement_trend_score(None, None) == 50


def test_stable_band():
    assert engagement_trend_score(50, 55) == 50
