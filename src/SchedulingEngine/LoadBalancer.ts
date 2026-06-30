// SchedulingEngine/LoadBalancer.ts
//
// Distributes work evenly across the week. Never piles everything onto
// one day. Combines several classic deterministic strategies:
//   - Earliest Deadline First (EDF) for task ordering priority
//   - Longest Processing Time (LPT) as a tie-breaker, scheduling large
//     tasks first so they don't get stranded
//   - Bin packing (Best-Fit) treating each day as a capacity-limited bin
//   - A min-heap-by-current-load selection so work spreads evenly instead
//     of greedily filling the first day that fits

import {
  busyMinutesForDate,
  findBestSlot,
  overlapsCalendar,
} from "./CalendarAllocator";
import { computeDailyCapacity, DayCapacity } from "./CapacityEngine";
import { earliestEligibleDate, topologicalSort } from "./DependencyResolver";
import { computePriorityScore } from "./PriorityEngine";
import {
  BusyInterval,
  DecisionLogEntry,
  EngineContext,
  SchedTask,
} from "./types";

export interface PlacedTask extends SchedTask {
  date: string;
  startMinutes?: number;
  endMinutes?: number;
  /** True if this task could not fit without exceeding daily capacity. */
  overflowed: boolean;
}

export interface LoadBalanceResult {
  placed: PlacedTask[];
  unplaced: SchedTask[]; // only non-empty if dependency cycles or impossible deadlines
  dayLoads: Record<string, number>; // date -> minutes scheduled (incl. pre-existing)
  log: DecisionLogEntry[];
}

function log(entries: DecisionLogEntry[], step: string, detail: string) {
  entries.push({ step, detail, timestamp: new Date().toISOString() });
}

/**
 * Sort order: Earliest Deadline First (no-deadline tasks last), then
 * Longest Processing Time as a tie-break (bigger tasks placed first so
 * the bin-packer has the most flexibility while bins are still empty),
 * then priority score descending, then stable by id for full determinism.
 */
function sortForScheduling(
  tasks: SchedTask[],
  todayDate: string,
  history: EngineContext["history"],
): SchedTask[] {
  return [...tasks].sort((a, b) => {
    const aDeadline = a.deadline ?? "9999-12-31";
    const bDeadline = b.deadline ?? "9999-12-31";
    if (aDeadline !== bDeadline) return aDeadline < bDeadline ? -1 : 1;

    const aDur = a.estimatedMinutes ?? 30;
    const bDur = b.estimatedMinutes ?? 30;
    if (aDur !== bDur) return bDur - aDur; // LPT: longer first

    const aScore = computePriorityScore(a, todayDate, history).score;
    const bScore = computePriorityScore(b, todayDate, history).score;
    if (aScore !== bScore) return bScore - aScore;

    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });
}

interface HeapEntry {
  date: string;
  load: number; // minutes already committed this pass
  capacity: DayCapacity;
}

/** Simple array-backed min-heap keyed by current load. 7 elements max — array ops are plenty fast. */
class LoadMinHeap {
  private items: HeapEntry[];
  constructor(items: HeapEntry[]) {
    this.items = [...items];
  }
  /** Returns eligible entries (date in range) sorted by ascending load, then descending remaining capacity. */
  candidatesFrom(eligibleDates: Set<string>): HeapEntry[] {
    return this.items
      .filter((e) => eligibleDates.has(e.date))
      .sort((a, b) => {
        if (a.load !== b.load) return a.load - b.load;
        return b.capacity.remainingMinutes - a.capacity.remainingMinutes;
      });
  }
  addLoad(date: string, minutes: number) {
    const entry = this.items.find((e) => e.date === date);
    if (entry) entry.load += minutes;
  }
  snapshot(): Record<string, number> {
    return Object.fromEntries(this.items.map((e) => [e.date, e.load]));
  }
}

/**
 * Main entry point. Places `tasks` onto `context.weekDates`, respecting
 * dependencies, deadlines, calendar locks, and daily capacity — spreading
 * load evenly rather than front-loading the week.
 */
export function distribute(
  tasks: SchedTask[],
  context: EngineContext,
): LoadBalanceResult {
  const entries: DecisionLogEntry[] = [];
  const { weekDates, prefs, busy, todayDate, history } = context;

  // Locked/manually-dated tasks are not up for placement — they anchor
  // capacity calculations but the balancer doesn't move them.
  const movable = tasks.filter((t) => !t.locked && !t.date);
  const alreadyPlaced = tasks.filter((t) => t.locked || t.date);

  log(
    entries,
    "intake",
    `${movable.length} task(s) to place, ${alreadyPlaced.length} already anchored on the calendar/planner.`,
  );

  // Dependency ordering first — never schedule a dependent before its
  // dependency, regardless of deadline pressure.
  const { ordered, cycleTaskIds } = topologicalSort(movable);
  if (cycleTaskIds.length > 0) {
    log(
      entries,
      "dependency-cycle",
      `Detected a dependency cycle among: ${cycleTaskIds.join(", ")}. These were left unplaced.`,
    );
  }

  const sorted = sortForScheduling(ordered, todayDate, history);
  log(
    entries,
    "sort",
    `Ordered tasks by Earliest Deadline First, then Longest Processing Time, then priority score.`,
  );

  const heap = new LoadMinHeap(
    weekDates.map((date) => ({
      date,
      load: 0,
      capacity: computeDailyCapacity(date, prefs, busy, context.tasks, history),
    })),
  );

  const byId = new Map<string, SchedTask>(context.tasks.map((t) => [t.id, t]));
  const placed: PlacedTask[] = [];
  const unplaced: SchedTask[] = [];
  const runningBusy: BusyInterval[] = [...busy];

  for (const task of sorted) {
    const duration = task.estimatedMinutes ?? 30;
    const earliestDate = earliestEligibleDate(task, byId, weekDates[0]);
    const deadlineDate = task.deadline ?? weekDates[weekDates.length - 1];

    const eligibleDates = new Set(
      weekDates.filter((d) => d >= earliestDate && d <= deadlineDate),
    );
    if (eligibleDates.size === 0) {
      // Deadline is before any week date we control, or before its
      // dependency can finish — flag rather than silently dropping it.
      unplaced.push(task);
      log(
        entries,
        "unplaceable",
        `"${task.title}" has no valid day this week given its deadline/dependencies.`,
      );
      continue;
    }

    const candidates = heap.candidatesFrom(eligibleDates);
    // Best-fit among least-loaded days: first candidate (by load asc,
    // capacity desc) that actually has room for this task. `c.load` is
    // this pass's cumulative committed minutes for that day so far.
    let chosen = candidates.find(
      (c) => c.capacity.remainingMinutes - c.load >= duration,
    );

    let overflowed = false;
    if (!chosen) {
      // Impossible to avoid overload — choose the least-bad day: prefer
      // the deadline day if in range (avoid missing it entirely), else
      // the least-loaded eligible day.
      overflowed = true;
      chosen =
        candidates.find((c) => c.date === deadlineDate) ?? candidates[0];
      log(
        entries,
        "overflow",
        `No day had spare capacity for "${task.title}" (${duration}m) without exceeding its limit. ` +
          `Placed on ${chosen.date} anyway to respect the deadline/ordering — this day is now over capacity.`,
      );
    }

    const preferredStart =
      task.mood === "high-strain"
        ? prefs.workStartMinutes
        : task.timeBlock === "evening"
          ? prefs.workEndMinutes - duration
          : undefined;

    let slot = findBestSlot(chosen.date, duration, prefs, runningBusy, {
      preferredStart,
    });
    if (!slot) {
      // Calendar is fully packed that day too — still record minutes
      // against the day's load so capacity math stays honest, but we
      // can't give it a concrete time without violating a lock.
      slot = null;
    } else {
      runningBusy.push({
        date: chosen.date,
        startMinutes: slot.startMinutes,
        endMinutes: slot.endMinutes,
        title: task.title,
      });
    }

    const timeBlock =
      task.timeBlock ??
      (slot
        ? slot.startMinutes < 12 * 60
          ? "morning"
          : slot.startMinutes < 17 * 60
            ? "afternoon"
            : "evening"
        : undefined);

    placed.push({
      ...task,
      date: chosen.date,
      startMinutes: slot?.startMinutes,
      endMinutes: slot?.endMinutes,
      timeBlock,
      overflowed,
    });

    heap.addLoad(chosen.date, duration);
    byId.set(task.id, { ...task, date: chosen.date });

    log(
      entries,
      "placed",
      `"${task.title}" → ${chosen.date}${slot ? ` at ${minutesLabel(slot.startMinutes)}` : ""} ` +
        `(${duration}m${overflowed ? ", over capacity" : ""}).`,
    );
  }

  return {
    placed,
    unplaced,
    dayLoads: heap.snapshot(),
    log: entries,
  };
}

function minutesLabel(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
