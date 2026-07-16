# Decision 0005: Dedicated GCP project and primary region

- Status: Accepted
- Date: 2026-07-16
- Decision owner: Driver, acting for Chloe
- Implementer: Codex

## Context

After Phase 1, the driver instructed Codex to use the local GCP CLI, create a
new project and database, and deploy the current application directly. The PRD
and architecture did not prescribe a Google Cloud region.

This pulls the infrastructure bootstrap portion of Phase 3 forward. It does not
pull forward or waive the Phase 3 functional exit gate.

## Decision

- Use dedicated GCP project `time-sovereignty-2026` rather than sharing an old
  family-bot project.
- Use `asia-east1` as the primary region for Cloud Run, Firestore, and future
  Cloud Tasks resources. It is close to the primary users and keeps the main
  data and execution path co-located.
- Use Firestore Native mode, Standard edition, database `(default)`, with delete
  protection enabled.
- Deploy the current Next.js application as public Cloud Run service
  `time-sovereignty` to prove the build and runtime path.
- Keep Cloud Run at its default zero minimum instances. Do not introduce an
  always-on listener.
- Apply a project-scoped monthly US$30 budget with alerts at 50%, 90%, and 100%
  current spend.
- Keep `OPENAI_API_KEY` local until a deployed runtime actually requires it and
  the API billing precondition is working. When needed, add it through Secret
  Manager rather than an environment file in the source upload.

## Required disclosure

The public landing page is a walking skeleton only. Phase 3 remains incomplete
until all of the following are evidenced:

1. an authenticated Cloud Tasks one-time task reaches Cloud Run;
2. the handler is idempotent by `interventionId`;
3. a real intervention transition is persisted in Firestore;
4. retry behavior does not create duplicate delivery.

## Consequences

- GCP project creation, billing, build, and public runtime risk are now exposed
  before UI work continues.
- The Time Sovereignty deployment cannot accidentally modify the existing
  family-bot or Catch Loop projects.
- Later phases inherit a fixed primary region and explicit cost boundary.
