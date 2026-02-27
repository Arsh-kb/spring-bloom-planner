export type LightingMode = 'sun' | 'shade' | 'cave' | 'exam';

export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  created_at: string;
  due_date?: string;
  tags?: string[];
  day: string; // day id
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
  mood?: 'calm' | 'focused' | 'energized' | 'reflective';
  day: string; // day id for grouping
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
