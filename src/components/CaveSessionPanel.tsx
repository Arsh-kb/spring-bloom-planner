import { useState, useEffect, useRef } from 'react';
import { usePlanner } from '@/context/PlannerContext';
import { useIsMobile } from '@/hooks/use-mobile';

export function CaveSessionPanel() {
  const { mode, tasks, todayDayId, journalOpen } = usePlanner();
  const isMobile = useIsMobile();
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [sprintLabel, setSprintLabel] = useState('');
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [showBreakNudge, setShowBreakNudge] = useState(false);
  const sessionStart = useRef(Date.now());

  useEffect(() => {
    if (mode !== 'cave') return;
    sessionStart.current = Date.now();
    setSessionSeconds(0);
    setShowBreakNudge(false);
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - sessionStart.current) / 1000);
      setSessionSeconds(elapsed);
      if (elapsed > 0 && elapsed % 5400 === 0) setShowBreakNudge(true);
    }, 1000);
    return () => clearInterval(interval);
  }, [mode]);

  if (mode !== 'cave') return null;

  const todayTasks = tasks.filter(t => t.date === todayDayId);
  const completedToday = todayTasks.filter(t => t.completed).length;
  const hours = Math.floor(sessionSeconds / 3600);
  const mins = Math.floor((sessionSeconds % 3600) / 60);
  const timeStr = hours > 0 ? `${hours}h ${mins.toString().padStart(2, '0')}m` : `${mins}m`;

  if (isMobile) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-30 h-12 bg-black/60 backdrop-blur-md border-t border-white/10 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <span className="text-lg font-display text-primary/90 tracking-tight" style={{ textShadow: '0 0 8px hsl(var(--primary) / 0.2)' }}>
            {timeStr}
          </span>
          <span className="text-[8px] font-body text-foreground/40 uppercase tracking-widest">session</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-body text-foreground/50">
            <span className="text-foreground/70">{completedToday}</span> done
          </span>
          {showBreakNudge && (
            <button onClick={() => setShowBreakNudge(false)} className="text-[10px] text-primary/70 bg-primary/10 rounded-full px-2 py-0.5">
              🌿 Break?
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-8 right-8 z-30 transition-all duration-700 ease-in-out">
      <div className="glass-panel p-4 rounded-2xl bg-black/50 border-white/8 shadow-2xl backdrop-blur-md space-y-2 min-w-[180px]">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-display text-primary/90 tracking-tight" style={{ textShadow: '0 0 12px hsl(var(--primary) / 0.2)' }}>
            {timeStr}
          </span>
          <span className="text-[9px] font-body text-foreground/40 uppercase tracking-[0.15em]">session</span>
        </div>
        {isEditingLabel ? (
          <input
            autoFocus
            value={sprintLabel}
            onChange={e => setSprintLabel(e.target.value)}
            onBlur={() => setIsEditingLabel(false)}
            onKeyDown={e => e.key === 'Enter' && setIsEditingLabel(false)}
            className="w-full bg-black/20 text-[11px] font-body text-foreground/80 border border-foreground/10 rounded px-2 py-1 outline-none focus:border-primary/40"
            placeholder="Sprint label..."
          />
        ) : (
          <button onClick={() => setIsEditingLabel(true)} className="text-[10px] font-body text-foreground/50 hover:text-foreground/80 transition-colors italic truncate block w-full text-left">
            {sprintLabel || '+ Set sprint label'}
          </button>
        )}
        <div className="text-[10px] font-body text-foreground/40">
          <span className="text-foreground/70">{completedToday}</span> tasks done today
        </div>
        {showBreakNudge && (
          <button onClick={() => setShowBreakNudge(false)} className="w-full text-[10px] font-body text-primary/70 bg-primary/10 rounded-full py-1 hover:bg-primary/20 transition-colors">
            🌿 Take a break?
          </button>
        )}
      </div>
    </div>
  );
}
