# Time Sovereignty

**An AI Chief of Staff that helps one meaningful goal survive contact with real life.**

## Inspiration

Most productivity tools are excellent at the first moment: they create a plan, divide it into tasks, and schedule reminders.

The harder moment comes later.

What happens when the action is delayed, the method is blocked, the user’s energy changes, or the original commitment no longer fits reality? A static planner usually repeats the same instruction. A general chatbot can discuss the problem, but it may not remember the commitment, notice a pattern, preserve the exact resume point, or return at the agreed time.

Time Sovereignty was built for that gap.

Its clearest acceptance was unexpectedly small. A user had bought drawing supplies but had not started drawing. She accepted a twenty-minute cup-sketch commitment. A real scheduled check-in returned on her phone, accepted a temporary photo and self-assessment, and GPT-5.6 recognized visible cup structure and the continuous-line approach without pretending to judge more than the evidence showed.

She finished a drawing.

That small change in real behavior became the product’s reason to exist: not another system that produces plans, but an AI Chief of Staff that stays with the goal when reality changes.

## What it does

Time Sovereignty begins with three natural questions:

1. What do you want?
2. When do you want it?
3. Why does it matter?

A real GPT-5.6 Goal Architect turns those answers into a specific proposal: the North Star, target window, first milestone, best next action, minimum version for a difficult day, completion criteria, and an appropriate rhythm such as a short sprint, finite project, or ongoing habit.

The proposal is not a permanent command. The user reviews it and approves a support agreement covering:

- check-in rhythm and quiet hours;
- preferred tone and intervention style;
- text, photo, and voice progress formats;
- conditions that should pause support;
- when firmer follow-up is allowed;
- what kind of feedback is actually useful.

When the action period begins, Cloud Tasks schedules a real follow-up. The private mobile lane can bring that follow-up back through the PWA and, in the final-day V2 branch, through a paired Android channel with FCM escalation and a full-screen incoming check-in.

The user can report progress with text, voice transcription, or an ephemeral photo. The system then routes only the Agents the situation requires:

- **Chief of Staff** classifies the evidence and chooses the smallest useful response.
- **Goal Architect** creates or meaningfully revises the plan.
- **Commitment Recovery** joins when the user is blocked, repeatedly delayed, or facing a genuine change in direction.
- **Memory Curator** runs after the visible response so memory processing does not add unnecessary mobile latency.

Possible outcomes include continuing, reducing the action, rescheduling, recalibrating, retiring a completed goal, or pausing with mercy when the user is sick or handling an emergency.

The user sees the structured decision before it is persisted. After confirmation, the system saves an immutable Episode, safe Agent traces, the operational resume point, an appropriately limited memory proposal, and any justified next follow-up.

## It is a loop, not a one-time answer

The core workflow is:

**goal and consent → scheduled action → real-world evidence → structured judgment → user confirmation → Episode and memory → next intervention**

Memory is deliberately layered instead of becoming an uncontrolled chat transcript.

Immutable Episodes record what happened. Derived summaries are separated into user-level and goal-level memory so one goal cannot contaminate another. Temporary physical or emotional conditions require expiry or later rechecking. One success can create only a tentative Strategy Card; it does not become a permanent claim about the user.

In the real two-check-in memory acceptance, a later Chief of Staff call retrieved exactly one relevant Strategy Card, received an explicit `LIMITED_EVIDENCE` instruction, changed its intervention accordingly, and updated confidence from 0.35 to 0.47 after a later success while preserving tentative status.

This is also a **Progress Witness and Self-Belief Loop**. Recognition is evidence-specific: the assistant explains what visibly worked, asks an optional reflection question when useful, and records the result without manufacturing confidence or generic praise.

## One product, two proof surfaces

Time Sovereignty separates the public evaluator experience from the owner’s private live lane.

| Surface | Purpose | Boundary |
| --- | --- | --- |
| **Public Demo Lab** | Compress a scripted thirty-day illustration journey into a fast evaluator experience | Browser-only fixtures, clearly marked mock traces, zero OpenAI API calls, no Firestore access, and no private phone data |
| **Private live lane** | Real onboarding, scheduling, Android follow-up, text/photo/voice evidence, GPT-5.6 decision, confirmation, memory, and next action | One paired owner device, protected Cloud Run endpoints, server-side secrets, and private Firestore state |
| **Routine tests** | Fast deterministic contract development | Mock provider behind the same strict Zod schemas |
| **Recorded live evidence** | Verify finalized contracts and cloud behavior | A small number of deliberate real calls with zero SDK retries |

The [original under-three-minute V1 submission video](https://youtu.be/d0cX1V4R7h4) remains the main competition video and truthfully shows the original submission state.

The [final-day V2 supplemental video](https://youtu.be/XPdfnJ6klu0) documents the protected Android follow-up work completed afterward. Its incoming-call screen is explicitly shown as a **native UI replay**. That replay demonstrates the interface, choices, stop path, and ring limit; it is not presented as proof that the particular displayed frame was delivered by the cloud. The real cloud-to-phone path is supported separately by redacted server timestamps, physical-device acceptance notes, and protected persistence evidence in the V2 branch.

The public [Demo Lab](https://live-mobile---time-sovereignty-defqnamrrq-de.a.run.app/demo) is safe for judges to open without an account, credential, API key, or rebuild. The private lane remains owner-only by design.

## The final day: closing the loop with a real person

The final-day V2 work focused on defects found by using the product on a physical phone instead of continuing to polish a script.

### Voice became an action layer

The voice experience previously transcribed the user and read text back. It now supports interruption, retains the relevant conversation context, and merges revisions by meaning.

For example, “make it once instead of five” changes the amount, while “do it in ten minutes” changes the timing. Those are two dimensions of one commitment, not two separate commitments. Amount and timing replace prior values; changed circumstances accumulate. When the meaning is genuinely ambiguous, the model must ask instead of guessing.

The voice layer is intentionally decisive. An earlier conversational version kept offering alternatives and asking how each one felt. Physical testing showed that this could turn the assistant into another comfortable place to keep deliberating. Time Sovereignty therefore optimizes ordinary intervention calls for a short concrete close: one viable action, a clear confirmation, then go do it. Explanations can still be complete when the user asks for them.

### It can address a real knowledge gap

When a spoken question depends on external or current facts, the voice layer can invoke a bounded `look_up` tool. The result names sources and describes weak or conflicting evidence honestly.

Search is opt-in and capped at two calls per spoken session. It is not used to search for the user’s own goal, history, or personal memory; the product already owns that state. Research results also remain separate from personal memory.

### It knows the limits of its hands

Earlier plans sometimes told the user to set several phone alarms or maintain a repetition counter, even though those interfaces did not exist. The planning boundary now states both what the product can do and what it must not promise.

The app can schedule and return its own check-in, escalate through the private Android channel, and process a response. It must not claim that it created phone alarms, calendar entries, or unsupported counters. The “next action” must be the physical action the user performs, not administrative work the assistant should have handled.

### Failures now explain themselves

A goal whose end date had passed could not create another follow-up. The backend rejected the request correctly, but the mobile button appeared to do nothing. That reason now reaches the user in plain language instead of becoming a silent failure.

## Redacted, test-accelerated physical acceptance

On 2026-07-21, Chloe completed a controlled physical acceptance with a real phone and a real glass of water.

To finish the full escalation path within the judging window, the private Cloud Run revision used `CATCH_V2_TEST_ESCALATION_SECONDS=15`. This was an explicit **test acceleration**, not the intended production cadence. The design cadence is measured in minutes; the fifteen-second override must be removed before ordinary post-competition use.

The redacted server timeline was:

```text
11:23:38  /api/live/check-ins/schedule            200
11:25:38  /api/tasks/live-checkins/{id}           200
11:25:50  /api/live/realtime/session              200
11:25:53  /api/tasks/catch-v2/.../levels/2        200
11:26:08  /api/tasks/catch-v2/.../levels/4        200
11:26:58  /api/live/check-ins/summary             200
11:27:16  /api/live/native/events/{id}/responses  200
11:32:08  /api/live/check-ins/{id}/confirm        200
```

The final persisted state was `CONFIRMED`, with memory disposition `DEFER`, completed curation, no recorded error, and two safe Agent traces.

The user drank the water. The assistant recognized the completed action, stored limited evidence, and moved on instead of continuing to nag.

This acceptance was physical and end to end, but the public evidence is intentionally redacted. It does not expose the device credential, FCM token, API key, raw private reply, prompt, photo, or private reasoning.

## How GPT-5.6 is used

GPT-5.6 is the structured decision brain of the live product.

The backend requests `gpt-5.6` through the OpenAI Responses API with strict Zod schemas, `store: false`, and zero automatic SDK retries. Recorded live calls returned `gpt-5.6-sol`.

GPT-5.6 creates goal plans, classifies progress evidence, determines when Recovery is necessary, proposes adapted commitments, produces bounded memory observations, and returns decisions the application can validate before persistence.

`gpt-realtime-2.1` has a narrower role. It is activated only when the user starts the live voice experience. It provides the interruptible spoken conversation and transcription layer. It is not invoked for every application request, and it does not replace GPT-5.6 as the structured decision boundary.

Developer mode exposes safe operational evidence such as provider, returned model, schema status, token usage, trace identifiers, record identifiers, and deployment revision. It excludes raw prompts, private reasoning, secrets, media, and raw user replies.

## How we built it

The mobile-first application uses Next.js, React, TypeScript, Zod, and Vitest. The live backend runs on Google Cloud Run in `asia-east1`. Cloud Tasks signs callbacks with Google OIDC. Firestore transactions store sessions, check-ins, leases, immutable Episodes, derived memory, and safe traces. Secret Manager supplies the OpenAI key only to the dedicated runtime identity.

The Android V2 channel uses protected one-time pairing, Android Keystore storage, FCM data messages, bounded notification escalation, and a visible permanent stop control. Incoming sound and vibration have a hard thirty-second limit, and reopening or leaving the native app stops app-owned alerts.

Idempotency is enforced through deterministic task names, one queue attempt, transactional leases, reply identities, completed receipts, and a separate memory-curation lease. Cloud Run is capped during judging, and the OpenAI SDK performs no automatic retries.

## How the development tools were used

Codex was the primary engineering environment from the clean repository through the core agent architecture, state machines, provider contracts, PWA, Cloud Run and Cloud Tasks path, Firestore schemas, protected Android channel, deployments, tests, and evidence chain.

Chloe supplied the product intent, performed physical acceptance, and repeatedly challenged assumptions when the interface or AI behavior did not make human sense.

When the primary Codex quota was exhausted on the final day, Claude Code continued from a documented handoff rather than recreating the project from conversation memory. It repaired defects found during live use, added the conversation-summary and bounded lookup paths, tightened capability and voice boundaries, and recorded the final physical acceptance. The handoff and resulting commits are preserved in the repository.

This distinction is deliberate and documented: Codex was the primary build environment; Claude Code performed a bounded final-day continuation; GPT-5.6 and, only when voice was invoked, `gpt-realtime-2.1` are the product’s runtime models.

## Challenges

- **A polished mock can hide a broken loop.** Physical testing found stale installed-PWA code, ignored replies, an expired-goal silent failure, a return-to-PWA navigation defect, and a client schema that allowed fewer safe traces than the server could validly return.
- **Cloud acceptance is not phone acceptance.** An FCM provider receipt was never treated as proof of visible ringing or full-screen Android behavior. Device UI outcomes were checked separately.
- **Memory can overgeneralize.** Episodes, user memory, goal memory, confidence, effectiveness, expiry, and user confirmation had to remain separate.
- **A persuasive assistant can become manipulative.** Quiet hours, pause conditions, bounded escalation, a permanent stop path, and explicit consent are part of the product contract.
- **Voice can become another form of procrastination.** The interaction was shortened around a concrete commitment instead of optimized for engagement.
- **Retries can multiply both cost and side effects.** Queue and SDK retries, Firestore leases, task naming, and read-after-write recovery had to be designed together.

## Accomplishments

- A real phone journey turned unused drawing supplies into a completed cup sketch.
- A later real check-in retrieved limited memory and updated its effectiveness without promoting it to permanent truth.
- A protected Android lane reached a physical phone with bounded sound, vibration, full-screen choices, and an always-visible stop path.
- A redacted final-day run connected Cloud Tasks, Realtime voice, Android response, GPT-5.6 decision, user confirmation, Episode persistence, memory, and follow-up state.
- Four strict structured Agent contracts maintain mock/live parity.
- The original V1 submission checkpoint passed **125 routine tests with 9 deliberate live-only tests skipped**.
- The final-day V2 branch passed **215 tests with 10 deliberate live-only tests skipped**, plus TypeScript, ESLint, production build, Android build, and targeted physical acceptance.
- The public Demo Lab provides a one-click evaluator story while making zero OpenAI API calls and reading no private state.

## What we learned

Longitudinal AI is a systems problem before it is a prompting problem.

The useful unit is not one impressive answer. It is a trustworthy loop across consent, state, time, evidence, recovery, memory, cost, and the next real action.

We also learned that recognition is functional. Specific, truthful feedback can help the user believe the next action is possible. But memory must earn confidence through repeated outcomes, not convert one success into a permanent personality claim.

Finally, “finding the user” is valuable only when the assistant also knows when to stop. Reachability without consent is surveillance; persistence without an exit is coercion. The product needs both hands: enough presence to protect the commitment, and enough restraint to return control immediately.

## Try it

Open the [public Demo Lab](https://live-mobile---time-sovereignty-defqnamrrq-de.a.run.app/demo):

1. Read the explicit scripted and zero-API boundary.
2. Run the full thirty-day story.
3. Open **Journey** to inspect delay, recovery, progress, memory, and recalibration.
4. Open **Developer** to inspect the schema-validated mock traces.

Then watch:

- [Original V1 submission video](https://youtu.be/d0cX1V4R7h4)
- [Final-day V2 supplemental video](https://youtu.be/XPdfnJ6klu0)
- [Public MIT repository](https://github.com/rainingsnow0914tw-ship-it/time-sovereignty-2026)
- [Final-day V2 source branch](https://github.com/rainingsnow0914tw-ship-it/time-sovereignty-2026/tree/codex/v2-private)

The owner-only live lane is intentionally not exposed as a public guest account. Judges do not need a credential or API key to inspect the public proof.

## What’s next

The immediate post-submission release task is to remove the fifteen-second escalation override and restore a humane production cadence.

After the judging snapshot is preserved, the original public branch and private V2 branch can be integrated carefully into one later product line. Longer real-world pilots can then measure which interventions genuinely help different users continue, which memories remain useful, and when an assistant should reduce, recalibrate, pause, or disappear.

Future adapters may include wearables, smart speakers, calendars, and richer research support—but only behind the same consent, trace, memory, and stop boundaries.
