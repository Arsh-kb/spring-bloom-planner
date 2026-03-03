import { useState, useRef, useEffect } from 'react';
import { usePlanner } from '@/context/PlannerContext';
import type { LightingMode } from '@/types/planner';
import { VaultModal } from './VaultModal';
import { GlassboundNotebook } from './GlassboundNotebook';
import { WeeklyStreakDots } from './WeeklyStreakDots';
import { WeeklyAnalytics } from './WeeklyAnalytics';
import { TaskSearch } from './TaskSearch';
import { generateWeekTitle } from '@/lib/narrativeEngine';
import { useCircadianRhythm } from '@/hooks/useCircadianRhythm';
import { useAmbientSound } from '@/hooks/useAmbientSound';

const modes: { id: LightingMode; label: string; icon: string }[] = [
  { id: 'sun', label: 'Golden Hour', icon: '☀️' },
  { id: 'shade', label: 'Seek Shade', icon: '🌿' },
  { id: 'cave', label: 'VibeCoding Cave', icon: '🪲' },
  { id: 'exam', label: 'Exam Zone', icon: '❄️' },
];

export function PlannerHeader() {
  const { mode, setMode, zenMode, toggleZenMode, weekOffset, setWeekOffset, tasks, journal, season, currentWeekDates, enterDeepFocus, todayDayId } = usePlanner();
  const [showVault, setShowVault] = useState(false);
  const [showNotebook, setShowNotebook] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showModeMenu, setShowModeMenu] = useState(false);
  const [showToolsMenu, setShowToolsMenu] = useState(false);
  const modeMenuRef = useRef<HTMLDivElement>(null);
  const toolsMenuRef = useRef<HTMLDivElement>(null);

  const weekTitle = generateWeekTitle(tasks, journal, currentWeekDates);
  const { suggestedMode } = useCircadianRhythm(mode, setMode, false);
  const { muted, toggleMute } = useAmbientSound(mode);

  const todayFirstTask = tasks.find(t => t.date === todayDayId && !t.completed);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (modeMenuRef.current && !modeMenuRef.current.contains(e.target as Node)) setShowModeMenu(false);
      if (toolsMenuRef.current && !toolsMenuRef.current.contains(e.target as Node)) setShowToolsMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Expose search toggle for keyboard shortcut
  useEffect(() => {
    const handler = (e: CustomEvent) => setShowSearch(true);
    window.addEventListener('open-task-search' as any, handler);
    return () => window.removeEventListener('open-task-search' as any, handler);
  }, []);

  return (
    <>
      <header className="relative z-30 flex items-center justify-between px-5 py-3">
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-transparent pointer-events-none" />

        {/* Left: Brand + Week nav */}
        <div className="relative z-10 flex items-center gap-3">
          <div>
            <h1 className="font-display text-lg text-foreground/95 text-nature tracking-wide drop-shadow-md">
              Springscape
            </h1>
            <p className="font-display text-[10px] italic text-foreground/60 leading-tight mt-0.5 drop-shadow-sm">{weekTitle}</p>
          </div>

          {/* Week nav */}
          <div className="flex items-center bg-black/20 backdrop-blur-md rounded-full overflow-hidden text-xs font-body border border-white/10 shadow-inner">
            <button onClick={() => setWeekOffset(w => w - 1)} className="px-2.5 py-1.5 hover:bg-white/10 text-foreground/80 hover:text-foreground transition-colors">◀</button>
            <span className="px-2 py-1.5 border-x border-white/10 text-foreground/60 min-w-[72px] text-center text-[11px]" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
              {weekOffset === 0 ? 'This Week' : weekOffset === -1 ? 'Last Week' : weekOffset === 1 ? 'Next Week' : `${Math.abs(weekOffset)}w ${weekOffset > 0 ? 'ahead' : 'ago'}`}
            </span>
            <button onClick={() => setWeekOffset(w => w + 1)} className="px-2.5 py-1.5 hover:bg-white/10 text-foreground/80 hover:text-foreground transition-colors">▶</button>
          </div>

          <WeeklyStreakDots />

          <span className="font-display text-[10px] italic text-foreground/50 tracking-wider hidden lg:inline" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>{season.label}</span>

          {suggestedMode !== mode && (
            <button
              onClick={() => setMode(suggestedMode)}
              className="text-[9px] font-body text-primary/60 hover:text-primary transition-colors italic bg-black/20 px-2 py-1 rounded-full border border-primary/20 hidden md:inline-flex"
              title={`Circadian suggests: ${suggestedMode}`}
            >
              ◐ {suggestedMode}
            </button>
          )}
        </div>

        {/* Right: Actions (consolidated) */}
        <nav className="relative z-10 flex gap-1.5 items-center">
          {/* Search */}
          <button
            onClick={() => setShowSearch(true)}
            className="glass-panel px-3 py-1.5 rounded-full text-xs font-body transition-all duration-300 text-foreground/70 hover:text-foreground hover:bg-white/5 shadow-sm"
            title="Search tasks (/)"
          >
            🔍
          </button>

          {/* Sound */}
          <button
            onClick={toggleMute}
            className="glass-panel px-3 py-1.5 rounded-full text-xs font-body transition-all duration-300 text-foreground/70 hover:text-foreground hover:bg-white/5 shadow-sm"
            title={muted ? 'Unmute' : 'Mute'}
          >
            {muted ? '🔇' : '🔊'}
          </button>

          {/* Deep Focus */}
          <button
            onClick={() => enterDeepFocus(todayFirstTask?.id)}
            className="glass-panel px-3 py-1.5 rounded-full text-xs font-body transition-all duration-300 text-foreground/70 hover:text-foreground hover:bg-white/5 shadow-sm"
            title="Deep Focus (D)"
          >
            🎯
          </button>

          {/* Tools dropdown: Journal, Analytics, Vault */}
          <div ref={toolsMenuRef} className="relative">
            <button
              onClick={() => { setShowToolsMenu(!showToolsMenu); setShowModeMenu(false); }}
              className="glass-panel px-3 py-1.5 rounded-full text-xs font-body transition-all duration-300 text-foreground/70 hover:text-foreground hover:bg-white/5 shadow-sm"
            >
              ✦ Tools
            </button>
            {showToolsMenu && (
              <div className="absolute right-0 top-full mt-2 glass-panel rounded-xl overflow-hidden min-w-[160px] shadow-2xl border border-white/10 py-1 z-50">
                <button
                  data-journal-btn
                  onClick={() => { setShowNotebook(true); setShowToolsMenu(false); }}
                  className="w-full px-4 py-2.5 text-left text-xs font-body text-foreground/80 hover:bg-white/10 hover:text-foreground transition-colors flex items-center gap-2.5"
                >
                  <span className="opacity-70">📓</span> Journal
                </button>
                <button
                  onClick={() => { setShowAnalytics(true); setShowToolsMenu(false); }}
                  className="w-full px-4 py-2.5 text-left text-xs font-body text-foreground/80 hover:bg-white/10 hover:text-foreground transition-colors flex items-center gap-2.5"
                >
                  <span className="opacity-70">📊</span> Analytics
                </button>
                <button
                  onClick={() => { setShowVault(true); setShowToolsMenu(false); }}
                  className="w-full px-4 py-2.5 text-left text-xs font-body text-foreground/80 hover:bg-white/10 hover:text-foreground transition-colors flex items-center gap-2.5"
                >
                  <span className="opacity-70">⚙️</span> Vault
                </button>
                <div className="border-t border-foreground/5 my-1" />
                <button
                  onClick={() => { toggleZenMode(); setShowToolsMenu(false); }}
                  className={`w-full px-4 py-2.5 text-left text-xs font-body transition-colors flex items-center gap-2.5 ${
                    zenMode ? 'text-primary' : 'text-foreground/80 hover:bg-white/10 hover:text-foreground'
                  }`}
                >
                  <span className="opacity-70">{zenMode ? '⟵' : '✧'}</span> {zenMode ? 'Exit Zen' : 'Zen Mode'}
                </button>
              </div>
            )}
          </div>

          {/* Mode dropdown */}
          <div ref={modeMenuRef} className="relative">
            <button
              onClick={() => { setShowModeMenu(!showModeMenu); setShowToolsMenu(false); }}
              className={`glass-panel px-3 py-1.5 rounded-full text-xs font-body transition-all duration-300 shadow-sm ring-1 ring-primary/40 text-foreground/90 bg-primary/10`}
            >
              {modes.find(m => m.id === mode)?.icon} {modes.find(m => m.id === mode)?.label}
            </button>
            {showModeMenu && (
              <div className="absolute right-0 top-full mt-2 glass-panel rounded-xl overflow-hidden min-w-[170px] shadow-2xl border border-white/10 py-1 z-50">
                {modes.map(m => (
                  <button
                    key={m.id}
                    onClick={() => { setMode(m.id); setShowModeMenu(false); }}
                    className={`w-full px-4 py-2.5 text-left text-xs font-body transition-colors flex items-center gap-2.5 ${
                      mode === m.id ? 'text-foreground bg-primary/10' : 'text-foreground/70 hover:bg-white/10 hover:text-foreground'
                    }`}
                  >
                    <span className="opacity-80">{m.icon}</span> {m.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <span className="text-[9px] font-body text-foreground/30 ml-0.5 hidden md:inline" title="Press ? for shortcuts">⌨ ?</span>
        </nav>
      </header>

      {showVault && <VaultModal onClose={() => setShowVault(false)} />}
      {showNotebook && <GlassboundNotebook onClose={() => setShowNotebook(false)} />}
      {showAnalytics && <WeeklyAnalytics onClose={() => setShowAnalytics(false)} />}
      <TaskSearch open={showSearch} onClose={() => setShowSearch(false)} />
    </>
  );
}
