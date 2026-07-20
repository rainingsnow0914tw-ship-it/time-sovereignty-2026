# Live GPT-5.6 Goal Plan Revision Contract

- Date: 2026-07-20 08:25 +08:00
- Command: `npm run test:live:goal-revision`
- Requested model: `gpt-5.6`
- Returned model: `gpt-5.6-sol`
- Provider: OpenAI Responses API
- Structured output: `GoalArchitectRevisionOutput`
- Result: schema passed
- Token usage: 939 input, 470 output, 1,409 total
- SDK retries: 0

## Acceptance scenario

The current habit plan incorrectly assumed that a three-times-per-day bridge
exercise goal needed only one evening reminder. The user rejected that
assumption and explicitly requested action windows at 09:00, 14:00, and 19:00.

One live structured call returned a revised plan that:

- removed the rejected one-reminder assumption;
- reflected all three requested times;
- remained valid against the same Goal Plan Zod schema; and
- returned a safe OpenAI trace without persisting raw user feedback.

This validates the thin live boundary for the new revision path. Mock tests
remain the deterministic inner loop.
