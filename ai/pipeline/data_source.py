import os
import pandas as pd
from database import get_connection

BASE_DIR = os.path.dirname(os.path.dirname(__file__))
MOCK_DIR = os.path.join(BASE_DIR, "mock_data")


# -------------------------
# LEADS
# -------------------------
def get_leads(source="mock"):

    if source == "mock":
        return pd.read_csv(
            os.path.join(MOCK_DIR, "leads.csv")
        )

    elif source == "database":

        conn = get_connection()

        df = pd.read_sql("SELECT * FROM leads", conn)

        df = df.rename(columns={
            "id": "lead_id"
    })

        conn.close()

        return df

    else:
        raise ValueError("Invalid source.")


# -------------------------
# COMPANIES
# -------------------------
def get_companies(source="mock"):

    if source == "mock":
        return pd.read_csv(
            os.path.join(MOCK_DIR, "companies.csv")
        )

    elif source == "database":

        conn = get_connection()

        df = pd.read_sql("SELECT * FROM companies", conn)

        df = df.rename(columns={
            "id": "company_id",
            "employee_count": "size"
        })



        conn.close()

        return df

    else:
        raise ValueError("Invalid source.")


# -------------------------
# ACTIVITIES
# -------------------------
def get_activities(source="mock"):

    if source == "mock":
        return pd.read_csv(
            os.path.join(MOCK_DIR, "activities.csv")
        )

    elif source == "database":

        conn = get_connection()

        df = pd.read_sql(
            "SELECT * FROM activity_timeline_events",
        conn
        )

        df = df[df["entity_type"] == "lead"]

        df = df.rename(columns={
            "entity_id": "lead_id",
            "action": "activity_type"
        })

        conn.close()

        return df

    else:
        raise ValueError("Invalid source.")


# -------------------------
# EMAILS
# -------------------------
def get_emails(source="mock"):

    if source == "mock":
        return pd.read_csv(
            os.path.join(MOCK_DIR, "emails.csv")
        )

    elif source == "database":

        conn = get_connection()

        df = pd.read_sql(
            "SELECT * FROM emails",
        conn
        )

        df = df[df["external_entity_type"] == "lead"]

        df = df.rename(columns={
        "external_entity_id": "lead_id"
        })

        conn.close()

        return df

    else:
        raise ValueError("Invalid source.")


# -------------------------
# TEST
# -------------------------
if __name__ == "__main__":

    '''companies = get_companies("database")
    print(companies.columns.tolist())

    leads = get_leads("database")
    print(leads.columns.tolist())

    activities = get_activities("database")
    print(activities.columns.tolist())

    emails = get_emails("database")
    print(emails.columns.tolist())

    activities = get_activities("database")

    print(activities[["lead_id", "activity_type", "title"]].head(10))
    print(get_emails("database").head())'''
    print(get_emails("mock").head())