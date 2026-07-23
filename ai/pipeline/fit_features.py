"""
Feature engineering functions for the Fit Engine.
"""

def company_size_score(employees):
    """
    Company Size Score

    More employees generally indicate greater organizational complexity,
    requiring a more structured CRM system.
    """

    if employees is None:
        return 0

    if employees <= 10:
        return 20
    elif employees <= 25:
        return 40
    elif employees <= 50:
        return 60
    elif employees <= 200:
        return 85
    elif employees <= 500:
        return 90
    else:
        return 80


def industry_complexity_score(industry):
    """
    Industry Complexity Score

    Industries with more stakeholders, workflows,
    compliance and coordination receive higher scores.
    """

    scores = {

        "Manufacturing":95,

        "Healthcare":95,

        "Pharma":95,

        "Logistics":95,

        "Construction":90,

        "Education":90,

        "Finance":90,

        "Insurance":90,

        "Hospitality":85,

        "Real Estate":85,

        "Agriculture":85,

        "Legal":80,

        "Retail":75,

        "Media":75,

        "Consulting":75,

        "IT": 95

    }

    return scores.get(industry,0)


def operational_system_score(system):
    """
    Operational System Score
    """

    if system is None:
        return 0

    system = str(system).strip().lower()

    if system == "no structured system":
        return 90

    elif system in [
        "excel",
        "google sheets",
        "manual",
        "spreadsheets"
    ]:
        return 80

    elif system in [
        "crm",
        "erp",
        "structured business software"
    ]:
        return 50

    elif system in [
        "custom software",
        "custom internal software"
    ]:
        return 20

    return 0

def software_gap_score(current_crm):
    """
    Software Gap Score

    Measures the opportunity for CRM adoption or migration.
    """

    if current_crm is None:
        return 0

    crm = str(current_crm).strip().lower()

    if crm in ["", "no crm"]:
        return 100

    elif crm in ["excel", "google sheets", "manual"]:
        return 95

    elif crm == "whatsapp":
        return 95

    elif crm in ["basic crm"]:
        return 80

    elif crm in ["hubspot", "zoho"]:
        return 60

    elif crm in ["salesforce"]:
        return 30

    elif crm in ["custom software"]:
        return 15

    return 0


def customization_potential_score(
    industry_score,
    operational_score,
    company_score
):
    """
    Customization Potential Score

    Formula provided in the business specification.
    """

    score = (

        industry_score * 0.40 +

        operational_score * 0.35 +

        company_score * 0.25

    )

    return round(score)
