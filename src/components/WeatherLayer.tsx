import { useMemo } from 'react';
import type { LightingMode, Season } from '@/types/planner';

interface WeatherLayerProps {
  mode: LightingMode;
  season: Season;
}

export function WeatherLayer({ mode, season }: WeatherLayerProps) {
  const particles = useMemo(() => {
    if (mode === 'cave') {
      // Faint bottom fog only (fireflies handle the rest)
      return Array.from({ length: 3 }, (_, i) => ({
        id: i,
        type: 'fog' as const,
        style: {
          left: `${i * 35 + Math.random() * 10}%`,
          bottom: `${Math.random() * 8}%`,
          width: `${200 + Math.random() * 150}px`,
          height: `${30 + Math.random() * 20}px`,
          animationDuration: `${18 + Math.random() * 10}s`,
          animationDelay: `${i * 3}s`,
        },
      }));
    }

    if (mode === 'exam') {
      // Rain grain
      return Array.from({ length: 12 }, (_, i) => ({
        id: i,
        type: 'rain' as const,
        style: {
          left: `${(i / 12) * 100 + Math.random() * 5}%`,
          animationDuration: `${2 + Math.random() * 1.5}s`,
          animationDelay: `${Math.random() * 3}s`,
        },
      }));
    }

    if (mode === 'shade') {
      // Fog bands
      return Array.from({ length: 5 }, (_, i) => ({
        id: i,
        type: 'fog' as const,
        style: {
          top: `${15 + i * 15 + Math.random() * 10}%`,
          left: `-20%`,
          width: `${300 + Math.random() * 200}px`,
          height: `${20 + Math.random() * 15}px`,
          animationDuration: `${20 + Math.random() * 12}s`,
          animationDelay: `${i * 4}s`,
        },
      }));
    }

    // Sun mode: dust motes
    const isSummerish = season === 'summer' || season === 'spring';
    const count = isSummerish ? 10 : 6;
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      type: 'mote' as const,
      style: {
        left: `${Math.random() * 90}%`,
        top: `${Math.random() * 80}%`,
        animationDuration: `${15 + Math.random() * 12}s`,
        animationDelay: `${Math.random() * 10}s`,
      },
    }));
  }, [mode, season]);

  return (
    <div className="fixed inset-0 z-[5] pointer-events-none overflow-hidden">
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
    </div>
  );
}
