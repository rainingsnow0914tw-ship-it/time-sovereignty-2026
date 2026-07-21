# V2 submission closeout — 2026-07-21

## Scope

This checkpoint closes the public OpenAI Build Week judging snapshot without deploying a new revision, changing traffic, exposing the private phone lane, or replacing the original under-three-minute V1 video.

## Public submission verification

- Devpost remained in `Submitted` state with all 5/5 steps complete.
- The public Story was replaced with the canonical V1/V2-aware version in `docs/DEVPOST_STORY_FINAL.md`.
- Judge-only instructions now distinguish the zero-API Demo Lab, original V1 video, final-day V2 supplement, and owner-only live lane.
- The original main video remains https://youtu.be/d0cX1V4R7h4.
- The public 56-second V2 supplement is https://youtu.be/XPdfnJ6klu0.
- Three V2 gallery images were added with explicit captions for `Native UI replay`, a redacted real server timeline, and test-accelerated acceptance.
- Chloe's public `Created by` contribution statement remains populated.
- The public Devpost page was re-read after save and contained the final V2 Story, both video links, and all three truth labels.

## Local verification

- `npm test`: 48 files passed, 6 skipped; 215 tests passed, 10 deliberate live-only tests skipped; zero failures.
- `npm run lint`: passed with zero errors.
- `npm run typecheck`: passed with zero TypeScript errors.
- `npm run build`: passed; 19/19 static pages generated. The only warning was Next.js workspace-root inference caused by a second parent `package-lock.json`.
- Android: local Gradle 8.14.3 ran `testDebugUnitTest assembleDebug`; 3 suites and 15 tests passed, debug APK assembled, zero failures. The repository does not contain a Gradle wrapper; Gradle also reported only a future Gradle 9 deprecation warning.
- `git diff --check`: passed.

## Privacy and public-source scan

- Secret-pattern hit files: 0.
- Local workstation path or full device identifier hit files: 0.
- The untracked local `tmp/` phone screenshots are excluded by `.gitignore` and are not part of the checkpoint.
- The old rendered architecture image is retained under an explicit V1 filename; the updated Mermaid source is the V2 architecture source of truth.

## Cloud read-only snapshot

- Project / region: `time-sovereignty-2026` / `asia-east1`.
- Stable traffic: `time-sovereignty-00024-dih` at 100%.
- Latest ready protected revision: `time-sovereignty-00073-c44`.
- `live-mobile` and `v2-private` tags point to `00073-c44` and receive no normal traffic.
- Cloud Run remains minimum one, maximum one, container concurrency one, using the dedicated V2 runtime identity.
- Queue `time-sovereignty-checkins` is `RUNNING`, with one dispatch per second, one concurrent dispatch, one attempt, and no listed pending tasks.
- Stable health, both protected-tag health routes, and the public Demo Lab returned HTTP 200. Health reported provider mode `live` and requested model `gpt-5.6` on the live surfaces.

## Media verification

- File: `Time-Sovereignty-V2-Supplement.mp4` (kept outside the repository).
- Duration: 56.50 seconds.
- Video/audio: 1920x1080 H.264 Main at 30 fps; AAC LC 48 kHz stereo.
- Full decode passed; burned English captions and narration were verified.
- Narration: OpenAI `tts-1-hd`, voice `nova`, seven single-attempt segments, zero SDK retries.
- SHA-256: `D674138CAF5AA84B21436A832BC419662CC43570E776D94B5F555154D09C962E`.

## Truth boundary

- The public Demo Lab is scripted, browser-only, zero-API, and isolated from private Firestore state.
- The incoming Android screen in the supplement is labelled as a native UI replay, not as proof of that exact frame arriving from the cloud.
- The real cloud-to-phone path is supported by the redacted server timeline and physical-device acceptance notes.
- The 15-second escalation setting compressed waiting time for acceptance only and must be removed before an ordinary post-hackathon release.
