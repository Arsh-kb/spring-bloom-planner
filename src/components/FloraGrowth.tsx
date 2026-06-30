import { useMemo } from 'react';
import type { Day } from '@/types/planner';

/**
 * Interactive Flora Growth:
 * - Productivity Blooms: completed tasks grow tiny sprouts in the DayCard header
 * - Overgrown Ledger: neglected days get moss/vine overlays
 */

interface FloraGrowthProps {
  day: Day;
  isHeader?: boolean;
}

export function FloraGrowth({ day, isHeader = false }: FloraGrowthProps) {
  const { blooms, mossLevel } = useMemo(() => {
    const completed = day.tasks.filter(t => t.completed).length;
    const total = day.tasks.length;

    // Blooms: one per completed task, max 5 (more visible now)
    const blooms = Math.min(completed, 5);

    // Moss: check if day has uncompleted tasks older than 2 days (faster triggering)
    let mossLevel = 0;
    if (total > 0) {
      const oldUncompleted = day.tasks.filter(t => {
        if (t.completed) return false;
        const age = Math.floor((Date.now() - new Date(t.created_at).getTime()) / 86400000);
        return age > 2; // Changed from 4 to 2 for faster feedback
      });
      mossLevel = Math.min(oldUncompleted.length, 4); // 0-4 levels (increased)
    }

    return { blooms, mossLevel };
  }, [day.tasks]);

  if (blooms === 0 && mossLevel === 0) return null;

  return (
    <>
      {/* Productivity Blooms - Larger and more visible */}
      {blooms > 0 && isHeader && (
        <div className="absolute top-2 left-3 flex gap-0.5 pointer-events-none">
          {Array.from({ length: blooms }).map((_, i) => (
            <span
              key={i}
              className="inline-block text-[14px] drop-shadow-lg"
              style={{
                animation: `flora-sprout 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) ${i * 0.15}s both`,
                opacity: 1,
                filter: 'drop-shadow(0 0 3px rgba(100, 200, 100, 0.5))',
              }}
            >
              {i % 3 === 0 ? '🌱' : i % 3 === 1 ? '🌿' : '🌸'}
            </span>
          ))}
        </div>
      )}

      {/* Moss Overlay - More visible */}
      {mossLevel > 0 && !isHeader && (
        <div
          className="absolute inset-0 pointer-events-none rounded-lg overflow-hidden"
          style={{
            // Higher opacity for more visible effect
            background: `linear-gradient(to top, hsla(120, 40%, 25%, ${mossLevel * 0.2}) 0%, transparent ${mossLevel * 35}%)`,
            mixBlendMode: 'overlay',
            transition: 'all 1.5s ease-in-out',
          }}
        >
          {mossLevel >= 2 && (
            <div className="absolute bottom-1 left-0 right-0 h-6 flex justify-around items-end pointer-events-none opacity-60">
              <span className="text-[12px] drop-shadow-lg rotate-[-10deg]">🌿</span>
              <span className="text-[12px] drop-shadow-lg rotate-[15deg]">🍃</span>
              <span className="text-[12px] drop-shadow-lg">🌱</span>
              {mossLevel >= 3 && <span className="text-[12px] drop-shadow-lg">🍂</span>}
            </div>
          )}
        </div>
      )}
    </>
  );
}