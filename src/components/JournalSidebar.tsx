import { useState, useRef, useCallback } from 'react';
import { usePlanner } from '@/context/PlannerContext';
import { useIsMobile } from '@/hooks/use-mobile';
import woodTexture from '@/assets/wood-texture.jpg';

export function JournalSidebar() {
  const { journal, addJournalEntry, days, todayDayId } = usePlanner();
  const [entry, setEntry] = useState('');
  const [expandedDay, setExpandedDay] = useState<string | null>(todayDayId);
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useIsMobile();

  const handleSubmit = () => {
    if (!entry.trim()) return;
    addJournalEntry(entry.trim(), todayDayId);
    setEntry('');
    setExpandedDay(todayDayId);
  };

  const journalByDay = days.map(day => ({
    day,
    entries: journal.filter(j => j.date === day.id),
  })).filter(g => g.entries.length > 0);

  // Toggle button for desktop collapsed state
  const ToggleButton = () => (
    <button
      onClick={() => setIsOpen(!isOpen)}
      className="fixed right-0 top-1/2 -translate-y-1/2 z-20 glass-panel bg-black/40 backdrop-blur-md px-1.5 py-3 rounded-l-lg border-r-0 text-foreground/60 hover:text-foreground hover:bg-black/60 transition-all shadow-lg"
      title="Toggle Journal"
    >
      <span className="text-xs">📓</span>
    </button>
  );

  // Mobile: full-screen overlay
  if (isMobile) {
    return (
      <>
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-14 right-3 z-20 glass-panel bg-black/40 backdrop-blur-md w-10 h-10 rounded-full flex items-center justify-center text-foreground/60 hover:text-foreground shadow-lg"
        >
          📓
        </button>
        {isOpen && (
          <div className="fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
            <div className="absolute inset-x-0 bottom-0 top-12 z-10 bg-background/95 rounded-t-2xl overflow-hidden flex flex-col">
              <div className="flex items-center justify-between px-4 py-3 border-b border-foreground/10">
                <h2 className="font-display text-base text-foreground/90 drop-shadow-md">Field Journal</h2>
                <button onClick={() => setIsOpen(false)} className="text-foreground/60 hover:text-foreground text-lg">×</button>
              </div>
              <JournalContent
                journalByDay={journalByDay}
                expandedDay={expandedDay}
                setExpandedDay={setExpandedDay}
                entry={entry}
                setEntry={setEntry}
                handleSubmit={handleSubmit}
              />
            </div>
          </div>
        )}
      </>
    );
  }

  // Desktop: collapsible sidebar
  if (!isOpen) return <ToggleButton />;

  return (
    <div className="w-72 xl:w-80 flex-shrink-0 relative overflow-hidden">
      <div className="absolute inset-0">
        <img src={woodTexture} alt="" className="w-full h-full object-cover opacity-40" />
        <div className="absolute inset-0 bg-background/75" />
      </div>
      <div className="absolute inset-0 inset-depth pointer-events-none" />

      <div className="relative z-10 h-full flex flex-col p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg text-foreground/90 text-nature drop-shadow-lg">Field Journal</h2>
          <button onClick={() => setIsOpen(false)} className="text-foreground/40 hover:text-foreground text-sm transition-colors">✕</button>
        </div>

        <JournalContent
          journalByDay={journalByDay}
          expandedDay={expandedDay}
          setExpandedDay={setExpandedDay}
          entry={entry}
          setEntry={setEntry}
          handleSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}

function JournalContent({ journalByDay, expandedDay, setExpandedDay, entry, setEntry, handleSubmit }: {
  journalByDay: { day: any; entries: any[] }[];
  expandedDay: string | null;
  setExpandedDay: (id: string | null) => void;
  entry: string;
  setEntry: (v: string) => void;
  handleSubmit: () => void;
}) {
  return (
      <div className="flex-1 flex flex-col overflow-hidden px-4 sm:px-0 pb-16 sm:pb-0">
      <div className="flex-1 overflow-y-auto space-y-1 mb-4 scrollbar-thin">
        {journalByDay.map(({ day, entries }) => {
          const isExpanded = expandedDay === day.id;
          return (
            <div key={day.id} className="relative">
              <button
                onClick={() => setExpandedDay(isExpanded ? null : day.id)}
                className="w-full text-left glass-panel rounded-md px-3 py-2.5 transition-all duration-500 relative overflow-hidden group bg-black/20"
                style={{
                  boxShadow: isExpanded
                    ? 'inset 0 1px 4px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.2)'
                    : 'inset 0 1px 2px rgba(0,0,0,0.2), 0 2px 6px rgba(0,0,0,0.15)',
                }}
              >
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-sm overflow-hidden flex-shrink-0 border border-white/10">
                      <img src={day.image} alt="" className="w-full h-full object-cover" />
                    </div>
                    <span className="font-display text-xs text-foreground drop-shadow-md">{day.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-foreground/50 font-body">{entries.length}</span>
                    <svg className={`w-3 h-3 text-foreground/40 transition-transform duration-500 ${isExpanded ? 'rotate-180' : ''}`} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 4.5l3 3 3-3" />
                    </svg>
                  </div>
                </div>
              </button>

              <div
                className="overflow-hidden transition-all duration-500 ease-out"
                style={{ maxHeight: isExpanded ? `${entries.length * 100}px` : '0px', opacity: isExpanded ? 1 : 0 }}
              >
                <div className="py-1.5 px-1 space-y-1.5">
                  {entries.map(j => (
                    <div
                      key={j.id}
                      className="rounded-md px-3 py-2 bg-black/25 border border-foreground/8"
                      style={{ boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.2)' }}
                    >
                      <p className="text-xs font-body text-foreground leading-relaxed drop-shadow-md">{j.content}</p>
                      <span className="text-[10px] text-foreground/50 mt-1 block font-body">
                        {new Date(j.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}

        {journalByDay.length === 0 && (
          <p className="text-xs italic text-foreground/50 font-body text-center py-4 drop-shadow-md">No entries yet</p>
        )}
      </div>

      <div className="bg-black/25 border border-foreground/12 rounded-lg p-2 focus-within:border-primary/40 transition-colors shadow-inner">
        <textarea
          value={entry}
          onChange={e => setEntry(e.target.value)}
          placeholder="Write a reflection..."
          className="w-full bg-transparent text-xs font-body text-foreground placeholder:text-foreground/40 resize-none h-16 outline-none p-1"
        />
        <button
          onClick={handleSubmit}
          className="w-full mt-1 text-xs font-body py-1.5 rounded bg-primary/15 text-primary hover:bg-primary/25 transition-colors border border-primary/20"
        >
          Add Entry
        </button>
      </div>
    </div>
  );
}
