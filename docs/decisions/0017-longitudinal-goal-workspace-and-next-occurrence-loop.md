# Decision 0017 — Longitudinal goal workspace and next-occurrence loop

- Status: Accepted
- Date: 2026-07-20

## Context

The accepted private loop can create a real plan, schedule one check-in, run
GPT-5.6, persist memory, and create a decision-proposed follow-up. It does not
yet give the user a cloud-backed list of goals, restore an unconfirmed draft,
show attendance, or continue a recurring goal until its end date. A rendered
thirty-day Demo Lab cannot substitute for this product responsibility.

## Decision

1. A confirmed goal becomes a stable-owner Firestore workspace. The expiring
   phone session authorizes access but does not own the data, so re-pairing does
   not orphan a thirty-day goal. Browser storage is a recoverable draft and
   cache, not the authoritative record.
2. Every workspace has a stable `goalId`. Plan revisions, attendance,
   check-ins, Episodes, strategies, and tasks remain goal-scoped.
3. A schedule policy can contain one or more local-time slots. This supports
   goals such as three one-minute bridge sessions per day without creating
   three unrelated goals.
4. The backend maintains only the next effective occurrence. After a confirmed
   outcome or terminal timeout, it records attendance and materializes the next
   occurrence. It does not pre-create thirty days of Cloud Tasks.
5. A target end time is a hard fence. Completed, paused, archived, or deleted
   goals cannot create another occurrence.
6. Delete invalidates the active check-in/task and writes a content-free
   tombstone so a late callback becomes a safe no-op instead of a ghost alert.
7. Attendance stores structured outcomes and evidence kinds, never raw replies,
   voice, or images.
8. Assumption decisions and user corrections produce immutable plan revisions.
   GPT-5.6 must recompute the plan; a local text mutation is not a revision.
9. Stable V1 traffic remains frozen until the isolated preview passes local,
   cloud, and physical-phone acceptance.

## Product boundary

The scheduler owns time and reliable wake-up. GPT-5.6 owns interpretation,
replanning, recovery, and the next useful commitment. Firestore owns durable
state. The PWA owns visible goals, consent, attendance, and user confirmation.

## Acceptance

- Save two goals, close the PWA, reopen it, and recover both from Firestore.
- A correction visibly changes a structured GPT-5.6 plan revision.
- One real occurrence reaches the phone, accepts evidence, records attendance,
  curates memory, and creates exactly one next occurrence.
- Pausing or deleting one goal stops its reminders without affecting another.
- Repeated requests and late callbacks remain idempotent.
