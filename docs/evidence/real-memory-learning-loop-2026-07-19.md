# Real memory learning-loop Android acceptance

- Date: 2026-07-19
- Environment: protected `live-mobile` Cloud Run tag, `asia-east1`
- Acceptance revision: `time-sovereignty-00036-qov`
- Stable boundary: `time-sovereignty-00024-dih` remained at 100% normal traffic

## Acceptance result

The required two-check-in memory test passed on a physical Android PWA with
real Cloud Tasks, Firestore, GPT-5.6, and the post-response Memory Curator.

1. The first same-goal check-in (`live-1784400518422-cdbd6850`) received a
   real phone reply and returned `PARTIAL`. No prior memory was retrieved.
2. Chloe confirmed the decision while leaving the optional durable-memory
   choice at `DEFER`. Confirmation saved one immutable Episode, one operational
   Resume record, and one tentative goal-scoped Strategy Card. The Strategy
   began at confidence `0.35`.
3. The product created the later follow-up
   (`follow-live-1784400518422-cdbd6850`) and its correctly authenticated Cloud
   Task. The existing task was deliberately accelerated with `gcloud tasks
   run`; its original body, URL, OIDC identity, and task identity were retained.
4. The second real phone reply returned `COMPLETED` and retrieved exactly one
   relevant Strategy Card. GPT-5.6 treated the earlier observation as limited
   evidence, used it to recognize a potentially helpful continuous-line/start
   pattern, and explicitly avoided presenting it as a settled truth.
5. Confirming the second result saved a second immutable Episode and completed
   the second Memory Curator run. The first Strategy Card remained `TENTATIVE`;
   confidence changed from `0.35` to `0.47`, with effectiveness counters
   `attempts=1`, `successes=1`, `partials=0`, and `blocked=0`.
6. Developer mode on the physical phone displayed the real returned model,
   Memory Curator trace, and one safe retrieved-memory ID. It did not expose a
   raw reply, photo, secret, prompt, or private reasoning.

## Safe Agent evidence

| Check-in | Agent | Returned model | Schema | Total tokens |
| --- | --- | --- | --- | ---: |
| First | `CHIEF_OF_STAFF` | `gpt-5.6-sol` | `LiveChiefOfStaffDecision` | 1,352 |
| First | `MEMORY_CURATOR` | `gpt-5.6-sol` | `MemoryCuratorOutput` | 986 |
| Second | `CHIEF_OF_STAFF` | `gpt-5.6-sol` | `LiveChiefOfStaffDecision` | 1,569 |
| Second | `MEMORY_CURATOR` | `gpt-5.6-sol` | `MemoryCuratorOutput` | 1,540 |

- Total across the two user-facing decisions and two post-response curation
  calls: 5,447 tokens.
- SDK retries: zero.
- Commitment Recovery correctly did not run for these non-blocked reports.
- External research and Web Search were not needed or invoked.

## Privacy and persistence boundary

- `live_episodes` contains immutable structured event evidence, not raw reply
  text or media.
- `live_memories` separates operational Resume state from the tentative
  Strategy Card and keeps the Strategy goal-scoped.
- Durable-memory approval was not forced after either interaction; both tests
  safely used `DEFER`.
- The second decision stored only safe retrieved record IDs on the developer
  projection.
- No API key, pairing secret, session secret, access token, raw photo, or raw
  reply is included in this evidence or the repository.

## Cloud snapshot after acceptance

- Preview revision `time-sovereignty-00036-qov`: Ready, tag `live-mobile`, 0%
  normal traffic, health HTTP 200, configured model `gpt-5.6`.
- Stable revision `time-sovereignty-00024-dih`: 100% normal traffic.
- Cloud Run: `minScale=1`, `maxScale=1`, concurrency `1`, dedicated runtime
  service account.
- Secrets remain Secret Manager references for `OPENAI_API_KEY`, pairing, and
  session signing; their values were not inspected or printed.
- Cloud Tasks queue `time-sovereignty-checkins`: `RUNNING`, one dispatch per
  second, one concurrent dispatch, `maxAttempts=1`, and zero queued tasks after
  acceptance.

## Operational repairs during the first acceptance setup

The first phone run exposed four test-harness and administrative mistakes; none
were hidden as product success:

- Android UI automation did not reliably edit the numeric duration field, so
  the initial task was scheduled later than intended.
- Deleting and recreating the same Cloud Tasks ID hit the expected task-name
  tombstone (`ALREADY_EXISTS`). A new task identity was used.
- A manual Firestore REST repair initially wrote `updatedAt` as a Firestore
  timestamp while the application contract uses an ISO string. It was changed
  back to the application type.
- One manually created replacement task omitted the JSON callback body and
  returned 400. The final replacement used the exact callback body, URL, OIDC
  audience, and task service account.

No GPT-5.6 call occurred during those repairs. The second check-in was created
by the application itself and used its real authenticated task; only its due
time was accelerated for acceptance.

## Final local verification

- Test files: 31 passed, 5 deliberately skipped live-only files.
- Tests: 123 passed, 9 skipped.
- ESLint: passed.
- TypeScript: passed.
- Production build: passed.
- `git diff --check`: passed.
