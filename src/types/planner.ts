export type LightingMode = 'sun' | 'shade' | 'cave' | 'exam';

export type TaskPriority = 'low' | 'medium' | 'high';
export type JournalMood = 'calm' | 'focused' | 'energized' | 'reflective';
export type TaskMood = 'high-strain' | 'reflective' | 'routine' | 'energizing';
export type TimeBlock = 'morning' | 'afternoon' | 'evening';
export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

export interface SubIntention {
  id: string;
  title: string;
  completed: boolean;
}

export type TaskRecurrence = 'daily' | 'weekday' | 'weekly' | null;

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
  subIntentions?: SubIntention[];
  recurrence?: TaskRecurrence;
  sortOrder?: number;
  // Scheduling engine fields
  estimatedMinutes?: number;
  dependsOn?: string[];
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
  warmth: number;
  contrast: number;
  depth: number;
}

export interface TimeCapsule {
  tasks: Task[];
  journal: JournalEntry[];
  createdAt: string;
}

export interface ShadowSuggestion {
  text: string;
  priority: TaskPriority;
  mood?: TaskMood;
  timeBlock?: TimeBlock;
}

export interface FocusSession {
  id: string;
  taskId: string | null;
  taskTitle: string;
  duration: number; // seconds
  tabSwitches: number;
  completedAt: string;
}

export interface TaskTemplate {
  id: string;
  name: string;
  tasks: Array<{
    title: string;
    priority: TaskPriority;
    mood?: TaskMood;
    timeBlock?: TimeBlock;
    recurrence?: TaskRecurrence;
    dayIndex: number; // 0-6, Mon-Sun
  }>;
}

export interface PlannerState {
  mode: LightingMode;
  days: Day[];
  journal: JournalEntry[];
  pomodoroMinutes: number;
  pomodoroActive: boolean;
  currentDayIndex: number;
  zenMode: boolean;
  deepFocusActive: boolean;
  focusTaskId: string | null;
}

// ===== AI Executive Assistant Types =====

export type TaskRisk = 'low' | 'medium' | 'high';

export interface AIExplanation {
  id: string;
  action: 'move' | 'reschedule' | 'priority_change' | 'split' | 'recovery' | 'reflection' | 'risk_warning';
  taskId?: string;
  reason: string;
  confidence: number;
  timestamp: string;
  model: string;
  details?: Record<string, unknown>;
}

export interface PlannerSnapshot {
  id: string;
  timestamp: string;
  tasks: Task[];
  journal: JournalEntry[];
  description: string;
}

export interface ConfidenceScore {
  overall: number;
  momentum: 'up' | 'flat' | 'down';
  completedToday: number;
  totalToday: number;
  overdueCount: number;
  riskTasks: number;
}

export interface RecoveryProposal {
  summary: string;
  changes: Array<{
    type: 'move' | 'remove' | 'reschedule';
    taskId: string;
    fromDate: string;
    toDate?: string;
    reason: string;
  }>;
  newConfidence: number;
  oldConfidence: number;
}

export interface MissionReport {
  completionProbability: number;
  deepWorkHours: number;
  recoveryTime: number;
  highRiskTasks: number;
  protectedFocusBlocks: number;
  schedulingStrategy: string;
  generatedAt: string;
}
