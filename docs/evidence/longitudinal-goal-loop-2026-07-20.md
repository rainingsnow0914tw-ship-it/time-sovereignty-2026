# Longitudinal Goal Loop Evidence — 2026-07-20

## Boundary

This checkpoint is local and deterministic. It does not claim a cloud or
physical-phone acceptance result. The submitted V1 baseline and stable Cloud
Run traffic were not changed.

## Verified behaviors

- One active goal materializes only its next Cloud Task, not thirty days of
  speculative jobs.
- Daily multi-slot cadence advances in the goal timezone and respects quiet
  hours.
- A schema-valid GPT follow-up time may select the next occurrence when it is
  valid; otherwise the deterministic schedule provides the safe fallback.
- Confirming a decision writes one idempotent, structured attendance record and
  advances only the matching `goalId`.
- New check-ins and memory use a stable owner so a replacement device pairing
  can continue the same goal.
- Goal memories are isolated by durable `goalId`, including for goals with
  similar human-readable titles.
- Mobile goal detail displays recent structured attendance without persisting
  raw replies, audio, or image content.

## Automated result

- Test files: 44 passed, 6 skipped
- Tests: 158 passed, 10 skipped
- ESLint: passed
- TypeScript: passed
- Production build: passed
- `git diff --check`: passed

## Next evidence gate

Deploy this branch as a tag-only Cloud Run preview with zero stable traffic,
then complete one physical-phone loop: save, reopen, receive, reply, real
GPT-5.6 decision, confirm, attendance write, and next-task pointer.
