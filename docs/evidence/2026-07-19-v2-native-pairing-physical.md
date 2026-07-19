# V2 protected native pairing — physical verification

- Time: 2026-07-19 20:30 +08:00
- Cloud Run revision: `time-sovereignty-00040-sib`
- Private tags: `live-mobile`, `v2-private`
- Device: Samsung SM-S9380 (designated S25 Ultra)
- Native package: `ai.timesovereignty.privateapp`

## Controlled flow

1. The existing installed WebAPK was opened explicitly in `profile=play`, preserving the prior live journey and paired browser session.
2. The PWA displayed **Connect private Android app** only inside the protected live workspace.
3. One tap created a ten-minute, single-use server ticket and opened the installed private native app through its dedicated scheme.
4. The app obtained its current FCM token, exchanged the ticket at the protected pair endpoint, encrypted the returned native credential with Android Keystore, and displayed **配對完成 · 真實世界跟進通道已受保護地連線**.
5. A masked Firestore read confirmed a device ID, live session ID, Samsung SM-S9380 label, `zh-TW` locale, 64-character token fingerprint, notification consent, full-screen consent, expiry, and null revocation state.
6. No raw FCM token, pairing ticket, native credential, API key, or secret value was printed or committed.

## Deployment boundary

- Stable traffic remained 100% on public V1 revision `time-sovereignty-00024-dih`.
- Both private tags point to `time-sovereignty-00040-sib` with no stable traffic.
- The dedicated V2 runtime identity is used by the private revision.

## Honest boundary

This proves browser-session-to-native ticket handoff, physical Android launch,
protected credential exchange, encrypted local storage, consent persistence,
and revocation-ready server state. The four native response buttons still stop
the local ringer only; protected response persistence, Cloud Tasks-to-FCM
delivery, and GPT-5.6 recalibration are the next slice.

## Operational lesson

Samsung Internet tabs, a Chrome WebAPK, and the app's mock/play profiles are
separate entry surfaces. Opening the bare URL can show a fresh mock onboarding
screen even though the real journey is intact. Resume acceptance work through
the installed WebAPK with `?profile=play`; never reset the journey to fix an
entry-surface mismatch.
