"""
Conversation Service — ported exactly from ai/summarization/src/agent.py.

Uses Groq LLM to generate lead conversation summaries.
"""

import asyncio
import json
import os
from typing import Dict, Any, List
from datetime import datetime

from groq import AsyncGroq

from app.core.config import settings


_groq_client = None


def _get_client() -> AsyncGroq:
    global _groq_client
    if _groq_client is None:
        api_key = (
            os.getenv("GROQ_API_KEY")
            or os.getenv("LLM_API_KEY")
            or os.getenv("SUMMARIZATION_API_KEY")
        )
        if not api_key:
            raise ValueError(
                "No LLM API key found. Set GROQ_API_KEY, LLM_API_KEY, or "
                "SUMMARIZATION_API_KEY environment variable."
            )
        _groq_client = AsyncGroq(api_key=api_key)
    return _groq_client


def create_prompt(messages: List[Dict], context: str = "") -> str:
    formatted_messages = []
    for msg in messages:
        if isinstance(msg, dict):
            direction = "From" if msg["direction"] == "incoming" else "To"
            sender = msg["sender"]
            subject = msg.get("subject", "")
            body = msg["body"]
            timestamp = msg.get("timestamp", "")
        else:
            direction = "From" if msg.direction == "incoming" else "To"
            sender = msg.sender
            subject = getattr(msg, "subject", "")
            body = msg.body
            timestamp = getattr(msg, "timestamp", "")

        header = f"{direction} {sender}"
        if subject:
            header += f" | Subject: {subject}"
        if timestamp:
            header += f" | {timestamp}"
        formatted_messages.append(f"{header}:\n{body}\n")

    thread_text = "\n".join(formatted_messages)

    prompt = f"""
You are an AI sales assistant for PULSE, a revenue platform.
Your task is to analyse email conversations and provide structured insights.

{context}

Email Thread:
{thread_text}

=== TASK 1: SUMMARY ===
Write a one-sentence summary of the email thread.

=== TASK 2: SUMMARY WORD (For Lead Scoring) ===
Choose ONE word that best represents this email:
- "demo_request" - Asked for demo
- "contract_signed" - Deal closed
- "pricing_negotiation" - Discussing pricing
- "interested" - Prospect shows interest
- "proposal" - Proposal sent
- "budget" - Budget discussion
- "meeting" - Meeting requested
- "follow_up" - Needs follow-up
- "inquiry" - General question
- "introduction" - Intro email
- "positive" - Very positive
- "neutral" - Neutral tone
- "negative" - Very negative
- "thank_you" - Thank you email
- "referral" - Referral given
- "support" - Support request
- "complaint" - Negative feedback
- "lost" - Deal lost
- "urgent" - Urgent action needed

=== TASK 3: SENTIMENT ===
Choose ONE: positive / neutral / negative

=== TASK 4: INTENT ===
Choose ONE: demo / buy / negotiate / followup / decline / other

=== TASK 5: CONFIDENCE ===
Rate your confidence (0.0 to 1.0)

=== TASK 6: KEY POINTS ===
Extract 2-5 key points from the conversation

=== TASK 7: ACTION ITEMS ===
Extract any action items or next steps

=== TASK 8: EMAIL CATEGORY (For Classification) ===
Choose ONE category:
- "sales" - Sales-related conversation
- "support" - Support/help request
- "general" - General conversation
- "urgent" - Urgent/important matters

=== TASK 9: DRAFT REPLY ===
Write a 1-2 sentence suggested draft reply.

=== TASK 10: FOLLOW-UP SUGGESTION ===
Suggest the best follow-up action and timing.

Examples:
- "Follow up in 2 days with pricing details"
- "Follow up tomorrow morning regarding demo availability"
- "Follow up in 1 week with proposal"
- "Follow up immediately - urgent response needed"
- "Follow up in 3 days to check if they received the document"
- "No follow-up needed - deal is closed"
- "Follow up after the meeting scheduled for Tuesday"

=== TASK 11: FOLLOW-UP TIMING ===
Choose ONE timing:
- "immediate" - Need to respond right away
- "today" - Respond today
- "tomorrow" - Respond tomorrow
- "2_days" - Follow up in 2 days
- "3_days" - Follow up in 3 days
- "1_week" - Follow up in 1 week
- "2_weeks" - Follow up in 2 weeks
- "no_followup" - No follow-up needed

Return ONLY valid JSON in this exact format:
{{
    "summary": "one sentence summary",
    "summary_word": "single_word_tag",
    "sentiment": "positive/neutral/negative",
    "intent": "demo/buy/negotiate/followup/decline/other",
    "confidence": 0.92,
    "key_points": ["point 1", "point 2"],
    "action_items": ["action 1", "action 2"],
    "category": "sales/support/general/urgent",
    "draft_reply": "Suggested reply...",
    "follow_up_suggestion": "Follow up in X days with Y",
    "follow_up_timing": "immediate/today/tomorrow/2_days/3_days/1_week/no_followup"
}}
"""
    return prompt


def parse_response(response_text: str) -> Dict[str, Any]:
    try:
        cleaned = response_text.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        if cleaned.startswith("```"):
            cleaned = cleaned[3:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        cleaned = cleaned.strip()

        data = json.loads(cleaned)
        required = ["summary", "summary_word", "sentiment", "intent", "confidence"]
        for field in required:
            if field not in data:
                raise ValueError(f"Missing field: {field}")

        summary_word = data.get("summary_word", "neutral")
        if len(summary_word.split()) > 1:
            data["summary_word"] = summary_word.split()[0]

        if "category" not in data:
            data["category"] = "general"
        if "draft_reply" not in data:
            data["draft_reply"] = "No reply suggested."
        if "follow_up_suggestion" not in data:
            data["follow_up_suggestion"] = "No follow-up suggested."
        if "follow_up_timing" not in data:
            data["follow_up_timing"] = "no_followup"

        return data
    except (json.JSONDecodeError, ValueError):
        return {
            "summary": response_text[:200] if len(response_text) > 200 else response_text,
            "summary_word": "neutral",
            "sentiment": "neutral",
            "intent": "other",
            "confidence": 0.5,
            "key_points": [],
            "action_items": [],
            "category": "general",
            "draft_reply": "Unable to generate reply.",
            "follow_up_suggestion": "Unable to suggest follow-up.",
            "follow_up_timing": "no_followup",
        }


async def summarise_thread(thread: Dict[str, Any]) -> str:
    """Summarise an email thread using Groq (async). Returns the raw summary text."""
    messages = []
    for msg in thread.get("inbound", []):
        messages.append({
            "direction": "incoming",
            "sender": msg.get("sender", "lead"),
            "subject": msg.get("subject", ""),
            "body": msg.get("body", ""),
            "timestamp": msg.get("timestamp", ""),
        })
    for msg in thread.get("outbound", []):
        messages.append({
            "direction": "outgoing",
            "sender": msg.get("sender", "rep"),
            "subject": msg.get("subject", ""),
            "body": msg.get("body", ""),
            "timestamp": msg.get("timestamp", ""),
        })

    if not messages:
        return "No messages to summarise."

    prompt = create_prompt(messages)

    response = await asyncio.wait_for(
        _get_client().chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are an AI sales assistant. Return ONLY valid JSON."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.3,
            max_tokens=1500,
            timeout=settings.LLM_TIMEOUT,
        ),
        timeout=settings.LLM_TIMEOUT + 5,
    )

    return response.choices[0].message.content.strip()
_PURPOSE_GUIDANCE = {
    "cold_intro": "This is a first-touch introduction email to someone who has not been contacted before. Keep it short, friendly, and low-pressure.",
    "follow_up": "This is a follow-up email to someone PULSE has already been in touch with. Reference that there's an existing relationship without inventing specific prior details unless given in context.",
    "check_in": "This is a light check-in email to re-engage a contact who has gone quiet. Keep it brief and easy to reply to.",
    "proposal": "This email should reference sending over a proposal or next steps and invite the recipient to discuss.",
    "thank_you": "This is a short thank-you email, warm and genuine, with an optional light next-step.",
    "custom": "Follow the free-text instruction given in the context field as closely as possible.",
}


def create_draft_prompt(
    recipient_name: str,
    recipient_email: str,
    company: str = "",
    designation: str = "",
    purpose: str = "follow_up",
    context: str = "",
    sender_name: str = "",
) -> str:
    guidance = _PURPOSE_GUIDANCE.get(purpose, _PURPOSE_GUIDANCE["follow_up"])
    sender_line = f"The email is being sent by {sender_name}." if sender_name else "The sender's name is not given; do not invent one — sign off generically (e.g. 'Best regards')."

    prompt = f"""
You are an elite AI sales assistant for PULSE CRM. Draft a highly accurate, context-aware outbound email for a sales rep to send to a contact.

Recipient: {recipient_name}
Recipient email: {recipient_email}
Company: {company or "Unknown"}
Designation: {designation or "Unknown"}
Purpose: {purpose}
{guidance}
{sender_line}

=== CRITICAL HISTORICAL CONTEXT ===
The following contains the CRM notes and recent email history with this prospect. 
You MUST read this deeply and reference relevant past interactions naturally. Do NOT write a generic email if history exists.

[HISTORY LOGS & NOTES]:
{context if context else "No prior history recorded. Treat this as a net-new outreach."}

=== DRAFTING RULES ===
- Keep the body under 120 words.
- Maintain a professional, warm, and consultative tone. Sound completely human, not like an AI.
- If the history shows a previous meeting, reference it. If it shows an ongoing pain point, address it.
- Do NOT fabricate specific prices, dates, or prior conversations that are not explicitly mentioned in the context above.
- Do not include the subject line inside the body text.

Return ONLY valid JSON in this exact format:
{{
    "subject": "short, highly relevant subject line",
    "body": "the email body, with \\n for line breaks"
}}
"""
    return prompt


def parse_draft_response(response_text: str) -> Dict[str, str]:
    try:
        cleaned = response_text.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        if cleaned.startswith("```"):
            cleaned = cleaned[3:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        cleaned = cleaned.strip()

        data = json.loads(cleaned)
        subject = str(data.get("subject", "")).strip() or "Following up"
        body = str(data.get("body", "")).strip() or "Unable to generate a draft. Please write your message here."
        return {"subject": subject, "body": body}
    except (json.JSONDecodeError, ValueError):
        return {
            "subject": "Following up",
            "body": response_text.strip()[:600] if response_text else "Unable to generate a draft. Please write your message here.",
        }


async def generate_outreach_draft(
    recipient_name: str,
    recipient_email: str,
    company: str = "",
    designation: str = "",
    purpose: str = "follow_up",
    context: str = "",
    sender_name: str = "",
) -> Dict[str, str]:
    """Generate a fresh outreach email (subject + body) using Groq (async)."""
    prompt = create_draft_prompt(
        recipient_name=recipient_name,
        recipient_email=recipient_email,
        company=company,
        designation=designation,
        purpose=purpose,
        context=context,
        sender_name=sender_name,
    )

    response = await asyncio.wait_for(
        _get_client().chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are an AI sales assistant. Return ONLY valid JSON."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.4,
            max_tokens=350,
            timeout=settings.LLM_TIMEOUT,
        ),
        timeout=settings.LLM_TIMEOUT + 5,
    )

    return parse_draft_response(response.choices[0].message.content.strip())