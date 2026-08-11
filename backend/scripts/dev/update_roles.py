import sqlite3

db_path = "../pulse_crm.db"
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Update roles
cursor.execute("UPDATE users SET role = 'admin' WHERE email = 'admin@pulse.crm';")
cursor.execute("UPDATE users SET role = 'manager' WHERE email = 'manager@pulse.crm';")
conn.commit()

# Verify
cursor.execute("SELECT email, role FROM users WHERE email IN ('rep@pulse.crm', 'manager@pulse.crm', 'admin@pulse.crm');")
results = cursor.fetchall()

print("✓ User roles updated:")
for email, role in results:
    print(f"  {email} → {role}")

conn.close()
