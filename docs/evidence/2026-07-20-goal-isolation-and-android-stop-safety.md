# Goal isolation and Android stop-safety evidence

Date: 2026-07-20 (Asia/Shanghai)

## Scope

This checkpoint verifies two production boundaries without changing the public V1 revision:

1. a bridge-exercise goal cannot read the drawing goal's active or last-confirmed check-in;
2. an Android catch alert can reach the phone but can never trap the user in indefinite sound or vibration.

## Goal isolation

- Every new live schedule now requires a stable `goalId`.
- Device-session pointers are stored per goal; goal-aware reads do not fall back to legacy global pointers.
- Goal-level memory is keyed by stable identity, not mutable title text.
- Cross-goal current, confirmation, and memory-effectiveness paths fail closed.
- Focused regression: 11/11 tests passed.
- Full web regression: 44 test files passed, 5 skipped; 173 tests passed, 9 skipped; lint, typecheck, and the Next production build passed.
- Private revision `time-sovereignty-00050-pid` serves both private tags at 0% stable traffic. Public V1 remains `time-sovereignty-00024-dih` at 100%.
- On the S25, the bridge goal rendered without the earlier cup completion. After the current client loaded, requests used `current?goalId=goal-b27aeb38-d88b-4df1-b12c-48e459a69281` and returned HTTP 200.

## Real-device findings

- A stale installed PWA initially kept calling `/current` without `goalId`, producing repeated HTTP 400 responses and a 409 when an older check-in was confirmed.
- A versioned in-place navigation loaded the current client without deleting local goal or pairing data; goal-scoped polling then returned 200.
- Real Cloud Tasks/FCM delivered Level 1 at 06:34:08 and Level 2 at 06:34:23. Level 1 remained passive; Chloe heard the bounded Level 2 signal.
- GPT-5.6 processed the real technical-blocker report and returned `BLOCKED / RESCHEDULE`, preserving the one-minute bridge action and a short follow-up.
- The same live call exposed two product defects kept in PROJECT_STATE: ambiguous intent buttons and a UTC time incorrectly labelled as Asia/Macau in human-visible commitment text.

## Android safety changes

- Escalation tiers use distinct notification identities so a future full-screen call is not merely an update to a passive notification.
- A call signal has a hard 30-second maximum.
- Leaving or destroying the incoming screen stops all active app-owned sound and vibration.
- Opening the native main screen unconditionally stops current app alerts.
- The main screen permanently exposes `立即停止所有提醒`, which also clears this app's notifications.
- `testDebugUnitTest assembleDebug` completed successfully, and the APK was installed on S25 with pairing data preserved.

## Human acceptance

Chloe performed all six checks on the S25 and reported all passed:

1. local incoming preview appeared;
2. sound occurred;
3. vibration occurred;
4. no response button was required to escape;
5. leaving/reopening the app stopped the alert;
6. the permanent stop control and stopped-state message were visible and usable.

The submission claim for this checkpoint is deliberately limited to: a real cloud reminder can audibly reach the private Android device, and the user always has a bounded, visible stop path. This checkpoint does not claim that the tier-specific full-screen path was re-accepted after the final notification-ID change.
