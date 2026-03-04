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
import { useIsMobile } from '@/hooks/use-mobile';

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
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const modeMenuRef = useRef<HTMLDivElement>(null);
  const toolsMenuRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const weekTitle = generateWeekTitle(tasks, journal, currentWeekDates);
  const { suggestedMode } = useCircadianRhythm(mode, setMode, false);
  const { muted, toggleMute } = useAmbientSound(mode);

  const todayFirstTask = tasks.find(t => t.date === todayDayId && !t.completed);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (modeMenuRef.current && !modeMenuRef.current.contains(e.target as Node)) setShowModeMenu(false);
      if (toolsMenuRef.current && !toolsMenuRef.current.contains(e.target as Node)) setShowToolsMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const handler = () => setShowSearch(true);
    window.addEventListener('open-task-search' as any, handler);
    return () => window.removeEventListener('open-task-search' as any, handler);
  }, []);

  // Mobile header
  if (isMobile) {
    return (
      <>
        <header className="relative z-30 flex items-center justify-between px-3 py-2">
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/30 to-transparent pointer-events-none" />
          
          <div className="relative z-10 flex items-center gap-2">
            <h1 className="font-display text-base text-foreground text-nature tracking-wide drop-shadow-lg">Springscape</h1>
            <div className="flex items-center bg-black/30 backdrop-blur-md rounded-full overflow-hidden text-[10px] font-body border border-white/10">
              <button onClick={() => setWeekOffset(w => w - 1)} className="px-2 py-1 text-foreground/80">◀</button>
              <span className="px-1.5 py-1 border-x border-white/10 text-foreground/60 min-w-[52px] text-center">
                {weekOffset === 0 ? 'This Wk' : weekOffset === -1 ? 'Last Wk' : weekOffset === 1 ? 'Next Wk' : `${Math.abs(weekOffset)}w`}
              </span>
              <button onClick={() => setWeekOffset(w => w + 1)} className="px-2 py-1 text-foreground/80">▶</button>
            </div>
          </div>

          <div className="relative z-10 flex gap-1.5 items-center">
            <button onClick={() => setShowSearch(true)} className="glass-panel p-2 rounded-full text-xs text-foreground/70">🔍</button>
            <button onClick={() => setShowMobileMenu(!showMobileMenu)} className="glass-panel p-2 rounded-full text-xs text-foreground/70">☰</button>
          </div>
        </header>

        {/* Mobile menu sheet */}
        {showMobileMenu && (
          <div className="fixed inset-0 z-40" onClick={() => setShowMobileMenu(false)}>
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <div className="absolute top-12 right-2 left-2 z-50 glass-panel rounded-2xl bg-black/70 backdrop-blur-xl border border-white/10 p-4 space-y-1 shadow-2xl max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <p className="text-[10px] font-body text-foreground/40 uppercase tracking-widest mb-2">Mode</p>
              {modes.map(m => (
                <button
                  key={m.id}
                  onClick={() => { setMode(m.id); setShowMobileMenu(false); }}
                  className={`w-full px-3 py-2.5 text-left text-xs font-body rounded-lg transition-colors flex items-center gap-2.5 ${
                    mode === m.id ? 'text-foreground bg-primary/15' : 'text-foreground/70 hover:bg-white/5'
                  }`}
                >
                  <span>{m.icon}</span> {m.label}
                </button>
              ))}
              <div className="border-t border-foreground/10 my-2" />
              <p className="text-[10px] font-body text-foreground/40 uppercase tracking-widest mb-2">Tools</p>
              <button onClick={() => { setShowNotebook(true); setShowMobileMenu(false); }} className="w-full px-3 py-2.5 text-left text-xs font-body text-foreground/70 rounded-lg hover:bg-white/5 flex items-center gap-2.5">
                📓 Journal
              </button>
              <button onClick={() => { setShowAnalytics(true); setShowMobileMenu(false); }} className="w-full px-3 py-2.5 text-left text-xs font-body text-foreground/70 rounded-lg hover:bg-white/5 flex items-center gap-2.5">
                📊 Analytics
              </button>
              <button onClick={() => { setShowVault(true); setShowMobileMenu(false); }} className="w-full px-3 py-2.5 text-left text-xs font-body text-foreground/70 rounded-lg hover:bg-white/5 flex items-center gap-2.5">
                ⚙️ Vault
              </button>
              <button onClick={() => { enterDeepFocus(todayFirstTask?.id); setShowMobileMenu(false); }} className="w-full px-3 py-2.5 text-left text-xs font-body text-foreground/70 rounded-lg hover:bg-white/5 flex items-center gap-2.5">
                🎯 Deep Focus
              </button>
              <button onClick={() => { toggleZenMode(); setShowMobileMenu(false); }} className="w-full px-3 py-2.5 text-left text-xs font-body text-foreground/70 rounded-lg hover:bg-white/5 flex items-center gap-2.5">
                {zenMode ? '⟵ Exit Zen' : '✧ Zen Mode'}
              </button>
              <button onClick={() => { toggleMute(); setShowMobileMenu(false); }} className="w-full px-3 py-2.5 text-left text-xs font-body text-foreground/70 rounded-lg hover:bg-white/5 flex items-center gap-2.5">
                {muted ? '🔇 Unmute' : '🔊 Mute'}
              </button>
            </div>
          </div>
        )}

        {showVault && <VaultModal onClose={() => setShowVault(false)} />}
        {showNotebook && <GlassboundNotebook onClose={() => setShowNotebook(false)} />}
        {showAnalytics && <WeeklyAnalytics onClose={() => setShowAnalytics(false)} />}
        <TaskSearch open={showSearch} onClose={() => setShowSearch(false)} />
      </>
    );
  }

  // Desktop header
  return (
    <>
      <header className="relative z-30 flex items-center justify-between px-5 py-3">
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-transparent pointer-events-none" />

        <div className="relative z-10 flex items-center gap-3">
          <div>
            <h1 className="font-display text-lg text-foreground text-nature tracking-wide drop-shadow-lg">Springscape</h1>
            <p className="font-display text-[10px] italic text-foreground/60 leading-tight mt-0.5 drop-shadow-md">{weekTitle}</p>
          </div>

          <div className="flex items-center bg-black/30 backdrop-blur-md rounded-full overflow-hidden text-xs font-body border border-white/10 shadow-inner">
            <button onClick={() => setWeekOffset(w => w - 1)} className="px-2.5 py-1.5 hover:bg-white/10 text-foreground/80 hover:text-foreground transition-colors">◀</button>
            <span className="px-2 py-1.5 border-x border-white/10 text-foreground/60 min-w-[72px] text-center text-[11px] drop-shadow-md">
              {weekOffset === 0 ? 'This Week' : weekOffset === -1 ? 'Last Week' : weekOffset === 1 ? 'Next Week' : `${Math.abs(weekOffset)}w ${weekOffset > 0 ? 'ahead' : 'ago'}`}
            </span>
            <button onClick={() => setWeekOffset(w => w + 1)} className="px-2.5 py-1.5 hover:bg-white/10 text-foreground/80 hover:text-foreground transition-colors">▶</button>
          </div>

          <WeeklyStreakDots />

          <span className="font-display text-[10px] italic text-foreground/50 tracking-wider hidden lg:inline drop-shadow-md">{season.label}</span>

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

        <nav className="relative z-10 flex gap-1.5 items-center">
          <button onClick={() => setShowSearch(true)} className="glass-panel px-3 py-1.5 rounded-full text-xs font-body transition-all duration-300 text-foreground/70 hover:text-foreground hover:bg-white/5 shadow-sm" title="Search tasks (/)">
            🔍
          </button>
          <button onClick={toggleMute} className="glass-panel px-3 py-1.5 rounded-full text-xs font-body transition-all duration-300 text-foreground/70 hover:text-foreground hover:bg-white/5 shadow-sm" title={muted ? 'Unmute' : 'Mute'}>
            {muted ? '🔇' : '🔊'}
          </button>
          <button onClick={() => enterDeepFocus(todayFirstTask?.id)} className="glass-panel px-3 py-1.5 rounded-full text-xs font-body transition-all duration-300 text-foreground/70 hover:text-foreground hover:bg-white/5 shadow-sm" title="Deep Focus (D)">
            🎯
          </button>

          <div ref={toolsMenuRef} className="relative">
            <button onClick={() => { setShowToolsMenu(!showToolsMenu); setShowModeMenu(false); }} className="glass-panel px-3 py-1.5 rounded-full text-xs font-body transition-all duration-300 text-foreground/70 hover:text-foreground hover:bg-white/5 shadow-sm">
              ✦ Tools
            </button>
            {showToolsMenu && (
              <div className="absolute right-0 top-full mt-2 glass-panel rounded-xl overflow-hidden min-w-[160px] shadow-2xl border border-white/10 py-1 z-50 bg-black/60 backdrop-blur-xl">
                <button data-journal-btn onClick={() => { setShowNotebook(true); setShowToolsMenu(false); }} className="w-full px-4 py-2.5 text-left text-xs font-body text-foreground/80 hover:bg-white/10 hover:text-foreground transition-colors flex items-center gap-2.5">
                  <span className="opacity-70">📓</span> Journal
                </button>
                <button onClick={() => { setShowAnalytics(true); setShowToolsMenu(false); }} className="w-full px-4 py-2.5 text-left text-xs font-body text-foreground/80 hover:bg-white/10 hover:text-foreground transition-colors flex items-center gap-2.5">
                  <span className="opacity-70">📊</span> Analytics
                </button>
                <button onClick={() => { setShowVault(true); setShowToolsMenu(false); }} className="w-full px-4 py-2.5 text-left text-xs font-body text-foreground/80 hover:bg-white/10 hover:text-foreground transition-colors flex items-center gap-2.5">
                  <span className="opacity-70">⚙️</span> Vault
                </button>
                <div className="border-t border-foreground/5 my-1" />
                <button onClick={() => { toggleZenMode(); setShowToolsMenu(false); }} className={`w-full px-4 py-2.5 text-left text-xs font-body transition-colors flex items-center gap-2.5 ${zenMode ? 'text-primary' : 'text-foreground/80 hover:bg-white/10 hover:text-foreground'}`}>
                  <span className="opacity-70">{zenMode ? '⟵' : '✧'}</span> {zenMode ? 'Exit Zen' : 'Zen Mode'}
                </button>
              </div>
            )}
          </div>

          <div ref={modeMenuRef} className="relative">
            <button onClick={() => { setShowModeMenu(!showModeMenu); setShowToolsMenu(false); }} className="glass-panel px-3 py-1.5 rounded-full text-xs font-body transition-all duration-300 shadow-sm ring-1 ring-primary/40 text-foreground/90 bg-primary/10">
              {modes.find(m => m.id === mode)?.icon} {modes.find(m => m.id === mode)?.label}
            </button>
            {showModeMenu && (
              <div className="absolute right-0 top-full mt-2 glass-panel rounded-xl overflow-hidden min-w-[170px] shadow-2xl border border-white/10 py-1 z-50 bg-black/60 backdrop-blur-xl">
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
