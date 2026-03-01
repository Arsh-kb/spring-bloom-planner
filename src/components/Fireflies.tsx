import { useMemo } from 'react';
import { usePlanner } from '@/context/PlannerContext';

export function Fireflies() {
  const { mode } = usePlanner();

  const particles = useMemo(() =>
    Array.from({ length: 25 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${20 + Math.random() * 70}%`,
      delay: `${Math.random() * 8}s`,
      duration: `${6 + Math.random() * 6}s`,
      size: 1 + Math.random() * 3,
      // Randomize blur for depth perception
      blur: Math.random() > 0.5 ? 'blur(1px)' : 'none',
      opacity: 0.3 + Math.random() * 0.5,
    })), []);

  if (mode !== 'cave') return null;

  return (
    // Lowered Z-index to 5 to keep them behind the main UI glass layers
    <div className="fixed inset-0 z-[5] pointer-events-none overflow-hidden">
      {particles.map(p => (
        <div
          key={p.id}
          className="firefly animate-firefly-float"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            opacity: p.opacity,
            filter: p.blur,
            animationDelay: p.delay,
            animationDuration: p.duration,
            // Link firefly glow to your primary theme color for consistency
            backgroundColor: 'hsl(var(--primary))',
            boxShadow: `0 0 10px 2px hsla(var(--primary) / 0.5)`,
          }}
        />
      ))}
    </div>
  );
}