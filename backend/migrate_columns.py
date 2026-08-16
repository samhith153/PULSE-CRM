import asyncio
from sqlalchemy import text
from app.database.connection import AsyncSessionFactory, engine

async def add_columns():
    async with AsyncSessionFactory() as db:
        # Add google_id column if not exists
        await db.execute(text('ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255)'))
        await db.execute(text('CREATE UNIQUE INDEX IF NOT EXISTS ix_users_google_id ON users(google_id)'))
        
        # Add auth_provider column if not exists
        await db.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(50) DEFAULT 'password' NOT NULL"))
        
        # Make hashed_password nullable (for OAuth users who don't have passwords)
        await db.execute(text('ALTER TABLE users ALTER COLUMN hashed_password DROP NOT NULL'))
        
        await db.commit()
        print('Migration completed successfully!')

asyncio.run(add_columns())