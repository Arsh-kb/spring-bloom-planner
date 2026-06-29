# Plan: Transform Planner → AI Chief of Staff

Reframe the app around a proactive Gemini-powered agent that manages the user's week, not a passive todo list. This plan targets the hackathon evaluation matrix (60% = Impact + Agentic + Innovation) while leaning on Google tech (Gemini via Lovable AI Gateway).

## Architecture shift

Add a **Lovable Cloud** backend (required for server-side Gemini calls — Lovable AI Gateway key must stay server-side). All AI calls go through edge functions using `google/gemini-2.5-flash` (fast agentic) and `google/gemini-2.5-pro` (deep reasoning for weekly planning).

```
[Client] ── invoke ──> [Edge Functions] ── Lovable AI Gateway ──> Gemini 2.5
   │                          │
   │                          └── streams structured JSON back
   └── renders agent actions, explanations, reorganized week
```

## Build order

### Tier S — Ship first (the core "Chief of Staff" loop)

1. **Enable Lovable Cloud** (one-click; required for Gemini).
2. **Edge function: `ai-chief`** — single agentic endpoint that accepts `{ action, context }` and dispatches:
   - `breakdown` — break a goal into subtasks with estimates
   - `prioritize` — score every task (deadline, difficulty, importance, energy, duration)
   - `schedule` — distribute tasks across the week intelligently
   - `reschedule` — when a task is skipped/missed, silently move it
   - `briefing` — morning briefing (workload, best focus window, top risk)
   - `reflect` — end-of-day reflection
   - `explain` — natural-language reason for any AI decision
   All actions stream structured JSON via `streamText` + `Output.object` (Zod schemas).

3. **`ChiefOfStaff` panel** (replaces the existing AI Planner popup, keeps the 🪄 entry point):
   - **Morning Briefing card** — auto-runs on first open of the day. "Good morning. Today's workload: 6.5h. Best deep work: 10–12. Top risk: DSA assignment due Fri."
   - **Conversational composer** — "Build Lumira landing page" → breakdown → preview tasks → one-tap accept (writes into PlannerContext).
   - **Re-org banner** — when AI silently reschedules, a dismissible banner explains why ("Moved React to Wed because Tue exceeds your focus capacity by 2h").

4. **Smart Priority score** on every Task — replace `low/medium/high` UI with a 0–100 score + colored ring. Score computed by Gemini; falls back to local heuristic offline.

5. **Auto-scheduler** — "Plan my week" CTA. User dumps goals; Gemini returns a 7-day distribution honoring existing tasks, energy curve, and recurrence. Renders as a diff preview before applying.

6. **Silent rescheduling** — when a task rolls over uncompleted past midnight, `ai-chief` reschedules it to the next viable slot and surfaces a small "AI moved 2 tasks →" toast with an Undo.

### Tier A — Differentiators (build immediately after S works)

7. **Deadline risk prediction** — per task: estimated hours vs. remaining capacity → low/med/high risk badge with Gemini's reasoning on hover.
8. **End-of-day reflection** — auto-prompt at 9pm: completed, postponed, focus trend, one insight ("you work best after journaling"). Writes to journal.
9. **Energy-aware scheduling** — feed last 14 days of completion timestamps into the scheduler so high-strain work lands in the user's proven peak window.
10. **Weekly AI Coach** — Sunday: achievements, pattern, one suggestion. Uses `gemini-2.5-pro`.
11. **AI explains everything** — every AI mutation (move, priority change, breakdown) stores a `reason` string shown in a popover.

### Tier A+ — WOW (polish layer, leverages existing aesthetic)

12. **Living forest evolution** — extend the existing season/weather engine: completed tasks bloom flowers (already partial), missed deadlines drop leaves, streaks summon butterflies/fireflies. Hook into `useSeasonalEngine`.
13. **Live Day Timeline** — vertical timeline overlay: current time glows, next task pulses, completed fade. New `LiveTimeline.tsx` component pinned to today's column.
14. **Cinematic focus mode** — extend existing `DeepFocusMode`: dim everything, narrow vignette, ambient sound swells, birds quiet. Mostly CSS + existing audio hook.
15. **Confidence meter** — header pill: "Confidence 87% · Momentum ↑". Computed from priority scores + completion velocity.
16. **One-click recovery** — when weekly risk crosses threshold, show a "Rebuild this week" button → Gemini wipes incomplete schedule, rebuilds around top priorities.

### Tier B — Optional Google integrations (only if time permits)

17. Google Calendar read-only sync via standard connector (`google_calendar`) — pulls events as immovable blocks the scheduler respects.
18. Voice planning — Web Speech API → text → `ai-chief` breakdown.

(Gmail, Drive, Maps, Weather deferred — they add scope without proportional judge impact for an MVP.)

## Technical details

- **Stack additions**: Lovable Cloud (Supabase), edge function `supabase/functions/ai-chief/index.ts`, AI SDK (`ai`, `@ai-sdk/openai-compatible`, `zod`).
- **Provider helper**: `supabase/functions/_shared/ai-gateway.ts` per `ai-sdk-lovable-gateway` knowledge.
- **State**: New `AgentContext` wraps `PlannerContext`, exposes `briefing`, `proposals`, `applyProposal`, `explain`. Persists agent decisions in localStorage (`agent.history`) for the reflection/coach features.
- **Schemas (Zod)**: `TaskBreakdown`, `PriorityScore`, `WeekSchedule`, `Briefing`, `Reflection`, `RescheduleProposal` — each small to stay under Gemini's structured-output state limit.
- **Model routing**: `gemini-2.5-flash` for breakdown/prioritize/reschedule/explain (low latency). `gemini-2.5-pro` for full-week schedule and Sunday coach.
- **UI**: New `src/components/agent/` directory — `ChiefPanel.tsx`, `BriefingCard.tsx`, `ProposalDiff.tsx`, `ExplainPopover.tsx`, `ConfidenceMeter.tsx`, `LiveTimeline.tsx`. Reuses existing shadcn primitives, frosted-glass tokens, and nature aesthetic (per project memory — no flat dashboards).
- **Error handling**: 429 → toast "AI busy, retrying", 402 → toast "AI credits exhausted, add credits in workspace settings".
- **Non-goals for this iteration**: real OS app blocking, multi-user, mobile native, payments.

## Acceptance for this iteration

A user can:
1. Open app → see a Gemini-generated morning briefing in the existing aesthetic.
2. Type "Build Lumira landing page" → get a structured breakdown they can accept in one tap.
3. Click "Plan my week" → see a proposed 7-day diff → accept it.
4. Leave a task incomplete → next day it's auto-moved with an Undo + reason.
5. Hover any AI change → read Gemini's plain-English justification.
6. See a confidence meter and a living-forest reaction to their progress.

Approve to start with **Step 1 (enable Cloud) + Step 2 (edge function scaffold) + Step 3 (Chief panel with briefing & breakdown)** as the first shippable slice. The remaining tiers ship in follow-up turns so each slice stays reviewable.
