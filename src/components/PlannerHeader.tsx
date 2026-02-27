import { usePlanner } from '@/context/PlannerContext';
import type { LightingMode } from '@/types/planner';

const modes: { id: LightingMode; label: string; icon: string }[] = [
  { id: 'sun', label: 'Golden Hour', icon: '☀' },
  { id: 'shade', label: 'Seek Shade', icon: '🌿' },
  { id: 'cave', label: 'VibeCoding Cave', icon: '🪲' },
  { id: 'exam', label: 'Exam Zone', icon: '❄' },
];

export function PlannerHeader() {
  const { mode, setMode, zenMode, toggleZenMode } = usePlanner();

  return (
    <header className="relative z-20 flex items-center justify-between px-6 py-3">
      <h1 className="font-display text-xl text-foreground text-nature tracking-wide">
        Springscape
      </h1>

      <nav className="flex gap-1.5 items-center">
        {/* Zen Mode toggle */}
        <button
          onClick={toggleZenMode}
          className={`glass-panel px-3 py-1.5 rounded-full text-xs font-body transition-all duration-500 mr-2 ${
            zenMode
              ? 'ring-1 ring-accent/50 text-foreground'
              : 'text-muted-foreground hover:text-foreground/80'
          }`}
        >
          {zenMode ? '⟵ Back' : '✧ Zen'}
        </button>

        {modes.map(m => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={`glass-panel px-3 py-1.5 rounded-full text-xs font-body transition-all duration-500 ${
              mode === m.id
                ? 'ring-1 ring-primary/50 text-foreground'
                : 'text-muted-foreground hover:text-foreground/80'
            }`}
          >
            <span className="mr-1">{m.icon}</span>
            {m.label}
          </button>
        ))}
      </nav>
    </header>
  );
}
