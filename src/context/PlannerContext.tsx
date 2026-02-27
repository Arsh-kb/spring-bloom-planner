import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { LightingMode, Day, JournalEntry, Task } from '@/types/planner';

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

const mockTasks: Task[][] = [
  [
    { id: '1', title: 'Morning meditation', completed: true, priority: 'medium', created_at: new Date().toISOString() },
    { id: '2', title: 'Review sprint backlog', completed: false, priority: 'high', created_at: new Date().toISOString() },
  ],
  [
    { id: '3', title: 'Plant the herb garden', completed: false, priority: 'low', created_at: new Date().toISOString() },
  ],
  [
    { id: '4', title: 'Deep work: feature branch', completed: false, priority: 'high', created_at: new Date().toISOString() },
    { id: '5', title: 'Read 30 pages', completed: false, priority: 'medium', created_at: new Date().toISOString() },
  ],
  [
    { id: '6', title: 'Team standup', completed: false, priority: 'medium', created_at: new Date().toISOString() },
  ],
  [
    { id: '7', title: 'Weekly review', completed: false, priority: 'high', created_at: new Date().toISOString() },
    { id: '8', title: 'Sunset walk', completed: false, priority: 'low', created_at: new Date().toISOString() },
  ],
  [
    { id: '9', title: 'Nature journaling', completed: false, priority: 'low', created_at: new Date().toISOString() },
  ],
  [
    { id: '10', title: 'Rest & recharge', completed: false, priority: 'low', created_at: new Date().toISOString() },
  ],
];

const dates = getWeekDates();

const initialDays: Day[] = dayNames.map((name, i) => ({
  id: `day-${i}`,
  name,
  short: dayShorts[i],
  date: dates[i],
  tasks: mockTasks[i],
  image: dayImages[i],
}));

const initialJournal: JournalEntry[] = [
  { id: 'j1', content: 'The morning light through the trees reminded me why I chose this path.', created_at: new Date().toISOString(), mood: 'reflective' },
  { id: 'j2', content: 'Productive afternoon — shipped two features and took a break by the creek.', created_at: new Date().toISOString(), mood: 'focused' },
];

interface PlannerContextType {
  mode: LightingMode;
  setMode: (m: LightingMode) => void;
  days: Day[];
  journal: JournalEntry[];
  toggleTask: (dayId: string, taskId: string) => void;
  addJournalEntry: (content: string) => void;
  pomodoroMinutes: number;
  pomodoroSeconds: number;
  pomodoroActive: boolean;
  togglePomodoro: () => void;
  resetPomodoro: () => void;
}

const PlannerContext = createContext<PlannerContextType | null>(null);

export function PlannerProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<LightingMode>('sun');
  const [days, setDays] = useState<Day[]>(initialDays);
  const [journal, setJournal] = useState<JournalEntry[]>(initialJournal);
  const [pomodoroMinutes, setPomodoroMinutes] = useState(25);
  const [pomodoroSeconds, setPomodoroSeconds] = useState(0);
  const [pomodoroActive, setPomodoroActive] = useState(false);

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

  const toggleTask = useCallback((dayId: string, taskId: string) => {
    setDays(prev => prev.map(d => d.id === dayId ? {
      ...d,
      tasks: d.tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t)
    } : d));
  }, []);

  const addJournalEntry = useCallback((content: string) => {
    setJournal(prev => [...prev, {
      id: `j${Date.now()}`,
      content,
      created_at: new Date().toISOString(),
      mood: 'reflective',
    }]);
  }, []);

  const togglePomodoro = useCallback(() => setPomodoroActive(p => !p), []);
  const resetPomodoro = useCallback(() => {
    setPomodoroActive(false);
    setPomodoroMinutes(25);
    setPomodoroSeconds(0);
  }, []);

  return (
    <PlannerContext.Provider value={{
      mode, setMode, days, journal, toggleTask, addJournalEntry,
      pomodoroMinutes, pomodoroSeconds, pomodoroActive, togglePomodoro, resetPomodoro,
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
