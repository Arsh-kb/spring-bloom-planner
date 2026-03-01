import { useState, useEffect, useCallback } from 'react';
import type { LightingMode } from '@/types/planner';

/**
 * Biological Rhythm Integration:
 * Auto-transitions or suggests lighting mode based on local times.
 */
export function useCircadianRhythm(
  currentMode: LightingMode,
  setMode: (m: LightingMode) => void,
  enabled: boolean = true
) {
  const getCircadianMode = useCallback((): LightingMode => {
    const hour = new Date().getHours();
    // Approximate: sunrise ~6am, noon, golden hour ~5pm, night ~8pm
    if (hour >= 6 && hour < 12) return 'sun';       // Morning golden
    if (hour >= 12 && hour < 17) return 'shade';    // Afternoon shade
    if (hour >= 17 && hour < 20) return 'sun';      // Golden hour
    return 'cave';                                  // Night/deep work
  }, []);

  // Bind the suggestion to React state so the UI updates dynamically
  const [suggestedMode, setSuggestedMode] = useState<LightingMode>(getCircadianMode());

  useEffect(() => {
    if (!enabled) return;

    // Check every 1 minute to see if the real-world time crossed a threshold
    const interval = setInterval(() => {
      const newMode = getCircadianMode();
      setSuggestedMode(prevMode => {
        if (prevMode !== newMode) {
          return newMode; // This triggers the re-render in PlannerHeader
        }
        return prevMode;
      });
    }, 60 * 1000);

    return () => clearInterval(interval);
  }, [enabled, getCircadianMode]);

  return { suggestedMode };
}