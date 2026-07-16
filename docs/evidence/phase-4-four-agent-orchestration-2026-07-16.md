# Phase 4 Four-Agent Orchestration Evidence

- Date: 2026-07-16 (Asia/Shanghai)
- Result: **CORE PASS; CLOUD LIVE ACTIVATION PENDING EXPLICIT CREDENTIAL APPROVAL**
- Implementation commits: `57be0ed`, `e0391a3`
- Cloud revision: `time-sovereignty-00006-szv`

## What is implemented

- Chief of Staff dispatcher and strict final-decision contract
- Goal Architect structured output
- Commitment Recovery structured output
- Memory Curator structured output
- need-based dispatch instead of calling every specialist by default
- mock and live providers behind the same `AiProvider` interface and Zod schemas
- OpenAI Responses API `responses.parse` with `zodTextFormat`
- requested model `gpt-5.6`, reasoning effort `none`, `store: false`
- safe per-call token usage on live traces; mock traces explicitly use `null`
- safe trace return plus Firestore `agent_runs` persistence
- request-level Firestore lease, failure state, retry takeover, completion, and
  duplicate suppression
- OIDC-only Cloud Tasks orchestration route

The OpenAI adapter follows the official Structured Outputs guide:
`https://developers.openai.com/api/docs/guides/structured-outputs`.
The official model page confirms the `gpt-5.6` alias supports the Responses API
and Structured Outputs:
`https://developers.openai.com/api/docs/models/gpt-5.6-sol`.

## Deterministic verification

- Test files: 13 passed, 2 live-only files skipped by default
- Tests: 50 passed, 5 live-only tests skipped by default
- TypeScript: passed
- ESLint: passed
- Next.js production build: passed
- Production routes include:
  `/api/tasks/orchestration/[requestId]`
- npm install/audit after adding `openai@6.47.0`: zero vulnerabilities

Need-selection tests prove:

- repeated delay alone calls only Commitment Recovery plus Chief of Staff;
- a general check-in calls no specialist and only Chief of Staff;
- all three specialists run only when all three need signals are present;
- a final decision that misreports the actual dispatch is rejected;
- extra provider fields such as a raw prompt are stripped before trace storage.

## Real local GPT-5.6 acceptance

Command surface: `npm run test:live:phase4`.

After fixing the live schema incompatibility, the gated acceptance completed in
47.38 seconds and asserted all of the following:

- Goal Architect returned `GoalArchitectOutput`;
- Commitment Recovery returned `CommitmentRecoveryOutput`;
- Memory Curator returned `MemoryCuratorOutput`;
- Chief of Staff returned `ChiefOfStaffOutput`;
- Chief of Staff reported the exact three-agent dispatch list;
- trace order was Goal Architect, Commitment Recovery, Memory Curator, Chief of
  Staff;
- all four traces reported provider `openai`;
- every returned model string contained `gpt-5.6`;
- safe traces contained no raw prompt or private reasoning.

This historical all-agent test is skipped during routine `npm test` so normal
development does not spend API credit. Response storage is disabled. Exact
token usage was not captured by that historical run and is not retroactively
claimed.

## Finalized per-Agent live contract evidence

Command surface: `npm run test:live:phase4-contracts`.

Decision 0007 adds a thin live perimeter around the mock-first inner loop. The
runner uses the production `OpenAiResponsesProvider`, `responses.parse`, and
the exact Zod schema for each role. SDK automatic retries are disabled. The
recorded run made exactly one request per role, four total, and did not repeat
or iterate on any result.

| Agent | Zod output contract | Requested / returned model | Input | Output | Total | Result |
|---|---|---|---:|---:|---:|---|
| Goal Architect | `GoalArchitectOutput` | `gpt-5.6` / `gpt-5.6-sol` | 277 | 325 | 602 | PASS |
| Commitment Recovery | `CommitmentRecoveryOutput` | `gpt-5.6` / `gpt-5.6-sol` | 254 | 86 | 340 | PASS |
| Memory Curator | `MemoryCuratorOutput` | `gpt-5.6` / `gpt-5.6-sol` | 358 | 139 | 497 | PASS |
| Chief of Staff | `ChiefOfStaffOutput` | `gpt-5.6` / `gpt-5.6-sol` | 477 | 42 | 519 | PASS |
| **Total** | four contracts |  | **1,366** | **592** | **1,958** | **PASS** |

The first launch of this new runner failed before the OpenAI client was loaded
because Node 24 rejected a named import from CommonJS `@next/env`. Therefore it
made zero API requests. After the import-only correction and a syntax check,
the recorded run completed four tests in 30.90 seconds. The machine-readable
record is `phase-4-live-contracts-2026-07-16.json`.

This four-call record is a new contract-evidence pass. Earlier development
calls, including the Structured Outputs incompatibility and the historical
all-agent acceptance, remain disclosed above; this document does not claim
that only four OpenAI calls have ever occurred during Phase 4.

## Live issue found and fixed

The first credential-bearing run reached OpenAI. Goal Architect and Commitment
Recovery succeeded, then Memory Curator received HTTP 400 because the original
`z.record` memory value generated a JSON Schema `propertyNames` keyword that is
not permitted by OpenAI Structured Outputs.

The proposal schema was changed to a fixed structure:

- `summary`: required string
- `attributes`: required array of `{ key, value }`

The same contract is now used by mock and live outputs. The full four-agent
live acceptance passed after this correction.

Two earlier test launches failed before any API request because Vitest test mode
did not inherit `.env.local`. The repository now includes a safe parent runner
that loads the ignored local environment in memory and passes it to the gated
test without printing or rewriting the key.

## Real Cloud Run and Firestore acceptance

Deployment snapshot:

- revision: `time-sovereignty-00006-szv`
- traffic: 100%
- runtime identity:
  `time-sovereignty-runtime@time-sovereignty-2026.iam.gserviceaccount.com`
- resources: 1 CPU, 512 MiB
- max scale: 20
- non-secret environment variables: the same eight Phase 3 names
- provider mode: no explicit variable; safe default `mock`
- OpenAI secret binding: absent
- public homepage: HTTP 200
- unauthenticated orchestration callback: HTTP 401

Primary Cloud Task:

- task: `phase4-cloud-20260716-1`
- request ID: `phase4-cloud-20260716-1`
- queue result: executed and removed
- Cloud Run log: `[agent-orchestration] completed`
- receipt status: `COMPLETED`
- receipt attempt count: `1`
- started: `2026-07-16T15:38:25.929Z`
- completed: `2026-07-16T15:38:26.368Z`
- dispatched agents: Goal Architect, Commitment Recovery, Memory Curator
- error: none

Persisted safe traces:

| Agent | Provider/model | Output schema | Started | Completed |
|---|---|---|---|---|
| Goal Architect | `mock:GOAL_ARCHITECT` | `GoalArchitectOutput` | `15:38:26.070Z` | `15:38:26.072Z` |
| Commitment Recovery | `mock:COMMITMENT_RECOVERY` | `CommitmentRecoveryOutput` | `15:38:26.173Z` | `15:38:26.174Z` |
| Memory Curator | `mock:MEMORY_CURATOR` | `MemoryCuratorOutput` | `15:38:26.203Z` | `15:38:26.204Z` |
| Chief of Staff | `mock:CHIEF_OF_STAFF` | `ChiefOfStaffOutput` | `15:38:26.277Z` | `15:38:26.278Z` |

The displayed model strings include the provider prefix; every persisted trace
also records `provider: mock`, status `COMPLETED`, its deterministic run ID, and
a safe input summary.

## Second request-level idempotency acceptance

- duplicate task: `phase4-cloud-20260716-1-duplicate`
- queue result: executed and removed
- Cloud Run log at `2026-07-16T15:43:07.363027Z`:
  `[agent-orchestration] duplicate`
- receipt remained `COMPLETED`
- attempt count remained `1`
- original task name remained `phase4-cloud-20260716-1`
- receipt start/completion times remained unchanged
- all four agent-trace start/completion times remained unchanged

The duplicate therefore did not rerun the four agents or create a second model
cost.

## Credential boundary and honest claim

Local live GPT-5.6 execution is proven. Deployed OIDC execution and Firestore
trace persistence are proven. Deployed GPT-5.6 execution is **not yet claimed**.

An empty Secret Manager resource `openai-api-key` exists in the dedicated GCP
project. It has zero versions. No local key was uploaded, no secret access role
was granted, and Cloud Run has no secret binding. Moving the credential from the
local OpenAI project into GCP would expose API-spend authority to the Cloud Run
runtime if that cloud boundary were compromised. The next step therefore needs
Chloe's explicit approval after this disclosure.

After approval, the exact activation path is:

1. add one secret version without printing or writing the key to a temp file;
2. grant only the runtime service account secret accessor on this one secret;
3. bind `OPENAI_API_KEY` and set `AI_PROVIDER_MODE=live` without changing CPU,
   memory, scale, or the eight existing non-secret variables;
4. send one new OIDC task and verify four Firestore traces report provider
   `openai` and a `gpt-5.6` model;
5. send a duplicate task and prove no second orchestration cost.

Phase 7 is now provider-switch activation plus end-to-end rehearsal. It is not
the first point at which the product contracts meet a real model; that proof is
already established by the four per-Agent records above.
