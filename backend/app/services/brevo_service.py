from app.repositories.email_repository import EmailRepository
import json
class BrevoService:
    def __init__(self, db):
        self.db = db
        self.email_repo = EmailRepository(db)

    async def process_event(self, payload: dict):
        event = payload.get("event")
        message_id_raw = payload.get("message-id", "")
        # Brevo sends it wrapped like <uuid@yourdomain>; strip to match what you stored
        message_id = message_id_raw.strip("<>").split("@")[0]

        email = await self.email_repo.get_by_message_id_global(message_id)
        if not email:
            return  # no matching row, nothing to update

        merged = dict(email.raw_payload or {})
        merged["status"] = event
        merged.setdefault("events", []).append(payload)
        email.raw_payload = merged

        await self.email_repo.save()  # commits