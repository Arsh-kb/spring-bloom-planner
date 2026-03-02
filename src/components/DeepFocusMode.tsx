import { useState, useEffect, useCallback, useRef } from 'react';
import { usePlanner } from '@/context/PlannerContext';

export function DeepFocusMode() {
  const {
    deepFocusActive, exitDeepFocus, focusTaskId, tasks, toggleTask,
    pomodoroMinutes, pomodoroSeconds, pomodoroActive, togglePomodoro, resetPomodoro,
    defaultPomodoro,
  } = usePlanner();

  const [tabSwitches, setTabSwitches] = useState(0);
  const [showEndMenu, setShowEndMenu] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const startTimeRef = useRef(Date.now());

  const focusTask = focusTaskId ? tasks.find(t => t.id === focusTaskId) : null;
  const totalSeconds = defaultPomodoro * 60;
  const remainingSeconds = pomodoroMinutes * 60 + pomodoroSeconds;
  const progressPercent = totalSeconds > 0 ? ((totalSeconds - remainingSeconds) / totalSeconds) * 100 : 0;

  // Auto-start pomodoro on enter
  useEffect(() => {
    if (deepFocusActive && !pomodoroActive) {
      resetPomodoro();
      setTimeout(() => togglePomodoro(), 100);
    }
    startTimeRef.current = Date.now();
    setTabSwitches(0);
    setSessionComplete(false);
    setElapsedSeconds(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deepFocusActive]);

  // Elapsed counter
  useEffect(() => {
    if (!deepFocusActive) return;
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [deepFocusActive]);

  // Tab switch detection
  useEffect(() => {
    if (!deepFocusActive) return;
    const handler = () => {
      if (document.hidden) setTabSwitches(prev => prev + 1);
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, [deepFocusActive]);

  // Beforeunload warning
  useEffect(() => {
    if (!deepFocusActive) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [deepFocusActive]);

  // Detect timer completion
  useEffect(() => {
    if (deepFocusActive && !pomodoroActive && elapsedSeconds > 5) {
      setSessionComplete(true);
      // Browser notification
      if (Notification.permission === 'granted') {
        new Notification('🌿 Deep Focus Complete', { body: focusTask?.title || 'Session ended' });
      }
    }
  }, [pomodoroActive, deepFocusActive, elapsedSeconds, focusTask]);

  // Request notification permission
  useEffect(() => {
    if (deepFocusActive && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [deepFocusActive]);

  const handleEnd = useCallback(() => {
    resetPomodoro();
    exitDeepFocus();
  }, [resetPomodoro, exitDeepFocus]);

  if (!deepFocusActive) return null;

  const timeStr = `${pomodoroMinutes.toString().padStart(2, '0')}:${pomodoroSeconds.toString().padStart(2, '0')}`;
  const circumference = 2 * Math.PI * 120;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  if (sessionComplete) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 backdrop-blur-md">
        <div className="glass-panel rounded-[2rem] p-12 max-w-md w-full text-center space-y-6" style={{ boxShadow: '0 24px 80px rgba(0,0,0,0.6), inset 0 1px 0 hsla(0,0%,100%,0.08)' }}>
          {/* Completion pulse */}
          <div className="mx-auto w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center" style={{ animation: 'focus-breathe 3s ease-in-out infinite' }}>
            <span className="text-3xl">🌿</span>
          </div>
          <h2 className="font-display text-2xl text-foreground/95 text-nature">Session Complete</h2>
          {focusTask && (
            <p className="text-sm font-body text-foreground/70" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>{focusTask.title}</p>
          )}
          <div className="flex justify-center gap-6 text-xs font-body text-foreground/50">
            <div>
              <span className="block text-lg text-foreground/80">{defaultPomodoro}m</span>
              Duration
            </div>
            <div>
              <span className="block text-lg text-foreground/80">{tabSwitches}</span>
              Tab Switches
            </div>
          </div>
          {focusTask && !focusTask.completed && (
            <button
              onClick={() => toggleTask(focusTask.id)}
              className="glass-panel px-6 py-2 rounded-full text-xs font-body text-foreground/80 hover:text-foreground hover:bg-white/10 transition-colors shadow-md"
            >
              ✓ Mark Complete
            </button>
          )}
          <button
            onClick={handleEnd}
            className="block mx-auto text-xs font-body text-foreground/50 hover:text-foreground/80 transition-colors mt-2"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-8">
        {/* Timer ring */}
        <div className="relative">
          <svg width="280" height="280" className="rotate-[-90deg]">
            <circle cx="140" cy="140" r="120" fill="none" stroke="hsla(var(--foreground) / 0.08)" strokeWidth="3" />
            <circle
              cx="140" cy="140" r="120" fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="3"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000"
              style={{ filter: 'drop-shadow(0 0 8px hsl(var(--primary) / 0.3))' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className="font-display text-7xl text-foreground/95 tracking-tight"
              style={{
                textShadow: '0 0 20px hsl(var(--primary) / 0.2)',
                animation: pomodoroActive ? 'focus-breathe 10s ease-in-out infinite' : 'none',
              }}
            >
              {timeStr}
            </span>
            <span className="text-[10px] font-body text-foreground/40 uppercase tracking-[0.3em] mt-2">Deep Focus</span>
          </div>
        </div>

        {/* Active task */}
        {focusTask && (
          <div className="text-center space-y-3 max-w-sm">
            <div className="flex items-center justify-center gap-2">
              <span className="text-sm">
                {focusTask.priority === 'high' ? '🍒' : focusTask.priority === 'medium' ? '🌿' : '🍂'}
              </span>
              <h3 className="font-display text-xl text-foreground/90" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>
                {focusTask.title}
              </h3>
            </div>
            {/* Sub-intentions */}
            {focusTask.subIntentions && focusTask.subIntentions.length > 0 && (
              <div className="space-y-1.5 text-left mx-auto max-w-xs">
                {focusTask.subIntentions.map(si => (
                  <div key={si.id} className="flex items-center gap-2 px-3 py-1 rounded-md bg-white/5">
                    <div className={`w-2 h-2 rounded-full ${si.completed ? 'bg-primary/60' : 'bg-foreground/20'}`} />
                    <span className={`text-xs font-body ${si.completed ? 'text-foreground/40 line-through' : 'text-foreground/70'}`}
                      style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}
                    >{si.title}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab switch warning */}
        {tabSwitches > 0 && (
          <span className="text-[10px] font-body text-foreground/30 italic">
            Left focus {tabSwitches} time{tabSwitches > 1 ? 's' : ''}
          </span>
        )}

        {/* Controls */}
        <div className="flex items-center gap-4">
          <button
            onClick={togglePomodoro}
            className="glass-panel px-6 py-2 rounded-full text-sm font-body text-foreground/80 hover:text-foreground hover:bg-white/10 transition-colors shadow-md"
          >
            {pomodoroActive ? 'Pause' : 'Resume'}
          </button>
          <div className="relative">
            <button
              onClick={() => setShowEndMenu(!showEndMenu)}
              className="text-foreground/30 hover:text-foreground/60 transition-colors text-lg px-2"
              title="End session"
            >
              ⋯
            </button>
            {showEndMenu && (
              <button
                onClick={handleEnd}
                className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 glass-panel px-4 py-1.5 rounded-full text-xs font-body text-destructive/80 hover:text-destructive whitespace-nowrap shadow-lg"
              >
                End Session
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}