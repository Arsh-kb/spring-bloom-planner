import { useMemo } from 'react';
import { usePlanner } from '@/context/PlannerContext';
import type { ShadowSuggestion, LightingMode } from '@/types/planner';

const modeSuggestions: Record<LightingMode, ShadowSuggestion[]> = {
  sun: [
    { text: 'Team standup', priority: 'medium', mood: 'routine', timeBlock: 'morning' },
    { text: 'Nature walk', priority: 'low', mood: 'energizing', timeBlock: 'afternoon' },
    { text: 'Brainstorm session', priority: 'medium', mood: 'energizing', timeBlock: 'morning' },
  ],
  shade: [
    { text: 'Focused reading', priority: 'medium', mood: 'reflective', timeBlock: 'afternoon' },
    { text: 'Write documentation', priority: 'medium', mood: 'routine', timeBlock: 'afternoon' },
    { text: 'Review & plan', priority: 'high', mood: 'reflective', timeBlock: 'evening' },
  ],
  cave: [
    { text: 'Deep work session', priority: 'high', mood: 'high-strain', timeBlock: 'morning' },
    { text: 'Code review', priority: 'high', mood: 'high-strain', timeBlock: 'afternoon' },
    { text: 'Architecture planning', priority: 'high', mood: 'reflective', timeBlock: 'evening' },
  ],
  exam: [
    { text: 'Study block', priority: 'high', mood: 'high-strain', timeBlock: 'morning' },
    { text: 'Practice problems', priority: 'high', mood: 'routine', timeBlock: 'afternoon' },
    { text: 'Review notes', priority: 'medium', mood: 'reflective', timeBlock: 'evening' },
  ],
};

interface ShadowPlanningProps {
  dayId: string;
}

export function ShadowPlanning({ dayId }: ShadowPlanningProps) {
  const { mode, tasks, addTask, todayDayId } = usePlanner();

  const suggestions = useMemo(() => {
    const dayTasks = tasks.filter(t => t.date === dayId);
    const existing = dayTasks.map(t => t.title.toLowerCase());
    return modeSuggestions[mode].filter(s => !existing.some(e => e.includes(s.text.toLowerCase().split(' ')[0])));
  }, [mode, tasks, dayId]);

  // Ghost deadline detection: tasks older than 3 days that aren't completed
  const ghostTasks = useMemo(() => {
    return tasks.filter(t => {
      if (t.completed || t.date !== dayId) return false;
      const age = Math.floor((Date.now() - new Date(t.created_at).getTime()) / 86400000);
      return age > 3;
    });
  }, [tasks, dayId]);

  if (dayId !== todayDayId || (suggestions.length === 0 && ghostTasks.length === 0)) return null;

  return (
    <div className="space-y-1.5 mt-2">
      {/* Ghost deadlines */}
      {ghostTasks.length > 0 && (
        <div className="px-1 py-0.5">
          <span className="text-[10px] font-display italic text-destructive/80" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
            {ghostTasks.length} task{ghostTasks.length > 1 ? 's' : ''} aging
          </span>
        </div>
      )}

      {/* Shadow suggestions - Turned into tactile ghost buttons */}
      {suggestions.slice(0, 2).map((s, i) => (
        <button
          key={i}
          onClick={() => addTask(dayId, s.text, s.priority, s.mood, s.timeBlock)}
          className="w-full text-left flex items-center gap-1.5 px-2 py-1 rounded-md bg-black/5 hover:bg-black/15 border border-white/5 hover:border-white/10 transition-all group/shadow shadow-sm"
        >
          <span className="text-[10px] text-foreground/50 font-body italic group-hover/shadow:text-foreground/90 transition-colors" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>+ {s.text}</span>
        </button>
      ))}
    </div>
  );
}