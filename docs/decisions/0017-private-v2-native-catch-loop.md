# Decision 0017 — Private V2 native catch loop

Date: 2026-07-19 (Asia/Shanghai)
Status: Accepted for isolated V2 construction

## Context

Public V1 proves that a scheduled Cloud Task, GPT-5.6 decision, progress
evidence, and layered memory can help a user complete a real action. It still
depends on an open PWA polling for a pending check-in. V2 must let the system
find a consenting user after the app leaves the foreground.

Chloe Catch Loop already validates the Android delivery pattern. Its product
contract and Android client are references, not merge targets. Both local
copies contain existing uncommitted user work, and their backend may be older
than the Cloud Shell runtime.

## Decision

Build V2 in this separate local-only repository. Preserve the accepted V1
brain, memory, OIDC, idempotency, and consent boundaries. Add a thin native
Android delivery client and a deterministic escalation domain.

The first vertical path is:

1. A durable scheduled event becomes due.
2. Backend sends a Level 1 data-only FCM message.
3. No response by the bounded deadline creates a Level 2 interactive event.
4. A second miss creates one Level 4 full-screen call event.
5. Android displays a bounded ring/vibration call surface using
   `CATEGORY_CALL` and `setFullScreenIntent`.
6. The user answers by voice or chooses `complete`, `reschedule`, `downgrade`,
   or `mercy`.
7. The backend persists exactly one response receipt and Episode.
8. `reschedule` atomically creates the promised next event.
9. The existing GPT-5.6 and layered-memory path receives the response as
   limited evidence and proposes the next intervention.
10. Level 4 timeout stops contact and records a strategy signal; it does not
    loop indefinitely.

## Reused patterns

- Pure escalation transition: `1 -> 2 -> 4 -> null`.
- Response type as a domain event across status, logs, memory, and next action.
- Data-only FCM with flat string payloads.
- Android call category and full-screen intent.
- Bounded ringing and vibration that honor the device ringer mode.
- Code-enforced follow-up creation after reschedule.

## Explicit non-goals for the first slice

- No public guest access.
- No V1 Devpost, README, video, or Cloud Run changes.
- No wearables, smart speakers, health inference, or background surveillance.
- No A2A/P2P port, old in-memory store, old backend config, or Gemini-specific
  voice backend.
- No copying Catch Loop secrets, Firebase configuration, user data, APKs, or
  dirty working-tree files.

## Acceptance criteria

- Unit tests prove each escalation transition and every stop condition.
- Quiet hours, pause, disabled category, low priority, and expired consent stop
  escalation deterministically.
- Duplicate ticks and duplicate FCM callbacks create no second event or cost.
- Android receives a data-only payload and opens one full-screen call in an
  allowed test state.
- Ringer and vibration stop after a bounded duration and on every exit path.
- Each response writes one receipt; reschedule writes one real next event.
- A physical-phone test proves notification -> call -> response -> persisted
  follow-up without touching the public V1 deployment.

## Reference anchors

Read only as needed from Chloe Catch Loop:

- `docs/catch-contract.md`
- `src/catch-engine.js`
- `src/fcm.js`
- `android/app/src/main/java/com/chloe/catchloop/CatchMessagingService.kt`
- `android/app/src/main/java/com/chloe/catchloop/CatchPayloadParser.kt`
- `android/app/src/main/java/com/chloe/catchloop/FakeCallActivity.kt`
- `android/app/src/main/java/com/chloe/catchloop/VoiceSession.kt`

## Privacy and repository rule

This V2 repository has no Git remote. Adding a private remote, granting access,
or publishing any V2 artifact requires Chloe's explicit approval.
