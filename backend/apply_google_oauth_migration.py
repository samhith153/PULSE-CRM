"""
Apply Google OAuth migration to add google_id and auth_provider columns
Run this script: python apply_google_oauth_migration.py
"""
import asyncio
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy import text
from app.database.connection import engine


async def apply_migration():
    """Apply the Google OAuth migration."""
    print("🚀 Applying Google OAuth migration...")
    
    migration_sql = """
    -- Add google_id column (nullable, unique)
    ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255);
    
    -- Add auth_provider column (default 'password')
    ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(50) DEFAULT 'password' NOT NULL;
    
    -- Make hashed_password nullable (for OAuth users who don't have passwords)
    ALTER TABLE users ALTER COLUMN hashed_password DROP NOT NULL;
    
    -- Add comment for documentation
    COMMENT ON COLUMN users.google_id IS 'Google user ID for OAuth authentication';
    COMMENT ON COLUMN users.auth_provider IS 'Authentication provider: password, google, etc.';
    """
    
    try:
        async with engine.begin() as conn:
            # Execute each statement
            await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255);"))
            print("✅ Added google_id column")
            
            await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(50) DEFAULT 'password' NOT NULL;"))
            print("✅ Added auth_provider column")
            
            await conn.execute(text("ALTER TABLE users ALTER COLUMN hashed_password DROP NOT NULL;"))
            print("✅ Made hashed_password nullable")
            
            await conn.execute(text("COMMENT ON COLUMN users.google_id IS 'Google user ID for OAuth authentication';"))
            await conn.execute(text("COMMENT ON COLUMN users.auth_provider IS 'Authentication provider: password, google, etc.';"))
            print("✅ Added column comments")
            
        # Create unique index separately
        async with engine.begin() as conn:
            await conn.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS ix_users_google_id ON users(google_id);"))
            print("✅ Created unique index on google_id")
            
        print("\n🎉 Migration applied successfully!")
        print("\nYou can now use Google OAuth authentication.")
        
    except Exception as e:
        print(f"\n❌ Migration failed: {e}")
        raise
    finally:
        await engine.dispose()


if __name__ == "__main__":
    asyncio.run(apply_migration())
