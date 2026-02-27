import { useState } from 'react';
import type { Day } from '@/types/planner';
import { usePlanner } from '@/context/PlannerContext';

interface DayCardProps {
  day: Day;
  isToday: boolean;
}

export function DayCard({ day, isToday }: DayCardProps) {
  const { toggleTask, addTask, deleteTask } = usePlanner();
  const [newTaskText, setNewTaskText] = useState('');
  const completedCount = day.tasks.filter(t => t.completed).length;

  const handleAddTask = () => {
    if (!newTaskText.trim()) return;
    addTask(day.id, newTaskText.trim());
    setNewTaskText('');
  };

  return (
    <div
      className={`glass-panel rounded-lg overflow-hidden transition-all duration-500 hover:scale-[1.02] group ${
        isToday ? 'ring-1 ring-primary/40' : ''
      }`}
    >
      {/* Nature thumbnail header */}
      <div className="relative h-24 overflow-hidden">
        <img
          src={day.image}
          alt={day.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <div className="absolute bottom-2 left-3 right-3 flex items-end justify-between">
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

      {/* Tasks */}
      <div className="p-3 space-y-1.5">
        {day.tasks.length === 0 && newTaskText === '' ? (
          <p className="text-muted-foreground text-xs italic font-body">No tasks yet</p>
        ) : (
          day.tasks.map(task => (
            <div
              key={task.id}
              className="flex items-start gap-2 group/task"
            >
              {/* Custom aesthetic checkbox */}
              <button
                onClick={() => toggleTask(task.id)}
                className={`mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all duration-500 ${
                  task.completed
                    ? 'border-primary/60 bg-primary/30 shadow-[0_0_8px_hsla(var(--primary)/0.4)]'
                    : 'border-foreground/20 hover:border-foreground/40 bg-transparent'
                }`}
              >
                <div
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${
                    task.completed ? 'bg-foreground/80 scale-100' : 'bg-transparent scale-0'
                  }`}
                />
              </button>
              <span
                className={`text-xs font-body leading-tight transition-all duration-500 flex-1 ${
                  task.completed
                    ? 'text-muted-foreground line-through opacity-50'
                    : 'text-foreground/85'
                }`}
              >
                {task.title}
              </span>
              <button
                onClick={() => deleteTask(task.id)}
                className="opacity-0 group-hover/task:opacity-60 hover:!opacity-100 transition-opacity text-muted-foreground text-xs flex-shrink-0 ml-1"
                title="Remove"
              >
                ×
              </button>
            </div>
          ))
        )}

        {/* Inline add task */}
        <div className="pt-1.5">
          <input
            type="text"
            value={newTaskText}
            onChange={e => setNewTaskText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddTask()}
            placeholder="+ Add task..."
            className="w-full bg-transparent border-b border-foreground/10 focus:border-primary/40 text-xs font-body text-foreground/80 placeholder:text-muted-foreground/40 outline-none py-1 transition-colors"
          />
        </div>

        {day.tasks.length > 0 && (
          <div className="pt-1 border-t border-foreground/5">
            <span className="text-[10px] text-muted-foreground font-body">
              {completedCount}/{day.tasks.length} done
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
