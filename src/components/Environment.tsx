import bgNature from '@/assets/bg-nature.jpg';
import { usePlanner } from '@/context/PlannerContext';

export function Environment() {
  const { mode } = usePlanner();

  return (
    <div className="fixed inset-0 z-0">
      {/* Layer 0: Background image with slow zoom animation */}
      <div className="absolute inset-0 overflow-hidden">
        <img
          src={bgNature}
          alt=""
          className="w-full h-full object-cover animate-slow-zoom atmosphere-transition"
          style={{ filter: 'var(--atmosphere-filter)' }}
        />
      </div>

      {/* Atmosphere overlay */}
      <div
        className="absolute inset-0 atmosphere-transition"
        style={{
          background: 'var(--atmosphere-overlay)',
          mixBlendMode: 'var(--atmosphere-blend)' as any,
        }}
      />

      {/* Sun flare for sun mode */}
      {mode === 'sun' && (
        <div
          className="absolute inset-0 pointer-events-none atmosphere-transition"
          style={{
            background: 'radial-gradient(ellipse at 25% 15%, hsla(38, 80%, 70%, 0.12) 0%, transparent 60%)',
          }}
        />
      )}

      {/* Vignette for cave mode */}
      {mode === 'cave' && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at center, transparent 20%, hsla(0, 0%, 0%, 0.75) 100%)',
          }}
        />
      )}

      {/* Fog overlay for exam mode */}
      {mode === 'exam' && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(180deg, hsla(210, 20%, 85%, 0.15) 0%, hsla(200, 15%, 70%, 0.1) 100%)',
          }}
        />
      )}
    </div>
  );
}
