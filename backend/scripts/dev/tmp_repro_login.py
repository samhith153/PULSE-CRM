import asyncio
import traceback
from app.schemas.auth import LoginRequest
from app.services.auth_service import AuthService
from app.database.connection import get_db


async def main():
    async for db in get_db():
        try:
            svc = AuthService(db)
            tokens = await svc.login(
                LoginRequest(email="sales@gmail.com", password="Sales@123456"),
                client_ip="127.0.0.1",
            )
            print("LOGIN OK:", tokens.access_token[:20])
        except Exception:
            traceback.print_exc()
        return


asyncio.run(main())