# Live Goal Architect cadence contract — 2026-07-18

## Purpose

Verify once, through the real OpenAI Responses API, that the revised Goal
Architect contract can distinguish a one-night sprint from a generic long
journey and return a temporally valid Traditional Chinese plan.

The bounded test input described a Build Week deliverable due at 23:00 Taipei
time on the same day. Raw answers, prompts, secrets, and private reasoning are
not persisted in this evidence file.

## Result

- requested model: `gpt-5.6`
- returned model: `gpt-5.6-sol`
- provider: `openai`
- structured output: `GoalArchitectOutput`
- schema passed: yes
- Traditional Chinese plan returned: yes
- classified goal type: `SPRINT`
- recommended check-in frequency: `CUSTOM` (goal-led)
- recommended agreement review: 1 day
- defensible target end time returned: yes
- zero SDK retries: yes
- raw answers persisted: no
- input tokens: 683
- output tokens: 798
- total tokens: 1,481

The deterministic timing guard also passed: the initial check-in was in the
future, before the returned target end time, and inside the 24-hour sprint
window. No second live iteration was made.

## Local quality gate before the live call

- complete suite: 104 passed, 8 live-only tests skipped
- ESLint: passed
- TypeScript: passed
- production Next.js build: passed

## Cloud preview

- preview revision: `time-sovereignty-00030-sad`
- preview tag: `live-mobile`, 0% normal traffic
- preview health: HTTP 200
- provider mode: `live`
- configured model: `gpt-5.6`
- stable revision: `time-sovereignty-00024-dih`, unchanged at 100% normal traffic

The physical phone was locked during this non-interactive phase, so no visual
phone acceptance is claimed. A repository test removed cadence from a saved
play-profile record and proved that the deployed compatibility boundary
upgrades it to an editable `SPRINT` record instead of discarding the journey.
