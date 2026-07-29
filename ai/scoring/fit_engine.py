from .weights import FIT_WEIGHTS
def calculate_fit_score(features):

    fit_score = (
        features["company_size_score"] * FIT_WEIGHTS["company_size"]
        + features["industry_complexity_score"] * FIT_WEIGHTS["industry_complexity"]
        + features["software_gap_score"] * FIT_WEIGHTS["software_gap"]
        + features["operational_system_score"] * FIT_WEIGHTS["operational_system_fit"]
        + features["customization_potential_score"] * FIT_WEIGHTS["customization_potential"]
    )

    return fit_score