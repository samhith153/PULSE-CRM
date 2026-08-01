# PULSE Summarization Module

## Overview
AI-powered email summarisation module for PULSE CRM. Automatically generates one-line summaries, sentiment analysis, and intent detection from email threads.

## Features
- ✅ Email thread summarisation (one-line summary)
- ✅ Sentiment analysis (positive/neutral/negative)
- ✅ Intent detection (demo/buy/negotiate/followup/decline/other)
- ✅ Confidence scoring (0-1)
- ✅ Key points extraction
- ✅ Action items extraction
- ✅ Fast processing (< 1 second)
- ✅ High accuracy (0.95 confidence)

## Tech Stack
- **Framework**: FastAPI
- **AI Provider**: Groq (llama-3.3-70b-versatile)
- **Storage**: Supabase (in-memory for testing)
- **Cache**: Redis (fallback to memory)
- **Container**: Docker

## API Endpoints

### Health Check
GET /health

### Summarise Email Thread
POST /api/v1/summarization/summarise

**Request:**
```json
{
  "thread_id": "string",
  "messages": [
    {
      "sender": "string",
      "recipients": ["string"],
      "subject": "string",
      "body": "string",
      "timestamp": "string (ISO)",
      "direction": "incoming|outgoing"
    }
  ],
  "contact_id": "string (optional)",
  "deal_id": "string (optional)"
}
Response:
{
  "thread_id": "string",
  "summary": "string",
  "sentiment": "positive|neutral|negative",
  "intent": "demo|buy|negotiate|followup|decline|other",
  "confidence": 0.95,
  "key_points": ["string"],
  "action_items": ["string"],
  "processing_time_ms": 665,
  "version": "string"
}

Get Existing Summary
GET /api/v1/summarization/summary/{thread_id}
Quick Start
Prerequisites
Python 3.10+

Groq API Key

Setup
# Activate virtual environment
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Add your Groq API key to .env

# Start the server
python -m src.main

Test
python tests\test_api.py

Environment Variables

SUMMARIZATION_API_KEY=your-groq-api-key
SUMMARIZATION_MODEL=llama-3.3-70b-versatile
SUMMARIZATION_PORT=8003

Integration Status
Component	Status
FastAPI Server	✅ Complete
Groq Integration	✅ Complete
In-Memory Storage	✅ Complete
Supabase Integration	⏳ In Progress
JWT Authentication	⏳ In Progress
Gmail Sync	⏳ In Progress
Frontend Timeline	⏳ In Progress

Author
Bhavani Gujjari
Team PULSE - Conversation Intelligence Engineer