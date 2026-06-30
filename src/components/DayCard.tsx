import { useState, useEffect, useRef } from 'react';
import type { Day, TaskMood, TimeBlock, TaskRecurrence } from '@/types/planner';
import { usePlanner } from '@/context/PlannerContext';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableTask } from './SortableTask';
import { ShadowPlanning } from './ShadowPlanning';
import { FloraGrowth } from './FloraGrowth';
import { CompletionSparkle } from './CompletionSparkle';

interface DayCardProps {
  day: Day;
  isToday: boolean;
  isExpanded: boolean;
  weekConfidence?: number;
  onZoom?: (day: Day) => void;
}

const moodCycle: (TaskMood | undefined)[] = [undefined, 'routine', 'reflective', 'high-strain', 'energizing'];
const moodDots: Record<string, string> = {
  'routine': 'hsla(38, 15%, 55%, 0.6)',
  'reflective': 'hsla(215, 40%, 60%, 0.9)',
  'high-strain': 'hsla(15, 75%, 55%, 0.9)',
  'energizing': 'hsla(80, 55%, 50%, 0.9)',
};

const timeBlockCycle: (TimeBlock | undefined)[] = [undefined, 'morning', 'afternoon', 'evening'];
const timeBlockIcons: Record<string, string> = { morning: '🌅', afternoon: '☀️', evening: '🌙' };
const recurrenceCycle: (TaskRecurrence | undefined)[] = [undefined, 'daily', 'weekday', 'weekly'];
const recurrenceLabels: Record<string, string> = { daily: '🔄', weekday: '📅', weekly: '📌' };

const timeBlockTints: Record<string, { bg: string; label: string }> = {
  morning: { bg: 'hsla(38, 60%, 70%, 0.08)', label: 'Morning' },
  afternoon: { bg: 'hsla(0, 0%, 100%, 0.05)', label: 'Afternoon' },
  evening: { bg: 'hsla(220, 40%, 60%, 0.08)', label: 'Evening' },
};

export function DayCard({ day, isToday, isExpanded, weekConfidence, onZoom }: DayCardProps) {
  const { addTask, enterDeepFocus } = usePlanner();
  const [newTaskText, setNewTaskText] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [mood, setMood] = useState<TaskMood | undefined>(undefined);
  const [timeBlock, setTimeBlock] = useState<TimeBlock | undefined>(undefined);
  const [recurrence, setRecurrence] = useState<TaskRecurrence | undefined>(undefined);
  const completedCount = day.tasks.filter(t => t.completed).length;
  const allComplete = day.tasks.length > 0 && completedCount === day.tasks.length;
  const [showSparkle, setShowSparkle] = useState(false);
  const prevAllComplete = useRef(false);

  useEffect(() => {
    if (allComplete && !prevAllComplete.current) {
      setShowSparkle(true);
      const timer = setTimeout(() => setShowSparkle(false), 1500);
      return () => clearTimeout(timer);
    }
    prevAllComplete.current = allComplete;
  }, [allComplete]);

  const { setNodeRef, isOver } = useDroppable({ id: day.id, data: { type: 'Day', day } });
  const isVideo = day.image.endsWith('.mp4') || day.image.endsWith('.webm');

  const handleAddTask = () => {
    if (!newTaskText.trim()) return;
    addTask(day.id, newTaskText.trim(), priority, mood, timeBlock, recurrence || null);
    setNewTaskText('');
    setPriority('medium');
    setMood(undefined);
    setTimeBlock(undefined);
    setRecurrence(undefined);
  };

  const cyclePriority = () => {
    const seq: ('low' | 'medium' | 'high')[] = ['low', 'medium', 'high'];
    setPriority(seq[(seq.indexOf(priority) + 1) % seq.length]);
  };

  const cycleMood = () => setMood(moodCycle[(moodCycle.indexOf(mood) + 1) % moodCycle.length]);
  const cycleTimeBlock = () => setTimeBlock(timeBlockCycle[(timeBlockCycle.indexOf(timeBlock) + 1) % timeBlockCycle.length]);
  const cycleRecurrence = () => setRecurrence(recurrenceCycle[(recurrenceCycle.indexOf(recurrence) + 1) % recurrenceCycle.length]);

  const handleHeaderClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, input, [role="checkbox"]')) return;
    onZoom?.(day);
  };

  const ungrouped = day.tasks.filter(t => !t.timeBlock);
  const grouped = (['morning', 'afternoon', 'evening'] as TimeBlock[])
    .map(tb => ({ block: tb, tasks: day.tasks.filter(t => t.timeBlock === tb) }))
    .filter(g => g.tasks.length > 0);

  const allTaskIds = day.tasks.map(t => t.id);

  const hasGhostDeadline = day.tasks.some(t => {
    if (t.completed) return false;
    const age = Math.floor((Date.now() - new Date(t.created_at).getTime()) / 86400000);
    return age > 5;
  });

  return (
    <div
      ref={setNodeRef}
      className={`glass-panel rounded-lg overflow-hidden transition-all duration-500 flex flex-col group relative ${
        isToday ? 'ring-1 ring-primary/40' : ''
      } ${isOver ? 'ring-2 ring-primary bg-white/10 scale-[1.02]' : 'hover:scale-[1.02]'}
      ${hasGhostDeadline ? 'ring-1 ring-destructive/15' : ''}`}
    >
      <FloraGrowth day={day} />
      {showSparkle && <CompletionSparkle />}

      {/* --- Living Header --- */}
      <div className="relative h-20 sm:h-24 overflow-hidden flex-shrink-0 cursor-pointer" onClick={handleHeaderClick}>
        {isVideo ? (
          <video src={day.image} autoPlay loop muted playsInline className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
        ) : (
          <img src={day.image} alt={day.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/10" />
        <div className="absolute bottom-2 left-3 right-3 flex items-end justify-between pointer-events-none">
          <h3 className="font-display text-foreground text-base sm:text-lg font-semibold text-nature leading-tight drop-shadow-lg">{day.name}</h3>
          <span className="font-body text-[10px] sm:text-xs text-foreground/80 text-nature drop-shadow-md">
            {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        </div>
        {isToday && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary shadow-lg shadow-primary/50" />}
        <FloraGrowth day={day} isHeader />
      </div>

      {/* --- Collapsed Summary --- */}
      {!isExpanded && day.tasks.length > 0 && (
        <div className="px-3 py-2 flex items-center justify-between text-[10px] font-body">
          <div className="flex items-center gap-3">
            <span className="text-foreground/60">
              {completedCount}/{day.tasks.length} done
            </span>
            {day.tasks.length > 0 && (
              <div className="flex items-center gap-1">
                <div className="w-12 h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${(completedCount / day.tasks.length) * 100}%`,
                      backgroundColor: completedCount === day.tasks.length ? 'hsl(150, 60%, 45%)' : 'hsl(38, 60%, 55%)'
                    }}
                  />
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {weekConfidence !== undefined && (
              <span className={`${weekConfidence >= 70 ? 'text-green-400/70' : weekConfidence >= 40 ? 'text-amber-400/70' : 'text-red-400/70'}`}>
                {Math.round(weekConfidence)}%
              </span>
            )}
            <span className="text-foreground/40">
              {day.tasks.length} task{day.tasks.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      )}

      {/* --- Tasks Content - stronger scrim --- */}
      {isExpanded && (
        <div className="p-3 space-y-1 flex-1 flex flex-col relative">
          {/* Dark scrim behind task content for readability */}
          <div className="absolute inset-0 bg-background/60 pointer-events-none rounded-b-lg" />

          <div className="relative z-[1]">
            <SortableContext items={allTaskIds} strategy={verticalListSortingStrategy}>
              {day.tasks.length === 0 && newTaskText === '' ? (
                <p className="text-foreground/50 text-xs italic font-body py-2 drop-shadow-md">No tasks yet</p>
              ) : (
                <>
                  {ungrouped.map(task => <SortableTask key={task.id} task={task} />)}
                  {grouped.map(({ block, tasks }) => (
                    <div key={block} className="mt-1">
                      <div className="flex items-center gap-2 py-0.5 px-1 rounded" style={{ background: timeBlockTints[block].bg }}>
                        <span className="text-[9px] font-display italic text-foreground/60 tracking-wide drop-shadow-sm">{timeBlockTints[block].label}</span>
                        <div className="flex-1 h-px bg-foreground/15" />
                      </div>
                      {tasks.map(task => <SortableTask key={task.id} task={task} />)}
                    </div>
                  ))}
                </>
              )}
            </SortableContext>

            <ShadowPlanning dayId={day.id} />

            {/* Input Row */}
            <div className="pt-2 mt-auto flex items-center gap-1.5 border-b border-foreground/15 focus-within:border-primary/40 transition-colors bg-black/15 rounded-t-sm px-1">
              <button onClick={cyclePriority} className="flex-shrink-0 text-[12px] opacity-80 hover:scale-110 transition-transform drop-shadow-md">
                {priority === 'high' ? '🍒' : priority === 'medium' ? '🌿' : '🍂'}
              </button>
              <button onClick={cycleMood} className="flex-shrink-0 w-[14px] h-[14px] rounded-full flex items-center justify-center hover:scale-110 transition-transform" title={mood || 'No mood'}>
                {mood ? (
                  <span className="w-[5px] h-[5px] rounded-full" style={{ backgroundColor: moodDots[mood], boxShadow: `0 0 3px ${moodDots[mood]}` }} />
                ) : (
                  <span className="w-[5px] h-[5px] rounded-full border border-foreground/30" />
                )}
              </button>
              <button onClick={cycleTimeBlock} className="flex-shrink-0 text-[10px] opacity-80 hover:scale-110 transition-transform" title={timeBlock || 'No time block'}>
                {timeBlock ? timeBlockIcons[timeBlock] : '⏱'}
              </button>
              <button onClick={cycleRecurrence} className="flex-shrink-0 text-[10px] opacity-80 hover:scale-110 transition-transform" title={recurrence ? `Recurs: ${recurrence}` : 'No recurrence'}>
                {recurrence ? recurrenceLabels[recurrence] : '↻'}
              </button>
              <input
                type="text"
                value={newTaskText}
                onChange={e => setNewTaskText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddTask()}
                placeholder="Add task..."
                className="w-full bg-transparent text-xs font-body text-foreground placeholder:text-foreground/40 outline-none py-1 drop-shadow-sm"
              />
            </div>

            {day.tasks.length > 0 && (
              <div className="pt-1.5 border-t border-foreground/10 mt-1">
                <span className="text-[10px] text-foreground/60 font-body block text-right drop-shadow-sm">{completedCount}/{day.tasks.length} done</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
