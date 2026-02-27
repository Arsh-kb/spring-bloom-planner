import { usePlanner } from '@/context/PlannerContext';

export function PomodoroTimer() {
  const { mode, pomodoroMinutes, pomodoroSeconds, pomodoroActive, togglePomodoro, resetPomodoro } = usePlanner();

  if (mode !== 'cave') return null;

  const timeStr = `${pomodoroMinutes.toString().padStart(2, '0')}:${pomodoroSeconds.toString().padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center pointer-events-none">
      <div className="pointer-events-auto text-center">
        <div className={`font-display text-7xl tracking-wider neon-glow ${pomodoroActive ? 'animate-pulse-glow' : ''}`}
          style={{ color: 'hsl(var(--primary))' }}>
          {timeStr}
        </div>
        <p className="text-xs font-body text-muted-foreground mt-2 mb-4">Focus Timer</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={togglePomodoro}
            className="glass-panel px-4 py-1.5 rounded-full text-xs font-body text-foreground/80 hover:text-foreground transition-colors"
          >
            {pomodoroActive ? 'Pause' : 'Start'}
          </button>
          <button
            onClick={resetPomodoro}
            className="glass-panel px-4 py-1.5 rounded-full text-xs font-body text-muted-foreground hover:text-foreground transition-colors"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
