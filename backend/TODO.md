# Fix: `summarise_thread` ImportError on Render Deployment

## Steps

- [x] Step 0: Investigate and identify root cause
- [x] Step 1: Update `backend/ai/summarization/src/models.py` — Add `SummariseRequest` and sync `SummariseResponse`
- [x] Step 2: Create `backend/ai/summarization/src/config.py` — Configuration module
- [x] Step 3: Create `backend/ai/summarization/src/database.py` — In-memory storage for summaries
- [x] Step 4: Update `backend/ai/summarization/src/agent.py` — Add `async def summarise_thread(...)` with Groq support
- [x] Step 5: Update `backend/requirements.txt` — Add `groq` dependency

