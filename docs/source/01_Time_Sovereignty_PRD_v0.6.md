# Time Sovereignty

## Product Requirements Document v0.6
### OpenAI Build Week — Product Source of Truth

**Document status:** Approved product direction for Build Week implementation  
**Primary audience:** Codex, product owner, reviewers, future contributors  
**Working name:** Time Sovereignty  
**Product category:** AI Life Chief of Staff for Long-Term Goal Execution  
**Primary platform:** Mobile-first Progressive Web App (PWA)  
**Primary model:** GPT-5.6 as the Chief of Staff Agent  
**Backend:** Google Cloud

> **Take back your time from algorithms—and give it back to the life you chose.**

---

# 1. Executive Summary

Time Sovereignty is an AI life companion that helps users protect long-term goals from distraction, anxiety, interruptions, fatigue, and repeated abandonment.

Most AI systems are already good at planning or completing isolated tasks. They can write reports, generate travel itineraries, search the web, process email, create presentations, or execute computer workflows. However, they do not usually remain responsible for what happens after the plan is created.

Time Sovereignty focuses on the missing layer:

- remembering what the user is trying to become;
- translating long-term direction into actionable steps;
- proactively reaching out instead of waiting passively;
- understanding why the user delayed, resisted, or stopped;
- adapting the method without automatically abandoning the direction;
- receiving photos, audio, video, files, and other progress updates;
- responding to the actual work with useful feedback and recognition;
- learning which intervention styles help this specific user;
- preserving a reliable long-term memory and revision history;
- reconnecting interrupted work through a clear resume point;
- periodically checking whether the original goal still fits the user.

The product is not a stricter reminder app. It is a flexible, memory-backed, voice-enabled execution partner.

---

# 2. Product Vision

External algorithms are constantly optimized to capture the user’s next minute through urgency, novelty, scarcity, social comparison, and endless feeds.

At the same time, ordinary AI tools often generate fragmented outputs. The human still has to collect the pieces, remember the larger purpose, determine priority, and restart after every interruption.

Time Sovereignty reverses that relationship.

It should remember the user’s chosen direction, protect relevant time, assemble fragmented work into a coherent path, and help the user continue when real life disrupts the plan.

The product does not claim that AI can live a person’s life or guarantee success.

It claims that AI can help protect the time, continuity, feedback, and adaptive support required to build that life.

---

# 3. Core Product Thesis

Planning is not the main product.

Free and paid AI systems can already generate:

- study plans;
- exercise schedules;
- travel itineraries;
- project roadmaps;
- daily task lists;
- short-, medium-, and long-term plans.

The practical failure usually happens later:

- the user never starts;
- the user completes only the first few days;
- the task is interrupted and never resumed;
- the plan is too difficult, too easy, or too boring;
- the chosen time repeatedly conflicts with real life;
- the user becomes tired, anxious, injured, or discouraged;
- an urgent event displaces an important commitment;
- the user receives no meaningful acknowledgment or feedback;
- the system continues to reschedule without understanding the pattern;
- the original goal becomes outdated, but nobody explicitly revisits it.

Therefore:

> **The product begins where the plan stops working.**

---

# 4. Product Definition

Time Sovereignty is a proactive AI Chief of Staff that:

1. remembers the user’s long-term direction;
2. creates an initial goal path;
3. agrees with the user on how support and check-ins should work;
4. actively reaches out at relevant moments;
5. accepts reasonable delay when circumstances change;
6. detects repeated delay as a pattern requiring investigation;
7. explores the reason behind resistance or interruption;
8. adapts timing, task size, method, tone, or goal;
9. receives and responds to user progress through multiple media;
10. records what worked;
11. restores interrupted context with a resume point;
12. revisits whether the direction is still correct.

---

# 5. Product Promise

> **Important goals may be reduced, rerouted, paused, or consciously retired—but they should not disappear without understanding why.**

The system does not protect every old task forever.

It protects goals the user still confirms as meaningful.

A conscious decision to stop an outdated goal can be an act of time sovereignty.

---

# 6. What Makes the Product Different

## 6.1 Existing Product Strengths We Can Reuse

The product should learn from established patterns rather than recreate every wheel.

- **Motion:** automatic scheduling and reduced manual rearrangement.
- **Reclaim:** flexible protection of important time and habits.
- **Sunsama:** calm daily planning and realistic workload presentation.
- **Fabulous:** journey framing, small actions, and emotionally engaging progress.

## 6.2 The Missing Layer

Time Sovereignty adds capabilities these categories do not make central:

- proactive execution support after planning;
- voice-enabled check-ins;
- resistance and interruption diagnosis;
- repeated-delay pattern detection;
- adaptive support agreements;
- progress sharing through photos, videos, audio, files, and code evidence;
- concrete AI feedback on what the user shared;
- long-term strategy memory;
- resume points;
- goal drift detection and calibration;
- a full interaction history connecting planning, action, interruption, adjustment, evidence, and continuation.

---

# 7. Product Scope Model

The architecture should remain broad enough to support the full product vision.

Build Week limits implementation depth, not product ambition.

Every major module must be assigned one status:

- `IMPLEMENTED_IN_MVP`
- `INTERFACE_PREPARED`
- `FUTURE`

The repository and architecture must preserve interfaces for future modules even when their internal implementation is deferred.

This is equivalent to constructing the building layout, doors, and utility connections while only finishing selected rooms.

## 7.1 Build Week Must Prove

The Build Week implementation must demonstrate a real end-to-end loop:

```text
Goal creation
→ initial plan
→ support agreement
→ scheduled voice-enabled check-in
→ user delay, resistance, or interruption
→ reason exploration
→ adaptive strategy
→ new commitment
→ progress sharing
→ specific AI feedback
→ memory update
→ later follow-up using retrieved memory
```

## 7.2 Build Week Does Not Need to Prove

- that a person truly mastered Japanese in one week;
- that a health habit remains effective for months;
- that all planned integrations are production-ready;
- that every future sub-agent has been implemented;
- that the system can guarantee completion of any life goal.

Longitudinal behavior will be demonstrated through real Build Week usage and an accelerated simulation mode.

---

# 8. Behavioral Model

The product must not be driven by a large rigid rulebook.

Behavior is organized into three layers.

## 8.1 Guardrails

Guardrails are few, explicit, and designed to protect user safety, autonomy, and trust.

- The user remains the final decision-maker.
- The AI must not silently rewrite the user’s life direction.
- AI inference must not be stored as confirmed user truth.
- The system must not use humiliation, threats, or malicious emotional manipulation.
- Clear health and safety concerns take priority over productivity.
- The user may pause, modify, or retire a goal.
- Major goal changes require user confirmation.
- The user may reduce or disable proactive intervention.
- Quiet hours and notification preferences must be respected.
- The product must not claim medical or professional certainty it does not possess.

## 8.2 Principles

Principles guide judgment but do not prescribe one fixed response.

- Understand before pushing.
- Refusal is a signal, not an automatic command to quit or intensify pressure.
- The direction may be revalidated; the method may change freely.
- One interruption should not silently become permanent abandonment.
- Today’s plan should not destroy tomorrow’s ability to continue.
- Reduce cognitive load rather than create another management burden.
- Prefer actions aligned with the person the user wants to become.
- Small actions are valid when they create real continuity.
- The AI’s intervention method must also be evaluated and improved.
- Praise should be specific, sincere, and grounded in what was shared.
- Repeated delay is a pattern to understand, not a reason to shame.
- Consciously ending the wrong goal may be a successful outcome.

## 8.3 Dynamic Strategies

GPT-5.6 chooses context-sensitive strategies using:

- long-term direction;
- active goal;
- current milestone;
- immediate situation;
- health or emotional state;
- user response;
- prior episodes;
- previous intervention effectiveness;
- support agreement;
- timing history;
- sub-agent recommendations;
- guardrails and principles.

Possible strategies include:

- gentle reminder;
- direct question;
- voice check-in;
- smaller action;
- higher or lower difficulty;
- different learning or execution method;
- reschedule with a specific new follow-up;
- alternate action;
- recovery checkpoint;
- motivation reconnection;
- praise and concrete feedback;
- goal recalibration;
- temporary silence;
- different tone or frequency;
- formal goal retirement.

The model should not be replaced by a large fixed if/else tree.

However, model decisions must use structured outputs, explicit state transitions, and test scenarios.

---

# 9. Primary User

The initial target includes people with multiple long-term goals who are easily disrupted by high-pressure work, external demands, or fragmented attention:

- independent developers;
- creators;
- professionals;
- founders;
- long-term learners;
- users with repeated abandonment patterns;
- users who lack a private assistant, coach, or support team.

The first real test user is Chloe.

Initial real-life scenarios include:

- OpenAI Build Week;
- AI product development;
- health protection during long development sessions;
- English and Japanese learning;
- medical continuing education;
- fiction writing;
- AI and medical knowledge monitoring.

---

# 10. First-Time User Experience

The system must not begin with a long life-planning questionnaire.

It asks three questions, one at a time.

## 10.1 Question One

> **What do you want to achieve?**

Natural and incomplete answers are allowed.

Examples:

- I want to learn Japanese.
- I want to finish this hackathon.
- I want to exercise consistently.
- I want to become excellent at AI product design.

## 10.2 Question Two

> **When would you like to achieve it?**

Approximate answers are accepted.

Examples:

- in seven days;
- before November;
- within one year;
- there is no hard deadline, but I do not want to keep delaying.

## 10.3 Question Three

> **Why does this matter to you?**

This becomes the initial motivation memory.

The motivation should later be revisited when the user is discouraged, repeatedly delaying, or reconsidering the goal.

---

# 11. Goal Architect Output

After onboarding, the Goal Architect Agent produces a concise initial plan:

- goal summary;
- motivation;
- target window;
- feasibility notes;
- first milestone;
- best next action;
- minimum viable action;
- initial check-in proposal;
- assumptions that need user confirmation.

The first plan is a hypothesis, not a permanent contract.

The system should not produce an excessively detailed multi-month calendar unless the user asks for one.

---

# 12. Goal Confirmation UI

The user reviews:

- Goal
- Why it matters
- Target window
- First milestone
- Best next action
- Minimum viable action
- Initial assumptions

Actions:

- `Confirm`
- `Adjust`
- `Tell AI what feels wrong`

The AI must confirm that it understood the user before it begins proactive support.

---

# 13. Support Agreement

After plan confirmation, the AI and user establish how support will work.

The support agreement includes:

- check-in frequency;
- preferred check-in time;
- quiet hours;
- intervention intensity;
- preferred tone;
- allowed channels;
- progress-sharing formats;
- desired feedback style;
- pause conditions;
- conditions under which stronger follow-up is acceptable;
- review frequency for whether the support method is working.

Example:

```text
How I’ll support you

• I’ll check in every evening at 7:30 PM.
• A check-in will include text and a tap-to-play voice message.
• If you are busy, you may delay once and choose a new time.
• If the same action is repeatedly delayed, I’ll ask whether the time,
  task size, method, or goal needs adjustment.
• You can reply by voice, text, photo, short video, file, or progress link.
• I’ll respond to what you share and remember what helps.
• I will not contact you during quiet hours.
```

The agreement is editable at any time.

The user remains in control of notification intensity.

---

# 14. Core User Experience

## 14.1 Today Screen

The primary daily screen should be calm and focused.

It displays:

- North Star
- Current Goal
- Current Milestone
- Best Next Action
- Why this action matters
- Minimum viable version
- Protected minimums
- Next check-in
- Current resume point, if relevant

Primary actions:

- `Start`
- `Done`
- `Share Progress`
- `Too Difficult`
- `Not Now`
- `Something Changed`

The UI should avoid presenting a large task dump by default.

The AI holds other commitments and reveals them when useful.

## 14.2 Incoming Check-In

A scheduled check-in should feel more noticeable than an ordinary silent notification.

MVP behavior:

1. a text notification appears;
2. the notification includes or opens a tap-to-play TTS message;
3. the PWA shows an incoming-check-in interface;
4. the user may reply with voice or text;
5. the response enters the intervention flow;
6. the AI may answer with text and TTS.

Real telephony is not required for MVP, but the architecture must preserve an interface for future call channels.

---

# 15. Voice and TTS Requirements

Voice is a core capability, not an optional decoration.

## 15.1 Required MVP Capabilities

- Text notifications.
- Tap-to-play TTS for check-ins.
- Voice input from the user.
- Speech-to-text transcription.
- Text response from the main agent.
- Tap-to-play or automatic in-app TTS response, subject to browser permission and user preference.
- Voice preference stored in the support agreement.
- Quiet-hour enforcement.

## 15.2 Future Interfaces

- real outbound phone calls;
- incoming-call-style lock-screen integration;
- messaging-platform voice messages;
- wearable audio prompts;
- custom voice personas.

These should be marked `INTERFACE_PREPARED` or `FUTURE`.

---

# 16. Active Intervention Loop

```text
Plan
→ Observe
→ Proactively reach out
→ Receive user response
→ Understand what changed
→ Adapt the strategy
→ Confirm a new commitment
→ Follow up
→ Evaluate intervention effectiveness
→ Update memory and future strategy
```

## 16.1 Trigger Sources

- `next_check_at` reached;
- action overdue without update;
- user explicitly resists;
- action marked interrupted;
- recovery condition reached;
- repeated delay threshold reached;
- test-mode simulated time event;
- periodic goal calibration.

## 16.2 Reach-Out Behavior

The Chief of Staff reads relevant context before generating the message.

Examples:

> You planned to finish the recovery flow tonight. Are you still at the same checkpoint?

> You have been developing for a long stretch. Your health minimum has not been recorded yet. Would you like to do the thirty-second version now?

The message should include TTS support.

---

# 17. Delay Handling

A single delay is not automatically a problem.

The user may genuinely be busy or responding to an unexpected event.

## 17.1 First Delay

The AI should:

- accept the delay;
- ask for or propose a new time;
- update the next check-in;
- avoid guilt or interrogation.

## 17.2 Repeated Delay

Repeated delay must trigger pattern analysis.

The system should examine:

- whether the scheduled time is consistently wrong;
- whether the action is too large;
- whether the method is unpleasant;
- whether the reminder tone is ineffective;
- whether fatigue or health is involved;
- whether another responsibility repeatedly conflicts;
- whether motivation has changed;
- whether the goal remains meaningful.

Example:

> I noticed this has been delayed three times around 7 PM. This may be a scheduling problem rather than a motivation problem. Should we move it to the morning, shorten the action, or reconsider the plan?

## 17.3 Delay Pattern Data

Store:

- number of delays;
- delay timestamps;
- original and revised times;
- stated reasons;
- action size;
- intervention channel;
- tone;
- eventual outcome;
- user rating of the intervention.

The repeated-delay threshold should be configurable rather than permanently hard-coded.

---

# 18. Resistance and Interruption Understanding

When a user does not act, the system should explore possible reasons without prematurely labeling the person.

Possible temporary interpretations:

- physical discomfort;
- unexpected urgent event;
- fatigue;
- emotional overload;
- task too difficult;
- task too easy or boring;
- unclear first step;
- missing resource;
- interruption with lost context;
- reduced motivation;
- outdated goal;
- simple temporary reluctance;
- unknown reason.

The Commitment Recovery Agent returns a structured hypothesis, confidence, clarification need, and strategy candidates.

Example:

```json
{
  "possible_reason": "timing_conflict",
  "confidence": 0.68,
  "needs_clarification": true,
  "suggested_question": "What usually happens around this time?",
  "strategy_candidates": [
    "reschedule",
    "reduce_action",
    "change_channel"
  ]
}
```

---

# 19. Adaptive Strategy Outcomes

The system may choose:

- `CONTINUE`
- `REDUCE`
- `REPLACE`
- `RESUME`
- `RESCHEDULE`
- `RECALIBRATE`
- `PAUSE`
- `RETIRE`

Every new strategy must produce:

- a clear next action;
- a minimum version;
- a follow-up time or recovery condition;
- an optional sharing request;
- a short explanation tied to the user’s direction.

---

# 20. Progress Witness Loop

```text
Plan
→ Act
→ Share
→ Be Seen
→ Receive Feedback
→ Reflect
→ Adapt
→ Continue
```

User submissions are not only compliance evidence.

They are acts of sharing and opportunities for meaningful interaction.

The AI acts as a consistent witness to effort, progress, difficulty, and growth.

## 20.1 Supported Progress Formats

- text update;
- photo;
- short video;
- voice update;
- document;
- Git commit hash or URL;
- test output;
- project screenshot;
- external result link.

## 20.2 AI Response Requirements

After receiving progress, the AI should:

1. describe what it actually observed;
2. acknowledge the action;
3. give specific, grounded recognition;
4. provide useful feedback when supported;
5. express uncertainty when needed;
6. connect the action to the user’s current goal;
7. store the progress entry;
8. suggest the next reasonable step;
9. learn whether this style of feedback motivates or pressures the user.

Empty praise should be avoided.

Example:

> I can see that you completed the thirty-second bridge exercise. The important part today is that you protected continuity during a high-pressure development day. You kept the health commitment alive without abandoning the hackathon.

---

# 21. Evidence and Feedback Boundaries

The product assumes users are voluntarily using the system and does not treat them as suspects.

Progress media supports accountability, interaction, and memory.

Suggested confidence levels:

- `SELF_REPORTED`
- `SUPPORTED`
- `STRONGLY_SUPPORTED`
- `UNVERIFIABLE`

For physical activity:

The MVP may:

- identify whether the content appears related to the intended activity;
- describe directly observable details;
- provide general safety reminders;
- ask whether the user feels pain;
- encourage a clearer angle or professional review when necessary.

The MVP must not:

- claim perfect posture analysis from a single image;
- guarantee safety;
- make medical diagnoses;
- replace a coach, therapist, or physician;
- state uncertain observations as facts.

---

# 22. Resume Point

An interrupted task should preserve a compact resume card.

Example:

```text
Task
Implement commitment recovery flow

Last completed checkpoint
API route and request schema created

Current blocker
Firestore payload does not match the schema

Next physical action
Run the failing test and inspect the payload

Related files
app/api/recovery/route.ts
lib/schemas/intervention.ts
```

The resume point may be generated from:

- user report;
- code or tool state;
- recent commits;
- current document position;
- agent summary.

The purpose is to restore thought, not merely reschedule time.

---

# 23. Intervention State Machine

Each action must have an explicit state.

```text
PLANNED
→ READY
→ IN_PROGRESS
→ AWAITING_UPDATE
→ CHECK_IN_DUE
→ USER_RESPONDED
→ ADAPTING
→ RESCHEDULED
→ COMPLETED
```

Alternative states:

- `PAUSED`
- `RETIRED`
- `CANCELLED`

Rules:

- one active pending intervention per action;
- completed, paused, retired, or cancelled actions must not continue producing reminders;
- each check-in has a unique `intervention_id`;
- duplicate delivery must not create duplicate notifications;
- a user response closes or updates the active intervention;
- a new follow-up is created only after a new commitment is confirmed;
- handlers must be idempotent.

---

# 24. Intervention Effectiveness Review

The system evaluates not only whether the user acted, but whether the method of support helped.

Record:

- trigger;
- channel;
- voice or text;
- tone;
- original action;
- user response;
- interpreted reason;
- strategy used;
- new action;
- acceptance;
- completion;
- user sentiment;
- user rating of the intervention;
- whether the user felt helped, pressured, or annoyed;
- next adjustment.

The AI must not be the sole judge of its own effectiveness.

User feedback is the primary signal.

---

# 25. Memory Architecture

Model conversation context is not the only memory source.

Important state must be stored in the application database.

## 25.1 North Star Memory

- person the user wants to become;
- long-term direction;
- core motivation;
- non-negotiable boundaries.

Major updates require user confirmation.

## 25.2 Goal Memory

- goal;
- target window;
- milestones;
- next action;
- status;
- next check-in;
- related support agreement.

## 25.3 Episode Memory

- what happened;
- interruption reason;
- AI intervention;
- user response;
- outcome.

## 25.4 Strategy Memory

- effective reminder styles;
- ineffective approaches;
- preferred tone;
- effective action size;
- common blockers;
- useful feedback formats;
- repeated-delay patterns.

## 25.5 Progress Memory

- submitted media;
- transcript;
- AI feedback;
- user response;
- goal linkage;
- progress confidence.

## 25.6 Support Agreement Memory

- check-in settings;
- channels;
- quiet hours;
- intervention intensity;
- voice preferences;
- sharing methods;
- feedback preferences.

## 25.7 Goal Revision Log

- previous goal version;
- new version;
- reason;
- proposer;
- user confirmation;
- effective date.

## 25.8 Resume Memory

- last checkpoint;
- blocker;
- next physical action;
- related resources.

---

# 26. Memory Trust and Correction

Each memory record must include a source type:

- `CONFIRMED_BY_USER`
- `OBSERVED_PATTERN`
- `AI_HYPOTHESIS`
- `EXTERNAL_SOURCE`

Recommended metadata:

- confidence;
- created time;
- last confirmed time;
- validity window;
- superseded record;
- evidence references;
- sensitivity;
- user-editable flag.

The UI should include:

> **What I currently understand about you**

The user can:

- confirm;
- correct;
- mark outdated;
- delete.

AI hypotheses must not silently become confirmed facts.

---

# 27. Goal Calibration

The system periodically asks:

1. Is this still a goal you want?
2. Did recent actions move you closer?
3. What consumed time without enough value?
4. Is the current method still appropriate?
5. Should the goal continue, shrink, reroute, pause, or end?

Goal states:

- `ACTIVE`
- `RESIZED`
- `REROUTED`
- `PAUSED`
- `RETIRED`
- `COMPLETED`

Goal calibration may be manually triggered, scheduled, or simulated.

---

# 28. Agent Architecture

## 28.1 Chief of Staff Agent — GPT-5.6

Status: `IMPLEMENTED_IN_MVP`

Responsibilities:

- understand user input;
- retrieve relevant memory;
- decide whether sub-agents are needed;
- dispatch sub-agents;
- synthesize results;
- choose intervention strategy;
- produce one unified user response;
- create the next follow-up;
- propose memory updates;
- enforce guardrails and support agreement.

Only the Chief of Staff directly conducts the main user conversation.

## 28.2 Goal Architect Agent

Status: `IMPLEMENTED_IN_MVP`

Responsibilities:

- evaluate goal clarity and feasibility;
- create milestones;
- propose next and minimum actions;
- suggest initial check-in rhythm;
- identify assumptions requiring confirmation.

## 28.3 Commitment Recovery Agent

Status: `IMPLEMENTED_IN_MVP`

Responsibilities:

- analyze resistance, delay, interruption, and burnout;
- suggest clarification questions;
- propose recovery strategies;
- recommend new follow-up timing;
- detect repeated-delay patterns.

## 28.4 Memory Curator Agent

Status: `IMPLEMENTED_IN_MVP`

Responsibilities:

- summarize important episodes;
- distinguish fact, observation, and hypothesis;
- propose memory creation, update, or invalidation;
- preserve goal revision history;
- avoid silently changing the North Star.

## 28.5 Time Guardian Agent

Status: `INTERFACE_PREPARED`

Future responsibilities:

- detect fake urgency;
- assess attention theft;
- evaluate whether external requests deserve time;
- protect important non-urgent work.

## 28.6 Health Boundary Agent

Status: `INTERFACE_PREPARED`

Future responsibilities:

- protect sustainable capacity;
- monitor health minimums;
- distinguish productivity pressure from health constraints;
- suggest non-diagnostic alternatives.

## 28.7 Progress Feedback Agent

Status: `INTERFACE_PREPARED`

Future responsibilities:

- analyze progress media;
- generate grounded feedback;
- estimate support level;
- handle specialized content feedback.

MVP feedback may be handled by the Chief of Staff using multimodal input.

## 28.8 Research and Monitoring Agents

Status: `FUTURE`

Examples:

- hackathon monitoring;
- medical knowledge monitoring;
- email monitoring;
- calendar monitoring;
- learning-resource research.

---

# 29. Services, Not Agents

The following should be ordinary application services:

- context retrieval;
- scheduler;
- notification delivery;
- TTS adapter;
- speech-to-text adapter;
- media upload;
- media storage;
- authentication;
- agent trace logging;
- simulation clock;
- idempotency and task deduplication;
- provider adapters.

Avoid creating agents only to make the architecture appear more complex.

---

# 30. Google Cloud Architecture

## 30.1 Cloud Run

Status: `IMPLEMENTED_IN_MVP`

Runs:

- PWA backend/API;
- Chief of Staff orchestration;
- sub-agent calls;
- scheduled intervention endpoint;
- simulation endpoints;
- media processing requests;
- webhook handlers.

## 30.2 Firestore

Status: `IMPLEMENTED_IN_MVP`

Collections:

```text
users
north_stars
goals
milestones
actions
support_agreements
interventions
memories
progress_entries
resume_points
goal_revisions
agent_runs
simulation_runs
```

## 30.3 Cloud Tasks

Status: `IMPLEMENTED_IN_MVP` or a compatible local adapter during early development

Used for individual future check-ins.

Each task calls a Cloud Run endpoint with a unique intervention identifier.

## 30.4 Cloud Scheduler

Status: `INTERFACE_PREPARED` or `IMPLEMENTED_IN_MVP` for one simple recurring job

Used for:

- periodic goal calibration;
- failed-task scanning;
- cleanup;
- health checks.

## 30.5 Cloud Storage

Status: `IMPLEMENTED_IN_MVP`

Stores:

- photos;
- short videos;
- audio;
- documents.

Firestore stores metadata and object references.

## 30.6 Secret Manager

Status: `IMPLEMENTED_IN_MVP`

Stores:

- OpenAI API key;
- service secrets;
- environment-specific credentials.

## 30.7 Authentication

Status: `INTERFACE_PREPARED`

MVP may use a simple demo-user flow if full authentication threatens delivery.

The repository should preserve a clean authentication boundary.

---

# 31. Model and Provider Integration

## 31.1 Live Mode

- GPT-5.6 is used by the completed product.
- The Chief of Staff and real sub-agent calls use structured outputs.
- Agent runs are logged.
- Memory is retrieved and updated.
- Multimodal progress input is supported where available.

## 31.2 Mock Mode

The provider adapter must support mock mode before API access is available.

Mock and live modes must share the same schemas.

Mock mode may support deterministic test scenarios.

It must not be presented as the final live competition demo.

## 31.3 Audio Providers

Use adapters rather than tightly coupling the app to one implementation.

Interfaces:

- `SpeechToTextProvider`
- `TextToSpeechProvider`
- `NotificationProvider`
- `CallChannelProvider` for future telephony

---

# 32. Mobile-First PWA Screens

## Screen 1 — Goal Intake

Three questions, one at a time.

Supports text and voice.

## Screen 2 — Goal Confirmation

Shows:

- goal;
- motivation;
- target;
- first milestone;
- best next action;
- minimum action.

## Screen 3 — Support Agreement

Shows:

- frequency;
- check-in time;
- quiet hours;
- tone;
- voice setting;
- allowed channels;
- progress-sharing formats;
- feedback style.

## Screen 4 — Today

Shows:

- North Star;
- goal;
- milestone;
- best next action;
- why it matters;
- minimum version;
- protected minimum;
- next check-in;
- resume point.

## Screen 5 — Incoming Check-In

Shows:

- text prompt;
- play-voice button;
- reply by voice;
- reply by text;
- delay option;
- “something changed” option.

## Screen 6 — Recovery Conversation

Supports quick reason options and free natural conversation.

## Screen 7 — Share Progress

Upload or record:

- text;
- photo;
- short video;
- voice;
- file;
- link.

## Screen 8 — Journey

Shows:

- goal creation;
- check-ins;
- delays;
- interruptions;
- adaptations;
- shared progress;
- AI feedback;
- resume points;
- goal revisions.

Developer mode adds Agent Run Trace.

## Screen 9 — Memory Review

Status: `INTERFACE_PREPARED`

Shows what the system currently understands and allows correction.

---

# 33. Accelerated Longitudinal Simulation

Build Week cannot naturally demonstrate months of behavior.

The product must include an accelerated simulation mode.

Only time is accelerated.

The following remain real:

- GPT-5.6 calls;
- sub-agent dispatch;
- memory retrieval and updates;
- intervention state transitions;
- delay handling;
- progress sharing;
- feedback;
- goal calibration;
- agent traces.

Example:

```text
Simulated Day 1
Goal created and support agreement confirmed

Simulated Day 2
First action completed and shared

Simulated Day 3
User delays once because of urgent work

Simulated Day 4
User delays again

Simulated Day 5
System detects a repeated timing conflict and changes the plan

Simulated Day 8
User completes the smaller action and shares audio evidence

Simulated Day 14
Goal calibration confirms the direction but changes the method

Simulated Day 30
Journey shows accumulated progress and strategy learning
```

The UI must clearly label accelerated time.

The system may also include Chloe’s real Build Week records.

---

# 34. Primary Competition Demo

1. Chloe creates the Build Week goal.
2. She provides a deadline and motivation.
3. Goal Architect generates the first milestone.
4. Chloe confirms the plan.
5. Chloe confirms the support agreement, including voice check-ins.
6. The system saves the goal and health boundary.
7. A scheduled event triggers a text and TTS check-in.
8. Chloe delays because she is busy.
9. The delay is accepted and rescheduled.
10. Accelerated time triggers repeated delay.
11. Commitment Recovery detects the pattern and asks whether the time, task size, or method is wrong.
12. Chloe explains the real reason.
13. The AI changes the action.
14. Chloe completes the smaller or alternative action.
15. Chloe shares a photo, video, voice update, file, or code evidence.
16. The AI responds specifically and positively.
17. The result and intervention effectiveness are stored.
18. Time advances.
19. The AI retrieves the previous pattern and follows up correctly.
20. Journey displays the full longitudinal story.
21. Developer mode displays real agent calls and memory updates.

---

# 35. MVP Implementation Matrix

## Implemented in MVP

- mobile-first PWA;
- three-question onboarding;
- goal confirmation;
- support agreement;
- Chief of Staff Agent using GPT-5.6;
- Goal Architect Agent;
- Commitment Recovery Agent;
- Memory Curator Agent;
- Firestore persistence;
- structured memory;
- text notification;
- tap-to-play TTS;
- voice input and transcription;
- intervention state machine;
- single-delay rescheduling;
- repeated-delay pattern detection;
- adaptive recovery;
- progress sharing through at least text, photo, and voice;
- specific AI feedback;
- resume point;
- intervention-effectiveness record;
- accelerated longitudinal simulation;
- journey timeline;
- developer agent trace;
- Cloud Run deployment;
- mock/live provider adapters.

## Interface Prepared

- Time Guardian Agent;
- Health Boundary Agent;
- Progress Feedback Agent;
- full authentication;
- Cloud Scheduler recurring calibration;
- true browser push across all devices;
- real outbound call provider;
- email and calendar connectors;
- wearable channels;
- multi-goal prioritization.

## Future

- full A2A protocol;
- multi-company agent ecosystem;
- enterprise administration;
- native mobile apps;
- social network;
- advanced posture or skill analysis;
- medical decision support;
- autonomous cross-platform monitoring;
- mastery certification.

---

# 36. Acceptance Criteria

The MVP is complete when:

1. A user can create a goal through three questions.
2. GPT-5.6 returns a structured initial plan.
3. The user can confirm or modify it.
4. The user can configure a support agreement.
5. Goal, support, and memory data are stored outside model context.
6. A future check-in can be scheduled.
7. A check-in can trigger a Cloud Run endpoint or equivalent test adapter.
8. The check-in includes text and tap-to-play TTS.
9. The user can reply by voice or text.
10. One delay is accepted and rescheduled.
11. Repeated delays trigger pattern investigation.
12. The main agent can call a real sub-agent.
13. At least three resistance causes produce different strategies.
14. The system creates a new commitment and follow-up.
15. The user can share at least three progress formats.
16. The AI gives specific feedback on shared progress.
17. The result is stored.
18. Relevant memory is retrieved during the next interaction.
19. A resume point can be created and displayed.
20. The user can rate intervention effectiveness.
21. A goal calibration can be performed.
22. Accelerated simulation can demonstrate at least seven simulated days.
23. Journey displays the longitudinal loop.
24. Developer mode displays agent run traces.
25. Live mode uses GPT-5.6.
26. The app is deployed and testable.
27. The README explains setup, mock mode, live mode, simulation, and demo.
28. The repository preserves Codex evidence and the required Session ID.

---

# 37. Explicit Non-Goals for Build Week

Do not block delivery on:

- full Gmail integration;
- full Google Calendar integration;
- real telephony;
- wearables;
- medical diagnosis;
- perfect exercise-form analysis;
- full A2A;
- all future agents;
- multi-user enterprise administration;
- native iOS or Android apps;
- complex analytics;
- social features;
- proof that a user mastered a skill over real months;
- a guarantee that users will achieve all goals.

---

# 38. Codex Development Role

Codex is expected to participate in:

- repository understanding;
- architecture review;
- implementation planning;
- schema design;
- project scaffolding;
- main agent and sub-agent implementation;
- provider adapters;
- state machine implementation;
- Firestore integration;
- Cloud Tasks scheduling;
- TTS and speech input integration;
- simulation mode;
- UI implementation;
- testing;
- debugging;
- Cloud Run deployment;
- English README;
- demo preparation;
- commit discipline;
- development trace and Session ID preservation.

---

# 39. Required Vertical Slice

Before expanding the product, complete this flow:

```text
Create goal
→ confirm plan
→ confirm support agreement
→ save to Firestore
→ schedule voice-enabled check-in
→ user delays
→ reschedule once
→ repeated delay detected
→ reason explored
→ strategy adapted
→ new commitment confirmed
→ user shares progress
→ AI gives specific feedback
→ outcome stored
→ memory retrieved
→ follow-up triggered
```

This vertical slice is the beating heart of the product.

---

# 40. Final Product Story

External algorithms learn how to take the user’s next minute.

Ordinary AI can create plans and finish isolated pieces of work, but the user is still left to preserve direction, integrate fragments, restart after interruption, and continue without being seen.

Time Sovereignty remembers what the user is trying to become.

It reaches out with a voice.

It respects a real delay.

It notices when delay becomes a pattern.

It asks what changed.

It adapts the method.

It sees the work the user shares, responds to it, remembers it, and returns at the right time.

> **AI can’t live your life for you.  
> But it can help you protect the time needed to build it.**
