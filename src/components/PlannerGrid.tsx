import { useState } from 'react';
import { usePlanner } from '@/context/PlannerContext';
import { DayCard } from './DayCard';
import { MasterTaskList } from './MasterTaskList';

export function PlannerGrid() {
  const { days, zenMode } = usePlanner();
  const today = new Date().toISOString().split('T')[0];
  const [showMasterList, setShowMasterList] = useState(false);

  return (
    <div className="flex-1 p-4 overflow-y-auto relative">
      {/* Day cards with zen mode animation */}
      <div
        className={`grid grid-cols-2 lg:grid-cols-4 gap-3 auto-rows-min transition-all duration-700 ${
          zenMode ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'
        }`}
      >
        {days.slice(0, 4).map(day => (
          <DayCard key={day.id} day={day} isToday={day.date === today} />
        ))}
        {days.slice(4).map(day => (
          <DayCard key={day.id} day={day} isToday={day.date === today} />
        ))}
      </div>

      {/* Zen mode: show master list access */}
      {zenMode && (
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            onClick={() => setShowMasterList(true)}
            className="glass-panel px-8 py-4 rounded-xl font-display text-foreground text-nature text-lg hover:scale-105 transition-transform duration-500"
          >
            Open Task Ledger
          </button>
        </div>
      )}

      {showMasterList && <MasterTaskList onClose={() => setShowMasterList(false)} />}
    </div>
  );
}
