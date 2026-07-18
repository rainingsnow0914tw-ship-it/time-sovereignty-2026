# Decision 0015 — Memory, Progress Witness, and Self-Belief Loop

Date: 2026-07-19
Status: Approved

## Decision

The private real-phone journey will use a layered memory loop:

`retrieve → inject → decide → save Episode → curate memory → retrieve again`

Episodes are immutable evidence records. Derived memories are separate records and are scoped either to the user or to the current goal. A confirmed commitment is not automatically a confirmed durable belief about the user.

The user-facing success loop is named the **Progress Witness and Self-Belief Loop**. It gives concrete, evidence-based recognition and may ask a reflection question, but one successful episode must remain limited evidence rather than become a permanent truth.

## Persistence boundary

- Episode events may be saved automatically after a real decision is confirmed.
- Resume points and operational follow-ups save immediately with the confirmed commitment.
- A tentative Strategy Card may be derived from observed behavior and used later only as limited evidence.
- Durable conclusions about the user require an explicit disposition: `符合我`, `不太對`, or `不要記住`.
- Temporary health or emotional state must have an expiry or recheck date.
- Personal memory and external research remain separate. ResearchProvider stays available, but Web Search is conditional and cannot delay the memory acceptance test or submission.

## Agent timing

Chief of Staff returns the user-facing decision first. Memory Curator runs after that response, normally during confirmation, so curation does not delay the first useful mobile answer. Failure to curate must not roll back the confirmed operational commitment.

## Required acceptance test

1. A first real phone task saves an immutable Episode and a tentative Strategy Card.
2. A later real phone check-in retrieves the relevant card and injects it into GPT-5.6.
3. GPT-5.6 explicitly treats it as limited evidence and changes the intervention accordingly.
4. Confirming the second outcome updates the card's effectiveness and confidence without overgeneralizing.
5. Developer mode exposes safe memory IDs and the Memory Curator trace, never raw replies, photos, secrets, or private reasoning.

## Goal revision boundary

Recalibrate the current goal before changing the North Star. A change such as Japanese to French is normally a Goal Revision; a deeper North Star such as independent international living may remain intact.

## Submission boundary

After the acceptance test passes, freeze core product code and prioritize simplified Demo Lab, demo script, video, README, and Devpost. Public Guest Lane and Web Search remain conditional on remaining time.
