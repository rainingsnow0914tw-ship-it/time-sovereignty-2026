# Decision 0014: Real focus loop and ephemeral photo boundary

- Date: 2026-07-18
- Status: Accepted
- Decision owner: Chloe
- Implementer: Codex

## Context

The private product could prove Cloud Tasks with a 15-second engineering
control, but a real user who had confirmed a short goal still reached a blank
check-in screen. The product had not turned the approved next action into a
clear work-block start, and photo reporting appeared only after a pending
check-in without explaining that sequence. A completed live photo report also
exposed ambiguous model wording that could imply the application retained the
photo even though the media was never written to Firestore.

## Decision

1. The private real journey presents a user-owned work-block duration and a
   single **Start and schedule check-in** action. That action creates the real
   Cloud Task for the end of the selected block.
2. The text, voice, and photo report form appears when the Cloud Task moves the
   check-in to `PENDING`. The UI states this sequence before the user starts.
3. The 15-second Cloud Tasks control is infrastructure acceptance only and
   remains inside Developer mode.
4. A plan time that expired during setup is never silently moved to tomorrow.
   Starting the work block creates a fresh real schedule and removes an
   obsolete absolute target boundary when necessary.
5. The top summary derives its live status from the protected check-in record:
   scheduled, report ready, reviewing, awaiting confirmation, completed, or no
   follow-up. It does not continue displaying the stale onboarding proposal.
6. Progress photos are ephemeral model input. They are compressed on-device,
   sent only with the deliberate reply, omitted from Firestore and safe traces,
   and cleared from the client after submission.
7. Chief of Staff prompts must not say or imply that the application saves,
   keeps, archives, attaches, records, or otherwise persists a photo. The
   decision UI independently states the persistence boundary so privacy does
   not depend on model wording.
8. A completed sprint may end with `nextFollowUpAt = null`; confirmation must
   not invent a recurring or thirty-day journey.

## Consequences

- The first real action now has an understandable beginning, timed return,
  multimodal report, model judgment, confirmation, memory, and truthful ending.
- Developer evidence remains available without leaking an engineering control
  into the product flow.
- Existing confirmed records remain immutable evidence. If an older decision
  contains ambiguous photo language, the UI clarifies that only the structured
  outcome, safe trace, memory proposal, and follow-up state were saved.
