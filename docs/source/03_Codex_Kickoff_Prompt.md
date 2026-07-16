# Codex Kickoff Prompt

You are the primary Codex development partner for **Time Sovereignty**, an OpenAI Build Week project.

Read these files first:

1. `01_Time_Sovereignty_PRD_v0.6.md`
2. `02_Time_Sovereignty_Architecture_v2.md`

Treat them as the current source of truth.

The product vision is intentionally larger than the seven-day implementation. Do not reduce the architecture to a generic reminder app or task planner. Preserve future modules through clear interfaces and status labels:

- `IMPLEMENTED_IN_MVP`
- `INTERFACE_PREPARED`
- `FUTURE`

At the same time, do not attempt to fully implement every planned room during Build Week.

## Core Product Truth

Planning is not the differentiator.

The core vertical loop is:

```text
Create goal
→ confirm plan
→ confirm support agreement
→ save to Firestore
→ schedule voice-enabled check-in
→ user delays
→ accept one delay and reschedule
→ detect repeated delay
→ explore the real reason
→ adapt timing, task size, method, tone, or goal
→ confirm a new commitment
→ user shares progress
→ AI gives specific feedback
→ store outcome and strategy memory
→ retrieve memory
→ follow up again
```

Voice is a core capability.

The MVP must support:

- text check-in;
- tap-to-play TTS;
- voice reply;
- speech-to-text;
- text and voice response;
- quiet hours and support preferences.

The final product must actually use GPT-5.6. Mock mode is allowed during development, but mock and live providers must share the same schemas.

## Required Technical Direction

Preferred baseline:

- mobile-first PWA;
- TypeScript;
- Next.js unless repository constraints strongly justify another choice;
- Google Cloud Run;
- Firestore;
- Cloud Storage;
- Cloud Tasks for individual future check-ins;
- Secret Manager;
- Cloud Scheduler interface for recurring jobs;
- structured model outputs;
- provider adapters for live and mock modes;
- idempotent scheduled handlers;
- agent run trace;
- accelerated longitudinal simulation.

## Real MVP Agents

Implement these as real role-based agent calls:

1. Chief of Staff Agent — GPT-5.6
2. Goal Architect Agent
3. Commitment Recovery Agent
4. Memory Curator Agent

Preserve interfaces for:

- Time Guardian Agent
- Health Boundary Agent
- Progress Feedback Agent
- monitoring agents

Do not create unnecessary agents merely for appearance.

## First Required Response

Before modifying files, inspect the repository and return a concise but concrete review containing:

1. repository state;
2. contradictions or ambiguities found in the PRD or architecture;
3. technical risks;
4. assumptions you will use;
5. proposed repository structure;
6. domain data models;
7. agent input/output schemas;
8. intervention state machine;
9. Google Cloud service map;
10. smallest complete vertical slice;
11. implementation phases;
12. test strategy;
13. which components are MVP, interface-prepared, and future.

Do not wait for an extended question-and-answer cycle. Make reasonable assumptions and clearly record them.

After presenting this review, wait for approval before making the first broad implementation change. Small read-only inspection commands are allowed.

## Implementation Priority

Complete the end-to-end vertical slice before visual polish or optional integrations.

Priority order:

1. domain schemas and state machine;
2. provider interfaces and mock mode;
3. goal onboarding and confirmation;
4. support agreement;
5. Firestore persistence;
6. Chief of Staff orchestration;
7. Goal Architect;
8. scheduled check-in;
9. text + TTS delivery;
10. voice reply;
11. single-delay handling;
12. repeated-delay detection;
13. Commitment Recovery;
14. progress sharing;
15. specific AI feedback;
16. Memory Curator;
17. resume point;
18. accelerated simulation;
19. journey timeline;
20. developer agent trace;
21. live GPT-5.6 integration;
22. deployment;
23. tests, README, and demo support.

## Behavioral Requirements

Do not hard-code a large behavioral rule tree.

Use:

- a few guardrails;
- stable principles;
- GPT-5.6 dynamic strategy;
- structured outputs;
- explicit state transitions;
- deterministic safety and idempotency checks;
- test scenarios.

A first delay should normally be accepted and rescheduled.

Repeated delay should trigger investigation of:

- wrong timing;
- task too large;
- wrong method;
- ineffective reminder style;
- fatigue or health;
- competing responsibilities;
- reduced motivation;
- outdated goal.

The product must evaluate whether its own intervention helped. User feedback is more important than the AI’s self-assessment.

## Progress Sharing Requirements

Progress media is not primarily a policing mechanism.

The system should support sharing through:

- text;
- photo;
- voice;
- short video;
- file;
- code commit or test output.

The AI should:

- describe what it actually observed;
- acknowledge the action;
- give grounded, specific praise;
- provide useful feedback when supported;
- express uncertainty when needed;
- connect progress to the user’s goal;
- store the result;
- recommend the next step.

Do not make medical or professional claims beyond the available evidence.

## Longitudinal Simulation

Implement an **Accelerated Longitudinal Simulation** mode.

Only time is accelerated.

The following must remain real:

- GPT-5.6 calls;
- sub-agent dispatch;
- memory reads and writes;
- state transitions;
- delay handling;
- progress feedback;
- goal calibration;
- agent traces.

Clearly label simulated time in the UI and README.

## Codex Evidence Requirements

Maintain a clear development evidence chain.

Please:

- keep this primary thread as the main development thread when practical;
- write clear milestone commits;
- maintain `docs/codex-handoffs.md` if a new thread becomes necessary;
- record major decisions in `docs/decisions/`;
- preserve the primary `/feedback` Session ID for final submission;
- include implementation and test notes in the README.

Suggested commit style:

```text
feat: define goal and intervention domain schemas
feat: add support agreement and voice check-in flow
feat: implement repeated-delay recovery
feat: add progress sharing and feedback memory
test: cover intervention state transitions
docs: add accelerated simulation guide
```

## Completion Standard

The work is successful when the reviewer can experience this loop:

```text
Set a meaningful goal
→ agree on how the AI will support them
→ receive an audible check-in
→ delay once without punishment
→ be questioned intelligently after repeated delay
→ receive an adapted action
→ share real progress
→ receive specific feedback
→ see that the AI remembers and follows up correctly
```

Begin with repository inspection and the required review.
