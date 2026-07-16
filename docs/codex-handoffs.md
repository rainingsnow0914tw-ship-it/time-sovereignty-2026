# Codex Handoff Manual

## Current checkpoint

- Handoff updated: 2026-07-16 21:50 Asia/Shanghai.
- Repository: `C:\Users\soulf\Desktop\openAI build week202607130721`
- Branch: `main`
- Last verified implementation commit: `e1430c3`
  (`feat: complete local onboarding vertical slice`).
- The commit containing this file is the handoff checkpoint; verify it with
  `git log -1 --oneline` after opening the repository.
- Project name: **Time Sovereignty** (earlier working name: Chloe Chief of
  Staff).
- Development surface: the primary Codex desktop Build Week task.

## Start here in the next Codex task

1. Open the repository path above and run `git status --short` plus
   `git log -3 --oneline`.
2. Read this file, then `README.md` and `docs/decisions/0002` through `0005`.
3. Do not reload every source or reference asset. Use the source-of-truth order
   in `README.md`; consult the Decision 0004 index only when a Phase 3 or Phase
   5 problem actually requires it.
4. Before changing application code, run `npm test` and `npm run typecheck`.

## Verified completed work

### Repository and evidence chain

- Clean dedicated Git repository created on 2026-07-16.
- PRD, architecture, and kickoff materials preserved unchanged in
  `docs/source/`.
- Decisions 0001-0005 record review approval, phase order, cut order,
  reference/cost guardrails, and GCP project/region choices.
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

### Live GCP walking skeleton

- Account used: `soulfaihk@gmail.com`.
- Dedicated project: `time-sovereignty-2026` (number `29309448808`), billing
  enabled.
- Region: `asia-east1`.
- Firestore `(default)`: Native mode, Standard edition, delete protection on.
- Cloud Run service: `time-sovereignty`, revision
  `time-sovereignty-00002-hr4`, 100% traffic, 1 CPU, 512 MiB, minimum instances
  left at zero.
- Public URL: `https://time-sovereignty-defqnamrrq-de.a.run.app` (verified HTTP
  200 and complete Phase 2 browser path after deployment).
- Monthly GCP budget: US$30 with 50%, 90%, and 100% current-spend alerts.
- Required APIs, including Cloud Tasks and Secret Manager, are enabled.
- The deployed service has no OpenAI secret. It serves the Phase 2 mock UI but
  still has no Firestore application write or Cloud Tasks callback. Initial
  infrastructure evidence: `docs/evidence/gcp-walking-skeleton-2026-07-16.md`;
  current UI evidence:
  `docs/evidence/phase-2-local-vertical-slice-2026-07-16.md`.

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
- Firestore application persistence;
- creation and delivery of a real Cloud Task;
- authenticated Cloud Tasks callback;
- callback-driven Firestore intervention transition;
- Accelerated Simulation UI;
- text/photo/voice progress sharing;
- a complete Phase 3 exit gate.

## Exact next action

Complete the already-deployed **Phase 3 real trigger path** on the existing
GCP project:

1. persist the required domain state in Firestore;
2. create a Cloud Tasks queue and one real task;
3. authenticate its callback to Cloud Run;
4. make the callback perform an idempotent intervention transition;
5. capture logs and before/after Firestore evidence.

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
- `docs/evidence/openai-gpt-5.6-smoke-2026-07-16.md` — preserved quota failure
- `docs/evidence/openai-gpt-5.6-smoke-success-2026-07-16.md` — successful live
  validation
- `docs/evidence/gcp-walking-skeleton-2026-07-16.md` — public infrastructure
- `docs/evidence/phase-2-local-vertical-slice-2026-07-16.md` — full local
  onboarding and support-agreement exit gate
- `docs/CODEX_BUILD_LOG.md` — chronological work log

If the repository state conflicts with this manual, stop and reconcile the
actual Git state first. The live repository and committed evidence outrank a
stale prose note.
