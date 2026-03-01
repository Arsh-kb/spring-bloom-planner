import { useState } from 'react';
import { usePlanner } from '@/context/PlannerContext';
import type { LightingMode } from '@/types/planner';
import { VaultModal } from './VaultModal';
import { GlassboundNotebook } from './GlassboundNotebook';
import { generateWeekTitle } from '@/lib/narrativeEngine';
import { useCircadianRhythm } from '@/hooks/useCircadianRhythm';

const modes: { id: LightingMode; label: string; icon: string }[] = [
  { id: 'sun', label: 'Golden Hour', icon: '☀️' },
  { id: 'shade', label: 'Seek Shade', icon: '🌿' },
  { id: 'cave', label: 'VibeCoding Cave', icon: '🪲' },
  { id: 'exam', label: 'Exam Zone', icon: '❄️' },
];

export function PlannerHeader() {
  const { mode, setMode, zenMode, toggleZenMode, weekOffset, setWeekOffset, tasks, journal, season, currentWeekDates } = usePlanner();
  const [showVault, setShowVault] = useState(false);
  const [showNotebook, setShowNotebook] = useState(false);

  const weekTitle = generateWeekTitle(tasks, journal, currentWeekDates);
  const { suggestedMode } = useCircadianRhythm(mode, setMode, false);

  return (
    <>
      <header className="relative z-20 flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="font-display text-xl text-foreground text-nature tracking-wide">
              Springscape
            </h1>
            <p className="font-display text-[11px] italic text-foreground/35 leading-tight mt-0.5">{weekTitle}</p>
          </div>

          <div className="flex items-center glass-panel rounded-full overflow-hidden text-xs font-body">
            <button onClick={() => setWeekOffset(w => w - 1)} className="px-3 py-1.5 hover:bg-white/10 transition-colors">◀</button>
            <span className="px-2 py-1.5 border-x border-white/10 text-muted-foreground min-w-[80px] text-center">
              {weekOffset === 0 ? 'This Week' : weekOffset === -1 ? 'Last Week' : weekOffset === 1 ? 'Next Week' : `${Math.abs(weekOffset)} Wks ${weekOffset > 0 ? 'Ahead' : 'Ago'}`}
            </span>
            <button onClick={() => setWeekOffset(w => w + 1)} className="px-3 py-1.5 hover:bg-white/10 transition-colors">▶</button>
          </div>

          <span className="font-display text-[10px] italic text-foreground/30 tracking-wider">{season.label}</span>

          {/* Circadian hint */}
          {suggestedMode !== mode && (
            <button
              onClick={() => setMode(suggestedMode)}
              className="text-[9px] font-body text-foreground/20 hover:text-foreground/40 transition-colors italic"
              title={`Circadian suggests: ${suggestedMode}`}
            >
              ◐ {suggestedMode}
            </button>
          )}
        </div>

        <nav className="flex gap-1.5 items-center">
          <button onClick={() => setShowNotebook(true)} className="glass-panel px-3 py-1.5 rounded-full text-xs font-body transition-all duration-500 mr-1 text-muted-foreground hover:text-foreground/80">
            📓 Journal
          </button>
          <button onClick={() => setShowVault(true)} className="glass-panel px-3 py-1.5 rounded-full text-xs font-body transition-all duration-500 mr-2 text-muted-foreground hover:text-foreground/80">
            ⚙️ Vault
          </button>
          <button onClick={toggleZenMode} className={`glass-panel px-3 py-1.5 rounded-full text-xs font-body transition-all duration-500 mr-2 ${zenMode ? 'ring-1 ring-accent/50 text-foreground' : 'text-muted-foreground hover:text-foreground/80'}`}>
            {zenMode ? '⟵ Back' : '✧ Zen'}
          </button>
          {modes.map(m => (
            <button key={m.id} onClick={() => setMode(m.id)} className={`glass-panel px-3 py-1.5 rounded-full text-xs font-body transition-all duration-500 ${mode === m.id ? 'ring-1 ring-primary/50 text-foreground' : 'text-muted-foreground hover:text-foreground/80'}`}>
              <span className="mr-1">{m.icon}</span>{m.label}
            </button>
          ))}
        </nav>
      </header>
      {showVault && <VaultModal onClose={() => setShowVault(false)} />}
      {showNotebook && <GlassboundNotebook onClose={() => setShowNotebook(false)} />}
    </>
  );
}
