import { useState, useEffect, useCallback, useRef } from 'react';
import { usePlanner } from '@/context/PlannerContext';
import type { Day, SubIntention, TaskMood, TimeBlock } from '@/types/planner';

const moodDots: Record<string, string> = {
  'routine': 'hsla(38, 15%, 55%, 0.6)',
  'reflective': 'hsla(215, 40%, 60%, 0.9)',
  'high-strain': 'hsla(15, 75%, 55%, 0.9)',
  'energizing': 'hsla(80, 55%, 50%, 0.9)',
};

const timeBlockLabels: Record<TimeBlock, string> = { morning: '🌅 Morning', afternoon: '☀️ Afternoon', evening: '🌙 Evening' };

interface DayDetailViewProps {
  day: Day;
  onClose: () => void;
}

export function DayDetailView({ day, onClose }: DayDetailViewProps) {
  const { toggleTask, addTask, updateTask, deleteTask, addJournalEntry, journal, tasks } = usePlanner();
  const [visible, setVisible] = useState(false);
  const [parallaxOffset, setParallaxOffset] = useState({ x: 0, y: 0 });
  const [newTaskText, setNewTaskText] = useState('');
  const [reflection, setReflection] = useState('');
  const [subIntentionInputs, setSubIntentionInputs] = useState<Record<string, string>>({});

  // Get live tasks for this day
  const dayTasks = tasks.filter(t => t.date === day.id);
  const dayJournal = journal.filter(j => j.date === day.id);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 4;
      const y = (e.clientY / window.innerHeight - 0.5) * 4;
      setParallaxOffset({ x, y });
    };
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, []);

  const handleClose = useCallback(() => {
    setVisible(false);
    setTimeout(onClose, 600);
  }, [onClose]);

  const handleAddTask = () => {
    if (!newTaskText.trim()) return;
    addTask(day.id, newTaskText.trim(), 'medium');
    setNewTaskText('');
  };

  const handleAddReflection = () => {
    if (!reflection.trim()) return;
    addJournalEntry(reflection.trim(), day.id);
    setReflection('');
  };

  const handleAddSubIntention = (taskId: string) => {
    const text = subIntentionInputs[taskId]?.trim();
    if (!text) return;
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const sub: SubIntention = { id: `si${Date.now()}`, title: text, completed: false };
    const existing = task.subIntentions || [];
    
    updateTask(taskId, task.title); 
    const allTasks = tasks.map(t => t.id === taskId ? { ...t, subIntentions: [...existing, sub] } : t);
    localStorage.setItem('springscape-tasks', JSON.stringify(allTasks));
    setSubIntentionInputs(prev => ({ ...prev, [taskId]: '' }));
    window.dispatchEvent(new Event('storage'));
  };

  const isVideo = day.image.endsWith('.mp4') || day.image.endsWith('.webm');
  const dateLabel = new Date(day.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  // Group tasks
  const ungrouped = dayTasks.filter(t => !t.timeBlock);
  const grouped = (['morning', 'afternoon', 'evening'] as TimeBlock[])
    .map(tb => ({ block: tb, tasks: dayTasks.filter(t => t.timeBlock === tb) }))
    .filter(g => g.tasks.length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/65 backdrop-blur-sm transition-opacity duration-700"
        style={{ opacity: visible ? 1 : 0 }}
        onClick={handleClose}
      />

      {/* Glass pane */}
      <div
        className="relative z-10 w-full h-full max-w-[880px] max-h-[92vh] transition-all duration-[1500ms] ease-out overflow-hidden"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible
            ? `translate3d(${parallaxOffset.x}px, ${parallaxOffset.y}px, 0) scale(1)`
            : 'scale(0.85)',
          borderRadius: '3rem',
          background: 'hsla(var(--glass-bg))',
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)',
          border: '1px solid hsla(var(--glass-border))',
          boxShadow: '0 24px 80px rgba(0,0,0,0.6), inset 0 1px 0 hsla(0,0%,100%,0.1)',
        }}
      >
        {/* Adaptive Mode Scrim - PROTECTS TEXT READABILITY */}
        <div 
          className="absolute inset-0 top-40 pointer-events-none transition-colors duration-1000" 
          style={{ 
            borderRadius: '0 0 3rem 3rem',
            background: 'linear-gradient(to bottom, hsla(var(--background)/0.4), hsla(var(--background)/0.95))'
          }} 
        />

        {/* Ruled lines */}
        <div className="absolute inset-0 top-40 pointer-events-none overflow-hidden" style={{ borderRadius: '0 0 3rem 3rem' }}>
          <svg width="100%" height="100%" className="opacity-[0.04]">
            <defs>
              <pattern id="ruled-detail" width="100%" height="32" patternUnits="userSpaceOnUse">
                <line x1="0" y1="31" x2="100%" y2="31" stroke="currentColor" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#ruled-detail)" />
          </svg>
        </div>

        {/* Header banner with blurred video/image */}
        <div className="relative h-40 overflow-hidden" style={{ borderRadius: '3rem 3rem 0 0' }}>
          {isVideo ? (
            <video src={day.image} autoPlay loop muted playsInline className="w-full h-full object-cover blur-[3px] scale-110" />
          ) : (
            <img src={day.image} alt="" className="w-full h-full object-cover blur-[3px] scale-110" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/80" />
          <div className="absolute bottom-4 left-8 right-8 text-nature">
            <h1 className="font-display text-3xl text-foreground/95 drop-shadow-md">{day.name}</h1>
            <p className="font-display text-sm italic text-foreground/70 mt-0.5 drop-shadow-sm">{dateLabel}</p>
          </div>
          <button
            onClick={handleClose}
            className="absolute top-5 right-6 w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-foreground/80 hover:text-foreground transition-colors text-sm shadow-lg"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="relative z-10 overflow-y-auto px-8 md:px-12 py-8 scrollbar-thin" style={{ maxHeight: 'calc(92vh - 160px)' }}>
          <div className="max-w-[720px] mx-auto space-y-6">

            {/* Ungrouped tasks */}
            {ungrouped.length > 0 && (
              <div className="space-y-2">
                {ungrouped.map(task => (
                  <TaskRow key={task.id} task={task} onToggle={toggleTask} onDelete={deleteTask}
                    subInput={subIntentionInputs[task.id] || ''}
                    onSubInputChange={(v) => setSubIntentionInputs(prev => ({ ...prev, [task.id]: v }))}
                    onAddSub={() => handleAddSubIntention(task.id)}
                  />
                ))}
              </div>
            )}

            {/* Grouped by time block */}
            {grouped.map(({ block, tasks: blockTasks }) => (
              <div key={block}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-display italic text-foreground/50" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>{timeBlockLabels[block]}</span>
                  <div className="flex-1 h-px bg-foreground/10" />
                </div>
                <div className="space-y-2">
                  {blockTasks.map(task => (
                    <TaskRow key={task.id} task={task} onToggle={toggleTask} onDelete={deleteTask}
                      subInput={subIntentionInputs[task.id] || ''}
                      onSubInputChange={(v) => setSubIntentionInputs(prev => ({ ...prev, [task.id]: v }))}
                      onAddSub={() => handleAddSubIntention(task.id)}
                    />
                  ))}
                </div>
              </div>
            ))}

            {/* Add task Input - Anchored with dark well */}
            <div className="flex items-center gap-2 border border-foreground/10 bg-black/10 backdrop-blur-sm rounded-lg py-2 px-3 mt-4 focus-within:border-primary/40 transition-colors shadow-inner">
              <input
                type="text"
                value={newTaskText}
                onChange={e => setNewTaskText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddTask()}
                placeholder="Add a new task..."
                className="flex-1 bg-transparent text-sm font-body text-foreground/90 placeholder:text-foreground/30 outline-none"
                style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
              />
            </div>

            {/* Quick Reflection */}
            <div className="pt-8 mt-4 border-t border-foreground/10">
              <h3 className="font-display text-sm italic text-foreground/50 mb-3" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>Quick Reflection</h3>
              {dayJournal.length > 0 && (
                <div className="space-y-3 mb-4">
                  {dayJournal.map(j => (
                    <div key={j.id} className="bg-white/5 border border-white/5 rounded-lg p-3 shadow-sm">
                      <p className="text-xs font-body text-foreground/85 leading-relaxed" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>{j.content}</p>
                      <span className="text-[9px] text-foreground/40 font-body mt-1 block">
                        {new Date(j.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <div className="bg-black/10 border border-foreground/10 rounded-lg p-1 focus-within:border-primary/40 transition-colors shadow-inner">
                <textarea
                  value={reflection}
                  onChange={e => setReflection(e.target.value)}
                  placeholder="Write a reflection for this day..."
                  rows={3}
                  className="w-full bg-transparent text-sm font-body text-foreground/90 placeholder:text-foreground/30 resize-none outline-none leading-[28px] p-2"
                  style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
                />
              </div>
              {reflection.trim() && (
                <button onClick={handleAddReflection} className="mt-2 glass-panel px-5 py-1.5 rounded-full text-xs font-body text-foreground/80 hover:text-foreground transition-colors hover:bg-white/10 shadow-md">
                  Save Entry
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Task Row Component ---
function TaskRow({ task, onToggle, onDelete, subInput, onSubInputChange, onAddSub }: {
  task: any;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  subInput: string;
  onSubInputChange: (v: string) => void;
  onAddSub: () => void;
}) {
  const [showSub, setShowSub] = useState(false);

  return (
    <div className="group/task">
      <div className="flex items-start gap-3 py-2 px-2 rounded-md hover:bg-white/10 transition-colors">
        {/* Priority + mood */}
        <div className="mt-1 flex items-center gap-1 flex-shrink-0">
          <span className="text-[11px]">
            {task.priority === 'high' ? '🍒' : task.priority === 'medium' ? '🌿' : '🍂'}
          </span>
          {task.mood && (
            <span className="inline-block w-[5px] h-[5px] rounded-full shadow-sm" style={{ backgroundColor: moodDots[task.mood] || 'transparent' }} />
          )}
        </div>

        {/* Checkbox */}
        <button
          onClick={() => onToggle(task.id)}
          className={`mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all duration-500 shadow-sm ${
            task.completed ? 'border-primary/60 bg-primary/30' : 'border-foreground/30 hover:border-foreground/60 bg-black/20'
          }`}
        >
          <div className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${task.completed ? 'bg-foreground/90 scale-100' : 'bg-transparent scale-0'}`} />
        </button>

        {/* Title + description */}
        <div className="flex-1 min-w-0">
          {/* Subtle text shadow added for legibility */}
          <span 
            className={`text-sm font-body leading-relaxed block transition-all ${task.completed ? 'text-foreground/40 line-through' : 'text-foreground/95'}`}
            style={{ textShadow: task.completed ? 'none' : '0 1px 3px rgba(0,0,0,0.6)' }}
          >
            {task.title}
          </span>
          {task.description && (
            <p className="text-xs font-body text-foreground/60 mt-0.5" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>{task.description}</p>
          )}

          {/* Sub-intentions */}
          {task.subIntentions && task.subIntentions.length > 0 && (
            <div className="mt-2 space-y-1.5 ml-1 border-l-2 border-foreground/10 pl-3">
              {task.subIntentions.map((si: SubIntention) => (
                <div key={si.id} className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${si.completed ? 'bg-primary/50' : 'bg-foreground/20'}`} />
                  <span 
                    className={`text-[11px] font-body ${si.completed ? 'text-foreground/30 line-through' : 'text-foreground/75'}`}
                    style={{ textShadow: si.completed ? 'none' : '0 1px 2px rgba(0,0,0,0.5)' }}
                  >
                    {si.title}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover/task:opacity-100 transition-opacity">
          <button onClick={() => setShowSub(!showSub)} className="text-[10px] text-foreground/50 hover:text-foreground/90 px-1 py-0.5 rounded hover:bg-white/10 transition-colors">+sub</button>
          <button onClick={() => onDelete(task.id)} className="text-foreground/50 hover:text-destructive/90 text-sm px-1 py-0.5 rounded hover:bg-white/10 transition-colors">×</button>
        </div>
      </div>

      {/* Sub-intention input */}
      {showSub && (
        <div className="ml-12 mb-2 flex items-center gap-2">
          <input
            type="text"
            value={subInput}
            onChange={e => onSubInputChange(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && onAddSub()}
            placeholder="Add sub-intention..."
            className="flex-1 bg-black/10 rounded px-2 py-1 text-[11px] font-body text-foreground/80 placeholder:text-foreground/30 outline-none border border-foreground/5 focus:border-primary/30 transition-colors shadow-inner"
            style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
          />
        </div>
      )}
    </div>
  );
}