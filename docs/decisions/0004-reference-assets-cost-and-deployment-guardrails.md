# Decision 0004: 參考資產與成本部署圍欄

- Status: Accepted
- Date: 2026-07-16
- Decision owner: Chloe
- Implementer: Codex
- Source brief: `TS_參考資產蒸餾_v1.md` (external local reference)

## Context

Time Sovereignty may benefit from operational lessons learned in Chloe's older
production projects. Those projects are not dependencies and are not a source
of code for this repository. The PRD v0.6 and Architecture v2 remain the only
product and architecture sources of truth.

This decision converts sections A, B, and C of the reference brief into
project-specific guardrails while preserving a phase-gated index for later
consultation.

## Reference-asset use rules

1. Old projects are concept references only. Do not copy code or files from an
   old project into this repository.
2. Never read an old project's `.env`, tokens, secrets, credentials, or real
   user data.
3. Do not browse an old project broadly. Read only the indexed file that
   corresponds to a concrete problem encountered during the relevant phase.
4. If a reference conflicts with PRD v0.6 or Architecture v2, the PRD and
   architecture win.
5. Record each future consultation in `docs/CODEX_BUILD_LOG.md`, including the
   problem, the exact file consulted, and the principle adopted. Do not record
   secrets or copy source code into the log.

## A. Cost guardrails

- Deploy Cloud Run with `min-instances=0`. Check-in latency tolerates cold
  starts, so idle compute is not justified.
- Do not introduce always-on listeners or idle Eventarc or Pub/Sub
  subscriptions.
- Set a seven-day lifecycle deletion rule on the demo-media Cloud Storage
  bucket.
- Create a GCP budget alert with a US$30 threshold on deployment day.
- Treat the US$100 OpenAI promotional credit and its stated
  `2026-07-21 17:00 PT` expiry as a hard project constraint until billing shows
  otherwise.
- Dispatch the four agents by need. A request must not call every agent merely
  because all four exist.
- Record input, output, and total token usage on each live `AgentRun` when the
  provider returns usage data.

These controls reduce idle and accidental spend without weakening the four
agent architecture.

## B. Deployment guardrails

### Bootstrap format

Before Phase 3 deployment, create a Time Sovereignty-specific GCP bootstrap
checklist. It must use atomic, single-purpose commands with one verification
after each command and a final end-to-end verification. Chloe or the driver may
run it line by line in Cloud Shell. On error, stop and report the failed step;
do not continue blindly.

### Required Google Cloud APIs

Enable only the APIs required by the deployed slice:

- Cloud Run;
- Firestore;
- Cloud Tasks;
- Cloud Storage;
- Secret Manager;
- Cloud Build;
- Cloud Logging;
- Text-to-Speech only if the selected TTS provider requires it.

### Secrets and callback authentication

- Store `OPENAI_API_KEY` in Secret Manager and rotate it by adding secret
  versions. Do not place plaintext deployed credentials in repository files or
  deployment commands.
- Prefer Cloud Tasks OIDC service-account authentication for scheduled callback
  endpoints.
- A `SCHEDULER_SECRET` shared-secret check is a documented fallback, not the
  default. If selected, record the reason and keep the value in Secret Manager.

### IAM and container boundaries

- The runtime identity needs the least-privilege equivalents of
  `datastore.user`, `storage.objectAdmin`, `secretmanager.secretAccessor`, and
  `cloudtasks.enqueuer` for the resources used by the application.
- The bootstrap reference applies these roles to the default compute service
  account. A dedicated runtime service account may replace it if the Phase 3
  checklist documents the mapping and does not broaden permissions.
- The bootstrap checklist may bind the baseline role list with one explicit
  single-line loop, followed immediately by an IAM-policy verification step.
- Keep the Cloud Run container minimal. The Next.js Dockerfile should use a
  multi-stage build, while retaining only the runtime files required by the
  service.

## C. Scheduling and reminder guardrails

### Primary path

Cloud Tasks remains the primary scheduler. Each confirmed future intervention
creates a one-time task that reaches the authenticated Cloud Run callback.

### Plan B

If real Cloud Tasks integration is blocked, the approved downgrade is:

```text
Cloud Scheduler tick
→ Cloud Run tick endpoint
→ Firestore query for status == pending and fireAt <= now
→ reserve delivery idempotently
→ deliver
→ mark fired
```

The activation and disclosure rules for this downgrade are recorded in
Decision 0003. Plan B preserves a working reminder loop but does not constitute
proof that the Cloud Tasks acceptance path passed.

### Idempotency window

Do not use the unsafe order "deliver, then first mark state". A successful
delivery followed by a failed Firestore update would otherwise be sent again on
the next tick.

Use `interventionId` as the idempotency key. Before delivery, acquire or mark an
`in-flight` delivery reservation in a Firestore transaction. Only the holder of
that reservation may send. After delivery, transition the reservation to the
fired state. Phase 3 must test the retry window explicitly.

## Phase-gated on-demand index

The paths below are bookmarks, not required reading now. Their common root is
the private local reference-assets workspace (path redacted from the public log).

| Phase | Read only when this problem is active | Indexed reference |
| --- | --- | --- |
| 3 | Creating the GCP bootstrap checklist | `阿寶情報站V3整合版\P0-gcp-bootstrap.md` |
| 3 | Designing the minimal Cloud Run image | `阿寶情報站V3整合版\aibao-v3\Dockerfile` |
| 3 | Implementing the Firestore adapter | `阿寶情報站V3整合版\aibao-v3\src\firestore.js` |
| 3 | Implementing or diagnosing Scheduler Plan B | `阿寶情報站V3整合版\aibao-v3\src\jobs\reminder_tick.js` |
| 3 | Implementing the tick or callback HTTP endpoint | `阿寶情報站V3整合版\aibao-v3\src\server.js` |
| 5 | Implementing the TTS provider adapter | `小寶助理\tts.py` |
| 5 | Implementing the voice-input provider adapter | `小寶助理\voice_input.py` |
| 5 | Implementing natural-language reminder parsing | `小寶助理\reminders.py` |

No indexed old-project file was opened while creating this decision. The
distillation brief alone supplied these rules and bookmarks.

## Consequences

- Phase 3 exposes infrastructure risk without importing legacy implementation
  debt.
- Phase 5 can reuse proven voice-pipeline lessons only when the corresponding
  adapter is actually being built.
- Cost controls and token accounting are architecture requirements, not demo
  cleanup tasks.
- The repository remains standalone and auditable.
