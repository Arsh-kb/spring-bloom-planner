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
      <header className="relative z-30 flex items-center justify-between px-6 py-4">
        {/* Protective Top Scrim for Readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-transparent pointer-events-none" />
        
        <div className="relative z-10 flex items-center gap-4">
          <div>
            <h1 className="font-display text-xl text-foreground/95 text-nature tracking-wide drop-shadow-md">
              Springscape
            </h1>
            <p className="font-display text-[11px] italic text-foreground/60 leading-tight mt-0.5 drop-shadow-sm">{weekTitle}</p>
          </div>

          <div className="flex items-center bg-black/20 backdrop-blur-md rounded-full overflow-hidden text-xs font-body border border-white/10 shadow-inner">
            <button onClick={() => setWeekOffset(w => w - 1)} className="px-3 py-1.5 hover:bg-white/10 text-foreground/80 hover:text-foreground transition-colors">◀</button>
            <span className="px-2 py-1.5 border-x border-white/10 text-foreground/60 min-w-[80px] text-center" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
              {weekOffset === 0 ? 'This Week' : weekOffset === -1 ? 'Last Week' : weekOffset === 1 ? 'Next Week' : `${Math.abs(weekOffset)} Wks ${weekOffset > 0 ? 'Ahead' : 'Ago'}`}
            </span>
            <button onClick={() => setWeekOffset(w => w + 1)} className="px-3 py-1.5 hover:bg-white/10 text-foreground/80 hover:text-foreground transition-colors">▶</button>
          </div>

          <span className="font-display text-[11px] italic text-foreground/50 tracking-wider" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>{season.label}</span>

          {/* Circadian hint */}
          {suggestedMode !== mode && (
            <button
              onClick={() => setMode(suggestedMode)}
              className="text-[10px] font-body text-primary/60 hover:text-primary transition-colors italic bg-black/20 px-2 py-1 rounded-full border border-primary/20"
              title={`Circadian suggests: ${suggestedMode}`}
            >
              ◐ {suggestedMode}
            </button>
          )}
        </div>

        <nav className="relative z-10 flex gap-2 items-center">
          <button onClick={() => setShowNotebook(true)} className="glass-panel px-4 py-1.5 rounded-full text-xs font-body transition-all duration-500 text-foreground/70 hover:text-foreground hover:bg-white/5 shadow-sm">
            📓 Journal
          </button>
          <button onClick={() => setShowVault(true)} className="glass-panel px-4 py-1.5 rounded-full text-xs font-body transition-all duration-500 text-foreground/70 hover:text-foreground hover:bg-white/5 shadow-sm">
            ⚙️ Vault
          </button>
          <button onClick={toggleZenMode} className={`glass-panel px-4 py-1.5 rounded-full text-xs font-body transition-all duration-500 shadow-sm ${zenMode ? 'ring-1 ring-primary/50 text-foreground bg-black/20' : 'text-foreground/70 hover:text-foreground hover:bg-white/5'}`}>
            {zenMode ? '⟵ Back' : '✧ Zen'}
          </button>
          {modes.map(m => (
            <button key={m.id} onClick={() => setMode(m.id)} className={`glass-panel px-4 py-1.5 rounded-full text-xs font-body transition-all duration-500 shadow-sm ${mode === m.id ? 'ring-1 ring-primary/60 text-foreground bg-primary/10' : 'text-foreground/60 hover:text-foreground hover:bg-white/5'}`}>
              <span className="mr-1.5 opacity-80">{m.icon}</span>{m.label}
            </button>
          ))}
        </nav>
      </header>
      {showVault && <VaultModal onClose={() => setShowVault(false)} />}
      {showNotebook && <GlassboundNotebook onClose={() => setShowNotebook(false)} />}
    </>
  );
}