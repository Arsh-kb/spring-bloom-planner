// SchedulingEngine/RecoveryEngine.ts
//
// When overload occurs: detect overloaded days, move tasks toward least
// loaded days, respecting deadlines/dependencies/calendar. Never moves
// tasks randomly — every move is justified and logged. Also implements
// sliding-window burnout detection and the deterministic confidence score.

import { DayCapacity, computeDailyCapacity } from "./CapacityEngine";
import { earliestEligibleDate } from "./DependencyResolver";
import {
  BusyInterval,
  DecisionLogEntry,
  EngineContext,
  HistoryEntry,
  SchedTask,
} from "./types";

function log(entries: DecisionLogEntry[], step: string, detail: string) {
  entries.push({ step, detail, timestamp: new Date().toISOString() });
}

export interface OverloadedDay {
  date: string;
  overloadMinutes: number;
}

export function detectOverloadedDays(
  weekDates: string[],
  prefs: EngineContext["prefs"],
  busy: BusyInterval[],
  tasks: SchedTask[],
  history?: HistoryEntry[],
): OverloadedDay[] {
  const result: OverloadedDay[] = [];
  for (const date of weekDates) {
    const cap = computeDailyCapacity(date, prefs, busy, tasks, history);
    if (cap.remainingMinutes < 0) {
      result.push({ date, overloadMinutes: -cap.remainingMinutes });
    }
  }
  return result.sort((a, b) => b.overloadMinutes - a.overloadMinutes);
}

export function detectUnderloadedDays(
  weekDates: string[],
  prefs: EngineContext["prefs"],
  busy: BusyInterval[],
  tasks: SchedTask[],
  history?: HistoryEntry[],
): { date: string; freeMinutes: number }[] {
  return weekDates
    .map((date) => {
      const cap = computeDailyCapacity(date, prefs, busy, tasks, history);
      return { date, freeMinutes: cap.remainingMinutes };
    })
    .filter((d) => d.freeMinutes > 0)
    .sort((a, b) => b.freeMinutes - a.freeMinutes);
}

export interface RecoveryMove {
  taskId: string;
  fromDate: string;
  toDate: string;
  reason: string;
}

/**
 * Proposes (and the caller applies) a minimal set of moves that relieve
 * overloaded days by shifting flexible tasks toward the least-loaded
 * eligible days. Only considers tasks that are: not locked, not on their
 * deadline day, and whose dependency dates still permit the move.
 */
export function proposeRecovery(context: EngineContext): {
  moves: RecoveryMove[];
  log: DecisionLogEntry[];
} {
  const entries: DecisionLogEntry[] = [];
  const { weekDates, prefs, busy, tasks, history } = context;
  const byId = new Map(tasks.map((t) => [t.id, t]));
  // Mutable working copy so each move's effect is reflected before the next.
  const working = new Map(tasks.map((t) => [t.id, { ...t }]));
  const moves: RecoveryMove[] = [];

  let overloaded = detectOverloadedDays(
    weekDates,
    prefs,
    busy,
    Array.from(working.values()),
    history,
  );

  if (overloaded.length === 0) {
    log(entries, "no-action", "No overloaded days detected — schedule is already balanced.");
    return { moves, log: entries };
  }

  for (const day of overloaded) {
    log(
      entries,
      "overloaded-day",
      `Detected ${day.date} is over capacity by ${day.overloadMinutes} minute(s).`,
    );

    let remainingOverload = day.overloadMinutes;
    // Candidate movable tasks on this day: longest first (frees the most
    // capacity fastest), excluding locked/deadline-pinned/dependency-pinned.
    const dayTasks = Array.from(working.values())
      .filter((t) => t.date === day.date && !t.completed && !t.locked)
      .filter((t) => t.deadline !== day.date)
      .sort((a, b) => (b.estimatedMinutes ?? 30) - (a.estimatedMinutes ?? 30));

    for (const task of dayTasks) {
      if (remainingOverload <= 0) break;

      const earliestDate = earliestEligibleDate(task, byId, weekDates[0]);
      const deadlineDate = task.deadline ?? weekDates[weekDates.length - 1];
      const targets = detectUnderloadedDays(
        weekDates,
        prefs,
        busy,
        Array.from(working.values()),
        history,
      ).filter(
        (d) =>
          d.date !== day.date &&
          d.date >= earliestDate &&
          d.date <= deadlineDate &&
          (d.freeMinutes ?? 0) >= (task.estimatedMinutes ?? 30),
      );

      if (targets.length === 0) continue; // nowhere safe to put it — leave in place

      const target = targets[0]; // most free capacity first
      working.set(task.id, { ...task, date: target.date });
      moves.push({
        taskId: task.id,
        fromDate: day.date,
        toDate: target.date,
        reason: `"${task.title}" moved from overloaded ${day.date} to ${target.date}, which had ${target.freeMinutes}m free.`,
      });
      log(
        entries,
        "move",
        `Moved "${task.title}" from ${day.date} → ${target.date} (frees ${task.estimatedMinutes ?? 30}m on the overloaded day).`,
      );
      remainingOverload -= task.estimatedMinutes ?? 30;
    }

    if (remainingOverload > 0) {
      log(
        entries,
        "residual-overload",
        `${day.date} remains ${remainingOverload} minute(s) over capacity — no flexible tasks left to relocate without breaking a deadline or dependency.`,
      );
    }
  }

  return { moves, log: entries };
}

// ---------- Burnout detection ----------

export interface BurnoutAssessment {
  burnedOut: boolean;
  averageLoadRatio: number; // completedMinutes / plannedMinutes, 7-day avg
  recommendation: string;
}

/**
 * Sliding window over the previous 7 days. If workload has been
 * consistently high (planned minutes consistently near/over a realistic
 * day, with completion lagging), recommend reduced intensity and inserted
 * recovery time.
 */
export function slidingWindowBurnout(
  history: HistoryEntry[] | undefined,
  prefs: EngineContext["prefs"],
): BurnoutAssessment {
  if (!history || history.length === 0) {
    return {
      burnedOut: false,
      averageLoadRatio: 1,
      recommendation: "No history yet — nothing to assess.",
    };
  }
  const window = history.slice(-7);
  const avgPlanned =
    window.reduce((s, h) => s + h.plannedMinutes, 0) / window.length;
  const avgRatio =
    window.reduce(
      (s, h) => s + (h.plannedMinutes > 0 ? h.completedMinutes / h.plannedMinutes : 1),
      0,
    ) / window.length;

  const consistentlyOverloaded = avgPlanned > prefs.dailyCapacityMinutes * 1.1;
  const consistentlyUnderdelivering = avgRatio < 0.65;

  const burnedOut = consistentlyOverloaded && consistentlyUnderdelivering;

  return {
    burnedOut,
    averageLoadRatio: Number(avgRatio.toFixed(3)),
    recommendation: burnedOut
      ? "Workload has been consistently above capacity with low completion over the last week. Reducing scheduling intensity and inserting recovery time."
      : consistentlyOverloaded
        ? "Planned workload is running high; consider easing the next few days even though completion is holding."
        : "Workload and completion are within a healthy range.",
  };
}

// ---------- Confidence score ----------

export interface ConfidenceResult {
  score: number; // 0-100
  explanation: string;
  metrics: {
    capacityUtilization: number; // 0-1+, >1 means overloaded
    deadlineRisk: number; // 0-1, share of upcoming deadlines at risk
    workloadBalance: number; // 0-1, 1 = perfectly even across days
    recoveryMargin: number; // 0-1, free capacity buffer remaining
    conflictCount: number;
  };
}

export function computeConfidence(context: EngineContext): ConfidenceResult {
  const { weekDates, prefs, busy, tasks, history, todayDate } = context;

  const capacities: DayCapacity[] = weekDates.map((d) =>
    computeDailyCapacity(d, prefs, busy, tasks, history),
  );

  const totalBase = capacities.reduce((s, c) => s + c.baseCapacityMinutes, 0);
  const totalUsed = capacities.reduce(
    (s, c) => s + c.calendarMinutes + c.scheduledMinutes,
    0,
  );
  const capacityUtilization = totalBase > 0 ? totalUsed / totalBase : 0;

  // Deadline risk: among tasks with a deadline this week, what fraction
  // are on a day that's already overloaded?
  const deadlineTasks = tasks.filter(
    (t) => t.deadline && weekDates.includes(t.deadline) && !t.completed,
  );
  const atRiskDeadlines = deadlineTasks.filter((t) => {
    const cap = capacities.find((c) => c.date === t.deadline);
    return cap && cap.remainingMinutes < 0;
  });
  const deadlineRisk =
    deadlineTasks.length > 0 ? atRiskDeadlines.length / deadlineTasks.length : 0;

  // Workload balance via coefficient of variation across days (lower = more even).
  const loads = capacities.map((c) => c.calendarMinutes + c.scheduledMinutes);
  const meanLoad = loads.reduce((s, l) => s + l, 0) / (loads.length || 1);
  const variance =
    loads.reduce((s, l) => s + (l - meanLoad) ** 2, 0) / (loads.length || 1);
  const stdDev = Math.sqrt(variance);
  const cv = meanLoad > 0 ? stdDev / meanLoad : 0;
  const workloadBalance = Math.max(0, 1 - Math.min(1, cv));

  const recoveryMargin =
    totalBase > 0 ? Math.max(0, (totalBase - totalUsed) / totalBase) : 0;

  const conflictCount = capacities.filter((c) => c.remainingMinutes < 0).length;

  // Weighted blend, each factor 0-1 (capacityUtilization inverted & clamped).
  const utilizationScore = Math.max(0, 1 - Math.max(0, capacityUtilization - 1));
  const blended =
    utilizationScore * 0.3 +
    (1 - deadlineRisk) * 0.3 +
    workloadBalance * 0.2 +
    recoveryMargin * 0.2;

  const score = Math.round(Math.max(0, Math.min(1, blended)) * 100);

  const explanation =
    `Capacity utilization ${(capacityUtilization * 100).toFixed(0)}%, ` +
    `${atRiskDeadlines.length}/${deadlineTasks.length} deadline(s) at risk, ` +
    `workload balance ${(workloadBalance * 100).toFixed(0)}%, ` +
    `recovery margin ${(recoveryMargin * 100).toFixed(0)}%, ` +
    `${conflictCount} day(s) over capacity.`;

  return {
    score,
    explanation,
    metrics: {
      capacityUtilization: Number(capacityUtilization.toFixed(3)),
      deadlineRisk: Number(deadlineRisk.toFixed(3)),
      workloadBalance: Number(workloadBalance.toFixed(3)),
      recoveryMargin: Number(recoveryMargin.toFixed(3)),
      conflictCount,
    },
  };
}
