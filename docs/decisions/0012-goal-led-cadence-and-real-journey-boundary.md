# Decision 0012: Goal-led cadence and real journey boundary

- Date: 2026-07-18
- Status: Accepted
- Decision owner: Chloe
- Implementer: Codex

## Context

The original support form defaulted every goal to daily check-ins at 19:30 and
reviewed the agreement every seven days. The local simulation also presented a
30-day journey regardless of whether the user wanted to finish something that
night, complete a multi-week deliverable, or sustain an open-ended practice.
That behavior contradicted the product promise that support adapts to the real
goal rather than forcing the user into a generic productivity template.

## Decision

1. Goal Architect must classify each new goal as `SPRINT`, `PROJECT`, or
   `HABIT` through the same structured mock/live contract.
2. The structured plan must include a proposed target end time when one can be
   responsibly inferred, check-in frequency, preferred time, agreement review
   interval, rationale, and observable completion signal.
3. The support agreement is prefilled from the recommendation but remains
   editable and requires explicit user confirmation. Model output never
   overrides quiet hours, consent, or user changes.
4. Deterministic guards reject an initial or later follow-up that is not in the
   future, occurs after a known target end, or stretches beyond the maximum
   first-return window: 24 hours for a sprint, 72 hours for a habit, and seven
   days for a project.
5. The private real journey must never inherit the fixed 30-day simulation.
   Accelerated Simulation remains required competition evidence but will move
   into a separate Demo Lab with an explicitly scripted or generated story.
6. Existing browser records and Firestore goal-plan receipts are upgraded with
   a conservative editable cadence instead of being discarded.
7. Decision 0011's fixed two-Agent reply wording is superseded by the accepted
   conditional route: Chief triage always runs, Commitment Recovery runs only
   for `BLOCKED` or `GOAL_CHANGED`, and the final Chief synthesis runs only
   when Recovery was dispatched.

## Consequences

- A one-night Build Week goal receives milestone-led support inside its real
  deadline rather than a 30-day journey.
- A finite project receives milestone-scale follow-up, while a repeated habit
  receives sustainable recurring support.
- The model supplies judgment; deterministic code protects temporal validity;
  the user retains final authority.
