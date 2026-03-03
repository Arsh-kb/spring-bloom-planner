import { useState, useEffect, useRef, useMemo } from 'react';
import { usePlanner } from '@/context/PlannerContext';
import type { TaskMood, TaskPriority } from '@/types/planner';

const moodColors: Record<string, string> = {
  'high-strain': 'hsla(15, 75%, 55%, 0.9)',
  'reflective': 'hsla(215, 40%, 60%, 0.9)',
  'routine': 'hsla(38, 15%, 55%, 0.6)',
  'energizing': 'hsla(80, 55%, 50%, 0.9)',
};

interface TaskSearchProps {
  open: boolean;
  onClose: () => void;
}

type FilterChip = { type: 'mood'; value: TaskMood } | { type: 'priority'; value: TaskPriority } | { type: 'status'; value: 'completed' | 'active' };

export function TaskSearch({ open, onClose }: TaskSearchProps) {
  const { tasks, setWeekOffset } = usePlanner();
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<FilterChip[]>([]);
  const [highlightedTask, setHighlightedTask] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setFilters([]);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const filteredTasks = useMemo(() => {
    let result = [...tasks];

    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        t.tags?.some(tag => tag.toLowerCase().includes(q))
      );
    }

    for (const f of filters) {
      if (f.type === 'mood') result = result.filter(t => t.mood === f.value);
      if (f.type === 'priority') result = result.filter(t => t.priority === f.value);
      if (f.type === 'status') result = result.filter(t => f.value === 'completed' ? t.completed : !t.completed);
    }

    return result.slice(0, 20);
  }, [tasks, query, filters]);

  const toggleFilter = (chip: FilterChip) => {
    setFilters(prev => {
      const exists = prev.some(f => f.type === chip.type && f.value === chip.value);
      if (exists) return prev.filter(f => !(f.type === chip.type && f.value === chip.value));
      return [...prev.filter(f => f.type !== chip.type), chip];
    });
  };

  const isActive = (type: string, value: string) => filters.some(f => f.type === type && f.value === value);

  const handleTaskClick = (taskDate: string, taskId: string) => {
    // Calculate week offset for that date
    const taskDateObj = new Date(taskDate);
    const now = new Date();
    const currentDay = now.getDay();
    const diff = now.getDate() - currentDay + (currentDay === 0 ? -6 : 1);
    const thisMonday = new Date(now);
    thisMonday.setDate(diff);
    thisMonday.setHours(0, 0, 0, 0);
    const taskMonday = new Date(taskDateObj);
    const taskDay = taskDateObj.getDay();
    const taskDiff = taskDateObj.getDate() - taskDay + (taskDay === 0 ? -6 : 1);
    taskMonday.setDate(taskDiff);
    taskMonday.setHours(0, 0, 0, 0);
    const weekDiff = Math.round((taskMonday.getTime() - thisMonday.getTime()) / (7 * 86400000));
    setWeekOffset(weekDiff);
    setHighlightedTask(taskId);
    setTimeout(() => {
      setHighlightedTask(null);
      onClose();
    }, 1500);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[65] flex items-start justify-center pt-[15vh]">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative z-10 w-full max-w-lg glass-panel rounded-2xl overflow-hidden shadow-2xl"
        style={{ boxShadow: '0 24px 64px rgba(0,0,0,0.6)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-foreground/10">
          <span className="text-foreground/40 text-sm">🔍</span>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search tasks across all weeks..."
            className="flex-1 bg-transparent text-sm font-body text-foreground/90 placeholder:text-foreground/30 outline-none"
            style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
          />
          <kbd className="text-[9px] font-body text-foreground/30 bg-black/20 px-1.5 py-0.5 rounded border border-foreground/10">ESC</kbd>
        </div>

        {/* Filter chips */}
        <div className="flex flex-wrap gap-1.5 px-5 py-3 border-b border-foreground/10">
          {(['high', 'medium', 'low'] as TaskPriority[]).map(p => (
            <button
              key={p}
              onClick={() => toggleFilter({ type: 'priority', value: p })}
              className={`text-[10px] font-body px-2 py-1 rounded-full border transition-colors ${
                isActive('priority', p) ? 'bg-primary/20 border-primary/40 text-foreground/90' : 'border-foreground/10 text-foreground/50 hover:bg-white/5'
              }`}
            >
              {p === 'high' ? '🍒' : p === 'medium' ? '🌿' : '🍂'} {p}
            </button>
          ))}
          {(['high-strain', 'reflective', 'routine', 'energizing'] as TaskMood[]).map(m => (
            <button
              key={m}
              onClick={() => toggleFilter({ type: 'mood', value: m })}
              className={`text-[10px] font-body px-2 py-1 rounded-full border transition-colors flex items-center gap-1 ${
                isActive('mood', m) ? 'bg-primary/20 border-primary/40 text-foreground/90' : 'border-foreground/10 text-foreground/50 hover:bg-white/5'
              }`}
            >
              <span className="w-[5px] h-[5px] rounded-full inline-block" style={{ backgroundColor: moodColors[m] }} />
              {m}
            </button>
          ))}
          <button
            onClick={() => toggleFilter({ type: 'status', value: 'completed' })}
            className={`text-[10px] font-body px-2 py-1 rounded-full border transition-colors ${
              isActive('status', 'completed') ? 'bg-primary/20 border-primary/40 text-foreground/90' : 'border-foreground/10 text-foreground/50 hover:bg-white/5'
            }`}
          >
            ✓ done
          </button>
          <button
            onClick={() => toggleFilter({ type: 'status', value: 'active' })}
            className={`text-[10px] font-body px-2 py-1 rounded-full border transition-colors ${
              isActive('status', 'active') ? 'bg-primary/20 border-primary/40 text-foreground/90' : 'border-foreground/10 text-foreground/50 hover:bg-white/5'
            }`}
          >
            ○ active
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[40vh] overflow-y-auto scrollbar-thin px-2 py-2">
          {filteredTasks.length === 0 ? (
            <p className="text-center text-xs font-body text-foreground/30 py-8 italic">No tasks found</p>
          ) : (
            filteredTasks.map(task => (
              <button
                key={task.id}
                onClick={() => handleTaskClick(task.date, task.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-white/10 transition-colors ${
                  highlightedTask === task.id ? 'bg-primary/20 ring-1 ring-primary/40' : ''
                }`}
              >
                <span className="text-[11px] flex-shrink-0">
                  {task.priority === 'high' ? '🍒' : task.priority === 'medium' ? '🌿' : '🍂'}
                </span>
                {task.mood && (
                  <span className="w-[5px] h-[5px] rounded-full flex-shrink-0" style={{ backgroundColor: moodColors[task.mood] }} />
                )}
                <div className="flex-1 min-w-0">
                  <span className={`text-sm font-body block truncate ${task.completed ? 'text-foreground/40 line-through' : 'text-foreground/90'}`}>
                    {task.title}
                  </span>
                  {task.tags && task.tags.length > 0 && (
                    <div className="flex gap-1 mt-0.5">
                      {task.tags.map(tag => (
                        <span key={tag} className="text-[9px] bg-primary/10 text-primary/70 px-1.5 py-0.5 rounded-full">{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
                <span className="text-[10px] font-body text-foreground/40 flex-shrink-0">
                  {new Date(task.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${task.completed ? 'bg-primary/50' : 'border border-foreground/30'}`} />
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
