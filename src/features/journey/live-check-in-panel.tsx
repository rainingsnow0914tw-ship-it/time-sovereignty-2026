"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { AgentRunTrace } from "../../domain/agents/schemas";
import {
  Localized,
  speechLanguageForLocale,
  useLocale,
} from "../../i18n/locale";
import type { LocalOnboardingRecord } from "../../repositories/local-onboarding-repository";
import type {
  ClientLiveCheckIn,
  LiveChiefOfStaffDecision,
} from "../../live-checkin/schemas";
import {
  isSpeechRecognitionSupported,
  speakBrowserText,
  transcribeBrowserSpeech,
} from "../../providers/audio/browser-audio-provider";
import {
  REALTIME_VOICE_MODEL,
  REALTIME_VOICE_PROVIDER,
  RealtimeVoiceSession,
  type RealtimeVoiceStatus,
} from "../../providers/audio/realtime-voice-provider";
import {
  preparePhotoEvidence,
  type PreparedPhotoEvidence,
} from "./photo-evidence";
import {
  cadenceForScheduledCheckIn,
  inferFocusMinutes,
  normalizeFocusMinutes,
  planTimingNeedsRestart,
  scheduleAtFromMinutes,
} from "./live-focus-schedule";
import {
  summarizeLiveCheckIn,
  type LiveCheckInSummary,
} from "./live-check-in-summary";

const card =
  "rounded-[1.6rem] border border-[#9eb9aa] bg-[#f7fbf7] p-5 shadow-[0_14px_45px_rgba(23,63,53,0.06)] sm:p-6";
const primary =
  "inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-full bg-[#173f35] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0e3329] focus:outline-none focus:ring-4 focus:ring-[#bcd5c6] disabled:cursor-not-allowed disabled:opacity-45";
const secondary =
  "inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-full border border-[#cfd9d2] bg-white px-5 py-2.5 text-sm font-semibold text-[#28443a] hover:border-[#8aa99a] hover:bg-[#f6faf6] focus:outline-none focus:ring-4 focus:ring-[#dce9df] disabled:cursor-not-allowed disabled:opacity-45";
const input =
  "w-full rounded-2xl border border-[#d9e0da] bg-white px-4 py-3 text-sm text-[#17211d] outline-none focus:border-[#5a8271] focus:ring-4 focus:ring-[#dce9df]/70";

type Connection = "CHECKING" | "DISABLED" | "UNPAIRED" | "PAIRED" | "ERROR";
type CurrentPayload = {
  checkIn: ClientLiveCheckIn | null;
  lastConfirmedCheckIn: ClientLiveCheckIn | null;
};

export function LiveCheckInPanel({
  mode,
  record,
  currentAction,
  minimumAction,
  onCommitmentConfirmed,
  onSummaryChange,
}: {
  mode: "check-in" | "developer";
  record: LocalOnboardingRecord;
  currentAction: string;
  minimumAction: string;
  onCommitmentConfirmed?: (decision: LiveChiefOfStaffDecision) => void;
  onSummaryChange?: (summary: LiveCheckInSummary) => void;
}) {
  const { formatDateTime, locale, t } = useLocale();
  const speechLanguage = speechLanguageForLocale(locale);
  const [connection, setConnection] = useState<Connection>("CHECKING");
  const [current, setCurrent] = useState<ClientLiveCheckIn | null>(null);
  const [lastConfirmed, setLastConfirmed] =
    useState<ClientLiveCheckIn | null>(null);
  const [pairingCode, setPairingCode] = useState("");
  const [deviceLabel, setDeviceLabel] = useState("Chloe Android demo");
  const [reply, setReply] = useState("");
  const [photo, setPhoto] = useState<PreparedPhotoEvidence | null>(null);
  const [preparingPhoto, setPreparingPhoto] = useState(false);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [focusMinutes, setFocusMinutes] = useState(() =>
    inferFocusMinutes(record.goal.targetWindow, record.plan.cadence.kind),
  );
  const [listening, setListening] = useState(false);
  const [realtimeStatus, setRealtimeStatus] =
    useState<RealtimeVoiceStatus>("IDLE");
  const [pausePolling, setPausePolling] = useState(false);
  const realtimeVoiceRef = useRef<RealtimeVoiceSession | null>(null);
  const scheduleIdRef = useRef<string | null>(null);
  const replyAttemptRef = useRef<{
    fingerprint: string;
    replyId: string;
  } | null>(null);
  const confirmationIdRef = useRef<string | null>(null);

  const refreshCurrent = useCallback(async () => {
    const response = await fetch("/api/live/check-ins/current", {
      cache: "no-store",
      credentials: "same-origin",
    });
    if (response.status === 401) {
      setConnection("UNPAIRED");
      setCurrent(null);
      return;
    }
    if (!response.ok) throw new Error("current_unavailable");
    const payload = (await response.json()) as CurrentPayload;
    setConnection("PAIRED");
    setCurrent(payload.checkIn);
    setLastConfirmed(payload.lastConfirmedCheckIn);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      try {
        const response = await fetch("/api/live/session", {
          cache: "no-store",
          credentials: "same-origin",
          signal: controller.signal,
        });
        if (response.status === 404) {
          setConnection("DISABLED");
          return;
        }
        if (response.status === 401) {
          setConnection("UNPAIRED");
          return;
        }
        if (!response.ok) throw new Error("session_unavailable");
        setConnection("PAIRED");
        await refreshCurrent();
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setConnection("ERROR");
        }
      }
    })();
    return () => controller.abort();
  }, [refreshCurrent]);

  useEffect(() => {
    if (connection !== "PAIRED" || pausePolling) return;
    const refreshIfVisible = () => {
      if (document.visibilityState === "visible") {
        void refreshCurrent().catch(() =>
          setNotice(
            "The phone could not refresh the live result. It will retry automatically; do not send the same update again.",
          ),
        );
      }
    };
    const timer = window.setInterval(refreshIfVisible, 5_000);
    document.addEventListener("visibilitychange", refreshIfVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refreshIfVisible);
    };
  }, [connection, pausePolling, refreshCurrent]);

  useEffect(() => {
    if (connection !== "PAIRED") return;
    onSummaryChange?.(summarizeLiveCheckIn(current, lastConfirmed));
  }, [connection, current, lastConfirmed, onSummaryChange]);

  useEffect(() => {
    return () => {
      realtimeVoiceRef.current?.disconnect(false);
      realtimeVoiceRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!realtimeVoiceRef.current) return;
    realtimeVoiceRef.current.disconnect(false);
    realtimeVoiceRef.current = null;
    setRealtimeStatus("IDLE");
    setNotice("Voice locale changed. Start the natural voice again when ready.");
  }, [locale]);

  const pairDevice = async () => {
    setBusy(true);
    setNotice("");
    try {
      const response = await fetch("/api/live/pair", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pairingCode, deviceLabel }),
      });
      if (!response.ok) throw new Error("pairing_failed");
      const payload = (await response.json()) as { expiresAt?: unknown };
      if (typeof payload.expiresAt !== "string") {
        throw new Error("pairing_response_invalid");
      }
      setPairingCode("");
      setConnection("PAIRED");
      setNotice(
        `${t("This device is paired until")} ${formatDateTime(payload.expiresAt)}.`,
      );
      await refreshCurrent();
    } catch {
      setNotice("Pairing was denied or this one-time code is already used.");
    } finally {
      setBusy(false);
    }
  };

  const scheduleCheckIn = async (options: {
    scheduledFor: string;
    cadence: typeof record.plan.cadence;
    message: string;
    pendingNotice: string;
    successNotice: string;
  }) => {
    setBusy(true);
    setNotice(options.pendingNotice);
    try {
      scheduleIdRef.current ??=
        `live-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
      const response = await fetch("/api/live/check-ins/schedule", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduleId: scheduleIdRef.current,
          message: options.message,
          context: {
            goal: record.goal.title,
            motivation: record.goal.motivation,
            targetWindow: record.goal.targetWindow,
            cadence: options.cadence,
            currentAction,
            minimumAction,
            preferredTone: record.supportAgreement.preferredTone,
            locale,
            quietHours: record.supportAgreement.quietHours,
          },
          scheduledFor: options.scheduledFor,
        }),
      });
      const payload = (await response.json()) as { checkIn?: ClientLiveCheckIn };
      if (!response.ok || !payload.checkIn) throw new Error("schedule_failed");
      setCurrent(payload.checkIn);
      setNotice(options.successNotice);
      scheduleIdRef.current = null;
      replyAttemptRef.current = null;
      confirmationIdRef.current = null;
      setReply("");
      setPhoto(null);
    } catch {
      setNotice("The cloud schedule did not complete. The same request can be retried safely.");
    } finally {
      setBusy(false);
    }
  };

  const startFocusBlock = async () => {
    const minutes = normalizeFocusMinutes(focusMinutes);
    setFocusMinutes(minutes);
    const scheduledFor = scheduleAtFromMinutes(minutes);
    const cadence = cadenceForScheduledCheckIn(
      record.plan.cadence,
      scheduledFor,
    );
    await scheduleCheckIn({
      scheduledFor,
      cadence,
      message:
        locale === "zh-TW"
          ? `你為「${currentAction}」安排的 ${minutes} 分鐘行動時間到了。你完成了什麼？可以用文字、語音或照片回報。`
          : `Your ${minutes}-minute work block for “${currentAction}” has reached its check-in. What did you complete? You can reply with text, voice, or a photo.`,
      pendingNotice: "Creating your real check-in with Cloud Tasks…",
      successNotice:
        "Your work block has started. The real check-in is scheduled and this open PWA will watch for it.",
    });
  };

  const scheduleDemo = async () => {
    await scheduleCheckIn({
      scheduledFor: new Date(Date.now() + 15_000).toISOString(),
      cadence: record.plan.cadence,
      message: t(
        `You planned to continue “${currentAction}”. What is true right now?`,
      ),
      pendingNotice: "Scheduling a 15-second infrastructure test…",
      successNotice:
        "Developer test scheduled. Return to Check-in to watch the pending result.",
    });
  };

  const listen = async () => {
    setListening(true);
    setNotice("Listening for one reply…");
    const transcript = await transcribeBrowserSpeech(speechLanguage);
    setListening(false);
    if (transcript) {
      setReply(transcript);
      setNotice("Voice reply transcribed. Review it before sending.");
    } else {
      setNotice(
        isSpeechRecognitionSupported()
          ? "No clear transcript was captured. Try again or type."
          : "Speech transcription is unavailable here; text still works.",
      );
    }
  };

  const startRealtimeVoice = async () => {
    if (!current) return;
    realtimeVoiceRef.current?.disconnect(false);
    const session = new RealtimeVoiceSession({
      onTranscript: (transcript) => {
        setReply(transcript);
        setNotice("Natural voice reply transcribed. Review it before sending.");
      },
      onStatus: (status) => {
        setRealtimeStatus(status);
        if (status === "ERROR") {
          setNotice("Natural voice stopped safely. Text and standard voice still work.");
        }
      },
    });
    realtimeVoiceRef.current = session;
    setNotice("Connecting the protected natural voice…");
    try {
      await session.connect(locale);
      if (realtimeVoiceRef.current !== session) {
        session.disconnect(false);
        return;
      }
      session.speak(t(current.message));
      setNotice("Natural voice is on. Speak once, then review the transcript.");
    } catch {
      if (realtimeVoiceRef.current === session) realtimeVoiceRef.current = null;
      setNotice("Natural voice could not connect. Text and standard voice still work.");
    }
  };

  const stopRealtimeVoice = () => {
    realtimeVoiceRef.current?.disconnect();
    realtimeVoiceRef.current = null;
    setNotice("Natural voice is off. The microphone has been released.");
  };

  const attachPhoto = async (file: File | null) => {
    if (!file) return;
    setPreparingPhoto(true);
    setNotice("Preparing photo evidence on this device…");
    try {
      const prepared = await preparePhotoEvidence(file);
      setPhoto(prepared);
      replyAttemptRef.current = null;
      setNotice("Photo attached. GPT-5.6 will inspect it only when you send.");
    } catch {
      setPhoto(null);
      setNotice("That photo could not be prepared. Try a JPEG, PNG, or WebP image.");
    } finally {
      setPreparingPhoto(false);
    }
  };

  const submitReply = async (
    intent: "REPORT_PROGRESS" | "DELAY" | "SOMETHING_CHANGED",
  ) => {
    if (!current) return;
    const textReply = reply.trim();
    if (intent === "REPORT_PROGRESS" && !textReply && !photo) return;
    setBusy(true);
    setNotice(
      intent === "DELAY"
        ? "GPT-5.6 is deciding what this delay means…"
        : intent === "SOMETHING_CHANGED"
          ? "GPT-5.6 is checking whether the commitment should change…"
          : "GPT-5.6 is reviewing your real progress…",
    );
    try {
      const fingerprint = [
        intent,
        textReply,
        photo?.dataUrl.length ?? 0,
        photo?.dataUrl.slice(-48) ?? "",
      ].join("\u0000");
      if (replyAttemptRef.current?.fingerprint !== fingerprint) {
        replyAttemptRef.current = {
          fingerprint,
          replyId: current.replyId ?? crypto.randomUUID(),
        };
      }
      const response = await fetch(
        `/api/live/check-ins/${encodeURIComponent(current.id)}/reply`,
        {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            replyId: replyAttemptRef.current.replyId,
            intent,
            reply: textReply,
            image: photo
              ? { mimeType: photo.mimeType, dataUrl: photo.dataUrl }
              : null,
          }),
        },
      );
      const payload = (await response.json()) as {
        checkIn?: ClientLiveCheckIn;
        error?: string;
      };
      if (!response.ok || !payload.checkIn) {
        throw new Error(payload.error ?? `reply_failed_${response.status}`);
      }
      setCurrent(payload.checkIn);
      if (payload.checkIn.decision && realtimeVoiceRef.current) {
        realtimeVoiceRef.current.speak(
          [
            payload.checkIn.decision.userMessage,
            payload.checkIn.decision.adaptedCommitment,
          ]
            .filter(Boolean)
            .join(" "),
        );
      }
      setNotice("GPT-5.6 understood the update. Review its real decision below.");
      setReply("");
      setPhoto(null);
      replyAttemptRef.current = null;
    } catch (error) {
      const refreshed = await refreshCurrent()
        .then(() => true)
        .catch(() => false);
      setNotice(
        refreshed
          ? "The direct reply was interrupted, but the phone recovered the latest safe result. Review it below before retrying."
          : `The live reply was not returned (${error instanceof Error ? error.message : "unknown_error"}). Do not resend yet; automatic refresh will keep trying with the same reply identity.`,
      );
    } finally {
      setBusy(false);
    }
  };

  const confirm = async () => {
    if (!current?.decision) return;
    setBusy(true);
    setNotice("Persisting confirmation, memory, and next follow-up…");
    try {
      confirmationIdRef.current ??= crypto.randomUUID();
      const response = await fetch(
        `/api/live/check-ins/${encodeURIComponent(current.id)}/confirm`,
        {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ confirmationId: confirmationIdRef.current }),
        },
      );
      const payload = (await response.json()) as { checkIn?: ClientLiveCheckIn };
      if (!response.ok || !payload.checkIn) throw new Error("confirm_failed");
      realtimeVoiceRef.current?.disconnect();
      realtimeVoiceRef.current = null;
      setCurrent(payload.checkIn);
      setLastConfirmed(payload.checkIn);
      setPausePolling(true);
      setNotice(
        payload.checkIn.decision?.assessment === "COMPLETED"
          ? "Completion confirmed. No artificial thirty-day journey was created."
          : "Confirmed. The next real follow-up is scheduled.",
      );
      onCommitmentConfirmed?.(payload.checkIn.decision!);
    } catch {
      setNotice("Confirmation did not finish. Repeating it is safe and idempotent.");
    } finally {
      setBusy(false);
    }
  };

  const revoke = async () => {
    setBusy(true);
    try {
      const response = await fetch("/api/live/session", {
        method: "DELETE",
        credentials: "same-origin",
      });
      if (!response.ok) throw new Error("revoke_failed");
      realtimeVoiceRef.current?.disconnect();
      realtimeVoiceRef.current = null;
      setConnection("UNPAIRED");
      setCurrent(null);
      setLastConfirmed(null);
      setNotice("This device session is revoked.");
    } catch {
      setNotice("Session revocation needs another attempt.");
    } finally {
      setBusy(false);
    }
  };

  if (connection === "DISABLED") {
    return (
      <Localized>
      <section className={card}>
        <LiveBadge>Private live path</LiveBadge>
        <p className="mt-3 text-sm leading-6 text-[#596b62]">
          This stable public revision keeps the single-device path disabled. It is
          activated only in the protected recording preview.
        </p>
      </section>
      </Localized>
    );
  }

  if (connection === "CHECKING") {
    return <Localized><section className={card}><p className="text-sm text-[#596b62]">Checking private live connection…</p></section></Localized>;
  }

  if (connection === "ERROR") {
    return <Localized><section className={card}><LiveBadge>Private live path</LiveBadge><p className="mt-3 text-sm text-[#7b4b3f]">The protected connection is temporarily unavailable.</p></section></Localized>;
  }

  if (connection === "UNPAIRED") {
    return (
      <Localized>
      <section className={card}>
        <LiveBadge>Single-device protected pairing</LiveBadge>
        <h2 className="mt-3 text-2xl font-semibold text-[#173f35]">Connect this PWA without exposing the API key.</h2>
        {mode === "check-in" ? (
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-bold uppercase tracking-[0.12em] text-[#66766e]">
              One-time pairing code
              <input className={`${input} mt-2`} type="password" autoComplete="one-time-code" value={pairingCode} onChange={(event) => setPairingCode(event.target.value)} />
            </label>
            <label className="text-xs font-bold uppercase tracking-[0.12em] text-[#66766e]">
              Device label
              <input className={`${input} mt-2`} value={deviceLabel} onChange={(event) => setDeviceLabel(event.target.value)} />
            </label>
            <button type="button" className={`${primary} sm:col-span-2`} disabled={busy || pairingCode.length < 12 || !deviceLabel.trim()} onClick={pairDevice}>Pair this device</button>
          </div>
        ) : (
          <p className="mt-3 text-sm text-[#596b62]">Pair from Check-in mode to reveal real provider, model, tokens, and trace IDs.</p>
        )}
        {notice ? <p className="mt-3 text-sm text-[#596b62]" role="status">{notice}</p> : null}
      </section>
      </Localized>
    );
  }

  const traceSource = current?.traces.length ? current : lastConfirmed;
  const realtimeActive = !["IDLE", "ERROR"].includes(realtimeStatus);
  if (mode === "developer") {
    return (
      <Localized>
      <section className={card}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><LiveBadge>Real mobile trace</LiveBadge><h2 className="mt-2 text-2xl font-semibold text-[#173f35]">Provider evidence from the user-facing path</h2></div>
          <button type="button" className={secondary} disabled={busy} onClick={revoke}>Revoke device</button>
        </div>
        <div className="mt-5 rounded-2xl border border-[#c9d9cd] bg-white p-4">
          <LiveBadge>Natural voice layer</LiveBadge>
          <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
            <div><dt className="text-[#6b786f]">Provider</dt><dd className="font-bold text-[#28443a]">{REALTIME_VOICE_PROVIDER}</dd></div>
            <div><dt className="text-[#6b786f]">Model / transport</dt><dd className="font-bold text-[#28443a]">{REALTIME_VOICE_MODEL} · WebRTC</dd></div>
            <div><dt className="text-[#6b786f]">Session status</dt><dd className="font-bold text-[#28443a]">{realtimeStatusLabel(realtimeStatus)}</dd></div>
          </dl>
          <p className="mt-3 text-xs leading-5 text-[#5f6a64]">User-start only. The voice layer transcribes and speaks; GPT-5.6 remains the structured decision brain.</p>
        </div>
        {traceSource?.traces.length ? <TraceTable traces={traceSource.traces} /> : <p className="mt-4 text-sm text-[#596b62]">No live mobile Agent call has completed yet.</p>}
        {!current ? (
          <details className="mt-5 rounded-2xl border border-[#d7dfd8] bg-white p-4">
            <summary className="cursor-pointer text-sm font-bold text-[#40564b]">
              Developer acceptance control
            </summary>
            <p className="mt-3 text-xs leading-5 text-[#66736c]">
              This creates a real Cloud Task after 15 seconds. It proves the
              infrastructure only and is not the user journey.
            </p>
            <button
              type="button"
              className={`${secondary} mt-3`}
              disabled={busy}
              onClick={() => void scheduleDemo()}
            >
              Schedule 15-second infrastructure test
            </button>
          </details>
        ) : null}
        <p className="mt-4 text-xs leading-5 text-[#5f6a64]">Raw reply, prompt, secrets, and private reasoning are excluded. These rows come from Firestore, not the local simulation.</p>
        {notice ? <p className="mt-3 text-sm text-[#596b62]" role="status">{notice}</p> : null}
      </section>
      </Localized>
    );
  }

  return (
    <Localized>
    <section className={card}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><LiveBadge>Real Cloud Tasks + GPT-5.6</LiveBadge><h2 className="mt-2 text-2xl font-semibold text-[#173f35]">Private incoming check-in</h2></div>
        <button type="button" className={secondary} disabled={busy} onClick={revoke}>Revoke device</button>
      </div>
      {!current ? (
        <div className="mt-5 rounded-2xl border border-[#c9d9cd] bg-white p-5">
          <h3 className="text-xl font-semibold text-[#173f35]">
            Start your real work block
          </h3>
          <p className="mt-2 text-sm leading-6 text-[#596b62]">
            Choose how long you want to work. Cloud Tasks will bring the
            check-in back at the end, when text, voice, and photo reporting
            become available.
          </p>
          {planTimingNeedsRestart(record.action.nextCheckAt, record.savedAt) ? (
            <p className="mt-3 rounded-xl bg-[#fff7dc] px-4 py-3 text-xs leading-5 text-[#705717]">
              The earlier proposed time expired while setup was being
              confirmed. Starting here creates a fresh real schedule instead
              of silently moving it to tomorrow.
            </p>
          ) : null}
          <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,12rem)_1fr] sm:items-end">
            <label className="text-xs font-bold uppercase tracking-[0.12em] text-[#66766e]">
              Focus minutes
              <input
                className={`${input} mt-2`}
                type="number"
                inputMode="numeric"
                min={2}
                max={1440}
                value={focusMinutes}
                onChange={(event) => setFocusMinutes(Number(event.target.value))}
              />
            </label>
            <button
              type="button"
              className={primary}
              disabled={busy}
              onClick={() => void startFocusBlock()}
            >
              Start and schedule check-in
            </button>
          </div>
          <p className="mt-3 text-xs leading-5 text-[#66736c]">
            Keep the PWA open near the check-in time. Background push and
            lock-screen vibration are a separate capability and are not
            claimed here yet.
          </p>
        </div>
      ) : null}
      {current?.status === "SCHEDULED" && current.scheduledFor ? (
        <div className="mt-5 rounded-2xl border border-[#c9d9cd] bg-white p-5">
          <p className="text-sm font-semibold text-[#284b3d]">
            Your real check-in is scheduled
          </p>
          <p className="mt-1 text-lg font-semibold text-[#173f35]">
            {formatDateTime(current.scheduledFor)}
          </p>
          <p className="mt-2 text-xs leading-5 text-[#66736c]">
            When it arrives, this card changes into the text, voice, and photo
            report form automatically. Polling works while this PWA is open.
          </p>
        </div>
      ) : null}
      {current && ["PENDING", "FAILED"].includes(current.status) ? (
        <div className="mt-5">
          <h3 className="text-xl font-semibold text-[#173f35]">{current.message}</h3>
          <div className="mt-4 flex flex-wrap gap-2">
            {realtimeActive ? <button type="button" className={secondary} onClick={stopRealtimeVoice}>■ Stop natural voice</button> : <button type="button" className={primary} disabled={realtimeStatus === "CONNECTING"} onClick={() => void startRealtimeVoice()}>✦ Start natural voice</button>}
            <button type="button" className={secondary} onClick={() => void speakBrowserText(t(current.message), { language: speechLanguage })}>▶ Standard voice</button>
            <button type="button" className={secondary} disabled={listening} onClick={listen}>{listening ? "Listening…" : "🎙 Standard voice reply"}</button>
          </div>
          <p className="mt-3 text-xs leading-5 text-[#5f6a64]">Natural voice: {realtimeStatusLabel(realtimeStatus)}. It starts only after your tap and releases the microphone when stopped.</p>
          <label className="mt-4 block text-xs font-bold uppercase tracking-[0.12em] text-[#66766e]">Voice transcript or text reply<textarea className={`${input} mt-2 min-h-28 resize-y`} value={reply} onChange={(event) => setReply(event.target.value)} placeholder="What changed, in your own words…" /></label>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <label className={`${secondary} cursor-pointer`}>
              {preparingPhoto ? "Preparing photo…" : "📷 Attach progress photo"}
              <input
                className="sr-only"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                capture="environment"
                disabled={busy || preparingPhoto}
                onChange={(event) => {
                  void attachPhoto(event.currentTarget.files?.[0] ?? null);
                  event.currentTarget.value = "";
                }}
              />
            </label>
            {photo ? (
              <>
                <span className="max-w-full truncate rounded-full bg-[#e2efe5] px-3 py-2 text-xs font-semibold text-[#315447]">
                  ✓ {photo.originalName}
                </span>
                <button
                  type="button"
                  className={secondary}
                  disabled={busy}
                  onClick={() => {
                    setPhoto(null);
                    replyAttemptRef.current = null;
                  }}
                >
                  Remove photo
                </button>
              </>
            ) : null}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              className={primary}
              disabled={busy || preparingPhoto || (!reply.trim() && !photo)}
              onClick={() => void submitReply("REPORT_PROGRESS")}
            >
              {current.status === "FAILED" ? "Retry the same live decision" : "Send update"}
            </button>
            <button
              type="button"
              className={secondary}
              disabled={busy || preparingPhoto}
              onClick={() => void submitReply("DELAY")}
            >
              Delay once
            </button>
            <button
              type="button"
              className={secondary}
              disabled={busy || preparingPhoto}
              onClick={() => void submitReply("SOMETHING_CHANGED")}
            >
              Something changed
            </button>
          </div>
        </div>
      ) : null}
      {current?.status === "PROCESSING" ? <p className="mt-5 rounded-2xl bg-[#fff2cc] p-4 text-sm font-semibold text-[#6f5310]">Chief of Staff is reviewing the evidence. Recovery joins only if the situation truly needs it.</p> : null}
      {current?.decision ? <DecisionCard checkIn={current} busy={busy} onConfirm={confirm} onSpeak={realtimeActive ? () => realtimeVoiceRef.current?.speak(`${current.decision!.userMessage} ${current.decision!.adaptedCommitment}`) : undefined} /> : null}
      {notice ? <p className="mt-4 text-sm text-[#596b62]" role="status">{notice}</p> : null}
    </section>
    </Localized>
  );
}

function DecisionCard({ checkIn, busy, onConfirm, onSpeak }: { checkIn: ClientLiveCheckIn; busy: boolean; onConfirm: () => void; onSpeak?: () => void }) {
  const { formatDateTime } = useLocale();
  const decision = checkIn.decision!;
  const assessment = decision.assessment ?? "BLOCKED";
  const recoveryUsed = decision.dispatchedAgents.includes("COMMITMENT_RECOVERY");
  return (
    <Localized>
    <div className="mt-5 rounded-2xl border border-[#c9d9cd] bg-white p-5">
      <div className="flex flex-wrap gap-2">
        <LiveBadge>{checkIn.status === "CONFIRMED" ? "Confirmed live decision" : "Review before persistence"}</LiveBadge>
        <LiveBadge>{assessment.replaceAll("_", " ")}</LiveBadge>
        {recoveryUsed ? <LiveBadge>Recovery joined</LiveBadge> : <LiveBadge>Progress reviewed directly</LiveBadge>}
      </div>
      <p className="mt-3 text-sm leading-6 text-[#40594e]">{decision.userMessage}</p>
      <p className="mt-4 text-xs font-bold uppercase tracking-[0.12em] text-[#66766e]">{assessment === "COMPLETED" ? "Recorded outcome" : recoveryUsed ? "Adapted commitment" : "Next commitment"}</p>
      <p className="mt-1 text-lg font-semibold text-[#173f35]">{decision.adaptedCommitment}</p>
      <p className="mt-3 rounded-xl bg-[#f4f6f2] px-3 py-2 text-xs leading-5 text-[#5d6b64]">
        Any photo used for this decision was temporary and is not stored. The
        saved record contains only the structured outcome, safe trace, memory
        proposal, and follow-up state.
      </p>
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2"><div><dt className="text-[#6b786f]">Strategy</dt><dd className="font-bold text-[#28443a]">{decision.selectedStrategy ?? "No recovery strategy needed"}</dd></div><div><dt className="text-[#6b786f]">Next follow-up</dt><dd className="font-bold text-[#28443a]">{decision.nextFollowUpAt ? formatDateTime(decision.nextFollowUpAt) : "No follow-up scheduled"}</dd></div></dl>
      {decision.memoryProposal ? <p className="mt-4 rounded-2xl bg-[#edf5e8] p-3 text-sm text-[#40594e]">Memory proposal: {decision.memoryProposal.summary}</p> : null}
      {onSpeak ? <button type="button" className={`${secondary} mt-4`} onClick={onSpeak}>▶ Play with natural voice</button> : null}
      {checkIn.status === "DECISION_READY" ? <button type="button" className={`${primary} mt-5 w-full`} disabled={busy} onClick={onConfirm}>{assessment === "COMPLETED" ? "Confirm completion" : recoveryUsed ? "Confirm adapted commitment" : "Confirm next commitment"}</button> : <p className="mt-5 text-sm font-bold text-[#4c765f]">✓ Decision, memory, and follow-up state persisted</p>}
    </div>
    </Localized>
  );
}

function realtimeStatusLabel(status: RealtimeVoiceStatus): string {
  if (status === "CONNECTING") return "connecting";
  if (status === "READY") return "ready and listening";
  if (status === "LISTENING") return "hearing your reply";
  if (status === "SPEAKING") return "speaking";
  if (status === "ERROR") return "stopped safely";
  return "off";
}

function TraceTable({ traces }: { traces: AgentRunTrace[] }) {
  return (
    <Localized>
    <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[680px] border-collapse text-left text-xs"><thead><tr className="border-b border-[#dfe5df] text-[#59665f]"><th className="py-3 pr-4">Agent</th><th className="py-3 pr-4">Provider / returned model</th><th className="py-3 pr-4">Tokens</th><th className="py-3">Trace ID</th></tr></thead><tbody>{traces.map((trace) => <tr key={trace.runId} className="border-b border-[#e3e9e4] align-top"><td className="py-3 pr-4 font-bold text-[#2e493d]">{trace.agent.replaceAll("_", " ")}</td><td className="py-3 pr-4 text-[#5f7068]">{trace.provider} · {trace.model}</td><td className="py-3 pr-4 text-[#5f7068]">{trace.tokenUsage?.totalTokens ?? "—"}</td><td className="break-all py-3 text-[#5f7068]">{trace.runId}</td></tr>)}</tbody></table></div>
    </Localized>
  );
}

function LiveBadge({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex rounded-full bg-[#dfeee2] px-3 py-1 text-xs font-bold uppercase tracking-[0.1em] text-[#315447]">{children}</span>;
}
