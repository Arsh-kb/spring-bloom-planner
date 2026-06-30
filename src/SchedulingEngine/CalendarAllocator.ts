// SchedulingEngine/CalendarAllocator.ts
//
// Treats Google Calendar events as locked intervals. Planner tasks must
// never overlap them. Produces free intervals as candidate scheduling
// slots, preferring large uninterrupted blocks over fragmented gaps so
// deep work stays protected.

import { BusyInterval, TimeSlot, UserPreferences } from "./types";

/** Merge overlapping/adjacent busy intervals for a single day into a minimal set. */
export function mergeIntervals(intervals: BusyInterval[]): BusyInterval[] {
  const sorted = [...intervals].sort((a, b) => a.startMinutes - b.startMinutes);
  const merged: BusyInterval[] = [];
  for (const cur of sorted) {
    const last = merged[merged.length - 1];
    if (last && cur.startMinutes <= last.endMinutes) {
      last.endMinutes = Math.max(last.endMinutes, cur.endMinutes);
    } else {
      merged.push({ ...cur });
    }
  }
  return merged;
}

function intervalsForDate(busy: BusyInterval[], date: string): BusyInterval[] {
  return mergeIntervals(busy.filter((b) => b.date === date));
}

/**
 * Free slots for a given day within working hours, after subtracting
 * merged busy intervals. Sorted largest-block-first so callers naturally
 * prefer protecting deep work over fragmenting the day.
 */
export function freeSlots(
  date: string,
  prefs: UserPreferences,
  busy: BusyInterval[],
): TimeSlot[] {
  const dayBusy = intervalsForDate(busy, date);
  const slots: TimeSlot[] = [];
  let cursor = prefs.workStartMinutes;

  for (const b of dayBusy) {
    if (b.startMinutes > cursor) {
      slots.push({ date, startMinutes: cursor, endMinutes: b.startMinutes });
    }
    cursor = Math.max(cursor, b.endMinutes);
  }
  if (cursor < prefs.workEndMinutes) {
    slots.push({ date, startMinutes: cursor, endMinutes: prefs.workEndMinutes });
  }

  return slots
    .filter((s) => s.endMinutes - s.startMinutes > 0)
    .sort((a, b) => b.endMinutes - b.startMinutes - (a.endMinutes - a.startMinutes));
}

/**
 * Best single slot on `date` that fits `durationMinutes`. Among slots that
 * fit, picks the largest (protects deep work / leaves fewer fragments
 * behind) unless `tightest` is requested (picks the smallest sufficient
 * slot — used when packing a day tightly during recovery).
 */
export function findBestSlot(
  date: string,
  durationMinutes: number,
  prefs: UserPreferences,
  busy: BusyInterval[],
  opts: { tightest?: boolean; preferredStart?: number } = {},
): TimeSlot | null {
  const candidates = freeSlots(date, prefs, busy).filter(
    (s) => s.endMinutes - s.startMinutes >= durationMinutes,
  );
  if (candidates.length === 0) return null;

  let chosen: TimeSlot;
  if (opts.tightest) {
    chosen = [...candidates].sort(
      (a, b) => a.endMinutes - a.startMinutes - (b.endMinutes - b.startMinutes),
    )[0];
  } else {
    chosen = candidates[0]; // already sorted largest-first
  }

  // Snap to the preferred start of the slot, or to a preferred clock time
  // if it falls within this slot (e.g. preferred deep-work start).
  let start = chosen.startMinutes;
  if (
    opts.preferredStart !== undefined &&
    opts.preferredStart >= chosen.startMinutes &&
    opts.preferredStart + durationMinutes <= chosen.endMinutes
  ) {
    start = opts.preferredStart;
  }

  return { date, startMinutes: start, endMinutes: start + durationMinutes };
}

/**
 * Scans forward through `weekDates` (in order) for the first slot fitting
 * `durationMinutes`. Used for "find free time" chat commands.
 */
export function findFreeTimeAcrossWeek(
  weekDates: string[],
  durationMinutes: number,
  prefs: UserPreferences,
  busy: BusyInterval[],
): TimeSlot | null {
  for (const date of weekDates) {
    const slot = findBestSlot(date, durationMinutes, prefs, busy);
    if (slot) return slot;
  }
  return null;
}

/** Total locked/busy minutes on a given day (post-merge). */
export function busyMinutesForDate(date: string, busy: BusyInterval[]): number {
  return intervalsForDate(busy, date).reduce(
    (sum, b) => sum + (b.endMinutes - b.startMinutes),
    0,
  );
}

/** True if a proposed [start,end) on `date` overlaps any locked calendar interval. */
export function overlapsCalendar(
  date: string,
  startMinutes: number,
  endMinutes: number,
  busy: BusyInterval[],
): boolean {
  return intervalsForDate(busy, date).some(
    (b) => startMinutes < b.endMinutes && endMinutes > b.startMinutes,
  );
}
