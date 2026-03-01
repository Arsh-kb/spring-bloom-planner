import { usePlanner } from '@/context/PlannerContext';
import { WeatherLayer } from './WeatherLayer';
// Adjust import path based on where you saved it
import { useMoodAdaptiveWeather } from '@/hooks/useMoodAdaptiveWeather'; 

export function WeatherLayerWrapper() {
  const { mode, season, tasks } = usePlanner();
  const { weatherIntensity, isStressed } = useMoodAdaptiveWeather(tasks);

  return (
    <WeatherLayer 
      mode={mode} 
      season={season.season as any} 
      intensity={weatherIntensity} 
      isStressed={isStressed} 
    />
  );
}