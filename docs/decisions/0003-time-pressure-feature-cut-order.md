# Decision 0003: Time-pressure feature-cut order

- Status: Accepted
- Date: 2026-07-16
- Decision owner: Chloe
- Implementer: Codex

## Context

Build Week time pressure must not cause unrecorded scope drift or remove the
features that prove the product's core claim. Cuts are allowed only in a known
order and must preserve the acceptance path.

## Decision

### First cut — progress-sharing formats beyond the required three

Cut video and generic file upload before cutting any required progress path.
Preserve:

- text;
- photo;
- voice.

These three formats satisfy acceptance criterion 15. The progress evidence
contract should remain extensible so video and files can return later without
changing the domain model.

### Second cut — Memory Review UI

The dedicated confirm, correct, and delete screen may be removed from the demo
surface. Preserve:

- the structured memory records;
- Memory Curator behavior;
- memory retrieval in the next interaction;
- correction and deletion boundaries in the domain and repository interfaces.

This is a UI cut, not permission to remove durable memory or its safety
controls.

### Third cut — intervention rating UI simplification

The intervention-effectiveness rating interface may be reduced to a minimal
control. Preserve the underlying rating field, persistence event, and ability
to show that acceptance criterion 20 is satisfied.

## Features that may not be cut

- Accelerated Simulation;
- both state machines: action lifecycle and intervention lifecycle;
- all four real agents: Chief of Staff, Goal Architect, Commitment Recovery,
  and Memory Curator;
- a real Cloud Tasks trigger reaching the deployed callback;
- agent trace.

These features form the proof that the product is a longitudinal, adaptive
Chief of Staff rather than a chat mockup.

## Plan B — Cloud Scheduler polling downgrade

Cloud Tasks remains the required primary path and may not be silently replaced.
If its real callback integration is blocked after a documented Phase 3 attempt,
the operational downgrade is a Cloud Scheduler polling tick:

```text
Cloud Scheduler tick
→ query Firestore for status == pending and fireAt <= now
→ reserve by interventionId in a transaction
→ deliver
→ mark fired
```

Plan B activation requires a new decision-log entry under the cut-log rules
below. That entry must include the concrete Cloud Tasks blocker and evidence,
the time limit that triggered the downgrade, and the condition for restoring
Cloud Tasks.

The polling path must reserve delivery as `in-flight` before sending. This
closes the known duplicate-delivery window where delivery succeeds but the
subsequent Firestore update fails.

Plan B keeps the product demonstrable, but it does not satisfy or replace the
non-cuttable evidence requirement for a real Cloud Tasks trigger. While Plan B
is active, Cloud Tasks must be reported as unresolved rather than simulated or
claimed complete.

## Required cut log

Every actual cut requires a new accepted decision record in `docs/decisions/`
before or alongside the code change. Each record must include:

1. the time-pressure trigger;
2. the exact scope removed or simplified;
3. the interfaces and data retained;
4. the affected acceptance criteria and how they remain satisfied;
5. the condition for restoring the feature.

Silently omitting a feature does not count as an approved cut.
