# tests/test_groq.py
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

api_key = os.getenv("SUMMARIZATION_API_KEY")
model = os.getenv("SUMMARIZATION_MODEL", "llama-3.3-70b-versatile")

print(f"🔑 API Key: {api_key[:10] if api_key else 'MISSING!'}...")
print(f"🤖 Model: {model}")

if not api_key or api_key == "your-api-key-here" or not api_key.startswith("gsk_"):
    print("❌ Invalid Groq API Key! Get one from console.groq.com")
    exit()

try:
    from groq import Groq
    client = Groq(api_key=api_key)
    
    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": "Say 'Hello, world!' in one sentence."}
        ],
        max_tokens=20
    )
    
    print(f"✅ Groq test successful: {response.choices[0].message.content}")
except Exception as e:
    print(f"❌ Groq test failed: {e}")