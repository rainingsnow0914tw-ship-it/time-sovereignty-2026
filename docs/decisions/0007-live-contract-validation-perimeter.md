# Decision 0007: Live contract validation perimeter

- Date: 2026-07-16
- Status: Accepted
- Decision owner: Driver, acting for Chloe
- Implementer: Codex

## Context

Phase 4 already had deterministic shared Zod contracts, a mock provider, and a
real GPT-5.6 orchestration acceptance. The first live development attempt found
a real Structured Outputs incompatibility in the Memory Curator contract, but
the later successful acceptance did not preserve per-Agent token usage.

The project needs early, auditable model compatibility without turning routine
development into a slow or billable loop.

## Decision

1. Inner-loop development and CI remain deterministic mock-only.
2. When an Agent output contract is finalized, run one thin live validation
   using the production `OpenAiResponsesProvider`, `responses.parse`, and that
   Agent's exact Zod schema.
3. Use the smallest useful input, one HTTP request, response storage disabled,
   reasoning effort `none`, and SDK automatic retries disabled.
4. Record requested and returned model names, schema pass/fail, and input,
   output, and total token usage. Do not record secrets, raw prompts, model
   output, or private reasoning.
5. Phase 4 requires exactly four such calls: Goal Architect, Commitment
   Recovery, Memory Curator, and Chief of Staff. Do not repeat or iterate after
   the evidence run.
6. Earlier development calls remain part of the honest evidence history and
   are not relabeled as the new four-call protocol.
7. Phase 7 is repositioned as provider-switch activation plus end-to-end
   rehearsal. It is not the first contact between the product contracts and a
   real model.

## Acceptance record

The single four-call evidence run passed on 2026-07-16. All four responses
returned `gpt-5.6-sol` for requested model `gpt-5.6` and passed their production
Zod contract. Total usage was 1,958 tokens. Exact per-Agent results are stored
in `docs/evidence/phase-4-live-contracts-2026-07-16.md` and matching JSON.

## Consequences

- Mock-first speed, determinism, and zero routine API cost are preserved.
- Contract drift against OpenAI Structured Outputs is exposed when the contract
  freezes rather than at final demo time.
- Phase 7 can focus on the cloud switch, credentials, OIDC path, persistence,
  duplicate suppression, and the full user journey.
- This decision does not approve uploading the local OpenAI API key to GCP or
  binding it to Cloud Run; that separate credential gate remains in force.
