import type { TaskMood, TimeBlock, TaskPriority, LightingMode, Task } from '@/types/planner';

interface AISuggestion {
  title: string;
  priority: TaskPriority;
  mood?: TaskMood;
  timeBlock?: TimeBlock;
  dayIndex: number; // 0-6
}

interface TaskPool {
  category: string;
  keywords: string[];
  tasks: Array<{
    title: string;
    priority: TaskPriority;
    mood?: TaskMood;
    preferredBlock?: TimeBlock;
  }>;
}

const taskPools: TaskPool[] = [
  {
    category: 'deep-work',
    keywords: ['focus', 'deep', 'code', 'build', 'develop', 'write', 'create', 'productive', 'work', 'ship', 'feature'],
    tasks: [
      { title: 'Deep work: main project (2h block)', priority: 'high', mood: 'high-strain', preferredBlock: 'morning' },
      { title: 'Code review & PR feedback', priority: 'medium', mood: 'routine', preferredBlock: 'morning' },
      { title: 'Architect new module design', priority: 'high', mood: 'high-strain', preferredBlock: 'morning' },
      { title: 'Write documentation for API', priority: 'medium', mood: 'reflective', preferredBlock: 'afternoon' },
      { title: 'Refactor legacy component', priority: 'medium', mood: 'high-strain', preferredBlock: 'afternoon' },
      { title: 'Ship feature to staging', priority: 'high', mood: 'energizing', preferredBlock: 'afternoon' },
      { title: 'Debug & fix critical bug', priority: 'high', mood: 'high-strain', preferredBlock: 'morning' },
      { title: 'Write unit tests for core logic', priority: 'medium', mood: 'routine', preferredBlock: 'afternoon' },
    ],
  },
  {
    category: 'wellness',
    keywords: ['health', 'wellness', 'relax', 'rest', 'exercise', 'walk', 'meditate', 'yoga', 'self-care', 'calm', 'recharge'],
    tasks: [
      { title: 'Morning meditation (10 min)', priority: 'medium', mood: 'reflective', preferredBlock: 'morning' },
      { title: 'Stretch & body scan', priority: 'low', mood: 'routine', preferredBlock: 'morning' },
      { title: 'Afternoon walk in nature', priority: 'low', mood: 'energizing', preferredBlock: 'afternoon' },
      { title: 'Yoga or movement session', priority: 'medium', mood: 'energizing', preferredBlock: 'evening' },
      { title: 'Digital sunset — no screens after 9pm', priority: 'low', mood: 'reflective', preferredBlock: 'evening' },
      { title: 'Journaling: 3 gratitudes', priority: 'low', mood: 'reflective', preferredBlock: 'evening' },
      { title: 'Prepare a nourishing meal', priority: 'low', mood: 'routine', preferredBlock: 'evening' },
    ],
  },
  {
    category: 'admin',
    keywords: ['organize', 'admin', 'plan', 'email', 'inbox', 'clean', 'review', 'budget', 'meeting', 'schedule'],
    tasks: [
      { title: 'Inbox zero pass', priority: 'medium', mood: 'routine', preferredBlock: 'morning' },
      { title: 'Weekly calendar review', priority: 'medium', mood: 'routine', preferredBlock: 'morning' },
      { title: 'Update project board & tickets', priority: 'medium', mood: 'routine', preferredBlock: 'afternoon' },
      { title: 'File & organize documents', priority: 'low', mood: 'routine', preferredBlock: 'afternoon' },
      { title: 'Reply to pending messages', priority: 'medium', mood: 'routine', preferredBlock: 'morning' },
      { title: 'Budget check & expenses', priority: 'low', mood: 'routine', preferredBlock: 'afternoon' },
    ],
  },
  {
    category: 'creative',
    keywords: ['creative', 'design', 'art', 'draw', 'sketch', 'brainstorm', 'idea', 'prototype', 'explore', 'experiment'],
    tasks: [
      { title: 'Brainstorm session (freeform)', priority: 'medium', mood: 'energizing', preferredBlock: 'morning' },
      { title: 'Sketch UI wireframes', priority: 'medium', mood: 'energizing', preferredBlock: 'morning' },
      { title: 'Explore new design patterns', priority: 'low', mood: 'reflective', preferredBlock: 'afternoon' },
      { title: 'Creative writing (30 min)', priority: 'low', mood: 'reflective', preferredBlock: 'evening' },
      { title: 'Build a quick prototype', priority: 'high', mood: 'energizing', preferredBlock: 'afternoon' },
      { title: 'Mood board for next project', priority: 'low', mood: 'energizing', preferredBlock: 'afternoon' },
    ],
  },
  {
    category: 'study',
    keywords: ['study', 'learn', 'read', 'course', 'tutorial', 'research', 'practice', 'exam', 'review', 'notes'],
    tasks: [
      { title: 'Study session: focused reading (1h)', priority: 'high', mood: 'high-strain', preferredBlock: 'morning' },
      { title: 'Review & organize notes', priority: 'medium', mood: 'reflective', preferredBlock: 'afternoon' },
      { title: 'Practice problems / exercises', priority: 'high', mood: 'high-strain', preferredBlock: 'morning' },
      { title: 'Watch tutorial / lecture', priority: 'medium', mood: 'routine', preferredBlock: 'afternoon' },
      { title: 'Teach concept to rubber duck', priority: 'medium', mood: 'energizing', preferredBlock: 'afternoon' },
      { title: 'Flashcard review (spaced rep)', priority: 'medium', mood: 'routine', preferredBlock: 'evening' },
    ],
  },
  {
    category: 'social',
    keywords: ['social', 'friend', 'family', 'call', 'catch up', 'hangout', 'community', 'team', 'collaborate'],
    tasks: [
      { title: 'Catch up call with a friend', priority: 'low', mood: 'energizing', preferredBlock: 'evening' },
      { title: 'Team sync / standup', priority: 'medium', mood: 'routine', preferredBlock: 'morning' },
      { title: 'Write a thoughtful message', priority: 'low', mood: 'reflective', preferredBlock: 'evening' },
      { title: 'Pair programming session', priority: 'medium', mood: 'energizing', preferredBlock: 'afternoon' },
      { title: 'Community contribution', priority: 'low', mood: 'energizing', preferredBlock: 'afternoon' },
    ],
  },
];

const modeWeights: Record<LightingMode, Record<string, number>> = {
  sun: { 'deep-work': 1, wellness: 1, admin: 1, creative: 1.2, study: 1, social: 1 },
  shade: { 'deep-work': 0.8, wellness: 1.3, admin: 0.8, creative: 1, study: 1, social: 1.2 },
  cave: { 'deep-work': 1.5, wellness: 0.5, admin: 0.5, creative: 1.2, study: 1.3, social: 0.3 },
  exam: { 'deep-work': 1.2, wellness: 0.6, admin: 0.4, creative: 0.5, study: 1.8, social: 0.3 },
};

// Day-of-week tendencies (0=Mon, 6=Sun)
const dayWeights: Record<string, number[]> = {
  'deep-work': [1.3, 1.2, 1.2, 1.1, 0.8, 0.4, 0.3],
  wellness:    [0.8, 0.9, 1.0, 1.0, 1.1, 1.4, 1.5],
  admin:       [1.3, 1.0, 1.0, 1.0, 1.3, 0.5, 0.3],
  creative:    [0.8, 1.0, 1.2, 1.0, 1.0, 1.3, 1.0],
  study:       [1.2, 1.1, 1.1, 1.1, 0.9, 1.0, 0.8],
  social:      [0.6, 0.7, 0.8, 0.9, 1.3, 1.5, 1.3],
};

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function generateSuggestions(
  prompt: string,
  mode: LightingMode,
  targetDayIndex: number,
  existingTasks: Task[],
  count: number = 4
): AISuggestion[] {
  const lower = prompt.toLowerCase();
  const existingTitles = new Set(existingTasks.map(t => t.title.toLowerCase()));

  // Score each pool
  const scored = taskPools.map(pool => {
    let score = 0;
    // Keyword matching
    for (const kw of pool.keywords) {
      if (lower.includes(kw)) score += 2;
    }
    // If no keywords matched, give a small base score
    if (score === 0) score = 0.3;
    // Mode weight
    score *= modeWeights[mode][pool.category] || 1;
    // Day weight
    score *= dayWeights[pool.category]?.[targetDayIndex] || 1;
    return { pool, score };
  });

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  const suggestions: AISuggestion[] = [];
  
  for (const { pool } of scored) {
    if (suggestions.length >= count) break;
    const available = shuffleArray(
      pool.tasks.filter(t => !existingTitles.has(t.title.toLowerCase()))
    );
    for (const task of available) {
      if (suggestions.length >= count) break;
      suggestions.push({
        title: task.title,
        priority: task.priority,
        mood: task.mood,
        timeBlock: task.preferredBlock,
        dayIndex: targetDayIndex,
      });
    }
  }

  return suggestions;
}

export function getQuickPrompts(mode: LightingMode): string[] {
  const base = ['Productive morning', 'Balanced day', 'Light & easy'];
  const modePrompts: Record<LightingMode, string[]> = {
    sun: ['Creative energy', 'Social & collaborative'],
    shade: ['Gentle & restful', 'Nature-inspired'],
    cave: ['Deep focus sprint', 'Code marathon'],
    exam: ['Study intensive', 'Practice & review'],
  };
  return [...base, ...modePrompts[mode]];
}
