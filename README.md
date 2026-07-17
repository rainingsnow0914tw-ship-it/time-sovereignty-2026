# Time Sovereignty

OpenAI Build Week 2026 project built in Codex, with GPT-5.6 as the product's Chief of Staff brain.

- Live app: https://time-sovereignty-29309448808.asia-east1.run.app
- Source: https://github.com/rainingsnow0914tw-ship-it/time-sovereignty-2026
- License: [MIT](LICENSE)

## Current status

Repository foundation was created on 2026-07-16 (Asia/Shanghai). Phases 1
through 8 are implemented, evidence-backed, and deployed. The product combines
the three-question onboarding flow, consented support agreement, dual state
machines, four Agent contracts, voice/check-in/progress loops, memory and resume
points, and a clearly labeled 30-day journey.

The deployed application is available at
`https://time-sovereignty-29309448808.asia-east1.run.app`. Final revision
`time-sovereignty-00012-7gn` serves 100% of traffic. Its health endpoint reports
provider `live`, model `gpt-5.6`, and the final revision. One real OIDC Cloud
Task completed all four GPT-5.6 Agent contracts and persisted four safe OpenAI
traces; a second task with the same request ID left the Firestore proof
unchanged and incurred no second Agent run. The complete deployed browser
journey passed at 390x844 with zero console errors and zero failed requests.
Four focused live accessibility screens passed with zero axe violations and
zero incomplete findings after the judging-readiness fixes.

A protected single-device path is also implemented on a 0%-traffic Cloud Run
preview. It schedules a real pending check-in, lets the open PWA poll it, sends
a real text or browser speech transcript to Commitment Recovery and Chief of
Staff on GPT-5.6, persists the confirmed decision/memory/follow-up, and shows
real Firestore traces in Developer. It requires a one-time server-side pairing
value and a twelve-hour signed HttpOnly cookie; the OpenAI key never reaches
the browser. Physical Android pairing remains a deliberate recording step, not
a public feature.

## Source of truth

Read these files in order:

1. `docs/source/01_Time_Sovereignty_PRD_v0.6.md`
2. `docs/source/02_Time_Sovereignty_Architecture_v2.md`
3. `docs/source/03_Codex_Kickoff_Prompt.md`

The imported source documents are preserved unchanged. New decisions belong in
`docs/decisions/`.

The active implementation order is recorded in
`docs/decisions/0002-approved-architecture-and-phase-order.md`. Time-pressure
cuts are governed by
`docs/decisions/0003-time-pressure-feature-cut-order.md`.

## Phase 1 foundation

The deterministic foundation contains:

- typed goal, action, support-agreement, intervention, memory, and agent
  schemas;
- separate action and intervention state machines;
- invariants for active interventions and idempotent delivery keys;
- a deterministic mock AI provider that validates the same structured outputs
  expected from the live provider;
- agent trace contracts that omit raw prompts and secrets.

## Phase 2 local vertical slice

- mobile-first onboarding asks the three PRD questions one at a time;
- the deterministic Goal Architect mock returns the same strict plan contract
  intended for the live provider;
- the user can confirm, directly adjust, or attach concern feedback to the
  plan;
- the support agreement captures rhythm, quiet hours, intervention consent,
  channels, text/photo/voice progress formats, and review conditions;
- confirmed domain data and the safe mock trace persist in local storage and
  restore after reload.

Phase 2 verification: 21/21 tests, typecheck, lint, production build, and a
complete 390x844 Chrome user flow with zero console errors. See
`docs/evidence/phase-2-local-vertical-slice-2026-07-16.md`.

## Live infrastructure

- GCP project: `time-sovereignty-2026`;
- primary region: `asia-east1`;
- Firestore: Native mode, `(default)`, delete protection enabled;
- Cloud Run service: `time-sovereignty`, revision
  `time-sovereignty-00012-7gn`, 100% traffic, minimum/maximum instances one and
  container concurrency one during judging;
- Cloud Tasks queue: `time-sovereignty-checkins`, `RUNNING`;
- Phase 3 proof: authenticated OIDC callback, transactional Firestore
  transition, completed receipt, real retry recovery, and duplicate suppression;
- cost guardrail: project-scoped monthly US$30 budget with 50%, 90%, and 100%
  alerts;
- OpenAI key: local plaintext remains ignored; Cloud Run reads only the
  Secret Manager binding, accessible to the dedicated runtime identity.
- private phone preview: revision `time-sovereignty-00017-dif`, tag
  `live-mobile`, 0% normal traffic, fresh unused one-time pairing version bound
  through Secret Manager.

Phase 3 evidence:
`docs/evidence/phase-3-real-cloud-task-2026-07-16.md`.

## Protected live mobile check-in

- one paired device at a time, twelve-hour signed HttpOnly/Secure/
  SameSite=Strict session, explicit origin allowlist, visible revoke control;
- real OIDC Cloud Task changes a scheduled check-in to pending;
- the PWA polls only while open and visible, then offers text, tap-to-play TTS,
  and browser speech transcription with text fallback;
- the reply calls real Commitment Recovery and Chief of Staff through
  `gpt-5.6`, with SDK retries zero;
- Agent output and safe trace are atomically stored; a partial Recovery result
  is reused and the same reply ID cannot repeat cost;
- confirmation persists the adapted commitment, confirmed memory, and next
  follow-up task;
- Developer shows the real provider, returned model, tokens, and trace IDs.

Backend and 390x844 browser acceptance used four deliberate GPT-5.6 calls,
2,437 tokens total, with zero browser console errors or warnings. Full evidence
and the honest physical-phone boundary are in
`docs/evidence/live-mobile-vertical-path-2026-07-17.md`.

## Phase 4 four-agent orchestration

- Chief of Staff selects specialist agents by need and produces one final
  structured decision;
- Goal Architect, Commitment Recovery, and Memory Curator share strict Zod
  schemas across mock and OpenAI providers;
- the live provider uses the official Responses API with requested model
  `gpt-5.6`, reasoning `none`, and response storage disabled;
- safe agent traces omit prompts, secrets, and private reasoning;
- Firestore persists one run receipt and one trace per actual agent call;
- a request-level lease suppresses duplicate Cloud Task execution and cost.

Local real GPT-5.6 all-agent acceptance passed first. The finalized-contract
proof recorded exactly one live call per Agent with token usage in
`docs/evidence/phase-4-live-contracts-2026-07-16.md`. The later Cloud Run live
acceptance is recorded separately so the local contract proof and deployed OIDC
proof remain distinguishable.

## Phase 5–8 integrated longitudinal product

After onboarding, the product now opens a single mobile-responsive command
center with five surfaces:

- **Today** — North Star, current action, protected minimum, quiet-hours state,
  next check-in, and resume point;
- **Check-in** — text notification, tap-to-play browser TTS, browser speech
  transcription with text fallback, one-delay handling, repeated-delay
  recovery, and a new commitment;
- **Progress** — text, photo, and voice evidence plus specific feedback,
  progress memory, and resume-point update;
- **Journey** — planning, interruptions, adaptations, evidence, feedback,
  calibration, memory retrieval, and intervention rating;
- **Developer** — safe Agent Run Trace, schema/model/provider labels, and a
  redacted runtime snapshot.

Accelerated Simulation advances through Days 1, 2, 3, 4, 5, 8, 14, and 30 and
clearly labels simulated time. The same local journey repository holds events,
progress, memories, resume point, intervention state, effectiveness, and safe
traces. Video/file progress, the dedicated Memory Review screen, and an
expanded rating interface are intentionally deferred under Decision 0008.

The integrated production build passed on 2026-07-17. Deployed acceptance then
covered onboarding, check-in, text/photo/voice progress, Day 30, Journey,
Developer runtime evidence, reload persistence, Cloud Run live GPT-5.6, and
duplicate-cost suppression. Evidence:
`docs/evidence/phase-5-8-integrated-build-2026-07-17.md` and
`docs/evidence/phase-7-8-cloud-live-and-deployment-2026-07-17.md`.

## Local verification

```bash
npm ci
npm test
npm run typecheck
npm run lint
npm run build
```

Routine development and CI are mock-only. Both live suites are skipped by
`npm test`.

`npm run test:live:phase4-contracts` performs four real, potentially billable
GPT-5.6 calls: one per finalized Agent Zod contract, with SDK retries disabled.
The required one-time Phase 4 run already passed on 2026-07-16; do not rerun it
unless a contract changes and a new live evidence record is explicitly
authorized.

`npm run test:live:phase4` is the earlier end-to-end local orchestration
acceptance surface. It is retained for deliberate rehearsal, not routine
contract development.

`npm run smoke:openai` performs one real Responses API request using the ignored
local `.env.local`. Do not run it casually: it is a live, potentially billable
check. The required one-request smoke test passed on 2026-07-16; routine local
development should remain mock-first.

## Evidence chain

- Keep milestone-sized Git commits with clear dates and intent.
- Keep the main Codex development task as the primary Build Week task when practical.
- Record major decisions in `docs/decisions/`.
- Record cross-task continuity in `docs/codex-handoffs.md` only if a handoff becomes necessary.
- Preserve the final primary-task `/feedback` Session ID for submission.

Primary Codex `/feedback` Session ID:
`019f6085-1e4d-7e23-a0b8-371e6e47bbfa`.

## Submission package

- Devpost copy: `docs/DEVPOST_SUBMISSION.md`
- Under-three-minute narration: `docs/DEMO_SCRIPT.md`
- Final architecture: `docs/submission/time-sovereignty-architecture.png`
- Submission-readiness proof:
  `docs/evidence/phase-8-submission-readiness-2026-07-17.md`

The repository is prepared for public GitHub publication under the MIT License.
The final narrated public YouTube URL remains a human recording and review step.

## Secret handling

The local plaintext OpenAI API key belongs only in `.env.local` and must never
be printed or committed. The deployed value is read from Secret Manager
resource `openai-api-key`; only the dedicated runtime service account may
access it. `.env.example` contains names and safe defaults only.

The live-device pairing and session signing values are separate Secret Manager
resources. They must remain server-only, be rotated after a recording session,
and never be committed, embedded in the PWA, or placed in a demo URL.

A first minimal real `gpt-5.6` Responses API request was blocked by
`insufficient_quota`. After API billing was funded, the same one-request check
passed on 2026-07-16: model access, the Responses API, and strict structured
output were all confirmed. Both the failed and successful records are retained
in `docs/evidence/` so the evidence chain remains complete.
