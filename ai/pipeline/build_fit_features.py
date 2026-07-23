"""
Build Fit Features

Generates numerical fit-related features for each lead based on
company characteristics and CRM adoption potential.
"""

from datetime import datetime
import pandas as pd

from fit_features import (
    company_size_score,
    industry_complexity_score,
    software_gap_score,
    operational_system_score,
    customization_potential_score,
)

def build_fit_features(leads_df, companies_df):
    """
    Build fit feature vectors for all leads.

    Parameters
    ----------
    leads_df : pandas.DataFrame
        Lead information.

    companies_df : pandas.DataFrame
        Company information.

    Returns
    -------
    pandas.DataFrame
        Fit feature dataframe.
    """

    # Merge lead and company data
    df = leads_df.merge(
        companies_df,
        on="company_id",
        how="left"
    )

    records = []

    for _, lead in df.iterrows():

        # -----------------------------
        # Individual Scores
        # -----------------------------

        # Company Size
        company_score = company_size_score(
            lead.get("size")
        )

        # Industry Complexity
        industry_score = industry_complexity_score(
            lead.get("industry")
        )

        # Software Gap
        software_score = software_gap_score(
            lead.get("current_crm")
        )

        # Operational System
        operational_score = operational_system_score(
            lead.get("operational_system")
        )

        # Customization Potential
        customization_score = customization_potential_score(
            industry_score,
            operational_score,
            company_score
        )
        # -----------------------------
        # Store Feature Vector
        # -----------------------------

        records.append({
        "lead_id": lead["lead_id"],

        "feature_version": "v1",

        "generated_at": datetime.now(),

        "company_size_score": company_score,

        "industry_complexity_score": industry_score,

        "software_gap_score": software_score,

        "operational_system_score": operational_score,

        "customization_potential_score": customization_score
    })

    return pd.DataFrame(records)


if __name__ == "__main__":
    print("This module is intended to be imported into build_features.py")