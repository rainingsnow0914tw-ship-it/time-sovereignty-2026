# V2 Level 1 quiet-hours regression

- Time: 2026-07-20 00:03 +08:00
- Scope: deterministic pre-delivery safety guard only
- Cloud deployment: private tag-only revision `time-sovereignty-00044-lel`
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

## Private deployment verification

- Revision `time-sovereignty-00044-lel` reported Ready.
- Runtime identity remained the dedicated V2 service account.
- The explicit acceptance interval remained 15 seconds.
- `v2-private` and `live-mobile` both point to `00044`.
- Both private health checks returned HTTP 200.
- Native session without a credential returned HTTP 401.
- Stable public traffic remained 100% on `time-sovereignty-00024-dih`.
