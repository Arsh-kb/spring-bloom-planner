import { PlannerProvider } from '@/context/PlannerContext';
import { Environment } from '@/components/Environment';
import { PlannerHeader } from '@/components/PlannerHeader';
import { PlannerGrid } from '@/components/PlannerGrid';
import { JournalSidebar } from '@/components/JournalSidebar';
import { NatureGuest } from '@/components/NatureGuest';
import { Fireflies } from '@/components/Fireflies';
import { PomodoroTimer } from '@/components/PomodoroTimer';
import { WeatherLayerWrapper } from '@/components/WeatherLayerWrapper';
import { FocusPulse } from '@/components/FocusPulse';

const Index = () => {
  return (
    <PlannerProvider>
      <div className="h-screen w-screen overflow-hidden relative">
        {/* Layer 0: Environment */}
        <Environment />

        {/* Layer 0.5: Weather */}
        <WeatherLayerWrapper />

        {/* Nature Haptics: Focus Pulse */}
        <FocusPulse />

        {/* Layer 1: UI */}
        <div className="relative z-10 h-full flex flex-col">
          <PlannerHeader />
          <div className="flex-1 flex overflow-hidden">
            <PlannerGrid />
            <JournalSidebar />
          </div>
        </div>

        {/* Layer 2: Life */}
        <Fireflies />
        <PomodoroTimer />
        <NatureGuest />
      </div>
    </PlannerProvider>
  );
};

export default Index;
