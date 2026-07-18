import { AgentRunTraceSchema } from "../../domain/agents/schemas";
import type { GoalPlan } from "../../domain/goals/schemas";
import type { AppLocale } from "../../i18n/locale";
import {
  createConfirmedOnboardingRecord,
  type LocalOnboardingRecord,
} from "../../repositories/local-onboarding-repository";
import type { SupportAgreementDraft } from "../onboarding/model";

const STORY_START = "2026-07-01T19:30:00+08:00";
const FIRST_CHECK_IN = "2026-07-02T19:30:00+08:00";
const STORY_END = "2026-07-31T19:30:00+08:00";

export function createDemoLabRecord(
  locale: AppLocale = "zh-TW",
): LocalOnboardingRecord {
  const chinese = locale === "zh-TW";
  const answers = chinese
    ? {
        goal: "用 30 天建立能持續的素描練習節奏，完成一組日常小插畫習作。",
        targetWindow: "30 天",
        motivation:
          "我想成為會持續畫畫的人，而不是一直買工具、做計畫，卻沒有真正留下作品。",
      }
    : {
        goal:
          "Build a sustainable sketching rhythm in 30 days and complete a small set of everyday illustrations.",
        targetWindow: "30 days",
        motivation:
          "I want to become someone who keeps drawing, instead of only buying tools and making plans without leaving finished work behind.",
      };

  const plan: GoalPlan = chinese
    ? {
        goalSummary: answers.goal,
        motivation: answers.motivation,
        targetWindow: answers.targetWindow,
        cadence: {
          kind: "HABIT",
          targetEndAt: STORY_END,
          checkInFrequency: "DAILY",
          preferredCheckInTime: "19:30",
          reviewFrequencyDays: 7,
          rationale:
            "用短而可見的練習建立連續性；遇到卡關時先調整行動與方法，再判斷是否需要修訂目標。",
          completionSignal:
            "完成約定的 30 天故事，留下可見習作，並由使用者選擇下一個練習節奏。",
        },
        feasibilityNotes: [
          "先完成再評價，不要求每天都畫成作品。",
          "生病或臨時事件發生時暫停；重複延後時啟動恢復對話。",
        ],
        firstMilestone: "第一週完成三次 15 分鐘日常小物素描。",
        bestNextAction: "今晚用 15 分鐘畫一個杯子，不擦改，完成後拍照回報。",
        minimumViableAction: "只用連續線畫出杯口、杯身與杯把，兩分鐘也算完成。",
        initialCheckInProposal: {
          scheduledFor: FIRST_CHECK_IN,
          rationale: "在第一次短練習後確認行動是否真的適合，而不是只檢查意志力。",
        },
        assumptionsNeedingConfirmation: [
          "短時限可能比追求完整作品更容易開始。",
          "具體看見成果後的回饋可能有助於維持下一次行動。",
        ],
      }
    : {
        goalSummary: answers.goal,
        motivation: answers.motivation,
        targetWindow: answers.targetWindow,
        cadence: {
          kind: "HABIT",
          targetEndAt: STORY_END,
          checkInFrequency: "DAILY",
          preferredCheckInTime: "19:30",
          reviewFrequencyDays: 7,
          rationale:
            "Use short, visible practice to build continuity. When work stalls, adjust the action and method before revising the goal.",
          completionSignal:
            "Complete the scripted 30-day period, leave visible studies, and let the user choose the next practice rhythm.",
        },
        feasibilityNotes: [
          "Finish before judging; not every day needs a polished piece.",
          "Pause for illness or emergencies and open recovery after repeated delay.",
        ],
        firstMilestone:
          "Complete three 15-minute everyday-object sketches in the first week.",
        bestNextAction:
          "Sketch one cup for 15 minutes tonight without erasing, then share a photo.",
        minimumViableAction:
          "Use one continuous line for the rim, body, and handle; two minutes still counts.",
        initialCheckInProposal: {
          scheduledFor: FIRST_CHECK_IN,
          rationale:
            "Check whether the action fits after the first short practice instead of testing willpower.",
        },
        assumptionsNeedingConfirmation: [
          "A short deadline may make starting easier than aiming for a complete illustration.",
          "Specific feedback on visible evidence may help the next action continue.",
        ],
      };

  const support: SupportAgreementDraft = {
    checkInFrequency: "DAILY",
    preferredCheckInTime: "19:30",
    quietStart: "22:30",
    quietEnd: "08:00",
    timezone: "Asia/Shanghai",
    interventionIntensity: "BALANCED",
    preferredTone: chinese ? "溫暖、直接、務實" : "Warm, direct, and practical",
    allowedChannels: ["TEXT", "TTS", "VOICE"],
    progressSharingFormats: ["TEXT", "PHOTO", "VOICE"],
    desiredFeedbackStyle: chinese
      ? "具體指出哪些做法有效，再給一個清楚的下一步。"
      : "Name what worked, then give one clear next move.",
    pauseConditions: chinese
      ? "生病、處理緊急事件，或明確要求空間時暫停。"
      : "Pause for illness, emergencies, or an explicit request for space.",
    strongerFollowUpConditions: chinese
      ? "同一行動延後兩次且沒有替代承諾時，可以更直接地跟進。"
      : "Follow up more directly after two delays without a replacement commitment.",
    reviewFrequencyDays: 7,
  };

  const trace = AgentRunTraceSchema.parse({
    runId: `demo-lab-goal-architect-${locale.toLowerCase()}`,
    agent: "GOAL_ARCHITECT",
    provider: "mock",
    model: "mock:scripted-demo-lab",
    outputSchemaName: "GoalArchitectOutput",
    inputSummary:
      "Scripted illustration-practice story; no private user data and no API request.",
    tokenUsage: null,
    status: "COMPLETED",
    startedAt: STORY_START,
    completedAt: "2026-07-01T19:30:00.001+08:00",
  });

  return createConfirmedOnboardingRecord({
    answers,
    plan,
    support,
    agentTrace: trace,
    now: () => new Date(STORY_START),
    idFactory: (prefix) => `demo-lab-${locale.toLowerCase()}-${prefix}`,
  });
}
