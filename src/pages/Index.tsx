import { useState, useCallback, useEffect } from 'react';
import { PlannerProvider, usePlanner } from '@/context/PlannerContext';
import { Environment } from '@/components/Environment';
import { PlannerHeader } from '@/components/PlannerHeader';
import { PlannerGrid } from '@/components/PlannerGrid';
import { JournalSidebar } from '@/components/JournalSidebar';
import { NatureGuest } from '@/components/NatureGuest';
import { Fireflies } from '@/components/Fireflies';
import { PomodoroTimer } from '@/components/PomodoroTimer';
import { WeatherLayerWrapper } from '@/components/WeatherLayerWrapper';
import { FocusPulse } from '@/components/FocusPulse';
import { DeepFocusMode } from '@/components/DeepFocusMode';
import { CaveSessionPanel } from '@/components/CaveSessionPanel';
import { useKeyboardShortcuts, KeyboardCheatSheet } from '@/hooks/useKeyboardShortcuts';
import { ChiefPanel } from '@/components/agent/ChiefPanel';

function IndexInner() {
  const { enterDeepFocus, tasks, todayDayId } = usePlanner();
  const [showAIPlanner, setShowAIPlanner] = useState(false);

  useEffect(() => {
    const handler = () => setShowAIPlanner(true);
    window.addEventListener('open-ai-planner', handler);
    return () => window.removeEventListener('open-ai-planner', handler);
  }, []);

  const handleOpenJournal = useCallback(() => {
    const btn = document.querySelector('[data-journal-btn]') as HTMLButtonElement;
    if (btn) btn.click();
  }, []);

  const handleOpenDeepFocus = useCallback(() => {
    const firstTask = tasks.find(t => t.date === todayDayId && !t.completed);
    enterDeepFocus(firstTask?.id);
  }, [tasks, todayDayId, enterDeepFocus]);

  const { showCheatSheet, setShowCheatSheet } = useKeyboardShortcuts(handleOpenJournal, handleOpenDeepFocus);

  return (
    <div className="h-screen w-screen overflow-hidden relative">
      <Environment />
      <WeatherLayerWrapper />
      <FocusPulse />

      <div className="relative z-10 h-full flex flex-col">
        <PlannerHeader />
        <div className="flex-1 flex overflow-hidden">
          <PlannerGrid />
          <JournalSidebar />
        </div>
      </div>

      <Fireflies />
      <PomodoroTimer />
      <CaveSessionPanel />
      <NatureGuest />
      <DeepFocusMode />
      <ChiefPanel open={showAIPlanner} onClose={() => setShowAIPlanner(false)} />

      {showCheatSheet && <KeyboardCheatSheet onClose={() => setShowCheatSheet(false)} />}
    </div>
  );
}

const Index = () => (
  <PlannerProvider>
    <IndexInner />
  </PlannerProvider>
);

export default Index;
