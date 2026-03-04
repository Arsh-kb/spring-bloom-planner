# Springscape: Living Environment and Deep Interactivity Update

This plan introduces nine interconnected features that deepen the planner's realism. Every addition follows the existing skeuomorphic philosophy -- no flat UI, no decorative flourishes, only elements that behave like natural phenomena.

---

## 1. Seasonal Engine

**What it does**: Analyzes the completed-task ratio over the past 4 weeks and gradually shifts the environment's color grading to reflect productivity seasons.

**How it works**:

- New hook `useSeasonalEngine` reads all tasks from localStorage, computes a rolling completion percentage, and maps it to one of four seasonal profiles: Spring (high momentum), Summer (sustained peak), Autumn (tapering), Winter (low activity).
- Each profile defines CSS custom properties: `--season-hue-shift`, `--season-saturation`, `--season-warmth`, `--season-grain` (a subtle noise overlay opacity).
- These variables are applied to `Environment.tsx` as inline style overrides that compose with the existing `--atmosphere-filter`.
- Transitions between seasons happen over `3s ease-in-out` so the shift feels gradual.
- A tiny seasonal indicator appears in the header (e.g., "Early Spring") using quiet, serif text.

**Files touched**: New `src/hooks/useSeasonalEngine.ts`, edits to `PlannerContext.tsx` (expose season), `Environment.tsx` (apply season vars), `PlannerHeader.tsx` (label), `index.css` (season token defaults).

---

## 2. Ambient Weather Layer

**What it does**: Adds slow, barely-perceptible environmental particles -- drifting fog wisps, airborne dust motes in sunlight, soft rain grain, or morning mist.

**How it works**:

- New component `src/components/WeatherLayer.tsx` renders a fixed overlay at `z-5` (between environment and UI).
- Uses pure CSS animations on small, semi-transparent `div` elements (no canvas needed for this subtlety level).
- Weather type is derived from the current lighting mode and seasonal profile:
  - Sun + Spring/Summer: slow dust motes drifting diagonally, tiny white/gold dots with long animation durations (15-25s).
  - Shade: faint horizontal fog bands that drift using `translateX` keyframes.
  - Cave: existing fireflies are sufficient; adds very faint fog at the bottom.
  - Exam: soft rain grain using a repeating CSS noise texture with gentle vertical drift.
- Particle count kept very low (8-15 elements) with `will-change: transform` and `pointer-events: none`.

**Files touched**: New `src/components/WeatherLayer.tsx`, edits to `Index.tsx` (mount it), `tailwind.config.ts` (new keyframes: `drift-mote`, `drift-fog`, `rain-grain`), `index.css` (particle base styles).

---

## 3. Weekly Narrative Titles

**What it does**: Each week receives a quiet, understated title derived from task completion patterns and journal mood distribution.

**How it works**:

- New utility `src/lib/narrativeEngine.ts` with a pure function `generateWeekTitle(tasks, journalEntries)`.
- Analyzes: completion ratio, dominant mood tags, ratio of high-priority tasks, whether tasks aged significantly.
- Selects from a curated bank of ~40 nature-journal-style titles organized by tone: e.g., "A Week of Steady Rain", "Quiet Growth Beneath the Surface", "Morning Fog, Afternoon Clearing", "The First Green Shoots".
- Title selection is deterministic (based on data hash) so it stays stable for a given week's data.
- Displayed in the header below the week navigation, in small italic serif text with low opacity.

**Files touched**: New `src/lib/narrativeEngine.ts`, edits to `PlannerHeader.tsx` (display title).

---

## 4. Expanded Nature Guest System

**What it does**: Extends the existing `NatureGuest` to include additional rare natural events -- drifting leaves, a bird silhouette crossing the sky, shifting light through branches.

**How it works**:

- Refactor `NatureGuest.tsx` into a system that randomly selects from multiple event types:
  - `sparrow` (existing): Bottom-right video appearance.
  - `drifting-leaves`: 3-4 small leaf-shaped divs (using `day-leaf.jpg` clipped to leaf shape via `clip-path`) that slowly fall diagonally across the screen over 8-12s.
  - `bird-silhouette`: A small dark shape that moves across the top 20% of the screen horizontally over 6s using CSS `translateX`.
  - `light-shift`: A brief, subtle brightening of the radial gradient in `Environment.tsx` overlay, as if a cloud moved away from the sun. Lasts 4-5s.
- Event frequency: one event every 40-90 seconds (randomized). Each type has a weighted probability (sparrow 30%, leaves 30%, silhouette 20%, light-shift 20%).
- All elements are `pointer-events: none` and rendered at `z-30`.

**Files touched**: Refactor `src/components/NatureGuest.tsx`, new keyframes in `tailwind.config.ts` (`leaf-fall`, `bird-cross`, `light-pulse`).

---

## 5. Task Aging (Visual Patina)

**What it does**: Tasks that have existed for multiple days develop subtle visual aging -- slight yellowing, softened text, faint paper-wear texture.

**How it works**:

- In `SortableTask.tsx`, compute the age of each task: `daysSinceCreated = Math.floor((Date.now() - new Date(task.created_at).getTime()) / 86400000)`.
- Apply aging styles as inline CSS based on age thresholds:
  - 0-2 days: No change (fresh).
  - 3-5 days: Very slight sepia tint (`filter: sepia(0.05)`), text opacity drops to 0.8.
  - 6-10 days: Increased sepia (`sepia(0.1)`), subtle border-color shift to warmer hue, text slightly smaller apparent weight.
  - 11+ days: Visible yellowing (`sepia(0.15)`), faint noise texture overlay (CSS background with tiny repeating dot pattern at 2% opacity), edges soften with slightly increased border-radius.
- Same aging applied in `MasterTaskList.tsx`.
- Aging never applied to completed tasks (they already have strike-through styling).

**Files touched**: Edits to `SortableTask.tsx`, `MasterTaskList.tsx`, `index.css` (`.task-aged` utility classes).

---

## 6. Time Capsule Snapshots

**What it does**: Automatic weekly JSON snapshots stored in localStorage, with a browsable archive in the Vault modal.

**How it works**:

- In `PlannerContext.tsx`, add a `useEffect` that runs on mount: checks if a snapshot for the current week (keyed by Monday's date) already exists in `localStorage` under `springscape-capsules`. If not, saves `{ tasks, journal, createdAt }` for the previous week.
- Snapshots stored as `Record<string, { tasks, journal, createdAt }>` in a single localStorage key.
- Max 12 weeks retained (oldest pruned automatically).
- In `VaultModal.tsx`, add a "Time Capsules" section listing archived weeks with their Monday date, task count, and journal entry count.
- Each capsule row shows a quiet date label like "3 weeks ago" or "Nov 12 -- Nov 18".
- Clicking a capsule exports it as JSON (reuses existing export logic).
- Option to restore a capsule (replaces current data after confirmation).

**Files touched**: Edits to `PlannerContext.tsx` (snapshot effect), `VaultModal.tsx` (archive browser), new localStorage key `springscape-capsules`.

---

## 7. Mood Tint Adjustment

**What it does**: Users can adjust overall warmth, contrast, and atmospheric depth via sliders in the Vault, resembling film-grade color correction.

**How it works**:

- Three sliders in a new "Atmosphere" section of `VaultModal.tsx`:
  - **Warmth** (-50 to +50): Adjusts a CSS `sepia()` and `hue-rotate()` filter addition.
  - **Contrast** (-30 to +30): Adjusts CSS `contrast()` filter.
  - **Depth** (0 to 100): Controls the opacity of the atmosphere overlay.
- Values persisted in localStorage (`springscape-mood-tint`).
- Exposed via `PlannerContext` as `moodTint: { warmth, contrast, depth }`.
- Applied in `Environment.tsx` by composing these values with the existing `--atmosphere-filter` via an additional inline `filter` style.
- Slider styling: thin frosted-glass track with a small glowing dot handle. Uses the existing Radix `Slider` component with custom styling.

**Files touched**: Edits to `PlannerContext.tsx` (state + localStorage), `VaultModal.tsx` (sliders UI), `Environment.tsx` (apply tint).

---

## 8. Task Mood Markers

**What it does**: Optional mood tags on tasks -- high-strain, reflective, routine, energizing -- shown as small tonal indicators.

**How it works**:

- Extend `Task` interface with optional `mood?: 'high-strain' | 'reflective' | 'routine' | 'energizing'`.
- In `DayCard.tsx` task input, add a subtle secondary toggle (similar to the existing priority cycle) that cycles through moods: a small dot that shifts color based on mood.
  - `high-strain`: warm reddish-amber dot.
  - `reflective`: cool blue-grey dot.
  - `routine`: neutral muted dot.
  - `energizing`: soft green-gold dot.
- Dots rendered as 4px circles with a subtle inner glow, placed next to the priority indicator in `SortableTask.tsx`.
- `addTask` in context updated to accept optional mood parameter.

**Files touched**: Edits to `src/types/planner.ts`, `PlannerContext.tsx` (addTask signature), `DayCard.tsx` (mood toggle in input), `SortableTask.tsx` (mood dot display).

---

## 9. Frosted Time Blocks

**What it does**: Users can visually segment a day into morning, afternoon, and evening with translucent overlays that shift in light temperature.

**How it works**:

- Extend `Task` interface with optional `timeBlock?: 'morning' | 'afternoon' | 'evening'`.
- In `DayCard.tsx`, tasks are grouped by time block. Each block has a subtle translucent divider label:
  - **Morning**: Warm amber-tinted glass strip (`hsla(38, 60%, 70%, 0.06)`), label "Morning" in 9px serif.
  - **Afternoon**: Neutral clear glass strip (`hsla(0, 0%, 100%, 0.04)`), label "Afternoon".
  - **Evening**: Cool blue-tinted glass strip (`hsla(220, 40%, 60%, 0.06)`), label "Evening".
- Tasks without a time block appear in an unlabeled section at the top.
- Time block is set via a small sun-position icon cycle in the task input row (alongside priority and mood toggles): a tiny circle that moves from left (morning) to center (afternoon) to right (evening).
- `addTask` updated to accept optional `timeBlock`.

**Files touched**: Edits to `src/types/planner.ts`, `PlannerContext.tsx`, `DayCard.tsx` (grouping + input toggle), `SortableTask.tsx` (time block context), `index.css` (time block tint classes).

10.**The Glassbound Notebook (Journal Module Upgrade)**

**Core Objective:** Build a new full-screen journal component called `GlassboundNotebook.tsx`. This is not a sidebar; it is an immersive writing environment that feels like a translucent frosted glass slab placed over our existing natural backdrop.

moving over the pages gives a notebook type touch.

**1. Structural Aesthetic:**

- **The Pane:** A single, full-screen frosted glass panel with large, softened corners (`rounded-[3rem]`). Use our `--glass-bg` and a high blur (`backdrop-filter: blur(40px)`).
- **The Margins:** Optimize for long-form text with a single, centered column (max-width: 720px) and generous wide margins.
- **Vertical Rhythm:** Implement "Thin Vertical Rhythm Lines"—subtle horizontal rules every 32px that resemble a high-end ruled notebook. These should be extremely faint (`opacity-10`) and only visible on the glass surface.

**2. Interactive Refinement:**

- **Weighted Scroll:** Implement a "buttery" scroll experience. As the user scrolls through long entries, the parallax background should move at a slower, decoupled speed to create depth.
- **Soft-Brush Highlighting:** Custom CSS for the selection state. When text is highlighted, the background should be a warm, semi-transparent tone (`hsla(var(--primary) / 0.2)`), mimicking a soft-brush highlighter marker.
- **Floating Date Stamp:** A top-left aligned, understated date stamp using our `--font-display`. It should stay fixed or fade out as the user begins their deep writing session.

**3. Technical Integration:**

- **Parallax Sync:** The notebook page itself should react slightly to mouse movement, shifting by a few pixels (±5px) in sync with our `Environment.tsx` parallax engine.
- **Mood Markers:** When a user selects a mood for the entry (calm, focused, energized, reflective), the glass should subtly tint toward that mood's color without losing its translucent quality.
- **Auto-Focus:** On entry, the UI should transition smoothly (1.5s fade-in), dimming the background slightly more than the default view to center the focus on the text.

**Constraint Checklist:**

- Use our existing `JournalEntry` type and `addJournalEntry` context function.
- Ensure the text remains perfectly legible (high contrast against the frosted blur).
- The writing experience must be "Quiet"—no popups, no distracting buttons, just the text and the glass.

---

## Implementation Order

1. Types and context updates (foundation for all features)
2. Task Aging (self-contained, visual only)
3. Task Mood Markers and Frosted Time Blocks (extend task input flow together)
4. Seasonal Engine and Mood Tint (environment layer, related concerns)
5. Ambient Weather Layer (new component, depends on season)
6. Expanded Nature Guest System (refactor existing component)
7. Weekly Narrative Titles (depends on tasks + journal data)
8. Time Capsule Snapshots (data layer, Vault UI)