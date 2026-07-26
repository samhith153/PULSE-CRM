# Recommendation Feature Mapping

## Overview

The five original v1 fields remain unchanged and continue to power the current rule-based engine. This proposal adds six new fields that increase the precision of recommendations without requiring any ML model change. They extend the same weighted rule-scoring approach already in production.

## Feature Table

| Feature | Type | Source | Notes |
| --- | --- | --- | --- |
| `lead_id` | User-entered | Leads table | Primary key |
| `current_score` | Derived | Lead Scoring module output | Existing - core input |
| `current_stage` | User-entered | Deals / pipeline table | Existing - filters valid actions |
| `days_since_last_activity` | Computed | Activities timeline | Existing - drives urgency |
| `reply_received_flag` | Computed | Activities timeline | Existing - drives reply factor |
| `deal_value` **NEW** | User-entered | Deals table | Prioritizes high-value leads for urgency/follow-up |
| `email_open_count` **NEW** | Computed | Activities timeline (Gmail sync) | Distinguishes interested-but-stuck vs never opened |
| `email_opened_no_reply_flag` **NEW** | Computed | Derived from open_count + reply_flag | Flags a specific stuck-lead pattern |
| `meeting_attendance_status` **NEW** | Derived | Activities / Calendar events | Attended / no-show / rescheduled changes next action |
| `rep_active_action_count` **NEW** | Computed | Aggregated from recommendations table | Avoids overloading a rep with duplicate actions |
| `best_contact_time_slot` **NEW** | Computed | Historical activity timestamps | Informs when, not just what, action to suggest |
| `has_upcoming_activity` | Derived | Activities / Tasks table | Existing - unchanged |
| `stage_dwell_time` | Computed | Deals table (stage entry timestamp) | Existing - unchanged |

## Why These Additions Matter

`deal_value` lets the engine treat a high-value deal going stale with more urgency than a low-value one. `email_open_count` and `email_opened_no_reply_flag` together catch a distinct pattern: a lead who is engaged but stuck, which the current binary reply flag cannot detect. `meeting_attendance_status` changes the next action meaningfully depending on whether a scheduled meeting was attended, missed, or rescheduled. `rep_active_action_count` prevents the engine from overloading a single rep with too many simultaneous suggestions. `best_contact_time_slot` moves the engine from recommending only what to do toward also recommending when to do it.
