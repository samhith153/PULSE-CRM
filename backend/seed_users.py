"""
Seed test users for all 3 roles
"""
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from passlib.context import CryptContext
from db.models import User, Organization, Role
from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

DATABASE_URL = "sqlite+aiosqlite:///./pulse_crm.db"

async def seed_users():
    engine = create_async_engine(DATABASE_URL, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        # Create default organization if it doesn't exist
        org = await session.execute(
            "SELECT * FROM organizations WHERE name = 'Test Org'"
        )
        org_result = org.fetchone()
        if not org_result:
            # Create org table first
            org = Organization(id="org-1", name="Test Org", domain="test.com")
            session.add(org)
            await session.commit()
        else:
            org_id = org_result[0]
        
        # Test users with plain passwords
        test_users = [
            {
                "email": "admin@pulse.crm",
                "full_name": "Admin User",
                "password": "Admin@123456",
                "role": "admin",
            },
            {
                "email": "manager@pulse.crm",
                "full_name": "Manager User",
                "password": "Manager@123456",
                "role": "manager",
            },
            {
                "email": "rep@pulse.crm",
                "full_name": "Sales Representative",
                "password": "Rep@123456",
                "role": "sales_rep",
            },
        ]
        
        for user_data in test_users:
            # Check if user exists
            existing = await session.execute(
                f"SELECT * FROM users WHERE email = '{user_data['email']}'"
            )
            if not existing.fetchone():
                hashed_pw = pwd_context.hash(user_data["password"])
                user = User(
                    id=f"user-{user_data['role']}",
                    email=user_data["email"],
                    full_name=user_data["full_name"],
                    hashed_password=hashed_pw,
                    is_verified=True,
                    organization_id="org-1",
                    roles=[user_data["role"]],
                )
                session.add(user)
                await session.commit()
                print(f"✓ Created {user_data['role']}: {user_data['email']}")
            else:
                print(f"✗ User already exists: {user_data['email']}")
    
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(seed_users())
    print("\n✓ Seeding complete!")
