from database import get_connection

conn = get_connection()

cursor = conn.cursor()

tables = [
    "companies",
    "contacts",
    "leads",
    "deals",
    "emails",
    "activity_timeline_events"
]

for table in tables:

    cursor.execute(f"SELECT COUNT(*) FROM {table}")

    count = cursor.fetchone()[0]

    print(f"{table}: {count}")

cursor.close()
conn.close()