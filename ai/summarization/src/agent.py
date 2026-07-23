# src/agent.py - Groq Implementation
import json
import os
from typing import Dict, Any, List
from datetime import datetime

from .config import config
from .models import SummariseResponse

# Import Groq
from groq import Groq

# Initialize Groq client
client = Groq(api_key=config.LLM_API_KEY)

def create_prompt(messages: List, context: str = "") -> str:
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
    
    prompt = f"""You are an AI sales assistant for PULSE, a revenue platform.
Your task is to summarise email conversations for sales reps.

{context}

Email Thread:
{thread_text}

Rules:
1. Output exactly one sentence summary
2. Include action items if present
3. Mention timing or deadlines
4. Be specific, not generic

Return ONLY valid JSON in this exact format, nothing else:
{{
    "summary": "one sentence summary",
    "sentiment": "positive/neutral/negative",
    "intent": "demo/buy/negotiate/followup/decline/other",
    "confidence": 0.92,
    "key_points": ["point 1", "point 2"],
    "action_items": ["action 1", "action 2"]
}}"""
    return prompt

def parse_response(response_text: str) -> Dict[str, Any]:
    """Parse Groq response with fallback."""
    try:
        # Clean the response (remove markdown code blocks if present)
        cleaned = response_text.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        if cleaned.startswith("```"):
            cleaned = cleaned[3:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        cleaned = cleaned.strip()
        
        data = json.loads(cleaned)
        required = ["summary", "sentiment", "intent", "confidence"]
        for field in required:
            if field not in data:
                raise ValueError(f"Missing field: {field}")
        return data
    except (json.JSONDecodeError, ValueError) as e:
        print(f"⚠️ Parse error: {e}")
        # Try to extract summary from raw text
        summary = response_text[:200] if len(response_text) > 200 else response_text
        return {
            "summary": summary,
            "sentiment": "neutral",
            "intent": "other",
            "confidence": 0.5,
            "key_points": [],
            "action_items": []
        }

async def summarise_thread(
    thread_id: str,
    messages: List,
    contact_id: str = None,
    deal_id: str = None
) -> SummariseResponse:
    """Summarise an email thread using Groq."""
    start_time = datetime.now()
    
    # Build context
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
            
            # Call Groq API
            response = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": "You are an AI sales assistant that summarises email conversations. Return ONLY valid JSON."},
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
                    "sentiment": "neutral",
                    "intent": "other",
                    "confidence": 0.1,
                    "key_points": [],
                    "action_items": []
                }
            else:
                continue
    
    processing_time = int((datetime.now() - start_time).total_seconds() * 1000)
    
    return SummariseResponse(
        thread_id=thread_id,
        summary=result.get("summary", "Unable to generate summary"),
        sentiment=result.get("sentiment", "neutral"),
        intent=result.get("intent", "other"),
        confidence=result.get("confidence", 0.1),
        key_points=result.get("key_points", []),
        action_items=result.get("action_items", []),
        processing_time_ms=processing_time,
        model_version=config.LLM_MODEL
    )