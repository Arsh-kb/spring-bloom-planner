import { useEffect, useState } from 'react';

interface Particle {
  id: number;
  dx: number;
  dy: number;
  size: number;
  hue: number;
  delay: number;
}

export function CompletionSparkle() {
  const [particles] = useState<Particle[]>(() =>
    Array.from({ length: 10 }, (_, i) => {
      const angle = (i / 10) * Math.PI * 2 + (Math.random() - 0.5) * 0.6;
      const dist = 30 + Math.random() * 40;
      return {
        id: i,
        dx: Math.cos(angle) * dist,
        dy: Math.sin(angle) * dist,
        size: 3 + Math.random() * 4,
        hue: 30 + Math.random() * 50, // gold-amber range
        delay: Math.random() * 150,
      };
    })
  );

  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden flex items-center justify-center">
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute rounded-full sparkle-particle"
          style={{
            width: p.size,
            height: p.size,
            '--dx': `${p.dx}px`,
            '--dy': `${p.dy}px`,
            background: `hsl(${p.hue}, 70%, 65%)`,
            boxShadow: `0 0 6px 1px hsla(${p.hue}, 70%, 65%, 0.6)`,
            animationDelay: `${p.delay}ms`,
          } as React.CSSProperties}
        />
      ))}
      {/* Central flash */}
      <span className="absolute w-8 h-8 rounded-full sparkle-flash" 
        style={{ background: 'radial-gradient(circle, hsla(45, 80%, 70%, 0.6), transparent 70%)' }} />
    </div>
  );
}
