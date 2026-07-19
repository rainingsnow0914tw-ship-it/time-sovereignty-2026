# V2 real follow-up memory retirement and Android gap evidence

Date: 2026-07-20 (Asia/Shanghai)

## Scope

This was a controlled continuation of the previously confirmed private S25
journey. It tested whether a later real follow-up could retrieve limited prior
evidence, accept the deliberately tiny commitment produced by the earlier
intervention, close the goal without inventing more work, and leave no next
Cloud Task.

No public V1 traffic, API key, device token, private reply text, raw prompt, or
private reasoning is included in this evidence.

## Preconditions

- Cloud Run private tags `v2-private` and `live-mobile` both served revision
  `time-sovereignty-00048-yuz` and returned health 200 with live provider mode.
- Public V1 remained revision `time-sovereignty-00024-dih` at 100% normal
  traffic.
- Exactly one active native device existed: Samsung `SM-S9380`, locale `zh-TW`,
  not revoked, not expired, with notification and full-screen consent.
- The existing follow-up was `SCHEDULED`; the queue contained only its one
  task.
- The event's quiet start was temporarily moved from `00:30` to `03:00` to
  permit this user-approved overnight acceptance. It was restored to
  `22:30–08:00` immediately after Level 4 delivery and before the user reply.

## Cloud delivery result

- The existing follow-up task was manually dispatched once.
- Level 1, Level 2, and Level 4 FCM receipts each reached `DELIVERED` with a
  provider receipt, using the deployed 15-second acceptance interval.
- The queue drained after Level 4.

Provider acceptance did **not** equal physical Android acceptance in this run.
Chloe observed one notification but no automatic full-screen launch, ringing,
or vibration. Firestore still showed the current check-in as `PENDING` with no
native response event. This physical wake/ring path therefore did not pass and
must not be represented as a successful repeat of the earlier lock-screen
acceptance.

## Navigation defects observed

1. Tapping through the native decision screen exposed a button labeled
   "return to PWA", but the implementation only called `finish()`. It returned
   to the native app home rather than opening the PWA.
2. The native home correctly identified itself as a local preview surface and
   provided no live reply field; Chloe did not use that preview button.
3. Opening the private origin without `?profile=play` correctly entered the
   empty `default` onboarding profile. The persisted real journey exists under
   the separate `play` local-storage key. Opening the exact
   `live-mobile` URL with `?profile=play` restored the existing cup-sketch
   journey without creating or pairing a new session.

## Real memory follow-up result

From the restored `play` PWA, Chloe completed the exact minimal action agreed
in the prior intervention and submitted it through the current pending
follow-up. The real decision then reported:

- assessment `COMPLETED`;
- strategy `RETIRE`;
- no next follow-up;
- no claim that a new photo or new sketch evidence had been observed.

Before confirmation, Firestore showed `DECISION_READY` and four retrieved
memory IDs. After Chloe confirmed completion:

- the check-in became `CONFIRMED`;
- one immutable Episode existed for the check-in;
- Memory Curator status became `COMPLETED`;
- `nextCheckInId` and `nextTaskName` remained null;
- the Cloud Tasks queue remained empty;
- quiet hours remained restored to `22:30–08:00`.

Two safe live Agent runs were attached:

| Agent | Provider | Model | Tokens | Status |
| --- | --- | --- | ---: | --- |
| Chief of Staff | `openai` | `gpt-5.6-sol` | 1,850 | `COMPLETED` |
| Memory Curator | `openai` | `gpt-5.6-sol` | 1,486 | `COMPLETED` |

Total live token usage for this follow-up was 3,336.

## Acceptance judgment

- **Passed:** later real follow-up, retrieval of limited prior memory, truthful
  completion assessment, user confirmation, Episode persistence, asynchronous
  memory curation, and code-enforced absence of a next task after `RETIRE`.
- **Failed in this run:** unattended Android full-screen wake/ring/vibration.
- **Confirmed implementation defect:** the native "return to PWA" control does
  not navigate to the PWA.

## Exact repair start

1. Replace the misleading native finish-only control with a safe explicit
   return path to the private `live-mobile/?profile=play` surface, preserving
   the existing no-secret boundary.
2. Add deterministic navigation coverage and rebuild the private APK.
3. Connect only the S25 (`SM-S9380`) by USB, reproduce a locked/background
   delivery, and capture the smallest relevant Android logs and notification
   channel/app-op state to determine why this run did not launch Level 4.
4. Repeat one physical delivery acceptance without calling GPT-5.6 unless a
   real user response is required.
