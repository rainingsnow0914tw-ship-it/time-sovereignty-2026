# Codex Handoff Manual

## Current checkpoint

- Handoff updated: 2026-07-16 23:58 Asia/Shanghai.
- Repository: `C:\Users\soulf\Desktop\openAI build week202607130721`
- Branch: `main`
- Last verified implementation commits: `57be0ed`
  (`feat: add need-based four-agent orchestration`) and `e0391a3`
  (`feat: add safe runtime provider selection`).
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

### Phase 4 four-agent orchestration

- Chief of Staff selects Goal Architect, Commitment Recovery, and Memory
  Curator from explicit need signals and always produces the final structured
  decision.
- A mismatch between the actual sub-agent calls and the Chief of Staff's
  reported `dispatchedAgents` is rejected.
- The official OpenAI SDK provider uses Responses API structured outputs,
  requested model `gpt-5.6`, reasoning `none`, `store: false`, and the exact
  same Zod schemas as mock mode.
- Local live acceptance passed all four roles in 47.38 seconds. All four traces
  reported provider `openai` and a returned model containing `gpt-5.6`.
- The live run found and fixed a real contract bug: `z.record` generated the
  unsupported JSON Schema keyword `propertyNames`. Memory proposals now use a
  fixed `summary` plus `attributes[]` structure.
- Decision 0007 now makes the inner loop and CI mock-only. A separate gated
  contract suite performs exactly one real call per finalized Agent contract,
  with SDK retries disabled.
- The one-time four-contract proof passed: Goal Architect 602 tokens,
  Commitment Recovery 340, Memory Curator 497, and Chief of Staff 519; 1,958
  tokens total. Every `responses.parse` result passed its production Zod schema
  and returned model `gpt-5.6-sol` for requested `gpt-5.6`.
- Current routine verification is 50 passed tests with five live-only tests
  skipped, plus typecheck and lint. The new proof is recorded in
  `docs/evidence/phase-4-live-contracts-2026-07-16.md` and matching JSON.
- Cloud Run revision `time-sovereignty-00006-szv` has 100% traffic. Runtime
  identity, eight Phase 3 non-secret env vars, 1 CPU, 512 MiB, max scale 20,
  and the HTTP 200 public page were preserved.
- The new orchestration route is OIDC-only; an unauthenticated request returned
  HTTP 401.
- Real task `phase4-cloud-20260716-1` ran all four roles in safe mock mode and
  persisted a `COMPLETED` Firestore receipt plus four safe `agent_runs` traces.
  Receipt attempt count is `1`, start time
  `2026-07-16T15:38:25.929Z`, completion time
  `2026-07-16T15:38:26.368Z`, with no error.
- Duplicate task `phase4-cloud-20260716-1-duplicate` logged `duplicate`; the
  receipt remained at one attempt and all four trace timestamps remained
  unchanged.
- Full split evidence:
  `docs/evidence/phase-4-four-agent-orchestration-2026-07-16.md`.
- Finalized per-Agent live evidence:
  `docs/evidence/phase-4-live-contracts-2026-07-16.md`.

### Phase 4 cloud-live activation gate

- Local live GPT-5.6 is proven; cloud OIDC and Firestore persistence are
  proven. Deployed GPT-5.6 is not yet claimed.
- Secret Manager resource `openai-api-key` exists but has zero versions. The
  local key was not uploaded, runtime secret access was not granted, and Cloud
  Run has no OpenAI secret binding.
- Cloud Run defaults to `AI_PROVIDER_MODE=mock` when the variable is absent.
- Explicit Chloe approval is required before copying the local API credential
  into GCP. Risk: compromise of the Cloud Run/Secret Manager boundary could
  expose OpenAI API-spend authority.

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
- This proves billing became usable after the recorded US$10 funding event; it
  does not independently verify the current US$100 promotional-credit balance.
- Success evidence:
  `docs/evidence/openai-gpt-5.6-smoke-success-2026-07-16.md` and matching JSON.

## Honest boundary: not completed yet

Do not claim any of the following until new evidence exists:

- Accelerated Simulation UI;
- text/photo/voice progress sharing;
- a user-facing notification delivery path.
- deployed Cloud Run live mode with four persisted `openai` traces.

Phase 7 is now explicitly provider-switch activation plus end-to-end rehearsal,
not the product's first contact with real GPT-5.6. Per-Agent live schema
compatibility has already been proven during Phase 4.

## Exact next action

Wait for Chloe's explicit credential-transfer approval in this same Codex
task. Do not open a new task.

After approval, the first action is exact: add one version to the existing
empty `openai-api-key` Secret Manager resource without printing or writing the
key to a temp file. Then grant only the runtime service account access to that
secret, bind it as `OPENAI_API_KEY`, set `AI_PROVIDER_MODE=live`, and preserve
all existing resource settings and eight non-secret variables.

Send one new OIDC orchestration task and require four persisted Firestore
traces with provider `openai` and a returned `gpt-5.6` model. Then send a
duplicate with the same request ID and prove no second API cost. Only after
that proof should Phase 5 begin.

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
- `953c200` — verified Phase 3 checkpoint
- `57be0ed` — need-based four-agent orchestration and OpenAI provider
- `e0391a3` — safe runtime provider selection for Cloud Run
- `docs/evidence/openai-gpt-5.6-smoke-2026-07-16.md` — preserved quota failure
- `docs/evidence/openai-gpt-5.6-smoke-success-2026-07-16.md` — successful live
  validation
- `docs/evidence/gcp-walking-skeleton-2026-07-16.md` — public infrastructure
- `docs/evidence/phase-2-local-vertical-slice-2026-07-16.md` — full local
  onboarding and support-agreement exit gate
- `docs/evidence/phase-3-real-cloud-task-2026-07-16.md` — real OIDC task,
  Firestore transition, retry, and duplicate acceptance
- `docs/evidence/phase-4-four-agent-orchestration-2026-07-16.md` — local live
  GPT-5.6 four-agent acceptance plus Cloud Run mock persistence and duplicate
  proof
- `docs/evidence/phase-4-live-contracts-2026-07-16.md` — exactly four finalized
  live contract calls with schema and token evidence
- `docs/CODEX_BUILD_LOG.md` — chronological work log

If the repository state conflicts with this manual, stop and reconcile the
actual Git state first. The live repository and committed evidence outrank a
stale prose note.
