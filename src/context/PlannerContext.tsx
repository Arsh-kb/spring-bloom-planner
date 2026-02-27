import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { LightingMode, Day, JournalEntry, Task } from '@/types/planner';
import { useLocalStorage } from '@/hooks/useLocalStorage';

import dayLeaf from '@/assets/day-leaf.jpg';
import dayBlossom from '@/assets/day-blossom.jpg';
import dayMoss from '@/assets/day-moss.jpg';
import dayButterfly from '@/assets/day-butterfly.jpg';
import dayFern from '@/assets/day-fern.jpg';
import dayMushroom from '@/assets/day-mushroom.jpg';
import dayDewdrop from '@/assets/day-dewdrop.jpg';

const dayImages = [dayLeaf, dayDewdrop, dayBlossom, dayMoss, dayButterfly, dayFern, dayMushroom];
const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const dayShorts = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getWeekDates(): string[] {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((day + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.toISOString().split('T')[0];
  });
}

const dates = getWeekDates();

const defaultTasks: Task[] = [
  { id: '1', title: 'Morning meditation', completed: true, priority: 'medium', created_at: new Date().toISOString(), day: 'day-0' },
  { id: '2', title: 'Review sprint backlog', completed: false, priority: 'high', created_at: new Date().toISOString(), day: 'day-0' },
  { id: '3', title: 'Plant the herb garden', completed: false, priority: 'low', created_at: new Date().toISOString(), day: 'day-1' },
  { id: '4', title: 'Deep work: feature branch', completed: false, priority: 'high', created_at: new Date().toISOString(), day: 'day-2' },
  { id: '5', title: 'Read 30 pages', completed: false, priority: 'medium', created_at: new Date().toISOString(), day: 'day-2' },
  { id: '6', title: 'Team standup', completed: false, priority: 'medium', created_at: new Date().toISOString(), day: 'day-3' },
  { id: '7', title: 'Weekly review', completed: false, priority: 'high', created_at: new Date().toISOString(), day: 'day-4' },
  { id: '8', title: 'Sunset walk', completed: false, priority: 'low', created_at: new Date().toISOString(), day: 'day-4' },
  { id: '9', title: 'Nature journaling', completed: false, priority: 'low', created_at: new Date().toISOString(), day: 'day-5' },
  { id: '10', title: 'Rest & recharge', completed: false, priority: 'low', created_at: new Date().toISOString(), day: 'day-6' },
];

const defaultJournal: JournalEntry[] = [
  { id: 'j1', content: 'The morning light through the trees reminded me why I chose this path.', created_at: new Date().toISOString(), mood: 'reflective', day: 'day-0' },
  { id: 'j2', content: 'Productive afternoon — shipped two features and took a break by the creek.', created_at: new Date().toISOString(), mood: 'focused', day: 'day-0' },
];

function buildDays(tasks: Task[]): Day[] {
  return dayNames.map((name, i) => ({
    id: `day-${i}`,
    name,
    short: dayShorts[i],
    date: dates[i],
    tasks: tasks.filter(t => t.day === `day-${i}`),
    image: dayImages[i],
  }));
}

interface PlannerContextType {
  mode: LightingMode;
  setMode: (m: LightingMode) => void;
  days: Day[];
  journal: JournalEntry[];
  toggleTask: (taskId: string) => void;
  addTask: (dayId: string, title: string) => void;
  deleteTask: (taskId: string) => void;
  addJournalEntry: (content: string, dayId: string) => void;
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
  const [mode, setModeState] = useState<LightingMode>('sun');
  const [tasks, setTasks] = useLocalStorage<Task[]>('springscape-tasks', defaultTasks);
  const [journal, setJournal] = useLocalStorage<JournalEntry[]>('springscape-journal', defaultJournal);
  const [pomodoroMinutes, setPomodoroMinutes] = useState(25);
  const [pomodoroSeconds, setPomodoroSeconds] = useState(0);
  const [pomodoroActive, setPomodoroActive] = useState(false);
  const [zenMode, setZenMode] = useState(false);

  // Determine today's dayId
  const todayDate = new Date().toISOString().split('T')[0];
  const todayIndex = dates.indexOf(todayDate);
  const todayDayId = todayIndex >= 0 ? `day-${todayIndex}` : 'day-0';

  const days = buildDays(tasks);

  const setMode = useCallback((m: LightingMode) => {
    setModeState(m);
    document.documentElement.setAttribute('data-mode', m);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-mode', 'sun');
  }, []);

  // Pomodoro timer
  useEffect(() => {
    if (!pomodoroActive) return;
    const interval = setInterval(() => {
      setPomodoroSeconds(prev => {
        if (prev === 0) {
          setPomodoroMinutes(m => {
            if (m === 0) {
              setPomodoroActive(false);
              return 25;
            }
            return m - 1;
          });
          return 59;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [pomodoroActive]);

  const toggleTask = useCallback((taskId: string) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t));
  }, [setTasks]);

  const addTask = useCallback((dayId: string, title: string) => {
    const newTask: Task = {
      id: `t${Date.now()}`,
      title,
      completed: false,
      priority: 'medium',
      created_at: new Date().toISOString(),
      day: dayId,
    };
    setTasks(prev => [...prev, newTask]);
  }, [setTasks]);

  const deleteTask = useCallback((taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
  }, [setTasks]);

  const addJournalEntry = useCallback((content: string, dayId: string) => {
    setJournal(prev => [...prev, {
      id: `j${Date.now()}`,
      content,
      created_at: new Date().toISOString(),
      mood: 'reflective' as const,
      day: dayId,
    }]);
  }, [setJournal]);

  const togglePomodoro = useCallback(() => setPomodoroActive(p => !p), []);
  const resetPomodoro = useCallback(() => {
    setPomodoroActive(false);
    setPomodoroMinutes(25);
    setPomodoroSeconds(0);
  }, []);

  const toggleZenMode = useCallback(() => setZenMode(z => !z), []);

  return (
    <PlannerContext.Provider value={{
      mode, setMode, days, journal, toggleTask, addTask, deleteTask, addJournalEntry,
      pomodoroMinutes, pomodoroSeconds, pomodoroActive, togglePomodoro, resetPomodoro,
      zenMode, toggleZenMode, todayDayId,
    }}>
      {children}
    </PlannerContext.Provider>
  );
}

export function usePlanner() {
  const ctx = useContext(PlannerContext);
  if (!ctx) throw new Error('usePlanner must be used within PlannerProvider');
  return ctx;
}
