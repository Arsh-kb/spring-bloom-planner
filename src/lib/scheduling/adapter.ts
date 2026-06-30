// src/lib/scheduling/adapter.ts
//
// Translates between the app's existing types (Task, FocusSession) and the
// Scheduling Engine's own SchedTask/BusyInterval shapes. This is the ONLY
// file that needs to know both worlds; the engine itself stays
// framework/app-agnostic.

import {
  BusyInterval,
  EngineContext,
  HistoryEntry,
  SchedTask,
  UserPreferences,
  DEFAULT_PREFERENCES,
} from "../../SchedulingEngine";
import type { Task, FocusSession } from "@/types/planner";

/** Minimal calendar event type - only what the engine needs */
export interface CalendarEvent {
  id: string;
  google_event_id: string;
  title: string;
  start_time: string;
  end_time: string | null;
  all_day: boolean;
}

/** Default duration when neither the AI nor the user supplied one. */
const FALLBACK_DURATION_MINUTES = 30;

export function taskToSchedTask(t: Task): SchedTask {
  return {
    id: t.id,
    title: t.title,
    date: t.date,
    completed: t.completed,
    priority: t.priority,
    estimatedMinutes:
      (t as Task & { estimatedMinutes?: number }).estimatedMinutes ??
      FALLBACK_DURATION_MINUTES,
    mood: t.mood,
    timeBlock: t.timeBlock,
    deadline: (t as Task & { due_date?: string }).due_date ?? null,
    dependsOn: (t as Task & { dependsOn?: string[] }).dependsOn,
    locked: false,
    source: t.id.startsWith("r") ? "recurring" : "manual",
  };
}

export function placedTaskToTaskPatch(p: SchedTask): Partial<Task> & { id: string } {
  return {
    id: p.id,
    date: p.date ?? undefined,
    timeBlock: p.timeBlock,
  };
}

export function calendarEventToBusyInterval(
  e: CalendarEvent,
): BusyInterval | null {
  if (e.all_day || !e.end_time) return null;
  const start = new Date(e.start_time);
  const end = new Date(e.end_time);
  const date = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-${String(start.getDate()).padStart(2, "0")}`;
  return {
    date,
    startMinutes: start.getHours() * 60 + start.getMinutes(),
    endMinutes: end.getHours() * 60 + end.getMinutes(),
    title: e.title,
  };
}

export function focusSessionsToHistory(
  sessions: FocusSession[],
  weekDates: string[],
  tasks: Task[],
): HistoryEntry[] {
  // Roll up the last 7 known days into planned-vs-completed minutes.
  const byDate = new Map<string, { planned: number; completed: number }>();
  for (const t of tasks) {
    if (!t.date) continue;
    const entry = byDate.get(t.date) ?? { planned: 0, completed: 0 };
    const minutes =
      (t as Task & { estimatedMinutes?: number }).estimatedMinutes ??
      FALLBACK_DURATION_MINUTES;
    entry.planned += minutes;
    if (t.completed) entry.completed += minutes;
    byDate.set(t.date, entry);
  }
  return Array.from(byDate.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .slice(-7)
    .map(([date, v]) => ({
      date,
      plannedMinutes: v.planned,
      completedMinutes: v.completed,
    }));
}

/** Builds a complete EngineContext from app state in one call. */
export function buildEngineContext(opts: {
  tasks: Task[];
  calendarEvents?: CalendarEvent[];
  weekDates: string[];
  todayDate: string;
  focusSessions: FocusSession[];
  prefsOverride?: Partial<UserPreferences>;
}): EngineContext {
  const events = opts.calendarEvents ?? [];
  const busy = events
    .map(calendarEventToBusyInterval)
    .filter((b): b is BusyInterval => b !== null);

  return {
    tasks: opts.tasks.map(taskToSchedTask),
    busy,
    prefs: { ...DEFAULT_PREFERENCES, ...opts.prefsOverride },
    weekDates: opts.weekDates,
    todayDate: opts.todayDate,
    history: focusSessionsToHistory(opts.focusSessions, opts.weekDates, opts.tasks),
  };
}