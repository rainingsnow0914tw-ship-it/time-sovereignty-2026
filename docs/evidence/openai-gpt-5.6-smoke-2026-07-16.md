# GPT-5.6 Responses API smoke test — 2026-07-16

## Purpose

Run one minimal real request before Phase 1 to verify:

1. the model name `gpt-5.6` is accepted;
2. this OpenAI project can access the model;
3. strict structured output works through the Responses API.

## Request

- Endpoint: `POST /v1/responses`
- Requested model: `gpt-5.6`
- Input: `Set ok to true.`
- Reasoning effort: `none`
- Storage: disabled
- Maximum output: 32 tokens
- Output contract: strict JSON Schema containing only `{ "ok": boolean }`
- Runner: `scripts/smoke-openai.mjs`
- Secret handling: the key was read locally from ignored `.env.local` and was
  not printed or committed.

## Observed result

The request reached the OpenAI API, which returned:

```json
{
  "passed": false,
  "http_status": 429,
  "error_type": "insufficient_quota",
  "error_code": "insufficient_quota",
  "error_message": "You exceeded your current quota, please check your plan and billing details."
}
```

The message above is shortened to its diagnostic sentence; no secret or
credential is included.

## Validation status

| Check | Status | Evidence |
| --- | --- | --- |
| Request sent to the real Responses API | Confirmed | OpenAI returned a structured API error response. |
| API credential passed the authentication boundary | Indicated, not a full model-access proof | Response was quota-related rather than HTTP 401 authentication failure. |
| `gpt-5.6` model name accepted | Not yet validated | Quota blocked the request before a model response was created. |
| Project has `gpt-5.6` access | Not yet validated | No inference response was created. |
| Strict structured output works | Not yet validated | No model output was created. |

Overall status: **blocked by API quota precondition; smoke test not passed**.

## Cost and usage observation

No successful inference or token-usage object was returned. This evidence does
not claim a billed amount; it records only that no model usage was reported in
the failed response.

## Required follow-up

1. Confirm that API billing or promotional credit is active for the selected
   organization and project.
2. Do not rotate the key solely because of this result; the observed error is
   quota-related, not an invalid-key error.
3. Rerun the same one-request script.
4. Preserve this failed record and add a separate successful evidence record;
   do not overwrite the history.

Mock-first Phase 1 work may continue while this external precondition is being
resolved. Live GPT-5.6 integration may not be marked complete until all three
checks pass.
