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
      {/* Slightly darker backdrop for focus */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative z-10 w-full max-w-3xl max-h-[80vh] glass-panel rounded-2xl overflow-hidden shadow-2xl">
        <div className="absolute inset-0 inset-depth pointer-events-none" />
        
        {/* Internal Gradient Scrim for Readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20 pointer-events-none" />

        <div className="relative z-10 p-8 overflow-y-auto max-h-[80vh] scrollbar-thin">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-display text-2xl text-foreground/95 drop-shadow-md text-nature">Master Task Ledger</h2>
            <button onClick={onClose} className="glass-panel w-8 h-8 rounded-full flex items-center justify-center bg-black/20 text-foreground/80 hover:text-foreground transition-colors text-sm shadow-md">×</button>
          </div>
          
          <div className="space-y-8">
            {days.map(day => (
              <div key={day.id}>
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-10 h-10 rounded-md overflow-hidden flex-shrink-0 border border-white/10 shadow-sm">
                    {day.image.endsWith('.mp4') ? (
                      <video src={day.image} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                    ) : (
                      <img src={day.image} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <h3 className="font-display text-base text-foreground/90 drop-shadow-sm">{day.name}</h3>
                  <div className="flex-1 h-px bg-foreground/10" />
                  <span className="text-[11px] font-body text-foreground/50" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>
                    {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>

                {day.tasks.length === 0 ? (
                  <p className="text-xs italic text-foreground/40 font-body pl-14" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>No tasks</p>
                ) : (
                  <div className="space-y-1.5 pl-14">
                    {day.tasks.map(task => (
                      <div 
                        key={task.id} 
                        // Added individual task "wells" for separation
                        className="flex items-center gap-3 group/task py-1.5 px-3 bg-black/10 hover:bg-black/20 rounded-lg border border-white/5 transition-colors shadow-sm" 
                        style={getAgingStyle(task)}
                      >
                        {task.mood && (
                          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 shadow-sm" style={{ backgroundColor: moodColors[task.mood] }} />
                        )}
                        <button
                          onClick={() => toggleTask(task.id)}
                          className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all duration-500 shadow-sm ${
                            task.completed ? 'border-primary/60 bg-primary/30' : 'border-foreground/30 hover:border-foreground/60 bg-black/20'
                          }`}
                        >
                          <div className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${task.completed ? 'bg-foreground/90 scale-100' : 'scale-0'}`} />
                        </button>
                        <span 
                          className={`text-sm font-body flex-1 transition-all duration-500 ${task.completed ? 'line-through text-foreground/40' : 'text-foreground/95'}`}
                          style={{ textShadow: task.completed ? 'none' : '0 1px 2px rgba(0,0,0,0.5)' }}
                        >
                          {task.title}
                        </span>
                        {task.timeBlock && (
                          <span className="text-[10px] text-foreground/40 font-display italic" style={{ textShadow: '0 1px 1px rgba(0,0,0,0.3)' }}>{task.timeBlock}</span>
                        )}
                        <button onClick={() => deleteTask(task.id)} className="opacity-0 group-hover/task:opacity-60 hover:!opacity-100 transition-opacity text-destructive/80 hover:text-destructive text-sm px-1">×</button>
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