"""
Real, integrated summarisation provider — self-contained, no dependency
on the standalone ai/summarization test app's config, models, or agent.
"""
import json
from groq import Groq

from app.core.config import settings
from app.models.email import Email
from app.services.ai_providers import SummaryResult

_client = Groq(api_key=settings.GROQ_API_KEY)

_PROMPT_TEMPLATE = """You are an AI sales assistant for PULSE. Analyse this email thread.

Email Thread:
{thread_text}

Return ONLY valid JSON:
{{
    "summary": "one sentence summary",
    "sentiment": "positive/neutral/negative",
    "intent": "demo/buy/negotiate/followup/decline/other",
    "confidence": 0.92,
    "key_points": ["point 1", "point 2"],
    "action_items": ["action 1"],
    "follow_up_suggestion": "Follow up in X days with Y",
    "follow_up_timing": "immediate/today/tomorrow/2_days/3_days/1_week/no_followup"
}}"""


def _format_thread(emails: list[Email]) -> str:
    lines = []
    for e in sorted(emails, key=lambda x: x.sent_at):
        direction = "From" if e.direction == "inbound" else "To"
        lines.append(f"{direction} {e.sender}:\nSubject: {e.subject}\n{e.body_preview or ''}\n")
    return "\n".join(lines)


class GroqConversationSummaryProvider:
    provider_name = "groq"

    def summarize_emails(self, emails: list[Email], prompt: str | None = None) -> SummaryResult:
        if not emails:
            return SummaryResult(summary="No conversation history is available yet.", bullets=[], metadata={"email_count": 0})

        thread_text = _format_thread(emails)
        response = _client.chat.completions.create(
            model=settings.MODEL_NAME or "llama-3.1-8b-instant",
            messages=[{"role": "user", "content": _PROMPT_TEMPLATE.format(thread_text=thread_text)}],
            temperature=0.2,
        )
        raw = response.choices[0].message.content.strip()
        cleaned = raw.removeprefix("```json").removeprefix("```").removesuffix("```").strip()

        try:
            data = json.loads(cleaned)
        except json.JSONDecodeError:
            return SummaryResult(summary="Summary unavailable — response could not be parsed.", bullets=[], metadata={"error": "parse_failed"})

        bullets = data.get("key_points", []) + data.get("action_items", [])
        metadata = {
            "sentiment": data.get("sentiment"),
            "intent": data.get("intent"),
            "confidence": data.get("confidence"),
            "follow_up_suggestion": data.get("follow_up_suggestion"),
            "follow_up_timing": data.get("follow_up_timing"),
            "email_count": len(emails),
        }
        return SummaryResult(summary=data.get("summary", ""), bullets=bullets, metadata=metadata)