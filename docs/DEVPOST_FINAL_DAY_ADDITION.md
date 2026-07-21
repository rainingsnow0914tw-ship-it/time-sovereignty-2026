# Final-day V2 addition — public summary

The final-day V2 work focused on defects found during real phone use: semantic conversation summarization, an opt-in sourced lookup tool, decisive voice closure, explicit application capability boundaries, human-readable failures, and a consent-bounded Android escalation lane.

## Honest proof boundary

- The original V1 submission video remains https://youtu.be/d0cX1V4R7h4.
- The V2 supplement is https://youtu.be/XPdfnJ6klu0.
- The incoming-call screen in the supplement is labelled as a native UI replay. The real cloud path is verified separately by redacted server timestamps and physical acceptance notes.
- The 2026-07-21 run used a 15-second test override to compress waiting time. It is not the intended production cadence.
- Structured decisions use GPT-5.6. `gpt-realtime-2.1` is used only when the user starts voice.

## Redacted physical acceptance timeline

```text
11:23:38  /api/live/check-ins/schedule            200
11:25:38  /api/tasks/live-checkins/{id}           200
11:25:50  /api/live/realtime/session              200
11:25:53  /api/tasks/catch-v2/.../levels/2        200
11:26:08  /api/tasks/catch-v2/.../levels/4        200
11:26:58  /api/live/check-ins/summary             200
11:27:16  /api/live/native/events/{id}/responses  200
11:32:08  /api/live/check-ins/{id}/confirm        200
```

Final state: `CONFIRMED`, memory disposition `DEFER`, completed curation, no recorded error, and two safe Agent traces. The user completed the agreed action; the assistant stored limited evidence and created no unnecessary follow-up.

## Development-tool disclosure

Codex built the V1 baseline and remained the primary engineering environment. Claude Code continued bounded final-day V2 work from the documented handoff after the Codex quota was exhausted. The Git history preserves both contributions. GPT-5.6 and Realtime are the product runtime models.

See [DEVPOST_STORY_FINAL.md](DEVPOST_STORY_FINAL.md) for the canonical complete Story.
