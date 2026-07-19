# V2 tag-only Cloud Run preview

- Time: 2026-07-19 20:03 +08:00
- Project / region: `time-sovereignty-2026` / `asia-east1`
- Service: `time-sovereignty`
- Private tag: `v2-private`
- Private revision: `time-sovereignty-00039-fev`

## Identity boundary

- Created dedicated runtime identity `time-sovereignty-v2-runtime@time-sovereignty-2026.iam.gserviceaccount.com`.
- Its project roles are limited to Cloud Tasks enqueue, Firestore access, and Firebase Cloud Messaging send.
- It has secret-level accessor bindings only for the three existing runtime secrets required by this service.
- The public V1 runtime identity has no Firebase Cloud Messaging role.

## Deployment verification

- Source upload inventory contained 150 files and zero matches for `android/`, `google-services.json`, `.env*`, or `GPTAPIKEY`.
- Revision `00039-fev` uses the dedicated V2 runtime identity.
- Revision resources remained: min 1, max 1, startup CPU boost enabled, concurrency 1, timeout 300 seconds, 512 MiB, 1 CPU.
- Stable traffic remained 100% on `time-sovereignty-00024-dih`.
- `v2-private` points to `00039-fev` with no stable traffic.
- `GET /api/health` returned 200.
- `GET /api/live/native/session` without a native credential returned 401.

## Honest boundary

This proves isolated V2 identity, secret access, configuration, deployment,
traffic separation, health, and the native authorization fence. It does not yet
prove browser-to-native pairing, Cloud Tasks-to-FCM delivery, or protected
response persistence from Android.
