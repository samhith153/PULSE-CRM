import requests
import json

# Test data
test_data = {
    "thread_id": "test_001",
    "messages": [
        {
            "sender": "sarah.johnson@edutech.com",
            "recipients": ["rep@kalnet.com"],
            "subject": "Demo Request",
            "body": "Hi, we're interested in your enterprise plan for our 500+ users. Can we schedule a demo next week?",
            "timestamp": "2026-07-20T10:00:00Z",
            "direction": "incoming"
        },
        {
            "sender": "rep@kalnet.com",
            "recipients": ["sarah.johnson@edutech.com"],
            "subject": "Re: Demo Request",
            "body": "Thanks Sarah! Would Tuesday at 2 PM work for you?",
            "timestamp": "2026-07-20T10:30:00Z",
            "direction": "outgoing"
        }
    ]
}

print("=" * 50)
print("Testing Summarization API")
print("=" * 50)

# Test health endpoint
print("\n1. Testing health endpoint...")
try:
    response = requests.get("http://localhost:8003/health")
    print(f"✅ Health check: {response.json()}")
except Exception as e:
    print(f"❌ Health check failed: {e}")
    print("   Make sure the API is running! (python -m src.main)")

# Test summarisation
print("\n2. Testing summarisation endpoint...")
try:
    response = requests.post(
        "http://localhost:8003/api/v1/summarization/summarise",
        json=test_data,
        timeout=30
    )
    print(f"✅ Summarisation response:")
    print(json.dumps(response.json(), indent=2))
except requests.exceptions.ConnectionError:
    print("❌ API not running! Start with: python -m src.main")
except Exception as e:
    print(f"❌ Summarisation failed: {e}")

print("\n" + "=" * 50)