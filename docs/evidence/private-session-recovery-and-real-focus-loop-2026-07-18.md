# Private session recovery and real focus-loop evidence

- Date: 2026-07-18
- Environment: protected `live-mobile` Cloud Run tag, `asia-east1`
- Stable production boundary: `time-sovereignty-00024-dih` remained at 100%
  normal traffic throughout this acceptance

## Session recovery

- The original twelve-hour single-device session expired during real product
  testing and correctly returned HTTP 401 before a Goal Architect call or save.
- The private session configuration is now 96 hours with a deterministic
  seven-day schema maximum.
- Expired onboarding retains the three in-memory answers, offers in-place
  re-pairing, and retries the same request identity after a fresh one-time code.
- A same-origin `/pair` recovery page is also available for an already-open
  older tab. The recording profile remains separate and unchanged.

## Real focus-loop acceptance

1. A previously confirmed short goal displayed a 20-minute user-owned work
   block instead of the 15-second engineering control.
2. Starting the block created one real Cloud Task for
   `2026-07-18T14:11:46.283Z`.
3. Cloud Tasks called the tagged callback at
   `2026-07-18T14:11:46.060459Z`; Cloud Run returned HTTP 200 in 0.162 seconds.
4. The open physical Android PWA polled the check-in to `PENDING` and exposed
   text, voice, and photo reporting.
5. Chloe deliberately submitted a real progress photo plus a self-assessment.
   The raw reply and media are excluded from this evidence.
6. GPT-5.6 classified the sprint as `COMPLETED`. The normal path used Chief of
   Staff only; Commitment Recovery correctly did not run.
7. Chloe confirmed completion. Firestore returned `CONFIRMED`, preserved the
   structured decision, safe trace, and memory proposal, and stored no next
   follow-up. The Cloud Tasks queue was empty after confirmation.
8. The private PWA displayed **Goal completed** and explicitly stated that any
   photo was temporary and not stored. No artificial thirty-day journey was
   created.

## Safe Agent evidence

- Agent: `CHIEF_OF_STAFF`
- Provider: `openai`
- Returned model: `gpt-5.6-sol`
- Output schema: `LiveChiefOfStaffDecision`
- Token usage: 1,255 input, 229 output, 1,484 total
- SDK retries: zero
- Trace count: one
- Assessment: `COMPLETED`
- Follow-up: null

## Media persistence evidence

- The client-safe confirmed projection contained no photo, image, or media
  field.
- A Firestore REST field-name inspection of the decision-ready document found
  zero field paths matching photo, image, media, base64, or data URL.
- The deployed decision card states that the saved record contains only the
  structured outcome, safe trace, memory proposal, and follow-up state.
- Future Chief prompts explicitly forbid implying server-side media
  persistence. The regression test verifies this instruction is present when
  an image is supplied.

## Verification and deployment

- Full test suite: 118 passed, 8 deliberately skipped live-only tests.
- ESLint: passed.
- TypeScript: passed.
- Production build: passed.
- Acceptance revision: `time-sovereignty-00033-wir` (`live-mobile`, 0% normal
  traffic).
- Privacy/status polish revision: `time-sovereignty-00034-rok`
  (`live-mobile`, 0% normal traffic), health HTTP 200, provider `live`, model
  `gpt-5.6`.
- Physical Android reload verified the same confirmed record, **Goal
  completed**, the ephemeral-photo notice, memory, and no-follow-up state.
