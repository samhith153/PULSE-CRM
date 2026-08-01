from datetime import datetime
from pydantic import BaseModel
from typing import Optional


class BrevoWebhookEvent(BaseModel):
    event: str
    email: str
    message_id: Optional[str] = None
    date: Optional[datetime] = None