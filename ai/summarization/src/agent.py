import json
from typing import Dict, Any, List
from datetime import datetime
from groq import Groq

from .config import config
from .models import SummariseResponse

# Initialize Groq client
client = Groq(api_key=config.LLM_API_KEY)

def create_prompt(messages: List[Dict], context: str = "") -> str:
    """Create prompt for summarisation."""
    formatted_messages = []
    for msg in messages:
        # Handle both dictionary and Pydantic object
        if isinstance(msg, dict):
            direction = "From" if msg["direction"] == "incoming" else "To"
            sender = msg["sender"]
            body = msg["body"]
        else:
            direction = "From" if msg.direction == "incoming" else "To"
            sender = msg.sender
            body = msg.body
        
        formatted_messages.append(
            f"{direction} {sender}:\n{body}\n"
        )
    
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
    """Parse Groq response with fallback."""
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
        
        # Validate summary_word is single word
        summary_word = data.get("summary_word", "neutral")
        if len(summary_word.split()) > 1:
            data["summary_word"] = summary_word.split()[0]
        
        # Ensure category exists
        if "category" not in data:
            data["category"] = "general"
        
        # Ensure draft_reply exists
        if "draft_reply" not in data:
            data["draft_reply"] = "No reply suggested."
        
        # ✅ NEW: Ensure follow-up fields exist
        if "follow_up_suggestion" not in data:
            data["follow_up_suggestion"] = "No follow-up suggested."
        
        if "follow_up_timing" not in data:
            data["follow_up_timing"] = "no_followup"
        
        return data
    except (json.JSONDecodeError, ValueError) as e:
        print(f"⚠️ Parse error: {e}")
        summary = response_text[:200] if len(response_text) > 200 else response_text
        return {
            "summary": summary,
            "summary_word": "neutral",
            "sentiment": "neutral",
            "intent": "other",
            "confidence": 0.5,
            "key_points": [],
            "action_items": [],
            "category": "general",
            "draft_reply": "Unable to generate reply.",
            "follow_up_suggestion": "Unable to suggest follow-up.",
            "follow_up_timing": "no_followup"
        }

async def summarise_thread(
    thread_id: str,
    messages: List,
    contact_id: str = None,
    deal_id: str = None
) -> SummariseResponse:
    """Summarise an email thread using Groq."""
    start_time = datetime.now()
    
    context = ""
    if contact_id:
        context += f"Contact ID: {contact_id}\n"
    if deal_id:
        context += f"Deal ID: {deal_id}\n"
    
    prompt = create_prompt(messages, context)
    model = config.LLM_MODEL
    
    print(f"📝 Summarising thread: {thread_id}")
    print(f"🤖 Using model: {model}")
    
    for attempt in range(config.MAX_RETRIES + 1):
        try:
            print(f"🔄 Attempt {attempt + 1}...")
            
            response = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": "You are an AI sales assistant. Return ONLY valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=config.LLM_TEMPERATURE,
                max_tokens=config.LLM_MAX_TOKENS,
            )
            
            result_text = response.choices[0].message.content
            print(f"✅ Groq response received ({len(result_text)} chars)")
            
            result = parse_response(result_text)
            
            if result.get("confidence", 0) >= config.MIN_CONFIDENCE_THRESHOLD:
                print(f"✅ Confidence: {result.get('confidence')} (threshold met)")
                break
            else:
                print(f"⚠️ Confidence too low: {result.get('confidence')}")
                continue
                
        except Exception as e:
            print(f"❌ Groq error: {e}")
            if attempt == config.MAX_RETRIES:
                result = {
                    "summary": f"Email thread with {len(messages)} messages",
                    "summary_word": "neutral",
                    "sentiment": "neutral",
                    "intent": "other",
                    "confidence": 0.1,
                    "key_points": [],
                    "action_items": [],
                    "category": "general",
                    "draft_reply": "Unable to process this thread.",
                    "follow_up_suggestion": "Unable to suggest follow-up.",
                    "follow_up_timing": "no_followup"
                }
            else:
                continue
    
    processing_time = int((datetime.now() - start_time).total_seconds() * 1000)
    
    return SummariseResponse(
        thread_id=thread_id,
        summary=result.get("summary", "Unable to generate summary"),
        summary_word=result.get("summary_word", "neutral"),
        sentiment=result.get("sentiment", "neutral"),
        intent=result.get("intent", "other"),
        confidence=result.get("confidence", 0.1),
        key_points=result.get("key_points", []),
        action_items=result.get("action_items", []),
        category=result.get("category", "general"),
        draft_reply=result.get("draft_reply", "No reply suggested."),
        follow_up_suggestion=result.get("follow_up_suggestion", "No follow-up suggested."),
        follow_up_timing=result.get("follow_up_timing", "no_followup"),
        processing_time_ms=processing_time,
        model_version=config.LLM_MODEL
    )