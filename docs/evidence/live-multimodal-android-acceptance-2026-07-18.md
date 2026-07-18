# Live multimodal Android acceptance — 2026-07-18

## Outcome

The protected Android PWA completed a real user-facing vertical path with a
text report and a temporarily attached photo. The server ran GPT-5.6, invoked
Commitment Recovery only after the Chief of Staff classified the situation as
blocked, returned the persisted structured decision to the phone, accepted the
user's confirmation, and scheduled the next Cloud Task.

No photo bytes, raw reply, prompt, secret, or private reasoning are included in
this evidence file. The photo was sent only as ephemeral model input and was
not persisted by the application.

## Failure exposed by the physical phone

The first reply reached preview revision `time-sovereignty-00027-xuw` as a
65,606-byte POST and completed all model work in 16.223 seconds. Its safe log
recorded:

- assessment: `BLOCKED`
- dispatched Agent: `COMMITMENT_RECOVERY`
- provider: `openai`
- resolved model: `gpt-5.6-sol`
- total token usage: 3,336

The response nevertheless returned HTTP 400, and subsequent polling also
returned HTTP 400. The decision had been safely persisted; serialization back
to the phone failed because the stored check-in allowed three trace IDs while
`ClientLiveCheckInSchema` allowed at most two trace rows. A blocked path is
legitimately three rows: Chief triage, Commitment Recovery, final Chief.

## Correction

- Raised the client-safe trace bound from two to three, matching the persisted
  document contract.
- Added a regression test containing the complete Chief → Recovery → Chief
  trace.
- Replaced the ambiguous polling notice with an explicit refresh failure that
  tells the user not to resend.
- Preserved and surfaced the server error code when a direct reply cannot be
  returned, while keeping the idempotent reply identity.

## Verification

Local verification after the correction:

- focused schema/session tests: 10 passed
- complete suite: 94 passed, 8 live-only tests skipped
- ESLint: passed
- TypeScript: passed
- production Next.js build: passed

Cloud verification:

- preview revision: `time-sovereignty-00028-yec`
- preview tag: `live-mobile`, 0% normal traffic
- stable revision: `time-sovereignty-00024-dih`, 100% normal traffic
- preview health: HTTP 200, provider mode `live`, configured model `gpt-5.6`
- the already-persisted three-trace decision rendered on the Android phone
  without another model call
- user confirmation POST returned HTTP 200 at `2026-07-18T02:59:00Z`
- the phone displayed that decision, memory, and follow-up state were saved
- Cloud Tasks contained the next follow-up for `2026-07-18T03:02:39Z`, with
  zero dispatch and response attempts when inspected before its due time
- at its due time, Cloud Tasks called the preview task endpoint exactly once;
  the callback returned HTTP 200 in 0.143 seconds

This acceptance proves the real product loop rather than a scripted local
simulation. Promotion of revision `00028-yec` to stable traffic remains a
separate explicit decision.
