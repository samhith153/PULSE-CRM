'''from database import get_connection

conn = get_connection()
cursor = conn.cursor()
cursor.execute("SELECT id, source, company_id FROM leads")

print("Connected successfully!")

conn.close()'''
from database import get_connection

conn = get_connection()
cursor = conn.cursor()

cursor.execute("""
SELECT id, name, employee_count
FROM companies;
""")

rows = cursor.fetchall()

print("Companies Table:\n")

for row in rows:
    print(row)

cursor.close()
conn.close()

