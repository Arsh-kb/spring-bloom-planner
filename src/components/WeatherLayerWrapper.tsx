import { usePlanner } from '@/context/PlannerContext';
import { WeatherLayer } from './WeatherLayer';

export function WeatherLayerWrapper() {
  const { mode, season } = usePlanner();
  return <WeatherLayer mode={mode} season={season.season as any} />;
}
