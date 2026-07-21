# V2 native return-to-PWA repair

Date: 2026-07-20 (Asia/Shanghai)

## Observed defect

- The native decision screen labeled its final action as returning to the PWA,
  but the button only closed `IncomingCheckInActivity`.
- A generic HTTPS launch on the S25 selected Samsung Internet. That browser did
  not own the Chrome PWA's `profile=play` journey storage, so a successful
  browser launch alone was not sufficient evidence of a correct return.

## Correction

- Added an explicit private PWA base URL to the Android build configuration.
- Added a deterministic URL builder that accepts only a credential-free HTTPS
  origin on the default HTTPS port and always produces the exact root route
  `/?profile=play`. Stale paths, queries, and fragments are discarded.
- The native confirmation action now prefers the installed Chrome WebAPK,
  falls back to Chrome, and otherwise allows Android to choose an available
  browser. Invalid configuration or a missing browser produces a visible,
  non-crashing instruction on the button.
- The non-confirmation completion path remains a local close action.

## Verification

- Android unit tests: 5 tests, 0 failures, 0 errors, 0 skipped.
- Android tasks `:app:testDebugUnitTest :app:assembleDebug --no-daemon`:
  `BUILD SUCCESSFUL`.
- The rebuilt debug APK installed with `-r` on the intended S25 Ultra only:
  serial redacted, model `SM-S9380`, Android SDK 36. Existing app data and
  pairing state were preserved.
- Android resolved the exact private play-profile URL to the installed Chrome
  WebAPK package `org.chromium.webapk.a205e950c055f3aec_v2`; the foreground
  activity was Chrome's `SameTaskWebApkActivity`.
- Chloe physically confirmed both acceptance questions:
  1. The phone opened the original protected cup-sketch journey.
  2. The phone did not show the blank `你的北極星是什麼` onboarding flow.

## Boundaries

- No OpenAI API call was made for this navigation repair.
- No Cloud Run revision, backend, Firestore record, Cloud Task, or public V1
  traffic changed.
- No secret, raw reply, private media, or device credential was added to Git.
- The separate unattended full-screen wake, ring, and vibration regression is
  not fixed or accepted by this evidence. It remains the next diagnostic task.
