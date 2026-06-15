import type { TaskTemplate } from '@/types/planner';

// Jujhar's weekly timetable (24 June onwards).
// dayIndex 0 = Monday … 6 = Sunday. Recurrence handled per-task.
export const jujharTemplate: TaskTemplate = {
  id: 'builtin-jujhar',
  name: "📘 Jujhar's Weekly Timetable",
  tasks: [
    // Daily rituals — added to Monday with recurrence:daily so engine fans them across the week
    { title: 'Wake up at 7:00 AM', priority: 'high', mood: 'routine', timeBlock: 'morning', recurrence: 'daily', dayIndex: 0 },
    { title: 'Morning skincare', priority: 'medium', mood: 'routine', timeBlock: 'morning', recurrence: 'daily', dayIndex: 0 },
    { title: '30 min exercise', priority: 'high', mood: 'energizing', timeBlock: 'morning', recurrence: 'daily', dayIndex: 0 },
    { title: 'Complete 5 hours self-study', priority: 'high', mood: 'high-strain', recurrence: 'daily', dayIndex: 0 },
    { title: 'Cow work (6:00–7:00 PM)', priority: 'medium', mood: 'routine', timeBlock: 'evening', recurrence: 'daily', dayIndex: 0 },
    { title: 'Night skincare', priority: 'medium', mood: 'routine', timeBlock: 'evening', recurrence: 'daily', dayIndex: 0 },
    { title: 'Phone usage ≤ 2 hours', priority: 'high', mood: 'reflective', recurrence: 'daily', dayIndex: 0 },
    { title: 'Sleep by 11:00 PM', priority: 'high', mood: 'routine', timeBlock: 'evening', recurrence: 'daily', dayIndex: 0 },

    // Weekday-only — classes Mon–Sat
    { title: 'Attend online classes', priority: 'high', mood: 'high-strain', timeBlock: 'morning', recurrence: 'weekday', dayIndex: 0 },
    // Saturday classes (weekday recurrence covers Mon–Fri; add Sat explicitly)
    { title: 'Attend online classes', priority: 'high', mood: 'high-strain', timeBlock: 'morning', dayIndex: 5 },

    // Per-day study sessions — Mon–Sat: 3 sessions; Sun: 4 sessions
    ...[0, 1, 2, 3, 4, 5].flatMap(d => ([
      { title: `Session 1 Complete`, priority: 'high' as const, mood: 'high-strain' as const, timeBlock: 'morning' as const, dayIndex: d },
      { title: `Session 2 Complete`, priority: 'high' as const, mood: 'high-strain' as const, timeBlock: 'afternoon' as const, dayIndex: d },
      { title: `Session 3 Complete`, priority: 'high' as const, mood: 'high-strain' as const, timeBlock: 'evening' as const, dayIndex: d },
    ])),
    // Sunday — 8-hour study day, 4 sessions
    { title: 'Session 1 Complete', priority: 'high', mood: 'high-strain', timeBlock: 'morning', dayIndex: 6 },
    { title: 'Session 2 Complete', priority: 'high', mood: 'high-strain', timeBlock: 'morning', dayIndex: 6 },
    { title: 'Session 3 Complete', priority: 'high', mood: 'high-strain', timeBlock: 'afternoon', dayIndex: 6 },
    { title: 'Session 4 Complete', priority: 'high', mood: 'high-strain', timeBlock: 'evening', dayIndex: 6 },

    // Weekly review on Sunday
    { title: 'Weekly review & rating', priority: 'medium', mood: 'reflective', timeBlock: 'evening', dayIndex: 6 },
  ],
};
