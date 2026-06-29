/* eslint-disable @typescript-eslint/no-explicit-any */
// AI Chief of Staff — agentic planning endpoint.
// Actions: briefing | breakdown | schedule | reschedule | reflect | confidence | risk | recovery | mission_report | negotiate

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { generateObject } from "npm:ai@4.0.0";
import { z } from "npm:zod@3.23.8";
import { createGoogleGenerativeAI } from "npm:@ai-sdk/google@1.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ---------- Schemas ----------
const TaskInput = z.object({
  id: z.string(),
  title: z.string(),
  date: z.string(),
  completed: z.boolean(),
  priority: z.string().optional(),
  mood: z.string().optional(),
  timeBlock: z.string().optional(),
});

const BriefingSchema = z.object({
  greeting: z.string().describe("One short personal greeting line"),
  workloadHours: z.number().describe("Estimated total hours of work today"),
  bestFocusWindow: z
    .string()
    .describe("Suggested deep-work time window, e.g. '10:00–12:00'"),
  topRisk: z.string().describe("The single biggest risk for today"),
  recommendation: z.string().describe("One concrete recommendation"),
  confidence: z
    .number()
    .min(0)
    .max(100)
    .describe("Confidence score the user will finish today"),
});

const BreakdownSchema = z.object({
  summary: z.string().describe("One-line description of the goal"),
  estimatedHours: z.number(),
  subtasks: z
    .array(
      z.object({
        title: z.string(),
        estimatedMinutes: z.number(),
        priority: z.enum(["low", "medium", "high"]),
        mood: z
          .enum(["high-strain", "reflective", "routine", "energizing"])
          .optional(),
        timeBlock: z.enum(["morning", "afternoon", "evening"]).optional(),
        dayOffset: z
          .number()
          .min(0)
          .max(6)
          .describe("Days from today to schedule"),
      }),
    )
    .min(2)
    .max(10),
});

const ScheduleSchema = z.object({
  rationale: z.string(),
  assignments: z
    .array(
      z.object({
        title: z.string(),
        dayOffset: z.number().min(0).max(6),
        priority: z.enum(["low", "medium", "high"]),
        mood: z
          .enum(["high-strain", "reflective", "routine", "energizing"])
          .optional(),
        timeBlock: z.enum(["morning", "afternoon", "evening"]).optional(),
      }),
    )
    .min(1)
    .max(20),
});

const RescheduleSchema = z.object({
  moves: z.array(
    z.object({
      taskId: z.string(),
      newDate: z.string().describe("YYYY-MM-DD"),
      reason: z.string(),
    }),
  ),
});

const ReflectionSchema = z.object({
  summary: z.string(),
  insight: z.string(),
  focusTrend: z.enum(["up", "flat", "down"]),
});

const ConfidenceSchema = z.object({
  overall: z.number().min(0).max(100),
  momentum: z.enum(["up", "flat", "down"]),
  completedToday: z.number(),
  totalToday: z.number(),
  overdueCount: z.number(),
  riskTasks: z.number(),
  reasoning: z.string(),
});

const RiskSchema = z.object({
  risk: z.enum(["low", "medium", "high"]),
  probability: z.number().min(0).max(100),
  blockers: z.array(z.string()),
  suggestion: z.string(),
});

const RecoverySchema = z.object({
  summary: z.string(),
  changes: z.array(
    z.object({
      type: z.enum(["move", "remove", "reschedule"]),
      taskId: z.string(),
      fromDate: z.string(),
      toDate: z.string().optional(),
      reason: z.string(),
    }),
  ),
  newConfidence: z.number(),
  oldConfidence: z.number(),
});

const MissionReportSchema = z.object({
  completionProbability: z.number(),
  deepWorkHours: z.number(),
  recoveryTime: z.number(),
  highRiskTasks: z.number(),
  protectedFocusBlocks: z.number(),
  schedulingStrategy: z.string(),
});

const NegotiationSchema = z.object({
  canFit: z.boolean(),
  message: z.string(),
  options: z.array(
    z.object({
      type: z.enum(["delay", "reduce_scope", "weekend", "longer_days"]),
      description: z.string(),
      impact: z.string(),
    }),
  ),
});

// ---------- Handler ----------
Deno.serve(async (req) => {
  // Log every single invocation immediately, before anything else runs.
  // If a crash happens before any other log line appears, this confirms
  // the function is at least booting and receiving the request.
  console.log("ai-chief: invoked —", req.method, req.url);

  // Bulletproof CORS Preflight Handling
  if (req.method === "OPTIONS") {
    console.log("ai-chief: OPTIONS preflight — returning ok");
    return new Response("ok", {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Check for GOOGLE_API_KEY (required by @ai-sdk/google)
    // Can also use GEMINI_API_KEY as fallback
    const apiKey =
      Deno.env.get("GOOGLE_API_KEY") || Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      console.error(
        "ai-chief: No API key found. Checked GOOGLE_API_KEY and GEMINI_API_KEY",
      );
      return json(
        {
          error:
            "API key not configured. Set GOOGLE_API_KEY or GEMINI_API_KEY in Supabase secrets.",
          stage: "Environment",
        },
        500,
      );
    }
    console.log("ai-chief: API key is set (length:", apiKey.length, ")");

    let body: any;
    try {
      body = await req.json();
    } catch (parseErr) {
      console.error("ai-chief: failed to parse request body:", parseErr);
      return json(
        { error: "Invalid JSON request body", stage: "parse_body" },
        400,
      );
    }

    const action = body.action as string;
    console.log("ai-chief: received action:", action);

    // Initialize the Google provider with the key passed explicitly.
    // IMPORTANT: do NOT use Deno.env.set() here — Supabase's production
    // Edge Runtime does not support mutating Deno.env at runtime and will
    // throw `NotSupported: The operation is not supported`, which crashes
    // the whole request before any action-specific code runs. Passing the
    // key directly into createGoogleGenerativeAI avoids that entirely.
    let googleAI;
    try {
      googleAI = createGoogleGenerativeAI({ apiKey });
      console.log("ai-chief: Google provider created");
    } catch (initErr) {
      console.error("ai-chief: failed to create Google provider:", initErr);
      return json(
        {
          error: initErr instanceof Error ? initErr.message : String(initErr),
          stage: "provider_init",
        },
        500,
      );
    }

    // gemini-1.5-* models are fully retired (return 404). Use the current
    // stable 2.5 generation instead.
    const fastModel = googleAI("gemini-2.5-flash");
    const proModel = googleAI("gemini-2.5-pro");
    console.log("ai-chief: models initialized (fast=gemini-2.5-flash, pro=gemini-2.5-pro)");

    if (action === "briefing") {
      console.log("ai-chief: processing briefing action");
      const { tasks, todayDate, mode } = body;
      const todayTasks = (tasks as any[]).filter((t) => t.date === todayDate);
      console.log("ai-chief: briefing - todayTasks count:", todayTasks.length);

      try {
        const { object } = await generateObject({
          model: fastModel,
          schema: BriefingSchema,
          system:
            "You are an AI Chief of Staff. Give a warm, concise morning briefing. Be specific about workload (hours), best deep-work window, and the #1 risk. Tone: calm, confident, encouraging.",
          prompt: `Today is ${todayDate}. Lighting mode: ${mode}. Today's tasks:\n${JSON.stringify(todayTasks, null, 2)}\n\nAll tasks this week:\n${JSON.stringify((tasks as any[]).slice(0, 40), null, 2)}`,
        });
        console.log("ai-chief: briefing - success");
        return json(object);
      } catch (err) {
        console.error("ai-chief: briefing failed:", err);
        return json({ error: String(err), stage: "briefing" }, 500);
      }
    }

    if (action === "breakdown") {
      console.log("ai-chief: processing breakdown action");
      const { goal, todayDate, weekDates } = body;
      try {
        const { object } = await generateObject({
          model: fastModel,
          schema: BreakdownSchema,
          system:
            "You are an AI Chief of Staff. Break the user's goal into 3-7 concrete, actionable subtasks with time estimates. Assign each to a day (dayOffset 0=today). Distribute work realistically — don't overload a single day. Prefer high-strain work in morning blocks.",
          prompt: `Goal: ${goal}\nToday: ${todayDate}\nWeek: ${weekDates.join(", ")}`,
        });
        console.log("ai-chief: breakdown - success");
        return json(object);
      } catch (err) {
        console.error("ai-chief: breakdown failed:", err);
        return json({ error: String(err), stage: "breakdown" }, 500);
      }
    }

    if (action === "schedule") {
      console.log("ai-chief: processing schedule action");
      const { goals, existingTasks, todayDate, weekDates } = body;
      try {
        const { object } = await generateObject({
          model: proModel,
          schema: ScheduleSchema,
          system:
            "You are an AI Chief of Staff. Distribute the user's goals across the week intelligently. Respect existing tasks. Put deep-focus work in the morning. Spread strain so no day is overloaded. Give a one-paragraph rationale.",
          prompt: `Today: ${todayDate}\nWeek days (offset 0..6): ${weekDates.join(", ")}\n\nGoals to schedule:\n${goals}\n\nExisting tasks (already scheduled, do not duplicate):\n${JSON.stringify(existingTasks, null, 2)}`,
        });
        console.log("ai-chief: schedule - success");
        return json(object);
      } catch (err) {
        console.error("ai-chief: schedule failed:", err);
        return json({ error: String(err), stage: "schedule" }, 500);
      }
    }

    if (action === "reschedule") {
      console.log("ai-chief: processing reschedule action");
      const { missedTasks, weekDates, existingTasks } = body;
      try {
        const { object } = await generateObject({
          model: fastModel,
          schema: RescheduleSchema,
          system:
            "You are an AI Chief of Staff. The user missed these tasks. Move each to the soonest viable day this week, balancing load. Provide a 1-sentence reason per move.",
          prompt: `Missed:\n${JSON.stringify(missedTasks, null, 2)}\nWeek dates: ${weekDates.join(", ")}\nExisting load:\n${JSON.stringify(existingTasks, null, 2)}`,
        });
        console.log("ai-chief: reschedule - success");
        return json(object);
      } catch (err) {
        console.error("ai-chief: reschedule failed:", err);
        return json({ error: String(err), stage: "reschedule" }, 500);
      }
    }

    if (action === "reflect") {
      console.log("ai-chief: processing reflect action");
      const { tasks, todayDate } = body;
      const todayTasks = (tasks as any[]).filter((t) => t.date === todayDate);
      try {
        const { object } = await generateObject({
          model: fastModel,
          schema: ReflectionSchema,
          system:
            "You are an AI Chief of Staff. Reflect on the user's day in 2-3 sentences. Be warm and specific. Surface one pattern as 'insight'.",
          prompt: `Date: ${todayDate}\nToday's tasks:\n${JSON.stringify(todayTasks, null, 2)}`,
        });
        console.log("ai-chief: reflect - success");
        return json(object);
      } catch (err) {
        console.error("ai-chief: reflect failed:", err);
        return json({ error: String(err), stage: "reflect" }, 500);
      }
    }

    if (action === "confidence") {
      console.log("ai-chief: processing confidence action");
      const { tasks, todayDate, weekDates, focusSessions } = body;
      const todayTasks = (tasks as any[]).filter((t) => t.date === todayDate);
      const completedToday = todayTasks.filter((t) => t.completed).length;
      const totalToday = todayTasks.length;
      const overdueTasks = (tasks as any[]).filter(
        (t) => !t.completed && t.date < todayDate,
      );
      const highPriorityTasks = (tasks as any[]).filter(
        (t) =>
          t.priority === "high" && !t.completed && weekDates.includes(t.date),
      );
      try {
        const { object } = await generateObject({
          model: fastModel,
          schema: ConfidenceSchema,
          system:
            "You are an AI Confidence Engine. Compute the user's overall confidence score based on completed tasks, remaining workload, overdue items, and upcoming deadlines. Be precise.",
          prompt: `Today: ${todayDate}\nCompleted today: ${completedToday}/${totalToday}\nOverdue tasks: ${overdueTasks.length}\nHigh priority remaining: ${highPriorityTasks.length}\nFocus sessions today: ${(focusSessions || []).length}\nAll week tasks:\n${JSON.stringify((tasks as any[]).filter((t) => weekDates.includes(t.date)).slice(0, 30), null, 2)}`,
        });
        console.log("ai-chief: confidence - success");
        return json(object);
      } catch (err) {
        console.error("ai-chief: confidence failed:", err);
        return json({ error: String(err), stage: "confidence" }, 500);
      }
    }

    if (action === "risk") {
      console.log("ai-chief: processing risk action");
      const { task, tasks, todayDate, weekDates } = body;
      const taskObj = task as any;
      const taskDate = taskObj.date;
      const daysUntilDue = Math.max(
        0,
        Math.ceil(
          (new Date(taskDate).getTime() - new Date(todayDate).getTime()) /
            86400000,
        ),
      );
      const remainingTasks = (tasks as any[]).filter(
        (t) => t.date === taskDate && !t.completed && t.id !== taskObj.id,
      );
      const estimatedHours = taskObj.estimatedMinutes
        ? taskObj.estimatedMinutes / 60
        : 1;
      try {
        const { object } = await generateObject({
          model: fastModel,
          schema: RiskSchema,
          system:
            "You are a Risk Engine. Analyze the probability of completing a task on time. Consider deadline proximity, workload, dependencies, and priority.",
          prompt: `Task: ${taskObj.title}\nPriority: ${taskObj.priority}\nDue: ${taskDate} (${daysUntilDue} days away)\nEstimated hours: ${estimatedHours}\nCompeting tasks that day: ${remainingTasks.length}\nOther tasks on this day:\n${JSON.stringify(remainingTasks.slice(0, 5), null, 2)}`,
        });
        console.log("ai-chief: risk - success");
        return json(object);
      } catch (err) {
        console.error("ai-chief: risk failed:", err);
        return json({ error: String(err), stage: "risk" }, 500);
      }
    }

    if (action === "recovery") {
      console.log("ai-chief: processing recovery action");
      const { tasks, todayDate, weekDates, focusSessions } = body;
      const overdueTasks = (tasks as any[]).filter(
        (t) => !t.completed && t.date < todayDate,
      );
      const remainingWeek = (tasks as any[]).filter(
        (t) => !t.completed && weekDates.includes(t.date),
      );
      try {
        const { object } = await generateObject({
          model: proModel,
          schema: RecoverySchema,
          system:
            "You are an AI Recovery Engine. The user's planner is overloaded or unrealistic. Generate a recovery plan that removes impossible allocations, preserves important deadlines, reschedules intelligently, and protects breaks. Be specific about what changes and why.",
          prompt: `Today: ${todayDate}\nOverdue: ${overdueTasks.length}\nRemaining this week: ${remainingWeek.length}\nOverdue tasks:\n${JSON.stringify(overdueTasks, null, 2)}\nRemaining week:\n${JSON.stringify(remainingWeek.slice(0, 20), null, 2)}`,
        });
        console.log("ai-chief: recovery - success");
        return json(object);
      } catch (err) {
        console.error("ai-chief: recovery failed:", err);
        return json({ error: String(err), stage: "recovery" }, 500);
      }
    }

    if (action === "mission_report") {
      console.log("ai-chief: processing mission_report action");
      const { tasks, todayDate, weekDates, focusSessions } = body;
      const weekTasks = (tasks as any[]).filter((t) =>
        weekDates.includes(t.date),
      );
      const completed = weekTasks.filter((t) => t.completed).length;
      const total = weekTasks.length;
      const deepWorkTasks = weekTasks.filter(
        (t) => t.timeBlock === "morning" || t.timeBlock === "afternoon",
      );
      const highPriority = weekTasks.filter(
        (t) => t.priority === "high" && !t.completed,
      );
      try {
        const { object } = await generateObject({
          model: fastModel,
          schema: MissionReportSchema,
          system:
            "You are an AI Chief of Staff. Generate a mission report after schedule generation. Explain the strategy behind the week's arrangement.",
          prompt: `Week: ${weekDates.join(", ")}\nCompleted: ${completed}/${total}\nDeep work blocks: ${deepWorkTasks.length}\nHigh priority remaining: ${highPriority.length}\nFocus sessions: ${(focusSessions || []).length}`,
        });
        console.log("ai-chief: mission_report - success");
        return json(object);
      } catch (err) {
        console.error("ai-chief: mission_report failed:", err);
        return json({ error: String(err), stage: "mission_report" }, 500);
      }
    }

    if (action === "negotiate") {
      console.log("ai-chief: processing negotiate action");
      const { request, availableHours, tasks, todayDate, weekDates } = body;
      const existingLoad = (tasks as any[]).filter((t) =>
        weekDates.includes(t.date),
      );
      try {
        const { object } = await generateObject({
          model: fastModel,
          schema: NegotiationSchema,
          system:
            "You are an AI Negotiation Engine. If the user's request is impossible within available time, say so clearly and offer concrete alternatives. Never generate impossible schedules.",
          prompt: `User request: ${request}\nAvailable hours this week: ${availableHours}\nExisting tasks: ${existingLoad.length}\nExisting load (hours): ${JSON.stringify(existingLoad.slice(0, 10), null, 2)}`,
        });
        console.log("ai-chief: negotiate - success");
        return json(object);
      } catch (err) {
        console.error("ai-chief: negotiate failed:", err);
        return json({ error: String(err), stage: "negotiate" }, 500);
      }
    }

    console.log("ai-chief: unknown action:", action);
    return json({ error: `Unknown action: ${action}` }, 400);
  } catch (err) {
    console.error("ai-chief: unhandled top-level error:", err);
    const msg = err instanceof Error ? err.message : String(err);
    const isRate = msg.includes("429");
    return json(
      {
        error: msg,
        kind: isRate ? "rate_limit" : "error",
        stage: "unknown",
      },
      isRate ? 429 : 500,
    );
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}