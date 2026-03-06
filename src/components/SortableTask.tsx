import { useState, useRef, useEffect, useCallback } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Task, TaskMood, TimeBlock } from '@/types/planner';
import { usePlanner } from '@/context/PlannerContext';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

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
  const { toggleTask, deleteTask, updateTask, updateTaskDetails, enterDeepFocus } = usePlanner();
  const isMobile = useIsMobile();
  const [hapticPulse, setHapticPulse] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [expanded, setExpanded] = useState(false);
  const [editDescription, setEditDescription] = useState(task.description || '');
  const [tagInput, setTagInput] = useState('');
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

  const handleSaveDescription = () => {
    if (editDescription !== (task.description || '')) {
      updateTaskDetails(task.id, { description: editDescription || undefined });
    }
  };

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (!tag) return;
    const existing = task.tags || [];
    if (existing.length >= 5 || existing.includes(tag)) return;
    updateTaskDetails(task.id, { tags: [...existing, tag] });
    setTagInput('');
  };

  const handleRemoveTag = (tag: string) => {
    updateTaskDetails(task.id, { tags: (task.tags || []).filter(t => t !== tag) });
  };

  const handleDateSelect = (date: Date | undefined) => {
    updateTaskDetails(task.id, { due_date: date ? format(date, 'yyyy-MM-dd') : undefined });
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
    scale: isDragging ? '1.05' : '1',
    ...getAgingStyle(task),
  };

  return (
    <div ref={setNodeRef} style={style} className="group/task-wrapper">
      <div
        {...attributes}
        {...listeners}
        className={`flex items-start gap-2 group/task relative p-1.5 rounded-md transition-colors ${
          isDragging ? 'bg-black/40 shadow-2xl backdrop-blur-md ring-1 ring-white/20' : 'hover:bg-white/10 cursor-grab active:cursor-grabbing'
        }`}
      >
        <div className="mt-1 flex-shrink-0 cursor-default pointer-events-none flex items-center gap-0.5">
          {task.priority === 'high' && <span title="High" className="text-[11px] drop-shadow-lg animate-pulse">🍒</span>}
          {task.priority === 'medium' && <span title="Medium" className="text-[11px] opacity-90 drop-shadow-md">🌿</span>}
          {task.priority === 'low' && <span title="Low" className="text-[11px] opacity-60 drop-shadow-md">🍂</span>}
          {task.mood && (
            <span
              className="inline-block w-[5px] h-[5px] rounded-full ml-0.5 shadow-sm"
              title={task.mood}
              style={{ backgroundColor: moodColors[task.mood], boxShadow: moodGlows[task.mood] }}
            />
          )}
          {task.recurrence && (
            <span className="text-[8px] text-foreground/40 ml-0.5" title={`Recurs: ${task.recurrence}`}>↻</span>
          )}
        </div>

        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => {
            toggleTask(task.id);
            if (isMobile && !task.completed) {
              setHapticPulse(true);
              setTimeout(() => setHapticPulse(false), 300);
            }
          }}
          className={`mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all duration-500 shadow-sm ${
            task.completed ? 'border-primary/60 bg-primary/30 shadow-[0_0_8px_hsla(var(--primary)/0.4)]' : 'border-foreground/30 hover:border-foreground/60 bg-black/20'
          } ${hapticPulse ? 'scale-150' : ''}`}
          style={{ transition: hapticPulse ? 'transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)' : undefined }}
        >
          <div className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${task.completed ? 'bg-foreground/90 scale-100' : 'bg-transparent scale-0'}`} />
        </button>

        <div
          className="flex-1"
          onPointerDown={(e) => isEditing && e.stopPropagation()}
        >
          {isEditing ? (
            <input
              ref={inputRef}
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleSaveEdit}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
              className="w-full bg-black/30 text-sm font-body text-foreground border border-foreground/15 rounded px-2 py-0.5 outline-none focus:border-primary/40 shadow-inner"
            />
          ) : (
            <span
              className={`text-sm font-body leading-tight transition-all duration-500 block cursor-pointer ${
                task.completed ? 'text-foreground/40 line-through' : 'text-foreground'
              }`}
              style={{ textShadow: task.completed ? 'none' : '0 1px 3px rgba(0,0,0,0.7)' }}
              onDoubleClick={() => setIsEditing(true)}
              onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
              onPointerDown={(e) => e.stopPropagation()}
            >
              {task.title}
              {task.tags && task.tags.length > 0 && (
                <span className="inline-flex gap-1 ml-2">
                  {task.tags.map(tag => (
                    <span key={tag} className="text-[8px] bg-primary/15 text-primary/70 px-1 py-0 rounded-full">{tag}</span>
                  ))}
                </span>
              )}
            </span>
          )}
          {task.due_date && !expanded && (
            <span className="text-[9px] text-foreground/50 font-body block mt-0.5 drop-shadow-sm">
              Due {format(new Date(task.due_date), 'MMM d')}
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

      {/* Expanded details panel with smooth transition */}
      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          maxHeight: expanded ? '400px' : '0px',
          opacity: expanded ? 1 : 0,
          transform: expanded ? 'translateY(0)' : 'translateY(-4px)',
        }}
      >
        <div
          className="ml-6 mr-1 mb-2 mt-1 bg-black/25 border border-foreground/8 rounded-lg p-3 space-y-3"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div>
            <label className="text-[9px] font-body text-foreground/50 uppercase tracking-wider block mb-1 drop-shadow-sm">Description</label>
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              onBlur={handleSaveDescription}
              placeholder="Add a description..."
              rows={2}
              className="w-full bg-black/20 border border-foreground/10 rounded-md px-2.5 py-1.5 text-xs font-body text-foreground/90 placeholder:text-foreground/30 outline-none focus:border-primary/30 resize-none shadow-inner transition-colors"
            />
          </div>

          <div className="flex items-center gap-3">
            <label className="text-[9px] font-body text-foreground/50 uppercase tracking-wider drop-shadow-sm">Due date</label>
            <Popover>
              <PopoverTrigger asChild>
                <button className="text-[10px] font-body text-foreground/70 bg-black/20 border border-foreground/10 px-2 py-1 rounded hover:bg-black/30 transition-colors">
                  {task.due_date ? format(new Date(task.due_date), 'MMM d, yyyy') : 'Set date'}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 z-[80]" align="start">
                <Calendar
                  mode="single"
                  selected={task.due_date ? new Date(task.due_date) : undefined}
                  onSelect={handleDateSelect}
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
            {task.due_date && (
              <button onClick={() => handleDateSelect(undefined)} className="text-[9px] text-foreground/30 hover:text-destructive transition-colors">clear</button>
            )}
          </div>

          <div>
            <label className="text-[9px] font-body text-foreground/50 uppercase tracking-wider block mb-1 drop-shadow-sm">Tags</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {(task.tags || []).map(tag => (
                <span key={tag} className="inline-flex items-center gap-1 text-[9px] bg-primary/15 text-primary/70 px-2 py-0.5 rounded-full">
                  {tag}
                  <button onClick={() => handleRemoveTag(tag)} className="hover:text-destructive transition-colors">×</button>
                </span>
              ))}
            </div>
            {(task.tags || []).length < 5 && (
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                placeholder="Add tag..."
                className="bg-black/20 border border-foreground/10 rounded px-2 py-1 text-[10px] font-body text-foreground/70 placeholder:text-foreground/30 outline-none focus:border-primary/30 w-28 shadow-inner transition-colors"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
