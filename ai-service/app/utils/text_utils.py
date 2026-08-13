"""Text processing utilities (JSON cleaning, prompt response handling)."""
from __future__ import annotations

import json
from typing import Any, Dict


def clean_json_block(text: str) -> str:
    """Strip markdown code fences and surrounding whitespace from an LLM JSON response."""
    cleaned = text.strip()
    if cleaned.startswith("```json"):
        cleaned = cleaned[7:]
    elif cleaned.startswith("```"):
        cleaned = cleaned[3:]
    if cleaned.endswith("```"):
        cleaned = cleaned[:-3]
    return cleaned.strip()


def parse_llm_json(text: str) -> Dict[str, Any]:
    """Parse an LLM JSON response with fallbacks for missing fields."""
    try:
        cleaned = clean_json_block(text)
        data = json.loads(cleaned)

        required = ["summary", "summary_word", "sentiment", "intent", "confidence"]
        for field in required:
            if field not in data:
                raise ValueError(f"Missing field: {field}")

        summary_word = data.get("summary_word", "neutral")
        if len(str(summary_word).split()) > 1:
            data["summary_word"] = str(summary_word).split()[0]

        data.setdefault("category", "general")
        data.setdefault("draft_reply", "No reply suggested.")
        data.setdefault("follow_up_suggestion", "No follow-up suggested.")
        data.setdefault("follow_up_timing", "no_followup")
        data.setdefault("key_points", [])
        data.setdefault("action_items", [])

        return data
    except (json.JSONDecodeError, ValueError):
        summary = text[:200] if len(text) > 200 else text
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
            "follow_up_timing": "no_followup",
        }


def normalize_summary_word(value: str) -> str:
    """Ensure the summary word is a single lowercase token."""
    if not value:
        return "neutral"
    first = str(value).split()[0]
    return first.lower()
