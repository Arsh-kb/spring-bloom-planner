// SchedulingEngine/types.ts
//
// Shared types for the deterministic Vibe2Ship Scheduling Engine (VSE).
// These intentionally mirror (but do not import) the app's existing
// `Task` / `CalendarEvent` shapes so this module has zero dependency on
// app internals and can be unit-tested in isolation.

export type Priority = "low" | "medium" | "high";
export type TaskMood = "high-strain" | "reflective" | "routine" | "energizing";
export type TimeBlock = "morning" | "afternoon" | "evening";

/** A task as understood by the Scheduling Engine. */
export interface SchedTask {
  id: string;
  title: string;
  /** Assigned date, YYYY-MM-DD. Null/undefined = not yet scheduled. */
  date?: string | null;
  completed: boolean;
  priority: Priority;
  /** Duration estimate in minutes. AI or user supplies this; engine never invents it silently (falls back to a documented default). */
  estimatedMinutes?: number;
  mood?: TaskMood;
  timeBlock?: TimeBlock;
  /** Hard deadline, YYYY-MM-DD. Task must be scheduled on or before this date. */
  deadline?: string | null;
  /** IDs of tasks that must be completed (i.e. scheduled earlier) before this one. */
  dependsOn?: string[];
  /** True for calendar-derived or otherwise immovable items. Engine will never relocate these. */
  locked?: boolean;
  /** Where this task originated — informs AIConfidence in the priority score. */
  source?: "manual" | "ai" | "gmail" | "calendar" | "recurring";
  /** Explicit user-set weight override (e.g. user pinned this as critical), 0.5–2.0. Defaults to 1. */
  userWeight?: number;
  /** 0–1 confidence the AI had in this task's necessity/estimate. Defaults to 1 for manual tasks. */
  aiConfidence?: number;
}

/** A locked, immovable busy interval — typically a Google Calendar event. */
export interface BusyInterval {
  date: string; // YYYY-MM-DD
  startMinutes: number; // minutes since 00:00
  endMinutes: number; // minutes since 00:00
  title?: string;
}

export interface UserPreferences {
  /** Working day start, minutes since 00:00. Default 9:00 = 540. */
  workStartMinutes: number;
  /** Working day end, minutes since 00:00. Default 18:00 = 1080. */
  workEndMinutes: number;
  /** Preferred period for deep/high-strain work. */
  preferredPeriod: TimeBlock;
  /** Day names (Monday..Sunday) the user is historically most productive on. */
  productiveDays: string[];
  /** Soft daily capacity ceiling in minutes, before calendar/task subtraction. Default 6h = 360. */
  dailyCapacityMinutes: number;
  /** Minutes reserved for breaks per day, subtracted from capacity. Default 30. */
  breakMinutes: number;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  workStartMinutes: 9 * 60,
  workEndMinutes: 18 * 60,
  preferredPeriod: "morning",
  productiveDays: ["Monday", "Tuesday", "Wednesday", "Thursday"],
  dailyCapacityMinutes: 360,
  breakMinutes: 30,
};

/** One day of historical completion data, used for burnout detection & historical-importance weighting. */
export interface HistoryEntry {
  date: string; // YYYY-MM-DD
  plannedMinutes: number;
  completedMinutes: number;
}

/** Full context the engine needs to make any scheduling decision. */
export interface EngineContext {
  /** All tasks currently known to the planner (any week), used for capacity/conflict checks. */
  tasks: SchedTask[];
  /** Locked calendar intervals (already merged or not — engine merges defensively). */
  busy: BusyInterval[];
  prefs: UserPreferences;
  /** The 7 dates (YYYY-MM-DD) of the week being scheduled, Monday..Sunday. */
  weekDates: string[];
  /** Today, YYYY-MM-DD. */
  todayDate: string;
  /** Last ~7 days of completion history, most recent last. */
  history?: HistoryEntry[];
}

export interface TimeSlot {
  date: string;
  startMinutes: number;
  endMinutes: number;
}

export interface ScoreBreakdown {
  importance: number;
  deadlineWeight: number;
  userWeight: number;
  aiConfidence: number;
  historicalImportance: number;
  score: number;
}

export interface DecisionLogEntry {
  step: string;
  detail: string;
  timestamp: string;
}

export interface ExplainedResult<T> {
  result: T;
  log: DecisionLogEntry[];
  confidenceBefore?: number;
  confidenceAfter?: number;
  narrative: string[];
}

export function minutesToClock(mins: number): string {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function dayNameOf(dateStr: string): string {
  const names = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  return names[new Date(dateStr + "T00:00:00").getDay()];
}
