import { useState, useEffect, useCallback } from 'react';
import sparrowVid from '@/assets/sparrow.mp4';
import dayLeaf from '@/assets/day-leaf.jpg';

type EventType = 'sparrow' | 'drifting-leaves' | 'bird-silhouette' | 'light-shift';

const weights: { type: EventType; weight: number }[] = [
  { type: 'sparrow', weight: 30 },
  { type: 'drifting-leaves', weight: 30 },
  { type: 'bird-silhouette', weight: 20 },
  { type: 'light-shift', weight: 20 },
];

function pickEvent(): EventType {
  const total = weights.reduce((s, w) => s + w.weight, 0);
  let r = Math.random() * total;
  for (const w of weights) {
    r -= w.weight;
    if (r <= 0) return w.type;
  }
  return 'sparrow';
}

export function NatureGuest() {
  const [event, setEvent] = useState<{ type: EventType; key: number } | null>(null);

  const triggerEvent = useCallback(() => {
    const type = pickEvent();
    setEvent({ type, key: Date.now() });
    const duration = type === 'sparrow' ? 10000 : type === 'drifting-leaves' ? 12000 : type === 'bird-silhouette' ? 6000 : 5000;
    setTimeout(() => setEvent(null), duration);
  }, []);

  useEffect(() => {
    // First event after 8-15s
    const first = setTimeout(triggerEvent, 8000 + Math.random() * 7000);

    const schedule = () => {
      const delay = 40000 + Math.random() * 50000; // 40-90s
      return setTimeout(() => {
        triggerEvent();
        scheduleRef = schedule();
      }, delay);
    };
    let scheduleRef = schedule();

    return () => { clearTimeout(first); clearTimeout(scheduleRef); };
  }, [triggerEvent]);

  if (!event) return null;

  if (event.type === 'sparrow') {
    return (
      <div key={event.key} className="fixed bottom-6 right-6 z-30 animate-guest-visit pointer-events-none">
        <div className="w-24 h-24 bg-white rounded-full overflow-hidden" style={{ boxShadow: 'var(--guest-shadow)' }}>
          <video src={sparrowVid} autoPlay muted playsInline className="w-full h-full object-cover" style={{ mixBlendMode: 'multiply' }} />
        </div>
      </div>
    );
  }

  if (event.type === 'drifting-leaves') {
    return (
      <div key={event.key} className="fixed inset-0 z-30 pointer-events-none overflow-hidden">
        {[0, 1, 2, 3].map(i => (
          <div
            key={i}
            className="absolute animate-leaf-fall"
            style={{
              left: `${15 + i * 20 + Math.random() * 10}%`,
              top: '-30px',
              animationDelay: `${i * 1.5}s`,
              animationDuration: `${8 + Math.random() * 4}s`,
            }}
          >
            <div
              // Added drop-shadow-md to give the falling leaves 3D depth
              className="w-5 h-5 rotate-12 drop-shadow-md"
              style={{
                backgroundImage: `url(${dayLeaf})`,
                backgroundSize: 'cover',
                clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)',
                opacity: 0.85, // Bumped opacity slightly so they don't look muddy
              }}
            />
          </div>
        ))}
      </div>
    );
  }

  if (event.type === 'bird-silhouette') {
    return (
      <div key={event.key} className="fixed inset-0 z-30 pointer-events-none overflow-hidden">
        <div
          className="absolute animate-bird-cross"
          style={{ top: `${8 + Math.random() * 12}%`, left: '-40px' }}
        >
          {/* Added drop-shadow-sm to the SVG */}
          <svg width="28" height="12" viewBox="0 0 28 12" fill="none" className="opacity-40 drop-shadow-sm">
            <path d="M14 6 C10 2, 4 0, 0 4 M14 6 C18 2, 24 0, 28 4" stroke="hsla(0,0%,10%,0.7)" strokeWidth="1.5" fill="none" />
          </svg>
        </div>
      </div>
    );
  }

  // light-shift
  return (
    <div key={event.key} className="fixed inset-0 z-[2] pointer-events-none animate-light-pulse mix-blend-overlay">
      <div
        className="w-full h-full"
        style={{
          background: 'radial-gradient(ellipse at 30% 20%, hsla(45, 80%, 75%, 0.15) 0%, transparent 60%)',
        }}
      />
    </div>
  );
}