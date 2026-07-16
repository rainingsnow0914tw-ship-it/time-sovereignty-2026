# Decision 0006: Phase 3 Runtime Identities and Callback Idempotency

- Date: 2026-07-16
- Status: Accepted

## Context

Phase 3 must prove that a real Cloud Task reaches Cloud Run and persists an
intervention transition in Firestore. The same public Cloud Run service also
serves the anonymous product UI, so service-level public access cannot by
itself authenticate the callback route.

## Decision

1. Use a dedicated runtime service account with only `datastore.user` and
   `cloudtasks.enqueuer` project roles.
2. Use a separate Cloud Tasks caller service account. The runtime may act as
   that identity only for task creation, and the caller receives Cloud Run
   invocation permission.
3. Every callback carries a Google-signed OIDC token. Application code verifies
   the audience, verified email, and exact task-caller email before reading the
   request body or Firestore.
4. Use the intervention ID as the idempotency key. Store one delivery receipt
   under `interventions/{id}/delivery_receipts/cloud-task`.
5. Claim the callback in a Firestore transaction. The claim moves
   `SCHEDULED` to `DUE` and writes an `IN_FLIGHT` lease atomically.
6. A retry during an active lease receives a retryable response. An expired
   lease may be taken over without replaying the intervention transition.
7. Completion changes the receipt to `COMPLETED`. Later tasks with the same
   intervention ID return a successful duplicate result without a second state
   transition.
8. Phase 3 does not mark an intervention `DELIVERED`, because no user
   notification is sent in this thin trigger proof.

## Consequences

- The public callback URL fails closed without the expected OIDC identity.
- The retry window is explicit and testable instead of relying on task-name
  uniqueness alone.
- The Phase 3 evidence can distinguish a callback acceptance from a delivered
  user notification.
- No shared scheduler secret or OpenAI key is introduced.
