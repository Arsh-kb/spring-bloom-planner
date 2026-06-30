import { useEffect, useState } from 'react';

interface CinematicSchedulerProps {
  isRunning: boolean;
  onComplete: () => void;
  steps?: string[];
}

const defaultSteps = [
  { text: 'Analyzing workload', emoji: '📊' },
  { text: 'Finding focus windows', emoji: '🧠' },
  { text: 'Balancing the week', emoji: '⚖️' },
  { text: 'Protecting deep work', emoji: '🛡️' },
  { text: 'Negotiating deadlines', emoji: '🤝' },
  { text: 'Finalizing schedule', emoji: '✨' },
];

export function CinematicScheduler({ isRunning, onComplete, steps }: CinematicSchedulerProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [isComplete, setIsComplete] = useState(false);

  const stepList = steps || defaultSteps;

  useEffect(() => {
    if (!isRunning) return;

    setCurrentStep(0);
    setCompletedSteps(new Set());
    setIsComplete(false);

    // Run through each step
    stepList.forEach((_, index) => {
      setTimeout(() => {
        setCurrentStep(index);
        setCompletedSteps(prev => new Set(prev).add(index));

        // If this is the last step, finish
        if (index === stepList.length - 1) {
          setTimeout(() => {
            setIsComplete(true);
            setTimeout(onComplete, 800);
          }, 600);
        }
      }, index * 700);
    });
  }, [isRunning, onComplete, stepList]);

  if (!isRunning && !isComplete) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md">
      <div className="text-center space-y-8">
        {/* Animated Logo/Icon */}
        <div className="relative">
          <div className={`w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-primary/30 to-green-500/20 flex items-center justify-center ${isComplete ? 'animate-ping' : 'animate-pulse'}`}>
            <span className="text-5xl">{isComplete ? '✨' : '🌱'}</span>
          </div>
          {/* Pulsing rings */}
          {!isComplete && (
            <>
              <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
              <div className="absolute inset-4 rounded-full bg-primary/10 animate-ping" style={{ animationDelay: '0.5s' }} />
            </>
          )}
        </div>

        {/* Title */}
        <div>
          {isComplete ? (
            <h2 className="font-display text-3xl text-foreground animate-fade-in">
              Your week is ready!
            </h2>
          ) : (
            <h2 className="font-display text-xl text-foreground/80">
              Building your week...
            </h2>
          )}
        </div>

        {/* Steps */}
        <div className="space-y-3 max-w-xs mx-auto">
          {stepList.map((step, index) => {
            const isCompleted = completedSteps.has(index);
            const isCurrent = index === currentStep && !isComplete;
            const isPending = !isCompleted && !isCurrent;

            return (
              <div
                key={index}
                className={`flex items-center gap-3 text-sm font-body transition-all duration-300 ${
                  isCompleted
                    ? 'text-green-400'
                    : isCurrent
                      ? 'text-foreground scale-105'
                      : 'text-foreground/30'
                }`}
              >
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                  isCompleted
                    ? 'bg-green-500/20 text-green-400'
                    : isCurrent
                      ? 'bg-primary/20 text-primary animate-pulse'
                      : 'bg-white/5 text-foreground/20'
                }`}>
                  {isCompleted ? '✓' : isCurrent ? step.emoji : '○'}
                </span>
                <span className={isPending ? 'opacity-30' : ''}>{step.text}</span>
                {isCurrent && (
                  <span className="ml-auto text-primary animate-pulse">...</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Completion effect */}
        {isComplete && (
          <div className="absolute inset-0 pointer-events-none">
            {/* WHOOSH effect - radial lines */}
            <div className="absolute inset-0 animate-scale-in" style={{ animationDuration: '0.5s' }}>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}