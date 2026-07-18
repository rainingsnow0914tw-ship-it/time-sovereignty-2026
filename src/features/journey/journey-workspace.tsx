"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";
import Image from "next/image";
import {
  LanguageToggle,
  Localized,
  speechLanguageForLocale,
  useLocale,
} from "../../i18n/locale";

import type { LocalOnboardingRecord } from "../../repositories/local-onboarding-repository";
import { createLocalJourneyRepository } from "../../repositories/local-journey-repository";
import {
  isSpeechRecognitionSupported,
  showBrowserNotification,
  speakBrowserText,
  transcribeBrowserSpeech,
} from "../../providers/audio/browser-audio-provider";
import {
  JourneyStateSchema,
  addAgentTrace,
  addJourneyEvent,
  advanceSimulation,
  createInitialJourneyState,
  isWithinQuietHours,
  type JourneyState,
  type JourneyView,
  type ProgressEvidence,
} from "./model";
import { LiveCheckInPanel } from "./live-check-in-panel";
import type { LiveCheckInSummary } from "./live-check-in-summary";
import type { LiveChiefOfStaffDecision } from "../../live-checkin/schemas";

const tabs: Array<{ value: JourneyView; label: string; hint: string }> = [
  { value: "TODAY", label: "Today", hint: "Your protected next move" },
  { value: "CHECK_IN", label: "Check-in", hint: "Voice and recovery" },
  { value: "PROGRESS", label: "Progress", hint: "Text, photo, or voice" },
  { value: "JOURNEY", label: "Journey", hint: "Longitudinal proof" },
  { value: "DEVELOPER", label: "Developer", hint: "Safe agent trace" },
];

const cardClass =
  "rounded-[1.6rem] border border-[#dfe5df] bg-white p-5 shadow-[0_14px_45px_rgba(23,63,53,0.06)] sm:p-6";
const darkCardClass =
  "rounded-[1.6rem] border border-[#173f35] bg-[#173f35] p-5 text-white shadow-[0_14px_45px_rgba(23,63,53,0.12)] sm:p-6";
const primaryButtonClass =
  "inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-full bg-[#173f35] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0e3329] focus:outline-none focus:ring-4 focus:ring-[#bcd5c6] disabled:cursor-not-allowed disabled:opacity-45";
const secondaryButtonClass =
  "inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-full border border-[#cfd9d2] bg-white px-5 py-2.5 text-sm font-semibold text-[#28443a] transition hover:border-[#8aa99a] hover:bg-[#f6faf6] focus:outline-none focus:ring-4 focus:ring-[#dce9df] disabled:cursor-not-allowed disabled:opacity-45";
const inputClass =
  "w-full rounded-2xl border border-[#d9e0da] bg-[#fbfcf9] px-4 py-3 text-sm text-[#17211d] outline-none focus:border-[#5a8271] focus:ring-4 focus:ring-[#dce9df]/70";

type ProgressFormat = "TEXT" | "PHOTO" | "VOICE";
type AssetDraft = { name: string; dataUrl: string };
type RuntimeHealth = {
  providerMode: "mock" | "live";
  model: string;
  revision: string;
};

export function JourneyWorkspace({
  record,
  onReset,
  liveCheckInEnabled = true,
  showLocalSimulation = true,
  demoLab = false,
  onLiveCheckInSummaryChange,
}: {
  record: LocalOnboardingRecord;
  onReset: () => void;
  liveCheckInEnabled?: boolean;
  showLocalSimulation?: boolean;
  demoLab?: boolean;
  onLiveCheckInSummaryChange?: (summary: LiveCheckInSummary) => void;
}) {
  const { locale, t } = useLocale();
  const [state, setState] = useState<JourneyState>(() =>
    createInitialJourneyState(record),
  );
  const [hydrated, setHydrated] = useState(false);
  const [notice, setNotice] = useState("");
  const [runtimeHealth, setRuntimeHealth] = useState<RuntimeHealth | null>(null);
  const [checkInReply, setCheckInReply] = useState("");
  const [recoveryReason, setRecoveryReason] = useState("SIZE");
  const [progressFormat, setProgressFormat] =
    useState<ProgressFormat>("TEXT");
  const [progressText, setProgressText] = useState("");
  const [photo, setPhoto] = useState<AssetDraft | null>(null);
  const [voiceClip, setVoiceClip] = useState<AssetDraft | null>(null);
  const [recording, setRecording] = useState(false);
  const [listening, setListening] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaChunksRef = useRef<Blob[]>([]);
  const recordingTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const repository = createLocalJourneyRepository(
      window.localStorage,
      record.goal.id,
    );
    const hydrationTimer = window.setTimeout(() => {
      const saved = repository.load();
      if (saved) setState(saved);
      setHydrated(true);
    }, 0);

    return () => window.clearTimeout(hydrationTimer);
  }, [record.goal.id]);

  useEffect(() => {
    if (demoLab) return;
    const controller = new AbortController();
    void (async () => {
      try {
        const response = await fetch("/api/health", {
          cache: "no-store",
          signal: controller.signal,
        });
        const payload = (await response.json()) as Record<string, unknown>;
        if (
          response.ok &&
          (payload.providerMode === "mock" || payload.providerMode === "live") &&
          typeof payload.model === "string" &&
          typeof payload.revision === "string"
        ) {
          setRuntimeHealth({
            providerMode: payload.providerMode,
            model: payload.model,
            revision: payload.revision,
          });
        }
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setRuntimeHealth(null);
        }
      }
    })();
    return () => controller.abort();
  }, [demoLab]);

  useEffect(() => {
    if (!hydrated) return;
    let noticeTimer: number | null = null;
    try {
      createLocalJourneyRepository(window.localStorage, record.goal.id).save(
        state,
      );
    } catch {
      noticeTimer = window.setTimeout(() => {
        setNotice(
          "The browser could not save this media locally. Keep future recordings shorter.",
        );
      }, 0);
    }

    return () => {
      if (noticeTimer !== null) window.clearTimeout(noticeTimer);
    };
  }, [hydrated, record.goal.id, state]);

  useEffect(
    () => () => {
      if (recordingTimeoutRef.current) {
        window.clearTimeout(recordingTimeoutRef.current);
      }
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    },
    [],
  );

  const quietHours =
    hydrated &&
    isWithinQuietHours(
      record.supportAgreement.quietHours.start,
      record.supportAgreement.quietHours.end,
    );
  const speechLanguage = speechLanguageForLocale(locale);
  const checkInMessage = t(
    `You planned to continue “${state.currentAction}”. Are you still at the same checkpoint?`,
  );
  const safeDebugState = useMemo(
    () => ({
      simulatedDay: state.simulatedDay,
      simulationComplete: state.simulationComplete,
      interventionState: state.interventionState,
      delayCount: state.delayCount,
      eventCount: state.events.length,
      progressFormats: state.progress.map((item) => item.format),
      memories: state.memories.map((memory) => ({
        kind: memory.kind,
        sourceType: memory.sourceType,
        requiresConfirmation: memory.requiresConfirmation,
      })),
      agentTraceCount: state.agentTraces.length,
      latestModels: [...new Set(state.agentTraces.map((trace) => trace.model))],
    }),
    [state],
  );

  const setView = (view: JourneyView) => {
    setState((current) =>
      JourneyStateSchema.parse({ ...current, activeView: view }),
    );
    setNotice("");
  };

  const runNextSimulationDay = () => {
    setState((current) => advanceSimulation(current, record));
    setNotice(
      demoLab
        ? "Scripted time advanced. No API or private data was used."
        : "Simulated time advanced. Product behavior stayed on the real state path.",
    );
  };

  const runFullSimulation = () => {
    setState((current) => {
      let next = current;
      let iteration = 0;
      while (next.simulatedDay < 30 && iteration < 8) {
        const advanced = advanceSimulation(
          next,
          record,
          new Date(Date.now() + iteration * 10),
        );
        if (advanced.simulatedDay === next.simulatedDay) break;
        next = advanced;
        iteration += 1;
      }
      return next;
    });
    setNotice(
      demoLab
        ? "The complete scripted 30-day story is now visible in Journey and Developer."
        : "Thirty simulated days are now visible in Journey and Developer mode.",
    );
  };

  const playCheckIn = async () => {
    const result = await speakBrowserText(checkInMessage, {
      language: speechLanguage,
    });
    setNotice(result.message);
  };

  const deliverNotification = async () => {
    if (quietHours) {
      setNotice("Quiet hours are active. The notification was correctly withheld.");
      return;
    }
    const result = await showBrowserNotification(
      t("Time Sovereignty check-in"),
      checkInMessage,
    );
    setNotice(result.message);
  };

  const listenForReply = async () => {
    setListening(true);
    setNotice("Listening for one reply…");
    const transcript = await transcribeBrowserSpeech(speechLanguage);
    setListening(false);
    if (!transcript) {
      setNotice(
        isSpeechRecognitionSupported()
          ? "No clear transcript was captured. You can type or try again."
          : "Speech transcription is not supported here; text reply remains available.",
      );
      return;
    }
    setCheckInReply(transcript);
    setNotice("Voice reply transcribed. Review it before sending.");
  };

  const submitCheckInReply = () => {
    const reply = checkInReply.trim();
    if (!reply) {
      setNotice("Tell me what changed before sending the reply.");
      return;
    }

    setState((current) => {
      const timestamp = new Date().toISOString();
      let next = JourneyStateSchema.parse({
        ...current,
        interventionState: "USER_RESPONDED",
        latestFeedback:
          "I heard the update. We can protect continuity without pretending the original plan still fits.",
        resumePoint: {
          ...current.resumePoint,
          currentBlocker: reply,
          nextPhysicalAction: current.minimumAction,
          updatedAt: timestamp,
        },
      });
      next = addJourneyEvent(next, {
        kind: "CHECK_IN",
        title: "User replied to check-in",
        detail: reply,
      });
      return addAgentTrace(
        next,
        "CHIEF_OF_STAFF",
        "ChiefOfStaffOutput",
        "User check-in response received; raw content omitted from trace",
      );
    });
    setCheckInReply("");
    setNotice("Reply stored. Choose “Something changed” if the plan needs adaptation.");
  };

  const delayCheckIn = () => {
    setState((current) => {
      const delayCount = current.delayCount + 1;
      const repeated = delayCount >= 2;
      const revised = new Date(
        new Date(current.nextCheckAt).getTime() + 60 * 60 * 1_000,
      ).toISOString();
      let next = JourneyStateSchema.parse({
        ...current,
        delayCount,
        nextCheckAt: revised,
        interventionState: repeated ? "ADAPTING" : "SCHEDULED",
      });
      next = addJourneyEvent(next, {
        kind: "DELAY",
        title: repeated ? "Repeated delay detected" : "Delay accepted",
        detail: repeated
          ? "The system is investigating timing, task size, method, and direction."
          : "The check-in moved by one hour without guilt or interrogation.",
      });
      if (!repeated) return next;
      next = addAgentTrace(
        next,
        "COMMITMENT_RECOVERY",
        "CommitmentRecoveryOutput",
        "Repeated delay signal; private response omitted",
      );
      return addAgentTrace(
        next,
        "CHIEF_OF_STAFF",
        "ChiefOfStaffOutput",
        "Recovery decision after repeated delay",
      );
    });
    setNotice(
      state.delayCount >= 1
        ? "A pattern is visible. Recovery options are now open."
        : "One delay accepted and rescheduled.",
    );
  };

  const openRecovery = () => {
    setState((current) => {
      const next = JourneyStateSchema.parse({
        ...current,
        interventionState: "ADAPTING",
      });
      return addJourneyEvent(next, {
        kind: "RECOVERY",
        title: "Something changed",
        detail: "The user opened recovery before forcing the old plan.",
      });
    });
    setNotice("Choose what is actually wrong. The goal remains yours.");
  };

  const confirmRecovery = () => {
    setState((current) => {
      const timestamp = new Date().toISOString();
      const adaptation = recoveryAction(recoveryReason, current, record);
      let next = JourneyStateSchema.parse({
        ...current,
        currentAction: adaptation.action,
        interventionState: "CONFIRMED",
        nextCheckAt: adaptation.nextCheckAt,
        memories: [
          ...current.memories,
          {
            id: `recovery-${Date.now()}`,
            kind: "STRATEGY",
            summary: adaptation.memory,
            sourceType: "CONFIRMED_BY_USER",
            requiresConfirmation: false,
            updatedAt: timestamp,
          },
        ],
        resumePoint: {
          ...current.resumePoint,
          currentBlocker: adaptation.reason,
          nextPhysicalAction: adaptation.action,
          updatedAt: timestamp,
        },
      });
      next = addJourneyEvent(next, {
        kind: "RECOVERY",
        title: "New commitment confirmed",
        detail: adaptation.memory,
      });
      next = addAgentTrace(
        next,
        "COMMITMENT_RECOVERY",
        "CommitmentRecoveryOutput",
        "User-selected recovery reason; wording omitted from trace",
      );
      next = addAgentTrace(
        next,
        "MEMORY_CURATOR",
        "MemoryCuratorOutput",
        "Confirmed recovery strategy prepared for later retrieval",
      );
      return addAgentTrace(
        next,
        "CHIEF_OF_STAFF",
        "ChiefOfStaffOutput",
        "Unified recovery decision and new commitment",
      );
    });
    setNotice("The new commitment and resume point are stored.");
    setView("TODAY");
  };

  const onPhotoSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 1_200_000) {
      setNotice("Choose an image smaller than 1.2 MB for the local demo store.");
      return;
    }
    setPhoto({ name: file.name, dataUrl: await fileToDataUrl(file) });
    setNotice("Photo is ready. Add one sentence about what it proves.");
  };

  const startVoiceRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setNotice("Voice recording is unavailable in this browser.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaStreamRef.current = stream;
      mediaRecorderRef.current = recorder;
      mediaChunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) mediaChunksRef.current.push(event.data);
      };
      recorder.onstop = async () => {
        const blob = new Blob(mediaChunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        stream.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
        setRecording(false);
        if (blob.size > 900_000) {
          setNotice("Recording was too large for local persistence. Keep it under 30 seconds.");
          return;
        }
        setVoiceClip({
          name: `voice-progress-${Date.now()}.webm`,
          dataUrl: await fileToDataUrl(blob),
        });
        setNotice("Voice progress is ready to share.");
      };
      recorder.start();
      setRecording(true);
      setNotice("Recording… it will stop automatically after 30 seconds.");
      recordingTimeoutRef.current = window.setTimeout(() => {
        if (recorder.state !== "inactive") recorder.stop();
      }, 30_000);
    } catch {
      setNotice("Microphone permission was not granted.");
    }
  };

  const stopVoiceRecording = () => {
    if (recordingTimeoutRef.current) {
      window.clearTimeout(recordingTimeoutRef.current);
      recordingTimeoutRef.current = null;
    }
    if (mediaRecorderRef.current?.state !== "inactive") {
      mediaRecorderRef.current?.stop();
    }
  };

  const shareProgress = () => {
    const summary = progressText.trim();
    const asset = progressFormat === "PHOTO" ? photo : progressFormat === "VOICE" ? voiceClip : null;
    if (progressFormat === "TEXT" && !summary) {
      setNotice("Write one concrete progress update first.");
      return;
    }
    if (progressFormat !== "TEXT" && !asset) {
      setNotice(`Add a ${progressFormat.toLowerCase()} before sharing.`);
      return;
    }

    const resolvedSummary =
      summary ||
      (progressFormat === "PHOTO"
        ? "Shared a photo showing the current checkpoint."
        : "Shared a short voice update about the completed work.");
    const feedback = feedbackFor(progressFormat, resolvedSummary, state.currentAction);

    setState((current) => {
      const timestamp = new Date().toISOString();
      const evidence: ProgressEvidence = {
        id: `progress-${Date.now()}`,
        format: progressFormat,
        summary: resolvedSummary,
        assetName: asset?.name ?? null,
        assetDataUrl: asset?.dataUrl ?? null,
        feedback,
        simulatedDay: current.simulatedDay,
        createdAt: timestamp,
      };
      let next = JourneyStateSchema.parse({
        ...current,
        progress: [...current.progress, evidence],
        latestFeedback: feedback,
        interventionState: "CLOSED",
        memories: [
          ...current.memories,
          {
            id: `progress-memory-${Date.now()}`,
            kind: "PROGRESS",
            summary: `${progressFormat.toLowerCase()} evidence: ${resolvedSummary}`,
            sourceType: "CONFIRMED_BY_USER",
            requiresConfirmation: false,
            updatedAt: timestamp,
          },
        ],
        resumePoint: {
          ...current.resumePoint,
          lastCompletedCheckpoint: resolvedSummary,
          currentBlocker: null,
          nextPhysicalAction: current.minimumAction,
          updatedAt: timestamp,
        },
      });
      next = addJourneyEvent(next, {
        kind: "PROGRESS",
        title: `${progressFormat.toLowerCase()} progress shared`,
        detail: resolvedSummary,
      });
      next = addJourneyEvent(next, {
        kind: "FEEDBACK",
        title: "Specific feedback returned",
        detail: feedback,
      });
      next = addJourneyEvent(next, {
        kind: "MEMORY",
        title: "Progress memory stored",
        detail: "This checkpoint can be retrieved in the next interaction.",
      });
      next = addAgentTrace(
        next,
        "MEMORY_CURATOR",
        "MemoryCuratorOutput",
        `${progressFormat} progress stored; raw media excluded from trace`,
      );
      return addAgentTrace(
        next,
        "CHIEF_OF_STAFF",
        "ChiefOfStaffOutput",
        "Specific feedback generated from user progress",
      );
    });

    setProgressText("");
    setPhoto(null);
    setVoiceClip(null);
    setNotice("Progress, feedback, resume point, and memory were stored together.");
  };

  const rateIntervention = (rating: number) => {
    setState((current) => {
      const timestamp = new Date().toISOString();
      const next = JourneyStateSchema.parse({
        ...current,
        effectiveness: [
          ...current.effectiveness,
          {
            id: `effectiveness-${Date.now()}`,
            interventionId: current.interventionId,
            rating,
            sentiment: rating >= 4 ? "HELPED" : rating === 3 ? "NEUTRAL" : "PRESSURED",
            note: rating >= 4 ? "This support helped me continue." : "Adjust the next intervention.",
            recordedAt: timestamp,
          },
        ],
      });
      return addJourneyEvent(next, {
        kind: "FEEDBACK",
        title: "Intervention effectiveness rated",
        detail: `User rating: ${rating} of 5. User feedback remains the primary signal.`,
      });
    });
    setNotice("Your rating will shape the next support style.");
  };

  const resetAll = () => {
    createLocalJourneyRepository(window.localStorage, record.goal.id).clear();
    onReset();
  };

  const applyLiveCommitment = (decision: LiveChiefOfStaffDecision) => {
    setState((current) => {
      const assessment = decision.assessment ?? "BLOCKED";
      return addJourneyEvent(
        JourneyStateSchema.parse({
          ...current,
          currentAction: decision.adaptedCommitment,
          minimumAction: decision.adaptedCommitment,
          nextCheckAt: decision.nextFollowUpAt ?? current.nextCheckAt,
          latestFeedback: decision.userMessage,
          interventionState: assessment === "COMPLETED" ? "CLOSED" : "CONFIRMED",
          resumePoint: {
            ...current.resumePoint,
            lastCompletedCheckpoint: decision.userMessage,
            currentBlocker: ["BLOCKED", "GOAL_CHANGED"].includes(assessment)
              ? current.resumePoint.currentBlocker
              : null,
            nextPhysicalAction: decision.adaptedCommitment,
            updatedAt: new Date().toISOString(),
          },
        }),
        {
          kind: ["BLOCKED", "GOAL_CHANGED"].includes(assessment)
            ? "RECOVERY"
            : "PROGRESS",
          title:
            assessment === "COMPLETED"
              ? "Live completion confirmed"
              : "Live progress decision confirmed",
          detail: decision.adaptedCommitment,
        },
      );
    });
    setNotice("The real GPT-5.6 decision is now reflected in Today.");
  };

  return (
    <Localized>
    <div className="min-h-[760px] overflow-hidden rounded-[1.7rem] bg-[#f5f7f2]">
      <header className="border-b border-[#dfe5df] bg-[#173f35] px-5 py-5 text-white sm:px-7">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#d8f48a]">
              <span className="size-2 rounded-full bg-[#d8f48a]" />
              Time Sovereignty
            </div>
            <h1 className="mt-2 text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">
              {demoLab ? "30-day story lab" : "Your Chief of Staff command center"}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <LanguageToggle dark />
            {showLocalSimulation ? (
              <>
                <span className="rounded-full bg-white/10 px-3 py-2">{`${demoLab ? "Scripted" : "Simulated"} Day ${state.simulatedDay}`}</span>
                <span className="rounded-full bg-[#d8f48a] px-3 py-2 font-bold text-[#173f35]">
                  {demoLab
                    ? "Demo Lab · no API"
                    : state.simulationComplete
                      ? "30-day proof ready"
                      : "Accelerated time"}
                </span>
              </>
            ) : (
              <span className="rounded-full bg-[#d8f48a] px-3 py-2 font-bold text-[#173f35]">
                Live journey · GPT-5.6
              </span>
            )}
          </div>
        </div>
      </header>

      <nav className={`grid grid-cols-2 gap-1 border-b border-[#dfe5df] bg-white p-2 ${showLocalSimulation ? "sm:grid-cols-5" : "sm:grid-cols-3"}`} aria-label="Product sections">
        {tabs.filter((tab) => showLocalSimulation || ["TODAY", "CHECK_IN", "DEVELOPER"].includes(tab.value)).map((tab) => (
          <button
            type="button"
            key={tab.value}
            aria-pressed={state.activeView === tab.value}
            onClick={() => setView(tab.value)}
            className={`rounded-2xl px-3 py-3 text-left transition ${
              state.activeView === tab.value
                ? "bg-[#e5f0e7] text-[#173f35]"
                : "text-[#65736c] hover:bg-[#f5f7f3]"
            }`}
          >
            <span className="block text-sm font-bold">{tab.label}</span>
            <span className="mt-0.5 hidden text-[10px] sm:block">{tab.hint}</span>
          </button>
        ))}
      </nav>

      {notice ? (
        <div className="border-b border-[#cfddcf] bg-[#edf5e8] px-5 py-3 text-sm text-[#315447] sm:px-7" role="status">
          {notice}
        </div>
      ) : null}

      <section className="p-4 sm:p-6 lg:p-7" aria-label="Time Sovereignty command center">
        {state.activeView === "TODAY" ? (
          <TodayView
            record={record}
            state={state}
            quietHours={quietHours}
            onCheckIn={() => setView("CHECK_IN")}
            onProgress={() => setView(showLocalSimulation ? "PROGRESS" : "CHECK_IN")}
            onNextDay={runNextSimulationDay}
            onFullSimulation={runFullSimulation}
            onRate={rateIntervention}
            showSimulation={showLocalSimulation}
            hydrated={hydrated}
          />
        ) : null}

        {state.activeView === "CHECK_IN" ? (
          <>
          {liveCheckInEnabled ? (
            <LiveCheckInPanel
              mode="check-in"
              record={record}
              currentAction={state.currentAction}
              minimumAction={state.minimumAction}
              onCommitmentConfirmed={applyLiveCommitment}
              onSummaryChange={onLiveCheckInSummaryChange}
            />
          ) : (
            <div className="rounded-2xl border border-[#bed0c5] bg-[#eef5ef] px-4 py-3 text-sm text-[#496a5b]">
              {demoLab
                ? "Demo Lab check-in · scripted locally with mock traces. No API, Cloud Task, Firestore, or private session is used."
                : "Play profile · real Goal Architect is active. The recording check-in lane remains separate."}
            </div>
          )}
          {showLocalSimulation ? <section className="mt-5 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
            <div className={`${cardClass} border-[#9eb9aa] bg-[#f7fbf7]`}>
              <Eyebrow>Incoming check-in</Eyebrow>
              <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-[#173f35]">
                {checkInMessage}
              </h2>
              <p className="mt-3 text-sm leading-6 text-[#65736c]">
                {quietHours
                  ? "Quiet hours are active. In-app review is available, but proactive notification is withheld."
                  : `Tone: ${record.supportAgreement.preferredTone}. You can answer without performing certainty.`}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <button type="button" onClick={playCheckIn} className={secondaryButtonClass}>▶ Play voice</button>
                <button type="button" onClick={deliverNotification} className={secondaryButtonClass}>Show text notice</button>
                <button type="button" onClick={listenForReply} disabled={listening} className={secondaryButtonClass}>
                  {listening ? "Listening…" : "🎙 Reply by voice"}
                </button>
              </div>
              <label className="mt-5 block text-xs font-bold uppercase tracking-[0.12em] text-[#66766e]">
                Voice transcript or text reply
                <textarea
                  className={`${inputClass} mt-2 min-h-28 resize-y`}
                  value={checkInReply}
                  onChange={(event) => setCheckInReply(event.target.value)}
                  placeholder="I was pulled into cloud debugging, and the original action no longer fits tonight…"
                />
              </label>
              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" onClick={submitCheckInReply} className={primaryButtonClass}>Send update</button>
                <button type="button" onClick={delayCheckIn} className={secondaryButtonClass}>
                  {state.delayCount === 0 ? "Delay once" : "Delay again"}
                </button>
                <button type="button" onClick={openRecovery} className={secondaryButtonClass}>Something changed</button>
              </div>
            </div>

            <div className={cardClass}>
              <Eyebrow>Recovery conversation</Eyebrow>
              <h3 className="mt-2 text-xl font-semibold text-[#20372e]">
                Change the plan, not the truth.
              </h3>
              <p className="mt-2 text-sm leading-6 text-[#68766f]">
                This panel opens automatically after repeated delay. You can also use it early.
              </p>
              <div className="mt-4 space-y-2">
                {[
                  ["TIME", "The timing is wrong"],
                  ["SIZE", "The action is too large"],
                  ["METHOD", "The method is unpleasant or blocked"],
                  ["GOAL", "The direction needs calibration"],
                ].map(([value, label]) => (
                  <label key={value} className="flex cursor-pointer items-center gap-3 rounded-2xl border border-[#dce3dd] p-3 text-sm">
                    <input type="radio" name="recovery" value={value} checked={recoveryReason === value} onChange={() => setRecoveryReason(value)} />
                    {label}
                  </label>
                ))}
              </div>
              <button type="button" onClick={confirmRecovery} className={`${primaryButtonClass} mt-5 w-full`}>
                Confirm a new commitment
              </button>
            </div>
          </section> : null}
          </>
        ) : null}

        {showLocalSimulation && state.activeView === "PROGRESS" ? (
          <section className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
            <div className={cardClass}>
              <Eyebrow>Share progress</Eyebrow>
              <h2 className="mt-2 text-2xl font-semibold text-[#173f35]">Show what moved.</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {(["TEXT", "PHOTO", "VOICE"] as ProgressFormat[]).map((format) => (
                  <button
                    type="button"
                    key={format}
                    aria-pressed={progressFormat === format}
                    onClick={() => setProgressFormat(format)}
                    className={progressFormat === format ? primaryButtonClass : secondaryButtonClass}
                  >
                    {format === "TEXT" ? "Text" : format === "PHOTO" ? "Photo" : "Voice"}
                  </button>
                ))}
              </div>

              {progressFormat === "PHOTO" ? (
                <div className="mt-4 rounded-2xl border border-dashed border-[#9db6a9] p-4">
                  <input type="file" accept="image/*" onChange={onPhotoSelected} className="text-sm" />
                  {photo ? (
                    <Image
                      src={photo.dataUrl}
                      alt="Selected progress evidence"
                      width={960}
                      height={540}
                      unoptimized
                      className="mt-3 max-h-64 w-auto rounded-xl object-contain"
                    />
                  ) : null}
                </div>
              ) : null}

              {progressFormat === "VOICE" ? (
                <div className="mt-4 rounded-2xl border border-dashed border-[#9db6a9] p-4">
                  <div className="flex flex-wrap gap-2">
                    {!recording ? (
                      <button type="button" onClick={startVoiceRecording} className={secondaryButtonClass}>● Start recording</button>
                    ) : (
                      <button type="button" onClick={stopVoiceRecording} className={primaryButtonClass}>■ Stop recording</button>
                    )}
                  </div>
                  {voiceClip ? <audio controls src={voiceClip.dataUrl} className="mt-3 w-full" /> : null}
                </div>
              ) : null}

              <label className="mt-4 block text-xs font-bold uppercase tracking-[0.12em] text-[#66766e]">
                What does this evidence show?
                <textarea
                  className={`${inputClass} mt-2 min-h-28 resize-y`}
                  value={progressText}
                  onChange={(event) => setProgressText(event.target.value)}
                  placeholder="I finished the smaller recovery flow and confirmed the cloud callback still works…"
                />
              </label>
              <button type="button" onClick={shareProgress} className={`${primaryButtonClass} mt-4`}>Share progress</button>
            </div>

            <div className={darkCardClass}>
              <Eyebrow light>Specific feedback</Eyebrow>
              <p className="mt-4 text-lg leading-8 text-white/88">
                {state.latestFeedback || "Feedback will name the real evidence, connect it to your goal, and preserve the next resume point."}
              </p>
              <div className="mt-6 border-t border-white/12 pt-5">
                <p className="text-xs font-bold uppercase tracking-[0.13em] text-[#d8f48a]">Stored together</p>
                <ul className="mt-3 space-y-2 text-sm text-white/68">
                  <li>✓ Progress evidence</li>
                  <li>✓ Specific feedback</li>
                  <li>✓ Resume point</li>
                  <li>✓ Memory for the next interaction</li>
                </ul>
              </div>
            </div>
          </section>
        ) : null}

        {showLocalSimulation && state.activeView === "JOURNEY" ? (
          <section className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
            <div className={cardClass}>
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <Eyebrow>Journey timeline</Eyebrow>
                  <h2 className="mt-2 text-2xl font-semibold text-[#173f35]">A plan that remembers real life.</h2>
                </div>
                <span className="rounded-full bg-[#eef4ec] px-3 py-2 text-xs font-bold text-[#446457]">{`${state.events.length} events`}</span>
              </div>
              <div className="mt-6 space-y-1">
                {[...state.events].reverse().map((event) => (
                  <article key={event.id} className="relative border-l border-[#b7c9bd] py-3 pl-6">
                    <span className="absolute -left-1.5 top-5 size-3 rounded-full border-2 border-white bg-[#5d8974]" />
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#52675c]">{`Day ${event.simulatedDay}`}</span>
                      <span className="rounded-full bg-[#f0f4ef] px-2 py-1 text-[10px] text-[#66756e]">{event.kind.replaceAll("_", " ")}</span>
                    </div>
                    <h3 className="mt-1 text-sm font-bold text-[#263d33]">{event.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-[#6a7771]">{event.detail}</p>
                  </article>
                ))}
              </div>
            </div>

            <div className="space-y-5">
              <div className={cardClass}>
                <Eyebrow>Retrieved memory</Eyebrow>
                <div className="mt-4 space-y-3">
                  {[...state.memories].reverse().slice(0, 5).map((memory) => (
                    <div key={memory.id} className="rounded-2xl bg-[#f3f6f1] p-4">
                      <div className="flex items-center justify-between gap-2 text-[10px] font-bold uppercase tracking-[0.11em] text-[#52675c]">
                        <span>{memory.kind.replaceAll("_", " ")}</span>
                        <span>{memory.requiresConfirmation ? "Needs confirmation" : "Confirmed"}</span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-[#364c42]">{memory.summary}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className={cardClass}>
                <Eyebrow>Intervention effectiveness</Eyebrow>
                <p className="mt-2 text-sm text-[#65736c]">Did this support help you continue?</p>
                <div className="mt-4 flex gap-2" aria-label="Rate intervention from one to five">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button type="button" key={rating} onClick={() => rateIntervention(rating)} className="grid size-11 place-items-center rounded-full border border-[#cfd9d2] bg-white text-sm font-bold text-[#355044] hover:bg-[#d8f48a]">
                      {rating}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {state.activeView === "DEVELOPER" ? (
          <>
          {liveCheckInEnabled ? (
            <LiveCheckInPanel
              mode="developer"
              record={record}
              currentAction={state.currentAction}
              minimumAction={state.minimumAction}
              onSummaryChange={onLiveCheckInSummaryChange}
            />
          ) : null}
          {showLocalSimulation ? <section className="mt-5 grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
            <div className={cardClass}>
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <Eyebrow>Agent run trace</Eyebrow>
                  <h2 className="mt-2 text-2xl font-semibold text-[#173f35]">Auditable orchestration</h2>
                </div>
                <span className="rounded-full bg-[#fff2cc] px-3 py-2 text-xs font-bold text-[#6f5310]">
                  {demoLab
                    ? "Scripted simulation · mock traces · no API"
                    : runtimeHealth?.providerMode === "live"
                    ? `Local simulation · cloud live · ${runtimeHealth.model}`
                    : "Local simulation · cloud health pending"}
                </span>
              </div>
              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[680px] border-collapse text-left text-xs">
                  <thead className="text-[#59665f]">
                    <tr className="border-b border-[#dfe5df]">
                      <th className="py-3 pr-4">Agent</th><th className="py-3 pr-4">Provider / model</th><th className="py-3 pr-4">Schema</th><th className="py-3 pr-4">Day</th><th className="py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...state.agentTraces].reverse().map((trace) => (
                      <tr key={trace.runId} className="border-b border-[#edf0ed] align-top">
                        <td className="py-3 pr-4 font-bold text-[#2e493d]">{trace.agent.replaceAll("_", " ")}</td>
                        <td className="py-3 pr-4 text-[#5f7068]">{trace.provider} · {trace.model}</td>
                        <td className="py-3 pr-4 text-[#5f7068]">{trace.outputSchemaName}</td>
                        <td className="py-3 pr-4 text-[#5f7068]">{trace.runId.match(/day-(\d+)/u)?.[1] ?? "real"}</td>
                        <td className="py-3 font-bold text-[#4c765f]">{trace.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-4 text-xs leading-5 text-[#5f6a64]">Raw prompts, secrets, media, and private reasoning are excluded. Live traces add safe token usage.</p>
            </div>
            <div className="space-y-5">
              <div className={cardClass}>
                <Eyebrow>Acceptance path</Eyebrow>
                <ul className="mt-4 space-y-2 text-sm text-[#4f6259]">
                  <li>
                    {demoLab
                      ? "✓ Demo isolation: no API or private session"
                      : runtimeHealth?.providerMode === "live"
                      ? `✓ Cloud runtime: ${runtimeHealth.model} · ${runtimeHealth.revision}`
                      : "○ Cloud runtime health pending"}
                  </li>
                  <li>✓ Two real state machines</li>
                  <li>✓ Four Agent contracts</li>
                  <li>✓ Text + tap-to-play TTS</li>
                  <li>✓ Voice transcription boundary</li>
                  <li>✓ Text, photo, voice progress</li>
                  <li>✓ Memory + resume point</li>
                  <li>✓ 30-day accelerated simulation</li>
                  <li>✓ Journey + safe trace</li>
                </ul>
              </div>
              <details className={cardClass}>
                <summary className="cursor-pointer text-sm font-bold text-[#2e493d]">Safe runtime snapshot</summary>
                <pre className="mt-4 overflow-auto rounded-2xl bg-[#122d25] p-4 text-[11px] leading-5 text-[#d9ebdf]">{JSON.stringify(safeDebugState, null, 2)}</pre>
              </details>
            </div>
          </section> : null}
          </>
        ) : null}
      </section>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[#dfe5df] bg-white px-5 py-4 text-xs text-[#56645d] sm:px-7">
        <span>{demoLab ? "Isolated scripted story · browser-only · no API or private data" : showLocalSimulation ? "Saved in this browser · media stays local until cloud upload is activated" : "Private live journey · photos are analyzed transiently and are not persisted"}</span>
        <button type="button" onClick={resetAll} className="font-bold text-[#49675a] hover:text-[#173f35]">Reset this journey</button>
      </footer>
    </div>
    </Localized>
  );
}

function TodayView({
  record,
  state,
  quietHours,
  onCheckIn,
  onProgress,
  onNextDay,
  onFullSimulation,
  onRate,
  showSimulation,
  hydrated,
}: {
  record: LocalOnboardingRecord;
  state: JourneyState;
  quietHours: boolean;
  onCheckIn: () => void;
  onProgress: () => void;
  onNextDay: () => void;
  onFullSimulation: () => void;
  onRate: (rating: number) => void;
  showSimulation: boolean;
  hydrated: boolean;
}) {
  const { formatDateTime } = useLocale();
  return (
    <Localized>
    <section className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="space-y-5">
        <div className={darkCardClass}>
          <Eyebrow light>North star</Eyebrow>
          <h2 className="mt-3 text-2xl font-semibold tracking-[-0.035em] sm:text-3xl">{record.goal.title}</h2>
          <p className="mt-4 border-l border-[#d8f48a]/55 pl-4 text-sm leading-7 text-white/70">{record.goal.motivation}</p>
        </div>
        <div className={cardClass}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <Eyebrow>Best next action</Eyebrow>
              <h2 className="mt-2 max-w-2xl text-2xl font-semibold tracking-[-0.03em] text-[#20382e]">{state.currentAction}</h2>
            </div>
            <span className="rounded-full bg-[#e5f0e7] px-3 py-2 text-xs font-bold text-[#426252]">{state.interventionState.replaceAll("_", " ")}</span>
          </div>
          <div className="mt-5 rounded-2xl bg-[#f2f6ef] p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#52675c]">Hard-day version</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-[#365045]">{state.minimumAction}</p>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <button type="button" onClick={onCheckIn} className={primaryButtonClass}>Open check-in</button>
            <button type="button" onClick={onProgress} className={secondaryButtonClass}>Share progress</button>
          </div>
        </div>
        <div className={cardClass}>
          <Eyebrow>Resume point</Eyebrow>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <ResumeField label="Last checkpoint" value={state.resumePoint.lastCompletedCheckpoint} />
            <ResumeField label="Current blocker" value={state.resumePoint.currentBlocker ?? "No blocker confirmed"} />
            <div className="sm:col-span-2"><ResumeField label="Next physical action" value={state.resumePoint.nextPhysicalAction} /></div>
          </div>
        </div>
      </div>

      <div className="space-y-5">
        {showSimulation ? <div className={cardClass}>
          <Eyebrow>Accelerated simulation</Eyebrow>
          <h3 className="mt-2 text-xl font-semibold text-[#243d33]">Compress time, not behavior.</h3>
          <p className="mt-2 text-sm leading-6 text-[#68766f]">The UI clearly labels simulated days while the same state, memory, recovery, and trace contracts remain visible.</p>
          <div className="mt-5 grid gap-2">
            <button type="button" onClick={onNextDay} disabled={state.simulationComplete} className={primaryButtonClass}>Advance to next meaningful day</button>
            <button type="button" onClick={onFullSimulation} disabled={state.simulationComplete} className={secondaryButtonClass}>Run full 30-day story</button>
          </div>
          <div className="mt-5 h-2 overflow-hidden rounded-full bg-[#e8ede8]">
            <div className="h-full rounded-full bg-[#6c967f] transition-all" style={{ width: `${Math.max(4, (state.simulatedDay / 30) * 100)}%` }} />
          </div>
          <p className="mt-2 text-right text-xs font-bold text-[#5d7469]">{`Day ${state.simulatedDay} / 30`}</p>
        </div> : null}
        <div className={cardClass}>
          <Eyebrow>Protection status</Eyebrow>
          <div className="mt-4 space-y-3 text-sm">
            <StatusRow label="Quiet hours" value={quietHours ? "Protected now" : `${record.supportAgreement.quietHours.start}–${record.supportAgreement.quietHours.end}`} good />
            <StatusRow
              label="Check-in"
              value={
                hydrated
                  ? formatDateTime(state.nextCheckAt)
                  : record.supportAgreement.preferredCheckInTime
              }
            />
            <StatusRow label="Repeated delays" value={String(state.delayCount)} good={state.delayCount < 2} />
            <StatusRow label="Stored memories" value={String(state.memories.length)} good />
          </div>
        </div>
        <div className={cardClass}>
          <Eyebrow>Was the last support useful?</Eyebrow>
          <div className="mt-4 flex gap-2">
            {[1, 2, 3, 4, 5].map((rating) => (
              <button type="button" key={rating} onClick={() => onRate(rating)} className="grid size-10 place-items-center rounded-full border border-[#cfd9d2] text-sm font-bold hover:bg-[#d8f48a]">{rating}</button>
            ))}
          </div>
        </div>
      </div>
    </section>
    </Localized>
  );
}

function Eyebrow({ children, light = false }: { children: ReactNode; light?: boolean }) {
  return <p className={`text-[10px] font-bold uppercase tracking-[0.15em] ${light ? "text-[#d8f48a]" : "text-[#52675c]"}`}>{children}</p>;
}

function ResumeField({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl bg-[#f4f6f2] p-4"><p className="text-[10px] font-bold uppercase tracking-[0.11em] text-[#58675f]">{label}</p><p className="mt-2 text-sm font-semibold leading-6 text-[#364c42]">{value}</p></div>;
}

function StatusRow({ label, value, good = false }: { label: string; value: string; good?: boolean }) {
  return <div className="flex items-center justify-between gap-3 border-b border-[#edf0ed] pb-3"><span className="text-[#68766f]">{label}</span><span className={`text-right font-bold ${good ? "text-[#47735c]" : "text-[#354b41]"}`}>{value}</span></div>;
}

function recoveryAction(
  reason: string,
  state: JourneyState,
  record: LocalOnboardingRecord,
) {
  if (reason === "TIME") {
    return {
      action: state.currentAction,
      reason: "The original time did not fit real life.",
      memory: "Moving the check-in protected the same commitment without adding pressure.",
      nextCheckAt: new Date(Date.now() + 24 * 60 * 60 * 1_000).toISOString(),
    };
  }
  if (reason === "METHOD") {
    return {
      action: `Use one focused 15-minute pass on: ${record.action.minimumVersion}`,
      reason: "The previous method created friction.",
      memory: "A time-boxed method is more workable than an open-ended session.",
      nextCheckAt: new Date(Date.now() + 2 * 60 * 60 * 1_000).toISOString(),
    };
  }
  if (reason === "GOAL") {
    return {
      action: state.minimumAction,
      reason: "The direction needs user-led calibration.",
      memory: "Keep the North Star, pause escalation, and revisit whether the method still fits.",
      nextCheckAt: new Date(Date.now() + 24 * 60 * 60 * 1_000).toISOString(),
    };
  }
  return {
    action: state.minimumAction,
    reason: "The action was too large for the available window.",
    memory: "Reducing the action restored momentum without abandoning the goal.",
    nextCheckAt: new Date(Date.now() + 60 * 60 * 1_000).toISOString(),
  };
}

function feedbackFor(format: ProgressFormat, summary: string, action: string): string {
  const evidence = format === "PHOTO" ? "The photo makes the checkpoint visible" : format === "VOICE" ? "The voice update captures what actually changed" : "The written update names the completed work";
  return `${evidence}: ${summary} This matters because it protects continuity on “${action}” instead of treating a difficult day as a reset.`;
}

function fileToDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error ?? new Error("Unable to read media."));
    reader.readAsDataURL(file);
  });
}
