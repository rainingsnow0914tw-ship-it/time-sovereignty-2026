# Decision 0019 — Structured multi-session cadence

- Status: Accepted
- Date: 2026-07-20

## Context

The product supports one to eight daily check-in slots, but the Goal Architect
contract could only express a single `preferredCheckInTime`. The onboarding
screen bridged that gap by scanning the plan's prose for `HH:MM` strings and
promoting whatever it found into real sessions.

Measured against seven real stored plans, that inference only ever matched
inside `assumptionsNeedingConfirmation` (4 of 7). `cadence.rationale`,
`cadence.completionSignal`, and `initialCheckInProposal.rationale` produced
zero matches. The bridge was therefore not delivering the feature it was built
for; it was converting incidental remarks — "assuming your day starts at
09:00" — into scheduled sessions the user never chose. Chloe hit this on a real
phone as an unexplained `Session 2 · 09:00`, and again as three sessions on a
later goal.

`e13e52f` narrowed the scan to rhythm-describing fields, which stopped the
false sessions but left the real gap: a goal that genuinely happens three times
a day still had no way to say so.

## Decision

1. `GoalCadenceSchema` gains `additionalCheckInTimes`: up to seven further
   local `HH:MM` values, validated to be distinct and to exclude
   `preferredCheckInTime`.
2. The field is `.nullable().optional()`, not `.optional()` alone. The Responses
   structured-output API rejects an optional field that is not also nullable
   ("all fields must be required"), and this combination satisfies that rule
   while keeping every plan stored before this decision readable.
3. The Goal Architect instructions now ask the model to list the remaining
   local times when a goal truly happens several times a day, to omit the field
   for a single daily check-in, and never to repeat the preferred time inside
   it. The same instruction applies to plan revisions.
4. `suggestedScheduleTimes` prefers the structured field when present. The
   narrowed prose scan remains only as a fallback for plans created before this
   change.
5. `suggestedScheduleTimes` moves from the onboarding component file into
   `features/onboarding/model.ts` so the behaviour is directly testable.

## Consequences

- A three-times-a-day goal can now be expressed by the model rather than
  guessed from its writing.
- Incidental times in narrative fields can no longer become sessions, because
  a plan that states its sessions structurally never reaches the scan at all.
- Plans written before this decision keep working unchanged through the
  fallback path.
- Regression coverage in `model.test.ts`: structured sessions win; a time
  mentioned only inside an assumption is ignored; sessions stated in the rhythm
  fields are still honoured.
- Full suite after the change: 46 files passed / 6 skipped, 178 tests passed /
  10 skipped; lint, typecheck, and production build clean.

## Not decided here

- Whether the model should be told about the interface's capability limits in
  general. It currently writes plans instructing the user to "record 1/5, 2/5"
  when no such control exists. Recorded under the living-plan product direction
  in `docs/PROJECT_STATE.md`; deliberately not patched, because the intended
  resolution is to build the control rather than to silence the model.
