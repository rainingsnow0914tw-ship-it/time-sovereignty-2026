# Decision 0011: Single-device live check-in preview

- Date: 2026-07-17
- Status: Accepted
- Decision owner: Chloe
- Implementer: Codex

## Context

The public PWA already demonstrates the complete longitudinal journey, but its
interactive phone check-in is intentionally local and mock. Chloe approved one
real user-facing vertical path for the recorded Build Week demo and for later
private personal use. The OpenAI key must remain server-side, the public GitHub
repository must not grant the world access to Chloe's private check-ins, and a
full native Android application is out of scope.

## Decision

1. Keep the existing public journey and all existing cost, OIDC, Firestore,
   idempotency, safe-trace, and zero-SDK-retry controls.
2. Add a separate live check-in path to the installed PWA. It is disabled
   unless the server has all live-device configuration.
3. Pair exactly one browser device with a one-time secret. Issue a signed,
   `HttpOnly`, `Secure`, `SameSite=Strict` session cookie that expires after
   twelve hours. Never place the pairing secret, session secret, or OpenAI key
   in client code, Git, browser storage, logs, evidence, or API responses.
4. Let Cloud Tasks OIDC change a scheduled check-in to pending. The open PWA
   polls only while visible, presents text plus tap-to-play browser TTS, and
   accepts text or browser speech transcription.
5. A reply calls exactly two real GPT-5.6 contracts: Commitment Recovery and
   Chief of Staff. The same reply id is idempotent and cannot repeat model
   cost. Persist only safe traces; raw prompts and private reasoning remain
   excluded.
6. Require explicit user confirmation before persisting the adapted
   commitment, confirmed memory, or next follow-up task.
7. Expose the real provider, returned model, token usage, trace identity, and
   completion status in Developer mode without exposing raw reply text.
8. Build and validate through a no-traffic Cloud Run preview first. Promote it
   only after cloud Firestore, Cloud Tasks, authentication, duplicate-cost, and
   live-model checks pass. The current stable revision remains the rollback
   point.
9. After the demo, revoke the device session and rotate or disable the pairing
   secret. Physical Android pairing and recording are a separate human step;
   USB is not required for backend or preview construction.

## Consequences

- The scripted story can be predetermined, while both model calls and the user
  response remain real.
- Polling is deliberately short-lived and single-device; this is not a public
  multi-tenant authentication system.
- Cloud testing may use a small number of deliberate live calls. Queue limits,
  one-instance concurrency, no SDK retries, leases, and idempotency still bound
  accidental cost.
- The GitHub repository remains safe to publish because every credential and
  device authorization value is supplied at deployment time through Secret
  Manager.
