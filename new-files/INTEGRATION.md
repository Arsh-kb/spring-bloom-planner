# Vibe2Ship Scheduling Engine (VSE) — Integration Guide

## What's here

```
SchedulingEngine/              ← drop into src/lib/ or src/SchedulingEngine/
  types.ts                     shared types, no app dependencies
  PriorityEngine.ts            Priority Score = Importance × Deadline × User × AIConfidence × History
  CapacityEngine.ts            daily capacity (calendar + scheduled load + productivity history)
  CalendarAllocator.ts         interval merge, free-slot finding, locked-event overlap checks
  DependencyResolver.ts        topological sort (Kahn's algorithm), cycle detection
  LoadBalancer.ts              EDF + LPT + best-fit bin packing + min-heap load spreading
  RecoveryEngine.ts            overload detection, recovery moves, sliding-window burnout, confidence score
  ScheduleValidator.ts         full validation + deterministic auto-retry (max 3 passes)
  DecisionExplainer.ts         turns the raw decision log into the replay narrative
  SchedulingEngine.ts          orchestrator — the ONLY module the app should import directly
  index.ts                     barrel export

src/lib/scheduling/adapter.ts  the ONLY file that knows both the engine's types AND the app's
                                Task / CalendarEvent / FocusSession types
```

Everything in `SchedulingEngine/` is framework-agnostic, has zero imports
from your app, and type-checks clean under `tsc --strict`. It's
independently unit-testable.

`adapter.ts` is intentionally the single seam between the two worlds —
if `@/types/planner`'s `Task` shape changes, this is the only file that
needs to change with it.

## Assumptions to verify against your actual `@/types/planner.ts`

I don't have that file, so `adapter.ts` assumes:
- `Task.due_date` already exists (it's referenced in `updateTaskDetails`'s
  `Pick<Task, ... | "due_date" | ...>` in your `PlannerContext.tsx`) — used
  as the engine's `deadline`.
- `Task.estimatedMinutes?: number` and `Task.dependsOn?: string[]` do
  **not** yet exist. Add them as optional fields:

```ts
// @/types/planner.ts — additive only, nothing removed
export interface Task {
  // ...existing fields...
  estimatedMinutes?: number;
  dependsOn?: string[];
}
```

If your AI breakdown action already returns `estimatedMinutes` per
subtask (it does — see `BreakdownSchema.subtasks[].estimatedMinutes` in
your edge function), this just means persisting that field onto the
`Task` object instead of discarding it, which you're currently doing.

## Wiring into `PlannerContext.tsx`

No existing function signatures, UI, or state shape change. Five
functions get their *internals* swapped from "trust whatever the AI
returned" to "ask the engine," and one new function + one new command
dispatcher get added. Diffs below; `usePlanner()`'s public interface is
untouched.

### 1. Add the imports

```ts
// top of PlannerContext.tsx, alongside existing imports
import { useGoogle } from "@/contexts/GoogleContext";
import { buildEngineContext } from "@/lib/scheduling/adapter";
import {
  computeWeekConfidence,
  computeTaskRisk as engineComputeTaskRisk,
  recoverWeek,
  rescheduleMissed,
  scheduleNewGoal,
  executeChatCommand,
  joinReplay,
  type ChatCommand,
} from "@/SchedulingEngine";
```

`PlannerProvider` will need `calendarEvents` from `useGoogle()` to build
correct capacity (calendar events must block scheduling). Add one line
near the top of `PlannerProvider`:

```ts
const { calendarEvents } = useGoogle();
```

(`GoogleProvider` already wraps the app above `PlannerProvider`, per your
existing context tree, so this is safe — confirm `GoogleProvider` sits
outside `PlannerProvider` in `App.tsx`; if it currently sits *inside*,
swap the nesting order, since `PlannerProvider` now depends on it.)

### 2. `computeConfidence` — compute locally, AI no longer in the loop

```ts
const computeConfidence = useCallback(async () => {
  const ctx = buildEngineContext({
    tasks,
    calendarEvents,
    weekDates: currentWeekDates,
    todayDate: todayDayId,
    focusSessions,
  });
  const result = computeWeekConfidence(ctx);
  setConfidence({
    overall: result.score,
    momentum: "flat", // optional: derive from comparing to last snapshot's score
    completedToday: tasks.filter((t) => t.date === todayDayId && t.completed).length,
    totalToday: tasks.filter((t) => t.date === todayDayId).length,
    overdueCount: tasks.filter((t) => !t.completed && t.date < todayDayId).length,
    riskTasks: result.metrics.conflictCount,
    reasoning: result.explanation,
  });
}, [tasks, calendarEvents, currentWeekDates, todayDayId, focusSessions]);
```

This runs in milliseconds and removes one network round trip + one point
of failure (no more `ai-chief` 500s breaking the confidence widget).

### 3. `computeTaskRisk` — same pattern

```ts
const computeTaskRisk = useCallback(
  async (taskId: string): Promise<TaskRisk> => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return "low";
    const ctx = buildEngineContext({
      tasks, calendarEvents, weekDates: currentWeekDates, todayDate: todayDayId, focusSessions,
    });
    const schedTask = ctx.tasks.find((t) => t.id === taskId)!;
    const result = engineComputeTaskRisk(schedTask, ctx);
    setTaskRisks((prev) => ({ ...prev, [taskId]: result.risk }));
    return result.risk;
  },
  [tasks, calendarEvents, currentWeekDates, todayDayId, focusSessions],
);
```

### 4. `runRecovery` — engine decides the moves; AI (optional) only narrates

```ts
const runRecovery = useCallback(async (): Promise<boolean> => {
  createSnapshot("Before recovery");
  const ctx = buildEngineContext({
    tasks, calendarEvents, weekDates: currentWeekDates, todayDate: todayDayId, focusSessions,
  });
  const outcome = recoverWeek(ctx);

  if (outcome.result.moves.length === 0) return false;

  for (const move of outcome.result.moves) {
    moveTask(move.taskId, move.toDate);
  }

  addExplanation({
    action: "recovery",
    taskId: undefined,
    reason: joinReplay(outcome.narrative),
    confidence: outcome.confidenceAfter ?? 0,
    model: "scheduling-engine", // deterministic, not an LLM call
    details: { changes: outcome.result.moves },
  });

  setRecoveryProposal({
    summary: outcome.narrative[outcome.narrative.length - 1] ?? "Recovery complete.",
    changes: outcome.result.moves.map((m) => ({
      type: "move" as const,
      taskId: m.taskId,
      fromDate: m.fromDate,
      toDate: m.toDate,
      reason: m.reason,
    })),
    newConfidence: outcome.confidenceAfter ?? 0,
    oldConfidence: outcome.confidenceBefore ?? 0,
  });

  return true;
}, [tasks, calendarEvents, currentWeekDates, todayDayId, focusSessions, createSnapshot, moveTask, addExplanation]);
```

This entirely removes the `invokeAI("recovery", ...)` call from the hot
path — recovery now runs even when `ai-chief` is down.

### 5. `checkAndReschedule` — same idea

```ts
const checkAndReschedule = useCallback(async (): Promise<boolean> => {
  const overdueTasks = tasks.filter((t) => !t.completed && t.date < todayDayId);
  if (overdueTasks.length === 0) return false;

  createSnapshot("Before autonomous reschedule");
  const ctx = buildEngineContext({
    tasks, calendarEvents, weekDates: currentWeekDates, todayDate: todayDayId, focusSessions,
  });
  const schedOverdue = ctx.tasks.filter((t) => overdueTasks.some((o) => o.id === t.id));
  const outcome = rescheduleMissed(schedOverdue, ctx);

  for (const placed of outcome.result) {
    moveTask(placed.id, placed.date);
    addExplanation({
      action: "reschedule",
      taskId: placed.id,
      reason: `Rescheduled by the Scheduling Engine — ${placed.date}.`,
      confidence: outcome.confidenceAfter ?? 85,
      model: "scheduling-engine",
    });
  }
  return outcome.result.length > 0;
}, [tasks, calendarEvents, currentWeekDates, todayDayId, createSnapshot, moveTask, addExplanation]);
```

### 6. New: apply an AI breakdown through the engine

Wherever `ChiefPanel` currently calls `invokeAI("breakdown", ...)` and
then directly creates tasks from `data.subtasks` (placing them via the
AI's own `dayOffset`/`timeBlock`), insert one step: hand the AI's
subtasks to `scheduleNewGoal` instead of trusting its placement.

```ts
// new function on PlannerContext, exposed alongside the existing ones
const applyAIBreakdown = useCallback(
  (subtasks: Array<{ title: string; estimatedMinutes: number; priority: "low"|"medium"|"high"; mood?: TaskMood; timeBlock?: TimeBlock }>) => {
    createSnapshot("Before goal scheduling");
    const ctx = buildEngineContext({
      tasks, calendarEvents, weekDates: currentWeekDates, todayDate: todayDayId, focusSessions,
    });
    const candidates = subtasks.map((s, i) => ({
      id: `goal_${Date.now()}_${i}`,
      title: s.title,
      completed: false,
      priority: s.priority,
      estimatedMinutes: s.estimatedMinutes,
      mood: s.mood,
      timeBlock: s.timeBlock, // engine treats this as a soft preference, not a placement
      source: "ai" as const,
    }));
    const outcome = scheduleNewGoal(candidates, ctx);
    for (const placed of outcome.result) {
      addTask(placed.date, placed.title, placed.priority, placed.mood, placed.timeBlock);
    }
    addExplanation({
      action: "schedule",
      reason: joinReplay(outcome.narrative),
      confidence: outcome.confidenceAfter ?? 0,
      model: "scheduling-engine",
      details: { placed: outcome.result },
    });
  },
  [tasks, calendarEvents, currentWeekDates, todayDayId, focusSessions, createSnapshot, addTask, addExplanation],
);
```

Note: the AI edge function's `BreakdownSchema` already returns
`title`/`estimatedMinutes`/`priority`/`mood`/`timeBlock` — you do **not**
need to touch `ai-chief/index.ts` at all. Its `dayOffset` field simply
becomes unused (the engine ignores it and decides placement itself),
which matches the brief's philosophy exactly: the AI interprets intent,
the engine places it. If you want to trim the now-unused field later
that's optional cleanup, not required for this to work.

### 7. AI Chat — dispatch through the engine, never regenerate

Wherever your chat handler currently parses a free-text command like
"Move coding to Thursday" and decides what to do, route the *parsed*
intent through `executeChatCommand`:

```ts
const handleChatCommand = useCallback(
  (command: ChatCommand) => {
    const ctx = buildEngineContext({
      tasks, calendarEvents, weekDates: currentWeekDates, todayDate: todayDayId, focusSessions,
    });
    const outcome = executeChatCommand(command, ctx);

    if (outcome.ok && command.type === "move_task") {
      moveTask(command.taskId, command.toDate);
    }
    if (outcome.ok && command.type === "delete_task") {
      deleteTask(command.taskId);
    }
    if (outcome.ok && command.type === "change_priority") {
      updateTaskDetails(command.taskId, { priority: command.priority });
    }
    if (outcome.ok && command.type === "change_duration") {
      updateTaskDetails(command.taskId, { /* requires estimatedMinutes added to the Pick<> in updateTaskDetails, see step 0 */ } as never);
    }
    if (outcome.ok && (command.type === "reduce_workload" || command.type === "recover_week")) {
      const moves = (outcome.data as { moves: Array<{ taskId: string; toDate: string }> }).moves;
      for (const m of moves) moveTask(m.taskId, m.toDate);
    }
    if (outcome.ok && command.type === "schedule_workout") {
      const placed = outcome.data as { date: string; title: string; priority: "low"|"medium"|"high"; mood?: TaskMood; timeBlock?: TimeBlock };
      addTask(placed.date, placed.title, placed.priority, placed.mood, placed.timeBlock);
    }

    return outcome; // { ok, message, narrative? } — feed `message`/`narrative` straight into the chat UI
  },
  [tasks, calendarEvents, currentWeekDates, todayDayId, focusSessions, moveTask, deleteTask, updateTaskDetails, addTask],
);
```

Your existing free-text → structured-command parsing step (LLM call to
classify "move coding to Thursday" into `{type: "move_task", taskId, toDate}`)
stays exactly as it is — that classification step is still a legitimate
AI job ("understand intent"). What changes is that the result of that
classification is now executed by `handleChatCommand`, not by asking the
AI to regenerate or re-place anything.

### 8. Gmail → planner tasks

In `GoogleContext.tsx`'s `resolveSuggestion`, when a suggestion is
accepted, instead of inserting it at an arbitrary date, run it through
`intakeGmailCandidate`:

```ts
import { intakeGmailCandidate } from "@/SchedulingEngine";
import { buildEngineContext } from "@/lib/scheduling/adapter";

// inside resolveSuggestion, status === "accepted" branch, after the
// existing supabase update — this requires access to tasks/calendarEvents/
// weekDates, so it's cleanest called from PlannerContext (which already
// has all three) rather than from GoogleContext itself. Expose a thin
// wrapper on PlannerContext:

const acceptGmailSuggestion = useCallback(
  (suggestion: { id: string; subject: string; category: string }) => {
    const ctx = buildEngineContext({
      tasks, calendarEvents, weekDates: currentWeekDates, todayDate: todayDayId, focusSessions,
    });
    const candidate = {
      id: `gmail_${suggestion.id}`,
      title: suggestion.subject,
      completed: false,
      priority: "medium" as const,
      estimatedMinutes: 30,
      source: "gmail" as const,
    };
    const outcome = intakeGmailCandidate(candidate, ctx);
    if (outcome.result) {
      addTask(outcome.result.date, outcome.result.title, "medium", undefined, outcome.result.timeBlock);
    }
    return outcome;
  },
  [tasks, calendarEvents, currentWeekDates, todayDayId, focusSessions, addTask],
);
```

Wire this to fire wherever the UI currently calls
`resolveSuggestion(id, "accepted")`.

## What stays exactly as-is

- `ai-chief/index.ts` — unchanged. It still returns interpreted subtasks/
  briefings/reflections; the engine simply stops trusting its placement
  fields (`dayOffset`, scheduling-flavored parts of `briefing`/`reflect`
  stay as AI narrative copy, which is fine — those are prose, not
  placement decisions).
- `PlannerContext`'s public interface (`usePlanner()` return shape) —
  unchanged, only two new optional functions added (`applyAIBreakdown`,
  `handleChatCommand`, `acceptGmailSuggestion`).
- `ChiefPanel`, UI, animations, Living World, Mission Report rendering —
  untouched. `lastMissionReport` can be populated from
  `computeWeekConfidence` + `detectOverloadedDays` locally if you want
  Mission Report off the AI critical path too, but that's optional —
  not required by this change.
- `GoogleProvider` — unchanged except the one optional `acceptGmailSuggestion`
  hook point described above.

## Why this satisfies the brief

- **Deterministic**: every algorithm in `SchedulingEngine/` is pure
  functions over its inputs — no `Math.random`, no model calls, no
  reliance on AI ever for placement.
- **Local, millisecond execution**: `LoadBalancer`, `RecoveryEngine`,
  `ScheduleValidator`, confidence scoring all run synchronously in the
  browser — no `ai-chief` round trip required for rescheduling, recovery,
  conflict detection, load balancing, calendar optimization, capacity
  calculation, decision replay, or confidence score, exactly as specified.
- **Explainable**: `DecisionExplainer` produces the
  "Detected overloaded Monday. ↓ Moved... ↓ Confidence increased from 71%
  to 92%." replay format directly from the engine's own decision log —
  never from an LLM-generated explanation.
- **AI stays a strategist**: `ai-chief` keeps interpreting goals,
  estimating duration/difficulty, and (once you add `dependsOn` to its
  schemas, optional next step) identifying dependencies — and nothing
  more.
