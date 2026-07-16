# Codex Handoff Manual

## Current checkpoint

- Handoff updated: 2026-07-16 23:05 Asia/Shanghai.
- Repository: `C:\Users\soulf\Desktop\openAI build week202607130721`
- Branch: `main`
- Last verified implementation commits: `d6c390a`
  (`feat: add authenticated Phase 3 trigger foundation`) and `e8d93e1`
  (`fix: use gRPC for Firestore transactions`).
- The commit containing this file is the handoff checkpoint; verify it with
  `git log -1 --oneline` after opening the repository.
- Project name: **Time Sovereignty** (earlier working name: Chloe Chief of
  Staff).
- Development surface: the primary Codex desktop Build Week task.

## Resume rule for this same Codex task

1. This is the final `/feedback` Codex task; do not open a new task for Phase 4.
2. After any context compression, first read `docs/CODEX_BUILD_LOG.md`, then
   Decisions 0005 and 0006, before changing code.
3. Verify `git status --short` and `git log -3 --oneline`.
4. Read only the source slices needed for the exact Phase 4 action.
5. Do not reload every source or reference asset. Use the source-of-truth order
   in `README.md`; consult the Decision 0004 index only when a Phase 3 or Phase
   5 problem actually requires it.
6. Before changing application code, run `npm test` and `npm run typecheck`.

## Verified completed work

### Repository and evidence chain

- Clean dedicated Git repository created on 2026-07-16.
- PRD, architecture, and kickoff materials preserved unchanged in
  `docs/source/`.
- Decisions 0001-0006 record review approval, phase order, cut order,
  reference/cost guardrails, GCP project/region choices, and the Phase 3
  identity/idempotency contract.
- Milestone commits, evidence files, and `docs/CODEX_BUILD_LOG.md` form the
  dated Codex evidence chain.

### Phase 1 deterministic foundation

- Next.js 16.2.10 App Router and TypeScript application scaffolded.
- Zod contracts cover goals, actions, support agreements, interventions,
  memories, four agent outputs, and safe agent traces.
- Action progress and intervention delivery use separate state machines.
- Repeated-delay, single-active-intervention, and idempotent delivery
  invariants are implemented.
- Mock AI outputs are validated against the same strict schemas intended for
  the live provider.
- Last full verification: 15/15 tests passed, with typecheck, lint, and
  production build also passing. Evidence:
  `docs/evidence/phase-1-verification-2026-07-16.md`.

### Phase 2 local vertical slice

- Mobile-first onboarding asks goal, target window, and motivation one at a
  time.
- A deterministic Goal Architect mock returns the existing strict plan schema
  and a safe `GOAL_ARCHITECT` trace.
- The plan can be confirmed, directly adjusted, or annotated with explicit
  concern feedback.
- The support agreement captures rhythm, quiet hours, intervention intensity,
  tone, channels, text/photo/voice progress formats, pause conditions,
  stronger-follow-up consent, and review frequency.
- A validated local repository persists goal, first action, plan, support
  agreement, and trace, and restores the completed state after reload.
- Final verification: 21/21 tests, typecheck, lint, production build, and a
  complete 390x844 Chrome path with zero console errors. Evidence:
  `docs/evidence/phase-2-local-vertical-slice-2026-07-16.md`.

### Phase 3 authenticated real trigger path

- Account used: `soulfaihk@gmail.com`.
- Dedicated project: `time-sovereignty-2026` (number `29309448808`), billing
  enabled.
- Region: `asia-east1`.
- Firestore `(default)`: Native mode, Standard edition, delete protection on.
- Cloud Run service: `time-sovereignty`, revision
  `time-sovereignty-00005-wb5`, 100% traffic, 1 CPU, 512 MiB, startup CPU
  boost, maximum scale 20, minimum instances left at the default zero.
- Public URL: `https://time-sovereignty-defqnamrrq-de.a.run.app` (verified HTTP
  200 and complete Phase 2 browser path after deployment).
- Monthly GCP budget: US$30 with 50%, 90%, and 100% current-spend alerts.
- Required APIs, including Cloud Tasks and Secret Manager, are enabled.
- Runtime service account:
  `time-sovereignty-runtime@time-sovereignty-2026.iam.gserviceaccount.com`.
- Cloud Tasks caller service account:
  `time-sovereignty-tasks@time-sovereignty-2026.iam.gserviceaccount.com`.
- Both service accounts are enabled. The runtime has only
  `roles/datastore.user` and `roles/cloudtasks.enqueuer` at project scope, may
  act as the caller, and the caller has `roles/run.invoker` on the service.
- Queue `time-sovereignty-checkins` is `RUNNING` with no remaining tasks. Its
  dispatch limits are 10/second and 10 concurrent; its retry policy is 100
  attempts, 0.1-second minimum backoff, 3600-second maximum backoff, and 16
  doublings.
- Eight non-secret environment variables are bound: `GCP_PROJECT_ID`,
  `FIRESTORE_DATABASE_ID`, `CLOUD_TASKS_LOCATION`, `CLOUD_TASKS_QUEUE`,
  `CLOUD_TASKS_SERVICE_ACCOUNT_EMAIL`, `CLOUD_TASKS_OIDC_AUDIENCE`,
  `CLOUD_TASKS_CALLBACK_BASE_URL`, and `TASK_CALLBACK_LEASE_SECONDS`.
- The deployed service has no OpenAI secret.

Phase 3 verified checklist:

- [x] Unauthenticated callback fails closed with HTTP 401.
- [x] A real OIDC Cloud Task reached the public Cloud Run route.
- [x] Firestore intervention `phase3-20260716142638` changed from `SCHEDULED`
  to `DUE` in a transaction.
- [x] Receipt `delivery_receipts/cloud-task` completed with
  `attemptCount: 1`, original task name
  `bodyfile-phase3-20260716142638`, and completion time
  `2026-07-16T14:45:46.274Z`.
- [x] The original task recovered through a real Cloud Tasks retry after the
  Firestore transport fix.
- [x] Second task `duplicate-phase3-20260716142638` logged `duplicate`; the
  intervention timestamp, receipt, original task name, and attempt count did
  not change.
- [x] Phase 2 remained HTTP 200 after the container migration.
- [x] Local suite passed 31/31 tests, typecheck, lint, and production build.

Current Firestore test data:

- `interventions/phase3-20260716142638`: state `DUE`, `updatedAt`
  `2026-07-16T14:45:46.009Z`.
- Its `delivery_receipts/cloud-task`: status `COMPLETED`, `attemptCount: 1`,
  `claimedAt` `2026-07-16T14:45:46.009Z`, `completedAt`
  `2026-07-16T14:45:46.274Z`.

Full evidence:
`docs/evidence/phase-3-real-cloud-task-2026-07-16.md`.

### Phase 3 pitfalls that must not be repeated

- PowerShell/gcloud argument handling swallowed JSON passed with
  `--body-content`; use a real JSON file with `--body-file` for proof tasks.
- Firestore `preferRest` failed to serialize numeric transaction data with
  `toProto3JSON: don't know how to convert value 0`; the client now uses the
  default gRPC transport. Do not reintroduce `preferRest` without a real
  transaction regression test.

### OpenAI API smoke test

- Project-specific key name: `chloe-chief-of-staff-build-week-2026`.
- The key is stored only in ignored local `.env.local`; never print, copy into
  docs, or commit it.
- First request failed with `insufficient_quota`; that record is intentionally
  preserved.
- After Chloe reported adding US$10 of API credit, the exact same minimal
  request passed on 2026-07-16.
- Requested model: `gpt-5.6`; returned model: `gpt-5.6-sol`.
- Confirmed: account access, Responses API, and strict structured output
  `{ "ok": true }`.
- Usage: 36 input + 16 output = 52 tokens; storage disabled; reasoning `none`.
- Success evidence:
  `docs/evidence/openai-gpt-5.6-smoke-success-2026-07-16.md` and matching JSON.

## Honest boundary: not completed yet

Do not claim any of the following until new evidence exists:

- a real four-agent OpenAI orchestration path;
- Accelerated Simulation UI;
- text/photo/voice progress sharing;
- a user-facing notification delivery path.

## Exact next action

Start **Phase 4: Chief of Staff and four-agent orchestration**.

The first action is exact: implement a deterministic mock orchestration test
and dispatcher contract that selects agents by need instead of calling all
four by default, validates the final result against `ChiefOfStaffOutputSchema`,
and persists or returns safe agent traces without raw prompts, secrets, or
private reasoning.

Then implement the Goal Architect, Commitment Recovery, and Memory Curator
execution paths behind the shared provider boundary, preserving mock/live
contract parity and trace evidence.

Only when the live provider is integrated should the OpenAI key move from the
local file into Secret Manager and a Cloud Run secret binding. Keep normal
development mock-first so the API credit is not consumed by routine UI work.

## Guardrails that must survive the handoff

- Do not cut Accelerated Simulation, the two state machines, the four agents,
  the real Cloud Tasks trigger, or agent trace.
- The first optional cuts are video/file progress sharing, Memory Review UI,
  and a simplified intervention rating UI; record every actual cut in a new
  decision log.
- Scheduler polling is only a disclosed Plan B and cannot count as Cloud Tasks
  proof.
- Reference assets are concept-only and consulted on demand under Decision
  0004; do not copy legacy code wholesale.
- Never commit `.env.local`, `GPTAPIKEY.txt`, raw secrets, prompts, or private
  reasoning traces.
- Keep Cloud Run minimum instances at zero unless a measured need and a new
  decision justify a change.

## Evidence and commit map

- `dd57cd0` — repository foundation
- `8cd53de` — architecture approval and initial smoke evidence
- `33d153a` — deterministic domain foundation
- `a762410` — reference and deployment guardrails
- `91987f2` — GCP walking skeleton deployment
- `46ac6d4` — successful GPT-5.6 evidence and verified handoff
- `e1430c3` — Phase 2 local onboarding vertical slice
- `d6c390a` — authenticated Phase 3 trigger foundation
- `e8d93e1` — Firestore gRPC live-transaction fix
- `docs/evidence/openai-gpt-5.6-smoke-2026-07-16.md` — preserved quota failure
- `docs/evidence/openai-gpt-5.6-smoke-success-2026-07-16.md` — successful live
  validation
- `docs/evidence/gcp-walking-skeleton-2026-07-16.md` — public infrastructure
- `docs/evidence/phase-2-local-vertical-slice-2026-07-16.md` — full local
  onboarding and support-agreement exit gate
- `docs/evidence/phase-3-real-cloud-task-2026-07-16.md` — real OIDC task,
  Firestore transition, retry, and duplicate acceptance
- `docs/CODEX_BUILD_LOG.md` — chronological work log

If the repository state conflicts with this manual, stop and reconcile the
actual Git state first. The live repository and committed evidence outrank a
stale prose note.
