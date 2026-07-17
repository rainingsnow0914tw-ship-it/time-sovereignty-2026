# Live mobile vertical path acceptance — 2026-07-17

## Outcome

One real user-facing path now exists behind a single-device, twelve-hour
pairing gate. A Cloud Task creates a pending check-in; the open PWA polls it;
the user can hear tap-to-play browser TTS and reply by text or browser speech
transcription; Commitment Recovery and Chief of Staff run through real
GPT-5.6; the user confirms the adapted commitment; Firestore persists the
decision, safe traces, confirmed memory, and next follow-up. Developer mode
shows the real provider, returned model, token usage, and trace IDs.

The OpenAI key, pairing value, and session signing value remain server-side.
No raw user reply, raw prompt, model reasoning, or secret is present in this
evidence or in the public client response.

## Stable-versus-preview boundary

- Stable revision `time-sovereignty-00012-7gn` retained 100% traffic throughout
  implementation and acceptance.
- The final phone-ready preview is revision
  `time-sovereignty-00017-dif`, tag `live-mobile`, with 0% normal traffic.
- Preview health reports provider `live`, requested model `gpt-5.6`, and the
  tagged revision. Unpaired session requests fail closed.
- Cloud Run retained the dedicated runtime service account, minimum/maximum
  instances one, concurrency one, and the existing OpenAI Secret Manager
  binding.
- Cloud Tasks retained one dispatch per second, one concurrent dispatch, and
  one maximum attempt.

## Cloud-only defects exposed before model cost

1. Revision `time-sovereignty-00013-baq` built successfully but the standalone
   container omitted `@google-cloud/tasks/build/protos/protos.json`. The first
   schedule request returned 500 before any model call. The Docker runner now
   copies that official generated descriptor explicitly.
2. Revision `time-sovereignty-00014-jac` scheduled and delivered a real task,
   but two strictness bugs remained. A client-safe `pick` inherited strict
   unknown-key rejection, producing a 400 after scheduling; and Cloud Tasks
   supplied a short task ID while Firestore held the full resource path,
   producing callback 409. The client schema now strips internal fields, and
   task identity accepts either an exact full name or the same final task ID.
3. Both failures occurred before an OpenAI request. They were reproduced from
   Cloud Run logs, fixed with focused unit tests, and redeployed as separate
   evidence-preserving revisions.

## Backend live acceptance

Revision `time-sovereignty-00015-lal` completed check-in
`live-cloud-1784287295`:

- pairing succeeded and created a twelve-hour HttpOnly, Secure,
  SameSite=Strict session;
- a real Cloud Task changed `SCHEDULED` to `PENDING`;
- Commitment Recovery returned `openai / gpt-5.6-sol`, 464 tokens;
- Chief of Staff returned `openai / gpt-5.6-sol`, 762 tokens;
- total live usage was 1,226 tokens and the reply completed in 8.482 seconds;
- resending the same reply ID returned `duplicate=true` in 0.110 seconds;
  trace IDs were unchanged and no additional model call occurred;
- confirmation persisted `CONFIRMED`, a confirmed memory document, and a
  linked next check-in plus real Cloud Task;
- a direct Firestore read found two safe traces, attempt count one, and no raw
  `reply` field;
- the test session was revoked and the next request returned HTTP 401.

## 390x844 PWA live acceptance

Revision `time-sovereignty-00016-yim` was exercised in the Codex in-app browser
at a 390x844 viewport:

- completed onboarding and the support agreement through visible controls;
- paired with a fresh one-time value without storing that value in the page,
  repository, evidence, or a file;
- scheduled a 15-second check-in and visibly changed from scheduled to the
  pending Incoming Check-in through open-page polling;
- clicked the live tap-to-play TTS control; the browser accepted the trigger,
  but the background environment did not provide an audible-completion event;
- sent a real text reply through the UI;
- Commitment Recovery returned 461 tokens and Chief of Staff 750 tokens, both
  `openai / gpt-5.6-sol`, 1,211 tokens total;
- reviewed and confirmed the model-created `REDUCE` decision;
- verified Today changed to the real adapted commitment and next follow-up;
- verified Developer loaded both Firestore traces with provider, model, token
  usage, and trace ID after the asynchronous refresh settled;
- browser console errors: 0; browser console warnings: 0;
- revoked the browser session through the visible UI.

The two deliberate acceptances made four live Responses API calls and used
2,437 total tokens. SDK automatic retries remained zero.

## Cleanup and phone handoff

- Both automated follow-up tasks were listed for evidence and then deleted so
  the acceptance queue returned to a clean state.
- All automated browser and backend sessions are revoked.
- Pairing secret versions used by automated acceptance cannot be reused.
- Secret version 5 is fresh and unused. Revision
  `time-sovereignty-00017-dif` binds it at the 0% `live-mobile` tag.
- No pairing value is written in this document. Retrieve it only at the moment
  of physical Android pairing and rotate it again after recording.

## Honest remaining boundary

Physical Android acceptance is deliberately deferred until Chloe is awake. It
must verify PWA installation, the phone's audible TTS, Android browser speech
transcription or text fallback, the recorded story, and final visible session
revocation. USB is not required for that flow.

Machine-readable safe figures are in
`docs/evidence/live-mobile-vertical-path-2026-07-17.json`.
