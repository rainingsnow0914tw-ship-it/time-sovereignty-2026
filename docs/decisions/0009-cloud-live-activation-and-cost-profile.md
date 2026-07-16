# Decision 0009: Cloud live activation and cost-bounded acceptance profile

- Date: 2026-07-17
- Status: Accepted
- Decision owner: Chloe
- Implementer: Codex

## Context

The OpenAI API project has approximately US$10 of user-funded balance. Phase 4
proved the four production schemas against GPT-5.6 locally, while Cloud Run had
only executed the same orchestration contract in mock mode. The pre-activation
Cloud Tasks queue allowed 100 attempts, 10 concurrent dispatches, and 10
dispatches per second. A callback failure could therefore repeat billable Agent
calls.

Chloe explicitly approved moving the existing local project key into the
dedicated GCP project, completing all verification before the final deployment,
and running a health check after deployment.

## Decision

1. Disable OpenAI SDK automatic retries by default for the production Responses
   provider.
2. Keep the competition acceptance queue at one dispatch per second, one
   concurrent dispatch, and one total attempt.
3. Keep Cloud Run at one maximum instance and one request per container during
   the cost-sensitive acceptance period.
4. Store the credential only in Secret Manager resource `openai-api-key`; grant
   secret accessor only to the dedicated runtime service account. Never print,
   document, or place the plaintext value in a temporary file.
5. Bind the secret as `OPENAI_API_KEY`, set `AI_PROVIDER_MODE=live`, and request
   model `gpt-5.6` without resetting the eight existing non-secret variables.
6. Prove the live path with one OIDC Cloud Task that dispatches all three
   specialists plus Chief of Staff, followed by one different task name using
   the same request ID. The second task must not change the receipt or traces.
7. Keep routine development and CI mock-only. This acceptance does not authorize
   repeated billable regression runs.

## Consequences

- Live cloud evidence is real but intentionally low-throughput.
- A failed acceptance task does not retry automatically; diagnosis and a new
  explicitly recorded request are required.
- Queue or scale limits may be raised only through a later recorded operational
  decision after budget and failure behavior are reviewed.
- Browser-local simulation traces remain labeled as mock. The Developer surface
  separately reads `/api/health` to show the deployed provider, model, and
  revision without mislabeling simulated events as live calls.
