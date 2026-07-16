# Devpost Submission Draft

## Project name

Time Sovereignty

## Tagline

An AI Chief of Staff that protects your goals when real life interrupts.

## Recommended track

Apps for Your Life

## Links

- Live app: https://time-sovereignty-29309448808.asia-east1.run.app
- Repository: `[add final GitHub URL]`
- Public YouTube demo: `[add final video URL]`
- Codex `/feedback` Session ID: `019f6085-1e4d-7e23-a0b8-371e6e47bbfa`

## Short description

Most productivity tools help once: they create a plan, schedule reminders, and
then blame the user when reality changes. Time Sovereignty is a longitudinal AI
Chief of Staff that remembers the goal, notices repeated delay, asks what
changed, negotiates a smaller commitment, and preserves the exact resume point
so progress can continue without shame or reconstruction.

## Inspiration

The hardest part of a meaningful goal is rarely making the first plan. It is
protecting the goal across interruptions, low-energy days, changed assumptions,
and the quiet accumulation of delay. We wanted an AI system that treats those
moments as information rather than failure.

## What it does

Time Sovereignty begins with three questions: the goal, the target window, and
why it matters. A Goal Architect proposes a plan, but the user must edit or
approve it and explicitly choose the support agreement: rhythm, quiet hours,
tone, channels, progress formats, pause conditions, and stronger follow-up
consent.

The product then becomes a mobile-first command center:

- **Today** protects the north star, minimum viable commitment, next action,
  and resume point.
- **Incoming Check-in** delivers a bounded intervention with text and
  tap-to-play speech.
- **Commitment Recovery** distinguishes one ordinary delay from a repeated
  pattern, then asks whether timing, task size, method, or direction changed.
- **Share Progress** accepts text, photo, or voice evidence and gives specific
  feedback instead of generic praise.
- **Journey** preserves planning, interruption, adaptation, evidence, memory,
  and continuation across an accelerated 30-day simulation.
- **Developer** exposes safe Agent traces, schemas, provider, returned model,
  and deployment revision without storing raw prompts, secrets, or private
  reasoning.

## How we built it

The mobile-first PWA is built with Next.js, React, TypeScript, and Zod. Routine
development uses deterministic mock fixtures that must pass the same strict
Zod contracts as the live model boundary.

The protected cloud path runs in Google Cloud `asia-east1`:

- Cloud Run serves the application and authenticated orchestration callback.
- Cloud Tasks signs callback requests with OIDC.
- Firestore transactions hold request leases, idempotent receipts, and safe
  Agent traces.
- Secret Manager supplies the OpenAI key only to the dedicated runtime service
  account.
- Cloud Run is bounded to one minimum and one maximum instance during judging;
  the acceptance queue is limited to one dispatch per second, one concurrent
  dispatch, and one total attempt.

The live orchestration has four strict structured-output roles:

1. Goal Architect
2. Commitment Recovery
3. Memory Curator
4. Chief of Staff, which synthesizes one final decision

The application uses the OpenAI Responses API with requested model `gpt-5.6`,
`store: false`, reasoning effort `none`, Zod-backed structured outputs, and SDK
automatic retries disabled at the production boundary.

## How we used Codex

Codex was the primary engineering environment for the project. It turned the
PRD and architecture into a clean repository, maintained dated build and
decision logs, implemented the product and cloud adapters, wrote tests,
provisioned and inspected Google Cloud resources, diagnosed deployed failures,
ran mobile browser acceptance, and assembled the final evidence chain.

Codex accelerated the work most where local code and live infrastructure met.
It traced a Firestore REST serialization failure back to the transport choice,
found a Structured Outputs incompatibility before production, hardened the
OpenAI retry boundary, and proved that duplicate Cloud Tasks could not repeat a
completed Agent run or its model cost.

The repository preserves these decisions instead of presenting the final code
as if it appeared in one prompt. `docs/CODEX_BUILD_LOG.md`, `docs/decisions/`,
and `docs/evidence/` show the chronological path from PRD to deployment.

## How we used GPT-5.6

GPT-5.6 is not a decorative chat box. It is the live reasoning boundary behind
all four production Agent contracts. Each role receives a minimal, role-specific
input and must return a strict structured output. The Chief of Staff sees the
specialist results and produces the single user-facing decision.

One authenticated Cloud Task executed all four live contracts and persisted
four completed OpenAI traces: 717 tokens for Goal Architect, 449 for Commitment
Recovery, 599 for Memory Curator, and 1,521 for Chief of Staff, for 3,286 tokens
total. A second task name with the same request ID left the receipt, timestamps,
token usage, and evidence fingerprint unchanged, proving that the model was not
called twice.

## Challenges we ran into

- OpenAI Structured Outputs rejected an arbitrary record schema because it
  emitted unsupported `propertyNames`. We replaced it with a fixed summary and
  typed attribute array while retaining a flexible internal memory record.
- Firestore's `preferRest` transport failed to serialize a numeric value inside
  a transaction. Returning to the supported gRPC transport fixed the real
  callback path.
- Passing inline JSON through PowerShell and gcloud swallowed the Cloud Task
  body. Moving the payload to a JSON file made the trigger reproducible.
- The first cloud design could have retried a billable Agent callback many
  times. We set SDK retries to zero, queue attempts to one, added a Firestore
  lease and completed receipt, and proved duplicate suppression with a real
  second task.
- The browser journey is intentionally local-first, while the billable live
  orchestration is a protected cloud path. The Developer surface and evidence
  make that boundary explicit rather than mislabeling simulated events as live.

## Accomplishments that we are proud of

- A coherent longitudinal experience rather than a one-shot planner.
- Two independent state machines for action progress and intervention delivery.
- Four real GPT-5.6 structured-output Agent contracts.
- An authenticated Cloud Tasks callback that fails closed without OIDC.
- Transactional idempotency that prevents duplicate state transitions and
  duplicate model cost.
- A clearly labeled accelerated 30-day journey with preserved resume points.
- Safe traces that prove execution without exposing prompts, credentials, or
  private reasoning.
- 51 routine tests, TypeScript, ESLint, production build, dependency audit, a
  deployed mobile browser walkthrough, and a final HTTP 200 health check.

## What we learned

Longitudinal AI is a systems problem before it is a prompting problem. The
useful unit is not the next response; it is a trustworthy loop across consent,
state, time, memory, recovery, evidence, and cost. Mock-first contracts made the
inner loop fast, while one thin live perimeter exposed the provider and cloud
failures that local tests could not reveal.

We also learned that an evidence chain changes engineering behavior. When every
claim needs a dated decision, test, trace, or deployed observation, it becomes
much harder to hide retries, ambiguous state, accidental cost, or a demo-only
shortcut.

## What's next

- Replace browser-only notification behavior with real cross-device push.
- Add durable Cloud Storage media evidence with explicit retention controls.
- Expand the compact rating into a richer intervention review when research
  supports it.
- Add calendar and email adapters behind the same consent and trace boundaries.
- Run longer real-world pilots to learn which recovery patterns genuinely help
  people resume meaningful goals.

## Built with

Codex, GPT-5.6, OpenAI Responses API, Next.js, React, TypeScript, Zod, Vitest,
Google Cloud Run, Cloud Tasks, Firestore, Secret Manager, IAM/OIDC, PWA APIs,
Web Speech APIs, and Playwright.
