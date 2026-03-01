import { useState, useEffect, useRef, useCallback } from 'react';
import { usePlanner } from '@/context/PlannerContext';
import type { JournalMood } from '@/types/planner';

const moodTints: Record<JournalMood, string> = {
  calm: 'hsla(200, 40%, 60%, 0.04)',
  focused: 'hsla(38, 50%, 60%, 0.04)',
  energized: 'hsla(80, 50%, 55%, 0.04)',
  reflective: 'hsla(260, 30%, 55%, 0.04)',
};

interface GlassboundNotebookProps {
  onClose: () => void;
}

export function GlassboundNotebook({ onClose }: GlassboundNotebookProps) {
  const { journal, addJournalEntry, days, todayDayId } = usePlanner();
  const [entry, setEntry] = useState('');
  const [mood, setMood] = useState<JournalMood>('reflective');
  const [visible, setVisible] = useState(false);
  const [parallaxOffset, setParallaxOffset] = useState({ x: 0, y: 0 });
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  // Parallax on mouse move
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 5;
      const y = (e.clientY / window.innerHeight - 0.5) * 5;
      setParallaxOffset({ x, y });
    };
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, []);

  const handleClose = useCallback(() => {
    setVisible(false);
    setTimeout(onClose, 600);
  }, [onClose]);

  const handleSubmit = () => {
    if (!entry.trim()) return;
    addJournalEntry(entry.trim(), todayDayId, mood);
    setEntry('');
  };

  const moodCycle: JournalMood[] = ['calm', 'focused', 'energized', 'reflective'];
  const moodIcons: Record<JournalMood, string> = { calm: '🌊', focused: '🔥', energized: '⚡', reflective: '🌙' };

  const todayName = days.find(d => d.id === todayDayId)?.name || 'Today';
  const dateLabel = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  // Group journal by date (recent first)
  const entriesByDate = [...new Set(journal.map(j => j.date))].sort().reverse().map(date => ({
    date,
    dayName: days.find(d => d.id === date)?.name || date,
    entries: journal.filter(j => j.date === date).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
  }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-700"
        style={{ opacity: visible ? 1 : 0 }}
        onClick={handleClose}
      />

      {/* Glass Notebook Pane */}
      <div
        className="relative z-10 w-full h-full max-w-[880px] max-h-[92vh] my-auto mx-auto transition-all duration-[1500ms] ease-out overflow-hidden"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible
            ? `translate3d(${parallaxOffset.x}px, ${parallaxOffset.y}px, 0) scale(1)`
            : 'scale(0.92)',
          borderRadius: '3rem',
          background: `linear-gradient(180deg, ${moodTints[mood]}, hsla(var(--glass-bg)))`,
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)',
          border: '1px solid hsla(var(--glass-border))',
          boxShadow: '0 24px 80px rgba(0,0,0,0.6), inset 0 1px 0 hsla(0,0%,100%,0.1)',
        }}
      >
        {/* Ruled lines background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ borderRadius: '3rem' }}>
          <svg width="100%" height="100%" className="opacity-[0.06]">
            <defs>
              <pattern id="ruled" width="100%" height="32" patternUnits="userSpaceOnUse">
                <line x1="0" y1="31" x2="100%" y2="31" stroke="currentColor" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#ruled)" />
          </svg>
        </div>

        {/* Polished Close button */}
        <button
          onClick={handleClose}
          className="absolute top-6 right-6 z-20 w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-foreground/80 hover:text-foreground transition-colors text-sm shadow-lg"
        >
          ×
        </button>

        {/* Content */}
        <div ref={scrollRef} className="relative z-10 h-full overflow-y-auto px-8 md:px-16 py-10 scrollbar-thin" style={{ scrollBehavior: 'smooth' }}>
          {/* Floating date stamp */}
          <div className="mb-12">
            <h1 className="font-display text-3xl text-foreground/95 drop-shadow-md text-nature mb-1">{todayName}</h1>
            <p className="font-display text-sm italic text-foreground/60 drop-shadow-sm">{dateLabel}</p>
          </div>

          {/* Writing area */}
          <div className="max-w-[720px] mx-auto">
            {/* New entry input */}
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-3 pl-2">
                <button
                  onClick={() => setMood(moodCycle[(moodCycle.indexOf(mood) + 1) % moodCycle.length])}
                  className="text-lg hover:scale-110 transition-transform drop-shadow-sm"
                  title={mood}
                >
                  {moodIcons[mood]}
                </button>
                <span className="text-[11px] font-display italic text-foreground/50 capitalize" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>{mood}</span>
              </div>
              
              {/* Added Input Well */}
              <div className="bg-black/10 border border-foreground/10 rounded-xl p-4 focus-within:border-primary/30 transition-colors shadow-inner">
                <textarea
                  ref={textareaRef}
                  value={entry}
                  onChange={e => setEntry(e.target.value)}
                  placeholder="Begin writing..."
                  rows={5}
                  className="w-full bg-transparent text-base font-body text-foreground/90 placeholder:text-foreground/30 resize-none outline-none leading-[32px]"
                  style={{ lineHeight: '32px', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
                />
              </div>
              
              {entry.trim() && (
                <div className="flex justify-end mt-3">
                  <button
                    onClick={handleSubmit}
                    className="glass-panel px-6 py-2 rounded-full text-xs font-body text-foreground/80 hover:text-foreground transition-colors hover:bg-white/10 shadow-md"
                  >
                    Save Entry
                  </button>
                </div>
              )}
            </div>

            {/* Existing entries */}
            <div className="space-y-10">
              {entriesByDate.map(({ date, dayName, entries }) => (
                <div key={date}>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="font-display text-xs italic text-foreground/50" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>{dayName}</span>
                    <div className="flex-1 h-px bg-foreground/10" />
                    <span className="text-[10px] font-body text-foreground/40" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>
                      {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <div className="space-y-4">
                    {entries.map(j => (
                      <div key={j.id} className="group bg-black/5 border border-white/5 rounded-xl p-5 shadow-sm hover:bg-black/10 transition-colors">
                        <p className="text-sm font-body text-foreground/90 leading-[32px]" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>{j.content}</p>
                        <div className="flex items-center gap-2 mt-3">
                          <span className="text-[10px] text-foreground/40 font-body">
                            {new Date(j.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                          </span>
                          {j.mood && <span className="text-[10px] text-foreground/30 font-display italic capitalize">{j.mood}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}