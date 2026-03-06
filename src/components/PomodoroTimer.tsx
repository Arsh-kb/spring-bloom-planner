import { usePlanner } from '@/context/PlannerContext';
import { useIsMobile } from '@/hooks/use-mobile';

export function PomodoroTimer() {
  const { mode, pomodoroMinutes, pomodoroSeconds, pomodoroActive, togglePomodoro, resetPomodoro, deepFocusActive, journalOpen } = usePlanner();
  const isMobile = useIsMobile();

  if (mode === 'cave' || deepFocusActive || journalOpen) return null;

  const timeStr = `${pomodoroMinutes.toString().padStart(2, '0')}:${pomodoroSeconds.toString().padStart(2, '0')}`;

  if (isMobile) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-30 h-12 bg-black/60 backdrop-blur-md border-t border-white/10 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <span
            className={`text-lg font-display tracking-tight ${pomodoroActive ? 'text-primary' : 'text-foreground/60'}`}
            style={{ textShadow: pomodoroActive ? '0 0 8px hsl(var(--primary) / 0.3)' : 'none' }}
          >
            {timeStr}
          </span>
          <span className="text-[8px] font-body text-foreground/40 uppercase tracking-widest">Focus</span>
        </div>
        <div className="flex gap-2">
          <button onClick={togglePomodoro} className={`px-3 py-1 rounded-full text-[11px] font-body transition-all ${
            pomodoroActive ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-white/5 text-foreground/60'
          }`}>
            {pomodoroActive ? 'Pause' : 'Start'}
          </button>
          <button onClick={resetPomodoro} className="px-2 py-1 rounded-full text-[11px] font-body text-foreground/30">
            Reset
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-8 right-8 z-30 pointer-events-none transition-all duration-700 ease-in-out">
      <div className="pointer-events-auto glass-panel p-5 rounded-3xl flex flex-col items-center bg-black/50 border-white/8 shadow-2xl backdrop-blur-md">
        <div
          className={`text-5xl tracking-tighter transition-all duration-1000 ${pomodoroActive ? 'opacity-100' : 'opacity-60'}`}
          style={{
            color: 'hsl(var(--primary))',
            textShadow: pomodoroActive ? '0 0 15px hsl(var(--primary) / 0.3)' : 'none',
          }}
        >
          {timeStr}
        </div>
        <p className="text-[8px] font-body text-foreground/100 mt-1 mb-2 uppercase tracking-[0.2em]">Focus</p>
        <div className="flex gap-1 justify-center">
          <button onClick={togglePomodoro} className={`px-4 py-1.5 rounded-full text-xs font-body transition-all duration-300 ${
            pomodoroActive ? 'bg-primary/20 text-primary border border-primary/30' : 'glass-panel text-foreground/60 hover:text-foreground'
          }`}>
            {pomodoroActive ? 'Pause' : 'Start'}
          </button>
          <button onClick={resetPomodoro} className="px-4 py-1.5 rounded-full text-xs font-body text-foreground/30 hover:text-foreground/60 transition-colors">
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
