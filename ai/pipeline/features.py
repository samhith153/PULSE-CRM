import pandas as pd
def company_size_band(size):

    if size < 50:
        return "Small"

    elif size < 500:
        return "Medium"

    elif size < 2000:
        return "Large"

    return "Enterprise"


def source_quality(source):

    mapping = {

        "Referral":100,

        "Website":85,

        "LinkedIn":70,

        "Webinar":75,

        "Event":65,

        "Cold Email":40

    }

    return mapping.get(source,50)


'''def engagement_score(emails):

    score = 0

    if emails.empty:
        return score

    for _, row in emails.iterrows():

        direction = str(row.get("direction", "")).lower()

        if direction == "outbound":
            score += 5

        elif direction == "inbound":
            score += 15

    return score'''
def engagement_score(emails):

    score = 0

    for _, row in emails.iterrows():

        score += 5  # email exists

        if row["replied"] == "Yes":
            score += 15

    return score


def engagement_level(score):

    if score >= 50:
        return "HIGH"

    elif score >= 25:
        return "MEDIUM"

    return "LOW"

def reply_rate(email_df):

    if email_df.empty:
        return 0

    total_sent = len(email_df)

    total_replied = len(
        email_df[email_df["replied"] == "Yes"]
    )

    return round((total_replied / total_sent) * 100, 2)

def reply_level(rate):

    if rate >= 70:
        return "FAST"

    elif rate >= 40:
        return "MEDIUM"

    elif rate > 0:
        return "SLOW"

    return "NO RESPONSE"

import pandas as pd


def recency_days(activities):

    if activities.empty:
        return 999

    # Database uses activity timeline
    if "created_at" in activities.columns:
        latest = pd.to_datetime(
            activities["created_at"]
        ).max()

    # Mock data uses activity_date
    elif "activity_date" in activities.columns:
        latest = pd.to_datetime(
            activities["activity_date"]
        ).max()

    else:
        return 999

    # Convert timezone-aware timestamp to timezone-naive
    if latest.tzinfo is not None:
        latest = latest.tz_localize(None)

    today = pd.Timestamp.now()

    return (today - latest).days