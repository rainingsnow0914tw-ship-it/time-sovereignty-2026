# Time Sovereignty

OpenAI Build Week 2026 project built in Codex, with GPT-5.6 as the product's Chief of Staff brain.

## Current status

Repository foundation created on 2026-07-16 (Asia/Shanghai). Product implementation has not started. The next gate is the required architecture and implementation review described in the Codex kickoff prompt.

## Source of truth

Read these files in order:

1. `docs/source/01_Time_Sovereignty_PRD_v0.6.md`
2. `docs/source/02_Time_Sovereignty_Architecture_v2.md`
3. `docs/source/03_Codex_Kickoff_Prompt.md`

The imported source documents are preserved unchanged. New decisions belong in `docs/decisions/`.

## Evidence chain

- Keep milestone-sized Git commits with clear dates and intent.
- Keep the main Codex development task as the primary Build Week task when practical.
- Record major decisions in `docs/decisions/`.
- Record cross-task continuity in `docs/codex-handoffs.md` only if a handoff becomes necessary.
- Preserve the final primary-task `/feedback` Session ID for submission.

## Secret handling

The real OpenAI API key belongs only in `.env.local` and must never be printed or committed. `.env.example` contains names and safe defaults only.

No API request has been made during repository setup.
