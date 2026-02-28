import { useMemo } from 'react';
import type { Task, Season } from '@/types/planner';

interface SeasonProfile {
  season: Season;
  label: string;
  hueShift: number;
  saturation: number;
  warmth: number;
  grain: number;
}

const profiles: Record<Season, SeasonProfile> = {
  spring: { season: 'spring', label: 'Early Spring', hueShift: -5, saturation: 1.15, warmth: 0.08, grain: 0.02 },
  summer: { season: 'summer', label: 'High Summer', hueShift: 5, saturation: 1.25, warmth: 0.12, grain: 0.01 },
  autumn: { season: 'autumn', label: 'Quiet Autumn', hueShift: 15, saturation: 0.9, warmth: 0.18, grain: 0.04 },
  winter: { season: 'winter', label: 'Deep Winter', hueShift: -10, saturation: 0.7, warmth: 0.02, grain: 0.06 },
};

export function useSeasonalEngine(tasks: Task[]): SeasonProfile {
  return useMemo(() => {
    const now = Date.now();
    const fourWeeksAgo = now - 28 * 86400000;

    const recentTasks = tasks.filter(t => {
      const created = new Date(t.created_at).getTime();
      return created >= fourWeeksAgo && created <= now;
    });

    if (recentTasks.length === 0) return profiles.winter;

    const completed = recentTasks.filter(t => t.completed).length;
    const ratio = completed / recentTasks.length;

    // Two-week split for trend detection
    const twoWeeksAgo = now - 14 * 86400000;
    const olderTasks = recentTasks.filter(t => new Date(t.created_at).getTime() < twoWeeksAgo);
    const newerTasks = recentTasks.filter(t => new Date(t.created_at).getTime() >= twoWeeksAgo);
    const olderRatio = olderTasks.length > 0 ? olderTasks.filter(t => t.completed).length / olderTasks.length : 0;
    const newerRatio = newerTasks.length > 0 ? newerTasks.filter(t => t.completed).length / newerTasks.length : 0;

    const trending = newerRatio - olderRatio;

    if (ratio >= 0.7 && trending >= 0) return profiles.summer;
    if (ratio >= 0.4 && trending > 0.1) return profiles.spring;
    if (ratio >= 0.3 && trending < -0.1) return profiles.autumn;
    if (ratio < 0.3) return profiles.winter;
    return profiles.spring;
  }, [tasks]);
}
