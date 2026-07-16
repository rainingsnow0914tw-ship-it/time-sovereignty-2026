# Decision 0010: Judging readiness, warm instance, and accessibility gate

- Date: 2026-07-17
- Status: Accepted
- Decision owner: Chloe
- Implementer: Codex

## Context

The deployed service, Firestore database, Cloud Tasks queue, Artifact Registry,
and source bucket are all in Google Cloud `asia-east1`. The alternate Cloud Run
hostname ending in `-de.a.run.app` is a generated hostname, not evidence of a
European deployment. The OpenAI SDK uses the standard OpenAI API endpoint; no
EU data-residency endpoint was configured.

Live timing evidence separated two different delays:

- the first health request after an idle period took 2.617 seconds;
- immediately repeated health requests took approximately 8–12 milliseconds;
- the real four-Agent GPT-5.6 orchestration took 23.488 seconds;
- a completed duplicate request returned in 0.197 seconds without another
  model run.

The first-hit delay was therefore a Cloud Run cold start. Most of the live
orchestration time was the bounded four-Agent model path, not a Europe/Asia GCP
split.

## Decision

1. Keep Cloud Run in `asia-east1`; do not perform a risky regional migration
   during the judging window.
2. Keep minimum instances at one for judging readiness. Preserve maximum
   instances one, container concurrency one, Cloud Tasks limits 1/1/1, and the
   existing Secret Manager binding.
3. After judging, return minimum instances to zero unless a later operational
   decision accepts the standing warm-instance cost.
4. Treat focused accessibility as a submission gate. The goal question, plan
   review, support agreement, and command center must each pass the focused
   axe scan after animations settle, expose one valid main landmark, remain
   keyboard reachable, and produce no browser console or request failures.
5. Preserve the honest runtime boundary: interactive journey traces are local
   mock contracts; the protected OIDC task is the real GPT-5.6 proof.

## Verified consequence

Revisions `time-sovereignty-00010-fhg`, `time-sovereignty-00011-vrf`, and
`time-sovereignty-00012-7gn` progressively applied the warm instance, submission
assets, and accessibility fixes. Final revision `00012-7gn` serves 100% of
traffic with minimum/maximum instances one and passed all four focused
accessibility screens with zero violations and zero incomplete findings.
