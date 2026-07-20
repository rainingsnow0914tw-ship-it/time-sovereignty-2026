# Decision 0018 — First-occurrence authority and shared schedule arithmetic

- Status: Accepted
- Date: 2026-07-20

## Context

Phase 6 group C acceptance created a second live goal on a real phone. The user
edited the check-in time from the architect's proposed `21:00` to `11:30`,
confirmed, and saved. The saved support agreement and the schedule slots both
recorded `11:30`, but the first Cloud Task was scheduled for
`2026-07-20T05:00:00Z`, which is `13:00` in `Asia/Macau` — the instant the plan
had proposed, not the time the user chose.

`createInitialGoalWorkspace` copied `plan.initialCheckInProposal.scheduledFor`
into both `schedule.nextOccurrenceAt` and `action.nextCheckAt`. Only the second
occurrence onwards went through `nextGoalOccurrence`, which derives the time
from the user's slots. The earlier water-goal run did not expose this because
that user had not edited the proposed time, so the two values coincided.

This contradicts the product's central claim. A Chief of Staff that silently
overrides the one scheduling decision the user just made is not protecting
their sovereignty, and the failure is invisible: the UI shows the chosen time
while the backend acts on a different one.

Decision 0016 freezes the accepted private core except for a verified safety,
data-loss, build, or acceptance blocker. This qualified on two counts: it is a
correctness defect in the user-facing contract, and it blocked group C
acceptance, which cannot observe an isolated check-in that does not arrive when
the tester scheduled it.

## Decision

1. The user's confirmed slots are the sole authority for the first occurrence,
   exactly as they already are for every later one. `createInitialGoalWorkspace`
   derives `schedule.nextOccurrenceAt` and `action.nextCheckAt` from
   `nextGoalOccurrence` over the saved slots, honouring timezone, quiet hours,
   allowed weekdays, and the goal window.
2. The architect's `initialCheckInProposal.scheduledFor` is demoted to a
   fallback, used only when no valid slot occurrence exists — for example when
   every remaining slot today falls outside the goal window. It remains a
   proposal, never an override.
3. Schedule arithmetic moves to `src/live-checkin/goal-schedule.ts` as pure
   functions with no Firestore, Cloud Tasks, or scheduler dependency. Both
   `goal-loop.ts` and `goal-workspace.ts` import the same implementation, so the
   first and subsequent occurrences cannot drift apart again.

## Consequences

- A goal saved with an edited time now fires when the user said it would.
- `goal-loop.ts` no longer owns the arithmetic and re-derives nothing; the
  extraction removed the possibility of a second, divergent implementation
  being added under time pressure.
- `nextGoalOccurrence` is now imported from `goal-schedule` by
  `goal-loop.test.ts`. Mocking `goal-loop` for route tests no longer erases the
  calculation, which is what surfaced the coupling in the first place.
- Regression covered by `goal-workspace.test.ts`: a goal whose slot is `11:30`
  must schedule its first check-in at `11:30` local time and must not equal the
  plan's proposed instant.
- Full suite after the change: 46 files passed / 6 skipped, 164 tests passed /
  10 skipped; lint, typecheck, and production build clean.

## Not decided here

- The architect contract still exposes a single `preferredCheckInTime`, so a
  multi-slot goal cannot be expressed structurally by the model. The UI bridges
  this by scanning the plan's free text for clock strings, which also scrapes
  incidental times out of `assumptionsNeedingConfirmation` and presents them as
  real sessions. Recorded as a known gap; deliberately not changed during the
  freeze.
- Whether a completed one-off sprint should transition its workspace out of
  `ACTIVE` automatically remains open.
