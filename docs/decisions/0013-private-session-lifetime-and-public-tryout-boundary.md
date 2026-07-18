# Decision 0013: Private session lifetime and public Try it out boundary

- Date: 2026-07-18
- Status: Accepted
- Decision owner: Chloe
- Implementer: Codex

## Context

The original twelve-hour single-device session expired during Chloe's real
multi-day product testing. The security fence worked, but its lifetime was too
short for Build Week acceptance and exposed a missing re-pair recovery path in
onboarding. Devpost also expects a public `Try it out` link, while Chloe wants
to keep using the private phone product after the competition. Those two users
must not share one device session, pairing credential, or data lane.

## Decision

1. Configure Chloe's current private single-device preview session for 96
   hours. Keep a deterministic seven-day maximum in the runtime schema so a
   deployment variable cannot silently create a permanent session.
2. Preserve the one-device Firestore record, one-time pairing secret,
   signed `HttpOnly`/`Secure`/`SameSite=Strict` cookie, exact origin allowlist,
   revocation, idempotency, queue limits, and zero SDK retries.
3. Display the actual expiry timestamp returned by the server instead of a
   hard-coded twelve-hour label.
4. When a protected onboarding request returns 401, keep the three local
   answers and offer an in-place re-pair and same-request retry. Also provide a
   same-origin recovery page so an already-open older tab can be repaired
   without refreshing and losing its in-memory answers.
5. Treat Devpost `Try it out` as a separate future public guest lane. It must
   not reuse Chloe's pairing code, private cookie, Firestore journey, or media.
   The OpenAI API key remains server-side in Secret Manager and never appears
   in the PWA bundle, GitHub, URLs, browser storage, or API responses.
6. Before enabling a live public guest lane, add an explicit request budget,
   rate limit, short guest expiry, idempotency, safe traces, and cleanup. Until
   that boundary is implemented and verified, do not claim that public live
   model access is available.
7. After the submission recording, revoke the private session and rotate or
   disable the one-time pairing secret. Continued private use starts from a
   newly approved private session rather than leaving competition credentials
   indefinitely active.

## Consequences

- Chloe can test continuously through the competition without weakening the
  one-device or server-side-key boundary.
- Expiry becomes recoverable product behavior instead of a dead end.
- The public GitHub repository can contain the real application source because
  credentials remain deployment-time secrets; security does not depend on
  hiding the source code.
- Public judge access remains honest, bounded, and isolated from Chloe's
  personal product data.
