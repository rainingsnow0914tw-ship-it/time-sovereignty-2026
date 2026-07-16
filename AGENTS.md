# Codex Repository Instructions

This is the standalone OpenAI Build Week repository for **Time Sovereignty**.

## Required reading order

Before broad implementation work, read:

1. `docs/source/01_Time_Sovereignty_PRD_v0.6.md`
2. `docs/source/02_Time_Sovereignty_Architecture_v2.md`
3. `docs/source/03_Codex_Kickoff_Prompt.md`

Treat those files as the current product source of truth. Preserve them unchanged; record later decisions separately.

## Collaboration

- Speak to Chloe in Traditional Chinese unless she requests otherwise.
- Explain the product-facing result before internal schemas or code.
- Do not reduce the product to a generic reminder or task app.
- Do not begin a broad implementation change until the kickoff review is presented and Chloe approves it.

## Security

- Never read, print, quote, commit, or expose plaintext API keys.
- Use `.env.local` for `OPENAI_API_KEY`; keep `.env.local` ignored.
- Treat `GPTAPIKEY.txt` as secret-bearing and never add it to Git.
- Use Secret Manager for deployed credentials.

## Build Week evidence

- Use Codex as the primary implementation environment.
- Keep clear milestone commits and verify before committing.
- Use GPT-5.6 meaningfully in the live product.
- Maintain agent/tool traces and a user-visible outcome evidence chain.
- Keep the primary task available for final `/feedback` submission evidence.

## Engineering discipline

- Complete and verify the main vertical loop before optional integrations or visual polish.
- Keep mock and live providers behind the same schemas.
- Prefer structured outputs, explicit state transitions, idempotent scheduled handlers, and deterministic safety checks.
- Preserve the status distinctions `IMPLEMENTED_IN_MVP`, `INTERFACE_PREPARED`, and `FUTURE` used by the source documents.
- Never fabricate completion, deployment, test, trace, or API evidence.
