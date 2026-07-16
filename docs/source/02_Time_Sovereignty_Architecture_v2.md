# Time Sovereignty

## Architecture v2
### Product Architecture and Build Week Implementation Map

This document is the architecture companion to `01_Time_Sovereignty_PRD_v0.6.md`.

## Status Legend

- **MVP** = `IMPLEMENTED_IN_MVP`
- **READY** = `INTERFACE_PREPARED`
- **FUTURE** = `FUTURE`

```mermaid
flowchart LR

    %% =========================================================
    %% USER EXPERIENCE
    %% =========================================================
    subgraph UX["Mobile-First PWA Experience"]
        GOAL["Goal Intake<br/>3 questions<br/><b>MVP</b>"]
        CONFIRM["Goal Confirmation<br/><b>MVP</b>"]
        SUPPORT["Support Agreement<br/>frequency, tone, quiet hours,<br/>voice and sharing methods<br/><b>MVP</b>"]
        TODAY["Today / Best Next Action<br/><b>MVP</b>"]
        CHECKIN["Incoming Check-In<br/>text + tap-to-play TTS<br/><b>MVP</b>"]
        RECOVERY["Recovery Conversation<br/><b>MVP</b>"]
        SHARE["Share Progress<br/>text / photo / voice / short video / file<br/><b>MVP</b>"]
        JOURNEY["Journey Timeline<br/><b>MVP</b>"]
        MEMORY_UI["Memory Review<br/>confirm / correct / delete<br/><b>READY</b>"]
        CALL_UI["Real Incoming Call Experience<br/><b>FUTURE</b>"]
    end

    USER(("User"))
    USER --> GOAL --> CONFIRM --> SUPPORT --> TODAY
    CHECKIN --> USER
    USER --> RECOVERY
    USER --> SHARE
    USER --> JOURNEY
    USER -.-> MEMORY_UI
    USER -.-> CALL_UI

    %% =========================================================
    %% VOICE AND NOTIFICATION
    %% =========================================================
    subgraph VOICE["Voice and Notification Layer"]
        NOTIFY["Notification Orchestrator<br/><b>MVP</b>"]
        TTS["Text-to-Speech Adapter<br/><b>MVP</b>"]
        STT["Speech-to-Text Adapter<br/><b>MVP</b>"]
        PUSH["Cross-Device Browser Push<br/><b>READY</b>"]
        PHONE["Telephony / Call Provider Adapter<br/><b>READY</b>"]
    end

    CHECKIN <--> NOTIFY
    NOTIFY --> TTS
    USER --> STT
    STT --> RECOVERY
    NOTIFY -.-> PUSH
    NOTIFY -.-> PHONE
    PHONE -.-> CALL_UI

    %% =========================================================
    %% MAIN ORCHESTRATION
    %% =========================================================
    subgraph CORE["Chief of Staff Orchestration"]
        MAIN["Chief of Staff Agent<br/>GPT-5.6<br/><b>MVP</b>"]
        CONTEXT["Context Assembler<br/><b>MVP</b>"]
        POLICY["Guardrails + Principles<br/><b>MVP</b>"]
        DISPATCH["Agent Dispatcher<br/><b>MVP</b>"]
        SYNTH["Decision Synthesizer<br/><b>MVP</b>"]
        DELAY["Repeated Delay Pattern Detector<br/><b>MVP</b>"]
        STATE["Intervention State Machine<br/><b>MVP</b>"]
    end

    GOAL --> MAIN
    CONFIRM --> MAIN
    SUPPORT --> MAIN
    TODAY --> MAIN
    RECOVERY --> MAIN
    SHARE --> MAIN

    MAIN <--> CONTEXT
    POLICY -. constrains .-> MAIN
    MAIN --> DISPATCH
    MAIN --> DELAY
    MAIN --> STATE
    DISPATCH --> SYNTH
    DELAY --> SYNTH
    STATE --> SYNTH
    SYNTH --> MAIN
    MAIN --> NOTIFY
    MAIN --> JOURNEY

    %% =========================================================
    %% SUB-AGENTS
    %% =========================================================
    subgraph AGENTS["Role-Based Sub-Agents"]
        GOAL_AGENT["Goal Architect Agent<br/><b>MVP</b>"]
        RECOVERY_AGENT["Commitment Recovery Agent<br/><b>MVP</b>"]
        MEMORY_AGENT["Memory Curator Agent<br/><b>MVP</b>"]
        TIME_AGENT["Time Guardian Agent<br/><b>READY</b>"]
        HEALTH_AGENT["Health Boundary Agent<br/><b>READY</b>"]
        FEEDBACK_AGENT["Progress Feedback Agent<br/><b>READY</b>"]
        MONITOR_AGENT["Research / Monitoring Agents<br/><b>FUTURE</b>"]
    end

    DISPATCH --> GOAL_AGENT
    DISPATCH --> RECOVERY_AGENT
    DISPATCH --> MEMORY_AGENT
    DISPATCH -.-> TIME_AGENT
    DISPATCH -.-> HEALTH_AGENT
    DISPATCH -.-> FEEDBACK_AGENT
    DISPATCH -.-> MONITOR_AGENT

    GOAL_AGENT --> SYNTH
    RECOVERY_AGENT --> SYNTH
    MEMORY_AGENT --> SYNTH
    TIME_AGENT -.-> SYNTH
    HEALTH_AGENT -.-> SYNTH
    FEEDBACK_AGENT -.-> SYNTH
    MONITOR_AGENT -.-> SYNTH

    %% =========================================================
    %% MEMORY AND DOMAIN DATA
    %% =========================================================
    subgraph DATA["Long-Term Memory and Domain Data"]
        NORTH["North Star Memory<br/><b>MVP</b>"]
        GOALS["Goals / Milestones / Actions<br/><b>MVP</b>"]
        SUPPORT_DATA["Support Agreements<br/><b>MVP</b>"]
        EPISODES["Episode Memory<br/><b>MVP</b>"]
        STRATEGY["Strategy Memory<br/>what helps / what fails<br/><b>MVP</b>"]
        PROGRESS["Progress Memory<br/>media + feedback<br/><b>MVP</b>"]
        RESUME["Resume Points<br/><b>MVP</b>"]
        REVISION["Goal Revision Log<br/><b>MVP</b>"]
        INTERVENTIONS["Interventions + Delay History<br/><b>MVP</b>"]
        RUNS["Agent Run Trace<br/><b>MVP</b>"]
    end

    CONTEXT <--> NORTH
    CONTEXT <--> GOALS
    CONTEXT <--> SUPPORT_DATA
    CONTEXT <--> EPISODES
    CONTEXT <--> STRATEGY
    CONTEXT <--> PROGRESS
    CONTEXT <--> RESUME
    CONTEXT <--> REVISION
    CONTEXT <--> INTERVENTIONS
    CONTEXT <--> RUNS

    MEMORY_AGENT --> NORTH
    MEMORY_AGENT --> EPISODES
    MEMORY_AGENT --> STRATEGY
    MEMORY_AGENT --> PROGRESS
    MEMORY_AGENT --> REVISION
    MAIN --> INTERVENTIONS
    MAIN --> RUNS
    MAIN --> RESUME

    %% =========================================================
    %% SCHEDULING AND LONGITUDINAL SIMULATION
    %% =========================================================
    subgraph TIME["Scheduling and Longitudinal Engine"]
        TASKS["Individual Future Check-Ins<br/>Cloud Tasks adapter<br/><b>MVP</b>"]
        CRON["Recurring Jobs<br/>Cloud Scheduler adapter<br/><b>READY</b>"]
        SIM["Accelerated Longitudinal Simulation<br/><b>MVP</b>"]
        CLOCK["Simulation Clock<br/><b>MVP</b>"]
        DEDUPE["Idempotency / Deduplication<br/><b>MVP</b>"]
    end

    MAIN --> TASKS
    TASKS --> DEDUPE --> STATE
    CRON -.-> STATE
    SIM --> CLOCK --> STATE
    STATE --> NOTIFY

    %% =========================================================
    %% GOOGLE CLOUD
    %% =========================================================
    subgraph GCP["Google Cloud Backend"]
        RUN["Cloud Run<br/>API + orchestration + handlers<br/><b>MVP</b>"]
        FIRESTORE["Firestore<br/><b>MVP</b>"]
        STORAGE["Cloud Storage<br/><b>MVP</b>"]
        SECRET["Secret Manager<br/><b>MVP</b>"]
        AUTH["Authentication Boundary<br/><b>READY</b>"]
    end

    CORE --> RUN
    AGENTS --> RUN
    VOICE --> RUN
    TIME --> RUN
    RUN <--> FIRESTORE
    RUN <--> STORAGE
    RUN --> SECRET
    USER -.-> AUTH
    AUTH -.-> RUN

    FIRESTORE <--> DATA
    SHARE --> STORAGE
    STORAGE --> PROGRESS

    %% =========================================================
    %% OPENAI / PROVIDERS
    %% =========================================================
    subgraph PROVIDERS["Model and Provider Layer"]
        RESPONSES["OpenAI Responses API<br/>GPT-5.6<br/><b>MVP</b>"]
        AUDIO["Audio Provider Adapter<br/>STT + TTS<br/><b>MVP</b>"]
        MOCK["Mock Provider<br/>same schemas as live<br/><b>MVP</b>"]
        EXTERNAL["Calendar / Email / Wearables / A2A<br/><b>FUTURE</b>"]
    end

    MAIN <--> RESPONSES
    GOAL_AGENT <--> RESPONSES
    RECOVERY_AGENT <--> RESPONSES
    MEMORY_AGENT <--> RESPONSES
    STT <--> AUDIO
    TTS <--> AUDIO
    MAIN <--> MOCK
    TIME_AGENT -.-> EXTERNAL
    HEALTH_AGENT -.-> EXTERNAL
    MONITOR_AGENT -.-> EXTERNAL
```

---

## Main Runtime Flow

```mermaid
sequenceDiagram
    participant U as User
    participant PWA as Mobile PWA
    participant CT as Cloud Tasks / Simulation Clock
    participant API as Cloud Run API
    participant COS as Chief of Staff GPT-5.6
    participant CRA as Commitment Recovery Agent
    participant MC as Memory Curator Agent
    participant DB as Firestore
    participant TTS as TTS Adapter

    CT->>API: Trigger check-in(intervention_id)
    API->>DB: Verify state and idempotency
    API->>COS: Build contextual check-in
    COS->>DB: Retrieve goal, support agreement, delay history
    COS-->>API: Text check-in + voice script
    API->>TTS: Generate or prepare TTS
    API-->>PWA: Text notification + playable audio
    PWA-->>U: Notify user

    U->>PWA: "I'm busy, delay"
    PWA->>API: User response
    API->>DB: Store delay event

    alt First delay
        API->>COS: Reschedule request
        COS-->>API: Accept + propose new time
        API->>DB: Save new commitment
        API->>CT: Schedule next check-in
        API-->>PWA: Confirm delay
    else Repeated delay
        API->>COS: Delay pattern detected
        COS->>CRA: Explore timing, size, motivation, fatigue, method
        CRA-->>COS: Structured hypotheses and strategies
        COS-->>PWA: Ask what is really happening
        U->>PWA: Explain reason
        PWA->>API: Explanation
        API->>COS: Adapt plan
        COS-->>API: New action + new follow-up
        API->>DB: Save strategy and commitment
        API->>CT: Schedule next check-in
    end

    U->>PWA: Share photo / voice / file
    PWA->>API: Upload progress
    API->>COS: Analyze and respond
    COS-->>PWA: Specific feedback + next step
    API->>MC: Propose memory updates
    MC->>DB: Store episode, strategy, progress memory
```

---

## Repository Boundary Recommendation

```text
apps/
  web/                    # Mobile-first PWA

packages/
  agents/
    chief-of-staff/
    goal-architect/
    commitment-recovery/
    memory-curator/
    interfaces/           # Future agent contracts
  domain/
    goals/
    actions/
    interventions/
    memories/
    support-agreements/
    simulations/
  providers/
    openai/
    mock/
    tts/
    stt/
    notifications/
    scheduling/
    storage/
  ui/
  config/

services/
  api/                    # Cloud Run service if separated
  worker/                 # Optional future split

docs/
  product/
  architecture/
  decisions/
  codex-handoffs/
```

A single Next.js repository is acceptable for Build Week if it preserves these logical boundaries.

---

## Implementation Principle

The full architecture is intentional.

Do not delete future rooms because they are not implemented this week.

Create stable interfaces, schemas, and status labels, but complete the required vertical slice before expanding functionality.
