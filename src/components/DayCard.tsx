import { useState } from 'react';
import type { Day, TaskMood, TimeBlock } from '@/types/planner';
import { usePlanner } from '@/context/PlannerContext';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableTask } from './SortableTask';

interface DayCardProps {
  day: Day;
  isToday: boolean;
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

export function DayCard({ day, isToday }: DayCardProps) {
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

  // Group tasks by time block
  const ungrouped = day.tasks.filter(t => !t.timeBlock);
  const grouped = (['morning', 'afternoon', 'evening'] as TimeBlock[])
    .map(tb => ({ block: tb, tasks: day.tasks.filter(t => t.timeBlock === tb) }))
    .filter(g => g.tasks.length > 0);

  const allTaskIds = day.tasks.map(t => t.id);

  return (
    <div
      ref={setNodeRef}
      className={`glass-panel rounded-lg overflow-hidden transition-all duration-500 flex flex-col group ${
        isToday ? 'ring-1 ring-primary/40' : ''
      } ${isOver ? 'ring-2 ring-primary bg-white/10 scale-[1.02]' : 'hover:scale-[1.02]'}`}
    >
      {/* --- Living Header --- */}
      <div className="relative h-24 overflow-hidden flex-shrink-0">
        {isVideo ? (
          <video src={day.image} autoPlay loop muted playsInline className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
        ) : (
          <img src={day.image} alt={day.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <div className="absolute bottom-2 left-3 right-3 flex items-end justify-between pointer-events-none">
          <h3 className="font-display text-foreground text-lg font-semibold text-nature leading-tight">{day.name}</h3>
          <span className="font-body text-xs text-foreground/70 text-nature">
            {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        </div>
        {isToday && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary shadow-lg shadow-primary/50" />}
      </div>

      {/* --- Tasks Content --- */}
      <div className="p-3 space-y-1 flex-1 flex flex-col">
        <SortableContext items={allTaskIds} strategy={verticalListSortingStrategy}>
          {day.tasks.length === 0 && newTaskText === '' ? (
            <p className="text-muted-foreground text-xs italic font-body py-2">No tasks yet</p>
          ) : (
            <>
              {/* Ungrouped tasks */}
              {ungrouped.map(task => <SortableTask key={task.id} task={task} />)}

              {/* Time-blocked groups */}
              {grouped.map(({ block, tasks }) => (
                <div key={block} className="mt-1">
                  <div className="flex items-center gap-2 py-0.5 px-1 rounded" style={{ background: timeBlockTints[block].bg }}>
                    <span className="text-[9px] font-display italic text-foreground/40 tracking-wide">{timeBlockTints[block].label}</span>
                    <div className="flex-1 h-px bg-foreground/5" />
                  </div>
                  {tasks.map(task => <SortableTask key={task.id} task={task} />)}
                </div>
              ))}
            </>
          )}
        </SortableContext>

        {/* Input Row */}
        <div className="pt-2 mt-auto flex items-center gap-1.5 border-b border-foreground/10 focus-within:border-primary/40 transition-colors">
          <button onClick={cyclePriority} className="flex-shrink-0 text-[12px] opacity-80 hover:scale-110 transition-transform">
            {priority === 'high' ? '🍒' : priority === 'medium' ? '🌿' : '🍂'}
          </button>
          <button onClick={cycleMood} className="flex-shrink-0 w-[14px] h-[14px] rounded-full flex items-center justify-center hover:scale-110 transition-transform" title={mood || 'No mood'}>
            {mood ? (
              <span className="w-[5px] h-[5px] rounded-full" style={{ backgroundColor: moodDots[mood], boxShadow: `0 0 3px ${moodDots[mood]}` }} />
            ) : (
              <span className="w-[5px] h-[5px] rounded-full border border-foreground/20" />
            )}
          </button>
          <button onClick={cycleTimeBlock} className="flex-shrink-0 text-[10px] opacity-70 hover:scale-110 transition-transform" title={timeBlock || 'No time block'}>
            {timeBlock ? timeBlockIcons[timeBlock] : '⏱'}
          </button>
          <input
            type="text"
            value={newTaskText}
            onChange={e => setNewTaskText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddTask()}
            placeholder="Add task..."
            className="w-full bg-transparent text-xs font-body text-foreground/80 placeholder:text-muted-foreground/40 outline-none py-1"
          />
        </div>

        {day.tasks.length > 0 && (
          <div className="pt-1 border-t border-foreground/5 mt-1">
            <span className="text-[10px] text-muted-foreground font-body">{completedCount}/{day.tasks.length} done</span>
          </div>
        )}
      </div>
    </div>
  );
}
