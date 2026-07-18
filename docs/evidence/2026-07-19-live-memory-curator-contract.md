# Live Memory Curator contract evidence — 2026-07-19

## Scope

One deliberate live call validated the post-response Memory Curator contract with synthetic, non-personal input. The existing project API key was loaded only from the local environment. The key was not printed, copied into source, sent to the browser, or committed.

## Result

- Requested model: `gpt-5.6`
- Returned model: `gpt-5.6-sol`
- Provider: `openai`
- Structured schema: `MemoryCuratorOutput`
- Schema validation: passed
- Proposal count: 1
- Limited-evidence boundary: passed
- Input tokens: 591
- Output tokens: 246
- Total tokens: 837
- OpenAI SDK retries: 0
- Raw reply or photo persisted: no

The returned proposal was goal-scoped `STRATEGY`, used `OBSERVED_PATTERN`, required user confirmation, and kept confidence at or below `0.45` after one episode.

## Command

`npm run test:live:memory-curator`

## Local regression checkpoint

- Tests: 122 passed, 9 skipped
- Lint: passed
- Typecheck: passed
- Production build: passed
- `git diff --check`: passed
