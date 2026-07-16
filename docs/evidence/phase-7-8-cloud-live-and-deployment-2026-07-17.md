# Phase 7–8 cloud live and final deployment evidence

- Date: 2026-07-17 (Asia/Shanghai)
- Project: `time-sovereignty-2026`
- Service: `time-sovereignty`
- Region: `asia-east1`
- Final source commit: `3b43c12`
- Final revision: `time-sovereignty-00009-2bn`
- Traffic: 100%

## Pre-deployment verification

The repository was clean before activation. Verification covered every tracked
file and every file in the actual gcloud source bundle:

- 100/100 tracked files existed, were readable, and were non-empty;
- `git fsck --full` found no repository corruption;
- `.env.local` and `GPTAPIKEY.txt` remained ignored and untracked;
- a tracked-file scan found no plaintext OpenAI key pattern;
- `gcloud meta list-files-for-upload` produced 66 files and excluded
  `.env.local`, `GPTAPIKEY.txt`, `node_modules`, and `.next`;
- clean `npm ci`: 499 packages installed from `package-lock.json`;
- normal suite: 13 test files passed, 2 live-only files skipped; 51 tests
  passed, 5 live-only tests skipped;
- TypeScript: passed;
- ESLint: passed after fixing two synchronous effect updates and one incorrect
  mutable binding discovered by the full validation;
- Next.js 16.2.10 production build: passed with six routes/pages;
- npm audit: zero vulnerabilities;
- standalone production runtime: homepage 200, manifest 200, health 200.

OpenAI SDK automatic retries now default to zero. The corresponding test passed
in the 51-test normal suite. Commit `c5b78a6` contains the deployment-perimeter
hardening.

## Cost and credential perimeter

Before the credential moved, the real queue allowed 100 attempts, 10 concurrent
dispatches, and 10 dispatches per second. It was paused and changed to:

- max dispatches per second: 1;
- max concurrent dispatches: 1;
- max attempts: 1.

Cloud Run was changed to max instances 1 and container concurrency 1. The queue
was empty throughout activation except for the explicitly named proof tasks.

Secret Manager resource `openai-api-key` received version 1 without displaying
the value or writing it to a temporary file. Only
`time-sovereignty-runtime@time-sovereignty-2026.iam.gserviceaccount.com` has
`roles/secretmanager.secretAccessor` on that secret. Cloud Run binds
`OPENAI_API_KEY` from `openai-api-key:latest`.

## Live GPT-5.6 OIDC proof

An unauthenticated POST to the orchestration callback returned HTTP 401 before
the proof task was released.

Primary task and Firestore receipt:

- task and request ID: `phase7-live-20260717-1`;
- receipt status: `COMPLETED`;
- attempt count: 1;
- error: none;
- started: `2026-07-16T17:15:44.854Z`;
- completed: `2026-07-16T17:16:07.914Z`;
- specialist dispatch: Goal Architect, Commitment Recovery, Memory Curator;
- Chief of Staff ran once after the specialists.

| Agent | Provider | Returned model | Schema | Tokens |
|---|---|---|---|---:|
| Goal Architect | `openai` | `gpt-5.6-sol` | `GoalArchitectOutput` | 717 |
| Commitment Recovery | `openai` | `gpt-5.6-sol` | `CommitmentRecoveryOutput` | 449 |
| Memory Curator | `openai` | `gpt-5.6-sol` | `MemoryCuratorOutput` | 599 |
| Chief of Staff | `openai` | `gpt-5.6-sol` | `ChiefOfStaffOutput` | 1,521 |

Total usage: 3,286 tokens. All four safe traces were `COMPLETED` and contained
token usage without raw prompts, model content, secrets, media, or private
reasoning.

The safe Firestore proof fingerprint was:
`a74919a641466cd8cd4f5afe8c590e56202f16e2a43c3f77cec7840f17379634`.

Duplicate task `phase7-live-20260717-1-duplicate` used the same request ID. The
queue completed it, while the receipt stayed at attempt 1 with the original task
name and original timestamps. All four trace fields and timestamps remained
unchanged; the fingerprint remained identical. No second 3,286-token Agent run
occurred.

## Deployed browser acceptance

The first live revision exposed an outdated UI sentence claiming that the live
switch still awaited approval. The copy was corrected, `/api/health` was
extended with the safe model name, and Developer now fetches the actual provider,
model, and revision while retaining honest local-simulation labels. Commit
`3b43c12` contains the correction and was fully reverified before final deploy.

Final revision `time-sovereignty-00009-2bn` passed a fresh Chrome journey at
390x844:

- three-question onboarding and plan confirmation;
- support agreement confirmation;
- text check-in reply;
- text progress;
- photo progress using a 110,048-byte repository screenshot;
- voice progress using Chrome's fake microphone device;
- intervention effectiveness rating;
- accelerated simulation through Day 30;
- Journey timeline;
- Developer Agent trace and live cloud runtime label;
- reload persistence at Day 30;
- browser console errors: 0;
- failed browser requests: 0.

Screenshot:
`docs/evidence/phase-7-8-deployed-developer-2026-07-17.png`.

## Final health and environment snapshot

After browser acceptance, the queue was resumed. Final state:

- queue: `RUNNING`, no pending tasks, 1 dispatch/second, 1 concurrent, 1 attempt;
- runtime service account: dedicated Time Sovereignty runtime identity;
- Cloud Run: max instances 1, container concurrency 1;
- environment names: the original eight non-secret names plus
  `AI_PROVIDER_MODE`, `OPENAI_MODEL`, and secret-backed `OPENAI_API_KEY`;
- final health: HTTP 200, `Cache-Control: no-store`;
- health payload: service `time-sovereignty`, provider `live`, model `gpt-5.6`,
  revision `time-sovereignty-00009-2bn`.

## Honest boundary

- The browser journey is local-first and its simulated Agent traces are labeled
  mock; the protected OIDC proof above is the real cloud GPT-5.6 execution.
- Photo and voice evidence persist in browser local storage, not Cloud Storage.
- Browser notifications are not background push while the web app is closed.
- Voice was accepted with Chrome's fake microphone; a physical-device recording
  remains a demo rehearsal item, not a cloud-provider blocker.
