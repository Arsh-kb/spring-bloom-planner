import { useCallback, useState } from 'react';

export type LivingEvent = {
  id: string;
  type: 'flower-bloom' | 'leaves-fall' | 'butterfly-arrive' | 'golden-sun' | 'rain-stop' | 'streak-fire';
  message: string;
  emoji: string;
  intensity: 'subtle' | 'normal' | 'dramatic';
};

interface LivingWorldState {
  flowersBloomed: number;
  leavesFallen: number;
  butterflies: number;
  goldenHour: boolean;
  rainIntensity: number; // 0 = no rain, 100 = heavy
}

// Track living world state
let globalState: LivingWorldState = {
  flowersBloomed: 0,
  leavesFallen: 0,
  butterflies: 0,
  goldenHour: false,
  rainIntensity: 0,
};

export function useLivingWorld() {
  const [events, setEvents] = useState<LivingEvent[]>([]);
  const [state, setState] = useState<LivingWorldState>(globalState);

  // Trigger an event
  const triggerEvent = useCallback((event: Omit<LivingEvent, 'id'>) => {
    const newEvent: LivingEvent = {
      ...event,
      id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
    };

    setEvents(prev => [...prev.slice(-5), newEvent]); // Keep last 5 events

    // Auto-remove after animation
    setTimeout(() => {
      setEvents(prev => prev.filter(e => e.id !== newEvent.id));
    }, 5000);

    return newEvent;
  }, []);

  // On task completed - flower blooms
  const onTaskCompleted = useCallback((taskTitle: string, streakDays: number) => {
    globalState.flowersBloomed++;

    // Check for streak bonuses
    if (streakDays >= 7) {
      globalState.butterflies = Math.min(globalState.butterflies + 1, 5);
      triggerEvent({
        type: 'butterfly-arrive',
        message: `🦋 A butterfly arrives! ${streakDays}-day streak!`,
        emoji: '🦋',
        intensity: 'dramatic',
      });
    } else if (streakDays >= 3) {
      triggerEvent({
        type: 'flower-bloom',
        message: `🌸 "${taskTitle}" complete! Beautiful bloom!`,
        emoji: '🌸',
        intensity: 'normal',
      });
    } else {
      triggerEvent({
        type: 'flower-bloom',
        message: `✨ Task complete! A flower blooms.`,
        emoji: '🌸',
        intensity: 'subtle',
      });
    }

    // Check confidence for golden hour
    // (This would be passed from the confidence score)
    setState({ ...globalState });
  }, [triggerEvent]);

  // On task missed - leaves fall
  const onTaskMissed = useCallback((taskTitle: string, daysOverdue: number) => {
    globalState.leavesFallen++;

    if (daysOverdue >= 2) {
      triggerEvent({
        type: 'leaves-fall',
        message: `🍂 Several days passed. The leaves are falling.`,
        emoji: '🍂',
        intensity: 'dramatic',
      });
      // Increase rain
      globalState.rainIntensity = Math.min(globalState.rainIntensity + 20, 80);
    } else {
      triggerEvent({
        type: 'leaves-fall',
        message: `🍂 Task missed. A leaf drifts down.`,
        emoji: '🍂',
        intensity: 'subtle',
      });
    }

    setState({ ...globalState });
  }, [triggerEvent]);

  // On high confidence - golden hour
  const onConfidenceHigh = useCallback((confidence: number) => {
    if (confidence >= 90 && !globalState.goldenHour) {
      globalState.goldenHour = true;
      triggerEvent({
        type: 'golden-sun',
        message: `☀️ Golden hour! 90%+ confidence. The forest glows!`,
        emoji: '☀️',
        intensity: 'dramatic',
      });
    } else if (confidence < 70 && globalState.goldenHour) {
      globalState.goldenHour = false;
    }
    setState({ ...globalState });
  }, [triggerEvent]);

  // On recovery - rain stops
  const onRecovery = useCallback((improvement: number) => {
    const oldRain = globalState.rainIntensity;
    globalState.rainIntensity = Math.max(0, globalState.rainIntensity - 40);

    if (oldRain > 20 && globalState.rainIntensity <= 20) {
      triggerEvent({
        type: 'rain-stop',
        message: `🌤️ Recovery complete! The rain stops and sun returns.`,
        emoji: '🌤️',
        intensity: 'normal',
      });
    } else {
      triggerEvent({
        type: 'flower-bloom',
        message: `🌱 Week recovered! +${improvement}% confidence.`,
        emoji: '🌱',
        intensity: 'normal',
      });
    }

    setState({ ...globalState });
  }, [triggerEvent]);

  // On streak milestone
  const onStreakMilestone = useCallback((days: number) => {
    if (days === 7) {
      globalState.butterflies = Math.min(globalState.butterflies + 3, 10);
      triggerEvent({
        type: 'streak-fire',
        message: `🔥 ONE WEEK STREAK! Butterflies fill the air!`,
        emoji: '🦋',
        intensity: 'dramatic',
      });
    } else if (days === 30) {
      triggerEvent({
        type: 'streak-fire',
        message: `🏆 30 DAYS! You're legendary!`,
        emoji: '👑',
        intensity: 'dramatic',
      });
    }
    setState({ ...globalState });
  }, [triggerEvent]);

  // Clear events (e.g., when leaving the page)
  const clearEvents = useCallback(() => {
    setEvents([]);
  }, []);

  // Get current state
  const getState = useCallback(() => globalState, []);

  return {
    events,
    state: globalState,
    onTaskCompleted,
    onTaskMissed,
    onConfidenceHigh,
    onRecovery,
    onStreakMilestone,
    clearEvents,
    getState,
  };
}