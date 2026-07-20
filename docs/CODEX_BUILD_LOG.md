# Codex Build Log

## 2026-07-16 — Repository foundation

- Primary environment: Codex desktop task.
- Workspace selected by Chloe: `C:\Users\soulf\Desktop\openAI build week202607130721`.
- Imported the v0.6 source package into `docs/source/` without modifying its contents.
- Created a project-specific OpenAI API key through the secure Platform flow.
- Stored the key in local `.env.local`; no plaintext key was displayed or committed.
- No OpenAI API request was made, so no API credit was consumed during setup.
- Marked `GPTAPIKEY.txt` and raw intake artifacts as local-only.
- Product implementation intentionally remains blocked until the kickoff review is delivered and approved.

## 2026-07-16 — Review approval and implementation start

- Chloe approved the architecture review with three amendments recorded in
  Decisions 0002 and 0003.
- Moved the first Cloud Run deployment to Phase 3 alongside Firestore and
  Cloud Tasks so a real public callback is tested early.
- Ran the required one-request `gpt-5.6` Responses API structured-output smoke
  test before Phase 1.
- The API returned HTTP 429 `insufficient_quota` before inference. The result
  is preserved under `docs/evidence/`; model access and structured output remain
  unvalidated until the project API quota becomes available.
- Continued into the deterministic mock-first Phase 1 because the live-provider
  quota precondition does not block local schemas, state machines, or tests.

## 2026-07-16 — Phase 1 deterministic foundation

- Created the official Next.js 16.2.10 App Router and TypeScript application
  skeleton.
- Added Zod schemas for goals, actions, support agreements, interventions,
  memories, four real agent outputs, and safe agent traces.
- Split action progress from intervention delivery into two independent state
  machines.
- Added configurable repeated-delay detection, single-active-intervention and
  unique-delivery-key invariants.
- Added a deterministic mock AI provider that validates fixtures against the
  same strict structured-output schemas used by the live-provider boundary.
- Verified 15 tests across three test files, TypeScript, ESLint, and a Next.js
  production build.

## 2026-07-16 — Reference-asset guardrails

- Read only `TS_參考資產蒸餾_v1.md`; did not open or copy any indexed legacy
  project file.
- Accepted Decision 0004 for concept-only reference use, cost controls,
  deployment bootstrap rules, callback authentication, and reminder
  idempotency.
- Added the Cloud Scheduler polling downgrade to Decision 0003 as a disclosed
  Plan B. It preserves runtime continuity but cannot be presented as successful
  Cloud Tasks evidence.
- Preserved phase-gated bookmarks for Phase 3 infrastructure work and Phase 5
  voice-provider work. Each future consultation must be problem-specific and
  recorded in this log.

## 2026-07-16 — GCP project and public walking skeleton

- Installed Google Cloud SDK 576.0.0 on the 4070 workstation and authenticated
  `soulfaihk@gmail.com`.
- Created dedicated project `time-sovereignty-2026` and verified that billing
  is enabled.
- Enabled Cloud Run, Firestore, Cloud Tasks, Cloud Storage, Secret Manager,
  Cloud Build, Cloud Logging, Artifact Registry, and Billing Budgets APIs.
- Created the `(default)` Firestore Native database in `asia-east1` with delete
  protection enabled.
- Added `.gcloudignore` and verified the 29-file upload set excluded
  `.env.local`, `GPTAPIKEY.txt`, `node_modules`, and `.next`.
- Deployed Cloud Run service `time-sovereignty`, revision
  `time-sovereignty-00001-hl6`, with 100% traffic.
- Verified the public URL returned HTTP 200, title `Time Sovereignty`, and the
  expected project name.
- Created a project-scoped monthly US$30 budget with alerts at 50%, 90%, and
  100% current spend.
- Did not deploy `OPENAI_API_KEY`; the current service does not use the live
  provider and the API project remains blocked by `insufficient_quota`.
- Cloud Tasks API availability is proven, but the real task, authenticated
  callback, and Firestore transition are not yet implemented or claimed.

## 2026-07-16 — GPT-5.6 access confirmed and task handoff prepared

- Chloe reported adding US$10 of API credit after attaching billing. The exact
  account balance was not queried or recorded in the repository.
- Reran the same minimal, billable `gpt-5.6` Responses API smoke test once.
- The request completed successfully and the API returned model
  `gpt-5.6-sol` for requested alias `gpt-5.6`.
- Confirmed account model access, Responses API execution, and strict JSON
  Schema output `{ "ok": true }`.
- The request used 36 input tokens and 16 output tokens, 52 total, with
  reasoning effort `none` and response storage disabled.
- Preserved the earlier quota failure and added a separate success record under
  `docs/evidence/` instead of rewriting history.
- Replaced the handoff placeholder with a verified continuation manual for the
  next Codex task.

## 2026-07-16 — Phase 2 local onboarding vertical slice

- Built a mobile-first, single-question onboarding path for goal, target
  window, and motivation.
- Added a deterministic Goal Architect mock plan that passes the existing
  strict agent-output schema and retains a safe mock agent trace.
- Added plan confirmation, direct editing, and explicit "what feels wrong"
  feedback capture before consent.
- Added a support agreement covering rhythm, quiet hours, intensity, tone,
  channels, text/photo/voice progress formats, pause conditions, stronger
  follow-up consent, and review frequency.
- Added a validated local repository that persists the confirmed goal, first
  action, support agreement, plan, and trace, then restores them after reload.
- Kept the slice mock-first: no OpenAI API call, Firestore write, Cloud Task,
  or notification was performed.
- Verified 21/21 automated tests, TypeScript, ESLint, and the optimized Next.js
  production build.
- Executed the complete user path in Chrome at a 390x844 mobile viewport;
  local persistence survived reload and the browser reported zero console
  errors.
- Preserved the final mobile screenshot and full Phase 2 acceptance record in
  `docs/evidence/phase-2-local-vertical-slice-2026-07-16.md`.
- Deployed commit `e1430c3` to the existing Cloud Run service as revision
  `time-sovereignty-00002-hr4`, with 100% of traffic routed to it.
- Preserved the prior 1 CPU / 512 MiB service settings and did not deploy any
  environment variable or OpenAI secret.
- Verified public HTTP 200 and repeated the complete 390x844 Phase 2 browser
  path against Cloud Run; persistence survived reload and browser console
  errors remained zero.

## 2026-07-16 — Phase 3 authenticated trigger foundation

- Revalidated the repository, Phase 2 deployment, handoff, architecture, and
  Phase 3 exit gate before implementation.
- Consulted only the Decision 0004 Phase 3 index entries
  `P0-gcp-bootstrap.md`, `aibao-v3/Dockerfile`,
  `aibao-v3/src/firestore.js`, and `aibao-v3/src/server.js`.
- Adopted atomic bootstrap verification, a minimal multi-stage container, and
  separated endpoint handling. A live callback exposed a Firestore
  `preferRest` serialization failure, so the client now uses its default gRPC
  transport. The legacy shared-secret callback pattern was rejected in favor
  of the approved OIDC path. No legacy code or secret was copied.
- Added official Firestore, Cloud Tasks, and Google auth packages plus a safe
  PostCSS override. A clean dependency rebuild reduced the production npm
  audit from two moderate findings to zero.
- Added a dedicated OIDC verifier, Cloud Tasks scheduler, transactional
  Firestore callback repository, retry lease, completed receipt, and dynamic
  Next.js callback route.
- Accepted Decision 0006 for dedicated runtime/task identities and explicit
  idempotency behavior.
- Added a Time Sovereignty-specific, atomic Phase 3 GCP bootstrap checklist.
- Verified 31/31 tests, TypeScript, ESLint, and an optimized standalone Next.js
  production build before changing live GCP resources.

## 2026-07-16 — Phase 3 real Cloud Tasks trigger verified

- Created dedicated runtime and task-caller service accounts. The runtime has
  only Firestore user and Cloud Tasks enqueuer project roles, may act as the
  caller identity for task creation, and the caller alone has Cloud Run
  invoker permission.
- Created queue `time-sovereignty-checkins` in `asia-east1` and left it
  `RUNNING` with no pending tasks after acceptance.
- Deployed revision `time-sovereignty-00005-wb5` with 100% traffic, 1 CPU,
  512 MiB, the dedicated runtime identity, and eight non-secret Phase 3
  environment variables. No OpenAI key was deployed.
- Verified the public callback fails closed: a request without the expected
  Google-signed OIDC identity returned HTTP 401 `unauthorized_task`.
- Sent a real authenticated Cloud Task for intervention
  `phase3-20260716142638`. The same task retried after the Firestore transport
  fix and atomically changed the intervention from `SCHEDULED` to `DUE`, then
  completed one delivery receipt with `attemptCount: 1`.
- Sent a second task with the same intervention ID. Cloud Run logged
  `duplicate`; the intervention timestamp, completed receipt, original task
  name, and attempt count remained unchanged. This proves callback
  idempotency and no duplicate transition.
- Preserved the complete Phase 3 acceptance record in
  `docs/evidence/phase-3-real-cloud-task-2026-07-16.md`.
- Two operational pitfalls are now documented: PowerShell/gcloud argument
  handling swallowed inline JSON passed with `--body-content`, fixed by using
  a JSON file with `--body-file`; Firestore `preferRest` failed to serialize a
  numeric value in a transaction, fixed by returning to the supported gRPC
  transport.
- Phase 3 exit gate is complete. Phase 4 starts at the Chief of Staff
  dispatcher contract; the first action is a deterministic mock orchestration
  test proving need-based agent selection, strict final-output validation, and
  safe agent-trace persistence.

## 2026-07-16 — Phase 4 four-agent orchestration and split acceptance

- Implemented a deterministic Chief of Staff dispatcher that selects Goal
  Architect, Commitment Recovery, and Memory Curator only when their explicit
  need signals are present. Chief of Staff always synthesizes the one final
  user-facing decision and must report the actual dispatch list exactly.
- Added the official OpenAI JavaScript SDK and a Responses API live provider
  using `responses.parse`, `zodTextFormat`, requested model `gpt-5.6`, reasoning
  effort `none`, response storage disabled, and the same Zod contracts as mock
  mode.
- Added safe in-memory and Firestore trace repositories. Traces retain run ID,
  role, provider, returned model, schema name, safe input summary, status, and
  timestamps; raw prompts, secrets, and private reasoning are excluded.
- Added a request-level Firestore lease and completed receipt so Cloud Tasks
  retries cannot repeat a completed orchestration or its API cost.
- The first live attempt exposed an OpenAI Structured Outputs incompatibility:
  arbitrary `z.record` memory values emitted forbidden `propertyNames`. The
  memory-proposal contract now uses fixed `summary` plus `attributes[]`, while
  durable internal memory records may remain flexible.
- Ran one complete local live acceptance after the fix. All four roles passed
  through real GPT-5.6 Responses API structured outputs in 47.38 seconds; all
  four traces reported provider `openai` and a returned model containing
  `gpt-5.6`.
- Verified the normal suite at 50 passed tests with the billable live test
  skipped by default, plus TypeScript, ESLint, production build, and zero npm
  audit findings after installing the SDK.
- Deployed commits `57be0ed` and `e0391a3` as Cloud Run revision
  `time-sovereignty-00006-szv`, 100% traffic. The existing runtime identity,
  eight non-secret environment variables, 1 CPU, 512 MiB, max scale 20, and
  public Phase 2 page were preserved.
- Verified the Phase 4 route fails closed with HTTP 401 without Cloud Tasks
  OIDC. A real OIDC task completed request `phase4-cloud-20260716-1` in mock
  mode and persisted one orchestration receipt plus four safe agent traces in
  Firestore. A second task with the same request ID logged `duplicate`; the
  receipt stayed `COMPLETED` with `attemptCount: 1` and all trace timestamps
  stayed unchanged.
- The split evidence is intentional and disclosed: real GPT-5.6 all-agent
  execution is proven locally; real Cloud Run OIDC and Firestore trace
  persistence are proven with the behaviorally identical mock provider.
- A GCP Secret Manager resource named `openai-api-key` was created, but the
  credential-transfer safety gate rejected uploading the local key. The secret
  has zero versions, the runtime has no secret binding, and the deployed mode
  remains mock. Explicit user approval after risk disclosure is required
  before cloud live activation.
- Full evidence is recorded in
  `docs/evidence/phase-4-four-agent-orchestration-2026-07-16.md`.

## 2026-07-16 — Phase 4 finalized live contract perimeter

- Reconfirmed that the post-billing `gpt-5.6` smoke had already passed all
  three required checks: model alias, account access, and strict structured
  output. The repository records Chloe's reported US$10 funding event, not an
  independently queried US$100 promotional-credit balance, so no redundant
  smoke request was made.
- Adopted Decision 0007: routine development and CI remain deterministic mock;
  each finalized Agent output contract receives one thin live GPT-5.6 check;
  Phase 7 becomes provider-switch activation plus end-to-end rehearsal rather
  than first contact with the real model.
- Extended safe agent traces with optional token usage. Mock traces record
  `null`; live traces record only input, output, and total token counts. Raw
  prompts, model output, secrets, and private reasoning remain excluded.
- Added a gated four-contract runner using `responses.parse`, each Agent's
  production Zod schema, requested model `gpt-5.6`, `store: false`, reasoning
  `none`, and SDK automatic retries disabled.
- The first runner launch stopped before loading the API client because Node 24
  rejected a named import from the CommonJS `@next/env` package. No OpenAI
  request occurred. The import was corrected and syntax-checked before the
  single evidence run.
- The evidence run made exactly four HTTP requests, one for each finalized
  Agent contract, with no retry or repeated iteration. All four passed:
  Goal Architect 602 tokens, Commitment Recovery 340, Memory Curator 497, and
  Chief of Staff 519, for 1,958 total tokens.
- Routine verification remained green at 50 passed tests with five live-only
  tests skipped, plus TypeScript and ESLint. The exact live records are stored
  in `docs/evidence/phase-4-live-contracts-2026-07-16.md` and matching JSON.

## 2026-07-17 — Phase 5–8 integrated local product build

- Chloe changed the execution cadence after more than four hours of Build Week
  work: implement Phase 5–8 as one local integration pass, skip separate phase
  acceptance, then move the complete surface to Cloud Run for debugging and
  deployment acceptance. Decision 0008 records the cadence and approved UI
  cuts.
- Consulted only the Decision 0004 Phase 5 index entries
  `小寶助理/tts.py` and `小寶助理/voice_input.py`. Adopted the principles of
  lazy capability initialization, text cleanup and length bounds before TTS,
  explicit provider boundaries, short-media limits, capability detection, and
  text fallback. No legacy code, credentials, project IDs, user data, or
  provider choice was copied.
- Added a longitudinal command center after onboarding with Today, Check-in,
  Progress, Journey, and Developer surfaces.
- Added browser notification, tap-to-play speech synthesis, speech-recognition
  transcription with text fallback, voice recording, photo evidence, and local
  media-size guardrails.
- Added one-delay rescheduling, repeated-delay recovery, user-selected reason,
  new commitment, specific progress feedback, retrieved memory, resume point,
  and persisted 1–5 intervention effectiveness.
- Added a clearly labeled accelerated simulation across Days 1, 2, 3, 4, 5,
  8, 14, and 30. It preserves journey events, memory changes, intervention
  states, progress, goal calibration, and safe mock Agent traces for the local
  preview; live cloud acceptance remains separate and honest.
- Added PWA manifest metadata, `/api/health`, demo script, submission checklist,
  Decision 0008, and a Notion-ready checkpoint document.
- Per Chloe's revised cadence, no per-phase tests or browser walkthroughs were
  run. One whole-product production build completed successfully: Next.js
  compilation, TypeScript, six generated pages, `/api/health`, both task routes,
  and `manifest.webmanifest` all built.
- Full scope and the deferred cloud acceptance boundary are recorded in
  `docs/evidence/phase-5-8-integrated-build-2026-07-17.md`.

## 2026-07-17 — Phase 7–8 cloud live activation and final deployment

- Chloe explicitly approved moving the existing local OpenAI key into the
  dedicated GCP project after full verification, followed by deployment and a
  final health check.
- Verified 100/100 tracked files, Git object integrity, secret exclusions, and
  all 66 files in the actual gcloud upload manifest. Reinstalled 499 packages
  from the lockfile; 51 routine tests, TypeScript, ESLint, production build,
  standalone runtime, and npm audit all passed. Five billable live-only tests
  remained skipped.
- The full lint pass found two synchronous React effect state updates and one
  incorrect mutable binding in the integrated journey UI. Fixed them and added
  a tested default of zero OpenAI SDK automatic retries in commit `c5b78a6`.
- Replaced the queue's unsafe 100-attempt / 10-concurrent profile with one
  dispatch per second, one concurrent dispatch, and one total attempt. Cloud
  Run max instances and container concurrency are both one for the acceptance
  period. Decision 0009 records this cost profile.
- Added Secret Manager version 1 without printing the key or writing it to a
  temporary file. Only the dedicated runtime service account received accessor
  permission. Bound it as `OPENAI_API_KEY`, set `AI_PROVIDER_MODE=live`, and
  preserved the original eight non-secret variables.
- Verified the deployed route still failed closed with HTTP 401 without OIDC.
  Real task `phase7-live-20260717-1` completed all four Agents through GPT-5.6
  and persisted four safe `openai` traces: Goal Architect 717 tokens,
  Commitment Recovery 449, Memory Curator 599, and Chief of Staff 1,521; 3,286
  tokens total.
- Sent duplicate task `phase7-live-20260717-1-duplicate` with the same request
  ID. Receipt attempt count, original task name, four trace timestamps, token
  data, and SHA-256 evidence fingerprint remained unchanged, proving no second
  Agent cost.
- A deployed Chrome walkthrough found stale UI text saying the live switch was
  still pending. Replaced it with an honest local-journey/cloud-live split and
  made Developer read provider, model, and revision from `/api/health`. The
  corrected source passed the full verification suite again in commit
  `3b43c12`.
- Deployed final revision `time-sovereignty-00009-2bn` with 100% traffic. A
  fresh 390x844 Chrome run passed onboarding, support agreement, text check-in,
  text/photo/voice progress, rating, Day 30 simulation, Journey, Developer, and
  reload persistence with zero console errors and zero failed requests.
- Final queue state is `RUNNING` and empty under the 1/1/1 cost profile. Final
  `/api/health` returned HTTP 200 with `no-store`, provider `live`, model
  `gpt-5.6`, and revision `time-sovereignty-00009-2bn`.
- Full evidence and screenshot are stored in
  `docs/evidence/phase-7-8-cloud-live-and-deployment-2026-07-17.md` and
  `docs/evidence/phase-7-8-deployed-developer-2026-07-17.png`.

## 2026-07-17 — Judging readiness and submission package

- Verified that Cloud Run, Firestore, Cloud Tasks, Artifact Registry, and the
  source bucket are all in GCP `asia-east1`; the alternate `-de.a.run.app`
  hostname is not a European deployment marker.
- Compared a 2.617-second idle health request with approximately 8–12 ms warm
  requests. The real four-Agent orchestration remained 23.488 seconds, so the
  latency sources were separated instead of misdiagnosed as a cross-region GCP
  deployment.
- With Chloe's approval, changed Cloud Run minimum instances from zero to one
  for the judging window. Preserved maximum instances one, concurrency one,
  all 11 environment entries, the Secret Manager binding, both service
  accounts, and the queue's 1/1/1 cost profile.
- Added the Devpost submission draft, timed 2:50 demo script, and a final
  implementation-only architecture diagram in Mermaid and PNG formats.
- A focused deployed accessibility scan first found five serious contrast
  issues. Corrected the palette, dark-card class composition, and nested main
  landmark. The final goal, plan, agreement, and command-center screens each
  passed with zero axe violations and zero incomplete findings; keyboard focus
  reached every primary control, with zero console errors and zero failed
  requests.
- Reverified 51 routine tests, TypeScript, ESLint, and the production build.
  No Agent contract changed, so no repeated billable GPT-5.6 suite was run.
- Deployed final revision `time-sovereignty-00012-7gn`, 100% traffic. Live
  health returned HTTP 200, `no-store`, provider `live`, model `gpt-5.6`.
- Re-read Firestore to confirm the completed live receipt and all four safe
  OpenAI traces still exist with the original 3,286-token total. The read did
  not call OpenAI or modify data.
- Retrieved the primary Codex `/feedback` Session ID directly from Codex:
  `019f6085-1e4d-7e23-a0b8-371e6e47bbfa`.
- Decision 0010 records the judging warm-instance and accessibility policy.
  The remaining human/authorization boundary is GitHub visibility and license,
  the narrated public YouTube upload, and final Devpost review/submit.

## 2026-07-17 — Public MIT repository release

- Chloe selected a public GitHub repository with the MIT License.
- Before publication, scanned both the current tracked tree and Git history for
  OpenAI key patterns; none were found. Confirmed `.env.local` and
  `GPTAPIKEY.txt` remain ignored, no private-key filename is tracked, and no
  tracked file exceeds 10 MB.
- Added the canonical MIT License with Chloe as copyright holder and declared
  `MIT` in both package metadata files. Commit `29f67a5` is the first licensed
  public-release checkpoint.
- Created public repository
  `https://github.com/rainingsnow0914tw-ship-it/time-sovereignty-2026`, pushed
  `main`, set the deployed Cloud Run URL as its homepage, and added relevant
  Build Week technology topics.
- Verified unauthenticated HTTP 200, visibility `PUBLIC`, default branch
  `main`, GitHub-detected SPDX license `MIT`, and an exact local/remote commit
  match.
- Repository publication is complete. Remaining submission work is the public
  narrated YouTube demo and final Devpost review/submit.

## 2026-07-17 — Protected single-device live mobile vertical path

- Chloe approved a single-device, twelve-hour, recording-only connection that
  keeps the OpenAI key server-side and preserves all existing OIDC, Firestore,
  cost, idempotency, and safe-trace controls. Decision 0011 records the gate.
- Added server-only one-time pairing, an HMAC-signed HttpOnly/Secure/
  SameSite=Strict cookie, Firestore session revocation, and exact allowed-origin
  checks. Pairing and session values are separate Secret Manager resources;
  only the dedicated runtime service account may access them.
- Added a real Cloud Tasks path from `SCHEDULED` to `PENDING`, open-page PWA
  polling, text plus tap-to-play TTS, browser speech transcription with text
  fallback, live reply and confirmation endpoints, confirmed memory, and a
  deterministic next follow-up task.
- The user-facing reply runs only Commitment Recovery and Chief of Staff. Each
  reply has a Firestore lease; Agent output and its safe trace are committed in
  one transaction; a persisted Recovery result is reused if Chief fails; and
  the same reply ID returns the stored decision without another model call.
- Local verification finished at 60 passed tests with five live-only tests
  skipped, plus TypeScript, ESLint, and a complete production build.
- Cloud-first debugging exposed three concrete deployment/runtime issues before
  any new OpenAI request: PowerShell serialized the first secret read as an
  array; Next standalone omitted the Cloud Tasks `protos.json`; and strict
  client projection plus short/full task-name comparison caused 400/409. Each
  fix is preserved in a separate commit/revision and covered by tests.
- Backend acceptance on revision `time-sovereignty-00015-lal` used two real
  GPT-5.6 calls: Commitment Recovery 464 tokens and Chief of Staff 762 tokens,
  1,226 total in 8.482 seconds. The same reply ID returned duplicate in 0.110
  seconds with unchanged traces and zero additional model call.
- A 390x844 PWA browser acceptance on revision
  `time-sovereignty-00016-yim` scheduled a real 15-second task, visibly polled
  to pending, sent a real text reply, confirmed the returned `REDUCE` decision,
  updated Today, and displayed two Firestore traces in Developer: 461 and 750
  tokens, 1,211 total. Console errors and warnings were both zero.
- Tap-to-play TTS was triggered through the live UI, but the background browser
  did not expose audible completion. Physical Android TTS and speech
  transcription remain the honest human boundary.
- Both test sessions were visibly or administratively revoked; test follow-up
  tasks were removed after evidence; pairing versions used by tests cannot be
  reused. Final phone-ready preview `time-sovereignty-00017-dif` is tagged
  `live-mobile`, serves 0% normal traffic, and binds fresh unused pairing secret
  version 5. Stable revision `time-sovereignty-00012-7gn` still has 100%.
- Full evidence:
  `docs/evidence/live-mobile-vertical-path-2026-07-17.md` and matching JSON.

## 2026-07-18 — Android Realtime acceptance and production promotion

- Completed the full protected phone path on a physical Android PWA: a real
  Cloud Task became a pending check-in, Chloe replied through the live mobile
  surface, Commitment Recovery and Chief of Staff returned real GPT-5.6
  structured decisions, and the confirmed decision, memory, safe traces, and
  next follow-up persisted in Firestore.
- The accepted decision used exactly two Agent calls: Commitment Recovery 687
  tokens and Chief of Staff 1,037 tokens, 1,724 total. No duplicate iteration
  or SDK retry was made.
- Fixed the Realtime WebRTC multipart boundary after the OpenAI unified endpoint
  rejected SDP and session JSON sent as file parts. Both values now use regular
  multipart string fields and are contract-tested.
- Physical playback exposed a deterministic 240-token cutoff. Sanitized
  data-channel evidence showed the phone sent 240, the response ended
  `incomplete` with `reason=max_output_tokens`, and all 240 output tokens were
  consumed. Session and response limits now use 1,024.
- A second diagnostic separated a stale installed-PWA document from the new
  server session: the server advertised 1,024 while the cached phone client
  still sent 240. An ignore-cache reload preserved pairing and journey data
  while loading the current bundle.
- Strengthened both session and per-response voice contracts to read every word
  through the final word without summary, omission, paraphrase, or early stop.
- Chloe's final physical playback completed with natural question intonation.
  The Realtime response reported `completed`, no error, and 480 output tokens
  (356 audio, 124 text). This voice-only check did not call GPT-5.6 Agents.
- Reverified 79 tests with five live-only skips, ESLint, TypeScript, and the
  production Next.js build.
- Deployed `time-sovereignty-00024-dih`, first as the zero-normal-traffic
  `live-mobile` preview. After Chloe's explicit approval, promoted it to 100%
  production traffic. The production health endpoint returned HTTP 200 and the
  same revision.
- Official Devpost timing was rechecked on 2026-07-18: July 21 at 5:00 PM PDT,
  equivalent to July 21 at 8:00 PM EDT and July 22 at 8:00 AM Taiwan time.
- Remaining delivery: public narrated video under three minutes, final Devpost
  review/submit, then recording-session revocation and test cleanup.

## 2026-07-18 — Real multimodal Android loop and three-trace correction

- A physical Android PWA sent a real text report plus an ephemeral progress
  photo through the protected reply endpoint. GPT-5.6 completed the decision,
  classified the situation as blocked, and ran the intended three-step Chief
  triage → Commitment Recovery → final Chief path for 3,336 total tokens.
- The phone exposed a post-model contract defect: Firestore correctly stored
  three trace IDs, but the client projection accepted at most two trace rows.
  The reply and every following poll therefore returned HTTP 400 even though
  the structured decision was already safe in Firestore.
- Aligned the client trace bound with the persisted three-trace contract,
  added a complete regression fixture, and made reply/poll failures explicit
  so the UI no longer appears to ignore the user.
- Reverified 94 tests with eight live-only skips, ESLint, TypeScript, and the
  production build. Deployed `time-sovereignty-00028-yec` only to the
  `live-mobile` tag; stable `00024-dih` remains at 100% normal traffic.
- The corrected Android PWA recovered the already-persisted decision without a
  second model call. Chloe confirmed it; the confirm endpoint returned HTTP
  200, the UI showed decision/memory/follow-up persistence, and Cloud Tasks
  contained the next scheduled follow-up. At its due time the task called the
  preview endpoint exactly once and returned HTTP 200 in 0.143 seconds.
- Detailed safe evidence:
  `docs/evidence/live-multimodal-android-acceptance-2026-07-18.md`.

## 2026-07-18 — Goal-led cadence instead of a fixed 30-day journey

- Added a shared structured cadence contract that classifies a goal as
  `SPRINT`, `PROJECT`, or `HABIT` and returns a defensible target end,
  check-in frequency, preferred time, agreement review interval, rationale,
  and observable completion signal.
- The support agreement now starts from Goal Architect's recommendation while
  preserving every user-editable consent and boundary field. The real
  check-in context carries cadence forward so Chief and Recovery cannot treat
  a one-night sprint as a generic long journey.
- Added deterministic timing guards: initial and later follow-ups must remain
  future, precede a known target end, and stay inside 24 hours for a sprint,
  72 hours for a habit, or seven days for a project.
- Preserved existing browser and Firestore data through a conservative legacy
  cadence upgrade. A dedicated test removes cadence from an old play-profile
  record and verifies it restores as an editable sprint instead of vanishing.
- Reverified 104 tests with eight live-only skips, ESLint, TypeScript, and the
  production build. One deliberate GPT-5.6 call classified the same-night
  Build Week goal as `SPRINT` with goal-led check-ins and a one-day review;
  `gpt-5.6-sol` used 1,481 total tokens with zero SDK retries.
- Deployed `time-sovereignty-00030-sad` to the 0%-normal-traffic
  `live-mobile` tag. Health returned HTTP 200 in live mode; stable
  `00024-dih` remains at 100%.
- Decision: `docs/decisions/0012-goal-led-cadence-and-real-journey-boundary.md`.
- Evidence: `docs/evidence/live-goal-cadence-contract-2026-07-18.md`.

## 2026-07-18 — Recoverable private session and real completed focus loop

- The original twelve-hour private session expired during real onboarding and
  correctly returned 401 before any new model call or save. Added in-place
  re-pairing that retains all three answers, reuses the same request identity,
  and retries automatically. Added a same-origin `/pair` recovery page.
- Extended the approved private session to 96 hours while enforcing a
  seven-day configuration maximum. Kept one-device revocation, exact origins,
  signed expiring cookies, Secret Manager, idempotency, and zero SDK retries.
- Replaced the blank no-check-in state with a real work-block start. Chloe
  chose 20 minutes; the product created one Cloud Task and explained that the
  text, voice, and photo report form would appear when the task became pending.
  The 15-second infrastructure control now lives in Developer mode only.
- The task called revision `time-sovereignty-00033-wir` at its scheduled time
  and returned HTTP 200 in 0.162 seconds. A physical Android PWA submitted a
  real photo plus self-assessment. Raw content is excluded from repository
  evidence.
- GPT-5.6 used Chief of Staff only, returned `COMPLETED`, and used 1,484 total
  tokens with zero retries. Chloe confirmed the result; Firestore persisted the
  structured decision, safe trace, and memory proposal. No next follow-up was
  created and the queue was empty.
- Verified that the client projection and Firestore document had zero media
  fields. Added a model instruction forbidding claims of photo persistence and
  an independent UI notice that photos are temporary model input.
- Replaced the stale onboarding time in the top summary with protected live
  status. The same confirmed phone record now visibly reports **Goal
  completed** instead of **Set when you start**.
- Reverified 118 tests with eight live-only skips, ESLint, TypeScript, and the
  production build. Deployed privacy/status polish revision
  `time-sovereignty-00034-rok` to the 0%-normal-traffic `live-mobile` tag;
  stable `time-sovereignty-00024-dih` remains at 100% normal traffic.
- Decisions: `0013-private-session-lifetime-and-public-tryout-boundary.md` and
  `0014-real-focus-loop-and-ephemeral-photo-boundary.md`.
- Evidence:
  `docs/evidence/private-session-recovery-and-real-focus-loop-2026-07-18.md`
  and matching JSON.

## 2026-07-19 — Real memory learning loop accepted and core frozen

- Completed the required two-check-in acceptance on a physical Android PWA
  against tag-only revision `time-sovereignty-00036-qov`. Stable revision
  `time-sovereignty-00024-dih` remained at 100% normal traffic.
- The first real same-goal check-in saved an immutable Episode, operational
  Resume record, and tentative goal-scoped Strategy Card at confidence 0.35.
  The optional durable-memory choice remained user-owned and was safely
  deferred.
- The application created the second real follow-up and authenticated Cloud
  Task. GPT-5.6 retrieved exactly one related Strategy Card, treated it as
  limited evidence, returned a completed decision, and did not generalize one
  success into a permanent user truth.
- Confirming the second result saved a second Episode and updated the original
  Strategy to confidence 0.47 with one attempt and one success while preserving
  `TENTATIVE` status.
- Developer mode on the phone exposed the real returned model, Memory Curator
  trace, and safe retrieved-memory count. Raw replies, photos, secrets, prompts,
  and private reasoning remained excluded.
- Four real calls used `gpt-5.6-sol`: Chief 1,352 tokens, Curator 986, Chief
  1,569, Curator 1,540; 5,447 total with zero SDK retries. No external research
  call was needed.
- Final verification passed: 123 tests with nine live-only skips, ESLint,
  TypeScript, production build, and diff check. Cloud health returned HTTP 200;
  the queue was RUNNING and empty after acceptance.
- Decision 0016 freezes the accepted private core. Submission priority is now
  isolated Demo Lab, three-minute video, README, and Devpost. Web Search and a
  public Guest Lane remain conditional on time.
- Evidence: `docs/evidence/real-memory-learning-loop-2026-07-19.md` and matching
  JSON.

## 2026-07-19 — Isolated 30-day Demo Lab

- Added a dedicated static `/demo` route instead of putting the thirty-day
  competition story back into Chloe's private real journey.
- The bilingual scripted fixture uses a thirty-day illustration-practice habit
  and the same validated local record, journey, Agent trace, event, memory, and
  effectiveness schemas. It shares no private storage key or phone session.
- The story advances through Days 1, 2, 3, 4, 5, 8, 14, and 30, exposing first
  check-in, repeated delay, Commitment Recovery, a smaller action, tentative
  strategy memory, progress witness, calibration, resume point, and all four
  Agent contracts.
- The page explicitly states `no API`, `no private phone session`, and
  `provider: mock`. Demo mode skips even the cloud health request; it cannot
  touch OpenAI, Cloud Tasks, Firestore, or protected live routes.
- A fresh 390×844 `zh-TW` Chrome profile opened `/demo`, clicked the one-click
  full story, reached Day 30, inspected Journey and Developer, and found zero
  framework overlays or console errors. The full mobile screenshot was visually
  inspected.
- The first tag-only production revision `time-sovereignty-00037-huw` exposed a
  React hydration `#418` that the development browser did not show. Cloud Run
  and the phone rendered quiet-hours and check-in time in different timezones.
  The first render now uses deterministic agreement values and applies local
  time only after hydration.
- The rebuilt local production bundle passed the same fresh 390×844 flow with
  HTTP 200, Day 30, zero `/api/*` requests, zero overlays, and zero console
  errors. Revision `00037` is not accepted as the final preview.
- Replacement revision `time-sovereignty-00038-zey` passed the fresh cloud
  production browser: HTTP 200, Day 30, mock trace visible, zero `/api/*`
  requests, zero overlays, and zero console errors. The final mobile screenshot
  was visually inspected.
- `00038` is Ready at the `live-mobile` tag with 0% normal traffic. Stable
  `time-sovereignty-00024-dih` remains at 100%; min/max one, concurrency one,
  runtime service account, queue safeguards, and Secret Manager references were
  preserved.
- Full verification passed: 125 tests with nine live-only skips, ESLint,
  TypeScript, production build, and diff check. Next built `/demo` as a static
  route.
- Evidence: `docs/evidence/demo-lab-browser-acceptance-2026-07-19.md` and
  matching JSON.

## 2026-07-19 — Final submission package aligned

- Replaced the outdated phase-by-phase README with a judge-first product story:
  the real cup-sketch outcome, current architecture, GPT-5.6 and Codex roles,
  real/private versus scripted/public boundaries, safety controls, current
  revisions, evidence entry points, and no-rebuild testing instructions.
- Finalized a 391-word English narration and shot list designed for 2:50–2:55.
  It leads with the physical Android outcome, proves the real memory loop,
  shows the clearly labeled zero-API Demo Lab, then closes with Codex/GPT-5.6
  engineering evidence and the larger consent-based vision.
- Rewrote the Devpost draft and checklist around the current product rather
  than the earlier evidence-only path. The only required submission asset not
  yet present is the public under-three-minute YouTube video.
- Updated the Mermaid architecture to include the isolated evaluator lane,
  96-hour private session, Realtime voice layer, immutable Episodes, layered
  memory, need-based Agents, and post-response Memory Curator. Regenerated and
  visually inspected the tracked PNG so it no longer contradicts the source.
- Rechecked the official rules on 2026-07-19: the video must be under three
  minutes, public on YouTube, and include audio explaining the build, Codex,
  and GPT-5.6; the repository and testing path must be available; submitted
  materials require English or an English translation.
- Submission-facing stale revision, URL, session-duration, and test-count
  claims were removed. Tracked secret scan and `git diff --check` passed; the
  public Demo Lab, stable app, and GitHub repository each returned HTTP 200. No
  application code, Cloud Run traffic, private session, API key, or Firestore
  data changed during this checkpoint.
- The final documentation audit repaired one stale Realtime evidence filename;
  all local Markdown targets now resolve. The unchanged application suite still
  passes 125 tests with nine live-only skips.

## 2026-07-19 — Public submission video published

- Codex assembled the approved 2:56 submission cut from the real cup-sketch
  outcome, physical-phone acceptance, isolated Demo Lab, architecture, Git
  history, tests, dated decisions, and safe evidence views.
- English narration was generated as 25 timed segments with OpenAI `tts-1-hd`
  using the `nova` voice. Segment durations were measured, long lines were
  speed-adjusted, short lines were silence-padded, and corrected English
  captions were burned into the 1080p final video.
- Chloe and the driver watched the final cut twice and approved it. The local
  file is exactly 176 seconds; the YouTube player rounds the displayed duration
  to 2:57, still below the official three-minute limit.
- The final video was published to the verified `Chloe Kao` hackathon channel
  (`UCr9cVav4Jas5dKCkxs526hQ`) at https://youtu.be/d0cX1V4R7h4.
- YouTube reported no copyright or Community Guidelines issues. A separate
  unauthenticated oEmbed request returned the correct title, author `Chloe Kao`,
  channel URL, and public thumbnail, confirming judge-visible access.
- The video description links the no-login Demo Lab and public MIT repository,
  identifies Codex and GPT-5.6, and truthfully discloses both the AI narration
  and the accelerated mock boundary.
- Evidence: `docs/evidence/phase-8-youtube-publication-2026-07-19.md`.

## 2026-07-20 — V1 submitted before longitudinal-loop development

- The authenticated Devpost finalization page showed the project as Draft with
  four of five steps complete and explicitly stated that edits remain possible
  until the deadline.
- Accepted the already-approved official rules and Devpost terms, then submitted
  Time Sovereignty. Devpost returned the authoritative `Project submitted!`
  confirmation and navigated to the public project page.
- Verified the public page at https://devpost.com/software/chief-of-staff-sm5evr
  shows `Submitted to OpenAI Build Week`, the approved YouTube video, Demo Lab,
  public MIT repository, project story, and Chloe's contribution statement.
- Tagged the exact submitted code baseline `20ca832` as `v1.0.0-submitted` and
  opened `codex/longitudinal-goal-loop` for isolated post-submission work.
- Saved a local screenshot and public-safe evidence note. No application code,
  stable Cloud Run traffic, private session, Firestore data, or secret changed.

## 2026-07-20 — Longitudinal goal workspace contracts

- Added versioned schemas for a session-owned goal workspace, one-to-many daily
  schedule slots, immutable plan revisions, structured attendance, and a
  content-free deletion tombstone.
- The contract keeps every plan, attendance row, task pointer, and memory path
  scoped by stable `goalId`. A paused or terminal workspace cannot retain an
  active check-in or task pointer.
- Multi-slot support represents goals such as three bridge sessions per day as
  one goal with three local-time slots. Duplicate local times are rejected.
- Attendance can record completed, partial, blocked, rescheduled, rest, missed,
  or cancelled outcomes while storing only evidence kinds and safe summaries,
  never raw replies, voice, or images.
- Decision 0017 fixes the product boundary: Firestore owns durable state, Cloud
  Tasks owns wake-up, GPT-5.6 owns interpretation and replanning, and the PWA
  owns visible consent and goal management. Only the next occurrence is
  materialized.
- Verification passed: 33 test files passed with five skipped; 131 tests passed
  with nine skipped; ESLint, TypeScript, production build, and diff check all
  passed.

## 2026-07-20 — Protected cloud goal lifecycle

- Added a Firestore goal workspace repository and authenticated private routes
  for Save, List, Open, Pause, Resume, Complete, Archive, and Delete.
- Separated durable ownership from the expiring phone session. Existing session
  documents upgrade to stable owner `private-single-device`, so a 96-hour
  re-pair does not orphan a thirty-day goal.
- Confirmed browser records are converted server-side into a workspace and
  first immutable plan revision. The client cannot choose another owner.
- Added optimistic workspace revisions, ownership checks, idempotent creation,
  and content-free deletion tombstones. Browser GET routes rely on the signed
  same-site cookie; every mutation retains the strict Origin check.
- Pause, Complete, Archive, and Delete clear active wake-up pointers and cancel
  the named Cloud Task. Cancellation treats an already-gone task as success.
- Added `goalId` to new check-in contexts. A late authenticated Cloud Task now
  checks the goal workspace before delivery; paused, archived, or deleted goals
  return an idempotent `inactive_goal` no-op and cannot produce a ghost alert.
- Verification passed: 38 test files passed with five skipped; 144 tests passed
  with nine skipped; ESLint, TypeScript, production build, and diff check all
  passed.

## 2026-07-20 — Real GPT-5.6 plan revision loop

- Replaced the plan-review dead ends with one protected structured revision
  path. Free-form corrections, assumption answers, and direct plan edits now
  invoke the real Goal Architect instead of appending an inert local note.
- Assumptions can be marked `This fits`, `Not true`, or `Change it`; edited
  assumptions require the user's replacement text. A revision clears answered
  assumptions and returns only genuinely unresolved ones.
- The revision call re-evaluates cadence, timing, milestone, next action,
  hard-day version, completion signal, and remaining assumptions together.
  It is idempotent, uses the existing paired-device boundary, has a five-minute
  lease, preserves zero SDK retries, and never silently falls back to mock.
- A deliberate live contract call rejected the false one-evening-reminder
  assumption for a three-times-per-day bridge goal. `gpt-5.6-sol` returned a
  schema-valid plan reflecting 09:00, 14:00, and 19:00 and consumed 1,409
  tokens. Evidence: `docs/evidence/live-goal-plan-revision-2026-07-20.md`.
- Verification passed: 40 test files passed with six skipped; 148 tests passed
  with ten skipped; ESLint, TypeScript, production build, and diff check all
  passed.
