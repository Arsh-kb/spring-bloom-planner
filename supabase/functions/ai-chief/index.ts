/* eslint-disable @typescript-eslint/no-explicit-any */
// AI Chief of Staff — OpenRouter-first architecture (BULLETPROOF EDITION)
// Tier 1: OpenRouter (primary)
// Tier 2: Ollama (fallback)
// Tier 3: Local heuristics (always works)
// Added: Strict Zod validation with aggressive fallbacks to prevent UI crashes
// deno-lint-ignore-file

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { z } from "npm:zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ---------- Config ----------
const DEFAULT_MODEL = "qwen/qwen3-8b:free";
const OPENROUTER_BASE = "https://openrouter.ai/api/v1";

enum BackendSource {
  OPENROUTER = "openrouter",
  OLLAMA = "ollama",
  HEURISTIC = "heuristic",
}

interface AIResponse {
  data: any;
  source: BackendSource;
  fallback: boolean;
  timestamp: string;
}

// ---------- Indestructible Zod Schemas ----------
// These ensure the frontend NEVER receives undefined fields or wrong types.

const BriefingSchema = z.object({
  greeting: z.coerce.string().catch("Ready for the day."),
  workloadHours: z.coerce.number().catch(0),
  bestFocusWindow: z.coerce.string().catch("Flexible"),
  topRisk: z.coerce.string().catch("None identified."),
  recommendation: z.coerce.string().catch("Proceed with standard tasks."),
  confidence: z.coerce.number().catch(50),
});

const BreakdownSchema = z.object({
  summary: z.coerce.string().catch("Task Breakdown"),
  estimatedHours: z.coerce.number().catch(1),
  subtasks: z
    .array(
      z.object({
        title: z.coerce.string().catch("Subtask"),
        estimatedMinutes: z.coerce.number().catch(30),
        priority: z.enum(["low", "medium", "high"]).catch("medium"),
        mood: z
          .enum(["high-strain", "reflective", "routine", "energizing"])
          .catch("routine"),
        timeBlock: z.enum(["morning", "afternoon", "evening"]).catch("morning"),
        dayOffset: z.coerce.number().catch(0),
      }),
    )
    .catch([]),
});

const ScheduleSchema = z.object({
  rationale: z.coerce.string().catch("Standard distribution applied."),
  assignments: z
    .array(
      z.object({
        title: z.coerce.string().catch("Task"),
        dayOffset: z.coerce.number().catch(0),
        priority: z.enum(["low", "medium", "high"]).catch("medium"),
        mood: z
          .enum(["high-strain", "reflective", "routine", "energizing"])
          .catch("routine"),
        timeBlock: z.enum(["morning", "afternoon", "evening"]).catch("morning"),
      }),
    )
    .catch([]),
});

const RescheduleSchema = z.object({
  moves: z
    .array(
      z.object({
        taskId: z.coerce.string().catch(""),
        newDate: z.coerce.string().catch(""),
        reason: z.coerce.string().catch("Rescheduled to balance load."),
      }),
    )
    .catch([]),
});

const ReflectSchema = z.object({
  summary: z.coerce.string().catch("Day complete."),
  insight: z.coerce.string().catch("Keep up the momentum."),
  focusTrend: z.enum(["up", "flat", "down"]).catch("flat"),
});

const ConfidenceSchema = z.object({
  overall: z.coerce.number().catch(50),
  momentum: z.enum(["up", "flat", "down"]).catch("flat"),
  completedToday: z.coerce.number().catch(0),
  totalToday: z.coerce.number().catch(0),
  overdueCount: z.coerce.number().catch(0),
  riskTasks: z.coerce.number().catch(0),
  reasoning: z.coerce.string().catch("Standard progress track."),
});

const RiskSchema = z.object({
  risk: z.enum(["low", "medium", "high"]).catch("low"),
  probability: z.coerce.number().catch(10),
  blockers: z.array(z.coerce.string()).catch([]),
  suggestion: z.coerce.string().catch("Monitor progress closely."),
});

const RecoverySchema = z.object({
  summary: z.coerce.string().catch("Recovery plan active."),
  changes: z
    .array(
      z.object({
        type: z.enum(["move", "remove", "reschedule"]).catch("reschedule"),
        taskId: z.coerce.string().catch(""),
        fromDate: z.coerce.string().catch(""),
        toDate: z.coerce.string().catch(""),
        reason: z.coerce.string().catch("Recovery adjustment"),
      }),
    )
    .catch([]),
  newConfidence: z.coerce.number().catch(50),
  oldConfidence: z.coerce.number().catch(50),
});

const MissionReportSchema = z.object({
  completionProbability: z.coerce.number().catch(50),
  deepWorkHours: z.coerce.number().catch(0),
  recoveryTime: z.coerce.number().catch(0),
  highRiskTasks: z.coerce.number().catch(0),
  protectedFocusBlocks: z.coerce.number().catch(0),
  schedulingStrategy: z.coerce.string().catch("Standard forward scheduling."),
});

const NegotiateSchema = z.object({
  canFit: z.boolean().catch(false),
  message: z.coerce.string().catch("Reviewing schedule parameters."),
  options: z
    .array(
      z.object({
        type: z
          .enum(["delay", "reduce_scope", "weekend", "longer_days"])
          .catch("delay"),
        description: z.coerce.string().catch("Adjust timeline"),
        impact: z.coerce.string().catch("Extends delivery date"),
      }),
    )
    .catch([]),
});

// ---------- OpenRouter call ----------

async function callOpenRouter(
  systemPrompt: string,
  userPrompt: string,
  apiKey: string,
  model?: string,
): Promise<any> {
  const chosenModel =
    model || Deno.env.get("OPENROUTER_MODEL") || DEFAULT_MODEL;
  console.log(`ai-chief: calling OpenRouter model=${chosenModel}`);

  const response = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": Deno.env.get("APP_URL") || "https://localhost",
      "X-Title": "AI Chief of Staff",
    },
    body: JSON.stringify({
      model: chosenModel,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: "json_object" },
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenRouter ${response.status}: ${errText}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || "";
  const clean = text.replace(/```json\n?|\n?```/g, "").trim();

  try {
    return JSON.parse(clean);
  } catch {
    const match = clean.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error(`Could not parse JSON from: ${clean.slice(0, 200)}`);
  }
}

// ---------- Ollama Fallback ----------

async function callOllama(
  systemPrompt: string,
  userPrompt: string,
): Promise<any> {
  console.log("ai-chief: calling Ollama fallback");
  const ollamaUrl = Deno.env.get("OLLAMA_URL") || "http://localhost:11434";
  const model = Deno.env.get("OLLAMA_MODEL") || "mistral";

  const response = await fetch(`${ollamaUrl}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      prompt: `${systemPrompt}\n\n${userPrompt}\n\nRespond ONLY with valid JSON. No explanation, no markdown.`,
      stream: false,
      temperature: 0.7,
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) throw new Error(`Ollama ${response.status}`);

  const data = await response.json();
  const text = data.response || "";
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON in Ollama response");
  return JSON.parse(match[0]);
}

// ---------- Unified AI Generate (With Zod Shields) ----------

async function aiGenerate(
  action: string,
  systemPrompt: string,
  userPrompt: string,
  apiKey: string | null,
  schema: z.ZodTypeAny,
  heuristicFn: () => any,
): Promise<AIResponse> {
  // Tier 1: OpenRouter
  if (apiKey) {
    try {
      const rawData = await callOpenRouter(systemPrompt, userPrompt, apiKey);
      // Validate & clean data using Zod. If AI sent malformed data, this catches it.
      const safeData = schema.parse(
        typeof rawData === "object" && rawData !== null ? rawData : {},
      );
      console.log(`ai-chief: OpenRouter succeeded for ${action}`);
      return {
        data: safeData,
        source: BackendSource.OPENROUTER,
        fallback: false,
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      const msg = String(err);
      console.warn(
        `ai-chief: OpenRouter failed/malformed for ${action}: ${msg}`,
      );

      // Tier 2: Ollama (on recoverable errors or schema parsing failure)
      const isRecoverable =
        msg.includes("429") ||
        msg.includes("timeout") ||
        msg.includes("503") ||
        msg.includes("502") ||
        msg.includes("ZodError"); // Fallback to Ollama if OpenRouter formats it wrong

      if (isRecoverable) {
        try {
          const rawOllamaData = await callOllama(systemPrompt, userPrompt);
          const safeOllamaData = schema.parse(
            typeof rawOllamaData === "object" && rawOllamaData !== null
              ? rawOllamaData
              : {},
          );
          console.log(`ai-chief: Ollama succeeded for ${action}`);
          return {
            data: safeOllamaData,
            source: BackendSource.OLLAMA,
            fallback: true,
            timestamp: new Date().toISOString(),
          };
        } catch (ollamaErr) {
          console.warn(`ai-chief: Ollama failed for ${action}: ${ollamaErr}`);
        }
      }
    }
  }

  // Tier 3: Heuristics (Guaranteed safe structure)
  console.log(`ai-chief: using heuristic fallback for ${action}`);
  return {
    data: heuristicFn(), // Heuristics are inherently safe as they are hardcoded
    source: BackendSource.HEURISTIC,
    fallback: true,
    timestamp: new Date().toISOString(),
  };
}

// ---------- Shared system prompt ----------

const BASE_SYSTEM = `You are an AI Chief of Staff — a precision planning assistant.
Always respond ONLY with a valid JSON object. No explanation, no markdown, no preamble.
Use the exact fields requested. All dates in YYYY-MM-DD format.`;

// ---------- Heuristic Engines ----------

function heuristicBriefing(tasks: any[], todayDate: string): any {
  const todayTasks = tasks.filter((t) => t.date === todayDate);
  const completedToday = todayTasks.filter((t) => t.completed).length;
  const totalToday = todayTasks.length;
  const workloadHours = todayTasks.reduce(
    (sum, t) => sum + (t.estimatedMinutes ? t.estimatedMinutes / 60 : 0.5),
    0,
  );
  const highPriority = todayTasks.filter((t) => t.priority === "high");
  const morningTasks = todayTasks.filter((t) => t.timeBlock === "morning");
  return {
    greeting: `Good morning. Today has ${totalToday} tasks.`,
    workloadHours: Number((Number(workloadHours) || 0).toFixed(1)),
    bestFocusWindow: morningTasks.length > 0 ? "09:00–11:00" : "10:00–12:00",
    topRisk:
      highPriority.length > 2
        ? `Too many high-priority tasks (${highPriority.length})`
        : completedToday === 0 && totalToday > 3
          ? "Day is overloaded — prioritize ruthlessly"
          : "Routine day",
    recommendation:
      highPriority.length > 0
        ? `Start with: ${highPriority[0].title}`
        : `Aim for 3 tasks before lunch`,
    confidence: Math.min(
      100,
      Math.max(
        20,
        50 +
          (completedToday - totalToday / 2) * 10 +
          (workloadHours < 6 ? 20 : workloadHours < 8 ? 0 : -30),
      ),
    ),
  };
}

function heuristicBreakdown(
  goal: string,
  _todayDate: string,
  _weekDates: string[],
): any {
  // Analyze goal to create more intelligent breakdown
  const goalLower = goal.toLowerCase();
  const isStudy = goalLower.includes('study') || goalLower.includes('learn') || goalLower.includes('review') || goalLower.includes('exam');
  const isProject = goalLower.includes('build') || goalLower.includes('create') || goalLower.includes('project') || goalLower.includes('app') || goalLower.includes('website');
  const isWriting = goalLower.includes('write') || goalLower.includes('essay') || goalLower.includes('article');
  const isExercise = goalLower.includes('workout') || goalLower.includes('exercise') || goalLower.includes('run') || goalLower.includes('gym');

  let subtasks = [];
  let estimatedHours = 1.5;

  if (isStudy || isProject) {
    // More detailed breakdown for complex tasks
    subtasks = [
      { title: `${goal}: Research & Planning`, estimatedMinutes: 30, priority: "high", mood: "reflective", timeBlock: "morning", dayOffset: 0 },
      { title: `${goal}: Core Implementation`, estimatedMinutes: 60, priority: "high", mood: "high-strain", timeBlock: "morning", dayOffset: 0 },
      { title: `${goal}: Development`, estimatedMinutes: 60, priority: "high", mood: "high-strain", timeBlock: "afternoon", dayOffset: 1 },
      { title: `${goal}: Testing & Refinement`, estimatedMinutes: 45, priority: "medium", mood: "reflective", timeBlock: "afternoon", dayOffset: 1 },
      { title: `${goal}: Final Review`, estimatedMinutes: 20, priority: "medium", mood: "reflective", timeBlock: "evening", dayOffset: 2 },
    ];
    estimatedHours = 3.75;
  } else if (isWriting) {
    subtasks = [
      { title: `${goal}: Outline & Structure`, estimatedMinutes: 20, priority: "high", mood: "reflective", timeBlock: "morning", dayOffset: 0 },
      { title: `${goal}: First Draft`, estimatedMinutes: 45, priority: "high", mood: "high-strain", timeBlock: "afternoon", dayOffset: 0 },
      { title: `${goal}: Edit & Polish`, estimatedMinutes: 30, priority: "medium", mood: "reflective", timeBlock: "evening", dayOffset: 1 },
    ];
    estimatedHours = 1.58;
  } else if (isExercise) {
    subtasks = [
      { title: `${goal}: Warm-up & Prep`, estimatedMinutes: 10, priority: "high", mood: "energizing", timeBlock: "morning", dayOffset: 0 },
      { title: `${goal}: Main Activity`, estimatedMinutes: 40, priority: "high", mood: "energizing", timeBlock: "morning", dayOffset: 0 },
      { title: `${goal}: Cool-down`, estimatedMinutes: 10, priority: "medium", mood: "reflective", timeBlock: "afternoon", dayOffset: 0 },
    ];
    estimatedHours = 1.0;
  } else {
    // Generic balanced breakdown
    subtasks = [
      { title: `${goal}: Getting Started`, estimatedMinutes: 25, priority: "high", mood: "energizing", timeBlock: "morning", dayOffset: 0 },
      { title: `${goal}: Progress`, estimatedMinutes: 45, priority: "high", mood: "high-strain", timeBlock: "afternoon", dayOffset: 0 },
      { title: `${goal}: Completion`, estimatedMinutes: 20, priority: "medium", mood: "reflective", timeBlock: "evening", dayOffset: 1 },
    ];
    estimatedHours = 1.5;
  }

  return {
    summary: goal,
    estimatedHours,
    subtasks,
  };
}

function heuristicReflection(tasks: any[], todayDate: string): any {
  const todayTasks = tasks.filter((t) => t.date === todayDate);
  const completedToday = todayTasks.filter((t) => t.completed).length;
  const totalToday = todayTasks.length;
  const ratio = completedToday / (totalToday || 1);
  return {
    summary: `Completed ${completedToday}/${totalToday} tasks today. ${ratio > 0.7 ? "Strong progress!" : "Keep building momentum."}`,
    insight: `You tend to complete tasks with ${totalToday > 4 ? "fewer" : "more"} focus when the day has ${totalToday > 4 ? "fewer distractions" : "clear structure"}.`,
    focusTrend: ratio > 0.7 ? "up" : ratio > 0.4 ? "flat" : "down",
  };
}

function heuristicConfidence(
  tasks: any[],
  todayDate: string,
  weekDates: string[],
): any {
  const todayTasks = tasks.filter((t) => t.date === todayDate);
  const completedToday = todayTasks.filter((t) => t.completed).length;
  const totalToday = todayTasks.length;
  const overdueTasks = tasks.filter((t) => !t.completed && t.date < todayDate);
  const riskTasks = tasks.filter(
    (t) => t.priority === "high" && !t.completed && weekDates.includes(t.date),
  );
  const overall = Math.max(
    20,
    Math.min(
      100,
      50 +
        (completedToday / (totalToday || 1)) * 30 -
        Math.min(20, overdueTasks.length * 5) -
        Math.min(10, riskTasks.length * 3),
    ),
  );
  return {
    overall: Math.round(overall),
    momentum:
      completedToday / (totalToday || 1) > 0.6
        ? "up"
        : completedToday / (totalToday || 1) > 0.3
          ? "flat"
          : "down",
    completedToday,
    totalToday,
    overdueCount: overdueTasks.length,
    riskTasks: riskTasks.length,
    reasoning: `${completedToday}/${totalToday} done today. ${overdueTasks.length} overdue. ${riskTasks.length} high-priority at risk.`,
  };
}

function heuristicReschedule(
  missedTasks: any[],
  weekDates: string[],
  existingTasks: any[],
): any {
  const loads: { [k: string]: number } = {};
  weekDates.forEach((d) => {
    loads[d] = existingTasks.filter((t) => t.date === d).length;
  });
  return {
    moves: missedTasks.map((_task, idx) => {
      const minDate =
        Object.entries(loads).sort(([, a], [, b]) => a - b)[0]?.[0] ||
        weekDates[0];
      return {
        taskId: _task.id,
        newDate: minDate,
        reason: `Rescheduled to least-loaded day (${loads[minDate]} tasks)`,
      };
    }),
  };
}

function heuristicRisk(
  task: any,
  _tasks: any[],
  todayDate: string,
  _weekDates: string[],
): any {
  const daysUntilDue = Math.max(
    0,
    Math.ceil(
      (new Date(task.date).getTime() - new Date(todayDate).getTime()) /
        86400000,
    ),
  );
  const estimatedHours = task.estimatedMinutes ? task.estimatedMinutes / 60 : 1;
  let risk: "low" | "medium" | "high" = "low";
  let probability = 20;
  if (daysUntilDue === 0) {
    risk = "high";
    probability = 85;
  } else if (daysUntilDue === 1) {
    risk = "high";
    probability = 70;
  } else if (daysUntilDue <= 2 && task.priority === "high") {
    risk = "medium";
    probability = 50;
  } else if (estimatedHours > 3 && daysUntilDue <= 2) {
    risk = "medium";
    probability = 45;
  }
  return {
    risk,
    probability,
    blockers: ["No dependencies tracked"],
    suggestion:
      risk === "high"
        ? "Start immediately or reschedule"
        : risk === "medium"
          ? "Block time tomorrow"
          : "On track",
  };
}

function heuristicRecovery(
  tasks: any[],
  todayDate: string,
  weekDates: string[],
): any {
  const overdueTasks = tasks.filter((t) => !t.completed && t.date < todayDate);
  const remainingWeek = tasks.filter(
    (t) => !t.completed && weekDates.includes(t.date),
  );

  // Calculate current load per day
  const dayLoad: Record<string, number> = {};
  weekDates.forEach(d => dayLoad[d] = 0);
  tasks.forEach((t: any) => {
    if (weekDates.includes(t.date)) {
      dayLoad[t.date] = (dayLoad[t.date] || 0) + 1;
    }
  });

  // Find least loaded days (threshold: < 4 tasks is "free")
  const sortedDays = Object.entries(dayLoad)
    .filter(([, count]) => count < 4)
    .sort((a, b) => a[1] - b[1])
    .map(([d]) => d);

  // Use least loaded days first, fall back to any day if all are busy
  const getLeastLoadedDay = (idx: number): string => {
    if (sortedDays[idx]) return sortedDays[idx];
    // If all days are busy, find the least busy one
    const leastBusy = Object.entries(dayLoad).sort((a, b) => a[1] - b[1])[0];
    return leastBusy ? leastBusy[0] : weekDates[0];
  };

  const oldConfidence = Math.max(20, 50 - overdueTasks.length * 10);
  const maxRecovery = 6; // Handle more overdue tasks
  const changes = overdueTasks.slice(0, maxRecovery).map((task, idx) => ({
    type: "reschedule" as const,
    taskId: task.id,
    fromDate: task.date,
    toDate: getLeastLoadedDay(idx),
    reason: `Rescheduled to ${dayLoad[getLeastLoadedDay(idx)] === 0 ? 'free day' : 'lighter day'}`,
  }));

  return {
    summary: `Recovery plan: Move ${overdueTasks.length} overdue items to free days, protect deep-work blocks, keep ${remainingWeek.length} on track.`,
    changes,
    newConfidence: Math.min(80, oldConfidence + 20),
    oldConfidence,
  };
}

function heuristicMissionReport(
  tasks: any[],
  _todayDate: string,
  weekDates: string[],
  focusSessions: any[] = [],
): any {
  const weekTasks = tasks.filter((t) => weekDates.includes(t.date));
  const completed = weekTasks.filter((t) => t.completed).length;
  const total = weekTasks.length;
  const deepWork = weekTasks.filter(
    (t) => t.timeBlock === "morning" || t.timeBlock === "afternoon",
  );
  const highPriority = weekTasks.filter(
    (t) => t.priority === "high" && !t.completed,
  );
  return {
    completionProbability: Math.round((completed / (total || 1)) * 100),
    deepWorkHours: deepWork.reduce(
      (sum, t) => sum + (t.estimatedMinutes ? t.estimatedMinutes / 60 : 0.5),
      0,
    ),
    recoveryTime: 2,
    highRiskTasks: highPriority.length,
    protectedFocusBlocks: deepWork.length,
    schedulingStrategy: `${total} tasks across ${weekDates.length} days. ${focusSessions.length} focus sessions.`,
  };
}

function heuristicNegotiation(
  request: string,
  availableHours: number,
  existingLoad: any[],
): any {
  const existingHours = existingLoad.reduce(
    (sum, t) => sum + (t.estimatedMinutes ? t.estimatedMinutes / 60 : 0.5),
    0,
  );
  const freeHours = availableHours - existingHours;
  const requestedHours = 5;
  const canFit = freeHours >= requestedHours;
  return {
    canFit,
    message: canFit
      ? `✓ Your request fits in ${(freeHours ?? 0).toFixed(1)} available hours.`
      : `✗ Not enough time: need ${requestedHours}h, have ${(freeHours ?? 0).toFixed(1)}h.`,
    options: [
      {
        type: "delay",
        description: "Push to next week",
        impact: "Gains 20 hours, moves deadline by 7 days",
      },
      {
        type: "reduce_scope",
        description: "Reduce scope by 30%",
        impact: "Fits in 3.5h instead of 5h",
      },
      {
        type: "weekend",
        description: "Add weekend work",
        impact: "Gains 8 additional hours",
      },
    ],
  };
}

// ---------- Handler ----------
Deno.serve(async (req) => {
  console.log("ai-chief: invoked —", req.method, req.url);

  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("OPENROUTER_API_KEY") || null;
    if (!apiKey)
      console.warn(
        "ai-chief: No OPENROUTER_API_KEY — will use Ollama/heuristics only",
      );

    let body: any;
    try {
      body = await req.json();
    } catch {
      return json({ error: "Invalid JSON request body" }, 400);
    }

    const action = body.action as string;
    console.log("ai-chief: received action:", action);

    // ===== BRIEFING =====
    if (action === "briefing") {
      const { tasks, todayDate, mode } = body;
      const todayTasks = (tasks as any[]).filter((t) => t.date === todayDate);
      const result = await aiGenerate(
        "briefing",
        `${BASE_SYSTEM}\nReturn JSON matching schema: { greeting, workloadHours, bestFocusWindow, topRisk, recommendation, confidence }`,
        `Today is ${todayDate}. Lighting mode: ${mode}.\nToday's tasks: ${JSON.stringify(todayTasks)}\nWeek overview: ${JSON.stringify((tasks as any[]).slice(0, 20))}`,
        apiKey,
        BriefingSchema,
        () => heuristicBriefing(tasks, todayDate),
      );
      return json(result);
    }

    // ===== BREAKDOWN =====
    if (action === "breakdown") {
      const { goal, todayDate, weekDates } = body;
      const result = await aiGenerate(
        "breakdown",
        `${BASE_SYSTEM}\nReturn JSON matching schema: { summary, estimatedHours, subtasks: [{ title, estimatedMinutes, priority, mood, timeBlock, dayOffset }] }`,
        `Goal: ${goal}\nToday: ${todayDate}\nWeek: ${weekDates.join(", ")}`,
        apiKey,
        BreakdownSchema,
        () => heuristicBreakdown(goal, todayDate, weekDates),
      );
      return json(result);
    }

    // ===== SCHEDULE =====
    if (action === "schedule") {
      const { goals, existingTasks, todayDate, weekDates } = body;
      const result = await aiGenerate(
        "schedule",
        `${BASE_SYSTEM}\nReturn JSON matching schema: { rationale, assignments: [{ title, dayOffset, priority, mood, timeBlock }] }`,
        `Today: ${todayDate}\nWeek (offset 0–6): ${weekDates.join(", ")}\nGoals:\n${goals}\nExisting tasks: ${JSON.stringify(existingTasks)}`,
        apiKey,
        ScheduleSchema,
        () => {
          // Calculate existing task load per day
          const dayLoad: Record<string, number> = {};
          weekDates.forEach(d => dayLoad[d] = 0);
          (existingTasks || []).forEach((t: any) => {
            if (weekDates.includes(t.date)) {
              dayLoad[t.date] = (dayLoad[t.date] || 0) + 1;
            }
          });

          // Find least loaded days
          const sortedDays = Object.entries(dayLoad).sort((a, b) => a[1] - b[1]).map(([d]) => d);

          const goalsList = (goals as string).split("\n").filter((g: string) => g.trim());
          const maxGoals = 10; // Increased from 5
          const assignments = goalsList.slice(0, maxGoals).map((g: string, i: number) => {
            // Distribute to least loaded days
            const dayIndex = i % sortedDays.length;
            const targetDay = sortedDays[dayIndex];
            const dayOffset = weekDates.indexOf(targetDay);

            // Assign time block based on position
            const timeBlock = i % 3 === 0 ? "morning" : i % 3 === 1 ? "afternoon" : "evening";

            return {
              title: g.trim(),
              dayOffset,
              priority: "medium",
              mood: "routine",
              timeBlock,
            };
          });

          const overloadedDays = Object.entries(dayLoad).filter(([, count]) => count >= 5).map(([d]) => d);
          const rationale = overloadedDays.length > 0
            ? `Balanced across ${weekDates.length} days. Avoiding overloaded days: ${overloadedDays.join(", ")}`
            : "Tasks distributed evenly across the week to maintain balance.";

          return { rationale, assignments };
        },
      );
      return json(result);
    }

    // ===== RESCHEDULE =====
    if (action === "reschedule") {
      const { missedTasks, weekDates, existingTasks } = body;
      const result = await aiGenerate(
        "reschedule",
        `${BASE_SYSTEM}\nReturn JSON matching schema: { moves: [{ taskId, newDate, reason }] }`,
        `Missed tasks: ${JSON.stringify(missedTasks)}\nWeek: ${weekDates.join(", ")}\nExisting: ${JSON.stringify(existingTasks)}`,
        apiKey,
        RescheduleSchema,
        () => heuristicReschedule(missedTasks, weekDates, existingTasks),
      );
      return json(result);
    }

    // ===== REFLECT =====
    if (action === "reflect") {
      const { tasks, todayDate } = body;
      const todayTasks = (tasks as any[]).filter((t) => t.date === todayDate);
      const result = await aiGenerate(
        "reflect",
        `${BASE_SYSTEM}\nReturn JSON matching schema: { summary, insight, focusTrend }`,
        `Date: ${todayDate}\nToday's tasks: ${JSON.stringify(todayTasks)}`,
        apiKey,
        ReflectSchema,
        () => heuristicReflection(tasks, todayDate),
      );
      return json(result);
    }

    // ===== CONFIDENCE =====
    if (action === "confidence") {
      const { tasks, todayDate, weekDates } = body;
      const todayTasks = (tasks as any[]).filter((t) => t.date === todayDate);
      const completedToday = todayTasks.filter((t) => t.completed).length;
      const result = await aiGenerate(
        "confidence",
        `${BASE_SYSTEM}\nReturn JSON matching schema: { overall, momentum, completedToday, totalToday, overdueCount, riskTasks, reasoning }`,
        `Today: ${todayDate}\nCompleted today: ${completedToday}/${todayTasks.length}\nWeek tasks: ${JSON.stringify((tasks as any[]).filter((t) => weekDates.includes(t.date)).slice(0, 20))}`,
        apiKey,
        ConfidenceSchema,
        () => heuristicConfidence(tasks, todayDate, weekDates),
      );
      return json(result);
    }

    // ===== RISK =====
    if (action === "risk") {
      const { task, tasks, todayDate, weekDates } = body;
      const result = await aiGenerate(
        "risk",
        `${BASE_SYSTEM}\nReturn JSON matching schema: { risk, probability, blockers, suggestion }`,
        `Task: ${(task as any).title}\nPriority: ${(task as any).priority}\nDue: ${(task as any).date}\nToday: ${todayDate}`,
        apiKey,
        RiskSchema,
        () => heuristicRisk(task, tasks, todayDate, weekDates),
      );
      return json(result);
    }

    // ===== RECOVERY =====
    if (action === "recovery") {
      const { tasks, todayDate, weekDates } = body;
      const result = await aiGenerate(
        "recovery",
        `${BASE_SYSTEM}\nReturn JSON matching schema: { summary, changes: [{ type, taskId, fromDate, toDate, reason }], newConfidence, oldConfidence }`,
        `Today: ${todayDate}\nWeek: ${weekDates.join(", ")}\nTasks: ${JSON.stringify((tasks as any[]).filter((t) => weekDates.includes(t.date)).slice(0, 15))}`,
        apiKey,
        RecoverySchema,
        () => heuristicRecovery(tasks, todayDate, weekDates),
      );
      return json(result);
    }

    // ===== MISSION_REPORT =====
    if (action === "mission_report") {
      const { tasks, todayDate, weekDates, focusSessions } = body;
      const result = await aiGenerate(
        "mission_report",
        `${BASE_SYSTEM}\nReturn JSON matching schema: { completionProbability, deepWorkHours, recoveryTime, highRiskTasks, protectedFocusBlocks, schedulingStrategy }`,
        `Week: ${weekDates.join(", ")}\nTasks: ${JSON.stringify((tasks as any[]).filter((t) => weekDates.includes(t.date)).slice(0, 15))}`,
        apiKey,
        MissionReportSchema,
        () =>
          heuristicMissionReport(tasks, todayDate, weekDates, focusSessions),
      );
      return json(result);
    }

    // ===== NEGOTIATE =====
    if (action === "negotiate") {
      const { request, availableHours, tasks, weekDates } = body;
      const existingLoad = (tasks as any[]).filter((t) =>
        weekDates.includes(t.date),
      );
      const result = await aiGenerate(
        "negotiate",
        `${BASE_SYSTEM}\nReturn JSON matching schema: { canFit, message, options: [{ type, description, impact }] }`,
        `Request: ${request}\nAvailable hours: ${availableHours}\nExisting load: ${JSON.stringify(existingLoad.slice(0, 10))}`,
        apiKey,
        NegotiateSchema,
        () => heuristicNegotiation(request, availableHours, existingLoad),
      );
      return json(result);
    }

    // ===== CHAT =====
    if (action === "chat") {
      const { message, tasks, todayDate } = body;
      const result = await aiGenerate(
        "chat",
        `${BASE_SYSTEM}\nYou are a helpful AI Chief of Staff. Respond naturally and conversationally. If the user asks to add/modify tasks, suggest specific actions.`,
        `User message: ${message}\nCurrent tasks: ${JSON.stringify(tasks)}\nToday: ${todayDate}`,
        apiKey,
        z.object({ response: z.coerce.string() }),
        () => ({
          response: "I understand. How can I help you with your tasks today? You can ask me to plan your week, break down goals, or give you advice.",
        }),
      );
      return json(result);
    }

    return json({ error: `Unknown action: ${action}` }, 400);
  } catch (err) {
    console.error("ai-chief: unhandled error:", err);
    return json(
      {
        error: err instanceof Error ? err.message : String(err),
        stage: "unknown",
      },
      500,
    );
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
