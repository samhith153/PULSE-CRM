import sqlite3

conn = sqlite3.connect("../pulse_crm.db")
cursor = conn.cursor()

# Get all tables
cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = cursor.fetchall()

print("Available tables:")
for table in tables:
    print(f"  - {table[0]}")

# Check for role-related tables
role_tables = [t[0] for t in tables if 'role' in t[0].lower() or 'permission' in t[0].lower()]
if role_tables:
    print("\nRole/permission tables:")
    for table in role_tables:
        cursor.execute(f"PRAGMA table_info({table});")
        columns = cursor.fetchall()
        print(f"\n{table}:")
        for col in columns:
            print(f"  {col[1]} ({col[2]})")

conn.close()
