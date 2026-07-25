from fit_engine import calculate_fit_score
from engagement_engine import calculate_engagement_score
from overall_score import calculate_overall_score
from reasons import generate_reasons


def score_lead(
    fit_features,
    engagement_features
):

    fit_score = calculate_fit_score(
        fit_features
    )

    engagement_score = calculate_engagement_score(
        engagement_features
    )

    overall_score = calculate_overall_score(
        fit_score,
        engagement_score
    )

    reasons = generate_reasons(
        fit_features,
        engagement_features,
        fit_score,
        engagement_score
    )

    return {
        "fit_score": fit_score,
        "engagement_score": engagement_score,
        "overall_score": overall_score,
        "reasons": reasons
    }