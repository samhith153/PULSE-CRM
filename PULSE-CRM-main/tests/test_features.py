from ai.pipeline.features import (
    company_size_band,
    source_quality,
    engagement_level,
)


def test_company_size():
    assert company_size_band(20) == "Small"
    assert company_size_band(200) == "Medium"
    assert company_size_band(1200) == "Large"
    assert company_size_band(3000) == "Enterprise"


def test_source_quality():
    assert source_quality("Referral") == 100
    assert source_quality("Cold Email") == 40


def test_engagement_level():
    assert engagement_level(60) == "HIGH"
    assert engagement_level(30) == "MEDIUM"
    assert engagement_level(5) == "LOW"