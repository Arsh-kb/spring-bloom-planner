

# Visual & Responsiveness Fix Plan

## Problems Identified (from screenshots)

**Desktop (1280px):**
- Pomodoro timer (`fixed bottom-8 left-8`) directly overlaps the Friday DayCard, hiding its header and tasks
- Task text on DayCards has low contrast -- small text (`text-sm`, `text-xs`) against semi-transparent glass with busy nature backgrounds behind
- Journal sidebar permanently takes ~25% of the right side, squeezing day cards
- Streak dots and header elements crowd together; "Deep Winter" season label barely visible

**Mobile (375px) -- completely broken:**
- Grid renders as 2 columns of impossibly thin cards (~50px wide each)
- Journal sidebar covers 80% of the viewport
- Pomodoro timer covers bottom cards entirely
- Header buttons overflow off-screen
- No way to navigate or interact meaningfully

---

## Plan

### 1. Fix Timer/Card Overlap

Move the Pomodoro timer from `fixed bottom-8 left-8` to a collapsible inline position in the header or a floating position that avoids the grid. On mobile, make it a compact bar at the bottom of the screen. The CaveSessionPanel has the same `fixed bottom-8 left-8` positioning and needs the same treatment.

**Files**: `PomodoroTimer.tsx`, `CaveSessionPanel.tsx`

### 2. Improve Text Readability Across All Cards

- Add a stronger semi-opaque background scrim to the task content area of DayCards (the `p-3` section) -- currently `glass-panel` alone is too transparent against vivid backgrounds
- Increase text contrast: bump task text from `text-foreground/95` to `text-foreground` with stronger `text-shadow`
- Add a subtle dark gradient overlay inside the card content area (not just the header)
- Apply the same treatment to Journal sidebar entries and the GlassboundNotebook

**Files**: `DayCard.tsx`, `SortableTask.tsx`, `GlassboundNotebook.tsx`, `DayDetailView.tsx`, `JournalSidebar.tsx`, `index.css` (increase `--glass-bg` opacity or add a `.glass-panel-solid` variant)

### 3. Mobile Responsiveness Overhaul

**Layout** (`PlannerGrid.tsx`):
- Mobile: single-column scrollable list of DayCards (1 col on `<640px`)
- Tablet: 2 columns (`sm:grid-cols-2`)
- Desktop: keep 4 columns (`lg:grid-cols-4`)

**Header** (`PlannerHeader.tsx`):
- Mobile: collapse into a compact bar -- brand + hamburger menu
- Hide streak dots, season label, and circadian suggestion on mobile
- Tools/Mode dropdowns become a single hamburger sheet

**Journal Sidebar** (`JournalSidebar.tsx` / `Index.tsx`):
- Mobile: hide by default, open as a full-screen overlay/sheet instead of a persistent sidebar
- Add a toggle button visible on mobile

**Timer** (`PomodoroTimer.tsx`, `CaveSessionPanel.tsx`):
- Mobile: render as a slim fixed bar at the very bottom (48px height) instead of the large floating panel

**Files**: `PlannerGrid.tsx`, `PlannerHeader.tsx`, `JournalSidebar.tsx`, `Index.tsx`, `PomodoroTimer.tsx`, `CaveSessionPanel.tsx`, `DayCard.tsx` (reduce header image height on mobile)

### 4. Templates with Multiple Tasks per Day

Current templates only place 1 task per day-slot. Enhance so each `dayIndex` can have multiple tasks (already supported by the data structure, but built-in templates are sparse).

- Add richer built-in templates with 3-5 tasks per day
- Add a "Preview" expansion that shows all tasks grouped by day before applying
- Allow editing template tasks inline (add/remove individual tasks) before saving

**Files**: `TaskTemplates.tsx`

### 5. Journal Sidebar Fixes

The sidebar is always open and has no close mechanism on desktop, and dominates on mobile.

- Add a toggle/collapse button
- On desktop: collapsible panel (default closed, opens on click from header)
- On mobile: full-screen overlay sheet

**Files**: `JournalSidebar.tsx`, `Index.tsx`, `PlannerHeader.tsx`

---

## Implementation Order

1. Timer repositioning (fixes the most visible bug)
2. Text readability improvements (global impact)
3. Mobile responsiveness (layout, header, sidebar)
4. Journal sidebar collapse behavior
5. Template enhancement with multi-task days

