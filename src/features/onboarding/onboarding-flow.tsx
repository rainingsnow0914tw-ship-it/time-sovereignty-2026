"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";

import type { AgentRunTrace } from "../../domain/agents/schemas";
import type { GoalPlan } from "../../domain/goals/schemas";
import {
  LanguageToggle,
  Localized,
  useLocale,
} from "../../i18n/locale";
import { JourneyWorkspace } from "../journey/journey-workspace";
import { planTimingNeedsRestart } from "../journey/live-focus-schedule";
import type { LiveCheckInSummary } from "../journey/live-check-in-summary";
import {
  createConfirmedOnboardingRecord,
  createLocalOnboardingRepository,
  type LocalOnboardingRecord,
  type OnboardingStorageProfile,
} from "../../repositories/local-onboarding-repository";
import {
  createLiveGoalArchitectResult,
  LiveGoalArchitectClientError,
  LivePairingClientError,
  pairLiveGoalArchitectDevice,
} from "./live-goal-architect-client";
import {
  applyGoalCadenceRecommendation,
  applyPlanFeedback,
  createMockGoalArchitectResult,
  defaultSupportAgreementDraft,
  SupportAgreementDraftSchema,
  type OnboardingAnswers,
  type ProgressFormat,
  type SupportAgreementDraft,
  type SupportChannel,
} from "./model";

type Stage = "goal" | "window" | "why" | "plan" | "support" | "complete";

const stageOrder: Stage[] = [
  "goal",
  "window",
  "why",
  "plan",
  "support",
  "complete",
];

const frequencies = [
  { value: "DAILY", label: "Every day" },
  { value: "WEEKDAYS", label: "Weekdays" },
  { value: "WEEKLY", label: "Weekly" },
  { value: "CUSTOM", label: "Goal-led" },
] as const;

function cadenceKindLabel(kind: GoalPlan["cadence"]["kind"]): string {
  switch (kind) {
    case "SPRINT":
      return "Short sprint";
    case "PROJECT":
      return "Longer project";
    case "HABIT":
      return "Ongoing habit";
  }
}

function cadenceFrequencyLabel(
  frequency: GoalPlan["cadence"]["checkInFrequency"],
): string {
  return frequencies.find((item) => item.value === frequency)?.label ?? "Goal-led";
}

function interventionIntensityLabel(
  intensity: SupportAgreementDraft["interventionIntensity"],
): string {
  switch (intensity) {
    case "GENTLE":
      return "Gentle";
    case "BALANCED":
      return "Balanced";
    case "FIRM":
      return "Firm";
  }
}

const intensities = [
  {
    value: "GENTLE",
    label: "Gentle",
    detail: "Invite me back without pressure.",
  },
  {
    value: "BALANCED",
    label: "Balanced",
    detail: "Warm first, direct when a pattern repeats.",
  },
  {
    value: "FIRM",
    label: "Firm",
    detail: "Name avoidance clearly and ask for a decision.",
  },
] as const;

const channelOptions: Array<{ value: SupportChannel; label: string }> = [
  { value: "TEXT", label: "Text" },
  { value: "TTS", label: "Tap-to-play voice" },
  { value: "VOICE", label: "Voice reply" },
];

const progressOptions: Array<{ value: ProgressFormat; label: string }> = [
  { value: "TEXT", label: "Text" },
  { value: "PHOTO", label: "Photo" },
  { value: "VOICE", label: "Voice" },
];

const inputClass =
  "w-full rounded-2xl border border-[#d9dfda] bg-[#fbfbf8] px-4 py-3.5 text-[15px] text-[#17211d] outline-none transition placeholder:text-[#9aa39f] focus:border-[#527b6b] focus:bg-white focus:ring-4 focus:ring-[#dce9df]/70";

const primaryButtonClass =
  "inline-flex min-h-12 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-[#173f35] px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_28px_rgba(23,63,53,0.18)] transition hover:-translate-y-0.5 hover:bg-[#0f332a] focus:outline-none focus:ring-4 focus:ring-[#bcd5c6] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0";

const secondaryButtonClass =
  "inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-full border border-[#d5dcd7] bg-white px-5 py-2.5 text-sm font-semibold text-[#30443c] transition hover:border-[#9eb6aa] hover:bg-[#f8faf7] focus:outline-none focus:ring-4 focus:ring-[#dce9df]/70";

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`relative grid shrink-0 place-items-center rounded-full bg-[#173f35] ${compact ? "size-9" : "size-11"}`}
      aria-hidden="true"
    >
      <span className="absolute size-[58%] rounded-full border border-[#d8f48a]/80" />
      <span className="absolute h-px w-[54%] -rotate-12 bg-[#d8f48a]" />
      <span className="absolute right-[22%] top-[22%] size-1.5 rounded-full bg-[#f7f5ef]" />
    </div>
  );
}

function ArrowRight() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="size-4" aria-hidden="true">
      <path
        d="M4 10h11m-4-4 4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="size-4" aria-hidden="true">
      <path
        d="m4.5 10.5 3.3 3.2 7.7-8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PairingRecoveryCard({
  pairingCode,
  deviceLabel,
  busy,
  error,
  onPairingCodeChange,
  onDeviceLabelChange,
  onSubmit,
}: {
  pairingCode: string;
  deviceLabel: string;
  busy: boolean;
  error: string | null;
  onPairingCodeChange: (value: string) => void;
  onDeviceLabelChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto mt-5 max-w-xl rounded-[1.4rem] border border-[#d9cfa8] bg-[#fffaf0] p-5 shadow-[0_12px_35px_rgba(95,76,22,0.08)]"
    >
      <p className="text-xs font-bold uppercase tracking-[0.13em] text-[#80651b]">
        Pairing expired
      </p>
      <h3 className="mt-2 text-xl font-semibold text-[#3f361d]">
        Re-pair this browser and continue
      </h3>
      <p className="mt-2 text-sm leading-6 text-[#655b3f]">
        Your three answers are still here. A fresh one-time code restores the
        protected session, then retries the same plan request automatically.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-bold text-[#554b32]">
          New one-time pairing code
          <input
            className={`${inputClass} mt-2`}
            type="password"
            autoComplete="one-time-code"
            value={pairingCode}
            onChange={(event) => onPairingCodeChange(event.target.value)}
          />
        </label>
        <label className="text-xs font-bold text-[#554b32]">
          Device label
          <input
            className={`${inputClass} mt-2`}
            value={deviceLabel}
            maxLength={120}
            onChange={(event) => onDeviceLabelChange(event.target.value)}
          />
        </label>
      </div>
      {error ? (
        <p role="alert" className="mt-3 rounded-xl bg-[#fff0ea] px-4 py-3 text-sm text-[#8a432c]">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        className={`${primaryButtonClass} mt-4 w-full`}
        disabled={busy || pairingCode.length < 12 || !deviceLabel.trim()}
      >
        {busy ? "Pairing and retrying…" : "Pair and continue"}
      </button>
      <p className="mt-3 text-xs leading-5 text-[#73684a]">
        The recording profile remains unchanged. Pairing never exposes the API
        key to this browser.
      </p>
    </form>
  );
}

function ProgressHeader({ stage }: { stage: Stage }) {
  const current = stageOrder.indexOf(stage);
  const progress = stage === "complete" ? 100 : ((current + 1) / 5) * 100;
  const label =
    current < 3
      ? `Question ${current + 1} of 3`
      : stage === "plan"
        ? "Your first plan"
        : stage === "support"
          ? "Support agreement"
          : "Setup complete";

  return (
    <Localized>
    <div className="border-b border-[#e5e8e4] px-5 py-4 sm:px-8">
      <div className="mb-2.5 flex items-center justify-between gap-4 text-xs font-semibold tracking-wide text-[#52615a]">
        <span>{label}</span>
        <span>{Math.round(progress)}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-[#e9ece7]">
        <div
          className="h-full rounded-full bg-[#6a917e] transition-[width] duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
    </Localized>
  );
}

function Shell({
  stage,
  liveGoalArchitect,
  children,
}: {
  stage: Stage;
  liveGoalArchitect: boolean;
  children: ReactNode;
}) {
  const workspace = stage === "complete";
  return (
    <Localized>
    <main className="min-h-screen px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
      <div className={`mx-auto min-h-[calc(100vh-2rem)] overflow-hidden rounded-[2rem] border border-[#173f35]/10 bg-white shadow-[0_28px_90px_rgba(31,63,50,0.12)] sm:min-h-[calc(100vh-3rem)] ${workspace ? "max-w-[1480px]" : "grid max-w-[1180px] lg:grid-cols-[0.72fr_1.28fr]"}`}>
        {!workspace ? (
          <aside className="relative hidden overflow-hidden bg-[#173f35] p-10 text-white lg:flex lg:flex-col">
          <div className="absolute -right-24 -top-20 size-72 rounded-full border border-[#d8f48a]/20" />
          <div className="absolute -right-8 -top-8 size-40 rounded-full border border-[#d8f48a]/25" />
          <div className="relative flex items-center gap-3">
            <BrandMark />
            <div>
              <p className="text-sm font-semibold tracking-wide">Time Sovereignty</p>
              <p className="text-xs text-white/55">AI Chief of Staff</p>
            </div>
            <span className="ml-auto"><LanguageToggle dark /></span>
          </div>

          <div className="relative my-auto py-14">
            <p className="max-w-sm text-[2.65rem] font-medium leading-[1.08] tracking-[-0.045em]">
              Make the next move survive real life.
            </p>
            <p className="mt-6 max-w-sm text-[15px] leading-7 text-white/65">
              One meaningful goal. A plan you approve. Support that adapts
              without taking control away from you.
            </p>
          </div>

          <div className="relative space-y-3 border-t border-white/10 pt-6 text-sm text-white/72">
            {["You approve the plan", "You set the boundaries", "You stay in control"].map(
              (promise) => (
                <div key={promise} className="flex items-center gap-3">
                  <span className="grid size-6 place-items-center rounded-full bg-[#d8f48a] text-[#173f35]">
                    <CheckIcon />
                  </span>
                  {promise}
                </div>
              ),
            )}
          </div>
          </aside>
        ) : null}

        <section className="flex min-w-0 flex-col bg-[#fffefa]">
          {!workspace ? (
            <header className="flex items-center justify-between border-b border-[#e5e8e4] px-5 py-4 lg:hidden">
            <div className="flex items-center gap-2.5">
              <BrandMark compact />
              <div>
                <p className="text-sm font-semibold text-[#173f35]">Time Sovereignty</p>
                <p className="text-[11px] text-[#5f6964]">AI Chief of Staff</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden rounded-full bg-[#edf4ee] px-3 py-1.5 text-[11px] font-semibold text-[#436457] sm:inline">Private setup</span>
              <LanguageToggle />
            </div>
            </header>
          ) : null}
          {!workspace ? <ProgressHeader stage={stage} /> : null}
          <div className={`flex flex-1 justify-center ${workspace ? "items-start p-3 sm:p-5" : "items-center px-5 py-8 sm:px-8 sm:py-12"}`}>
            <div key={stage} className={`stage-enter w-full ${workspace ? "max-w-[1380px]" : "max-w-[690px]"}`}>
              {children}
            </div>
          </div>
          <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-[#e8ebe7] px-5 py-3 text-[11px] text-[#5f6a64] sm:px-8">
            <span>
              {workspace
                ? "Local journey · protected cloud orchestration"
                : liveGoalArchitect
                  ? "Private play profile · live GPT-5.6"
                  : "Mock mode · no API usage"}
            </span>
            <span>{workspace ? "Journey state and safe traces persist in this browser" : "Saved only in this browser after confirmation"}</span>
          </footer>
        </section>
      </div>
    </main>
    </Localized>
  );
}

function QuestionScreen({
  number,
  title,
  description,
  example,
  defaultValue,
  onBack,
  onSubmit,
  multiline = false,
  busy = false,
}: {
  number: number;
  title: string;
  description: string;
  example: string;
  defaultValue: string;
  onBack?: () => void;
  onSubmit: (answer: string) => void | Promise<void>;
  multiline?: boolean;
  busy?: boolean;
}) {
  return (
    <Localized>
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const answer = String(
          new FormData(event.currentTarget).get("answer") ?? "",
        ).trim();
        if (answer.length < 2) return;
        void onSubmit(answer);
      }}
      className="mx-auto max-w-xl"
    >
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#4f6d5e]">
        0{number} · Your north star
      </p>
      <h1 className="mt-4 text-3xl font-semibold leading-tight tracking-[-0.035em] text-[#17211d] sm:text-[2.55rem]">
        {title}
      </h1>
      <p className="mt-4 text-[15px] leading-7 text-[#68736d]">{description}</p>

      <label className="mt-8 block">
        <span className="sr-only">{title}</span>
        {multiline ? (
          <textarea
            autoFocus
            required
            minLength={2}
            rows={4}
            maxLength={2_000}
            name="answer"
            className={`${inputClass} resize-none text-base leading-7`}
            placeholder={example}
            defaultValue={defaultValue}
          />
        ) : (
          <input
            autoFocus
            required
            minLength={2}
            maxLength={240}
            name="answer"
            className={`${inputClass} text-base`}
            placeholder={example}
            defaultValue={defaultValue}
          />
        )}
      </label>

      <div className="mt-8 flex items-center justify-between gap-3">
        {onBack ? (
          <button type="button" onClick={onBack} className={secondaryButtonClass}>
            Back
          </button>
        ) : (
          <p className="max-w-[230px] text-xs leading-5 text-[#606a65]">
            Natural, unfinished answers are welcome.
          </p>
        )}
        <button
          type="submit"
          disabled={busy}
          className={primaryButtonClass}
        >
          {busy ? "Designing your plan…" : number === 3 ? "Create my plan" : "Continue"}
          {!busy && <ArrowRight />}
        </button>
      </div>
    </form>
    </Localized>
  );
}

function PlanReview({
  plan,
  trace,
  editing,
  concern,
  error,
  onPlanChange,
  onEditingChange,
  onConcernChange,
  onApplyConcern,
  onBack,
  onConfirm,
}: {
  plan: GoalPlan;
  trace: AgentRunTrace;
  editing: boolean;
  concern: string;
  error: string | null;
  onPlanChange: (plan: GoalPlan) => void;
  onEditingChange: (editing: boolean) => void;
  onConcernChange: (concern: string) => void;
  onApplyConcern: () => void;
  onBack: () => void;
  onConfirm: () => void;
}) {
  return (
    <Localized>
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#4f6d5e]">
            {trace.provider === "openai"
              ? "Goal Architect · live GPT-5.6"
              : "Goal Architect · mock preview"}
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-[#17211d] sm:text-[2.35rem]">
            Here&apos;s what I understood.
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[#69746e]">
            This is a starting hypothesis—not a permanent contract. Change
            anything that doesn&apos;t feel true.
          </p>
        </div>
        <span className="rounded-full border border-[#bed0c5] bg-[#eef5ef] px-3 py-1.5 text-xs font-semibold text-[#496a5b]">
          {trace.provider === "openai"
            ? `Live · ${trace.model} · Schema validated`
            : "Schema validated"}
        </span>
      </div>

      {editing ? (
        <div className="mt-7 grid gap-5 rounded-[1.65rem] border border-[#dce2dd] bg-white p-5 shadow-sm sm:p-6">
          <EditField
            label="Goal"
            value={plan.goalSummary}
            onChange={(value) => onPlanChange({ ...plan, goalSummary: value })}
          />
          <div className="grid gap-5 sm:grid-cols-2">
            <EditField
              label="Target window"
              value={plan.targetWindow}
              onChange={(value) => onPlanChange({ ...plan, targetWindow: value })}
            />
            <EditField
              label="First milestone"
              value={plan.firstMilestone}
              onChange={(value) => onPlanChange({ ...plan, firstMilestone: value })}
            />
          </div>
          <EditField
            label="Why it matters"
            value={plan.motivation}
            onChange={(value) => onPlanChange({ ...plan, motivation: value })}
            multiline
          />
          <EditField
            label="Best next action"
            value={plan.bestNextAction}
            onChange={(value) => onPlanChange({ ...plan, bestNextAction: value })}
          />
          <EditField
            label="Minimum version on a hard day"
            value={plan.minimumViableAction}
            onChange={(value) => onPlanChange({ ...plan, minimumViableAction: value })}
          />
          <button
            type="button"
            onClick={() => onEditingChange(false)}
            className={`${secondaryButtonClass} justify-self-start`}
          >
            Done adjusting
          </button>
        </div>
      ) : (
        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          <PlanCard className="sm:col-span-2" label="North star" value={plan.goalSummary} />
          <PlanCard label="Target window" value={plan.targetWindow} />
          <PlanCard label="First milestone" value={plan.firstMilestone} />
          <PlanCard className="sm:col-span-2" label="Why it matters" value={plan.motivation} />
          <PlanCard
            accent
            label="Best next action"
            value={plan.bestNextAction}
          />
          <PlanCard
            label="Minimum version"
            value={plan.minimumViableAction}
          />
        </div>
      )}

      <div className="mt-4 rounded-[1.4rem] border border-[#b8cdbf] bg-[#eef6ef] p-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#4f6d5e]">
          Goal rhythm
        </p>
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs text-[#68776f]">Goal type</p>
            <p className="mt-1 font-semibold text-[#244538]">
              {cadenceKindLabel(plan.cadence.kind)}
            </p>
          </div>
          <div>
            <p className="text-xs text-[#68776f]">Recommended check-ins</p>
            <p className="mt-1 font-semibold text-[#244538]">
              <span>{cadenceFrequencyLabel(plan.cadence.checkInFrequency)}</span>
              {" · "}
              {plan.cadence.preferredCheckInTime}
            </p>
          </div>
          <div>
            <p className="text-xs text-[#68776f]">Agreement review</p>
            <p className="mt-1 font-semibold text-[#244538]">
              {plan.cadence.reviewFrequencyDays} <span>days</span>
            </p>
          </div>
        </div>
        <p className="mt-4 text-sm leading-6 text-[#50675c]">
          {plan.cadence.rationale}
        </p>
        <p className="mt-3 text-xs leading-5 text-[#68776f]">
          <span>Completion signal:</span> {plan.cadence.completionSignal}
        </p>
      </div>

      <details className="mt-5 rounded-2xl border border-[#e1e5e1] bg-[#fafaf7] p-4 text-sm">
        <summary className="cursor-pointer font-semibold text-[#43554d]">
          Assumptions to confirm ({plan.assumptionsNeedingConfirmation.length})
        </summary>
        <ul className="mt-3 space-y-2 pl-5 text-[#6a746f]">
          {plan.assumptionsNeedingConfirmation.map((assumption) => (
            <li key={assumption} className="list-disc leading-6">
              {assumption}
            </li>
          ))}
        </ul>
      </details>

      <details className="mt-3 rounded-2xl border border-[#e1e5e1] bg-white p-4 text-sm">
        <summary className="cursor-pointer font-semibold text-[#43554d]">
          Tell me what feels wrong
        </summary>
        <textarea
          rows={3}
          className={`${inputClass} mt-4 resize-none`}
          placeholder="Example: This assumes I have energy every evening…"
          value={concern}
          onChange={(event) => onConcernChange(event.target.value)}
        />
        <button
          type="button"
          disabled={concern.trim().length < 2}
          onClick={onApplyConcern}
          className={`${secondaryButtonClass} mt-3 disabled:cursor-not-allowed disabled:opacity-45`}
        >
          Add this to the plan
        </button>
      </details>

      {error && (
        <p role="alert" className="mt-4 rounded-xl bg-[#fff0ea] px-4 py-3 text-sm text-[#8a432c]">
          {error}
        </p>
      )}

      <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={onBack} className={secondaryButtonClass}>
          Back
        </button>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onEditingChange(true)}
            className={secondaryButtonClass}
          >
            Adjust plan
          </button>
          <button type="button" onClick={onConfirm} className={primaryButtonClass}>
            This feels right
            <ArrowRight />
          </button>
        </div>
      </div>
    </div>
    </Localized>
  );
}

function PlanCard({
  label,
  value,
  accent = false,
  className = "",
}: {
  label: string;
  value: string;
  accent?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 sm:p-5 ${
        accent
          ? "border-[#a9c3b5] bg-[#eaf3ec]"
          : "border-[#e0e4df] bg-white"
      } ${className}`}
    >
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#55635c]">
        {label}
      </p>
      <p className="mt-2 text-[15px] font-medium leading-6 text-[#24332d]">{value}</p>
    </div>
  );
}

function EditField({
  label,
  value,
  onChange,
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-[#68776f]">
        {label}
      </span>
      {multiline ? (
        <textarea
          required
          rows={3}
          className={`${inputClass} resize-none`}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <input
          required
          className={inputClass}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </label>
  );
}

function SupportAgreementForm({
  value,
  recommendation,
  onChange,
  error,
  onBack,
  onSubmit,
}: {
  value: SupportAgreementDraft;
  recommendation: GoalPlan["cadence"] | null;
  onChange: (value: SupportAgreementDraft) => void;
  error: string | null;
  onBack: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const toggleChannel = (channel: SupportChannel) => {
    onChange({
      ...value,
      allowedChannels: value.allowedChannels.includes(channel)
        ? value.allowedChannels.filter((item) => item !== channel)
        : [...value.allowedChannels, channel],
    });
  };

  const toggleProgress = (format: ProgressFormat) => {
    onChange({
      ...value,
      progressSharingFormats: value.progressSharingFormats.includes(format)
        ? value.progressSharingFormats.filter((item) => item !== format)
        : [...value.progressSharingFormats, format],
    });
  };

  return (
    <Localized>
    <form onSubmit={onSubmit}>
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#4f6d5e]">
        Your boundaries
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-[#17211d] sm:text-[2.35rem]">
        How should I support you?
      </h1>
      <p className="mt-3 max-w-xl text-sm leading-6 text-[#69746e]">
        You choose the rhythm, tone, and limits. This agreement stays editable
        and never gives the AI permission to override you.
      </p>

      {recommendation ? (
        <div className="mt-5 rounded-2xl border border-[#b8cdbf] bg-[#eef6ef] p-4 text-sm leading-6 text-[#405e50]">
          <p className="font-semibold text-[#244538]">
            <span>Goal Architect recommendation</span>
            {" · "}
            <span>{cadenceKindLabel(recommendation.kind)}</span>
          </p>
          <p className="mt-1">
            <span>{cadenceFrequencyLabel(recommendation.checkInFrequency)}</span>
            {" · "}
            {recommendation.preferredCheckInTime}
            {" · "}
            <span>review every</span> {recommendation.reviewFrequencyDays} <span>days</span>
          </p>
          <p className="mt-1 text-xs text-[#5f7469]">
            This is a recommendation, not permission. You can change every field below.
          </p>
        </div>
      ) : null}

      <div className="mt-7 space-y-6">
        <Fieldset legend="Check-in rhythm" hint="When should support show up?">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {frequencies.map((frequency) => (
              <ChoiceButton
                key={frequency.value}
                selected={value.checkInFrequency === frequency.value}
                onClick={() =>
                  onChange({ ...value, checkInFrequency: frequency.value })
                }
              >
                {frequency.label}
              </ChoiceButton>
            ))}
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <TimeField
              label="Check in at"
              value={value.preferredCheckInTime}
              onChange={(preferredCheckInTime) =>
                onChange({ ...value, preferredCheckInTime })
              }
            />
            <TimeField
              label="Quiet from"
              value={value.quietStart}
              onChange={(quietStart) => onChange({ ...value, quietStart })}
            />
            <TimeField
              label="Quiet until"
              value={value.quietEnd}
              onChange={(quietEnd) => onChange({ ...value, quietEnd })}
            />
          </div>
        </Fieldset>

        <Fieldset legend="Intervention style" hint="How direct should I be?">
          <div className="grid gap-2 sm:grid-cols-3">
            {intensities.map((intensity) => {
              const selected = value.interventionIntensity === intensity.value;
              return (
                <button
                  key={intensity.value}
                  type="button"
                  onClick={() =>
                    onChange({
                      ...value,
                      interventionIntensity: intensity.value,
                    })
                  }
                  className={`rounded-2xl border p-4 text-left transition focus:outline-none focus:ring-4 focus:ring-[#dce9df] ${
                    selected
                      ? "border-[#527b6b] bg-[#edf5ef] shadow-sm"
                      : "border-[#dfe4df] bg-white hover:border-[#aec0b6]"
                  }`}
                >
                  <span className="flex items-center justify-between gap-2 text-sm font-semibold text-[#263831]">
                    {intensity.label}
                    {selected && (
                      <span className="grid size-5 place-items-center rounded-full bg-[#527b6b] text-white">
                        <CheckIcon />
                      </span>
                    )}
                  </span>
                  <span className="mt-2 block text-xs leading-5 text-[#59665f]">
                    {intensity.detail}
                  </span>
                </button>
              );
            })}
          </div>
          <label className="mt-4 block">
            <span className="mb-2 block text-xs font-semibold text-[#65736c]">
              Preferred tone
            </span>
            <input
              className={inputClass}
              value={value.preferredTone}
              onChange={(event) =>
                onChange({ ...value, preferredTone: event.target.value })
              }
            />
          </label>
        </Fieldset>

        <Fieldset
          legend="Channels and progress"
          hint="Start with text, photo, and voice. Nothing is sent yet."
        >
          <p className="mb-2 text-xs font-semibold text-[#65736c]">Check-in channels</p>
          <div className="flex flex-wrap gap-2">
            {channelOptions.map((option) => (
              <TogglePill
                key={option.value}
                selected={value.allowedChannels.includes(option.value)}
                onClick={() => toggleChannel(option.value)}
              >
                {option.label}
              </TogglePill>
            ))}
          </div>
          <p className="mb-2 mt-4 text-xs font-semibold text-[#65736c]">
            Ways I can share progress
          </p>
          <div className="flex flex-wrap gap-2">
            {progressOptions.map((option) => (
              <TogglePill
                key={option.value}
                selected={value.progressSharingFormats.includes(option.value)}
                onClick={() => toggleProgress(option.value)}
              >
                {option.label}
              </TogglePill>
            ))}
          </div>
        </Fieldset>

        <Fieldset
          legend="Protection and consent"
          hint="The assistant must know when to stop and when firmer follow-up is allowed."
        >
          <div className="grid gap-4">
            <EditField
              label="Feedback that helps"
              value={value.desiredFeedbackStyle}
              onChange={(desiredFeedbackStyle) =>
                onChange({ ...value, desiredFeedbackStyle })
              }
              multiline
            />
            <EditField
              label="Pause support when"
              value={value.pauseConditions}
              onChange={(pauseConditions) =>
                onChange({ ...value, pauseConditions })
              }
              multiline
            />
            <EditField
              label="Stronger follow-up is okay when"
              value={value.strongerFollowUpConditions}
              onChange={(strongerFollowUpConditions) =>
                onChange({ ...value, strongerFollowUpConditions })
              }
              multiline
            />
            <label className="block max-w-[220px]">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-[#68776f]">
                Review this agreement every
              </span>
              <div className="relative">
                <input
                  type="number"
                  min={1}
                  max={90}
                  className={`${inputClass} pr-16`}
                  value={value.reviewFrequencyDays}
                  onChange={(event) =>
                    onChange({
                      ...value,
                      reviewFrequencyDays: Number(event.target.value),
                    })
                  }
                />
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-[#5f6a64]">
                  days
                </span>
              </div>
            </label>
          </div>
        </Fieldset>
      </div>

      {error && (
        <p role="alert" className="mt-5 rounded-xl bg-[#fff0ea] px-4 py-3 text-sm text-[#8a432c]">
          {error}
        </p>
      )}

      <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={onBack} className={secondaryButtonClass}>
          Back
        </button>
        <button type="submit" className={primaryButtonClass}>
          Confirm how you&apos;ll support me
          <ArrowRight />
        </button>
      </div>
    </form>
    </Localized>
  );
}

function Fieldset({
  legend,
  hint,
  children,
}: {
  legend: string;
  hint: string;
  children: ReactNode;
}) {
  return (
    <fieldset className="rounded-[1.6rem] border border-[#dfe4df] bg-white p-5 sm:p-6">
      <legend className="px-1 text-base font-semibold text-[#24342d]">{legend}</legend>
      <p className="mb-4 -mt-0.5 text-xs leading-5 text-[#5f6a64]">{hint}</p>
      {children}
    </fieldset>
  );
}

function ChoiceButton({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-11 rounded-xl border px-2 py-2 text-xs font-semibold transition focus:outline-none focus:ring-4 focus:ring-[#dce9df] sm:text-sm ${
        selected
          ? "border-[#527b6b] bg-[#527b6b] text-white"
          : "border-[#dce2dd] bg-[#fafbf8] text-[#526058] hover:border-[#a9bbb1]"
      }`}
    >
      {children}
    </button>
  );
}

function TogglePill({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`inline-flex min-h-10 items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition focus:outline-none focus:ring-4 focus:ring-[#dce9df] ${
        selected
          ? "border-[#86a797] bg-[#edf5ef] text-[#345446]"
          : "border-[#dce2dd] bg-white text-[#6e7973]"
      }`}
    >
      <span
        className={`grid size-4 place-items-center rounded-full border ${
          selected ? "border-[#527b6b] bg-[#527b6b] text-white" : "border-[#b8c2bc]"
        }`}
      >
        {selected && <CheckIcon />}
      </span>
      {children}
    </button>
  );
}

function TimeField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold text-[#65736c]">{label}</span>
      <input
        type="time"
        required
        className={inputClass}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function CompletedJourney({
  record,
  onReset,
  liveProductMode,
}: {
  record: LocalOnboardingRecord;
  onReset: () => void;
  liveProductMode: boolean;
}) {
  const { locale, formatDateTime } = useLocale();
  const [liveCheckInSummary, setLiveCheckInSummary] =
    useState<LiveCheckInSummary | null>(null);
  const timingNeedsRestart = planTimingNeedsRestart(
    record.action.nextCheckAt,
    record.savedAt,
  );
  const nextCheckIn = new Intl.DateTimeFormat(locale === "zh-TW" ? "zh-TW" : "en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(record.action.nextCheckAt ?? record.savedAt));
  const liveStatus = liveCheckInSummary
    ? liveCheckInSummary.state === "SCHEDULED"
      ? formatDateTime(liveCheckInSummary.scheduledFor)
      : liveCheckInSummary.state === "REPORT_READY"
        ? "Report is ready"
        : liveCheckInSummary.state === "REVIEWING"
          ? "GPT-5.6 is reviewing"
          : liveCheckInSummary.state === "AWAITING_CONFIRMATION"
            ? "Decision awaiting confirmation"
            : liveCheckInSummary.state === "COMPLETED"
              ? "Goal completed"
              : liveCheckInSummary.state === "NO_FOLLOW_UP"
                ? "No follow-up scheduled"
                : "Set when you start"
    : "Open Check-in for live status";

  return (
    <Localized>
    <div>
      <div className="flex items-start gap-4">
        <span className="grid size-12 shrink-0 place-items-center rounded-full bg-[#d8f48a] text-[#173f35] shadow-[0_8px_24px_rgba(80,111,65,0.18)]">
          <CheckIcon />
        </span>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#4f6d5e]">
            Agreement confirmed
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em] text-[#17211d] sm:text-[2.35rem]">
            Your goal has a protected path.
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#69746e]">
            {liveProductMode
              ? "Your goal is ready. Start the real work block below; Cloud Tasks will bring the check-in back at the time you choose."
              : "Your longitudinal workspace is ready. The browser journey stays local-first, while the protected Cloud Run and Cloud Tasks path is verified separately with the live provider."}
          </p>
        </div>
      </div>

      <div className="mt-7 rounded-[1.7rem] bg-[#173f35] p-6 text-white sm:p-7">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#d8f48a]">
          North star
        </p>
        <h2 className="mt-2 text-2xl font-medium leading-tight tracking-[-0.025em]">
          {record.goal.title}
        </h2>
        <p className="mt-4 border-l border-[#d8f48a]/55 pl-4 text-sm leading-6 text-white/68">
          {record.goal.motivation}
        </p>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-[#dce2dd] bg-white p-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#55635c]">
            First milestone
          </p>
          <p className="mt-2 text-sm font-medium leading-6 text-[#25372f]">
            {record.plan.firstMilestone}
          </p>
        </div>
        <div className="rounded-2xl border border-[#a9c3b5] bg-[#eaf3ec] p-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#597466]">
            Best next action
          </p>
          <p className="mt-2 text-sm font-semibold leading-6 text-[#244538]">
            {record.action.title}
          </p>
          <p className="mt-3 text-xs leading-5 text-[#4f665b]">
            Hard day version: {record.action.minimumVersion}
          </p>
        </div>
      </div>

      <div className="mt-3 grid gap-3 rounded-2xl border border-[#dfe4df] bg-white p-5 sm:grid-cols-4">
        <SummaryItem
          label="Goal rhythm"
          value={cadenceKindLabel(record.plan.cadence.kind)}
        />
        <SummaryItem
          label={liveProductMode ? "Live status" : "Next check-in"}
          value={
            liveProductMode
              ? liveStatus
              : timingNeedsRestart
                ? "Set when you start"
                : nextCheckIn
          }
        />
        <SummaryItem
          label="Support style"
          value={interventionIntensityLabel(
            record.supportAgreement.interventionIntensity,
          )}
        />
        <SummaryItem
          label="Quiet hours"
          value={`${record.supportAgreement.quietHours.start}–${record.supportAgreement.quietHours.end}`}
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#f1f4ef] px-4 py-3 text-xs text-[#52615a]">
        <span>
          Agent trace: {record.agentTrace.agent.replaceAll("_", " ")} · {record.agentTrace.provider} · validated
        </span>
        <span>Saved {formatDateTime(record.savedAt)}</span>
      </div>

      <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={onReset} className={secondaryButtonClass}>
          {liveProductMode ? "Change goal" : "Start over"}
        </button>
        <div className="rounded-full bg-[#edf4ee] px-4 py-2 text-xs font-semibold text-[#49675a]">
          {liveProductMode
            ? "Private live journey"
            : "Phases 1–8 · integrated local build"}
        </div>
      </div>

      <div className="mt-8">
        <JourneyWorkspace
          record={record}
          onReset={onReset}
          liveCheckInEnabled
          showLocalSimulation={!liveProductMode}
          onLiveCheckInSummaryChange={setLiveCheckInSummary}
        />
      </div>
    </div>
    </Localized>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-[#59665f]">
        {label}
      </p>
      <p className="mt-1.5 text-sm font-semibold capitalize text-[#2d4037]">{value}</p>
    </div>
  );
}

export function OnboardingFlow({
  profile = "default",
}: {
  profile?: OnboardingStorageProfile;
}) {
  const { locale } = useLocale();
  const liveGoalArchitect = profile === "play";
  const [stage, setStage] = useState<Stage>("goal");
  const [answers, setAnswers] = useState<OnboardingAnswers>({
    goal: "",
    targetWindow: "",
    motivation: "",
  });
  const [plan, setPlan] = useState<GoalPlan | null>(null);
  const [trace, setTrace] = useState<AgentRunTrace | null>(null);
  const [support, setSupport] = useState<SupportAgreementDraft>(() => ({
    ...defaultSupportAgreementDraft,
    timezone:
      typeof Intl === "undefined"
        ? defaultSupportAgreementDraft.timezone
        : Intl.DateTimeFormat().resolvedOptions().timeZone ||
          defaultSupportAgreementDraft.timezone,
  }));
  const [completedRecord, setCompletedRecord] =
    useState<LocalOnboardingRecord | null>(null);
  const [editingPlan, setEditingPlan] = useState(false);
  const [concern, setConcern] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pairingRequired, setPairingRequired] = useState(false);
  const [pairingCode, setPairingCode] = useState("");
  const [deviceLabel, setDeviceLabel] = useState("Android PWA");
  const liveRequestRef = useRef<{
    fingerprint: string;
    requestId: string;
  } | null>(null);

  useEffect(() => {
    const saved = createLocalOnboardingRepository(
      window.localStorage,
      profile,
    ).load();
    if (!saved) return;

    const restoreTask = window.setTimeout(() => {
      setCompletedRecord(saved);
      setStage("complete");
    }, 0);

    return () => window.clearTimeout(restoreTask);
  }, [profile]);

  const generatePlan = async (motivation: string) => {
    const completedAnswers = { ...answers, motivation };
    setAnswers(completedAnswers);
    setBusy(true);
    setError(null);

    try {
      const fingerprint = JSON.stringify(completedAnswers);
      if (liveRequestRef.current?.fingerprint !== fingerprint) {
        liveRequestRef.current = {
          fingerprint,
          requestId: crypto.randomUUID(),
        };
      }
      const result = liveGoalArchitect
        ? await createLiveGoalArchitectResult({
            answers: completedAnswers,
            locale,
            timezone:
              Intl.DateTimeFormat().resolvedOptions().timeZone ||
              defaultSupportAgreementDraft.timezone,
            requestId: liveRequestRef.current.requestId,
          })
        : await createMockGoalArchitectResult(completedAnswers);
      setPlan(result.output);
      setTrace(result.trace);
      setPairingRequired(false);
      setSupport((current) =>
        applyGoalCadenceRecommendation(current, result.output),
      );
      setStage("plan");
    } catch (caught) {
      if (
        liveGoalArchitect &&
        caught instanceof LiveGoalArchitectClientError &&
        caught.status === 401
      ) {
        setPairingRequired(true);
        setError(null);
      } else if (
        liveGoalArchitect &&
        caught instanceof LiveGoalArchitectClientError &&
        caught.status === 403
      ) {
        setError("This preview address is not authorized for live requests.");
      } else {
        setError(
          liveGoalArchitect
            ? "The live Goal Architect stopped safely before saving. Retry keeps the same request identity and will not silently switch to mock."
            : "The mock plan could not be validated. Please review your answers.",
        );
      }
    } finally {
      setBusy(false);
    }
  };

  const pairAndRetry = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await pairLiveGoalArchitectDevice({ pairingCode, deviceLabel });
      setPairingCode("");
      setPairingRequired(false);
      await generatePlan(answers.motivation);
    } catch (caught) {
      setPairingRequired(true);
      if (caught instanceof LivePairingClientError) {
        setError(
          caught.status === 401
            ? "The one-time pairing code is invalid or expired."
            : caught.status === 409
              ? "This code was already used or another device is currently paired."
              : caught.status === 403
                ? "This preview address is not authorized for pairing."
                : "The device could not be paired. Please retry safely.",
        );
      } else {
        setError("The device could not be paired. Please retry safely.");
      }
    } finally {
      setBusy(false);
    }
  };

  const applyConcern = () => {
    if (!plan) return;
    try {
      setPlan(applyPlanFeedback(plan, concern));
      setConcern("");
      setEditingPlan(true);
      setError(null);
    } catch {
      setError("Please describe what feels wrong in at least two characters.");
    }
  };

  const confirmSupport = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setPairingRequired(false);
    setPairingCode("");

    if (!plan || !trace) {
      setError("The plan trace is missing. Please return and generate the plan again.");
      return;
    }

    const validatedSupport = SupportAgreementDraftSchema.safeParse(support);
    if (!validatedSupport.success) {
      setError(
        "Keep at least one support channel and one progress format, then review all boundary fields.",
      );
      return;
    }

    try {
      const record = createConfirmedOnboardingRecord({
        answers,
        plan,
        support: validatedSupport.data,
        agentTrace: trace,
      });
      createLocalOnboardingRepository(window.localStorage, profile).save(record);
      setCompletedRecord(record);
      setStage("complete");
    } catch {
      setError("The confirmed agreement did not pass validation. Please review the fields.");
    }
  };

  const resetJourney = () => {
    createLocalOnboardingRepository(window.localStorage, profile).clear();
    setAnswers({ goal: "", targetWindow: "", motivation: "" });
    setPlan(null);
    setTrace(null);
    setSupport({
      ...defaultSupportAgreementDraft,
      timezone:
        Intl.DateTimeFormat().resolvedOptions().timeZone ||
        defaultSupportAgreementDraft.timezone,
    });
    setCompletedRecord(null);
    setEditingPlan(false);
    setConcern("");
    setError(null);
    setPairingRequired(false);
    setPairingCode("");
    liveRequestRef.current = null;
    setStage("goal");
  };

  let content: ReactNode;

  if (stage === "goal") {
    content = (
      <QuestionScreen
        number={1}
        title="What do you want to achieve?"
        description="Choose one meaningful direction. It can be ambitious, uncertain, or still taking shape."
        example="I want to finish this hackathon…"
        defaultValue={answers.goal}
        onSubmit={(goal) => {
          setAnswers((current) => ({ ...current, goal }));
          setError(null);
          setStage("window");
        }}
      />
    );
  } else if (stage === "window") {
    content = (
      <QuestionScreen
        number={2}
        title="When would you like to achieve it?"
        description="An approximate window is enough. We can recalibrate when reality changes."
        example="Before Sunday, within three months, no hard deadline…"
        defaultValue={answers.targetWindow}
        onBack={() => setStage("goal")}
        onSubmit={(targetWindow) => {
          setAnswers((current) => ({ ...current, targetWindow }));
          setError(null);
          setStage("why");
        }}
      />
    );
  } else if (stage === "why") {
    content = (
      <>
        <QuestionScreen
          number={3}
          title="Why does this matter to you?"
          description="This becomes the reason I bring back when the work gets hard—not a motivational slogan."
          example="Because I want to prove I can build something that genuinely protects people’s time…"
          defaultValue={answers.motivation}
          onBack={() => setStage("window")}
          onSubmit={generatePlan}
          multiline
          busy={busy}
        />
        {error && !pairingRequired && (
          <p role="alert" className="mx-auto mt-4 max-w-xl rounded-xl bg-[#fff0ea] px-4 py-3 text-sm text-[#8a432c]">
            {error}
          </p>
        )}
        {pairingRequired ? (
          <PairingRecoveryCard
            pairingCode={pairingCode}
            deviceLabel={deviceLabel}
            busy={busy}
            error={error}
            onPairingCodeChange={setPairingCode}
            onDeviceLabelChange={setDeviceLabel}
            onSubmit={pairAndRetry}
          />
        ) : null}
      </>
    );
  } else if (stage === "plan" && plan) {
    content = (
      <PlanReview
        plan={plan}
        trace={trace!}
        editing={editingPlan}
        concern={concern}
        error={error}
        onPlanChange={setPlan}
        onEditingChange={setEditingPlan}
        onConcernChange={setConcern}
        onApplyConcern={applyConcern}
        onBack={() => setStage("why")}
        onConfirm={() => {
          setError(null);
          setStage("support");
        }}
      />
    );
  } else if (stage === "support") {
    content = (
      <SupportAgreementForm
        value={support}
        recommendation={plan?.cadence ?? null}
        onChange={setSupport}
        error={error}
        onBack={() => setStage("plan")}
        onSubmit={confirmSupport}
      />
    );
  } else if (stage === "complete" && completedRecord) {
    content = (
      <CompletedJourney
        record={completedRecord}
        onReset={resetJourney}
        liveProductMode={liveGoalArchitect}
      />
    );
  } else {
    content = (
      <div className="text-center">
        <p className="text-sm text-[#6b7770]">The local journey needs to restart.</p>
        <button type="button" onClick={resetJourney} className={`${primaryButtonClass} mt-5`}>
          Restart setup
        </button>
      </div>
    );
  }

  return (
    <Shell stage={stage} liveGoalArchitect={liveGoalArchitect}>
      {content}
    </Shell>
  );
}
