#!/usr/bin/env python3
"""Create test users for testing all 3 dashboards"""
import sqlite3
from passlib.context import CryptContext
import uuid

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

DB_PATH = r"C:\Users\Om Wabale\Downloads\PULSE-CRM-main\PULSE-CRM-main\pulse_crm.db"

test_users = [
    ("admin@pulse.crm", "Admin User", "Admin@123456", "admin"),
    ("manager@pulse.crm", "Manager User", "Manager@123456", "manager"),
    ("rep@pulse.crm", "Sales Rep User", "Rep@123456", "sales_rep"),
]

try:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # First, create org if not exists
    cursor.execute("""
        INSERT OR IGNORE INTO organizations (id, name, domain, created_at, updated_at)
        VALUES ('org-test', 'Test Organization', 'test.com', datetime('now'), datetime('now'))
    """)
    
    for email, full_name, password, role in test_users:
        user_id = str(uuid.uuid4())
        hashed_pw = pwd_context.hash(password)
        
        try:
            cursor.execute("""
                INSERT INTO users 
                (id, email, full_name, hashed_password, organization_id, is_verified, is_superuser, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, 1, 0, datetime('now'), datetime('now'))
            """, (user_id, email, full_name, hashed_pw, 'org-test'))
            
            # Insert user role
            cursor.execute("""
                INSERT INTO user_roles (user_id, role)
                VALUES (?, ?)
            """, (user_id, role))
            
            print(f"✓ Created {role}: {email} | Password: {password}")
        except sqlite3.IntegrityError as e:
            print(f"⚠ {email} already exists or error: {e}")
    
    conn.commit()
    conn.close()
    print("\n✓ Test users created successfully!")
    
except Exception as e:
    print(f"✗ Error: {e}")
    import traceback
    traceback.print_exc()
