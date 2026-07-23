from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.connection import get_db
from app.services.brevo_service import BrevoService

router = APIRouter()

@router.post("/webhook")
async def webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
):

    payload = await request.json()

    service = BrevoService(db)

    await service.process_event(payload)

    return {"status": "ok"}