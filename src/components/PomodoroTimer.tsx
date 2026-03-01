import { usePlanner } from '@/context/PlannerContext';

export function PomodoroTimer() {
  const { mode, pomodoroMinutes, pomodoroSeconds, pomodoroActive, togglePomodoro, resetPomodoro, zenMode } = usePlanner();

  // The timer only appears in 'cave' mode as per your current logic
  if (mode !== 'cave') return null;

  const timeStr = `${pomodoroMinutes.toString().padStart(2, '0')}:${pomodoroSeconds.toString().padStart(2, '0')}`;

  return (
    <div className="fixed bottom-8 left-8 z-30 pointer-events-none transition-all duration-700 ease-in-out">
      {/* Compact Glass Widget: 
        Uses your 'glass-panel' and 'shadow-2xl' for a physical, tactile feel.
      */}
      <div className="pointer-events-auto glass-panel p-5 rounded-3xl flex flex-col items-center bg-black/40 border-white/5 shadow-2xl backdrop-blur-md">
        
        {/* Reduced Neon Highlighting:
          Lowered the font size to 6xl and replaced aggressive glows with a soft, 
          low-opacity primary tint.
        */}
        <div 
          className={`text-5xl tracking-tighter transition-all duration-1000 ${
            pomodoroActive ? 'opacity-100' : 'opacity-60'
          }`}
          style={{ 
            color: 'hsl(var(--primary))',
            // Softened glow: reduced spread and intensity to prevent distraction
            textShadow: pomodoroActive 
              ? '0 0 15px hsl(var(--primary) / 0.3)' 
              : 'none'
          }}
        >
          {timeStr}
        </div>
        
        <p className="text-[8px] font-body text-foreground/100 mt-1 mb-2 uppercase tracking-[0.2em]">
          Focus
        </p>
        
        <div className="flex gap-1 justify-center">
          <button
            onClick={togglePomodoro}
            className={`px-4 py-1.5 rounded-full text-xs font-body transition-all duration-300 ${
              pomodoroActive 
                ? 'bg-primary/20 text-primary border border-primary/30 shadow-[0_0_10px_rgba(var(--primary),0.1)]' 
                : 'glass-panel text-foreground/60 hover:text-foreground'
            }`}
          >
            {pomodoroActive ? 'Pause' : 'Start'}
          </button>
          <button
            onClick={resetPomodoro}
            className="px-4 py-1.5 rounded-full text-xs font-body text-foreground/30 hover:text-foreground/60 transition-colors"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}