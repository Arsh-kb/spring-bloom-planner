import { usePlanner } from '@/context/PlannerContext';

const moodColors: Record<string, string> = {
  'high-strain': 'hsla(15, 75%, 55%, 0.9)',
  'reflective': 'hsla(215, 40%, 60%, 0.9)',
  'routine': 'hsla(38, 15%, 55%, 0.6)',
  'energizing': 'hsla(80, 55%, 50%, 0.9)',
};

function getAgingStyle(task: { completed: boolean; created_at: string }): React.CSSProperties {
  if (task.completed) return {};
  const age = Math.floor((Date.now() - new Date(task.created_at).getTime()) / 86400000);
  if (age <= 2) return {};
  if (age <= 5) return { filter: 'sepia(0.05)', opacity: 0.85 };
  if (age <= 10) return { filter: 'sepia(0.1)', opacity: 0.8 };
  return { filter: 'sepia(0.15)', opacity: 0.75 };
}

export function MasterTaskList({ onClose }: { onClose: () => void }) {
  const { days, toggleTask, deleteTask } = usePlanner();

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-8">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-3xl max-h-[80vh] glass-panel rounded-xl overflow-hidden">
        <div className="absolute inset-0 inset-depth pointer-events-none" />
        <div className="relative z-10 p-6 overflow-y-auto max-h-[80vh] scrollbar-thin">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-xl text-foreground text-nature">Master Task Ledger</h2>
            <button onClick={onClose} className="glass-panel w-8 h-8 rounded-full flex items-center justify-center text-foreground/60 hover:text-foreground transition-colors text-sm">×</button>
          </div>
          <div className="space-y-6">
            {days.map(day => (
              <div key={day.id}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-md overflow-hidden flex-shrink-0">
                    {day.image.endsWith('.mp4') ? (
                      <video src={day.image} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                    ) : (
                      <img src={day.image} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <h3 className="font-display text-sm text-foreground/80">{day.name}</h3>
                  <div className="flex-1 h-px bg-foreground/10" />
                  <span className="text-[10px] font-body text-muted-foreground">
                    {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                {day.tasks.length === 0 ? (
                  <p className="text-xs italic text-muted-foreground/50 font-body pl-11">No tasks</p>
                ) : (
                  <div className="space-y-1 pl-11">
                    {day.tasks.map(task => (
                      <div key={task.id} className="flex items-center gap-2 group/task py-0.5" style={getAgingStyle(task)}>
                        {task.mood && (
                          <span className="w-[5px] h-[5px] rounded-full flex-shrink-0" style={{ backgroundColor: moodColors[task.mood] }} />
                        )}
                        <button
                          onClick={() => toggleTask(task.id)}
                          className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all duration-500 ${
                            task.completed ? 'border-primary/60 bg-primary/30 shadow-[0_0_8px_hsla(var(--primary)/0.4)]' : 'border-foreground/20 hover:border-foreground/40'
                          }`}
                        >
                          <div className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${task.completed ? 'bg-foreground/80 scale-100' : 'scale-0'}`} />
                        </button>
                        <span className={`text-xs font-body flex-1 transition-all duration-500 ${task.completed ? 'line-through text-muted-foreground opacity-50' : 'text-foreground/85'}`}>
                          {task.title}
                        </span>
                        {task.timeBlock && (
                          <span className="text-[9px] text-foreground/25 font-display italic">{task.timeBlock}</span>
                        )}
                        <button onClick={() => deleteTask(task.id)} className="opacity-0 group-hover/task:opacity-60 hover:!opacity-100 transition-opacity text-muted-foreground text-xs">×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
