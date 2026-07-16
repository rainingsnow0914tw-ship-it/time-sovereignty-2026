# Time Sovereignty

OpenAI Build Week 2026 project built in Codex, with GPT-5.6 as the product's Chief of Staff brain.

## Current status

Repository foundation created on 2026-07-16 (Asia/Shanghai). Phases 1 and 2 are
complete. The local product now supports the three-question onboarding flow,
a schema-validated mock Goal Architect plan, plan confirmation, a detailed
support agreement, and validated browser-local persistence with reload
recovery. At the driver's direction, the GCP project, Firestore database, and
public Cloud Run walking skeleton were also bootstrapped early to expose cloud
and billing risk.

The deployed landing page is available at
`https://time-sovereignty-defqnamrrq-de.a.run.app`. It now serves the verified
Phase 2 mock onboarding and support-agreement slice. This is not completion of
the Phase 3 exit gate: the real Cloud Tasks callback and persisted Firestore
intervention transition still have to be implemented.

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
- Cloud Run service: `time-sovereignty`, public Phase 2 mock UI (revision
  `time-sovereignty-00002-hr4`);
- cost guardrail: project-scoped monthly US$30 budget with 50%, 90%, and 100%
  alerts;
- OpenAI key: local only; it has not been deployed to Cloud Run.

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
check. The required one-request smoke test passed on 2026-07-16; routine local
development should remain mock-first.

## Evidence chain

- Keep milestone-sized Git commits with clear dates and intent.
- Keep the main Codex development task as the primary Build Week task when practical.
- Record major decisions in `docs/decisions/`.
- Record cross-task continuity in `docs/codex-handoffs.md` only if a handoff becomes necessary.
- Preserve the final primary-task `/feedback` Session ID for submission.

## Secret handling

The real OpenAI API key belongs only in `.env.local` and must never be printed or committed. `.env.example` contains names and safe defaults only.

A first minimal real `gpt-5.6` Responses API request was blocked by
`insufficient_quota`. After API billing was funded, the same one-request check
passed on 2026-07-16: model access, the Responses API, and strict structured
output were all confirmed. Both the failed and successful records are retained
in `docs/evidence/` so the evidence chain remains complete.
