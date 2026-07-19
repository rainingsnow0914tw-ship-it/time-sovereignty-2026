# V2 real FCM lock-screen delivery — physical verification

- Time: 2026-07-19 19:45 +08:00
- GCP/Firebase project: `time-sovereignty-2026`
- Firebase Android app: `ai.timesovereignty.privateapp`
- Device: Samsung SM-S9380 (designated S25 Ultra)
- Provider path: Firebase Cloud Messaging HTTP v1, one request, no sender retry

## Provisioning evidence

- Enabled `firebase.googleapis.com`, `fcm.googleapis.com`, and `firebaseinstallations.googleapis.com` in the existing GCP project.
- Added Firebase resources to the existing project without changing the project ID or Cloud Run traffic.
- Created one Android app with package `ai.timesovereignty.privateapp`.
- Downloaded the generated `google-services.json` only to `android/app/google-services.json`; `git check-ignore` confirmed that path is excluded.
- The Firebase-configured debug APK built and installed successfully beside the older apps.

## Controlled lock-screen test

1. Chloe placed the S25 on the table and pressed the power button.
2. No Windows helper sound was played for the actual delivery, so the phone was the only recall signal.
3. Immediately before the FCM request, Android power state was `mWakefulness=Dozing`.
4. FCM accepted exactly one high-priority data-only Level 4 message.
5. Five seconds after delivery, Android power state was `mWakefulness=Awake` and the top resumed activity was `ai.timesovereignty.privateapp/.IncomingCheckInActivity`.
6. Chloe independently confirmed that the phone left its screen-protection state, showed the dark-green full-screen check-in with all four choices, and produced both ringtone and vibration.
7. Chloe selected **把行動縮小**. Sound and vibration stopped immediately.

## Safety comparison

The earlier local physical test also verified that the same incoming screen does not override Android silent mode. Together, the tests show both real-world reachability and respect for the device's current interruption setting.

## Honest boundary

This proves Firebase provisioning, real FCM transport, lock-screen wake, full-screen Android presentation, bounded ringing/vibration, and local user exit. The accepted message was sent once from the local authenticated gcloud session. It does **not** yet prove automatic Cloud Tasks escalation, protected native pairing, Firestore response persistence, or GPT-5.6 recalibration. Those are the next vertical slice.
