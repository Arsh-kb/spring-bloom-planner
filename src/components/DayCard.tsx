import { useState } from 'react';
import type { Day, TaskMood, TimeBlock } from '@/types/planner';
import { usePlanner } from '@/context/PlannerContext';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableTask } from './SortableTask';
import { ShadowPlanning } from './ShadowPlanning';
import { FloraGrowth } from './FloraGrowth';

interface DayCardProps {
  day: Day;
  isToday: boolean;
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

const timeBlockTints: Record<string, { bg: string; label: string }> = {
  morning: { bg: 'hsla(38, 60%, 70%, 0.06)', label: 'Morning' },
  afternoon: { bg: 'hsla(0, 0%, 100%, 0.04)', label: 'Afternoon' },
  evening: { bg: 'hsla(220, 40%, 60%, 0.06)', label: 'Evening' },
};

export function DayCard({ day, isToday, onZoom }: DayCardProps) {
  const { addTask } = usePlanner();
  const [newTaskText, setNewTaskText] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [mood, setMood] = useState<TaskMood | undefined>(undefined);
  const [timeBlock, setTimeBlock] = useState<TimeBlock | undefined>(undefined);
  const completedCount = day.tasks.filter(t => t.completed).length;

  const { setNodeRef, isOver } = useDroppable({ id: day.id, data: { type: 'Day', day } });
  const isVideo = day.image.endsWith('.mp4') || day.image.endsWith('.webm');

  const handleAddTask = () => {
    if (!newTaskText.trim()) return;
    addTask(day.id, newTaskText.trim(), priority, mood, timeBlock);
    setNewTaskText('');
    setPriority('medium');
    setMood(undefined);
    setTimeBlock(undefined);
  };

  const cyclePriority = () => {
    const seq: ('low' | 'medium' | 'high')[] = ['low', 'medium', 'high'];
    setPriority(seq[(seq.indexOf(priority) + 1) % seq.length]);
  };

  const cycleMood = () => {
    const idx = moodCycle.indexOf(mood);
    setMood(moodCycle[(idx + 1) % moodCycle.length]);
  };

  const cycleTimeBlock = () => {
    const idx = timeBlockCycle.indexOf(timeBlock);
    setTimeBlock(timeBlockCycle[(idx + 1) % timeBlockCycle.length]);
  };

  const handleHeaderClick = (e: React.MouseEvent) => {
    // Don't zoom if clicking interactive elements
    if ((e.target as HTMLElement).closest('button, input, [role="checkbox"]')) return;
    onZoom?.(day);
  };

  const ungrouped = day.tasks.filter(t => !t.timeBlock);
  const grouped = (['morning', 'afternoon', 'evening'] as TimeBlock[])
    .map(tb => ({ block: tb, tasks: day.tasks.filter(t => t.timeBlock === tb) }))
    .filter(g => g.tasks.length > 0);

  const allTaskIds = day.tasks.map(t => t.id);

  // Ghost deadline tinting
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
      {/* Flora: Moss overlay for neglected days */}
      <FloraGrowth day={day} />

      {/* --- Living Header --- */}
      <div className="relative h-24 overflow-hidden flex-shrink-0 cursor-pointer" onClick={handleHeaderClick}>
        {isVideo ? (
          <video src={day.image} autoPlay loop muted playsInline className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
        ) : (
          <img src={day.image} alt={day.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
        )}
        {/* Deeper gradient for better text contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
        <div className="absolute bottom-2 left-3 right-3 flex items-end justify-between pointer-events-none">
          {/* Added drop-shadow to text */}
          <h3 className="font-display text-foreground text-lg font-semibold text-nature leading-tight drop-shadow-md">{day.name}</h3>
          <span className="font-body text-xs text-foreground/80 text-nature drop-shadow-sm">
            {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        </div>
        {isToday && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary shadow-lg shadow-primary/50" />}

        {/* Flora: Productivity blooms */}
        <FloraGrowth day={day} isHeader />
      </div>

      {/* --- Tasks Content --- */}
      <div className="p-3 space-y-1 flex-1 flex flex-col">
        <SortableContext items={allTaskIds} strategy={verticalListSortingStrategy}>
          {day.tasks.length === 0 && newTaskText === '' ? (
            <p className="text-foreground/40 text-xs italic font-body py-2" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>No tasks yet</p>
          ) : (
            <>
              {ungrouped.map(task => <SortableTask key={task.id} task={task} />)}
              {grouped.map(({ block, tasks }) => (
                <div key={block} className="mt-1">
                  <div className="flex items-center gap-2 py-0.5 px-1 rounded" style={{ background: timeBlockTints[block].bg }}>
                    <span className="text-[9px] font-display italic text-foreground/50 tracking-wide" style={{ textShadow: '0 1px 1px rgba(0,0,0,0.4)' }}>{timeBlockTints[block].label}</span>
                    <div className="flex-1 h-px bg-foreground/10" />
                  </div>
                  {tasks.map(task => <SortableTask key={task.id} task={task} />)}
                </div>
              ))}
            </>
          )}
        </SortableContext>

        {/* Shadow Planning nudges */}
        <ShadowPlanning dayId={day.id} />

        {/* Input Row - Added a subtle background well and text shadow */}
        <div className="pt-2 mt-auto flex items-center gap-1.5 border-b border-foreground/10 focus-within:border-primary/40 transition-colors bg-black/5 rounded-t-sm px-1">
          <button onClick={cyclePriority} className="flex-shrink-0 text-[12px] opacity-80 hover:scale-110 transition-transform drop-shadow-sm">
            {priority === 'high' ? '🍒' : priority === 'medium' ? '🌿' : '🍂'}
          </button>
          <button onClick={cycleMood} className="flex-shrink-0 w-[14px] h-[14px] rounded-full flex items-center justify-center hover:scale-110 transition-transform drop-shadow-sm" title={mood || 'No mood'}>
            {mood ? (
              <span className="w-[5px] h-[5px] rounded-full" style={{ backgroundColor: moodDots[mood], boxShadow: `0 0 3px ${moodDots[mood]}` }} />
            ) : (
              <span className="w-[5px] h-[5px] rounded-full border border-foreground/30" />
            )}
          </button>
          <button onClick={cycleTimeBlock} className="flex-shrink-0 text-[10px] opacity-80 hover:scale-110 transition-transform drop-shadow-sm" title={timeBlock || 'No time block'}>
            {timeBlock ? timeBlockIcons[timeBlock] : '⏱'}
          </button>
          <input
            type="text"
            value={newTaskText}
            onChange={e => setNewTaskText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddTask()}
            placeholder="Add task..."
            className="w-full bg-transparent text-xs font-body text-foreground/90 placeholder:text-foreground/30 outline-none py-1"
            style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}
          />
        </div>

        {day.tasks.length > 0 && (
          <div className="pt-1.5 border-t border-foreground/10 mt-1">
            <span className="text-[10px] text-foreground/50 font-body block text-right" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>{completedCount}/{day.tasks.length} done</span>
          </div>
        )}
      </div>
    </div>
  );
}