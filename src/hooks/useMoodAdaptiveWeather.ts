import { useMemo } from 'react';
import type { Task } from '@/types/planner';

/**
 * Mood-Adaptive Environment:
 * Detects stressful weeks (high ratio of high-priority tasks)
 * and returns a weather intensity multiplier to calm things down.
 */
export function useMoodAdaptiveWeather(tasks: Task[]): { weatherIntensity: number; isStressed: boolean } {
  return useMemo(() => {
    const weekTasks = tasks.filter(t => {
      const age = Math.floor((Date.now() - new Date(t.created_at).getTime()) / 86400000);
      return age <= 7;
    });

    if (weekTasks.length === 0) return { weatherIntensity: 1, isStressed: false };

    const highPriorityRatio = weekTasks.filter(t => t.priority === 'high').length / weekTasks.length;
    const highStrainRatio = weekTasks.filter(t => t.mood === 'high-strain').length / weekTasks.length;
    const stressScore = highPriorityRatio * 0.6 + highStrainRatio * 0.4;

    const isStressed = stressScore > 0.4;
    // More mist/rain when stressed
    const weatherIntensity = isStressed ? 1.5 + stressScore : 1;

    return { weatherIntensity, isStressed };
  }, [tasks]);
}
