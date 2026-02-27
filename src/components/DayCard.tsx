import type { Day } from '@/types/planner';
import { usePlanner } from '@/context/PlannerContext';

interface DayCardProps {
  day: Day;
  isToday: boolean;
}

export function DayCard({ day, isToday }: DayCardProps) {
  const { toggleTask } = usePlanner();
  const completedCount = day.tasks.filter(t => t.completed).length;

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
        {day.tasks.length === 0 ? (
          <p className="text-muted-foreground text-xs italic font-body">No tasks yet</p>
        ) : (
          day.tasks.map(task => (
            <label
              key={task.id}
              className="flex items-start gap-2 cursor-pointer group/task"
              onClick={() => toggleTask(day.id, task.id)}
            >
              <div
                className={`mt-0.5 w-3.5 h-3.5 rounded-sm border flex-shrink-0 flex items-center justify-center transition-colors ${
                  task.completed
                    ? 'bg-primary/60 border-primary/40'
                    : 'border-foreground/20 group-hover/task:border-foreground/40'
                }`}
              >
                {task.completed && (
                  <svg className="w-2.5 h-2.5 text-primary-foreground" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M2 6l3 3 5-5" />
                  </svg>
                )}
              </div>
              <span
                className={`text-xs font-body leading-tight transition-colors ${
                  task.completed ? 'text-muted-foreground line-through' : 'text-foreground/85'
                }`}
              >
                {task.title}
              </span>
            </label>
          ))
        )}
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
