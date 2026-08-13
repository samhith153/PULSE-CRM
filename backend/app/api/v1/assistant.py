"""
Internal Assistant chat endpoint.
Uses Groq (free tier) with a knowledge base to answer CRM-related questions.
"""
from __future__ import annotations

import asyncio
import html
import json
import re
from pathlib import Path
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from groq import Groq, GroqError

from app.api.deps import CurrentUser, require_permission
from app.core.config import settings
from app.schemas.assistant import AssistantChatRequest, AssistantChatResponse

router = APIRouter(dependencies=[Depends(require_permission("ai:access"))])

# ---------------------------------------------------------------------------
# Output sanitization — treat ALL LLM output as untrusted
# ---------------------------------------------------------------------------

_TAG_RE = re.compile(r"<[^>]+>")


def _sanitize_response(text: str) -> str:
    """Strip any HTML tags the model might emit and unescape entities.

    The frontend renders assistant output as plain React text (auto-escaped),
    but we enforce text-only at the source so a future markdown/HTML renderer
    cannot accidentally introduce stored XSS.
    """
    # Remove HTML tags entirely
    text = _TAG_RE.sub("", text)
    # Decode any HTML entities the model may have produced
    text = html.unescape(text)
    # Collapse excessive whitespace while preserving intentional newlines
    text = re.sub(r"[^\S\n]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()

# ---------------------------------------------------------------------------
# Knowledge base loading (loaded once at import time)
# ---------------------------------------------------------------------------

_DOCS_DIR = Path(__file__).resolve().parent.parent.parent.parent / "docs" / "assistant"

_system_prompt: str = ""
_knowledge_base: dict[str, Any] = {}


def _load_knowledge_base() -> None:
    global _system_prompt, _knowledge_base
    if _system_prompt:
        return
    try:
        _system_prompt = (_DOCS_DIR / "system_prompt.md").read_text(encoding="utf-8")
    except FileNotFoundError:
        _system_prompt = "You are PULSE Assistant. Answer only CRM-related questions."

    try:
        _knowledge_base = json.loads((_DOCS_DIR / "knowledge_base.json").read_text(encoding="utf-8"))
    except (FileNotFoundError, json.JSONDecodeError):
        _knowledge_base = {}


def _build_context_prompt(user_role: str, context: dict[str, Any]) -> str:
    """Build a context string to inject into the LLM prompt."""
    parts: list[str] = []
    parts.append(f"User role: {user_role}")

    page = context.get("page")
    if page:
        parts.append(f"Current page: {page}")

    entity_type = context.get("entity_type")
    entity_id = context.get("entity_id")
    if entity_type:
        parts.append(f"Current entity: {entity_type} (ID: {entity_id})")

    return "\n".join(parts)


def _format_knowledge_base() -> str:
    """Format the knowledge base into a readable string for the LLM."""
    if not _knowledge_base:
        return ""

    sections: list[str] = []

    # Features
    features = _knowledge_base.get("features", {})
    if features:
        sections.append("## CRM Features")
        for key, feat in features.items():
            sections.append(f"\n### {feat['name']}")
            sections.append(f"{feat['description']}")
            caps = feat.get("capabilities", {})
            for cap_key, cap_desc in caps.items():
                sections.append(f"- **{cap_key.replace('_', ' ').title()}**: {cap_desc}")

    # Workflows
    workflows = _knowledge_base.get("workflows", {})
    if workflows:
        sections.append("\n## How-To Guides")
        for key, wf in workflows.items():
            sections.append(f"\n### {wf['title']}")
            for i, step in enumerate(wf.get("steps", []), 1):
                sections.append(f"{i}. {step}")

    # Roles
    roles = _knowledge_base.get("roles", {})
    if roles:
        sections.append("\n## User Roles & Permissions")
        for role_key, role_info in roles.items():
            sections.append(f"\n### {role_info['name']} ({role_key})")
            sections.append(f"{role_info['description']}")
            can = role_info.get("can", [])
            cannot = role_info.get("cannot", [])
            if can:
                sections.append("Can do:")
                for item in can:
                    sections.append(f"  - {item}")
            if cannot:
                sections.append("Cannot do:")
                for item in cannot:
                    sections.append(f"  - {item}")

    # FAQ
    faq = _knowledge_base.get("faq", [])
    if faq:
        sections.append("\n## Frequently Asked Questions")
        for item in faq:
            sections.append(f"\n**Q: {item['question']}**")
            sections.append(f"A: {item['answer']}")

    # Glossary
    glossary = _knowledge_base.get("glossary", {})
    if glossary:
        sections.append("\n## CRM Glossary")
        for term, definition in glossary.items():
            sections.append(f"- **{term}**: {definition}")

    return "\n\n".join(sections)


_groq_client: Groq | None = None


def _get_client() -> Groq:
    """Get or create the Groq client (cached singleton)."""
    global _groq_client
    if _groq_client is not None:
        return _groq_client
    api_key = settings.ASSISTANT_API_KEY
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Assistant API key is not configured. Set ASSISTANT_API_KEY in your .env file.",
        )
    _groq_client = Groq(api_key=api_key)
    return _groq_client


def _get_suggestions(user_message: str, response_text: str) -> list[str]:
    """Generate contextual follow-up suggestions."""
    msg_lower = user_message.lower()
    suggestions: list[str] = []

    if any(w in msg_lower for w in ["lead", "leads", "prospect"]):
        suggestions.extend([
            "How do I convert a lead?",
            "What is lead scoring?",
            "How do I use Priority View?"
        ])
    elif any(w in msg_lower for w in ["deal", "pipeline", "deal"]):
        suggestions.extend([
            "How do I manage the pipeline?",
            "What are pipeline stages?",
            "How is weighted forecast calculated?"
        ])
    elif any(w in msg_lower for w in ["email", "gmail", "send"]):
        suggestions.extend([
            "How do I connect my Gmail?",
            "How do I send an email to a lead?",
            "Can I see email history?"
        ])
    elif any(w in msg_lower for w in ["role", "permission", "admin", "manager"]):
        suggestions.extend([
            "What can sales reps do?",
            "How do I add a new team member?",
            "Who can delete leads?"
        ])
    elif any(w in msg_lower for w in ["report", "dashboard", "export"]):
        suggestions.extend([
            "How do I create a custom report?",
            "Can I export reports?",
            "What dashboards are available?"
        ])
    else:
        suggestions.extend([
            "How do I create a lead?",
            "How do I convert a lead to a deal?",
            "What is Priority View?",
            "How do I connect Gmail?"
        ])

    return suggestions[:3]


# ---------------------------------------------------------------------------
# Route
# ---------------------------------------------------------------------------

@router.post(
    "/chat",
    response_model=AssistantChatResponse,
    status_code=status.HTTP_200_OK,
    summary="Chat with PULSE Assistant",
)
async def chat(
    payload: AssistantChatRequest,
    current_user: CurrentUser,
) -> AssistantChatResponse:
    """Send a message to the internal PULSE assistant and get a CRM-related answer."""
    _load_knowledge_base()

    client = _get_client()

    context_str = _build_context_prompt(payload.user_role, payload.context)
    kb_str = _format_knowledge_base()

    system_message = f"""{_system_prompt}

## User Context
{context_str}

## PULSE CRM Knowledge Base
{kb_str}

IMPORTANT: Respond in plain text only. Do NOT use HTML tags, markdown bold/italic,
or any markup. Use natural paragraphs and bullet points with plain text formatting.
Never include <script>, <img>, <a>, or any HTML elements in your response.
"""

    try:
        completion = await asyncio.to_thread(
            client.chat.completions.create,
            model=settings.ASSISTANT_MODEL,
            messages=[
                {"role": "system", "content": system_message},
                {"role": "user", "content": payload.message},
            ],
            temperature=0.3,
            max_tokens=800,
        )
        response_text = completion.choices[0].message.content or "I couldn't generate a response. Please try again."
    except GroqError as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Assistant service error: {str(e)}",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred. Please try again.",
        )

    # Sanitize — strip any HTML/markup the model may have emitted
    response_text = _sanitize_response(response_text)

    suggestions = _get_suggestions(payload.message, response_text)

    return AssistantChatResponse(
        response=response_text,
        suggestions=suggestions,
    )
