# V2 Android full-screen access and local wake acceptance

Date: 2026-07-20 (Asia/Shanghai)

## Why this check was needed

The later real follow-up recorded successful Cloud Tasks and FCM provider
receipts, but the physical S25 did not automatically open the full-screen call,
ring, or vibrate. A provider receipt was therefore not treated as device UI
acceptance.

Android inspection showed all of the following at the start of this repair:

- only the intended S25 was attached: `R5CY12Y90ZF`, `SM-S9380`, SDK 36;
- notification permission was granted;
- the manifest declared `USE_FULL_SCREEN_INTENT`, `VIBRATE`, and `WAKE_LOCK`;
- the full-screen AppOp was at its default state and contained a recent reject
  timestamp;
- the app did not expose `NotificationManager.canUseFullScreenIntent()` state or
  a user-facing route to the Android special-access page.

The AppOp reject timestamp is not claimed as the sole root cause. The later
accepted local call still left the AppOp at `default` with a reject timestamp,
so that diagnostic alone is not sufficient to explain Samsung SystemUI
behavior.

## Product correction

- Android 14+ now checks `NotificationManager.canUseFullScreenIntent()`.
- The private native home explains the exact consequence when access is
  missing: ordinary notifications can arrive, but the lock screen will not
  automatically open.
- A visible, user-initiated button opens
  `ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT` for the current package. Codex/ADB
  does not silently grant this special access.
- Level 4 keeps its ongoing call notification but attaches a full-screen intent
  only when the system API reports that access is available.
- A debug-build-only receiver protected by the shell-only `DUMP` permission can
  post one fixed local Level 4 notification. It accepts no user data, calls no
  backend, and is absent from release builds. This provides a deterministic
  physical regression test without GPT-5.6 or FCM cost.

This follows the Android 14 guidance to check
`canUseFullScreenIntent()` and, if needed, send the user to the dedicated
special-access settings page:
https://developer.android.com/about/versions/14/behavior-changes-14

## Verification

- `FullScreenIntentPolicyTest`: 3/3 passed.
- Existing `PrivatePwaReturnUrlTest`: 5/5 passed.
- Android `:app:testDebugUnitTest :app:assembleDebug --no-daemon`:
  `BUILD SUCCESSFUL`.
- The APK installed with `-r` on the intended S25; existing app data and native
  pairing remained present.
- The native UI reported full-screen access ready and the protected push channel
  still paired.

Physical local acceptance:

1. S25 started at `mWakefulness=Dozing`.
2. The debug-only fixed Level 4 notification was posted from ADB shell.
3. S25 changed to `mWakefulness=Awake`.
4. Foreground activity became
   `ai.timesovereignty.privateapp.IncomingCheckInActivity`.
5. Chloe confirmed all three physical outcomes: audible ringtone, vibration,
   and the complete green full-screen response UI.

## Boundaries and remaining proof

- No OpenAI API call, GPT-5.6 call, Cloud Task, FCM send, Firestore write, or
  Cloud Run deployment occurred.
- Public V1 was not read for mutation and was not changed.
- This acceptance proves the installed Android notification-to-lock-screen path
  in isolation. One later controlled real FCM delivery is still required before
  claiming that the previously failing cloud-to-device repeat path has passed
  again end to end.
