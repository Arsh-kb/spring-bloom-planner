import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import type { LightingMode, Day, JournalEntry, Task } from "@/types/planner";
import { useLocalStorage } from "@/hooks/useLocalStorage";

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
  mondayLeaf, // Monday (Video)
  dayDewdrop, // Tuesday
  dayBlossom, // Wednesday
  dayMoss, // Thursday
  fridayButterfly, // Friday (Video)
  dayFern, // Saturday
  dayMushroom, // Sunday
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

// 🕰️ Pagination Engine: Returns YYYY-MM-DD strings
function getWeekDates(weekOffset: number = 0): string[] {
  const now = new Date();
  const currentDay = now.getDay();
  const diff = now.getDate() - currentDay + (currentDay === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));

  monday.setDate(monday.getDate() + weekOffset * 7);

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const date = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${date}`;
  });
}

// Generate current week dates for default mock data
const initialDates = getWeekDates(0);

const defaultTasks: Task[] = [
  {
    id: "1",
    title: "Morning meditation",
    completed: true,
    priority: "medium",
    created_at: new Date().toISOString(),
    date: initialDates[0],
  },
  {
    id: "2",
    title: "Review sprint backlog",
    completed: false,
    priority: "high",
    created_at: new Date().toISOString(),
    date: initialDates[0],
  },
  {
    id: "3",
    title: "Plant the herb garden",
    completed: false,
    priority: "low",
    created_at: new Date().toISOString(),
    date: initialDates[1],
  },
  {
    id: "4",
    title: "Deep work: feature branch",
    completed: false,
    priority: "high",
    created_at: new Date().toISOString(),
    date: initialDates[2],
  },
  {
    id: "5",
    title: "Read 30 pages",
    completed: false,
    priority: "medium",
    created_at: new Date().toISOString(),
    date: initialDates[2],
  },
  {
    id: "6",
    title: "Team standup",
    completed: false,
    priority: "medium",
    created_at: new Date().toISOString(),
    date: initialDates[3],
  },
  {
    id: "7",
    title: "Weekly review",
    completed: false,
    priority: "high",
    created_at: new Date().toISOString(),
    date: initialDates[4],
  },
  {
    id: "8",
    title: "Sunset walk",
    completed: false,
    priority: "low",
    created_at: new Date().toISOString(),
    date: initialDates[4],
  },
  {
    id: "9",
    title: "Nature journaling",
    completed: false,
    priority: "low",
    created_at: new Date().toISOString(),
    date: initialDates[5],
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
    tasks: tasks.filter((t) => t.date === currentWeekDates[i]),
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
  ) => void;
  updateTask: (taskId: string, title: string) => void;
  deleteTask: (taskId: string) => void;
  moveTask: (taskId: string, targetDateStr: string) => void;

  addJournalEntry: (
    content: string,
    dateStr: string,
    mood?: "calm" | "focused" | "energized" | "reflective",
  ) => void;
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

  const [pomodoroMinutes, setPomodoroMinutes] = useState(defaultPomodoro);
  const [pomodoroSeconds, setPomodoroSeconds] = useState(0);
  const [pomodoroActive, setPomodoroActive] = useState(false);
  const [zenMode, setZenMode] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);

  const todayDateObj = new Date();
  const todayDayId = `${todayDateObj.getFullYear()}-${String(todayDateObj.getMonth() + 1).padStart(2, "0")}-${String(todayDateObj.getDate()).padStart(2, "0")}`;

  const currentWeekDates = getWeekDates(weekOffset);
  const days = buildDays(tasks, currentWeekDates);

  const setMode = useCallback((m: LightingMode) => {
    setModeState(m);
    document.documentElement.setAttribute("data-mode", m);
  }, []);

  useEffect(
    () => document.documentElement.setAttribute("data-mode", "sun"),
    [],
  );

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
    (dateStr: string, title: string, priority: "low" | "medium" | "high") => {
      const newTask: Task = {
        id: `t${Date.now()}`,
        title,
        completed: false,
        priority,
        created_at: new Date().toISOString(),
        date: dateStr,
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

  const deleteTask = useCallback(
    (taskId: string) => setTasks((prev) => prev.filter((t) => t.id !== taskId)),
    [setTasks],
  );

  const moveTask = useCallback(
    (taskId: string, targetDateStr: string) => {
      setTasks((prev) => {
        const taskIndex = prev.findIndex((t) => t.id === taskId);
        if (taskIndex === -1) return prev;
        const newTasks = [...prev];
        newTasks[taskIndex] = { ...newTasks[taskIndex], date: targetDateStr };
        return newTasks;
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

  const toggleZenMode = useCallback(() => setZenMode((z) => !z), []);

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
        deleteTask,
        moveTask,
        addJournalEntry,
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
