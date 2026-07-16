# Phase 4 Finalized GPT-5.6 Contract Evidence

- Date: 2026-07-16 (Asia/Shanghai)
- Result: **PASS**
- Runner: `npm run test:live:phase4-contracts`
- API calls in recorded run: exactly 4
- SDK automatic retries: 0
- Response storage: disabled
- Reasoning effort: `none`

## Contract results

Each request used the production `OpenAiResponsesProvider`, OpenAI Responses
API `responses.parse`, `zodTextFormat`, and the exact production Zod contract.
Only safe model, schema, status, and token metadata were retained.

| Agent | Zod contract | Requested model | Returned model | Input tokens | Output tokens | Total tokens | Result |
|---|---|---|---|---:|---:|---:|---|
| Goal Architect | `GoalArchitectOutput` | `gpt-5.6` | `gpt-5.6-sol` | 277 | 325 | 602 | PASS |
| Commitment Recovery | `CommitmentRecoveryOutput` | `gpt-5.6` | `gpt-5.6-sol` | 254 | 86 | 340 | PASS |
| Memory Curator | `MemoryCuratorOutput` | `gpt-5.6` | `gpt-5.6-sol` | 358 | 139 | 497 | PASS |
| Chief of Staff | `ChiefOfStaffOutput` | `gpt-5.6` | `gpt-5.6-sol` | 477 | 42 | 519 | PASS |
| **Total** | four finalized contracts |  |  | **1,366** | **592** | **1,958** | **PASS** |

All four calls returned `COMPLETED`, and all four parsed outputs passed their
respective Zod schemas.

## Call-count integrity

The runner instantiated the official OpenAI SDK with `maxRetries: 0`. Each of
the four sequential tests called `generateStructured` once, so the recorded
run issued one HTTP request per Agent and no automatic retry.

An immediately prior runner launch failed before the OpenAI client or API was
reached because Node 24 rejected a named import from the CommonJS `@next/env`
package. That launch made zero OpenAI requests. The import-only correction was
syntax-checked before this recorded run.

Earlier Phase 4 development calls are separately disclosed in
`phase-4-four-agent-orchestration-2026-07-16.md`; this evidence does not claim
that the project has made only four OpenAI calls in its lifetime.

## Mock-first boundary

Routine `npm test` skips this file. The post-change normal suite passed 50 tests
and skipped five live-only tests. This live suite is a one-time thin perimeter
for frozen output contracts, not an inner development loop.

Phase 7 is therefore provider-switch activation plus end-to-end rehearsal,
not first contact with GPT-5.6.
