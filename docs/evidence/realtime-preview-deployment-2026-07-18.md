# Realtime preview deployment evidence — 2026-07-18

## Scope

This checkpoint records deployment of the verified bilingual and Realtime voice foundation. It does not claim physical microphone, TTS, transcription, or live-model acceptance.

## GitHub

- Public repository: `rainingsnow0914tw-ship-it/time-sovereignty-2026`
- Published checkpoint: `0eccc4cf15643eb087cc0c5bb1f04ab62b9b1a7d`
- Commit: `checkpoint: complete bilingual realtime voice foundation`
- Local-only handoff and cheat-sheet files were excluded from Git and Cloud Build.

## Cloud Run snapshot

- Project / region: `time-sovereignty-2026` / `asia-east1`
- Service: `time-sovereignty`
- Stable revision: `time-sovereignty-00012-7gn`, 100% normal traffic
- Preview revision: `time-sovereignty-00019-wek`, tag `live-mobile`, 0% normal traffic
- Preview URL: `https://live-mobile---time-sovereignty-defqnamrrq-de.a.run.app`
- Scaling / concurrency: minimum 1, maximum 1, concurrency 1
- Timeout: 300 seconds
- Runtime environment names: 16, unchanged
- Secret references, values not read:
  - `OPENAI_API_KEY -> openai-api-key:latest`
  - `LIVE_CHECKIN_PAIRING_SECRET -> live-checkin-pairing-secret:5`
  - `LIVE_CHECKIN_SESSION_SECRET -> live-checkin-session-secret:latest`

## Public-safe checks

- Preview `/api/health`: HTTP 200; `providerMode=live`; `model=gpt-5.6`; revision `time-sovereignty-00019-wek`.
- Stable `/api/health`: HTTP 200; revision remains `time-sovereignty-00012-7gn`.
- Preview unauthenticated `/api/live/session`: HTTP 401.
- Preview unauthenticated `POST /api/live/realtime/session?locale=zh-TW`: HTTP 401 before any OpenAI call.
- Cloud Tasks queue `time-sovereignty-checkins`: RUNNING, task count 0, 1 dispatch/sec, 1 concurrent dispatch, 1 maximum attempt.
- Runtime and task-caller service accounts both remain enabled.
- No Realtime or GPT-5.6 request was made for this deployment checkpoint.

## Deployment timeout note

The first local `gcloud run deploy` command exceeded its 64-second client wait but later completed in Google Cloud as `time-sovereignty-00018-vok`. A second command created the selected preview `00019-wek`. Revision `00018-vok` is ready but untagged and receives 0% normal traffic. It remains listed for explicit post-acceptance cleanup rather than being deleted without a verified final preview.

## Honest remaining boundary

The pairing binding still references consumed/revoked version 5. A fresh one-time version must be created only when Chloe is present with the phone pairing screen open. Physical WebRTC audio, Mandarin transcription, Realtime playback, GPT-5.6 response, Firestore traces, confirmation, follow-up task, revocation, and cleanup remain unverified in this revision.
