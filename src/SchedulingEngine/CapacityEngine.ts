// SchedulingEngine/CapacityEngine.ts
//
// Every day has a capacity. Capacity depends on calendar meetings, already
// scheduled work, preferred work hours, breaks, and productivity history.
// Never exceeded unless impossible to avoid (LoadBalancer/RecoveryEngine
// flag those cases explicitly rather than silently overflowing).

import { busyMinutesForDate } from "./CalendarAllocator";
import {
  BusyInterval,
  HistoryEntry,
  SchedTask,
  UserPreferences,
  dayNameOf,
} from "./types";

export interface DayCapacity {
  date: string;
  /** Theoretical max capacity for this day before subtracting existing load. */
  baseCapacityMinutes: number;
  /** Minutes already consumed by calendar events. */
  calendarMinutes: number;
  /** Minutes already consumed by already-scheduled, non-completed planner tasks. */
  scheduledMinutes: number;
  /** Remaining minutes available before this day is considered full. */
  remainingMinutes: number;
}

/**
 * Productivity multiplier from history: if the user is trending toward
 * burnout (see RecoveryEngine.slidingWindowBurnout), capacity is reduced
 * site-wide as a protective measure. Otherwise neutral.
 */
function productivityMultiplier(history?: HistoryEntry[]): number {
  if (!history || history.length < 3) return 1;
  const recent = history.slice(-7);
  const avgRatio =
    recent.reduce(
      (s, h) => s + (h.plannedMinutes > 0 ? h.completedMinutes / h.plannedMinutes : 1),
      0,
    ) / recent.length;
  // Consistently under-completing planned work (<60% over the window)
  // signals overload; trim capacity to encourage realistic planning.
  if (avgRatio < 0.6) return 0.8;
  if (avgRatio < 0.8) return 0.9;
  return 1;
}

export function computeDailyCapacity(
  date: string,
  prefs: UserPreferences,
  busy: BusyInterval[],
  existingTasks: SchedTask[],
  history?: HistoryEntry[],
): DayCapacity {
  const windowMinutes = Math.max(
    0,
    prefs.workEndMinutes - prefs.workStartMinutes - prefs.breakMinutes,
  );
  const dayName = dayNameOf(date);
  const productivityBoost = prefs.productiveDays.includes(dayName) ? 1.1 : 1;

  const baseCapacityMinutes = Math.round(
    Math.min(windowMinutes, prefs.dailyCapacityMinutes) *
      productivityBoost *
      productivityMultiplier(history),
  );

  const calendarMinutes = busyMinutesForDate(date, busy);
  const scheduledMinutes = existingTasks
    .filter((t) => t.date === date && !t.completed)
    .reduce((sum, t) => sum + (t.estimatedMinutes ?? 30), 0);

  const remainingMinutes = Math.max(
    0,
    baseCapacityMinutes - calendarMinutes - scheduledMinutes,
  );

  return {
    date,
    baseCapacityMinutes,
    calendarMinutes,
    scheduledMinutes,
    remainingMinutes,
  };
}

export function computeWeekCapacity(
  weekDates: string[],
  prefs: UserPreferences,
  busy: BusyInterval[],
  existingTasks: SchedTask[],
  history?: HistoryEntry[],
): Record<string, DayCapacity> {
  const out: Record<string, DayCapacity> = {};
  for (const date of weekDates) {
    out[date] = computeDailyCapacity(date, prefs, busy, existingTasks, history);
  }
  return out;
}
