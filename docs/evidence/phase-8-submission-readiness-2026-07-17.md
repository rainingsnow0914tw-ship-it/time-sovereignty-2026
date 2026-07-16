# Phase 8 submission readiness evidence

- Date: 2026-07-17 (Asia/Shanghai)
- Checkpoint time: 04:38 +08:00
- Project: `time-sovereignty-2026`
- Service: `time-sovereignty`
- Region: `asia-east1`
- Final revision: `time-sovereignty-00012-7gn`
- Traffic: 100%
- Live URL: `https://time-sovereignty-29309448808.asia-east1.run.app`
- Primary Codex `/feedback` Session ID:
  `019f6085-1e4d-7e23-a0b8-371e6e47bbfa`

## Judging runtime profile

The service was moved from zero to one minimum instance after live evidence
showed a 2.617-second first health request after idle versus approximately
8–12 milliseconds for immediate repeats. No GCP regional split exists: Cloud
Run, Firestore, Cloud Tasks, Artifact Registry, and the source bucket are in
`asia-east1`.

Final live inspection reported:

- latest ready revision `time-sovereignty-00012-7gn`;
- 100% traffic;
- minimum instances 1;
- maximum instances 1;
- container concurrency 1;
- runtime identity
  `time-sovereignty-runtime@time-sovereignty-2026.iam.gserviceaccount.com`;
- 11 environment entries: the original eight infrastructure settings,
  `AI_PROVIDER_MODE`, `OPENAI_MODEL`, and secret-backed `OPENAI_API_KEY`;
- secret binding `openai-api-key:latest`;
- Cloud Tasks queue `time-sovereignty-checkins` state `RUNNING`, one dispatch
  per second, one concurrent dispatch, and one maximum attempt;
- runtime and task-caller service accounts both enabled;
- `/api/health` HTTP 200 with `Cache-Control: no-store`, provider `live`, model
  `gpt-5.6`, and revision `time-sovereignty-00012-7gn`.

## Firestore proof still present

The final read-only check confirmed the completed live receipt and four safe
traces remain in Firestore:

- `orchestration_runs/phase7-live-20260717-1`: `COMPLETED`, attempt count 1,
  original task name preserved, started `2026-07-16T17:15:44.854Z`, completed
  `2026-07-16T17:16:07.914Z`;
- Goal Architect: `openai`, `gpt-5.6-sol`, `GoalArchitectOutput`, 717 tokens;
- Commitment Recovery: `openai`, `gpt-5.6-sol`,
  `CommitmentRecoveryOutput`, 449 tokens;
- Memory Curator: `openai`, `gpt-5.6-sol`, `MemoryCuratorOutput`, 599 tokens;
- Chief of Staff: `openai`, `gpt-5.6-sol`, `ChiefOfStaffOutput`, 1,521 tokens.

The live run remains 3,286 total tokens. This inspection did not call OpenAI
and did not create or modify Firestore data.

## Submission assets completed

- `docs/DEVPOST_SUBMISSION.md`: Devpost-ready English description with the
  required Codex and GPT-5.6 explanations.
- `docs/DEMO_SCRIPT.md`: timed 2:50 narration with a 2:58 hard stop and explicit
  Codex/GPT-5.6 audio lines.
- `docs/submission/time-sovereignty-architecture.mmd`: source diagram of the
  implemented system.
- `docs/submission/time-sovereignty-architecture.png`: rendered submission
  diagram, visually inspected at approximately 1917×1247.
- `docs/SUBMISSION_CHECKLIST.md`: current completion and human-action boundary.

The architecture intentionally excludes unimplemented Cloud Storage media,
video/file progress, a dedicated Memory Review UI, and future Agent roles. It
shows the actual local-journey/cloud-live split.

## Accessibility acceptance

The first deployed focused scan found five serious color-contrast violations.
The palette, dark-card class composition, and nested landmark structure were
corrected. The Journey command center now uses one main landmark and a labeled
inner section instead of nested `main` elements.

Final live acceptance ran at 390×844 after transition animations settled:

| Screen | axe violations | Incomplete findings |
|---|---:|---:|
| Goal question | 0 | 0 |
| Plan review | 0 | 0 |
| Support agreement | 0 | 0 |
| Command center | 0 | 0 |

Keyboard focus reached Start over, Today, Check-in, Progress, Journey,
Developer, Open check-in, Share progress, both simulation controls, ratings
1–5, and Reset this journey. Browser console errors and failed requests were
both zero.

## Code verification

- routine suite: 51 passed, five billable live-only tests skipped;
- TypeScript: passed;
- ESLint: passed;
- Next.js production build: passed with six routes/pages;
- final accessibility code commit: `f954e90`;
- submission asset commit: `329edc3`.

No repeated GPT-5.6 regression run was made during this submission-readiness
pass because no production Agent contract changed.

## Public GitHub release

Chloe selected the public MIT route. The repository was published at:

`https://github.com/rainingsnow0914tw-ship-it/time-sovereignty-2026`

Post-publication verification confirmed:

- visibility `PUBLIC`;
- unauthenticated repository HTTP status 200;
- default branch `main`;
- GitHub-detected SPDX license `MIT`;
- homepage points to the live Cloud Run application;
- public topics include OpenAI, GPT-5.6, Codex, AI Agents, Cloud Run, Next.js,
  and hackathon;
- remote `main` exactly matched local commit `29f67a5` at the first public
  release.

The pre-publication scan found no OpenAI key pattern in the current tracked
tree or Git history, no tracked private-key file, and no tracked file over
10 MB. `.env.local` and `GPTAPIKEY.txt` remained ignored.

## Remaining human or authorization-dependent actions

- record and upload the narrated demo as a public YouTube video under three
  minutes;
- paste the final repository and video URLs into the Devpost draft;
- review and submit the Devpost entry.
