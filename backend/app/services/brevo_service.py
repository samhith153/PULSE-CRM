from app.repositories.email_repository import EmailRepository

class BrevoService:

    def __init__(self, db):
        self.db = db

    async def process_event(self, payload: dict):

        print("=" * 50)
        print("BREVO WEBHOOK RECEIVED")
        print(payload)
        print("=" * 50)