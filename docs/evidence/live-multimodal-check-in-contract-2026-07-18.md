# Live multimodal check-in contract evidence — 2026-07-18

- Verified at: `2026-07-18 09:53 +08:00`
- Requested model: `gpt-5.6`
- Returned model for every completed call: `gpt-5.6-sol`
- Responses structured-output schemas: `LiveChiefOfStaffDecision`, `CommitmentRecoveryOutput`
- SDK automatic retries: zero
- Raw replies, images, prompts, secrets, and private reasoning persisted: no

## Progress plus transient image

- Synthetic report: a completed writing step plus a locally generated 32×32 PNG transport fixture
- Assessment: `COMPLETED`
- Dispatched specialists: none
- Calls: one Chief of Staff structured call
- Token usage: 657 input / 160 output / 817 total
- Zod schema result: passed
- Image persistence: false

The first image attempt was rejected with HTTP 400 before model execution because
the original 1×1 fixture was not accepted as a valid API image. The fixture was
replaced with a locally decoded 32×32 PNG and only the failed image scenario was
rerun. The already successful recovery scenario was not repeated.

## Illness recovery

- Synthetic report: illness made the original same-day commitment unsuitable
- Assessment: `BLOCKED`
- Dispatched specialists: `COMMITMENT_RECOVERY`
- Calls: Chief triage → Commitment Recovery → final Chief synthesis
- Token usage:
  - Chief triage: 665 input / 214 output / 879 total
  - Commitment Recovery: 620 input / 129 output / 749 total
  - Final Chief: 722 input / 192 output / 914 total
  - Combined: 2,007 input / 535 output / 2,542 total
- All three Zod schema results: passed

These checks exercised the same provider adapter and orchestration contract used
by the protected phone reply endpoint. Cloud Run, Firestore persistence, and the
phone UI remain separate runtime acceptance steps.
