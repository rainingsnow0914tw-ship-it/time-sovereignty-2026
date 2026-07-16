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
