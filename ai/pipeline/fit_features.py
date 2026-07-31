"""
Feature engineering functions for the Fit Engine.
Complete with orchestrator function that runs everything.
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
        "Manufacturing": 95,
        "Healthcare": 95,
        "Pharma": 95,
        "Logistics": 95,
        "Construction": 90,
        "Education": 90,
        "Finance": 90,
        "Insurance": 90,
        "Hospitality": 85,
        "Real Estate": 85,
        "Agriculture": 85,
        "Legal": 80,
        "Retail": 75,
        "Media": 75,
        "Consulting": 75,
        "IT": 95
    }

    return scores.get(industry, 0)


def operational_system_score(system):
    """
    Operational System Score

    Measures current operational setup maturity.
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
    software_gap,
    operational_score
):
    """
    Customization Potential Score

    How much potential PULSE has to help this company.
    Formula: Industry (50%) + Software Gap (25%) + Operational (25%)
    """

    score = (
        industry_score * 0.50 +
        software_gap * 0.25 +
        (100 - operational_score) * 0.25
    )

    # Clamp to 0-100 range
    score = max(0, min(100, score))

    return round(score)


def compute_fit_features(lead_dict: dict) -> dict:
    """
    ═══════════════════════════════════════════════════════════════════
    ORCHESTRATOR FUNCTION - Runs ALL fit scoring functions
    ═══════════════════════════════════════════════════════════════════

    Input: lead_dict with company information
    {
        "id": "lead_123",
        "name": "ACME Corp",
        "employees": 250,
        "industry": "Manufacturing",
        "operational_system": "Excel",
        "current_crm": "No CRM"
    }

    Output: Dictionary with all fit scores
    {
        "company_size_score": 85,
        "industry_complexity_score": 95,
        "operational_system_score": 80,
        "software_gap_score": 100,
        "customization_potential_score": 88,
        "overall_fit_score": 89
    }
    """

    # STEP 1: Extract the lead information from the dictionary
    employees = lead_dict.get("employees")
    industry = lead_dict.get("industry")
    operational_system = lead_dict.get("operational_system")
    current_crm = lead_dict.get("current_crm")

    # STEP 2: Call each individual scoring function
    company_size = company_size_score(employees)
    industry_complexity = industry_complexity_score(industry)
    operational_score = operational_system_score(operational_system)
    software_gap = software_gap_score(current_crm)

    # STEP 3: Combine scores to get customization potential
    customization = customization_potential_score(
        industry_score=industry_complexity,
        software_gap=software_gap,
        operational_score=operational_score
    )

    # STEP 4: Calculate overall fit score (average of all components)
    overall_fit_score = round(
        (company_size + industry_complexity + operational_score + software_gap + customization) / 5
    )

    # STEP 5: Return all scores as a dictionary
    fit_features = {
        "company_size_score": company_size,
        "industry_complexity_score": industry_complexity,
        "operational_system_score": operational_score,
        "software_gap_score": software_gap,
        "customization_potential_score": customization,
        "overall_fit_score": overall_fit_score
    }

    return fit_features
# ═══════════════════════════════════════════════════════════════════
# HOW TO USE THIS IN YOUR FEATURE_SERVICE.PY
# ═══════════════════════════════════════════════════════════════════
#
# In backend/services/feature_service.py:
#
# from ai.pipeline.fit_features import compute_fit_features
#
# class FeatureService:
#     async def extract_and_store_features(self, lead_dict):
#         
#         # Call the orchestrator function
#         fit_features = compute_fit_features(lead_dict)
#         
#         # fit_features will be:
#         # {
#         #     "company_size_score": 85,
#         #     "industry_complexity_score": 95,
#         #     "operational_system_score": 80,
#         #     "software_gap_score": 100,
#         #     "customization_potential_score": 88,
#         #     "overall_fit_score": 89
#         # }
#         
#         # Store in database
#         feature_vector = await self.feature_repo.create({
#             "lead_id": lead_dict["id"],
#             "fit_features": fit_features
#         })
#
# ═══════════════════════════════════════════════════════════════════

