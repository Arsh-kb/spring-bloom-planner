import { usePlanner } from '@/context/PlannerContext';
import { useMemo } from 'react';

const dayShorts = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export function WeeklyStreakDots() {
  const { days } = usePlanner();

  const ratios = useMemo(() => {
    return days.map(d => {
      if (d.tasks.length === 0) return -1; // no tasks
      return d.tasks.filter(t => t.completed).length / d.tasks.length;
    });
  }, [days]);

  return (
    <div className="flex items-center gap-1.5">
      {ratios.map((r, i) => (
        <div key={i} className="group relative flex flex-col items-center">
          <div
            className="w-2 h-2 rounded-full transition-all duration-500 border"
            style={{
              borderColor: r < 0 ? 'hsla(var(--foreground) / 0.15)' : 'hsla(var(--primary) / 0.4)',
              backgroundColor: r <= 0
                ? 'transparent'
                : r < 0.5
                  ? `hsla(var(--primary) / ${0.15 + r * 0.3})`
                  : r < 1
                    ? `hsla(var(--primary) / ${0.3 + r * 0.3})`
                    : 'hsl(var(--primary))',
              boxShadow: r >= 1 ? '0 0 6px hsl(var(--primary) / 0.5)' : 'none',
            }}
          />
          {/* Tooltip */}
          <div className="absolute bottom-full mb-2 hidden group-hover:block z-50">
            <div className="glass-panel rounded px-2 py-1 text-[9px] font-body text-foreground/80 whitespace-nowrap shadow-lg" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>
              {days[i].name}: {r < 0 ? 'No tasks' : `${days[i].tasks.filter(t => t.completed).length}/${days[i].tasks.length} done`}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}