# PULSE — Recommendation / Next-Best-Action Engine (Phase 1)

Rule-based engine that suggests the next best action for a lead — e.g.
"Send follow-up" or "Schedule demo" — based on its score, pipeline stage,
and recent activity. Every recommendation includes a plain-English reason,
per PULSE's "no black-box scores or recommendations" design principle.

Phase 1 is intentionally rule-based, not ML — this matches the "usable
before it's automated" principle in the PULSE spec. The output interface
is designed so Stage 3's ML model can later replace the rule table
without changing anything downstream.

## How it works

For each candidate action valid at a lead's current pipeline stage:

```
weight(action) = w_s * score_norm + w_u * urgency + w_r * reply_factor
recommended_action = argmax(weight(action))
```

The winning action's reason is generated from whichever single factor
contributed most to its weight.

## Project structure

```
app/
  rules.py       Action definitions: which stages they apply to, and their weights
  engine.py      Core scoring + recommendation logic
  models.py      Pydantic request/response models
  api.py         FastAPI routes (single lead + bulk)
  main.py        App entrypoint
  tests/
    test_engine.py   Unit tests for the rule logic
```

## Running locally

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Then visit `http://localhost:8000/docs` for interactive API docs, or:

```bash
curl http://localhost:8000/leads/lead_00123/recommendation
```

## Running tests

```bash
pytest
```

## Dependencies

- **Lead Scoring module** — this engine cannot function without `current_score`.
  `fetch_lead_features()` in `api.py` is a placeholder; swap it for a real
  query once the Data Engineer's `lead_features` table is live.
- **Activities/Timeline (event log)** — feeds `days_since_last_activity` and
  `reply_received`, which in turn depends on Gmail integration being live.

## Next steps (Phase 3)

- Replace `rules.py`'s fixed weights with a trained model (same output shape)
- Add a confidence gap between the top action and runner-up
- Log rep overrides/dismissals as a feedback signal
