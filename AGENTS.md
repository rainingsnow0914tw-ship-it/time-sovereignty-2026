# Codex Repository Instructions

This is the standalone OpenAI Build Week repository for **Time Sovereignty**.

## Product goal

Build a production-shaped AI Chief of Staff that protects one meaningful long-term goal through planning, scheduled check-ins, recovery, progress evidence, memory, and continued follow-up without taking control away from the user. The public demo must include a real user-facing path, not just evidence-only model calls.

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

## Important directories and files

- `src/app/`: Next.js UI and HTTP routes. Protected live-device and Cloud Tasks entry points live under `src/app/api/`.
- `src/features/onboarding/`: goal intake, plan review, support agreement, and bilingual onboarding UI.
- `src/features/journey/`: longitudinal command center, check-in, progress, simulation, developer trace, and live mobile UI.
- `src/domain/`: versioned goal, agent, intervention, memory, progress, and journey contracts.
- `src/orchestration/`: four-Agent routing and safe trace orchestration.
- `src/live-checkin/`: single-device pairing, Firestore state, scheduling, idempotency, quiet-hours fence, GPT-5.6 orchestration, and Realtime session boundary.
- `src/providers/ai/`: mock/live GPT-5.6 provider contract. Live Responses API retries remain zero.
- `src/providers/audio/`: browser fallback audio plus the user-started Realtime WebRTC voice layer.
- `src/infrastructure/`: Firestore, Cloud Tasks, OIDC, and GCP configuration adapters.
- `docs/source/`: immutable source PRD and architecture inputs.
- `docs/decisions/`: accepted architecture, scope, cost, and fallback decisions.
- `docs/evidence/`: timestamped verification evidence; never claim evidence that was not actually produced.
- `docs/PROJECT_STATE.md`: short current-state handoff card; update at verified milestones only.
- `CODEX_BUILD_LOG.md`: chronological build evidence and larger checkpoints.

## Start and verification commands

```powershell
npm install
npm run dev
npm test
npm run lint
npm run typecheck
npm run build
npm run smoke:openai
```

- `npm run dev` starts local development; `npm run build` is the required production compilation check.
- Live API tests are deliberate outer-loop checks only. Do not run them repeatedly or silently; use the dedicated live scripts and record evidence.
- A milestone is not verified until relevant tests, lint, typecheck, build, and any required real-runtime check pass.

## Resume and checkpoint protocol

After a new conversation, resume, or context compression, do this before editing:

1. Read `AGENTS.md` and `docs/PROJECT_STATE.md`.
2. Run `git status --short`, `git log -5 --oneline --decorate`, `git diff --stat`, and inspect the existing diff.
3. Compare the written state with actual files and test evidence; summarize the verified start point before continuing.
4. Never discard, overwrite, reset, or silently absorb unconfirmed existing changes.

At every verifiable phase boundary:

1. Run the proportionate checks.
2. Update only the six short sections in `docs/PROJECT_STATE.md`.
3. Stage only intended public files and inspect `git diff --cached`.
4. Create one clear Git checkpoint. Do not checkpoint broken or unverified work.

Do not interrupt long-running work to write frequent notes. Update state at a natural milestone, before switching phase, or before likely interruption.

## Completion standard

A phase is complete only when its intended user flow works, its contracts and deterministic guards are tested, production build passes, secrets are absent from tracked output, safe traces/evidence are truthful, and `docs/PROJECT_STATE.md` names the next exact action.

## Rules that must not be broken

- Preserve the two state machines, four Agent roles, real Cloud Tasks callback, Firestore persistence, OIDC protection, idempotency, quiet-hours fence, and safe agent traces.
- `gpt-realtime-2.1` is the user-started ears/mouth layer only; GPT-5.6 remains the structured decision brain.
- Never move stable Cloud Run traffic, create a public mobile session, or broaden device access without explicit approval. Use tag-only preview for acceptance work.
- Never commit `.env.local`, `GPTAPIKEY.txt`, plaintext secrets, raw replies, raw prompts, media, or private reasoning.
- Keep `docs/EMERGENCY_HANDOFF_ANDROID_FINAL_2026-07-17.md` and `docs/LOCAL_CHEATSHEET_*.md` local-only unless Chloe explicitly changes that rule.
- Do not weaken mock/live schema parity, zero SDK retries, origin checks, one-device session expiry, revocation, or cleanup safeguards to make a demo pass.
