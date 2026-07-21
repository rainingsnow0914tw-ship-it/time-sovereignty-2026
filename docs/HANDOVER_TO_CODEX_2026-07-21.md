# Public maintainer handoff — 2026-07-21

This is the redacted public handoff for the OpenAI Build Week snapshot. Private device identifiers, local workstation paths, raw user replies, and internal coordination notes are intentionally excluded.

## Canonical branches

- `main`: accepted V1 submission baseline and original 2:57 video.
- `codex/v2-private`: final-day V2 source with the consent-bounded Android lane, user-started Realtime voice, opt-in lookup, conversation summary, and updated evidence.
- Do not merge these branches before the Build Week judging snapshot is frozen. Post-deadline work should begin on a new `codex/v3-integration` branch.

## Verified product boundary

- The public `/demo` is scripted, browser-only, and makes zero API calls.
- The paired live lane is owner-only. The OpenAI key remains server-side.
- Structured decisions use GPT-5.6. `gpt-realtime-2.1` is used only when the user starts voice.
- A redacted, test-accelerated physical run completed schedule → Cloud Tasks callback → Realtime → native escalation → summary → Android response → GPT-5.6 decision → confirmation.
- The 15-second escalation override compressed waiting time for acceptance; it is not the production cadence and must be removed before release.

## Evidence and media

- Original V1 video: https://youtu.be/d0cX1V4R7h4
- V2 supplemental video: https://youtu.be/XPdfnJ6klu0
- V2 source: https://github.com/rainingsnow0914tw-ship-it/time-sovereignty-2026/tree/codex/v2-private
- Read `README.md`, `docs/PROJECT_STATE.md`, `docs/decisions/`, and `docs/evidence/` before changing claims.

## Verification

```powershell
npm test
npm run lint
npm run typecheck
npm run build
./gradlew.bat testDebugUnitTest assembleDebug --no-daemon
```

Live tests are deliberate outer-loop checks, use zero SDK retries, and must not run in CI. Never commit `.env.local`, service-account material, pairing values, device tokens, raw media, or private replies.

## Tooling history

Codex created the V1 baseline and remained the primary engineering environment. Claude Code continued bounded final-day V2 work from a documented handoff after the Codex quota was exhausted. The Git history preserves both contributions. GPT-5.6 and Realtime are product runtime models, not development-tool substitutes.
