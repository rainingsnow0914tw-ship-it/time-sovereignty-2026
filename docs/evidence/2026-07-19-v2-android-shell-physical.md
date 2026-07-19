# V2 Android incoming check-in shell — physical verification

- Time: 2026-07-19 19:17 +08:00
- Device: Samsung SM-S9380 (designated S25 Ultra)
- App ID: `ai.timesovereignty.privateapp`
- Scope: local-only Android shell; no Firebase pairing, API call, Cloud Task, or persistence was claimed.

## Build evidence

- First build correctly failed because the fresh project had not enabled AndroidX.
- Added `android.useAndroidX=true`; the next `:app:assembleDebug` completed successfully.
- The debug APK installed beside the existing apps under a new package ID.

## Human-observed physical test

1. With the device in silent mode, the incoming screen opened without sound or vibration. This matched the no-override safety contract.
2. With the device returned to audible mode, the same incoming check-in produced both ringtone and vibration.
3. Chloe confirmed the dark-green incoming screen and all four response buttons were complete and visually normal.
4. Chloe chose **延後 10 分鐘**. The incoming activity closed and the app returned to its private V2 main screen.

## Machine-observed exit state

- Top resumed activity: `ai.timesovereignty.privateapp/.MainActivity`
- Vibrator state: `IDLE`
- Vibrator amplitude: `0.0`
- Audio service: `In ring or call: false`

## Honest boundary

This verifies the Android delivery surface, bounded device behavior, and local response exit only. The response is not yet persisted and no future event is created yet. The next phase must connect protected device registration, data-only FCM, idempotent event delivery, and durable response handling before claiming a real catch loop.
