# V2 real Catch Loop confirmation and UI recovery evidence

Date: 2026-07-20 (Asia/Shanghai)

## Real physical acceptance

- A real Cloud Tasks event traversed Levels 1, 2, and 4. Each delivery was
  recorded once with the same stable idempotency identity.
- The S25 Ultra woke into the native full-screen check-in with bounded ringing
  and vibration. Chloe selected the `downgrade` response.
- The protected native response entered the real GPT-5.6 Chief of Staff and
  Commitment Recovery path. Safe traces recorded three completed GPT-5.6 runs,
  4,985 total tokens, and three retrieved memory items.
- The PWA displayed the structured `REDUCE` decision for review.
- After Chloe pressed the confirmation button, Firestore showed the original
  check-in as `CONFIRMED`, one immutable Episode, durable resume/goal/
  operational memory, and an attached Cloud Tasks follow-up scheduled for
  2026-07-20 21:14 local time.
- Cloud Run emitted no error-severity entry for the confirmation request.

No raw reply, prompt, image, credential, token, or private decision text is
included in this evidence file.

## Observed UX defect

The confirmation button flashed, but the phone remained on the pre-confirmation
card. The authoritative cloud state proved that persistence and scheduling had
already succeeded. The browser had lost or failed to apply the successful HTTP
response and had no read-after-write recovery path.

## Correction

- `refreshCurrent` now returns the authoritative current-state payload as well
  as updating UI state.
- If the confirmation response is interrupted, the PWA performs one read-only
  state refresh. It recognizes the expected check-in as confirmed whether it is
  still current or has become `lastConfirmedCheckIn` after the durable
  follow-up becomes current.
- A recovered confirmation is rendered as persisted and polling is paused, the
  same as the ordinary success path.
- The UI explicitly tells the user not to press again while confirmation cannot
  yet be verified. It does not repeat the POST, call GPT-5.6 again, or create a
  second task.

## Local verification

- Focused recovery tests: 3/3 passed.
- Full Vitest suite: 170 passed, 9 skipped.
- ESLint: passed.
- TypeScript: passed.
- Next.js production build: passed.
- `git diff --check`: passed before checkpoint.

## Private deployment verification

- Checkpoint: `02c9707` (`fix: recover confirmed mobile check-ins`).
- Revision `time-sovereignty-00046-woz` reported Ready and serves 0% normal
  traffic.
- Both `v2-private` and `live-mobile` tags point to revision `00046`.
- The stable public revision remains `time-sovereignty-00024-dih` at 100%.
- Dedicated runtime identity and container concurrency 1 were preserved.
- `v2-private` health returned HTTP 200.
- `live-mobile` health returned HTTP 200.
- The native session route without a device credential returned HTTP 401.
- Final S25 refreshed-screen confirmation remains the next physical check.

## Read-after-write contract defect found on S25

After refreshing revision `00046`, the visible PWA still showed the old
confirmation button. A masked Chrome DevTools check proved that the phone was
on the correct `live-mobile` URL and new revision, but
`/api/live/check-ins/current` returned HTTP 400.

A masked Firestore read then established:

- the active follow-up exists with status `SCHEDULED`;
- the prior check-in exists with status `CONFIRMED`;
- the confirmed check-in contains four safe Agent trace IDs;
- no private text, image, credential, or trace content was printed.

The persisted check-in schema already allowed four trace IDs: Chief triage,
Commitment Recovery, final Chief decision, and the post-response Memory
Curator. The client response schema still allowed only three trace objects.
Serializing `lastConfirmedCheckIn` therefore raised a Zod error and the current
route returned 400 even though persistence was correct.

The client contract now allows four safe traces. Its regression test reproduces
the confirmed four-Agent shape. Targeted tests passed 9/9; the full suite again
passed 170 tests with 9 live-only skips, followed by ESLint, TypeScript, and the
Next.js production build.
