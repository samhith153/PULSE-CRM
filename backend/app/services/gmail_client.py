"""Minimal Google OAuth and Gmail API client."""
from __future__ import annotations

import base64
import hashlib
import hmac
from datetime import datetime, timedelta, timezone
from typing import Any
from urllib.parse import urlencode

import httpx
from cryptography.fernet import Fernet

from app.core.config import settings
from app.core.exceptions import ServiceUnavailableException, ValidationException
from app.models.email import GmailConnection


class TokenCipher:
    def __init__(self) -> None:
        key_material = settings.GMAIL_TOKEN_ENCRYPTION_KEY or settings.SECRET_KEY
        digest = hashlib.sha256(key_material.encode()).digest()
        self._fernet = Fernet(base64.urlsafe_b64encode(digest))

    def encrypt(self, token: str | None) -> str | None:
        if token is None:
            return None
        if token.startswith("gAAAAA"):
            return token
        return self._fernet.encrypt(token.encode()).decode()

    def decrypt(self, token: str | None) -> str | None:
        if token is None:
            return None
        try:
            return self._fernet.decrypt(token.encode()).decode()
        except Exception:
            return token


class GmailClient:
    auth_url = "https://accounts.google.com/o/oauth2/v2/auth"
    token_url = "https://oauth2.googleapis.com/token"
    api_base = "https://gmail.googleapis.com/gmail/v1/users/me"

    def __init__(self) -> None:
        self.cipher = TokenCipher()

    def authorization_url(self, state: str) -> str:
        self._ensure_oauth_configured()
        params = {
            "client_id": settings.GOOGLE_CLIENT_ID,
            "redirect_uri": settings.GOOGLE_REDIRECT_URI,
            "response_type": "code",
            "scope": settings.GOOGLE_OAUTH_SCOPES.replace(",", " "),
            "access_type": "offline",
            "prompt": "consent",
            "state": state,
        }
        return f"{self.auth_url}?{urlencode(params)}"

    async def exchange_code(self, code: str) -> dict[str, Any]:
        self._ensure_oauth_configured()
        return await self._token_request({"grant_type": "authorization_code", "code": code, "redirect_uri": settings.GOOGLE_REDIRECT_URI})

    async def refresh_access_token(self, refresh_token: str) -> dict[str, Any]:
        self._ensure_oauth_configured()
        return await self._token_request({"grant_type": "refresh_token", "refresh_token": refresh_token})

    async def get_profile(self, access_token: str) -> dict[str, Any]:
        return await self._get("profile", access_token)

    async def list_messages(self, access_token: str, page_token: str | None = None, max_results: int = 25) -> dict[str, Any]:
        params = {"maxResults": max_results}
        if page_token:
            params["pageToken"] = page_token
        return await self._get("messages", access_token, params=params)

    async def get_message(self, access_token: str, message_id: str) -> dict[str, Any]:
        return await self._get(f"messages/{message_id}", access_token, params={"format": "full"})

    async def _token_request(self, payload: dict[str, Any]) -> dict[str, Any]:
        payload = {**payload, "client_id": settings.GOOGLE_CLIENT_ID, "client_secret": settings.GOOGLE_CLIENT_SECRET}
        async with httpx.AsyncClient(timeout=settings.AI_TIMEOUT) as client:
            response = await client.post(self.token_url, data=payload)
        if response.status_code >= 400:
            raise ValidationException("Google OAuth token exchange failed.", {"google_status": response.status_code, "body": response.text[:500]})
        data = response.json()
        if "access_token" not in data:
            raise ValidationException("Google OAuth response did not include an access token.")
        return data

    async def _get(self, path: str, access_token: str, params: dict[str, Any] | None = None) -> dict[str, Any]:
        async with httpx.AsyncClient(timeout=settings.AI_TIMEOUT) as client:
            response = await client.get(f"{self.api_base}/{path}", headers={"Authorization": f"Bearer {access_token}"}, params=params)
        if response.status_code >= 400:
            raise ValidationException("Gmail API request failed.", {"google_status": response.status_code, "body": response.text[:500]})
        return response.json()

    def token_expiry(self, token_response: dict[str, Any]) -> datetime:
        return datetime.now(timezone.utc) + timedelta(seconds=int(token_response.get("expires_in") or 3600))

    def verify_webhook_signature(self, body: bytes, signature: str | None) -> bool:
        if not settings.GOOGLE_WEBHOOK_SECRET:
            return True
        if not signature:
            return False
        expected = hmac.new(settings.GOOGLE_WEBHOOK_SECRET.encode(), body, hashlib.sha256).hexdigest()
        return hmac.compare_digest(expected, signature)

    def _ensure_oauth_configured(self) -> None:
        if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET or not settings.GOOGLE_REDIRECT_URI:
            raise ServiceUnavailableException("Google OAuth")


def decode_gmail_body(payload: dict[str, Any]) -> str:
    data = payload.get("body", {}).get("data")
    if data:
        return _decode(data)
    for part in payload.get("parts", []) or []:
        mime_type = part.get("mimeType")
        if mime_type in {"text/plain", "text/html"} and part.get("body", {}).get("data"):
            return _decode(part["body"]["data"])
        nested = decode_gmail_body(part)
        if nested:
            return nested
    return ""


def headers_map(message: dict[str, Any]) -> dict[str, str]:
    return {item.get("name", "").lower(): item.get("value", "") for item in message.get("payload", {}).get("headers", [])}


def _decode(data: str) -> str:
    padded = data + "=" * (-len(data) % 4)
    return base64.urlsafe_b64decode(padded.encode()).decode(errors="replace")


def gmail_datetime(message: dict[str, Any]) -> datetime:
    internal_date = message.get("internalDate")
    if internal_date:
        return datetime.fromtimestamp(int(internal_date) / 1000, timezone.utc)
    return datetime.now(timezone.utc)
