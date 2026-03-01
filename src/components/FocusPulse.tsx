import { usePlanner } from '@/context/PlannerContext';

/**
 * Nature Haptics: When Pomodoro is active, pulses the entire environment
 * at 6 breaths per minute (10s cycle) — a calming biofeedback frequency.
 */
export function FocusPulse() {
  const { pomodoroActive } = usePlanner();

  if (!pomodoroActive) return null;

  return (
    <div
      className="fixed inset-0 z-[1] pointer-events-none"
      style={{
        animation: 'focus-breathe 10s ease-in-out infinite',
        background: 'radial-gradient(ellipse at center, hsla(var(--primary), 0.03) 0%, transparent 70%)',
      }}
    />
  );
}
