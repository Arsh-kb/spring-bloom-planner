import { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Task } from '@/types/planner';
import { usePlanner } from '@/context/PlannerContext';

interface SortableTaskProps {
  task: Task;
}

const moodColors: Record<string, string> = {
  'high-strain': 'hsla(15, 75%, 55%, 0.9)',
  'reflective': 'hsla(215, 40%, 60%, 0.9)',
  'routine': 'hsla(38, 15%, 55%, 0.6)',
  'energizing': 'hsla(80, 55%, 50%, 0.9)',
};

const moodGlows: Record<string, string> = {
  'high-strain': '0 0 4px hsla(15, 75%, 55%, 0.4)',
  'reflective': '0 0 4px hsla(215, 40%, 60%, 0.4)',
  'routine': 'none',
  'energizing': '0 0 4px hsla(80, 55%, 50%, 0.4)',
};

function getAgingStyle(task: Task): React.CSSProperties {
  if (task.completed) return {};
  const age = Math.floor((Date.now() - new Date(task.created_at).getTime()) / 86400000);
  if (age <= 2) return {};
  if (age <= 5) return { filter: 'sepia(0.05)', opacity: 0.85 };
  if (age <= 10) return { filter: 'sepia(0.1)', opacity: 0.8, borderColor: 'hsla(38, 40%, 50%, 0.15)' };
  return { filter: 'sepia(0.15)', opacity: 0.75, borderRadius: '6px', borderColor: 'hsla(38, 40%, 50%, 0.2)' };
}

export function SortableTask({ task }: SortableTaskProps) {
  const { toggleTask, deleteTask, updateTask, enterDeepFocus } = usePlanner();

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const inputRef = useRef<HTMLInputElement>(null);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: 'Task', task }
  });

  useEffect(() => { if (isEditing) inputRef.current?.focus(); }, [isEditing]);

  const handleSaveEdit = () => {
    if (editTitle.trim() !== '' && editTitle !== task.title) updateTask(task.id, editTitle.trim());
    else setEditTitle(task.title);
    setIsEditing(false);
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
    scale: isDragging ? '1.05' : '1',
    ...getAgingStyle(task),
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`flex items-start gap-2 group/task relative p-1.5 rounded-md transition-colors ${
        isDragging ? 'bg-black/30 shadow-2xl backdrop-blur-md ring-1 ring-white/20' : 'hover:bg-white/10 cursor-grab active:cursor-grabbing'
      }`}
    >
      <div className="mt-1 flex-shrink-0 cursor-default pointer-events-none flex items-center gap-0.5">
        {task.priority === 'high' && <span title="High" className="text-[11px] drop-shadow-md animate-pulse">🍒</span>}
        {task.priority === 'medium' && <span title="Medium" className="text-[11px] opacity-90 drop-shadow-sm">🌿</span>}
        {task.priority === 'low' && <span title="Low" className="text-[11px] opacity-60 drop-shadow-sm">🍂</span>}
        {task.mood && (
          <span
            className="inline-block w-[5px] h-[5px] rounded-full ml-0.5 shadow-sm"
            title={task.mood}
            style={{
              backgroundColor: moodColors[task.mood],
              boxShadow: moodGlows[task.mood],
            }}
          />
        )}
        {task.recurrence && (
          <span className="text-[8px] text-foreground/40 ml-0.5" title={`Recurs: ${task.recurrence}`}>↻</span>
        )}
      </div>

      <button
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => toggleTask(task.id)}
        className={`mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all duration-500 shadow-sm ${
          task.completed ? 'border-primary/60 bg-primary/30 shadow-[0_0_8px_hsla(var(--primary)/0.4)]' : 'border-foreground/30 hover:border-foreground/60 bg-black/20'
        }`}
      >
        <div className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${task.completed ? 'bg-foreground/90 scale-100' : 'bg-transparent scale-0'}`} />
      </button>

      <div className="flex-1" onDoubleClick={() => setIsEditing(true)} onPointerDown={(e) => isEditing && e.stopPropagation()}>
        {isEditing ? (
          <input
            ref={inputRef}
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleSaveEdit}
            onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
            // Updated inline input to match our "well" styling
            className="w-full bg-black/20 text-sm font-body text-foreground/95 border border-foreground/10 rounded px-2 py-0.5 outline-none focus:border-primary/40 shadow-inner"
            style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
          />
        ) : (
          <span 
            className={`text-sm font-body leading-tight transition-all duration-500 block ${
              task.completed ? 'text-foreground/40 line-through' : 'text-foreground/95'
            }`}
            style={{ textShadow: task.completed ? 'none' : '0 1px 2px rgba(0,0,0,0.6)' }}
          >
            {task.title}
          </span>
        )}
      </div>

      <div className="flex items-center gap-0.5 flex-shrink-0 opacity-0 group-hover/task:opacity-80 transition-opacity">
        {!task.completed && (
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => enterDeepFocus(task.id)}
            className="text-[10px] text-foreground/50 hover:text-primary transition-colors px-1 py-0.5 rounded hover:bg-white/10"
            title="Deep Focus on this"
          >
            🎯
          </button>
        )}
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => deleteTask(task.id)}
          className="text-foreground/50 hover:text-destructive text-sm px-1 py-0.5 rounded hover:bg-white/10 transition-colors"
        >
          ×
        </button>
      </div>
    </div>
  );
}