# Decision 0001 — Repository foundation

- Date: 2026-07-16
- Status: accepted

## Decision

Use a standalone Time Sovereignty repository as the single Build Week project history.

Preserve the original v0.6 PRD, Architecture v2, and Codex kickoff prompt under `docs/source/`. Do not mix this repository's commit history with unrelated projects.

## Rationale

The desktop folder already contains Chloe's current source package and is separate from unrelated projects and dirty history. A new Git repository here produces a clean, date-specific evidence chain.

## Security consequence

The project-specific OpenAI key is stored only in `.env.local`. The existing `GPTAPIKEY.txt` is treated as secret-bearing, is not read, and is excluded from Git.

## Next gate

Codex must complete the review required by `docs/source/03_Codex_Kickoff_Prompt.md` and wait for Chloe's approval before broad product implementation.
