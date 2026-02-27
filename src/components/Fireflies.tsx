import { useMemo } from 'react';
import { usePlanner } from '@/context/PlannerContext';

export function Fireflies() {
  const { mode } = usePlanner();

  const particles = useMemo(() =>
    Array.from({ length: 20 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${30 + Math.random() * 60}%`,
      delay: `${Math.random() * 6}s`,
      duration: `${4 + Math.random() * 4}s`,
      size: 2 + Math.random() * 3,
    })), []);

  if (mode !== 'cave') return null;

  return (
    <div className="fixed inset-0 z-10 pointer-events-none overflow-hidden">
      {particles.map(p => (
        <div
          key={p.id}
          className="firefly animate-firefly-float"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            animationDelay: p.delay,
            animationDuration: p.duration,
          }}
        />
      ))}
    </div>
  );
}
