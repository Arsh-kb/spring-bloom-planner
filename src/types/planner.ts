export type LightingMode = 'sun' | 'shade' | 'cave' | 'exam';

export type TaskPriority = 'low' | 'medium' | 'high';
export type JournalMood = 'calm' | 'focused' | 'energized' | 'reflective';
export type TaskMood = 'high-strain' | 'reflective' | 'routine' | 'energizing';
export type TimeBlock = 'morning' | 'afternoon' | 'evening';
export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: TaskPriority;
  created_at: string;
  due_date?: string;
  tags?: string[];
  date: string;
  mood?: TaskMood;
  timeBlock?: TimeBlock;
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
  date: string;
}

export interface MoodTint {
  warmth: number;   // -50 to +50
  contrast: number;  // -30 to +30
  depth: number;     // 0 to 100
}

export interface TimeCapsule {
  tasks: Task[];
  journal: JournalEntry[];
  createdAt: string;
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
