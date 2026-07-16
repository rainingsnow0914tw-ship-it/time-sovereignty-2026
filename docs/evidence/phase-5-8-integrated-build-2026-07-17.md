# Phase 5–8 Integrated Local Build Evidence

- Date: 2026-07-17 (Asia/Shanghai)
- Result: **INTEGRATED BUILD PASS; DEPLOYED BEHAVIOR ACCEPTANCE PENDING**
- Verification cadence: one whole-product compilation after implementation
- OpenAI API calls: 0
- GCP mutations: 0

## Integrated product scope

- Today surface with North Star, current action, protected minimum, check-in,
  quiet-hours status, and resume point
- Incoming Check-in with text prompt, browser notification, tap-to-play TTS,
  speech transcription with text fallback, one-delay handling, repeated-delay
  recovery, and new commitment
- Share Progress with text, photo, and voice evidence; bounded local media;
  specific feedback; memory; and resume-point update
- Journey with chronological events, retrieved memory, progress, adaptations,
  calibration, and persisted intervention rating
- Developer with safe Agent traces, provider/model/schema labels, acceptance
  map, and a redacted runtime snapshot
- Accelerated Simulation through meaningful Days 1, 2, 3, 4, 5, 8, 14, and
  30 with explicit simulated-time labeling
- Local journey repository validated by Zod
- PWA manifest, `/api/health`, demo script, submission checklist, Decision 0008,
  Build Log, and Notion-ready checkpoint

## Reference consultation

Decision 0004 Phase 5 bookmarks were used only for active provider-boundary
questions:

- `小寶助理/tts.py`
- `小寶助理/voice_input.py`

Only principles were adopted: lazy capability initialization, speech-text
normalization and bounds, provider isolation, explicit media types, short media
limits, capability detection, and graceful text fallback. No legacy source,
project setting, credential, or user data was copied.

## Single compilation checkpoint

`npm run build` passed once after the integrated implementation:

- Next.js 16.2.10 production compilation: PASS
- TypeScript: PASS
- static page generation: 6/6
- `/`: built
- `/api/health`: built
- `/api/tasks/interventions/[interventionId]`: built
- `/api/tasks/orchestration/[requestId]`: built
- `/manifest.webmanifest`: built

## Honest boundary

At Chloe's direction, no separate Phase 5, 6, 7, or 8 test cycle and no local
browser walkthrough was performed. This record proves the integrated code can
compile into a production Next.js artifact. It does not yet prove browser
permissions, media capture, notification behavior, simulation interaction, or
mobile layout in the deployed revision.

The next acceptance environment is Cloud Run. Live activation still requires
Secret Manager binding, a cost-bounded queue profile, a real OIDC orchestration
task, four persisted `openai` traces, duplicate-cost proof, and a deployed
browser walkthrough.
