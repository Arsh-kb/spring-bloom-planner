import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import type { LightingMode, Day, JournalEntry, Task, MoodTint, TaskMood, TimeBlock, TimeCapsule, FocusSession, TaskTemplate } from "@/types/planner";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useSeasonalEngine } from "@/hooks/useSeasonalEngine";

// 🌿 Living Video Assets
import mondayLeaf from "@/assets/monday-leaf.mp4";
import fridayButterfly from "@/assets/friday-butterfly.mp4";

// 🍂 Static Image Assets
import dayBlossom from "@/assets/day-blossom.jpg";
import dayMoss from "@/assets/day-moss.jpg";
import dayFern from "@/assets/day-fern.jpg";
import dayMushroom from "@/assets/day-mushroom.jpg";
import dayDewdrop from "@/assets/day-dewdrop.jpg";

const dayImages = [
  mondayLeaf, dayDewdrop, dayBlossom, dayMoss,
  fridayButterfly, dayFern, dayMushroom,
];

const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const dayShorts = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getWeekDates(weekOffset: number = 0): string[] {
  const now = new Date();
  const currentDay = now.getDay();
  const diff = now.getDate() - currentDay + (currentDay === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  monday.setDate(monday.getDate() + weekOffset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });
}

const initialDates = getWeekDates(0);

const defaultTasks: Task[] = [
  { id: "1", title: "Morning meditation", completed: true, priority: "medium", created_at: new Date().toISOString(), date: initialDates[0], timeBlock: "morning", recurrence: "weekday" },
  { id: "2", title: "Review sprint backlog", completed: false, priority: "high", created_at: new Date().toISOString(), date: initialDates[0], mood: "high-strain", timeBlock: "morning" },
  { id: "3", title: "Plant the herb garden", completed: false, priority: "low", created_at: new Date().toISOString(), date: initialDates[1], mood: "energizing" },
  { id: "4", title: "Deep work: feature branch", completed: false, priority: "high", created_at: new Date().toISOString(), date: initialDates[2], mood: "high-strain", timeBlock: "afternoon" },
  { id: "5", title: "Read 30 pages", completed: false, priority: "medium", created_at: new Date().toISOString(), date: initialDates[2], mood: "reflective", timeBlock: "evening" },
  { id: "6", title: "Team standup", completed: false, priority: "medium", created_at: new Date().toISOString(), date: initialDates[3], mood: "routine", timeBlock: "morning", recurrence: "weekday" },
  { id: "7", title: "Weekly review", completed: false, priority: "high", created_at: new Date().toISOString(), date: initialDates[4], timeBlock: "afternoon", recurrence: "weekly" },
  { id: "8", title: "Sunset walk", completed: false, priority: "low", created_at: new Date().toISOString(), date: initialDates[4], mood: "energizing", timeBlock: "evening" },
  { id: "9", title: "Nature journaling", completed: false, priority: "low", created_at: new Date().toISOString(), date: initialDates[5], mood: "reflective" },
  { id: "10", title: "Rest & recharge", completed: false, priority: "low", created_at: new Date().toISOString(), date: initialDates[6] },
];

const defaultJournal: JournalEntry[] = [
  { id: "j1", content: "The morning light through the trees reminded me why I chose this path.", created_at: new Date().toISOString(), mood: "reflective", date: initialDates[0] },
  { id: "j2", content: "Productive afternoon — shipped two features and took a break by the creek.", created_at: new Date().toISOString(), mood: "focused", date: initialDates[0] },
];

function buildDays(tasks: Task[], currentWeekDates: string[]): Day[] {
  return dayNames.map((name, i) => ({
    id: currentWeekDates[i],
    name,
    short: dayShorts[i],
    date: currentWeekDates[i],
    tasks: tasks
      .filter((t) => t.date === currentWeekDates[i])
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    image: dayImages[i],
  }));
}

interface PlannerContextType {
  mode: LightingMode;
  setMode: (m: LightingMode) => void;
  days: Day[];
  tasks: Task[];
  journal: JournalEntry[];

  toggleTask: (taskId: string) => void;
  addTask: (dateStr: string, title: string, priority: "low" | "medium" | "high", mood?: TaskMood, timeBlock?: TimeBlock, recurrence?: Task['recurrence']) => void;
  updateTask: (taskId: string, title: string) => void;
  updateTaskDetails: (taskId: string, details: Partial<Pick<Task, 'description' | 'due_date' | 'tags' | 'mood' | 'timeBlock' | 'priority'>>) => void;
  deleteTask: (taskId: string) => void;
  moveTask: (taskId: string, targetDateStr: string) => void;
  reorderTasks: (dayId: string, taskIds: string[]) => void;

  addJournalEntry: (content: string, dateStr: string, mood?: "calm" | "focused" | "energized" | "reflective") => void;
  restoreData: (importedTasks: Task[], importedJournal: JournalEntry[]) => void;

  weekOffset: number;
  setWeekOffset: React.Dispatch<React.SetStateAction<number>>;

  defaultPomodoro: number;
  setDefaultPomodoro: (minutes: number) => void;
  pomodoroMinutes: number;
  pomodoroSeconds: number;
  pomodoroActive: boolean;
  togglePomodoro: () => void;
  resetPomodoro: () => void;
  zenMode: boolean;
  toggleZenMode: () => void;
  todayDayId: string;

  season: { season: string; label: string; hueShift: number; saturation: number; warmth: number; grain: number };
  moodTint: MoodTint;
  setMoodTint: (tint: MoodTint) => void;
  capsules: Record<string, TimeCapsule>;
  currentWeekDates: string[];

  // Deep Focus
  deepFocusActive: boolean;
  focusTaskId: string | null;
  enterDeepFocus: (taskId?: string) => void;
  exitDeepFocus: () => void;

  // Focus sessions history
  focusSessions: FocusSession[];
  addFocusSession: (session: FocusSession) => void;

  // Templates
  templates: TaskTemplate[];
  saveTemplate: (template: TaskTemplate) => void;
  deleteTemplate: (id: string) => void;
}

const PlannerContext = createContext<PlannerContextType | null>(null);

export function PlannerProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<LightingMode>("sun");
  const [tasks, setTasks] = useLocalStorage<Task[]>("springscape-tasks", defaultTasks);
  const [journal, setJournal] = useLocalStorage<JournalEntry[]>("springscape-journal", defaultJournal);
  const [defaultPomodoro, setDefaultPomodoro] = useLocalStorage<number>("springscape-pomodoro", 25);
  const [moodTint, setMoodTint] = useLocalStorage<MoodTint>("springscape-mood-tint", { warmth: 0, contrast: 0, depth: 50 });
  const [capsules, setCapsules] = useLocalStorage<Record<string, TimeCapsule>>("springscape-capsules", {});
  const [focusSessions, setFocusSessions] = useLocalStorage<FocusSession[]>("springscape-focus-sessions", []);
  const [templates, setTemplates] = useLocalStorage<TaskTemplate[]>("springscape-templates", []);

  const [pomodoroMinutes, setPomodoroMinutes] = useState(defaultPomodoro);
  const [pomodoroSeconds, setPomodoroSeconds] = useState(0);
  const [pomodoroActive, setPomodoroActive] = useState(false);
  const [zenMode, setZenMode] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);

  // Deep Focus state
  const [deepFocusActive, setDeepFocusActive] = useState(false);
  const [focusTaskId, setFocusTaskId] = useState<string | null>(null);

  const todayDateObj = new Date();
  const todayDayId = `${todayDateObj.getFullYear()}-${String(todayDateObj.getMonth() + 1).padStart(2, "0")}-${String(todayDateObj.getDate()).padStart(2, "0")}`;

  const currentWeekDates = getWeekDates(weekOffset);
  const days = buildDays(tasks, currentWeekDates);
  const season = useSeasonalEngine(tasks);

  const setMode = useCallback((m: LightingMode) => {
    setModeState(m);
    document.documentElement.setAttribute("data-mode", m);
  }, []);

  useEffect(() => document.documentElement.setAttribute("data-mode", "sun"), []);

  // Pomodoro timer
  useEffect(() => {
    if (!pomodoroActive) { setPomodoroMinutes(defaultPomodoro); setPomodoroSeconds(0); }
  }, [defaultPomodoro, pomodoroActive]);

  useEffect(() => {
    if (!pomodoroActive) return;
    const interval = setInterval(() => {
      setPomodoroSeconds((prev) => {
        if (prev === 0) {
          setPomodoroMinutes((m) => { if (m === 0) { setPomodoroActive(false); return defaultPomodoro; } return m - 1; });
          return 59;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [pomodoroActive, defaultPomodoro]);

  // Time Capsule
  useEffect(() => {
    const prevWeekDates = getWeekDates(-1);
    const prevMondayKey = prevWeekDates[0];
    if (!capsules[prevMondayKey]) {
      const prevTasks = tasks.filter(t => prevWeekDates.includes(t.date));
      const prevJournal = journal.filter(j => prevWeekDates.includes(j.date));
      if (prevTasks.length > 0 || prevJournal.length > 0) {
        setCapsules(prev => {
          const updated = { ...prev, [prevMondayKey]: { tasks: prevTasks, journal: prevJournal, createdAt: new Date().toISOString() } };
          const keys = Object.keys(updated).sort();
          while (keys.length > 12) { delete updated[keys.shift()!]; }
          return updated;
        });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recurrence
  useEffect(() => {
    const recurringTemplates = tasks.filter(t => t.recurrence);
    if (recurringTemplates.length === 0) return;
    const newTasks: Task[] = [];
    for (const template of recurringTemplates) {
      const datesToGenerate: string[] = [];
      if (template.recurrence === 'daily') datesToGenerate.push(...currentWeekDates);
      else if (template.recurrence === 'weekday') datesToGenerate.push(...currentWeekDates.slice(0, 5));
      else if (template.recurrence === 'weekly') {
        const origDayOfWeek = new Date(template.date).getDay();
        const mappedIdx = origDayOfWeek === 0 ? 6 : origDayOfWeek - 1;
        if (currentWeekDates[mappedIdx]) datesToGenerate.push(currentWeekDates[mappedIdx]);
      }
      for (const dateStr of datesToGenerate) {
        const exists = tasks.some(t => t.title === template.title && t.date === dateStr);
        if (!exists) {
          newTasks.push({
            ...template,
            id: `r${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            date: dateStr,
            completed: false,
            created_at: new Date().toISOString(),
            subIntentions: [],
          });
        }
      }
    }
    if (newTasks.length > 0) setTasks(prev => [...prev, ...newTasks]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekOffset]);

  const toggleTask = useCallback((taskId: string) => setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, completed: !t.completed } : t)), [setTasks]);

  const addTask = useCallback((dateStr: string, title: string, priority: "low" | "medium" | "high", mood?: TaskMood, timeBlock?: TimeBlock, recurrence?: Task['recurrence']) => {
    const newTask: Task = { id: `t${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, title, completed: false, priority, created_at: new Date().toISOString(), date: dateStr, mood, timeBlock, recurrence: recurrence || null };
    setTasks((prev) => [...prev, newTask]);
  }, [setTasks]);

  const updateTask = useCallback((taskId: string, title: string) => { setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, title } : t))); }, [setTasks]);

  const updateTaskDetails = useCallback((taskId: string, details: Partial<Pick<Task, 'description' | 'due_date' | 'tags' | 'mood' | 'timeBlock' | 'priority'>>) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...details } : t)));
  }, [setTasks]);

  const deleteTask = useCallback((taskId: string) => setTasks((prev) => prev.filter((t) => t.id !== taskId)), [setTasks]);

  const moveTask = useCallback((taskId: string, targetDateStr: string) => {
    setTasks((prev) => {
      const idx = prev.findIndex((t) => t.id === taskId);
      if (idx === -1) return prev;
      const newTasks = [...prev];
      newTasks[idx] = { ...newTasks[idx], date: targetDateStr };
      return newTasks;
    });
  }, [setTasks]);

  const reorderTasks = useCallback((dayId: string, taskIds: string[]) => {
    setTasks((prev) => {
      const updated = [...prev];
      taskIds.forEach((id, index) => {
        const taskIdx = updated.findIndex(t => t.id === id);
        if (taskIdx !== -1) updated[taskIdx] = { ...updated[taskIdx], sortOrder: index };
      });
      return updated;
    });
  }, [setTasks]);

  const addJournalEntry = useCallback((content: string, dateStr: string, mood: "calm" | "focused" | "energized" | "reflective" = "reflective") => {
    setJournal((prev) => [...prev, { id: `j${Date.now()}`, content, created_at: new Date().toISOString(), mood, date: dateStr }]);
  }, [setJournal]);

  const restoreData = useCallback((importedTasks: Task[], importedJournal: JournalEntry[]) => { setTasks(importedTasks); setJournal(importedJournal); }, [setTasks, setJournal]);
  const togglePomodoro = useCallback(() => setPomodoroActive((p) => !p), []);
  const resetPomodoro = useCallback(() => { setPomodoroActive(false); setPomodoroMinutes(defaultPomodoro); setPomodoroSeconds(0); }, [defaultPomodoro]);
  const toggleZenMode = useCallback(() => setZenMode((z) => !z), []);

  // Deep Focus
  const enterDeepFocus = useCallback((taskId?: string) => {
    setFocusTaskId(taskId || null);
    setDeepFocusActive(true);
  }, []);

  const exitDeepFocus = useCallback(() => {
    setDeepFocusActive(false);
    setFocusTaskId(null);
  }, []);

  const addFocusSession = useCallback((session: FocusSession) => {
    setFocusSessions(prev => [...prev, session]);
  }, [setFocusSessions]);

  const saveTemplate = useCallback((template: TaskTemplate) => {
    setTemplates(prev => [...prev, template]);
  }, [setTemplates]);

  const deleteTemplate = useCallback((id: string) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
  }, [setTemplates]);

  return (
    <PlannerContext.Provider value={{
      mode, setMode, days, tasks, journal, toggleTask, addTask, updateTask, updateTaskDetails, deleteTask, moveTask, reorderTasks,
      addJournalEntry, restoreData, weekOffset, setWeekOffset, defaultPomodoro, setDefaultPomodoro,
      pomodoroMinutes, pomodoroSeconds, pomodoroActive, togglePomodoro, resetPomodoro,
      zenMode, toggleZenMode, todayDayId, season, moodTint, setMoodTint, capsules, currentWeekDates,
      deepFocusActive, focusTaskId, enterDeepFocus, exitDeepFocus,
      focusSessions, addFocusSession,
      templates, saveTemplate, deleteTemplate,
    }}>
      {children}
    </PlannerContext.Provider>
  );
}

export function usePlanner() {
  const ctx = useContext(PlannerContext);
  if (!ctx) throw new Error("usePlanner must be used within PlannerProvider");
  return ctx;
}
