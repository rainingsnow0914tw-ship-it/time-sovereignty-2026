"use client";

import { useEffect, useState } from "react";

import type {
  GoalWorkspace,
  GoalWorkspaceStatus,
} from "../../domain/goals/workspace-schemas";
import { Localized } from "../../i18n/locale";
import {
  changeLiveGoalStatus,
  deleteLiveGoal,
  getLiveGoal,
  listLiveGoals,
  LiveGoalWorkspaceClientError,
  type LiveGoalDetail,
} from "./live-goal-workspace-client";

const buttonClass =
  "rounded-full border border-[#cbd7d0] bg-white px-3 py-2 text-xs font-semibold text-[#3c5b4d] disabled:cursor-not-allowed disabled:opacity-45";

function statusLabel(status: GoalWorkspaceStatus) {
  return {
    ACTIVE: "Active",
    PAUSED: "Paused",
    COMPLETED: "Completed",
    ARCHIVED: "Archived",
  }[status];
}

export function GoalManager({
  refreshKey,
  onNewGoal,
}: {
  refreshKey: number;
  onNewGoal: () => void;
}) {
  const [goals, setGoals] = useState<GoalWorkspace[]>([]);
  const [detail, setDetail] = useState<LiveGoalDetail | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const refreshTask = window.setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await listLiveGoals();
        setGoals(result);
        if (result.length > 0) setExpanded(true);
      } catch (caught) {
        if (
          caught instanceof LiveGoalWorkspaceClientError &&
          caught.status === 401
        ) {
          setGoals([]);
        } else {
          setError(
            "My goals could not refresh yet. Your saved goals were not changed.",
          );
        }
      } finally {
        setLoading(false);
      }
    }, 0);
    return () => window.clearTimeout(refreshTask);
  }, [refreshKey]);

  const open = async (goalId: string) => {
    setLoading(true);
    setError(null);
    try {
      setDetail(await getLiveGoal(goalId));
      setExpanded(true);
    } catch {
      setError("This goal could not be opened. Refresh the list and try again.");
    } finally {
      setLoading(false);
    }
  };

  const transition = async (
    workspace: GoalWorkspace,
    status: GoalWorkspaceStatus,
  ) => {
    setLoading(true);
    setError(null);
    try {
      const updated = await changeLiveGoalStatus({
        goalId: workspace.id,
        expectedRevision: workspace.revision,
        status,
      });
      setGoals((current) =>
        current.map((goal) => (goal.id === updated.id ? updated : goal)),
      );
      if (detail?.goal.id === updated.id) {
        setDetail({ ...detail, goal: updated });
      }
    } catch {
      setError("The goal changed somewhere else. Refresh before trying again.");
    } finally {
      setLoading(false);
    }
  };

  const remove = async (workspace: GoalWorkspace) => {
    if (
      !window.confirm(
        "Delete this goal and stop its future reminders? This cannot be undone.",
      )
    ) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await deleteLiveGoal({
        goalId: workspace.id,
        expectedRevision: workspace.revision,
      });
      setGoals((current) => current.filter((goal) => goal.id !== workspace.id));
      if (detail?.goal.id === workspace.id) setDetail(null);
    } catch {
      setError("The goal was not deleted. Refresh before trying again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Localized>
      <section className="mb-6 rounded-[1.7rem] border border-[#d9e3dc] bg-[#f6f9f5] p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setExpanded((current) => !current)}
            className="text-left"
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#567064]">
              Durable cloud workspace
            </p>
            <h2 className="mt-1 text-lg font-semibold text-[#20342b]">
              My goals {goals.length > 0 ? `(${goals.length})` : ""}
            </h2>
          </button>
          <button type="button" onClick={onNewGoal} className={buttonClass}>
            + New goal
          </button>
        </div>

        {expanded && (
          <div className="mt-4 space-y-3">
            {loading && goals.length === 0 ? (
              <p className="text-sm text-[#68776f]">Refreshing saved goals…</p>
            ) : goals.length === 0 ? (
              <p className="text-sm leading-6 text-[#68776f]">
                No cloud goal is saved yet. Finish one setup to create the first.
              </p>
            ) : (
              goals.map((goal) => (
                <article
                  key={goal.id}
                  className="rounded-2xl border border-[#dce4df] bg-white p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => void open(goal.id)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <p className="font-semibold leading-6 text-[#24372f]">
                        {goal.goal.title}
                      </p>
                      <p className="mt-1 text-xs text-[#64736b]">
                        {statusLabel(goal.status)} · {goal.schedule.slots.length} check-in
                        {goal.schedule.slots.length === 1 ? "" : "s"} · {goal.schedule.timezone}
                      </p>
                    </button>
                    <span className="rounded-full bg-[#edf4ee] px-3 py-1 text-xs font-semibold text-[#456657]">
                      {statusLabel(goal.status)}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button type="button" onClick={() => void open(goal.id)} className={buttonClass}>
                      Open
                    </button>
                    {goal.status === "ACTIVE" ? (
                      <button type="button" disabled={loading} onClick={() => void transition(goal, "PAUSED")} className={buttonClass}>
                        Pause
                      </button>
                    ) : (
                      <button type="button" disabled={loading} onClick={() => void transition(goal, "ACTIVE")} className={buttonClass}>
                        Resume
                      </button>
                    )}
                    {goal.status !== "COMPLETED" && (
                      <button type="button" disabled={loading} onClick={() => void transition(goal, "COMPLETED")} className={buttonClass}>
                        Complete
                      </button>
                    )}
                    <button type="button" disabled={loading} onClick={() => void remove(goal)} className={`${buttonClass} text-[#8a432c]`}>
                      Delete
                    </button>
                  </div>
                </article>
              ))
            )}

            {detail && (
              <article className="rounded-2xl border border-[#aac2b3] bg-[#edf5ef] p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#4e6b5d]">
                      Open goal
                    </p>
                    <h3 className="mt-2 text-lg font-semibold text-[#20392e]">
                      {detail.planRevision.plan.goalSummary}
                    </h3>
                  </div>
                  <button type="button" onClick={() => setDetail(null)} className={buttonClass}>
                    Close
                  </button>
                </div>
                <p className="mt-4 text-xs font-bold uppercase tracking-[0.12em] text-[#5c7066]">
                  Next action
                </p>
                <p className="mt-1 text-sm font-semibold leading-6 text-[#284b3b]">
                  {detail.goal.action.title}
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div>
                    <p className="text-xs text-[#66766e]">Check-in times</p>
                    <p className="mt-1 text-sm font-semibold text-[#315744]">
                      {detail.goal.schedule.slots
                        .map((slot) => slot.localTime)
                        .join(" · ")}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#66766e]">Attendance</p>
                    <p className="mt-1 text-sm font-semibold text-[#315744]">
                      {detail.attendance.length} recorded
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#66766e]">Plan brain</p>
                    <p className="mt-1 text-sm font-semibold text-[#315744]">
                      {detail.planRevision.trace?.model ?? "Validated saved plan"}
                    </p>
                  </div>
                </div>
                <div className="mt-4 rounded-xl border border-[#c9d9cd] bg-white p-3">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#5c7066]">
                    Attendance
                  </p>
                  {detail.attendance.length ? (
                    <ul className="mt-2 space-y-2">
                      {detail.attendance.slice(0, 5).map((entry) => (
                        <li key={entry.id} className="text-xs leading-5 text-[#52675d]">
                          <span className="font-bold text-[#315744]">
                            {entry.status.replaceAll("_", " ")}
                          </span>
                          {" · "}
                          {new Intl.DateTimeFormat(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            hourCycle: "h23",
                          }).format(new Date(entry.recordedAt))}
                          <span className="mt-0.5 block">{entry.summary}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-xs text-[#66766e]">
                      The first confirmed check-in will appear here.
                    </p>
                  )}
                </div>
              </article>
            )}

            {error && (
              <p role="alert" className="rounded-xl bg-[#fff0ea] px-4 py-3 text-sm text-[#8a432c]">
                {error}
              </p>
            )}
          </div>
        )}
      </section>
    </Localized>
  );
}
