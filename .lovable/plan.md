

# Plan: Confetti Animation + Mock AI Task Planner

## 1. Sparkle/Confetti Micro-Animation on Day Completion

When all tasks on a DayCard are completed, show a brief sparkle burst animation.

**Approach**: Create a `CompletionSparkle` component that renders animated particles using CSS keyframes. In `DayCard.tsx`, detect when `completedCount === day.tasks.length && day.tasks.length > 0` and trigger the animation.

**Files**:
- **New**: `src/components/CompletionSparkle.tsx` -- renders 8-12 small sparkle dots that burst outward from the card center, fade out over ~1s using CSS `@keyframes`
- **Edit**: `src/DayCard.tsx` -- add state to track `allComplete`, render `<CompletionSparkle />` overlay when triggered, auto-dismiss after 1.5s
- **Edit**: `src/index.css` -- add `@keyframes sparkle-burst` animation (scale up + fade out + random translate)

## 2. Mock AI Task Planner (No Backend)

A local "AI Planner" that generates task suggestions based on the current mode, existing tasks, day of week, and time blocks -- using pattern matching and curated suggestion pools. Users type a goal/prompt, and the system returns structured task suggestions they can accept into day cards.

**Approach**: Build a suggestion engine with categorized task pools. The user opens an "AI Planner" panel, types a goal (e.g., "productive Monday"), and gets 3-5 task suggestions with priority/mood/timeBlock pre-filled. They can accept individual suggestions or all at once.

**Files**:
- **New**: `src/lib/aiPlanner.ts` -- suggestion engine with:
  - Curated pools of ~50 tasks across categories (deep work, wellness, admin, creative, study, social)
  - Matching logic: parses user prompt for keywords, considers current `LightingMode`, day of week, existing tasks (to avoid duplicates)
  - Returns `Array<{ title, priority, mood, timeBlock, dayIndex }>` suggestions
- **New**: `src/components/AIPlannerPanel.tsx` -- slide-in panel UI with:
  - Text input for goal/prompt
  - Generated suggestion cards with accept/reject per suggestion
  - "Accept All" button
  - Suggestions show preview of priority emoji, mood dot, time block
  - On accept, calls `addTask()` for selected day
- **Edit**: `src/components/PlannerHeader.tsx` -- add "AI Planner" button (🤖) to both mobile menu and desktop nav, opens the panel
- **Edit**: `src/pages/Index.tsx` -- render `<AIPlannerPanel />` 

## Technical Details

**Sparkle animation CSS**:
```text
@keyframes sparkle-burst {
  0%   { transform: translate(0,0) scale(1); opacity: 1 }
  100% { transform: translate(var(--dx), var(--dy)) scale(0); opacity: 0 }
}
```
Each particle gets random `--dx`/`--dy` CSS variables for spread direction.

**AI suggestion engine logic**:
1. Parse prompt keywords (e.g., "focus" -> deep work pool, "relax" -> wellness pool)
2. Filter by current lighting mode (cave -> more high-strain tasks, sun -> balanced)
3. Exclude tasks whose titles overlap with existing tasks on target day
4. Assign time blocks based on task category (deep work -> morning, wellness -> evening)
5. Return 3-5 suggestions with confidence-based priority

**Implementation order**:
1. Sparkle animation component + CSS
2. Integrate sparkle into DayCard
3. Build AI suggestion engine
4. Build AI Planner panel UI
5. Wire into header navigation

