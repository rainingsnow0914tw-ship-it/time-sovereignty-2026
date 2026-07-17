# Realtime Android production acceptance — 2026-07-18

## Claim

The installed Android PWA completed a protected, user-started Realtime voice
session with `gpt-realtime-2.1`. The final supplied check-in text was spoken in
full, and Chloe explicitly accepted the natural ending and question intonation.
GPT-5.6 remains the structured decision brain; Realtime remains the ears/mouth
layer only.

## Defects found and corrected

1. The unified WebRTC endpoint rejected multipart Blob/file parts. The SDP and
   session JSON are now sent as regular string fields, matching the endpoint
   contract.
2. The original 240-token session and response limits produced an objectively
   incomplete response. Captured data-channel evidence showed
   `reason=max_output_tokens` and exactly 240 output tokens. Both limits are now
   1,024 and are covered by contract tests.
3. The installed PWA retained an older client document after deployment. The
   server session advertised 1,024 while the actual phone-side
   `response.create` still sent 240. An ignore-cache reload loaded the current
   client without clearing the paired session or journey data.
4. A completed Realtime response could still occasionally omit the final
   phrase. The session and per-response instructions now require reading every
   word from the first through the final word without summary, omission,
   paraphrase, or early termination.

## Final physical acceptance

- Device surface: installed Android PWA over the protected single-device path.
- User gesture: Chloe tapped the high-fidelity voice control.
- Provider/model: OpenAI / `gpt-realtime-2.1`.
- Phone-side `response.create.max_output_tokens`: 1,024.
- Server `session.created.max_output_tokens`: 1,024.
- Final `response.done.status`: `completed`.
- Final status details: none; no error event.
- Final output usage: 480 output tokens, including 356 audio tokens and 124
  text tokens.
- Human acceptance: the complete passage was audible; Chloe specifically
  confirmed the final question breath and rising intonation were intact.
- No reply was submitted during this pure voice acceptance, so it did not call
  the Commitment Recovery Agent, Chief of Staff, or any other GPT-5.6 Agent.

## Verification

- Focused Realtime contracts: 8 passed.
- Complete local suite: 79 passed, 5 skipped.
- ESLint: passed.
- TypeScript: passed.
- Next.js production build: passed.

## Production deployment

- GCP project / region: `time-sovereignty-2026` / `asia-east1`.
- Cloud Run service: `time-sovereignty`.
- Accepted revision: `time-sovereignty-00024-dih`.
- Normal production traffic: 100% to `00024-dih` after Chloe's explicit
  approval.
- Production health URL returned HTTP 200 and reported revision
  `time-sovereignty-00024-dih`.
- The `live-mobile` tag resolves to the same accepted revision.
- The OpenAI API key remained server-side in Secret Manager and was never sent
  to or displayed on the phone.

## Honest remaining boundary

The recording-only device session and its test follow-up remain active until
the final demo is captured. They must be revoked and cleaned up after recording.
The public demo video and Devpost submission are still human-facing delivery
steps, not completed engineering evidence.
