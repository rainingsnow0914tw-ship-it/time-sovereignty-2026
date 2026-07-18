# Decision 0016 — Real memory acceptance and core freeze

Date: 2026-07-19
Status: Accepted

## Decision

The Decision 0015 two-check-in acceptance test passed on a physical Android
PWA against revision `time-sovereignty-00036-qov`. The first real task saved an
immutable Episode and tentative Strategy Card. The later same-goal task
retrieved that card, GPT-5.6 treated it as limited evidence, and confirmation
updated effectiveness and confidence without promoting it to a permanent user
truth.

The private product core is therefore frozen at the `ae08833` code checkpoint
plus this acceptance checkpoint. After this decision, broad changes to the
onboarding, live check-in, Cloud Tasks, Firestore, Agent, Realtime, or memory
contracts are not allowed before submission.

## Allowed changes before submission

- A demonstrated security, privacy, data-loss, or acceptance-blocking defect.
- A build or deployed-runtime failure that prevents the recorded story.
- Truthful evidence corrections that do not change the accepted product
  behavior.
- Isolated submission surfaces that do not alter the private real journey.

## Submission order

1. Simplified, isolated Demo Lab for the compressed longitudinal story.
2. Three-minute demo script and video capture.
3. README and architecture/evidence links.
4. Devpost final review and submission.

Web Search and a public live Guest Lane remain conditional on time. Neither may
delay the video or submission, and neither may receive Chloe's private session,
personal memory, pairing secret, or project API key.

## Accepted evidence

- `docs/evidence/real-memory-learning-loop-2026-07-19.md`
- `docs/evidence/real-memory-learning-loop-2026-07-19.json`
