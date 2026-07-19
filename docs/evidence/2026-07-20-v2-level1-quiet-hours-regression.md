# V2 Level 1 quiet-hours regression

- Time: 2026-07-20 00:03 +08:00
- Scope: deterministic pre-delivery safety guard only
- Cloud deployment: not part of this evidence checkpoint
- Stable V1 traffic: unchanged

## Finding

The deployed catch-loop design re-evaluated the quiet-hours fence before Levels
2 and 4, but the first native delivery entered the delivery path before that
guard. At 00:00 local time with a `22:30–08:00` agreement, a test could
therefore have sent Level 1 and only stopped the later escalation.

## Correction

Every requested delivery level now evaluates the same deterministic stop
conditions before claiming a receipt or sending FCM. Higher levels retain the
strict expected-transition check, and Level 4 retains the separate full-screen
consent requirement.

## Verification

- `npm test -- src/catch-v2`: 9 files, 40 tests passed.
- `npm test`: 42 files passed, 5 skipped; 167 tests passed, 9 skipped.
- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm run build`: passed, including the catch-v2 task and protected native
  response routes.

No live OpenAI call was needed because the changed boundary is deterministic
scheduling safety, not an Agent contract.
