import type { Task, JournalEntry, FocusSession } from '@/types/planner';

// Demo workspace data for presentations
export function getDemoData() {
  const today = new Date();
  const formatDate = (offset: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + offset);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const weekDates = [
    formatDate(-3), formatDate(-2), formatDate(-1), formatDate(0),
    formatDate(1), formatDate(2), formatDate(3)
  ];
  const yesterday = formatDate(-1);
  const todayStr = formatDate(0);
  const tomorrow = formatDate(1);

  const demoTasks: Task[] = [
    // Overdue tasks (to show recovery)
    { id: 'demo1', title: 'Complete React component documentation', completed: false, priority: 'high', created_at: new Date(Date.now() - 4 * 86400000).toISOString(), date: yesterday, mood: 'high-strain', timeBlock: 'morning' },
    { id: 'demo2', title: 'Review pull requests', completed: false, priority: 'medium', created_at: new Date(Date.now() - 3 * 86400000).toISOString(), date: yesterday, timeBlock: 'afternoon' },

    // Today's tasks
    { id: 'demo3', title: 'Morning meditation', completed: true, priority: 'medium', created_at: todayStr, date: todayStr, timeBlock: 'morning' },
    { id: 'demo4', title: 'Deep work: Lumira feature development', completed: false, priority: 'high', created_at: todayStr, date: todayStr, mood: 'high-strain', timeBlock: 'morning' },
    { id: 'demo5', title: 'Team standup', completed: false, priority: 'medium', created_at: todayStr, date: todayStr, timeBlock: 'morning', recurrence: 'weekday' },
    { id: 'demo6', title: 'Algorithm practice (LeetCode)', completed: false, priority: 'high', created_at: todayStr, date: todayStr, mood: 'high-strain', timeBlock: 'afternoon' },
    { id: 'demo7', title: 'Lunch break', completed: false, priority: 'low', created_at: todayStr, date: todayStr, timeBlock: 'afternoon' },
    { id: 'demo8', title: 'Workout - Upper body', completed: false, priority: 'medium', created_at: todayStr, date: todayStr, mood: 'energizing', timeBlock: 'evening' },
    { id: 'demo9', title: 'Journal entry', completed: false, priority: 'low', created_at: todayStr, date: todayStr, mood: 'reflective', timeBlock: 'evening' },

    // Future tasks
    { id: 'demo10', title: 'DSA: Dynamic Programming practice', completed: false, priority: 'high', created_at: todayStr, date: tomorrow, mood: 'high-strain', timeBlock: 'morning' },
    { id: 'demo11', title: 'Hackathon project work', completed: false, priority: 'high', created_at: todayStr, date: tomorrow, mood: 'high-strain', timeBlock: 'afternoon' },
    { id: 'demo12', title: 'Weekly review', completed: false, priority: 'medium', created_at: todayStr, date: formatDate(2), timeBlock: 'afternoon', recurrence: 'weekly' },
    { id: 'demo13', title: 'Rest & recharge', completed: false, priority: 'low', created_at: todayStr, date: formatDate(3), mood: 'reflective' },
  ];

  const demoJournal: JournalEntry[] = [
    { id: 'j1', content: 'The morning meditation set a calm tone for the day. Feeling focused.', created_at: todayStr, mood: 'calm', date: todayStr },
    { id: 'j2', content: 'Deep work session was productive - completed the auth flow.', created_at: todayStr, mood: 'focused', date: todayStr },
    { id: 'j3', content: 'Found a bug in production but fixed it quickly. Good day.', created_at: yesterday, mood: 'focused', date: yesterday },
  ];

  const demoFocusSessions: FocusSession[] = [
    { id: 'fs1', taskId: 'demo3', taskTitle: 'Morning meditation', duration: 600, tabSwitches: 0, completedAt: todayStr },
    { id: 'fs2', taskId: 'demo4', taskTitle: 'Deep work: Lumira feature', duration: 1500, tabSwitches: 2, completedAt: todayStr },
  ];

  return {
    tasks: demoTasks,
    journal: demoJournal,
    focusSessions: demoFocusSessions,
    weekDates,
  };
}

// Demo confidence score
export function getDemoConfidence() {
  return {
    overall: 68,
    momentum: 'up' as const,
    completedToday: 1,
    totalToday: 6,
    overdueCount: 2,
    riskTasks: 3,
  };
}

// Demo mission report
export function getDemoMissionReport() {
  return {
    completionProbability: 72,
    deepWorkHours: 4.5,
    recoveryTime: 1.5,
    highRiskTasks: 3,
    protectedFocusBlocks: 2,
    schedulingStrategy: 'Prioritized high-strain work in morning blocks when focus is highest. Spread routine tasks throughout the week. Protected evening for workouts and reflection. The weekend includes light recovery work with a focus session Saturday morning.',
  };
}