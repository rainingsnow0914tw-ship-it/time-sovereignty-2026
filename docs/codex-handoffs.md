# Codex Handoff Manual

## Current checkpoint

- Handoff updated: 2026-07-17 04:38 Asia/Shanghai.
- Repository: `C:\Users\soulf\Desktop\openAI build week202607130721`
- Branch: `main`
- Last verified product/submission commits: `3b43c12` (deployed runtime
  evidence), `329edc3` (submission assets), and `f954e90` (focused
  accessibility fixes).
- The commit containing this file is the handoff checkpoint; verify it with
  `git log -1 --oneline` after opening the repository.
- Project name: **Time Sovereignty** (earlier working name: Chloe Chief of
  Staff).
- Development surface: the primary Codex desktop Build Week task.

## Resume rule for this same Codex task

1. This remains the primary `/feedback` Codex task; preserve its final Session
   ID and link for submission.
2. After any context compression, first read `docs/CODEX_BUILD_LOG.md`, then
   Decisions 0009 and 0010, before changing code or cloud settings.
3. Verify `git status --short` and `git log -3 --oneline`.
4. Read only the source slices needed for the exact submission action.
5. Do not reload every source or reference asset. Use the source-of-truth order
   in `README.md`; consult the Decision 0004 index only when a Phase 3 or Phase
   5 problem actually requires it.
6. Do not rerun a live GPT-5.6 suite unless a production contract changes and a
   new billable run is explicitly approved.

## Verified completed work

### Repository and evidence chain

- Clean dedicated Git repository created on 2026-07-16.
- PRD, architecture, and kickoff materials preserved unchanged in
  `docs/source/`.
- Decisions 0001-0010 record review approval, phase order, cuts, reference and
  cost guardrails, GCP choices, identity/idempotency, live-contract perimeter,
  integrated-build cadence, and cloud-live cost controls.
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
- Cloud Run service: `time-sovereignty`, final revision
  `time-sovereignty-00012-7gn`, 100% traffic, 1 CPU, 512 MiB, startup CPU
  boost, maximum scale 1, container concurrency 1, and minimum instances one
  for the judging window.
- Public URL: `https://time-sovereignty-29309448808.asia-east1.run.app`
  (verified HTTP 200 and complete Phase 5–8 mobile journey).
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
  cost-bounded acceptance limits are 1/second, 1 concurrent, and 1 total
  attempt.
- Eight non-secret environment variables are bound: `GCP_PROJECT_ID`,
  `FIRESTORE_DATABASE_ID`, `CLOUD_TASKS_LOCATION`, `CLOUD_TASKS_QUEUE`,
  `CLOUD_TASKS_SERVICE_ACCOUNT_EMAIL`, `CLOUD_TASKS_OIDC_AUDIENCE`,
  `CLOUD_TASKS_CALLBACK_BASE_URL`, and `TASK_CALLBACK_LEASE_SECONDS`.
- `AI_PROVIDER_MODE=live` and `OPENAI_MODEL=gpt-5.6` are also bound. Secret env
  `OPENAI_API_KEY` references `openai-api-key:latest`; only the runtime service
  account has accessor permission on that secret.

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

### Phase 4 cloud-live activation gate — closed in Phase 7

- Chloe explicitly approved the credential transfer on 2026-07-17 after the
  cost and exposure risk was restated.
- Secret Manager version 1 is enabled; the runtime identity alone can access
  it, and Cloud Run binds it without exposing the value.
- Deployed GPT-5.6, OIDC, Firestore traces, token usage, and duplicate-cost
  suppression are now proven under Decision 0009.

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

### Phase 5–8 integrated local product

- Chloe replaced phase-by-phase local acceptance with one integrated build,
  followed by real Cloud Run debugging and deployment acceptance. Decision
  0008 records this method and the three approved interface cuts.
- The post-onboarding command center now contains Today, Incoming Check-in,
  Share Progress, Journey, and Developer surfaces.
- Browser adapters provide notification, tap-to-play TTS, speech transcription
  with text fallback, voice recording, and bounded local media persistence.
- The intervention experience supports one accepted delay, repeated-delay
  investigation, user-selected recovery reason, adapted action, and confirmed
  new commitment.
- Progress supports the required text, photo, and voice formats. Saving
  progress also stores specific feedback, retrieved memory, and an updated
  resume point.
- A compact 1–5 control persists intervention effectiveness and user sentiment.
- Accelerated Simulation covers meaningful Days 1, 2, 3, 4, 5, 8, 14, and 30.
  Journey shows the full longitudinal story; Developer shows safe traces and a
  redacted runtime snapshot.
- PWA manifest, `/api/health`, demo script, submission checklist, Build Log,
  evidence, and a Notion-ready checkpoint are included.
- Per Chloe's instruction, separate Phase 5–8 tests and local browser
  acceptance were skipped. One integrated `npm run build` passed on 2026-07-17,
  including TypeScript and all six generated routes/pages.
- Evidence:
  `docs/evidence/phase-5-8-integrated-build-2026-07-17.md`.

### Phase 7–8 deployed live acceptance

- Full pre-deployment validation passed for 100 tracked files and all 66 gcloud
  upload files: clean lockfile install, 51 routine tests, typecheck, lint,
  production build, standalone runtime, zero npm vulnerabilities, secret
  exclusion, and Git object integrity.
- OpenAI SDK retries default to zero. Queue and Cloud Run remain at the 1/1/1
  cost profile recorded in Decision 0009.
- OIDC task `phase7-live-20260717-1` completed one four-Agent GPT-5.6 run and
  stored four safe `openai` traces in Firestore. Per-Agent tokens were 717,
  449, 599, and 1,521; total 3,286.
- Duplicate task `phase7-live-20260717-1-duplicate` left receipt attempt count,
  task name, timestamps, traces, token data, and evidence fingerprint unchanged.
- Final revision `time-sovereignty-00009-2bn` serves 100% traffic and reports
  health `live`, model `gpt-5.6`, with `Cache-Control: no-store`.
- A fresh 390x844 Chrome run passed onboarding, support agreement, text
  check-in, text/photo/voice progress, rating, Day 30, Journey, Developer, and
  reload persistence. Console errors and failed requests were both zero.
- Evidence and screenshot:
  `docs/evidence/phase-7-8-cloud-live-and-deployment-2026-07-17.md` and
  `docs/evidence/phase-7-8-deployed-developer-2026-07-17.png`.

### Judging-readiness and submission checkpoint

- Live inspection at 2026-07-17 04:38 +08:00 confirmed final revision
  `time-sovereignty-00012-7gn`, 100% traffic, minimum/maximum instances one,
  concurrency one, all 11 environment entries, and Secret Manager binding
  `openai-api-key:latest`.
- Queue `time-sovereignty-checkins` remains `RUNNING` at one dispatch/second,
  one concurrent dispatch, and one maximum attempt. Both dedicated service
  accounts remain enabled.
- `/api/health` returned HTTP 200 with `no-store`, provider `live`, model
  `gpt-5.6`, and revision `time-sovereignty-00012-7gn`.
- Firestore still contains completed receipt
  `orchestration_runs/phase7-live-20260717-1` and all four safe OpenAI traces
  with the original 717, 449, 599, and 1,521 token counts. This was a read-only
  inspection and did not call OpenAI.
- Final focused live axe acceptance at 390x844 passed the goal question, plan
  review, support agreement, and command center with 0 violations and 0
  incomplete findings on every screen. Keyboard focus reached all primary
  controls; console errors and failed requests were zero.
- Devpost copy, the timed 2:50 narration, and final Mermaid/PNG architecture
  are complete. Primary Codex `/feedback` Session ID:
  `019f6085-1e4d-7e23-a0b8-371e6e47bbfa`.
- Decision 0010 governs the judging warm instance and focused accessibility
  gate. Full evidence:
  `docs/evidence/phase-8-submission-readiness-2026-07-17.md`.

## Honest boundary: remaining submission work

The production path is accepted, but do not claim these deferred items:

- background notification delivery while the web app is closed;
- Cloud Storage persistence for photo or voice media;
- a physical-microphone voice demo; browser acceptance used Chrome's fake
  microphone device;
- a comprehensive manual WCAG audit or recorded demo video. The focused axe
  and keyboard walkthrough is complete and may be claimed as such.

Phase 7 is now explicitly provider-switch activation plus end-to-end rehearsal,
not the product's first contact with real GPT-5.6. Per-Agent live schema
compatibility has already been proven during Phase 4.

## Exact next action

Commit this final evidence checkpoint. Then choose the repository publication
route: public with a chosen license, or private with both judging addresses
granted access. After that, record and upload the public under-three-minute
YouTube demo, fill the repository/video URLs in `docs/DEVPOST_SUBMISSION.md`,
review the Devpost entry, and submit it. Do not rerun the live GPT-5.6 task
merely for screenshots.

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
- Keep Cloud Run minimum instances at one during judging under Decision 0010;
  return it to zero after judging unless a later decision accepts the standing
  warm-instance cost.

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
- `4bfd647` — integrated Phase 5–8 longitudinal product journey
- `c5b78a6` — zero-retry live perimeter and React validation fixes
- `3b43c12` — deployed provider/model/revision evidence in the UI
- `329edc3` — Devpost copy, demo script, architecture, and initial contrast fix
- `f954e90` — focused accessibility and semantic-landmark fixes
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
- `docs/evidence/phase-5-8-integrated-build-2026-07-17.md` — single-pass local
  integration and compilation boundary before cloud acceptance
- `docs/evidence/phase-7-8-cloud-live-and-deployment-2026-07-17.md` — final
  tracked-file validation, Secret Manager activation, real GPT-5.6 OIDC task,
  duplicate-cost proof, deployed browser journey, and health check
- `docs/evidence/phase-7-8-deployed-developer-2026-07-17.png` — final 390px
  Developer/Journey runtime-evidence screenshot
- `docs/evidence/phase-8-submission-readiness-2026-07-17.md` — warm-instance,
  final cloud snapshot, Firestore persistence, submission assets, and focused
  accessibility evidence
- `docs/NOTION_PHASE_5_8_CHECKPOINT_2026-07-17.md` — human-readable checkpoint
  ready to paste or sync into Notion
- `docs/CODEX_BUILD_LOG.md` — chronological work log

If the repository state conflicts with this manual, stop and reconcile the
actual Git state first. The live repository and committed evidence outrank a
stale prose note.
