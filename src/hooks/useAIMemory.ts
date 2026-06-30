import { useCallback, useEffect, useRef } from 'react';

interface AIMemory {
  preferredTimeBlock: 'morning' | 'afternoon' | 'evening' | null;
  usualFirstTask: string | null;
  strugglesAfter: string | null; // e.g., "20:00"
  productiveDay: string | null; // e.g., "Tuesday"
  completionPatterns: {
    [date: string]: {
      completed: number;
      total: number;
      timeBlockCompletions: {
        morning: number;
        afternoon: number;
        evening: number;
      };
    };
  };
  focusSessionCount: number;
  totalTasksCompleted: number;
  streakDays: number;
  lastActiveDate: string | null;
  insights: string[];
  firstSeen: string;
}

const DEFAULT_MEMORY: AIMemory = {
  preferredTimeBlock: null,
  usualFirstTask: null,
  strugglesAfter: null,
  productiveDay: null,
  completionPatterns: {},
  focusSessionCount: 0,
  totalTasksCompleted: 0,
  streakDays: 0,
  lastActiveDate: null,
  insights: [],
  firstSeen: new Date().toISOString().split('T')[0],
};

const STORAGE_KEY = 'planner-ai-memory';

export function useAIMemory() {
  const memoryRef = useRef<AIMemory>(DEFAULT_MEMORY);
  const loadedRef = useRef(false);

  // Load memory from localStorage on mount
  useEffect(() => {
    if (loadedRef.current) return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        memoryRef.current = { ...DEFAULT_MEMORY, ...JSON.parse(stored) };
      }
      loadedRef.current = true;
    } catch (e) {
      console.error('Failed to load AI memory:', e);
    }
  }, []);

  // Save memory to localStorage
  const saveMemory = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryRef.current));
    } catch (e) {
      console.error('Failed to save AI memory:', e);
    }
  }, []);

  // Analyze patterns and generate insights
  const analyzePatterns = useCallback((tasks: { date: string; completed: boolean; timeBlock?: string; title?: string }[], today: string) => {
    const memory = memoryRef.current;

    // Update completion patterns for today
    const todayTasks = tasks.filter(t => t.date === today);
    const completed = todayTasks.filter(t => t.completed).length;
    const total = todayTasks.length;

    if (total > 0) {
      memory.completionPatterns[today] = {
        completed,
        total,
        timeBlockCompletions: {
          morning: todayTasks.filter(t => t.timeBlock === 'morning' && t.completed).length,
          afternoon: todayTasks.filter(t => t.timeBlock === 'afternoon' && t.completed).length,
          evening: todayTasks.filter(t => t.timeBlock === 'evening' && t.completed).length,
        },
      };
    }

    // Check streak
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (memory.lastActiveDate === yesterdayStr) {
      // Continue streak
      if (completed > 0) {
        memory.streakDays++;
      }
    } else if (memory.lastActiveDate !== today) {
      // Reset streak
      memory.streakDays = completed > 0 ? 1 : 0;
    }
    memory.lastActiveDate = today;

    // Analyze preferences if we have enough data (at least 3 days)
    const daysWithData = Object.keys(memory.completionPatterns).length;
    if (daysWithData >= 3) {
      // Find preferred time block
      let morning = 0, afternoon = 0, evening = 0;
      Object.values(memory.completionPatterns).forEach(p => {
        morning += p.timeBlockCompletions.morning;
        afternoon += p.timeBlockCompletions.afternoon;
        evening += p.timeBlockCompletions.evening;
      });
      const max = Math.max(morning, afternoon, evening);
      if (max > 0) {
        memory.preferredTimeBlock = morning === max ? 'morning' : afternoon === max ? 'afternoon' : 'evening';
      }

      // Find most productive day
      const dayCompletions: { [key: string]: number } = {};
      Object.entries(memory.completionPatterns).forEach(([date, data]) => {
        const day = new Date(date).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        dayCompletions[day] = (dayCompletions[day] || 0) + (data.completed / data.total);
      });
      const bestDay = Object.entries(dayCompletions).sort((a, b) => b[1] - a[1])[0];
      if (bestDay && bestDay[1] > 0.5) {
        memory.productiveDay = bestDay[0];
      }
    }

    // Generate insights
    memory.insights = [];

    if (memory.streakDays >= 7) {
      memory.insights.push(`🔥 ${memory.streakDays}-day streak! You're on fire!`);
    }

    if (memory.preferredTimeBlock) {
      memory.insights.push(`🌅 You work best in the ${memory.preferredTimeBlock}`);
    }

    if (memory.productiveDay) {
      memory.insights.push(`📅 ${memory.productiveDay.charAt(0).toUpperCase() + memory.productiveDay.slice(1)} is your most productive day`);
    }

    if (daysWithData >= 7) {
      const recentWeek = Object.values(memory.completionPatterns).slice(-7);
      const avgCompletion = recentWeek.reduce((sum, d) => sum + (d.completed / d.total), 0) / recentWeek.length;
      if (avgCompletion > 0.8) {
        memory.insights.push('🎯 Amazing week! You\'re crushing your goals.');
      }
    }

    saveMemory();
  }, [saveMemory]);

  // Record task completion
  const recordCompletion = useCallback((completed: boolean, task?: { title?: string; timeBlock?: string }) => {
    const memory = memoryRef.current;

    if (completed) {
      memory.totalTasksCompleted++;

      if (task?.title && !memory.usualFirstTask) {
        // First task seen - could be their usual first task
        memory.usualFirstTask = task.title;
      }
    }

    saveMemory();
  }, [saveMemory]);

  // Record focus session
  const recordFocusSession = useCallback(() => {
    memoryRef.current.focusSessionCount++;
    saveMemory();
  }, [saveMemory]);

  // Get memory for AI context
  const getMemoryContext = useCallback(() => {
    const m = memoryRef.current;
    return {
      preferredTimeBlock: m.preferredTimeBlock,
      usualFirstTask: m.usualFirstTask,
      strugglesAfter: m.strugglesAfter,
      productiveDay: m.productiveDay,
      streakDays: m.streakDays,
      totalTasksCompleted: m.totalTasksCompleted,
      insights: m.insights,
      daysTracked: Object.keys(m.completionPatterns).length,
    };
  }, []);

  return {
    memory: memoryRef.current,
    analyzePatterns,
    recordCompletion,
    recordFocusSession,
    getMemoryContext,
  };
}