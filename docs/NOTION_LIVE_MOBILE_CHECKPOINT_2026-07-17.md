# Time Sovereignty — live mobile checkpoint

- Date: 2026-07-17
- Project: OpenAI Build Week / Time Sovereignty
- Status: Backend and 390x844 PWA accepted; physical Android remains
- Primary Codex task: `019f6085-1e4d-7e23-a0b8-371e6e47bbfa`

## What became real

The installed-PWA design now has one protected vertical path: a real Cloud
Task creates a pending check-in; the open PWA polls; Chloe can hear tap-to-play
TTS and answer with text or browser voice transcription; Commitment Recovery
and Chief of Staff use real GPT-5.6; Chloe confirms the adapted commitment;
Firestore stores the decision, safe traces, confirmed memory, and next
follow-up; Developer shows provider/model/tokens/trace ID.

## Proof

- Backend: 464 + 762 = 1,226 tokens; duplicate reply returned in 0.110 seconds
  with unchanged traces and no extra model call.
- Browser: 461 + 750 = 1,211 tokens at 390x844; real decision confirmed; Today
  updated; Developer traces visible; 0 console errors and 0 warnings.
- Combined deliberate usage: four GPT-5.6 calls, 2,437 tokens.
- Stable production remained `00012-7gn` at 100%; final private preview is
  `00017-dif` at 0% under tag `live-mobile`.

## Lessons worth keeping

1. Cloud-first acceptance exposed defects that local tests could not: missing
   Cloud Tasks runtime JSON in Next standalone, strict safe-projection behavior,
   and short-versus-full task identity headers.
2. Agent result and safe trace must land in one Firestore transaction or a
   network break can repeat a billable call.
3. A public PWA can remain safe when the API key stays server-side and access is
   a short, revocable, single-device session—not a secret embedded in Git or a
   URL.
4. Poll while open is enough for the recorded story; background push is a
   separate product decision and should not be smuggled into a hackathon build.

## Exact next move

When Chloe is awake: open the 0% preview on Android, install the PWA, retrieve
the fresh one-time pairing value without writing it to chat or a file, pair,
run one recorded live story, hear phone TTS, try voice transcription or text
fallback, show Developer trace, revoke, then rotate the pairing value again.
USB is not required.
