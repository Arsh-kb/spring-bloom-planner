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

    // Blooms: one per 2 completed tasks, max 4
    const blooms = Math.min(Math.floor(completed / 1), 4);

    // Moss: check if day has uncompleted tasks older than 4 days
    let mossLevel = 0;
    if (total > 0) {
      const oldUncompleted = day.tasks.filter(t => {
        if (t.completed) return false;
        const age = Math.floor((Date.now() - new Date(t.created_at).getTime()) / 86400000);
        return age > 4;
      });
      mossLevel = Math.min(oldUncompleted.length, 3); // 0-3 levels
    }

    return { blooms, mossLevel };
  }, [day.tasks]);

  if (blooms === 0 && mossLevel === 0) return null;

  return (
    <>
      {/* Productivity Blooms */}
      {blooms > 0 && isHeader && (
        <div className="absolute bottom-1 left-3 flex gap-0.5 pointer-events-none">
          {Array.from({ length: blooms }).map((_, i) => (
            <span
              key={i}
              className="inline-block text-[8px] drop-shadow-sm"
              style={{
                animation: `flora-sprout 0.8s ease-out ${i * 0.15}s both`,
                opacity: 0.7 + i * 0.05,
              }}
            >
              {i % 3 === 0 ? '🌱' : i % 3 === 1 ? '🌿' : '🌸'}
            </span>
          ))}
        </div>
      )}

      {/* Moss Overlay */}
      {mossLevel > 0 && !isHeader && (
        <div
          className="absolute inset-0 pointer-events-none rounded-lg overflow-hidden"
          style={{
            background: `linear-gradient(180deg, transparent ${100 - mossLevel * 15}%, hsla(120, 30%, 25%, ${mossLevel * 0.03}) 100%)`,
            transition: 'all 2s ease-in-out',
          }}
        >
          {mossLevel >= 2 && (
            <div className="absolute bottom-0 left-0 right-0 h-4 flex justify-around items-end pointer-events-none opacity-30">
              <span className="text-[6px]">🌿</span>
              <span className="text-[6px]">🍃</span>
              {mossLevel >= 3 && <span className="text-[6px]">🌱</span>}
            </div>
          )}
        </div>
      )}
    </>
  );
}
