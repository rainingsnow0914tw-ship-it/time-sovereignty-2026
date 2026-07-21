# Devpost submission reference

The canonical final Story is [DEVPOST_STORY_FINAL.md](DEVPOST_STORY_FINAL.md).
This file preserves the shorter V1-oriented field draft and testing checklist.

## Project name

Time Sovereignty

## Tagline

An AI Chief of Staff that helps one meaningful goal survive real life.

## Track

Apps for Your Life

## Links

- Public try-it Demo Lab:
  https://live-mobile---time-sovereignty-defqnamrrq-de.a.run.app/demo
- Stable app: https://time-sovereignty-defqnamrrq-de.a.run.app
- Public MIT repository:
  https://github.com/rainingsnow0914tw-ship-it/time-sovereignty-2026
- Original V1 YouTube demo: https://youtu.be/d0cX1V4R7h4
- Final-day V2 supplement: https://youtu.be/XPdfnJ6klu0
- Final-day V2 source:
  https://github.com/rainingsnow0914tw-ship-it/time-sovereignty-2026/tree/codex/v2-private
- Codex `/feedback` Session ID:
  `019f6085-1e4d-7e23-a0b8-371e6e47bbfa`

## Short description

Most productivity tools help once: they make a plan and schedule reminders.
Time Sovereignty is a longitudinal AI Chief of Staff for what happens next. It
remembers the North Star, notices repeated delay, asks what changed, negotiates
a smaller commitment, witnesses real progress, learns only with appropriate
confidence, and preserves the exact resume point so the goal can survive real
life without shame or context reconstruction.

## Inspiration

The hardest part of a meaningful goal is rarely the first plan. It is
protecting that goal through interruptions, low-energy days, technical blocks,
changed assumptions, and the quiet accumulation of delay.

During physical Android acceptance, the idea became personal. A user who had
bought art supplies but had not started drawing accepted one twenty-minute cup
sketch. The app brought back a real scheduled check-in, accepted a temporary
photo, and GPT-5.6 gave specific recognition. The user completed a drawing.
That small piece of changed behavior is the product's reason to exist.

## What it does

Time Sovereignty starts with three natural questions: what do you want, when,
and why does it matter? A real GPT-5.6 Goal Architect proposes a specific plan
and classifies the work as a sprint, project, or habit. The user can edit it and
must approve the support agreement: check-in rhythm, quiet hours, tone,
text/photo/voice formats, pause conditions, and consent for firmer follow-up.

The installed mobile PWA then delivers a real Cloud Tasks check-in. The user can
reply with text, voice transcription, or an ephemeral photo. Chief of Staff
classifies the evidence as on track, partial, blocked, goal changed, or
completed. Commitment Recovery joins only when the situation needs it. The user
confirms the adapted commitment before the system persists the decision, safe
trace, Episode, memory proposal, and next follow-up.

Memory is layered rather than a growing chat transcript. Immutable Episodes are
separate from user-level and goal-level summaries. One success can produce only
a tentative Strategy Card. A later real check-in retrieves relevant memory with
an explicit LIMITED_EVIDENCE instruction; the outcome updates effectiveness
without automatically turning a hypothesis into permanent truth.

Developer mode exposes the real provider, returned model, strict output schema,
tokens, trace IDs, safe memory IDs, and revision. Raw prompts, media, replies,
secrets, and private reasoning remain excluded.

The public `/demo` is a separate, clearly labeled submission surface. It
compresses a thirty-day illustration habit—delay, recovery, smaller action,
progress witness, memory, calibration, and continuation—using browser-only mock
fixtures behind the same local schemas. It makes zero API calls and cannot read
the private phone session.

## How we built it

The mobile-first PWA uses Next.js, React, TypeScript, Zod, and Vitest. The live
backend runs on Cloud Run in `asia-east1`. Cloud Tasks signs callbacks with
Google OIDC; Firestore transactions hold sessions, leases, check-ins, immutable
Episodes, derived memories, and safe traces; Secret Manager supplies the OpenAI
key only to the dedicated runtime service account.

The OpenAI Responses API requests `gpt-5.6` with strict Zod structured outputs,
`store: false`, and zero SDK retries. Four Agent roles share mock/live contract
parity: Goal Architect, Commitment Recovery, Memory Curator, and Chief of Staff.
`gpt-realtime-2.1` is a user-started voice layer; GPT-5.6 remains the decision
brain.

Cost and duplicate safeguards are structural: deterministic task names, one
queue attempt, one dispatch per second, one concurrent dispatch, transactional
leases and receipts, reply idempotency, and a separate curation lease. Cloud Run
is capped at one minimum and one maximum instance with concurrency one during
judging.

## How we used Codex

Codex was the primary engineering environment from clean repository to physical
phone acceptance. It translated the PRD into two state machines, four strict
Agent contracts, UI, tests, GCP adapters, infrastructure, deployment, evidence,
and a public MIT repository.

Codex accelerated the difficult boundary between local code and real runtime.
It used GCP CLI and Android ADB to deploy and verify the product, kept dated
decision and build logs through a long multi-session task, and caught defects
that a polished mock would have hidden: Firestore REST serialization, swallowed
PowerShell JSON, missing task protos in Next standalone output, a two-trace
client bound against a valid three-trace result, Realtime audio cutoff, stale
installed-PWA JavaScript, a completed-journey dead end, and a server/phone
timezone hydration mismatch.

The repository preserves failures and repairs in `docs/CODEX_BUILD_LOG.md`,
`docs/decisions/`, and `docs/evidence/`; it does not present the final code as a
one-prompt artifact.

## How we used GPT-5.6

GPT-5.6 is the real structured decision boundary behind the live product.
Goal Architect creates a goal-led plan. Chief of Staff reviews evidence and
relevant limited memory. Recovery joins only when blocked. Memory Curator runs
after the visible response to avoid extra mobile latency.

The required two-check-in memory acceptance used two Chief calls and two
Curator calls, 5,447 tokens total, with zero SDK retries. The later check-in
retrieved exactly one relevant Strategy Card, treated it as limited evidence,
and updated confidence from 0.35 to 0.47 after one success while preserving
tentative status.

A separate real photo acceptance used Chief of Staff only, returned COMPLETED
in 1,484 tokens, and created no unnecessary Recovery call or follow-up. The raw
photo was not persisted.

## Challenges

- **A working mock can hide a broken product loop.** Physical Android testing
  revealed ignored replies, a trace projection mismatch, a completed-goal dead
  end, stale installed-PWA code, and voice cutoff.
- **Longitudinal memory can overclaim.** We separated immutable Episodes from
  derived user/goal memory, capped tentative confidence, required explicit
  durable-memory choices, and injected a literal LIMITED_EVIDENCE boundary.
- **Retries can silently multiply cost.** SDK retries are zero; the queue has
  one attempt; Firestore leases and receipts suppress duplicate work.
- **Server and phone time are different.** The first cloud Demo Lab revision
  produced a React hydration warning. Codex isolated timezone-dependent first
  render, repaired it, and accepted only the clean replacement revision.
- **Private live access is not public guest access.** We kept the real paired
  phone path protected and built a separate zero-API evaluator Demo Lab rather
  than exposing a project key or Chloe's personal memory.

## Accomplishments

- A physical Android goal went from intention to a real cup sketch.
- A second real check-in retrieved and updated limited memory without
  overgeneralizing.
- Four real GPT-5.6 structured-output Agent contracts with safe traces.
- Real OIDC Cloud Tasks callbacks, Firestore persistence, idempotency, and
  post-response memory curation.
- Real text, photo, voice transcription, TTS, and user-started Realtime voice.
- A public, one-click, thirty-day evaluator story that makes zero API calls.
- Historical V1 checkpoint: 125 routine tests passed, 9 deliberate live-only
  tests skipped.
- Final-day V2 checkpoint: 215 tests passed, 10 deliberate live-only tests
  skipped, plus TypeScript, ESLint, production build, Android build, physical
  acceptance, and a dated evidence chain.

## What we learned

Longitudinal AI is a systems problem before it is a prompting problem. The
useful unit is not one impressive response; it is a trustworthy loop across
consent, state, time, evidence, recovery, memory, cost, and the next real action.

We also learned that recognition is part of functionality. Specific evidence
can help a user believe the next action is possible—but memory must earn trust
over repeated outcomes, not manufacture certainty from one success.

## What's next

- Remove the 15-second judging-only escalation override and restore a humane
  production cadence.
- Integrate the frozen V1 and V2 branches only after the judging snapshot.
- Run longer real-world pilots before claiming which interventions generalize.
- Add wearable and smart-speaker adapters only behind explicit consent.

## Testing instructions

1. Open the public Demo Lab link in a current desktop or mobile browser.
2. Press **Run full 30-day story**.
3. Open **Journey** to inspect delay, recovery, progress, memory, and
   calibration.
4. Open **Developer** to inspect four schema-validated mock Agent traces and the
   explicit no-API boundary.
5. No account, credential, API key, or rebuild is required.

The private real-phone lane is intentionally pairing-protected. The original
V1 video shows the baseline. The separate V2 supplement labels the native UI
replay honestly; redacted evidence verifies the protected cloud and phone path.

## Built with

Codex, GPT-5.6, OpenAI Responses API, gpt-realtime-2.1, Next.js, React,
TypeScript, Zod, Vitest, Google Cloud Run, Cloud Tasks, Firestore, Secret
Manager, IAM/OIDC, PWA APIs, Web Speech APIs, Android ADB, and Playwright.
