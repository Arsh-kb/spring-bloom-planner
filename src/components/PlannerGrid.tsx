import { usePlanner } from '@/context/PlannerContext';
import { DayCard } from './DayCard';

export function PlannerGrid() {
  const { days } = usePlanner();
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="flex-1 p-4 overflow-y-auto">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 auto-rows-min">
        {/* First row: 4 days */}
        {days.slice(0, 4).map(day => (
          <DayCard key={day.id} day={day} isToday={day.date === today} />
        ))}
        {/* Second row: 3 days */}
        {days.slice(4).map(day => (
          <DayCard key={day.id} day={day} isToday={day.date === today} />
        ))}
      </div>
    </div>
  );
}
