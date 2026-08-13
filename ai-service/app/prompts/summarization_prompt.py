"""Prompt template for email thread summarization."""
from __future__ import annotations

from typing import List


def create_summarization_prompt(messages: List[dict], context: str = "") -> str:
    """Build the LLM prompt for summarising an email thread.

    Args:
        messages: list of dicts with keys sender, direction, body
        context: optional context block (contact_id / deal_id)

    Returns:
        the formatted prompt string
    """
    formatted_messages = []
    for msg in messages:
        direction = "From" if msg["direction"] == "incoming" else "To"
        sender = msg["sender"]
        body = msg["body"]
        formatted_messages.append(f"{direction} {sender}:\n{body}\n")

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
