# Decision 0002: Approved architecture and phase order

- Status: Accepted
- Date: 2026-07-16
- Decision owner: Chloe
- Implementer: Codex

## Context

The v0.6 product and architecture review is approved for implementation. The
review found that the intended product is large but internally coherent if the
Build Week version is delivered as one end-to-end vertical slice, preserves
clear domain boundaries, and keeps future rooms as interfaces instead of
implementing every future capability.

Three amendments are part of this approval:

1. Run one real `gpt-5.6` Responses API structured-output smoke test before
   Phase 1 work.
2. Move the Cloud Run walking skeleton from the former final deployment phase
   to Phase 3, together with Firestore and Cloud Tasks.
3. Govern time-pressure cuts through Decision 0003.

## Decision

### Build Week architecture

Use a single TypeScript and Next.js App Router repository with one deployable
Cloud Run service. Preserve logical boundaries for:

- domain models and pure state transitions;
- four real agent roles: Chief of Staff, Goal Architect, Commitment Recovery,
  and Memory Curator;
- mock and live AI providers behind the same structured contract;
- Firestore persistence;
- Cloud Tasks scheduling and authenticated callback handling;
- media storage and progress evidence;
- accelerated simulation;
- developer-facing agent run traces.

The Build Week implementation may remain one service. A multi-service or
microservice split is not required to prove the product.

### Non-negotiable behavioral boundaries

- Keep the action lifecycle and intervention lifecycle as two distinct state
  machines.
- Validate every agent input and output at a typed schema boundary.
- Store durable product state outside model context.
- Keep mock and live providers behaviorally interchangeable at their public
  interfaces.
- Do not replace adaptive model reasoning with a large hard-coded rule tree.
- Keep the accelerated clock behind an explicit simulation boundary so it
  cannot silently affect production time.
- Record real agent calls, tool calls, memory proposals, and state transitions
  in the trace model without recording secrets.

## Revised implementation phases

### Phase 1 — Deterministic foundation

- Next.js and TypeScript application skeleton;
- domain schemas;
- action and intervention state machines;
- provider interfaces;
- deterministic mock AI provider;
- unit tests for transitions, invariants, and schema validation.

Exit gate: the domain loop can be exercised without network access or API
credit.

### Phase 2 — Local vertical-slice entry

- three-question onboarding and goal confirmation;
- support agreement;
- local repository adapters and mock orchestration;
- the first usable mobile-first flow.

Exit gate: a user can create and confirm a goal and support agreement in mock
mode.

### Phase 3 — Public walking skeleton

- deploy the minimal Cloud Run service;
- connect Firestore repositories;
- create Cloud Tasks scheduling and a real public callback handler;
- secure and verify the callback path;
- keep the deployed slice deliberately thin while exposing deployment risk.

Exit gate: a real Cloud Task reaches the deployed Cloud Run callback and the
resulting intervention transition is persisted in Firestore.

This phase is intentionally early. A local adapter cannot prove the real
Cloud Tasks callback path because Cloud Tasks needs a reachable URL.

### Phase 4 — Four-agent orchestration

- Chief of Staff dispatch and final decision contract;
- Goal Architect;
- Commitment Recovery;
- Memory Curator;
- mock/live provider parity and agent trace persistence.

### Phase 5 — Voice-enabled intervention loop

- scheduled check-in delivery;
- text and tap-to-play TTS;
- voice and text reply;
- one-delay rescheduling;
- repeated-delay detection and adaptive recovery.

### Phase 6 — Progress, feedback, and memory loop

- progress sharing through text, photo, and voice;
- specific feedback;
- intervention-effectiveness record;
- resume point and memory retrieval.

### Phase 7 — Longitudinal proof

- accelerated simulation covering at least seven simulated days;
- journey timeline;
- developer agent trace;
- acceptance-path automation.

### Phase 8 — Submission hardening

- live `gpt-5.6` verification and cost guardrails;
- accessibility and mobile polish;
- README, evidence chain, demo script, and submission assets;
- final production and mock-mode verification.

Phase 8 is hardening, not the first deployment. The first real deployment is
required in Phase 3.

## Immediate model smoke-test result

The required real request was attempted before Phase 1. OpenAI returned HTTP
429 with `insufficient_quota` before inference. Therefore the request did not
yet validate the model alias, project model access, or structured output. The
attempt and its exact validation status are recorded in
`docs/evidence/openai-gpt-5.6-smoke-2026-07-16.md`.

This is a live-provider precondition failure, not permission to substitute a
different model. Phase 1 continues in mock-first mode, and the same smoke test
must be rerun after the project API balance is available.

## Consequences

- Deployment and callback authentication risk becomes visible early.
- Phase 1 remains fast, deterministic, and cheap.
- The architecture stays large enough to demonstrate the differentiated
  product, while implementation is ordered around a provable vertical slice.
- A successful GPT-5.6 evidence record remains an explicit gate before live
  agent integration is declared complete.
