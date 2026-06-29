// AI Chief of Staff — agentic planning endpoint.
// Actions: briefing | breakdown | schedule | reschedule | reflect | explain
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { generateObject } from "npm:ai@5.0.60";
import { z } from "npm:zod@3.23.8";
import { createLovableAiGatewayProvider } from "../_shared/ai-gateway.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ---------- Schemas (kept small to fit Gemini structured-output state cap) ----------
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
  bestFocusWindow: z.string().describe("Suggested deep-work time window, e.g. '10:00–12:00'"),
  topRisk: z.string().describe("The single biggest risk for today"),
  recommendation: z.string().describe("One concrete recommendation"),
  confidence: z.number().min(0).max(100).describe("Confidence score the user will finish today"),
});

const BreakdownSchema = z.object({
  summary: z.string().describe("One-line description of the goal"),
  estimatedHours: z.number(),
  subtasks: z.array(z.object({
    title: z.string(),
    estimatedMinutes: z.number(),
    priority: z.enum(["low", "medium", "high"]),
    mood: z.enum(["high-strain", "reflective", "routine", "energizing"]).optional(),
    timeBlock: z.enum(["morning", "afternoon", "evening"]).optional(),
    dayOffset: z.number().min(0).max(6).describe("Days from today to schedule"),
  })).min(2).max(10),
});

const ScheduleSchema = z.object({
  rationale: z.string(),
  assignments: z.array(z.object({
    title: z.string(),
    dayOffset: z.number().min(0).max(6),
    priority: z.enum(["low", "medium", "high"]),
    mood: z.enum(["high-strain", "reflective", "routine", "energizing"]).optional(),
    timeBlock: z.enum(["morning", "afternoon", "evening"]).optional(),
  })).min(1).max(20),
});

const RescheduleSchema = z.object({
  moves: z.array(z.object({
    taskId: z.string(),
    newDate: z.string().describe("YYYY-MM-DD"),
    reason: z.string(),
  })),
});

const ReflectionSchema = z.object({
  summary: z.string(),
  insight: z.string(),
  focusTrend: z.enum(["up", "flat", "down"]),
});

// ---------- Handler ----------
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return json({ error: "LOVABLE_API_KEY not configured" }, 500);
    }
    const body = await req.json();
    const action = body.action as string;
    const gateway = createLovableAiGatewayProvider(apiKey);
    const fast = gateway("google/gemini-2.5-flash");
    const pro = gateway("google/gemini-2.5-pro");

    if (action === "briefing") {
      const { tasks, todayDate, mode } = body;
      const todayTasks = (tasks as any[]).filter(t => t.date === todayDate);
      const { object } = await generateObject({
        model: fast,
        schema: BriefingSchema,
        system: "You are an AI Chief of Staff. Give a warm, concise morning briefing. Be specific about workload (hours), best deep-work window, and the #1 risk. Tone: calm, confident, encouraging.",
        prompt: `Today is ${todayDate}. Lighting mode: ${mode}. Today's tasks:\n${JSON.stringify(todayTasks, null, 2)}\n\nAll tasks this week:\n${JSON.stringify((tasks as any[]).slice(0, 40), null, 2)}`,
      });
      return json(object);
    }

    if (action === "breakdown") {
      const { goal, todayDate, weekDates } = body;
      const { object } = await generateObject({
        model: fast,
        schema: BreakdownSchema,
        system: "You are an AI Chief of Staff. Break the user's goal into 3-7 concrete, actionable subtasks with time estimates. Assign each to a day (dayOffset 0=today). Distribute work realistically — don't overload a single day. Prefer high-strain work in morning blocks.",
        prompt: `Goal: ${goal}\nToday: ${todayDate}\nWeek: ${weekDates.join(", ")}`,
      });
      return json(object);
    }

    if (action === "schedule") {
      const { goals, existingTasks, todayDate, weekDates } = body;
      const { object } = await generateObject({
        model: pro,
        schema: ScheduleSchema,
        system: "You are an AI Chief of Staff. Distribute the user's goals across the week intelligently. Respect existing tasks. Put deep-focus work in the morning. Spread strain so no day is overloaded. Give a one-paragraph rationale.",
        prompt: `Today: ${todayDate}\nWeek days (offset 0..6): ${weekDates.join(", ")}\n\nGoals to schedule:\n${goals}\n\nExisting tasks (already scheduled, do not duplicate):\n${JSON.stringify(existingTasks, null, 2)}`,
      });
      return json(object);
    }

    if (action === "reschedule") {
      const { missedTasks, weekDates, existingTasks } = body;
      const { object } = await generateObject({
        model: fast,
        schema: RescheduleSchema,
        system: "You are an AI Chief of Staff. The user missed these tasks. Move each to the soonest viable day this week, balancing load. Provide a 1-sentence reason per move.",
        prompt: `Missed:\n${JSON.stringify(missedTasks, null, 2)}\nWeek dates: ${weekDates.join(", ")}\nExisting load:\n${JSON.stringify(existingTasks, null, 2)}`,
      });
      return json(object);
    }

    if (action === "reflect") {
      const { tasks, todayDate } = body;
      const todayTasks = (tasks as any[]).filter(t => t.date === todayDate);
      const { object } = await generateObject({
        model: fast,
        schema: ReflectionSchema,
        system: "You are an AI Chief of Staff. Reflect on the user's day in 2-3 sentences. Be warm and specific. Surface one pattern as 'insight'.",
        prompt: `Date: ${todayDate}\nToday's tasks:\n${JSON.stringify(todayTasks, null, 2)}`,
      });
      return json(object);
    }

    return json({ error: `Unknown action: ${action}` }, 400);
  } catch (err) {
    console.error("ai-chief error", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    const isRate = msg.includes("429");
    const isCredit = msg.includes("402");
    return json({
      error: msg,
      kind: isRate ? "rate_limit" : isCredit ? "credit_exhausted" : "error",
    }, isRate ? 429 : isCredit ? 402 : 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
