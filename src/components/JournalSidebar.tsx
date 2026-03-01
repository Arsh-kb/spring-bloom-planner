import { useState } from 'react';
import { usePlanner } from '@/context/PlannerContext';
import woodTexture from '@/assets/wood-texture.jpg';

export function JournalSidebar() {
  const { journal, addJournalEntry, days, todayDayId } = usePlanner();
  const [entry, setEntry] = useState('');
  const [expandedDay, setExpandedDay] = useState<string | null>(todayDayId);

  const handleSubmit = () => {
    if (!entry.trim()) return;
    addJournalEntry(entry.trim(), todayDayId);
    setEntry('');
    setExpandedDay(todayDayId);
  };

  // Group journal entries by day
  const journalByDay = days.map(day => ({
    day,
    entries: journal.filter(j => j.date === day.id),
  })).filter(g => g.entries.length > 0);

  return (
    <div className="w-72 xl:w-80 flex-shrink-0 relative overflow-hidden">
      {/* Wood texture background */}
      <div className="absolute inset-0">
        <img src={woodTexture} alt="" className="w-full h-full object-cover opacity-40" />
        <div className="absolute inset-0 bg-background/70" />
      </div>

      {/* Inset shadow for depth */}
      <div className="absolute inset-0 inset-depth pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col p-4">
        <h2 className="font-display text-lg text-foreground/90 mb-4 text-nature drop-shadow-md">
          Field Journal
        </h2>

        {/* Stacked card accordion by day */}
        <div className="flex-1 overflow-y-auto space-y-1 mb-4 scrollbar-thin">
          {journalByDay.map(({ day, entries }) => {
            const isExpanded = expandedDay === day.id;
            return (
              <div key={day.id} className="relative">
                {/* Physical stacked panel header */}
                <button
                  onClick={() => setExpandedDay(isExpanded ? null : day.id)}
                  className="w-full text-left glass-panel rounded-md px-3 py-2.5 transition-all duration-500 relative overflow-hidden group"
                  style={{
                    boxShadow: isExpanded
                      ? 'inset 0 1px 4px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.2)'
                      : 'inset 0 1px 2px rgba(0,0,0,0.2), 0 2px 6px rgba(0,0,0,0.15)',
                  }}
                >
                  {/* Subtle wood grain overlay for physical feel */}
                  <div className="absolute inset-0 opacity-[0.04]">
                    <img src={woodTexture} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-sm overflow-hidden flex-shrink-0 border border-white/10">
                        <img src={day.image} alt="" className="w-full h-full object-cover" />
                      </div>
                      <span className="font-display text-xs text-foreground/90 drop-shadow-sm">{day.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground font-body">{entries.length}</span>
                      <svg
                        className={`w-3 h-3 text-muted-foreground transition-transform duration-500 ${isExpanded ? 'rotate-180' : ''}`}
                        viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2"
                      >
                        <path d="M3 4.5l3 3 3-3" />
                      </svg>
                    </div>
                  </div>
                </button>

                {/* Expanded entries — slide open */}
                <div
                  className="overflow-hidden transition-all duration-500 ease-out"
                  style={{
                    maxHeight: isExpanded ? `${entries.length * 100}px` : '0px',
                    opacity: isExpanded ? 1 : 0,
                  }}
                >
                  <div className="py-1.5 px-1 space-y-1.5">
                    {entries.map(j => (
                      <div
                        key={j.id}
                        className="rounded-md px-3 py-2 relative overflow-hidden"
                        style={{
                          background: 'hsla(var(--glass-bg))',
                          boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.15), 0 1px 2px rgba(0,0,0,0.1)',
                        }}
                      >
                        <p className="text-xs font-body text-foreground/90 leading-relaxed" style={{ textShadow: '0 1px 1px rgba(0,0,0,0.3)' }}>{j.content}</p>
                        <span className="text-[10px] text-foreground/40 mt-1 block font-body">
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
            <p className="text-xs italic text-foreground/40 font-body text-center py-4" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>No entries yet</p>
          )}
        </div>

        {/* New entry - Updated to use the shadow well style */}
        <div className="bg-black/20 border border-foreground/10 rounded-lg p-2 focus-within:border-primary/40 transition-colors shadow-inner">
          <textarea
            value={entry}
            onChange={e => setEntry(e.target.value)}
            placeholder="Write a reflection..."
            className="w-full bg-transparent text-xs font-body text-foreground/90 placeholder:text-foreground/40 resize-none h-16 outline-none p-1"
            style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
          />
          <button
            onClick={handleSubmit}
            className="w-full mt-1 text-xs font-body py-1.5 rounded bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary-foreground transition-colors border border-primary/20"
          >
            Add Entry
          </button>
        </div>
      </div>
    </div>
  );
}