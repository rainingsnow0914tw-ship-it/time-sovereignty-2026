# Phase 3 Real Cloud Tasks Acceptance Evidence

- Date: 2026-07-16 (Asia/Shanghai)
- GCP project: `time-sovereignty-2026`
- Region: `asia-east1`
- Result: **PASS**

## Exit-gate checklist

- [x] A real one-time Cloud Task reached the public Cloud Run callback.
- [x] The callback required the exact Google-signed OIDC caller identity.
- [x] An unauthenticated request failed closed with HTTP 401
  `{"ok":false,"error":"unauthorized_task"}`.
- [x] A Firestore transaction changed one intervention from `SCHEDULED` to
  `DUE` and wrote a completed delivery receipt.
- [x] The original task survived a real failed attempt and later retry after
  the Firestore transport fix.
- [x] A second task using the same intervention ID returned success as a
  duplicate without another state transition or delivery attempt.
- [x] The Phase 2 public page remained HTTP 200 after the Docker deployment.
- [x] Local verification remained green: 31/31 tests, TypeScript, ESLint, and
  production build.

## Primary task and persisted transition

- Intervention ID: `phase3-20260716142638`
- Primary task name: `bodyfile-phase3-20260716142638`
- Before: intervention state `SCHEDULED`
- After: intervention state `DUE`
- Intervention `updatedAt`: `2026-07-16T14:45:46.009Z`
- Receipt path:
  `interventions/phase3-20260716142638/delivery_receipts/cloud-task`
- Receipt status: `COMPLETED`
- Receipt `attemptCount`: `1`
- Receipt `claimedAt`: `2026-07-16T14:45:46.009Z`
- Receipt `completedAt`: `2026-07-16T14:45:46.274Z`

The primary task first reached the callback while Firestore was using the REST
fallback and received a retryable failure. The queue was paused, the Firestore
client was changed to its default gRPC transport, revision
`time-sovereignty-00005-wb5` was deployed, and the same task was resumed and
completed. The successful receipt therefore records one claimed delivery,
not a replacement task manufactured after the fix.

## Second idempotency acceptance

- Duplicate task name: `duplicate-phase3-20260716142638`
- Cloud Run log timestamp: `2026-07-16T14:46:46.303750Z`
- Log result: `[task-callback] duplicate`
- Queue result: task executed and was removed.
- Intervention remained `DUE`.
- Intervention `updatedAt` remained `2026-07-16T14:45:46.009Z`.
- Receipt remained `COMPLETED` with `attemptCount: 1`.
- Receipt `completedAt` remained `2026-07-16T14:45:46.274Z`.
- Receipt task name remained `bodyfile-phase3-20260716142638`.

This proves that retry or replay by intervention ID does not create a second
state transition or a second delivery receipt attempt.

## Cloud environment snapshot

- Cloud Run service: `time-sovereignty`
- Current ready revision: `time-sovereignty-00005-wb5`
- Traffic: 100% to the current revision
- Resources: 1 CPU, 512 MiB, startup CPU boost, max scale 20, minimum
  instances left at the default zero
- Runtime identity:
  `time-sovereignty-runtime@time-sovereignty-2026.iam.gserviceaccount.com`
- Task-caller identity:
  `time-sovereignty-tasks@time-sovereignty-2026.iam.gserviceaccount.com`
- Both service accounts: enabled
- Runtime project roles: `roles/datastore.user`,
  `roles/cloudtasks.enqueuer`
- Runtime-to-caller permission: `roles/iam.serviceAccountUser`
- Caller-to-service permission: `roles/run.invoker`
- Queue: `time-sovereignty-checkins`, state `RUNNING`, no remaining tasks
- Queue limits: 10 dispatches/second, 10 concurrent dispatches, burst 10
- Queue retry policy: 100 attempts, 0.1-second minimum backoff, 3600-second
  maximum backoff, 16 doublings
- Firestore `(default)` current test intervention:
  `phase3-20260716142638`, state `DUE`, updated at
  `2026-07-16T14:45:46.009Z`, with the completed receipt listed above

Eight non-secret Cloud Run environment variables are present:

1. `GCP_PROJECT_ID`
2. `FIRESTORE_DATABASE_ID`
3. `CLOUD_TASKS_LOCATION`
4. `CLOUD_TASKS_QUEUE`
5. `CLOUD_TASKS_SERVICE_ACCOUNT_EMAIL`
6. `CLOUD_TASKS_OIDC_AUDIENCE`
7. `CLOUD_TASKS_CALLBACK_BASE_URL`
8. `TASK_CALLBACK_LEASE_SECONDS`

No OpenAI secret is deployed.

## Pitfalls and fixes

1. PowerShell/gcloud parameter handling swallowed the inline JSON body supplied
   through `--body-content`, so the callback received an empty body and
   returned HTTP 400. The proof task was recreated using a patched temporary
   JSON file and `--body-file`. The temporary file is outside the repository.
2. Firestore `preferRest` transaction serialization failed with
   `toProto3JSON: don't know how to convert value 0`. The optimization was
   removed and the official client returned to its default gRPC transport;
   the waiting real task then retried successfully.

## Honest boundary and next phase

Phase 3 proves authenticated scheduling, callback execution, transactional
state movement, retry recovery, and duplicate suppression. It does not claim a
user notification or a live four-agent OpenAI orchestration path.

Phase 4 starts with the Chief of Staff dispatcher contract. The first action
is to add a deterministic mock orchestration test that selects only the agents
needed for the request, validates the final `ChiefOfStaffOutputSchema`, and
persists or returns safe agent traces without raw prompts or private reasoning.
