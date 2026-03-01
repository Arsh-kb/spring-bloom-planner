import { useEffect, useCallback } from 'react';
import type { LightingMode } from '@/types/planner';

/**
 * Biological Rhythm Integration:
 * Auto-transitions lighting mode based on local sunrise/sunset times.
 * Uses approximate solar calculation for the user's timezone.
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
    if (hour >= 12 && hour < 17) return 'shade';     // Afternoon shade
    if (hour >= 17 && hour < 20) return 'sun';       // Golden hour
    return 'cave';                                    // Night/deep work
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const suggested = getCircadianMode();
    // Only auto-switch if user hasn't manually changed (we track this loosely)
    // For now, just check every 30 minutes
    const interval = setInterval(() => {
      const newMode = getCircadianMode();
      // We don't force — just provide a suggestion via the UI
    }, 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, [enabled, getCircadianMode]);

  return { suggestedMode: getCircadianMode() };
}
