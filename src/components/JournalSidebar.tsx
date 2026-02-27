import { useState } from 'react';
import { usePlanner } from '@/context/PlannerContext';
import woodTexture from '@/assets/wood-texture.jpg';

export function JournalSidebar() {
  const { journal, addJournalEntry } = usePlanner();
  const [entry, setEntry] = useState('');

  const handleSubmit = () => {
    if (!entry.trim()) return;
    addJournalEntry(entry.trim());
    setEntry('');
  };

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
        <h2 className="font-display text-lg text-foreground/90 mb-4 text-nature">
          Field Journal
        </h2>

        {/* Journal entries */}
        <div className="flex-1 overflow-y-auto space-y-3 mb-4 scrollbar-thin">
          {journal.map(j => (
            <div key={j.id} className="glass-panel rounded-md p-3">
              <p className="text-xs font-body text-foreground/80 leading-relaxed">{j.content}</p>
              <span className="text-[10px] text-muted-foreground mt-1 block font-body">
                {new Date(j.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
              </span>
            </div>
          ))}
        </div>

        {/* New entry */}
        <div className="glass-panel rounded-md p-2">
          <textarea
            value={entry}
            onChange={e => setEntry(e.target.value)}
            placeholder="Write a reflection..."
            className="w-full bg-transparent text-xs font-body text-foreground/80 placeholder:text-muted-foreground/50 resize-none h-16 outline-none"
          />
          <button
            onClick={handleSubmit}
            className="w-full text-xs font-body py-1.5 rounded bg-primary/20 text-primary hover:bg-primary/30 transition-colors"
          >
            Add Entry
          </button>
        </div>
      </div>
    </div>
  );
}
