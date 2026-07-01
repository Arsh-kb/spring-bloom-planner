/* eslint-disable react-hooks/exhaustive-deps */
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import type {
  LightingMode,
  Day,
  JournalEntry,
  Task,
  MoodTint,
  TaskMood,
  TimeBlock,
  TimeCapsule,
  FocusSession,
  TaskTemplate,
  AIExplanation,
  PlannerSnapshot,
  ConfidenceScore,
  RecoveryProposal,
  MissionReport,
  TaskRisk,
} from "@/types/planner";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useSeasonalEngine } from "@/hooks/useSeasonalEngine";
// Scheduling Engine imports
import {
  computeWeekConfidence,
  computeTaskRisk as engineComputeTaskRisk,
  recoverWeek,
  rescheduleMissed,
  scheduleNewGoal,
  executeChatCommand,
  joinReplay,
  type ChatCommand,
} from "@/SchedulingEngine";
import { buildEngineContext } from "@/lib/scheduling/adapter";
import { supabase } from "@/integrations/supabase/client";

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
  mondayLeaf,
  dayDewdrop,
  dayBlossom,
  dayMoss,
  fridayButterfly,
  dayFern,
  dayMushroom,
];

const dayNames = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
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
  {
    id: "1",
    title: "Morning meditation",
    completed: true,
    priority: "medium",
    created_at: new Date().toISOString(),
    date: initialDates[0],
    timeBlock: "morning",
    recurrence: "weekday",
  },
  {
    id: "2",
    title: "Review sprint backlog",
    completed: false,
    priority: "high",
    created_at: new Date().toISOString(),
    date: initialDates[0],
    mood: "high-strain",
    timeBlock: "morning",
  },
  {
    id: "3",
    title: "Plant the herb garden",
    completed: false,
    priority: "low",
    created_at: new Date().toISOString(),
    date: initialDates[1],
    mood: "energizing",
  },
  {
    id: "4",
    title: "Deep work: feature branch",
    completed: false,
    priority: "high",
    created_at: new Date().toISOString(),
    date: initialDates[2],
    mood: "high-strain",
    timeBlock: "afternoon",
  },
  {
    id: "5",
    title: "Read 30 pages",
    completed: false,
    priority: "medium",
    created_at: new Date().toISOString(),
    date: initialDates[2],
    mood: "reflective",
    timeBlock: "evening",
  },
  {
    id: "6",
    title: "Team standup",
    completed: false,
    priority: "medium",
    created_at: new Date().toISOString(),
    date: initialDates[3],
    mood: "routine",
    timeBlock: "morning",
    recurrence: "weekday",
  },
  {
    id: "7",
    title: "Weekly review",
    completed: false,
    priority: "high",
    created_at: new Date().toISOString(),
    date: initialDates[4],
    timeBlock: "afternoon",
    recurrence: "weekly",
  },
  {
    id: "8",
    title: "Sunset walk",
    completed: false,
    priority: "low",
    created_at: new Date().toISOString(),
    date: initialDates[4],
    mood: "energizing",
    timeBlock: "evening",
  },
  {
    id: "9",
    title: "Nature journaling",
    completed: false,
    priority: "low",
    created_at: new Date().toISOString(),
    date: initialDates[5],
    mood: "reflective",
  },
  {
    id: "10",
    title: "Rest & recharge",
    completed: false,
    priority: "low",
    created_at: new Date().toISOString(),
    date: initialDates[6],
  },
];

const defaultJournal: JournalEntry[] = [
  {
    id: "j1",
    content:
      "The morning light through the trees reminded me why I chose this path.",
    created_at: new Date().toISOString(),
    mood: "reflective",
    date: initialDates[0],
  },
  {
    id: "j2",
    content:
      "Productive afternoon — shipped two features and took a break by the creek.",
    created_at: new Date().toISOString(),
    mood: "focused",
    date: initialDates[0],
  },
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
  addTask: (
    dateStr: string,
    title: string,
    priority: "low" | "medium" | "high",
    mood?: TaskMood,
    timeBlock?: TimeBlock,
    recurrence?: Task["recurrence"],
  ) => void;
  updateTask: (taskId: string, title: string) => void;
  updateTaskDetails: (
    taskId: string,
    details: Partial<
      Pick<
        Task,
        "description" | "due_date" | "tags" | "mood" | "timeBlock" | "priority"
      >
    >,
  ) => void;
  deleteTask: (taskId: string) => void;
  moveTask: (taskId: string, targetDateStr: string) => void;
  reorderTasks: (dayId: string, taskIds: string[]) => void;

  addJournalEntry: (
    content: string,
    dateStr: string,
    mood?: "calm" | "focused" | "energized" | "reflective",
  ) => void;
  deleteJournalEntry: (entryId: string) => void;
  updateJournalEntry: (entryId: string, content: string) => void;
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

  season: {
    season: string;
    label: string;
    hueShift: number;
    saturation: number;
    warmth: number;
    grain: number;
  };
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

  // Journal sidebar visibility
  journalOpen: boolean;
  setJournalOpen: (open: boolean) => void;

  // ===== AI Executive Assistant =====

  // Confidence Engine
  confidence: ConfidenceScore | null;
  setConfidence: React.Dispatch<React.SetStateAction<ConfidenceScore | null>>;
  computeConfidence: () => Promise<void>;

  // Task Risk
  taskRisks: Record<string, TaskRisk>;
  computeTaskRisk: (taskId: string) => Promise<TaskRisk>;

  // AI Explanations
  explanations: AIExplanation[];
  addExplanation: (
    explanation: Omit<AIExplanation, "id" | "timestamp">,
  ) => void;

  // Undo Support
  snapshots: PlannerSnapshot[];
  createSnapshot: (description: string) => void;
  restoreSnapshot: (snapshotId: string) => void;

  // Recovery Mode
  recoveryProposal: RecoveryProposal | null;
  runRecovery: () => Promise<boolean>;

  // Mission Report
  lastMissionReport: MissionReport | null;

  // Autonomous Rescheduling
  checkAndReschedule: () => Promise<boolean>;

  // AI Loading state
  aiLoading: boolean;
}

const PlannerContext = createContext<PlannerContextType | null>(null);

export function PlannerProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<LightingMode>("sun");
  const [tasks, setTasks] = useLocalStorage<Task[]>(
    "springscape-tasks",
    defaultTasks,
  );
  const [journal, setJournal] = useLocalStorage<JournalEntry[]>(
    "springscape-journal",
    defaultJournal,
  );
  const [defaultPomodoro, setDefaultPomodoro] = useLocalStorage<number>(
    "springscape-pomodoro",
    25,
  );
  const [moodTint, setMoodTint] = useLocalStorage<MoodTint>(
    "springscape-mood-tint",
    { warmth: 0, contrast: 0, depth: 50 },
  );
  const [capsules, setCapsules] = useLocalStorage<Record<string, TimeCapsule>>(
    "springscape-capsules",
    {},
  );
  const [focusSessions, setFocusSessions] = useLocalStorage<FocusSession[]>(
    "springscape-focus-sessions",
    [],
  );
  const [templates, setTemplates] = useLocalStorage<TaskTemplate[]>(
    "springscape-templates",
    [],
  );

  const [pomodoroMinutes, setPomodoroMinutes] = useState(defaultPomodoro);
  const [pomodoroSeconds, setPomodoroSeconds] = useState(0);
  const [pomodoroActive, setPomodoroActive] = useState(false);
  const [zenMode, setZenMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('springscape-zen-mode');
      return saved === 'true';
    }
    return false;
  });
  const [weekOffset, setWeekOffset] = useState(0);

  // Deep Focus state
  const [deepFocusActive, setDeepFocusActive] = useState(false);
  const [focusTaskId, setFocusTaskId] = useState<string | null>(null);
  const [journalOpen, setJournalOpen] = useState(false);

  // ===== AI Executive Assistant State =====
  const [confidence, setConfidence] = useState<ConfidenceScore | null>(null);
  const [taskRisks, setTaskRisks] = useState<Record<string, TaskRisk>>({});
  const [explanations, setExplanations] = useLocalStorage<AIExplanation[]>(
    "springscape-explanations",
    [],
  );
  const [snapshots, setSnapshots] = useLocalStorage<PlannerSnapshot[]>(
    "springscape-snapshots",
    [],
  );
  const [recoveryProposal, setRecoveryProposal] =
    useState<RecoveryProposal | null>(null);
  const [lastMissionReport, setLastMissionReport] =
    useState<MissionReport | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const todayDateObj = new Date();
  const todayDayId = `${todayDateObj.getFullYear()}-${String(todayDateObj.getMonth() + 1).padStart(2, "0")}-${String(todayDateObj.getDate()).padStart(2, "0")}`;

  // Memoize week dates and days to prevent unnecessary recalculations
  const currentWeekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset]);
  const days = useMemo(() => buildDays(tasks, currentWeekDates), [tasks, currentWeekDates]);
  const season = useSeasonalEngine(tasks);

  const setMode = useCallback((m: LightingMode) => {
    setModeState(m);
    document.documentElement.setAttribute("data-mode", m);
  }, []);

  useEffect(
    () => document.documentElement.setAttribute("data-mode", "sun"),
    [],
  );

  // Pomodoro timer
  useEffect(() => {
    if (!pomodoroActive) {
      setPomodoroMinutes(defaultPomodoro);
      setPomodoroSeconds(0);
    }
  }, [defaultPomodoro, pomodoroActive]);

  useEffect(() => {
    if (!pomodoroActive) return;
    const interval = setInterval(() => {
      setPomodoroSeconds((prev) => {
        if (prev === 0) {
          setPomodoroMinutes((m) => {
            if (m === 0) {
              setPomodoroActive(false);
              return defaultPomodoro;
            }
            return m - 1;
          });
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
      const prevTasks = tasks.filter((t) => prevWeekDates.includes(t.date));
      const prevJournal = journal.filter((j) => prevWeekDates.includes(j.date));
      if (prevTasks.length > 0 || prevJournal.length > 0) {
        setCapsules((prev) => {
          const updated = {
            ...prev,
            [prevMondayKey]: {
              tasks: prevTasks,
              journal: prevJournal,
              createdAt: new Date().toISOString(),
            },
          };
          const keys = Object.keys(updated).sort();
          while (keys.length > 12) {
            delete updated[keys.shift()!];
          }
          return updated;
        });
      }
    }
  }, []);

  // Cleanup duplicate recurring tasks - run once on mount
  const hasCleanedDuplicates = useRef(false);
  useEffect(() => {
    if (hasCleanedDuplicates.current) return;

    // Find and remove duplicate recurring tasks
    const seen = new Map<string, string>(); // "title_date" -> taskId
    const tasksToRemove: string[] = [];

    tasks.forEach((t) => {
      if (!t.recurrence) return;
      const key = `${t.title}_${t.date}`;
      if (seen.has(key)) {
        // Keep the one that was created earlier, remove duplicates
        tasksToRemove.push(t.id);
      } else {
        seen.set(key, t.id);
      }
    });

    if (tasksToRemove.length > 0) {
      setTasks((prev) => prev.filter((t) => !tasksToRemove.includes(t.id)));
    }

    hasCleanedDuplicates.current = true;
  }, []);

  // Recurrence - only generate for current week to prevent duplicates
  const hasGeneratedRecurring = useRef(false);
  useEffect(() => {
    // Only run once per session to prevent duplicates
    if (hasGeneratedRecurring.current) return;

    const recurringTemplates = tasks.filter((t) => t.recurrence && !t.id.startsWith('r'));
    if (recurringTemplates.length === 0) {
      hasGeneratedRecurring.current = true;
      return;
    }

    const newTasks: Task[] = [];
    const today = new Date().toISOString().split('T')[0];

    for (const template of recurringTemplates) {
      const datesToGenerate: string[] = [];
      if (template.recurrence === "daily") {
        // Only generate for today and future within current week
        datesToGenerate.push(...currentWeekDates.filter(d => d >= today));
      } else if (template.recurrence === "weekday") {
        // Only weekdays, and only today/future
        const weekdays = currentWeekDates.filter(d => {
          const day = new Date(d).getDay();
          return day >= 1 && day <= 5 && d >= today;
        });
        datesToGenerate.push(...weekdays);
      } else if (template.recurrence === "weekly") {
        const origDayOfWeek = new Date(template.date).getDay();
        const mappedIdx = origDayOfWeek === 0 ? 6 : origDayOfWeek - 1;
        if (currentWeekDates[mappedIdx] && currentWeekDates[mappedIdx] >= today)
          datesToGenerate.push(currentWeekDates[mappedIdx]);
      }

      for (const dateStr of datesToGenerate) {
        // More strict duplicate check - check if any task with similar properties exists
        const exists = tasks.some(
          (t) => t.title === template.title && t.date === dateStr && t.recurrence === template.recurrence,
        );
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

    if (newTasks.length > 0) {
      setTasks((prev) => [...prev, ...newTasks]);
    }
    hasGeneratedRecurring.current = true;
  }, [currentWeekDates]);

  const toggleTask = useCallback(
    (taskId: string) =>
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, completed: !t.completed } : t,
        ),
      ),
    [setTasks],
  );

  const addTask = useCallback(
    (
      dateStr: string,
      title: string,
      priority: "low" | "medium" | "high",
      mood?: TaskMood,
      timeBlock?: TimeBlock,
      recurrence?: Task["recurrence"],
    ) => {
      const newTask: Task = {
        id: `t${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        title,
        completed: false,
        priority,
        created_at: new Date().toISOString(),
        date: dateStr,
        mood,
        timeBlock,
        recurrence: recurrence || null,
      };
      setTasks((prev) => [...prev, newTask]);
    },
    [setTasks],
  );

  const updateTask = useCallback(
    (taskId: string, title: string) => {
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, title } : t)),
      );
    },
    [setTasks],
  );

  const updateTaskDetails = useCallback(
    (
      taskId: string,
      details: Partial<
        Pick<
          Task,
          | "description"
          | "due_date"
          | "tags"
          | "mood"
          | "timeBlock"
          | "priority"
        >
      >,
    ) => {
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, ...details } : t)),
      );
    },
    [setTasks],
  );

  const deleteTask = useCallback(
    (taskId: string) => setTasks((prev) => prev.filter((t) => t.id !== taskId)),
    [setTasks],
  );

  const moveTask = useCallback(
    (taskId: string, targetDateStr: string) => {
      setTasks((prev) => {
        const idx = prev.findIndex((t) => t.id === taskId);
        if (idx === -1) return prev;
        const newTasks = [...prev];
        newTasks[idx] = { ...newTasks[idx], date: targetDateStr };
        return newTasks;
      });
    },
    [setTasks],
  );

  const reorderTasks = useCallback(
    (dayId: string, taskIds: string[]) => {
      setTasks((prev) => {
        const updated = [...prev];
        taskIds.forEach((id, index) => {
          const taskIdx = updated.findIndex((t) => t.id === id);
          if (taskIdx !== -1)
            updated[taskIdx] = { ...updated[taskIdx], sortOrder: index };
        });
        return updated;
      });
    },
    [setTasks],
  );

  const addJournalEntry = useCallback(
    (
      content: string,
      dateStr: string,
      mood: "calm" | "focused" | "energized" | "reflective" = "reflective",
    ) => {
      setJournal((prev) => [
        ...prev,
        {
          id: `j${Date.now()}`,
          content,
          created_at: new Date().toISOString(),
          mood,
          date: dateStr,
        },
      ]);
    },
    [setJournal],
  );

  const deleteJournalEntry = useCallback(
    (entryId: string) => {
      setJournal((prev) => prev.filter((j) => j.id !== entryId));
    },
    [setJournal],
  );

  const updateJournalEntry = useCallback(
    (entryId: string, content: string) => {
      setJournal((prev) =>
        prev.map((j) => (j.id === entryId ? { ...j, content } : j))
      );
    },
    [setJournal],
  );

  const restoreData = useCallback(
    (importedTasks: Task[], importedJournal: JournalEntry[]) => {
      setTasks(importedTasks);
      setJournal(importedJournal);
    },
    [setTasks, setJournal],
  );
  const togglePomodoro = useCallback(() => setPomodoroActive((p) => !p), []);
  const resetPomodoro = useCallback(() => {
    setPomodoroActive(false);
    setPomodoroMinutes(defaultPomodoro);
    setPomodoroSeconds(0);
  }, [defaultPomodoro]);
  const toggleZenMode = useCallback(() => {
    setZenMode((z) => {
      const newValue = !z;
      localStorage.setItem('springscape-zen-mode', String(newValue));
      return newValue;
    });
  }, []);

  // Deep Focus
  const enterDeepFocus = useCallback((taskId?: string) => {
    setFocusTaskId(taskId || null);
    setDeepFocusActive(true);
  }, []);

  const exitDeepFocus = useCallback(() => {
    setDeepFocusActive(false);
    setFocusTaskId(null);
  }, []);

  const addFocusSession = useCallback(
    (session: FocusSession) => {
      setFocusSessions((prev) => [...prev, session]);
    },
    [setFocusSessions],
  );

  const saveTemplate = useCallback(
    (template: TaskTemplate) => {
      setTemplates((prev) => [...prev, template]);
    },
    [setTemplates],
  );

  const deleteTemplate = useCallback(
    (id: string) => {
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    },
    [setTemplates],
  );

  // ===== AI Executive Assistant Implementations =====

  // Track recent failures to prevent spam
  const [recentFailures, setRecentFailures] = useState(0);

  // AI Invoke helper
  const invokeAI = async (action: string, payload: Record<string, unknown>) => {
    // Prevent repeated failures - stop after 3 consecutive failures
    if (recentFailures >= 3) {
      console.warn("AI invoke skipped - too many recent failures");
      return null;
    }
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-chief", {
        body: { action, ...payload },
      });
      if (error) throw error;
      setRecentFailures(0); // Reset on success
      return data;
    } catch (err) {
      console.error("AI invoke error:", err);
      setRecentFailures(prev => prev + 1);
      return null;
    } finally {
      setAiLoading(false);
    }
  };

  // Confidence Engine - uses local Scheduling Engine
  const computeConfidence = useCallback(async () => {
    const ctx = buildEngineContext({
      tasks,
      calendarEvents: [],
      weekDates: currentWeekDates,
      todayDate: todayDayId,
      focusSessions,
    });
    const result = computeWeekConfidence(ctx);
    setConfidence({
      overall: result.score,
      momentum: "flat",
      completedToday: tasks.filter((t) => t.date === todayDayId && t.completed).length,
      totalToday: tasks.filter((t) => t.date === todayDayId).length,
      overdueCount: tasks.filter((t) => !t.completed && t.date < todayDayId).length,
      riskTasks: result.metrics.conflictCount,
    });
  }, [tasks, todayDayId, currentWeekDates, focusSessions]);

  // Task Risk - uses local Scheduling Engine
  const computeTaskRisk = useCallback(
    async (taskId: string): Promise<TaskRisk> => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return "low";
      const ctx = buildEngineContext({
        tasks,
        calendarEvents: [],
        weekDates: currentWeekDates,
        todayDate: todayDayId,
        focusSessions,
      });
      const schedTask = ctx.tasks.find((t) => t.id === taskId);
      if (!schedTask) return "low";
      const result = engineComputeTaskRisk(schedTask, ctx);
      setTaskRisks((prev) => ({ ...prev, [taskId]: result.risk }));
      return result.risk;
    },
    [tasks, todayDayId, currentWeekDates, focusSessions],
  );

  // AI Explanations
  const addExplanation = useCallback(
    (explanation: Omit<AIExplanation, "id" | "timestamp">) => {
      const newExp: AIExplanation = {
        ...explanation,
        id: `exp_${Date.now()}`,
        timestamp: new Date().toISOString(),
      };
      setExplanations((prev) => [...prev, newExp]);
    },
    [setExplanations],
  );

  // Undo Support - Snapshots
  const createSnapshot = useCallback(
    (description: string) => {
      const snapshot: PlannerSnapshot = {
        id: `snap_${Date.now()}`,
        timestamp: new Date().toISOString(),
        tasks: JSON.parse(JSON.stringify(tasks)),
        journal: JSON.parse(JSON.stringify(journal)),
        description,
      };
      setSnapshots((prev) => {
        const updated = [...prev, snapshot];
        // Keep only last 20 snapshots
        if (updated.length > 20) return updated.slice(-20);
        return updated;
      });
    },
    [tasks, journal, setSnapshots],
  );

  const restoreSnapshot = useCallback(
    (snapshotId: string) => {
      const snapshot = snapshots.find((s) => s.id === snapshotId);
      if (snapshot) {
        setTasks(snapshot.tasks);
        setJournal(snapshot.journal);
        // Remove this and all newer snapshots
        const idx = snapshots.findIndex((s) => s.id === snapshotId);
        setSnapshots((prev) => prev.slice(0, idx));
      }
    },
    [snapshots, setTasks, setJournal, setSnapshots],
  );

  // Recovery Mode - uses local Scheduling Engine
  const runRecovery = useCallback(async (): Promise<boolean> => {
    createSnapshot("Before recovery");
    const ctx = buildEngineContext({
      tasks,
      calendarEvents: [],
      weekDates: currentWeekDates,
      todayDate: todayDayId,
      focusSessions,
    });
    const outcome = recoverWeek(ctx);

    if (outcome.result.moves.length === 0) return false;

    // Apply moves
    for (const move of outcome.result.moves) {
      moveTask(move.taskId, move.toDate);
    }

    // Add explanation
    addExplanation({
      action: "recovery",
      taskId: undefined,
      reason: joinReplay(outcome.narrative),
      confidence: outcome.confidenceAfter ?? 0,
      model: "scheduling-engine",
      details: { changes: outcome.result.moves },
    });

    setRecoveryProposal({
      summary: outcome.narrative[outcome.narrative.length - 1] ?? "Recovery complete.",
      changes: outcome.result.moves.map((m) => ({
        type: "move" as const,
        taskId: m.taskId,
        fromDate: m.fromDate,
        toDate: m.toDate,
        reason: m.reason,
      })),
      newConfidence: outcome.confidenceAfter ?? 0,
      oldConfidence: outcome.confidenceBefore ?? 0,
    });

    return true;
  }, [
    tasks,
    todayDayId,
    currentWeekDates,
    focusSessions,
    createSnapshot,
    moveTask,
    deleteTask,
    addExplanation,
    invokeAI,
  ]);

  // Autonomous Rescheduling - uses local Scheduling Engine
  const checkAndReschedule = useCallback(async (): Promise<boolean> => {
    const overdueTasks = tasks.filter(
      (t) => !t.completed && t.date < todayDayId,
    );
    if (overdueTasks.length === 0) return false;

    createSnapshot("Before autonomous reschedule");
    const ctx = buildEngineContext({
      tasks,
      calendarEvents: [],
      weekDates: currentWeekDates,
      todayDate: todayDayId,
      focusSessions,
    });
    const schedOverdue = ctx.tasks.filter((t) => overdueTasks.some((o) => o.id === t.id));
    const outcome = rescheduleMissed(schedOverdue, ctx);

    // Apply moves
    for (const placed of outcome.result) {
      moveTask(placed.id, placed.date);
      addExplanation({
        action: "reschedule",
        taskId: placed.id,
        reason: `Rescheduled by the Scheduling Engine — ${placed.date}.`,
        confidence: outcome.confidenceAfter ?? 85,
        model: "scheduling-engine",
      });
    }
    return outcome.result.length > 0;
  }, [
    tasks,
    todayDayId,
    currentWeekDates,
    focusSessions,
    createSnapshot,
    moveTask,
    addExplanation,
  ]);

  // Apply AI breakdown through the Scheduling Engine
  const applyAIBreakdown = useCallback(
    (subtasks: Array<{
      title: string;
      estimatedMinutes: number;
      priority: TaskMood extends string ? TaskMood : never;
      mood?: TaskMood;
      timeBlock?: TimeBlock;
    }>) => {
      createSnapshot("Before goal scheduling");
      const ctx = buildEngineContext({
        tasks,
        calendarEvents: [],
        weekDates: currentWeekDates,
        todayDate: todayDayId,
        focusSessions,
      });
      const candidates = subtasks.map((s, i) => ({
        id: `goal_${Date.now()}_${i}`,
        title: s.title,
        completed: false,
        priority: s.priority as "low" | "medium" | "high",
        estimatedMinutes: s.estimatedMinutes,
        mood: s.mood,
        timeBlock: s.timeBlock,
        source: "ai" as const,
      }));
      const outcome = scheduleNewGoal(candidates, ctx);
      for (const placed of outcome.result) {
        addTask(placed.date, placed.title, placed.priority, placed.mood, placed.timeBlock);
      }
      addExplanation({
        action: "reschedule",
        reason: joinReplay(outcome.narrative),
        confidence: outcome.confidenceAfter ?? 0,
        model: "scheduling-engine",
        details: { placed: outcome.result },
      });
    },
    [tasks, todayDayId, currentWeekDates, focusSessions, createSnapshot, addTask, addExplanation],
  );

  // Compute confidence on mount and when tasks change significantly
  useEffect(() => {
    const timer = setTimeout(() => computeConfidence(), 2000);
    return () => clearTimeout(timer);
  }, [tasks.length, computeConfidence]);

  return (
    <PlannerContext.Provider
      value={{
        mode,
        setMode,
        days,
        tasks,
        journal,
        toggleTask,
        addTask,
        updateTask,
        updateTaskDetails,
        deleteTask,
        moveTask,
        reorderTasks,
        addJournalEntry,
        deleteJournalEntry,
        updateJournalEntry,
        restoreData,
        weekOffset,
        setWeekOffset,
        defaultPomodoro,
        setDefaultPomodoro,
        pomodoroMinutes,
        pomodoroSeconds,
        pomodoroActive,
        togglePomodoro,
        resetPomodoro,
        zenMode,
        toggleZenMode,
        todayDayId,
        season,
        moodTint,
        setMoodTint,
        capsules,
        currentWeekDates,
        deepFocusActive,
        focusTaskId,
        enterDeepFocus,
        exitDeepFocus,
        focusSessions,
        addFocusSession,
        templates,
        saveTemplate,
        deleteTemplate,
        journalOpen,
        setJournalOpen,

        // AI Executive Assistant
        confidence,
        setConfidence,
        computeConfidence,
        taskRisks,
        computeTaskRisk,
        explanations,
        addExplanation,
        snapshots,
        createSnapshot,
        restoreSnapshot,
        recoveryProposal,
        runRecovery,
        lastMissionReport,
        checkAndReschedule,
        aiLoading,
      }}
    >
      {children}
    </PlannerContext.Provider>
  );
}

export function usePlanner() {
  const ctx = useContext(PlannerContext);
  if (!ctx) throw new Error("usePlanner must be used within PlannerProvider");
  return ctx;
}
