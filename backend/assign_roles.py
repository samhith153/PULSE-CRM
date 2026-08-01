import sqlite3
import uuid
from datetime import datetime

conn = sqlite3.connect("../pulse_crm.db")
cursor = conn.cursor()

# Check existing roles
cursor.execute("SELECT id, name, display_name FROM roles;")
existing_roles = cursor.fetchall()
print("Available roles:")
for role_id, name, display_name in existing_roles:
    print(f"  {name} ({display_name}) - {role_id}")

# Get user IDs
cursor.execute("SELECT id, email FROM users WHERE email IN ('rep@pulse.crm', 'manager@pulse.crm', 'admin@pulse.crm');")
users = {email: user_id for user_id, email in cursor.fetchall()}

if not users:
    print("\n⚠ No users found! Please create them first.")
    conn.close()
    exit(1)

print(f"\nFound {len(users)} users to assign roles")

# Map role names
role_map = {
    'admin': 'admin',
    'manager': 'manager', 
    'sales_rep': 'sales_rep'
}

# Get role IDs by name
roles_by_name = {name: role_id for role_id, name, _ in existing_roles}

# Assign roles
assignments = [
    ('admin@pulse.crm', 'admin'),
    ('manager@pulse.crm', 'manager'),
    ('rep@pulse.crm', 'sales_rep'),
]

for email, role_name in assignments:
    if email not in users:
        print(f"⚠ User {email} not found")
        continue
    
    if role_name not in roles_by_name:
        print(f"⚠ Role {role_name} not found in database")
        continue
    
    user_id = users[email]
    role_id = roles_by_name[role_name]
    
    # Check if already assigned
    cursor.execute("""
        SELECT id FROM user_roles 
        WHERE user_id = ? AND role_id = ?
    """, (user_id, role_id))
    
    if cursor.fetchone():
        print(f"✓ {email} already has role {role_name}")
        continue
    
    # Insert new user_role
    cursor.execute("""
        INSERT INTO user_roles (id, user_id, role_id, assigned_at)
        VALUES (?, ?, ?, ?)
    """, (str(uuid.uuid4()), user_id, role_id, datetime.utcnow().isoformat()))
    
    print(f"✓ Assigned {role_name} to {email}")

conn.commit()

# Verify
print("\nFinal role assignments:")
cursor.execute("""
    SELECT u.email, r.name 
    FROM users u
    JOIN user_roles ur ON u.id = ur.user_id
    JOIN roles r ON ur.role_id = r.id
    WHERE u.email IN ('rep@pulse.crm', 'manager@pulse.crm', 'admin@pulse.crm')
""")
for email, role in cursor.fetchall():
    print(f"  {email} → {role}")

conn.close()
