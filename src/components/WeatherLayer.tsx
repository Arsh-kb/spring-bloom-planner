import { useMemo } from 'react';
import type { LightingMode, Season } from '@/types/planner';

interface WeatherLayerProps {
  mode: LightingMode;
  season: Season;
  intensity?: number;
  isStressed?: boolean;
}

export function WeatherLayer({ mode, season, intensity = 1, isStressed = false }: WeatherLayerProps) {
  const particles = useMemo(() => {
    if (mode === 'cave') {
      // High stress in the cave brings the fog higher and thicker
      const fogCount = Math.floor(3 * intensity);
      return Array.from({ length: fogCount }, (_, i) => ({
        id: i,
        type: 'fog' as const,
        style: {
          left: `${i * (35 / intensity) + Math.random() * 10}%`,
          bottom: `${Math.random() * (isStressed ? 15 : 8)}%`, // Fog creeps higher when stressed
          width: `${200 + Math.random() * 150}px`,
          height: `${30 + Math.random() * 20}px`,
          animationDuration: `${(18 + Math.random() * 10) / intensity}s`, // Moves faster
          animationDelay: `${i * 3}s`,
          mixBlendMode: 'overlay' as const,
        },
      }));
    }

    if (mode === 'exam') {
      // High stress in Exam Mode turns a drizzle into a downpour
      const rainCount = Math.floor(12 * intensity);
      return Array.from({ length: rainCount }, (_, i) => ({
        id: i,
        type: 'rain' as const,
        style: {
          left: `${(i / rainCount) * 100 + Math.random() * 5}%`,
          animationDuration: `${(2 + Math.random() * 1.5) / Math.sqrt(intensity)}s`, // Falls much faster
          animationDelay: `${Math.random() * 3}s`,
          opacity: 0.6 + (isStressed ? 0.2 : 0), // Rain gets heavier/darker
        },
      }));
    }

    if (mode === 'shade') {
      // Shade fog gets denser
      const bandCount = Math.floor(5 * intensity);
      return Array.from({ length: bandCount }, (_, i) => ({
        id: i,
        type: 'fog' as const,
        style: {
          top: `${15 + i * (15 / intensity) + Math.random() * 10}%`,
          left: `-20%`,
          width: `${300 + Math.random() * 200}px`,
          height: `${20 + Math.random() * 15}px`,
          animationDuration: `${(20 + Math.random() * 12) / intensity}s`,
          animationDelay: `${i * 4}s`,
          mixBlendMode: 'screen' as const,
        },
      }));
    }

    // Sun mode: dust motes become more frantic if stressed
    const isSummerish = season === 'summer' || season === 'spring';
    const baseCount = isSummerish ? 10 : 6;
    const moteCount = Math.floor(baseCount * intensity);
    return Array.from({ length: moteCount }, (_, i) => ({
      id: i,
      type: 'mote' as const,
      style: {
        left: `${Math.random() * 90}%`,
        top: `${Math.random() * 80}%`,
        animationDuration: `${(15 + Math.random() * 12) / intensity}s`, // Motes zip around faster
        animationDelay: `${Math.random() * 10}s`,
        mixBlendMode: 'color-dodge' as const,
        boxShadow: '0 0 4px 1px hsla(45, 80%, 80%, 0.4)',
      },
    }));
  }, [mode, season, intensity, isStressed]);

  return (
    <div className="fixed inset-0 z-[5] pointer-events-none overflow-hidden transition-opacity duration-1000">
      {particles.map(p => (
        <div
          key={p.id}
          className={
            p.type === 'mote' ? 'weather-mote' :
            p.type === 'fog' ? 'weather-fog' :
            'weather-rain'
          }
          style={p.style}
        />
      ))}
      
      {/* Optional: Add a subtle vignette if highly stressed to close in the viewport */}
      {isStressed && (
        <div className="absolute inset-0 pointer-events-none mix-blend-multiply opacity-30 transition-opacity duration-3000" 
             style={{ background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.8) 100%)' }} />
      )}
    </div>
  );
}