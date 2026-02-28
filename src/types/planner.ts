export type LightingMode = 'sun' | 'shade' | 'cave' | 'exam';

export type TaskPriority = 'low' | 'medium' | 'high';
export type JournalMood = 'calm' | 'focused' | 'energized' | 'reflective';

export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: TaskPriority;
  created_at: string;
  due_date?: string;
  tags?: string[];
  date: string; // CHANGED from 'day' so pagination works properly
}

export interface Day {
  id: string;
  name: string;
  short: string;
  date: string;
  tasks: Task[];
  image: string;
}

export interface JournalEntry {
  id: string;
  content: string;
  created_at: string;
  mood?: JournalMood;
  date: string; // CHANGED from 'day' so entries stick to the calendar
}

export interface PlannerState {
  mode: LightingMode;
  days: Day[];
  journal: JournalEntry[];
  pomodoroMinutes: number;
  pomodoroActive: boolean;
  currentDayIndex: number;
  zenMode: boolean;
} 