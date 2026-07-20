# Phase 6 real-phone goal loop acceptance — 2026-07-20

Device `SM_S9380` (S25, transport `R5CY12Y90ZF`), installed WebAPK PWA,
private tag-only preview. Stable production traffic stayed on
`time-sovereignty-00024-dih` at 100% for the whole session.

## Blocker found and fixed during acceptance

`GET /api/live/check-ins/current` returned `400` at 10:06:38 +08:00 on
`00056-gap`, and the phone rendered "受保護的連線暫時無法使用。" for the whole
Today / Check-in / Developer region.

Diagnosis, in order:

1. `liveErrorResponse` only maps `ZodError` / `SyntaxError` to `400`, so the
   failure was schema validation, not auth, origin, or state.
2. Read-only sampling of the real database through the Firestore REST API
   (1 `live_device_sessions` document, 20 `live_checkins` documents) found no
   unexpected and no unrecoverable missing fields. Replaying every sampled
   document through `LiveDeviceSessionSchema` and `LiveCheckInDocumentSchema`
   passed, which ruled out stored-document corruption.
3. The remaining validation in that route is `clientCheckIn`, which parses
   `{ ...checkIn, traces }` through `ClientLiveCheckInSchema`. That projection
   capped `traces` at `max(3)` while the document layer already allowed
   `traceRunIds` at `max(4)`.
4. `live-1784499276418-0d6572b0` (the session's `lastConfirmedCheckInId`) and
   `live-1784477994742-2dd18d80` each carry 4 trace run IDs, because a
   goal-led check-in adds the Goal Architect run to the three-step recovery
   trace. A single such document therefore failed the whole read.

Fix: align the client projection to `max(4)` and cover it with a regression
test that projects a four-trace goal-led check-in. Checkpoint `4522757`;
46 test files passed / 6 skipped, 163 tests passed / 10 skipped, lint,
typecheck, and production build clean.

Not fixed, recorded instead: `findCurrent` (activeCheckInId branch) and
`findById` in `firestore-repository.ts` use `.parse()`, so one bad document
fails an entire read, while the fallback scan in the same file already uses
`.safeParse()`. Decision 0016 keeps the frozen core to blocker-only changes,
and this resilience gap did not block acceptance once the cap was aligned.

## Deployment

`gcloud run deploy ... --no-traffic --tag=live-mobile` created
`time-sovereignty-00058-mem`, then `update-traffic --update-tags
v2-private=time-sovereignty-00058-mem` pointed both private doors at the same
revision so the PWA and the Cloud Tasks callback cannot straddle two versions.

Configuration parity against the pre-deploy baseline: 22 environment
variables, 3 Secret Manager references (`openai-api-key`,
`live-checkin-pairing-secret`, `live-checkin-session-secret`), service account
`time-sovereignty-v2-runtime@time-sovereignty-2026.iam.gserviceaccount.com`,
512Mi, `minScale=1`. All unchanged.

Same phone, same cookie, same endpoint:

- 10:06:38 — `400` on `00056-gap`
- 10:22:17 — `200` on `00058-mem`
- 10:22:22 — `200` on `00058-mem`

## Group B — real loop acceptance

Goal `goal-1683dbc3-237f-4d24-958b-346a022315a9`, a one-off five-minute
sprint ("今天在 5 分鐘內喝完一杯水，並於完成後用文字回報").

1. `09:39:45` — `[live-check-in] task delivered { checkInId:
   'goal-e8e7f665…', duplicate: false, status: 'PENDING' }`. Real Cloud Task,
   real delivery, no duplicate.
2. Chloe replied in text on the phone that she had finished the water.
3. `10:25:16` — `[live-check-in] agents completed { checkInId:
   'goal-e8e7f665…', assessment: 'COMPLETED', dispatchedAgents: [],
   providers: ['openai'], models: ['gpt-5.6-sol'], totalTokens: 1224,
   retrievedMemoryCount: 0 }`. Live GPT-5.6, not mock. Commitment Recovery was
   correctly not dispatched for a completed sprint.
4. Chloe confirmed the decision on the phone; the UI reported 決策、記憶與
   跟進狀態已保存.
5. Firestore `live_goal_workspaces/goal-1683dbc3…/attendance` contains exactly
   one document: `status: COMPLETED`, `scheduledFor:
   2026-07-20T01:39:45.938Z`, `recordedAt: 2026-07-20T02:29:00.732Z`,
   `checkInId: goal-e8e7f665…`.
6. The phone's Open-goal panel renders `Check-in times 09:39 · 09:34`,
   `Attendance 1 recorded`, `Plan brain gpt-5.6-sol`, and an ATTENDANCE entry
   reading 已完成 · 7月20日 10:29 with the model's specific feedback quoting the
   user's own report.
7. `gcloud tasks list --queue=time-sovereignty-checkins` returned
   `Listed 0 items.` The one-off sprint scheduled no follow-up, matching the
   plan's stated 不需要安排下次報到.

Group B is accepted: schedule → real delivery → user report → live GPT-5.6
decision → human confirmation → structured attendance → correct absence of a
next occurrence.

## Not yet accepted

- Group A was only observed indirectly. Cloud goal save, list, and cross-reload
  persistence all returned `200` and the goal survived a full PWA reload, but a
  deliberate close-and-reopen run was not recorded separately.
- Group C (multi-goal isolation) has not been run. It still needs two
  concurrent goals, proof that one goal's report cannot cite the other's
  progress, pause-one-continue-other, and no notification after delete.
- The workspace stayed `ACTIVE` after the one-off sprint completed, and
  `nextCheckInId` still references the finished check-in. Completion is
  currently a manual `Complete` action by the user. This is unconfirmed as
  intent versus gap; it did not block the loop.
- Background delivery while the PWA is closed remains unclaimed, unchanged
  from earlier phases.

## Attribution

Codex ran out of quota at 09:28 +08:00 after committing `5bfd599`, before
anyone pressed the button it was waiting on. The 09:34 and 09:39 evidence in
this document was recovered from Cloud Run logs after the fact; the fix,
deployment, and remaining acceptance in this document were carried out in a
follow-on session.
