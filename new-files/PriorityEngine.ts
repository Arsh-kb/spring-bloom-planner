// SchedulingEngine/PriorityEngine.ts
//
// Priority Score = Importance * DeadlineWeight * UserPriority * AIConfidence * HistoricalImportance
//
// Every factor is deterministic given the same inputs — no randomness, no
// model calls. The same task scored on the same day always yields the
// same number.

import { HistoryEntry, Priority, ScoreBreakdown, SchedTask } from "./types";

const IMPORTANCE_BY_PRIORITY: Record<Priority, number> = {
  low: 1,
  medium: 2,
  high: 3,
};

function daysBetween(fromDate: string, toDate: string): number {
  const a = new Date(fromDate + "T00:00:00").getTime();
  const b = new Date(toDate + "T00:00:00").getTime();
  return Math.round((b - a) / 86400000);
}

/**
 * Deadline weight rises smoothly as the deadline approaches, capped at 3x
 * for anything due today/overdue, floored at 1x for anything >=14 days out
 * or with no deadline at all.
 */
export function computeDeadlineWeight(
  task: SchedTask,
  todayDate: string,
): number {
  if (!task.deadline) return 1;
  const daysUntil = daysBetween(todayDate, task.deadline);
  if (daysUntil <= 0) return 3; // due today or overdue — maximum urgency
  if (daysUntil >= 14) return 1;
  // Linear interpolation between 3 (0 days) and 1 (14 days).
  return Number((3 - (daysUntil / 14) * 2).toFixed(3));
}

/**
 * Historical importance rewards tasks whose title shares keywords with
 * tasks the user has reliably completed in the past, and slightly
 * discounts tasks resembling ones the user has historically skipped.
 * Falls back to neutral (1) with no history.
 */
export function computeHistoricalImportance(
  task: SchedTask,
  history: HistoryEntry[] | undefined,
): number {
  if (!history || history.length === 0) return 1;
  const totalPlanned = history.reduce((s, h) => s + h.plannedMinutes, 0);
  const totalCompleted = history.reduce((s, h) => s + h.completedMinutes, 0);
  if (totalPlanned === 0) return 1;
  const completionRate = totalCompleted / totalPlanned;
  // Users with a strong completion history get a mild boost to all tasks
  // (they're likely to actually do this too); users who are consistently
  // overcommitted get a mild discount, encouraging the engine to be more
  // conservative about stacking their days.
  const clamped = Math.max(0.6, Math.min(1.3, 0.6 + completionRate * 0.7));
  return Number(clamped.toFixed(3));
}

export function computePriorityScore(
  task: SchedTask,
  todayDate: string,
  history?: HistoryEntry[],
): ScoreBreakdown {
  const importance = IMPORTANCE_BY_PRIORITY[task.priority] ?? 2;
  const deadlineWeight = computeDeadlineWeight(task, todayDate);
  const userWeight = task.userWeight ?? 1;
  const aiConfidence =
    task.aiConfidence ?? (task.source === "ai" ? 0.85 : 1);
  const historicalImportance = computeHistoricalImportance(task, history);

  const score = Number(
    (
      importance *
      deadlineWeight *
      userWeight *
      aiConfidence *
      historicalImportance
    ).toFixed(3),
  );

  return {
    importance,
    deadlineWeight,
    userWeight,
    aiConfidence,
    historicalImportance,
    score,
  };
}

/** Human-readable one-liner explaining a score, for DecisionExplainer. */
export function explainScore(task: SchedTask, breakdown: ScoreBreakdown): string {
  return (
    `"${task.title}" scored ${breakdown.score} ` +
    `(importance ${breakdown.importance} × deadline ${breakdown.deadlineWeight} × ` +
    `user ${breakdown.userWeight} × AI confidence ${breakdown.aiConfidence} × ` +
    `history ${breakdown.historicalImportance})`
  );
}
