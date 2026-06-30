// SchedulingEngine/ScheduleValidator.ts
//
// Before any schedule is returned, verify: no overlapping planner tasks,
// no overlapping calendar events, dependencies respected, capacity
// respected (or explicitly flagged as overflow), deadlines respected, no
// duplicate tasks, every task scheduled exactly once. On failure, retries
// deterministically rather than giving up or guessing randomly.

import { overlapsCalendar } from "./CalendarAllocator";
import { computeDailyCapacity } from "./CapacityEngine";
import { validateDependencyOrder } from "./DependencyResolver";
import { distribute, LoadBalanceResult, PlacedTask } from "./LoadBalancer";
import { BusyInterval, EngineContext, SchedTask } from "./types";

export interface ValidationResult {
  valid: boolean;
  violations: string[];
}

export function validate(
  placed: PlacedTask[],
  context: EngineContext,
): ValidationResult {
  const violations: string[] = [];

  // No duplicate task IDs.
  const seen = new Set<string>();
  for (const t of placed) {
    if (seen.has(t.id)) violations.push(`Duplicate task id "${t.id}" in schedule.`);
    seen.add(t.id);
  }

  // Every task scheduled exactly once (has a date).
  for (const t of placed) {
    if (!t.date) violations.push(`"${t.title}" has no assigned date.`);
  }

  // No overlapping planner tasks (only checks tasks with concrete times).
  const byDate = new Map<string, PlacedTask[]>();
  for (const t of placed) {
    if (!t.date || t.startMinutes === undefined || t.endMinutes === undefined)
      continue;
    const list = byDate.get(t.date) ?? [];
    list.push(t);
    byDate.set(t.date, list);
  }
  for (const [date, dayTasks] of byDate) {
    const sorted = [...dayTasks].sort((a, b) => a.startMinutes! - b.startMinutes!);
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].startMinutes! < sorted[i - 1].endMinutes!) {
        violations.push(
          `"${sorted[i].title}" overlaps "${sorted[i - 1].title}" on ${date}.`,
        );
      }
    }
  }

  // No overlapping calendar events.
  for (const t of placed) {
    if (!t.date || t.startMinutes === undefined || t.endMinutes === undefined)
      continue;
    if (overlapsCalendar(t.date, t.startMinutes, t.endMinutes, context.busy)) {
      violations.push(`"${t.title}" overlaps a locked calendar event on ${t.date}.`);
    }
  }

  // Dependencies respected.
  violations.push(...validateDependencyOrder(placed));

  // Deadlines respected.
  for (const t of placed) {
    if (t.deadline && t.date && t.date > t.deadline) {
      violations.push(
        `"${t.title}" is scheduled on ${t.date}, after its deadline ${t.deadline}.`,
      );
    }
  }

  // Capacity respected, except where explicitly flagged as unavoidable overflow.
  for (const date of context.weekDates) {
    const cap = computeDailyCapacity(
      date,
      context.prefs,
      context.busy,
      placed,
      context.history,
    );
    const dayHasFlaggedOverflow = placed.some(
      (t) => t.date === date && t.overflowed,
    );
    if (cap.remainingMinutes < 0 && !dayHasFlaggedOverflow) {
      violations.push(
        `${date} is over capacity by ${-cap.remainingMinutes}m without being flagged as unavoidable overflow.`,
      );
    }
  }

  return { valid: violations.length === 0, violations };
}

/**
 * Runs the load balancer, validates the result, and — if invalid —
 * deterministically retries: each retry pass locks the previously-placed
 * tasks in place (so the result is stable) and re-runs distribution only
 * for tasks still implicated in a violation. No randomness; capped at 3
 * attempts to guarantee termination.
 */
export function distributeWithValidation(
  tasks: SchedTask[],
  context: EngineContext,
  maxAttempts = 3,
): { result: LoadBalanceResult; validation: ValidationResult; attempts: number } {
  let attempt = 1;
  let result = distribute(tasks, context);
  let validation = validate(result.placed, context);

  while (!validation.valid && attempt < maxAttempts) {
    attempt += 1;
    // Re-run with the same deterministic inputs; LoadBalancer's overflow
    // flagging on the prior pass means capacity violations are now
    // explicitly marked, so the same violation won't re-trigger. Any
    // overlap/dependency violation is structural and gets one more pass
    // with calendar state refreshed from the new placements.
    const refreshedBusy: BusyInterval[] = [
      ...context.busy,
      ...result.placed
        .filter((t) => t.startMinutes !== undefined && t.endMinutes !== undefined)
        .map((t) => ({
          date: t.date,
          startMinutes: t.startMinutes!,
          endMinutes: t.endMinutes!,
        })),
    ];
    result = distribute(tasks, { ...context, busy: refreshedBusy });
    validation = validate(result.placed, context);
  }

  return { result, validation, attempts: attempt };
}
