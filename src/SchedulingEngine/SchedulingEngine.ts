// SchedulingEngine/SchedulingEngine.ts
//
// The orchestrator. This is the only module the rest of the app should
// import directly. The AI is a strategist — it interprets goals, estimates
// duration/difficulty, and identifies dependencies. From that point on,
// EVERY placement decision happens here, deterministically.

import { findFreeTimeAcrossWeek } from "./CalendarAllocator";
import { computeDailyCapacity, computeWeekCapacity } from "./CapacityEngine";
import { buildNarrative, joinReplay } from "./DecisionExplainer";
import {
  computeConfidence,
  ConfidenceResult,
  detectOverloadedDays,
  proposeRecovery,
  RecoveryMove,
  slidingWindowBurnout,
} from "./RecoveryEngine";
import { distribute, LoadBalanceResult, PlacedTask } from "./LoadBalancer";
import { distributeWithValidation, validate } from "./ScheduleValidator";
import { computePriorityScore, explainScore } from "./PriorityEngine";
import {
  DecisionLogEntry,
  EngineContext,
  ExplainedResult,
  SchedTask,
  TaskMood,
  TimeBlock,
  TimeSlot,
} from "./types";

// ---------- Goal scheduling (replaces "breakdown"/"schedule" AI placement) ----------

/**
 * Takes subtasks the AI has already interpreted (title, estimated
 * duration, difficulty/mood, dependencies — NOT day/time, even if the AI
 * supplied one) and places them deterministically.
 */
export function scheduleNewGoal(
  subtasks: SchedTask[],
  context: EngineContext,
): ExplainedResult<PlacedTask[]> {
  const before = computeConfidence(context).score;

  // Strip any placement the AI may have suggested — only the Scheduling
  // Engine decides date/time. Keep its interpretation fields.
  const interpretedOnly: SchedTask[] = subtasks.map((t) => ({
    ...t,
    date: null,
    locked: false,
  }));

  const { result, validation, attempts } = distributeWithValidation(
    interpretedOnly,
    context,
  );

  const mergedTasks = [...context.tasks, ...result.placed];
  const after = computeConfidence({ ...context, tasks: mergedTasks }).score;

  const log: DecisionLogEntry[] = [
    {
      step: "intake",
      detail: `Interpreted ${subtasks.length} subtask(s) from the goal; validated in ${attempts} pass(es).`,
      timestamp: new Date().toISOString(),
    },
    ...result.log,
  ];
  if (!validation.valid) {
    log.push({
      step: "residual-overload",
      detail: `Unresolved after retries: ${validation.violations.join("; ")}`,
      timestamp: new Date().toISOString(),
    });
  }

  return {
    result: result.placed,
    log,
    confidenceBefore: before,
    confidenceAfter: after,
    narrative: buildNarrative(log, before, after),
  };
}

// ---------- Rescheduling missed/overdue tasks ----------

export function rescheduleMissed(
  missedTasks: SchedTask[],
  context: EngineContext,
): ExplainedResult<PlacedTask[]> {
  const before = computeConfidence(context).score;
  const toPlace = missedTasks.map((t) => ({ ...t, date: null, locked: false }));
  const { result } = distributeWithValidation(toPlace, context);
  const mergedTasks = [...context.tasks, ...result.placed];
  const after = computeConfidence({ ...context, tasks: mergedTasks }).score;

  return {
    result: result.placed,
    log: result.log,
    confidenceBefore: before,
    confidenceAfter: after,
    narrative: buildNarrative(result.log, before, after),
  };
}

// ---------- Recovery ----------

export interface RecoveryOutcome {
  moves: RecoveryMove[];
  burnout: ReturnType<typeof slidingWindowBurnout>;
}

export function recoverWeek(context: EngineContext): ExplainedResult<RecoveryOutcome> {
  const before = computeConfidence(context).score;
  const { moves, log } = proposeRecovery(context);

  // Apply moves to a working copy to compute the "after" confidence.
  const movedById = new Map(moves.map((m) => [m.taskId, m.toDate]));
  const updatedTasks = context.tasks.map((t) =>
    movedById.has(t.id) ? { ...t, date: movedById.get(t.id)! } : t,
  );
  const after = computeConfidence({ ...context, tasks: updatedTasks }).score;

  const burnout = slidingWindowBurnout(context.history, context.prefs);
  const fullLog: DecisionLogEntry[] = [...log];
  if (burnout.burnedOut) {
    fullLog.push({
      step: "no-action",
      detail: `Sliding-window burnout check: ${burnout.recommendation}`,
      timestamp: new Date().toISOString(),
    });
  }

  return {
    result: { moves, burnout },
    log: fullLog,
    confidenceBefore: before,
    confidenceAfter: after,
    narrative: buildNarrative(fullLog, before, after),
  };
}

// ---------- Confidence & risk (replace AI "confidence"/"risk" actions) ----------

export function computeWeekConfidence(context: EngineContext): ConfidenceResult {
  return computeConfidence(context);
}

export interface TaskRiskResult {
  risk: "low" | "medium" | "high";
  probability: number; // 0-100
  blockers: string[];
  suggestion: string;
}

export function computeTaskRisk(
  task: SchedTask,
  context: EngineContext,
): TaskRiskResult {
  if (!task.date) {
    return {
      risk: "high",
      probability: 80,
      blockers: ["Task has no scheduled date."],
      suggestion: "Schedule this task to evaluate its real risk.",
    };
  }

  const cap = computeDailyCapacity(
    task.date,
    context.prefs,
    context.busy,
    context.tasks,
    context.history,
  );
  const blockers: string[] = [];

  const daysUntilDeadline = task.deadline
    ? Math.round(
        (new Date(task.deadline + "T00:00:00").getTime() -
          new Date(context.todayDate + "T00:00:00").getTime()) /
          86400000,
      )
    : null;

  if (daysUntilDeadline !== null && daysUntilDeadline < 0) {
    blockers.push("Deadline has already passed.");
  } else if (daysUntilDeadline !== null && daysUntilDeadline <= 1) {
    blockers.push("Deadline is today or tomorrow.");
  }

  if (cap.remainingMinutes < 0) {
    blockers.push(
      `Scheduled day is over capacity by ${-cap.remainingMinutes} minute(s).`,
    );
  }

  const competing = context.tasks.filter(
    (t) => t.date === task.date && !t.completed && t.id !== task.id,
  );
  if (competing.length >= 4) {
    blockers.push(`${competing.length} other tasks compete for the same day.`);
  }

  const score = computePriorityScore(task, context.todayDate, context.history);

  let probability = 20; // base risk
  if (cap.remainingMinutes < 0) probability += 35;
  if (daysUntilDeadline !== null && daysUntilDeadline <= 1) probability += 25;
  if (competing.length >= 4) probability += 15;
  probability = Math.min(95, probability);

  const risk: "low" | "medium" | "high" =
    probability >= 60 ? "high" : probability >= 30 ? "medium" : "low";

  return {
    risk,
    probability,
    blockers: blockers.length ? blockers : ["No significant blockers detected."],
    suggestion:
      blockers.length === 0
        ? "On track — no changes needed."
        : cap.remainingMinutes < 0
          ? "Consider running Recover Week or moving this task to a lighter day."
          : "Monitor closely as the deadline approaches.",
  };
}

// ---------- Chat command dispatch ----------
// "Move coding to Thursday" → executeChatCommand("move_task", {...}, ctx)
// Calls the engine directly. Never regenerates the whole schedule.

export type ChatCommand =
  | { type: "move_task"; taskId: string; toDate: string }
  | { type: "delete_task"; taskId: string }
  | { type: "change_priority"; taskId: string; priority: SchedTask["priority"] }
  | { type: "change_duration"; taskId: string; estimatedMinutes: number }
  | { type: "find_free_time"; durationMinutes: number }
  | {
      type: "schedule_workout";
      durationMinutes: number;
      mood?: TaskMood;
      timeBlock?: TimeBlock;
    }
  | { type: "reduce_workload" }
  | { type: "recover_week" }
  | { type: "explain_schedule" }
  | { type: "protect_deep_work"; date: string; durationMinutes: number };

export interface ChatCommandResult {
  ok: boolean;
  message: string;
  data?: unknown;
  narrative?: string[];
}

export function executeChatCommand(
  command: ChatCommand,
  context: EngineContext,
): ChatCommandResult {
  switch (command.type) {
    case "move_task": {
      const task = context.tasks.find((t) => t.id === command.taskId);
      if (!task) return { ok: false, message: "Task not found." };
      if (task.locked)
        return { ok: false, message: `"${task.title}" is locked to a calendar event and can't be moved.` };
      if (task.deadline && command.toDate > task.deadline) {
        return {
          ok: false,
          message: `Can't move "${task.title}" to ${command.toDate} — that's after its deadline (${task.deadline}).`,
        };
      }
      return {
        ok: true,
        message: `Moved "${task.title}" to ${command.toDate}.`,
        data: { taskId: command.taskId, date: command.toDate },
      };
    }

    case "delete_task": {
      const task = context.tasks.find((t) => t.id === command.taskId);
      if (!task) return { ok: false, message: "Task not found." };
      const dependents = context.tasks.filter((t) =>
        (t.dependsOn ?? []).includes(command.taskId),
      );
      if (dependents.length > 0) {
        return {
          ok: false,
          message: `Can't delete "${task.title}" — ${dependents.length} other task(s) depend on it: ${dependents.map((d) => d.title).join(", ")}.`,
        };
      }
      return { ok: true, message: `Deleted "${task.title}".`, data: { taskId: command.taskId } };
    }

    case "change_priority":
      return {
        ok: true,
        message: `Priority updated.`,
        data: { taskId: command.taskId, priority: command.priority },
      };

    case "change_duration":
      return {
        ok: true,
        message: `Duration updated to ${command.estimatedMinutes} minutes.`,
        data: { taskId: command.taskId, estimatedMinutes: command.estimatedMinutes },
      };

    case "find_free_time": {
      const slot = findFreeTimeAcrossWeek(
        context.weekDates,
        command.durationMinutes,
        context.prefs,
        context.busy,
      );
      if (!slot) {
        return { ok: false, message: "No free slot of that length this week." };
      }
      return {
        ok: true,
        message: `Found a free ${command.durationMinutes}-minute slot on ${slot.date}.`,
        data: slot,
      };
    }

    case "schedule_workout": {
      const candidate: SchedTask = {
        id: `chat_${Date.now()}`,
        title: "Workout",
        completed: false,
        priority: "medium",
        estimatedMinutes: command.durationMinutes,
        mood: command.mood ?? "energizing",
        timeBlock: command.timeBlock,
        source: "manual",
      };
      const { result } = distributeWithValidation([candidate], context);
      if (result.placed.length === 0) {
        return { ok: false, message: "Couldn't find room for a workout this week." };
      }
      return {
        ok: true,
        message: `Scheduled a ${command.durationMinutes}-minute workout on ${result.placed[0].date}.`,
        data: result.placed[0],
      };
    }

    case "reduce_workload":
    case "recover_week": {
      const outcome = recoverWeek(context);
      return {
        ok: true,
        message:
          outcome.result.moves.length > 0
            ? `Rebalanced ${outcome.result.moves.length} task(s).`
            : "Schedule is already balanced — no changes needed.",
        data: outcome.result,
        narrative: outcome.narrative,
      };
    }

    case "explain_schedule": {
      const confidence = computeConfidence(context);
      const overloaded = detectOverloadedDays(
        context.weekDates,
        context.prefs,
        context.busy,
        context.tasks,
        context.history,
      );
      const lines = [
        `Confidence: ${confidence.score}%. ${confidence.explanation}`,
        overloaded.length > 0
          ? `Overloaded day(s): ${overloaded.map((o) => o.date).join(", ")}.`
          : "No days are currently over capacity.",
      ];
      return { ok: true, message: lines.join(" "), narrative: lines, data: confidence };
    }

    case "protect_deep_work": {
      const slot: TimeSlot | null = findFreeTimeAcrossWeek(
        [command.date],
        command.durationMinutes,
        context.prefs,
        context.busy,
      );
      if (!slot) {
        return {
          ok: false,
          message: `No ${command.durationMinutes}-minute block available on ${command.date} to protect.`,
        };
      }
      return {
        ok: true,
        message: `Protected a ${command.durationMinutes}-minute deep-work block on ${command.date}.`,
        data: slot,
      };
    }

    default:
      return { ok: false, message: "Unrecognized command." };
  }
}

// ---------- Gmail intake ----------
// Gmail suggestions become candidate planner tasks; the engine — not the
// AI, not the user manually guessing — decides where they fit.

export function intakeGmailCandidate(
  candidate: SchedTask,
  context: EngineContext,
): ExplainedResult<PlacedTask | null> {
  const { result } = distributeWithValidation([{ ...candidate, date: null }], context);
  const placed = result.placed[0] ?? null;
  const before = computeConfidence(context).score;
  const after = placed
    ? computeConfidence({ ...context, tasks: [...context.tasks, placed] }).score
    : before;

  return {
    result: placed,
    log: result.log,
    confidenceBefore: before,
    confidenceAfter: after,
    narrative: buildNarrative(result.log, before, after),
  };
}

export {
  computeWeekCapacity,
  computePriorityScore,
  explainScore,
  joinReplay,
};
