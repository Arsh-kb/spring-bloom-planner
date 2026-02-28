import { useState } from 'react';
import type { Day } from '@/types/planner';
import { usePlanner } from '@/context/PlannerContext';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableTask } from './SortableTask';

interface DayCardProps {
  day: Day;
  isToday: boolean;
}

export function DayCard({ day, isToday }: DayCardProps) {
  const { addTask } = usePlanner();
  const [newTaskText, setNewTaskText] = useState('');
  const [priority, setPriority] = useState<'low'|'medium'|'high'>('medium');
  const completedCount = day.tasks.filter(t => t.completed).length;

  // Droppable hook for Drag and Drop
  const { setNodeRef, isOver } = useDroppable({
    id: day.id,
    data: { type: 'Day', day },
  });

  // Check if the asset is a video
  const isVideo = day.image.endsWith('.mp4') || day.image.endsWith('.webm');

  const handleAddTask = () => {
    if (!newTaskText.trim()) return;
    addTask(day.id, newTaskText.trim(), priority);
    setNewTaskText('');
    setPriority('medium');
  };

  const cyclePriority = () => {
    const sequence: ('low'|'medium'|'high')[] = ['low', 'medium', 'high'];
    const nextIndex = (sequence.indexOf(priority) + 1) % sequence.length;
    setPriority(sequence[nextIndex]);
  };

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
          <video
            src={day.image}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <img 
            src={day.image} 
            alt={day.name} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
          />
        )}
        
        {/* Cinematic Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        
        <div className="absolute bottom-2 left-3 right-3 flex items-end justify-between pointer-events-none">
          <h3 className="font-display text-foreground text-lg font-semibold text-nature leading-tight">
            {day.name}
          </h3>
          <span className="font-body text-xs text-foreground/70 text-nature">
            {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        </div>
        
        {isToday && (
          <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary shadow-lg shadow-primary/50" />
        )}
      </div>

      {/* --- Tasks Content --- */}
      <div className="p-3 space-y-1.5 flex-1 flex flex-col">
        <SortableContext items={day.tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {day.tasks.length === 0 && newTaskText === '' ? (
            <p className="text-muted-foreground text-xs italic font-body py-2">No tasks yet</p>
          ) : (
            day.tasks.map(task => <SortableTask key={task.id} task={task} />)
          )}
        </SortableContext>

        {/* Priority & Input UI */}
        <div className="pt-2 mt-auto flex items-center gap-2 border-b border-foreground/10 focus-within:border-primary/40 transition-colors">
          <button 
            onClick={cyclePriority} 
            className="flex-shrink-0 text-[12px] opacity-80 hover:scale-110 transition-transform"
          >
            {priority === 'high' ? '🍒' : priority === 'medium' ? '🌿' : '🍂'}
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
            <span className="text-[10px] text-muted-foreground font-body">
              {completedCount}/{day.tasks.length} done
            </span>
          </div>
        )}
      </div>
    </div>
  );
}