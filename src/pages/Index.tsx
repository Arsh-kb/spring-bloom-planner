/* eslint-disable @typescript-eslint/no-explicit-any */
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
import { RecoveryPanel } from '@/components/agent/RecoveryPanel';
import { CinematicScheduler } from '@/components/CinematicScheduler';
import { useAIMemory } from '@/hooks/useAIMemory';
import { useLivingWorld, LivingEvent } from '@/hooks/useLivingWorld';

function IndexInner() {
  const { enterDeepFocus, tasks, todayDayId, currentWeekDates } = usePlanner();
  const [showAIPlanner, setShowAIPlanner] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [demoModeActive, setDemoModeActive] = useState(false);
  const [demoStep, setDemoStep] = useState(0);

  // AI Memory hook
  const { analyzePatterns, getMemoryContext } = useAIMemory();

  // Living World hook
  const { events, onTaskCompleted, onTaskMissed, onRecovery, onStreakMilestone } = useLivingWorld();

  // Analyze patterns on tasks change
  useEffect(() => {
    if (tasks.length > 0 && todayDayId) {
      analyzePatterns(tasks, todayDayId);
    }
  }, [tasks, todayDayId, analyzePatterns]);

  // Demo Mode - runs once on first visit
  useEffect(() => {
    const hasSeenDemo = localStorage.getItem('vibe2ship-demo-shown');
    const hasTasks = tasks.length > 0;

    if (!hasSeenDemo && hasTasks && !demoModeActive) {
      setDemoModeActive(true);
      localStorage.setItem('vibe2ship-demo-shown', 'true');

      // Demo sequence
      const demoSteps = [
        // Step 0: Open AI Chief after 1 second
        { action: () => setShowAIPlanner(true), delay: 1000 },
        // Step 1: After 5 seconds, show the planning feature
        { action: () => setDemoStep(1), delay: 5000 },
        // Step 2: Close AI and show recovery after another 5 seconds
        { action: () => {
          setShowAIPlanner(false);
          setShowRecovery(true);
        }, delay: 10000 },
        // Step 3: Close recovery
        { action: () => setShowRecovery(false), delay: 15000 },
        // Step 4: Done
        { action: () => setDemoModeActive(false), delay: 16000 },
      ];

      demoSteps.forEach(({ action, delay }) => {
        setTimeout(action, delay);
      });
    }
  }, [tasks.length, demoModeActive]);

  // Listen for open events
  useEffect(() => {
    const handleOpenAI = () => setShowAIPlanner(true);
    const handleOpenRecovery = () => setShowRecovery(true);

    window.addEventListener('open-ai-planner', handleOpenAI);
    window.addEventListener('open-recovery', handleOpenRecovery);

    return () => {
      window.removeEventListener('open-ai-planner', handleOpenAI);
      window.removeEventListener('open-recovery', handleOpenRecovery);
    };
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

  // Handle scheduling start for cinematic animation
  const handleSchedulingStart = useCallback(() => {
    setIsScheduling(true);
  }, []);

  const handleSchedulingComplete = useCallback(() => {
    setIsScheduling(false);
  }, []);

  // Pass living world functions to global for access from ChiefPanel
  useEffect(() => {
    (window as any).__livingWorld = { onTaskCompleted, onTaskMissed, onRecovery, onStreakMilestone };
    return () => { delete (window as any).__livingWorld; };
  }, [onTaskCompleted, onTaskMissed, onRecovery, onStreakMilestone]);

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

      {/* AI Panels */}
      <ChiefPanel open={showAIPlanner} onClose={() => setShowAIPlanner(false)} />
      <RecoveryPanel open={showRecovery} onClose={() => setShowRecovery(false)} />

      {/* Cinematic Scheduling */}
      <CinematicScheduler
        isRunning={isScheduling}
        onComplete={handleSchedulingComplete}
      />

      {/* Living World Events Toast */}
      {events.map((event, index) => (
        <LivingWorldToast key={event.id} event={event} index={index} />
      ))}

      {showCheatSheet && <KeyboardCheatSheet onClose={() => setShowCheatSheet(false)} />}
    </div>
  );
}

// Living World Toast Component
function LivingWorldToast({ event, index }: { event: LivingEvent; index: number }) {
  const intensityClasses = {
    subtle: 'animate-fade-in',
    normal: 'animate-scale-in',
    dramatic: 'animate-scale-in',
  };

  return (
    <div
      className={`fixed ${intensityClasses[event.intensity]} z-50`}
      style={{
        top: `${80 + index * 70}px`,
        left: '50%',
        transform: 'translateX(-50%)',
      }}
    >
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-black/80 backdrop-blur-md border border-white/10 shadow-xl animate-pulse">
        <span className="text-2xl">{event.emoji}</span>
        <p className="text-sm font-body text-foreground">{event.message}</p>
      </div>
    </div>
  );
}

const Index = () => <IndexInner />;

export default Index;