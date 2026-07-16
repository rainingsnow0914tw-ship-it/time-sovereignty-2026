# Decision 0008: Time-pressure integrated build and UI cuts

- Date: 2026-07-17
- Status: Accepted
- Decision owner: Chloe
- Implementer: Codex

## Context

After more than four hours of Build Week implementation, Chloe changed the
execution method. Phase 5 through Phase 8 should be implemented as one local
integration pass without separate phase-by-phase acceptance pauses. The
integrated product will then move to Cloud Run for live debugging and
deployment acceptance.

This changes the verification cadence, not the product's non-cuttable proof.

## Decision

1. Implement Phase 5–8 as one longitudinal command-center surface, backed by
   one validated local journey state and repository.
2. Defer separate local acceptance runs until the integrated code is complete.
   Perform one compilation checkpoint before cloud activation, then do real
   behavior acceptance in the deployed environment.
3. Preserve all non-cuttable features: Accelerated Simulation, both state
   machines, all four Agents, real Cloud Tasks, and safe Agent Run Trace.
4. Activate the first Decision 0003 cut: progress sharing supports text,
   photo, and voice. Video and generic file upload remain outside the
   competition surface, while the evidence schema keeps an explicit format
   boundary.
5. Activate the second cut: omit a dedicated Memory Review screen. Preserve
   structured memories, source labels, confirmation state, retrieval in the
   Journey, and repository boundaries.
6. Activate the third cut: intervention effectiveness uses a compact 1–5
   rating control. Preserve the persisted rating, sentiment, note, and event.

## Acceptance criteria retained

- Criterion 15 remains satisfied by text, photo, and voice progress.
- Criteria 17–20 remain represented by stored feedback, retrieved memory,
  resume point, and effectiveness record.
- Criteria 22–24 remain represented by a clearly labeled 30-day simulation,
  Journey timeline, and safe developer trace.
- Criterion 25 remains gated on the already verified GPT-5.6 provider and the
  forthcoming Cloud Run live switch.

## Restoration conditions

Video/file progress formats and the dedicated Memory Review interface may be
restored after the competition acceptance path, cloud live switch, demo script,
and submission package are stable. The compact rating may be expanded when
interaction research supplies a stronger scale.
