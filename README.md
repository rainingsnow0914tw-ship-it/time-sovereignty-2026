# Time Sovereignty

OpenAI Build Week 2026 project built in Codex, with GPT-5.6 as the product's Chief of Staff brain.

## Current status

Repository foundation created on 2026-07-16 (Asia/Shanghai). The architecture
review is approved and Phase 1 implementation is in progress. The revised plan
moves the Cloud Run, Firestore, and real Cloud Tasks walking skeleton to Phase
3 so deployment risk is exposed early.

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

## Local verification

```bash
npm ci
npm test
npm run typecheck
npm run lint
npm run build
```

`npm run smoke:openai` performs one real Responses API request using the ignored
local `.env.local`. Do not run it casually: it is a live, potentially billable
check and currently remains blocked by project API quota.

## Evidence chain

- Keep milestone-sized Git commits with clear dates and intent.
- Keep the main Codex development task as the primary Build Week task when practical.
- Record major decisions in `docs/decisions/`.
- Record cross-task continuity in `docs/codex-handoffs.md` only if a handoff becomes necessary.
- Preserve the final primary-task `/feedback` Session ID for submission.

## Secret handling

The real OpenAI API key belongs only in `.env.local` and must never be printed or committed. `.env.example` contains names and safe defaults only.

A minimal real `gpt-5.6` Responses API request was attempted on 2026-07-16. It
was blocked before inference by API `insufficient_quota`; the result is retained
in `docs/evidence/` and must not be represented as a successful model-access or
structured-output check.
