# Start here — Time Sovereignty judging snapshots

Read `docs/HANDOVER_TO_CODEX_2026-07-21.md` first, then `AGENTS.md` and
`docs/PROJECT_STATE.md`.

## Public branches

| Branch | Judging purpose | Canonical proof |
| --- | --- | --- |
| `main` | Original V1 submission snapshot | 2:57 main video and zero-API public Demo Lab |
| `codex/v2-private` | Final-day V2 snapshot | Android follow-up, bounded escalation, Realtime voice, GPT-5.6 decision, confirmation, and memory evidence |
| `codex/longitudinal-goal-loop` | Earlier longitudinal prototype | Multi-goal list, attendance view, and plan-revision experiments |

The branches share a compatible backend data model, but they are intentionally
kept as separate judging snapshots. Do not merge them during judging.

## Current cloud boundary

- Stable traffic remains pinned to the original competition revision
  `time-sovereignty-00024-dih`.
- The `live-mobile` and `v2-private` tags are protected owner-only preview
  surfaces.
- The public Demo Lab is scripted, browser-only, zero-API, and isolated from
  private Firestore data.
- The V2 physical acceptance used a disclosed 15-second test acceleration. It
  is evidence of the complete path, not the intended production cadence.

## Read next

1. `docs/PRODUCT_DIRECTION.md` — public product decisions and boundaries.
2. `docs/PROJECT_STATE.md` — short current-state card.
3. `AGENTS.md` — commands, verification standards, and rules that must not be
   broken.
4. `docs/DEVPOST_STORY_FINAL.md` — canonical final public Story.
5. `README.md` — evaluator entry point and evidence map.

## After the deadline

Keep `main` and `codex/v2-private` frozen throughout judging. Continue product
work from a new `codex/v3-integration` branch, remove the 15-second test
override, restore a humane escalation cadence, and integrate the multi-goal
and native-phone lines with fresh regression and physical-device acceptance.
