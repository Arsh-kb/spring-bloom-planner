import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { usePlanner } from '@/context/PlannerContext';
import { toast } from '@/hooks/use-toast';

interface RecoveryPanelProps {
  open: boolean;
  onClose: () => void;
}

interface RecoveryChange {
  type: 'move' | 'remove' | 'reschedule';
  taskId: string;
  fromDate: string;
  toDate?: string;
  taskTitle: string;
  reason: string;
}

interface RecoveryResult {
  summary: string;
  changes: RecoveryChange[];
  newConfidence: number;
  oldConfidence: number;
}

const thinkingSteps = [
  { id: '1', text: 'Analyzing current state', emoji: '🔍' },
  { id: '2', text: 'Identifying conflicts', emoji: '⚠️' },
  { id: '3', text: 'Protecting priorities', emoji: '🎯' },
  { id: '4', text: 'Rebuilding schedule', emoji: '🔨' },
  { id: '5', text: 'Finalizing recovery', emoji: '🌱' },
];

export function RecoveryPanel({ open, onClose }: RecoveryPanelProps) {
  const { tasks, currentWeekDates, todayDayId, focusSessions, createSnapshot, addTask, deleteTask, moveTask } = usePlanner();

  const [loading, setLoading] = useState(false);
  const [thinkingStep, setThinkingStep] = useState('');
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [recovery, setRecovery] = useState<RecoveryResult | null>(null);
  const [applied, setApplied] = useState(false);

  // Calculate current confidence
  const currentConfidence = useMemo(() => {
    const todayTasks = tasks.filter(t => t.date === todayDayId);
    const completed = todayTasks.filter(t => t.completed).length;
    const total = todayTasks.length;
    const overdue = tasks.filter(t => !t.completed && t.date < todayDayId).length;

    if (total === 0) return 50;

    let score = (completed / total) * 100;
    score -= overdue * 10;
    score = Math.max(0, Math.min(100, score));

    return Math.round(score);
  }, [tasks, todayDayId]);

  const runThinkingAnimation = () => {
    setCompletedSteps(new Set());

    thinkingSteps.forEach((step, index) => {
      setTimeout(() => {
        setThinkingStep(step.text);
        setCompletedSteps(prev => new Set(prev).add(step.id));
      }, index * 600);
    });

    return thinkingSteps.length * 600;
  };

  const handleRecovery = async () => {
    setLoading(true);
    setRecovery(null);
    setApplied(false);

    const animationDuration = runThinkingAnimation();

    // Wait for animation
    await new Promise(r => setTimeout(r, animationDuration + 200));

    try {
      const { data, error } = await supabase.functions.invoke('ai-chief', {
        body: {
          action: 'recovery',
          tasks: tasks.map(t => ({
            id: t.id,
            title: t.title,
            date: t.date,
            completed: t.completed,
            priority: t.priority,
            timeBlock: t.timeBlock,
          })),
          todayDate: todayDayId,
          weekDates: currentWeekDates,
          focusSessions,
        },
      });

      if (error) throw error;

      if (data?.error) {
        toast({
          title: 'Recovery failed',
          description: data.error,
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      const result = data.data || data;
      setRecovery(result);

      // Map task IDs to titles
      const taskMap = new Map(tasks.map(t => [t.id, t.title]));
      const mappedChanges = result.changes.map((c: RecoveryChange) => ({
        ...c,
        taskTitle: taskMap.get(c.taskId) || 'Unknown task',
      }));

      setRecovery({ ...result, changes: mappedChanges });
    } catch (err) {
      toast({
        title: 'Connection issue',
        description: 'Could not connect to AI. Please try again.',
        variant: 'destructive',
      });
    }

    setLoading(false);
    setThinkingStep('');
  };

  const applyRecovery = () => {
    if (!recovery) return;

    createSnapshot('Before recovery');

    let appliedCount = 0;

    recovery.changes.forEach(change => {
      try {
        switch (change.type) {
          case 'move':
            if (change.toDate) {
              moveTask(change.taskId, change.toDate);
              appliedCount++;
            }
            break;
          case 'remove':
            deleteTask(change.taskId);
            appliedCount++;
            break;
          case 'reschedule':
            if (change.toDate) {
              moveTask(change.taskId, change.toDate);
              appliedCount++;
            }
            break;
        }
      } catch (e) {
        console.error('Failed to apply change:', e);
      }
    });

    setApplied(true);
    toast({
      title: 'Recovery complete',
      description: `Applied ${appliedCount} changes. Your week is now balanced.`,
    });

    // Trigger living world effect
    // This would be handled by the parent component via props or context
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" />

      <div
        className="relative glass-panel bg-black/75 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl w-[92vw] max-w-lg max-h-[85vh] overflow-hidden flex flex-col animate-scale-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-3 border-b border-foreground/10">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg text-foreground flex items-center gap-2">
              <span className="text-xl">🌱</span>
              <span>Recover My Week</span>
            </h2>
            <button onClick={onClose} className="text-foreground/50 hover:text-foreground text-sm">✕</button>
          </div>
          <p className="text-xs font-body text-foreground/60">
            Your week feels overloaded. Let me rebuild it around your priorities.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Current State */}
          <div className="rounded-xl bg-white/5 border border-foreground/10 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-body text-foreground/60">Current Confidence</span>
              <span className="font-display text-2xl text-foreground">{currentConfidence}%</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-red-500/50 to-primary transition-all duration-500"
                style={{ width: `${currentConfidence}%` }}
              />
            </div>
          </div>

          {/* Thinking Animation */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
                  <span className="text-3xl">🌱</span>
                </div>
                <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping" />
              </div>

              <div className="space-y-2 w-full max-w-xs">
                {thinkingSteps.map((step) => (
                  <div
                    key={step.id}
                    className={`flex items-center gap-3 text-xs font-body transition-all duration-300 ${
                      completedSteps.has(step.id) ? 'text-green-400' : thinkingStep === step.text ? 'text-foreground' : 'text-foreground/30'
                    }`}
                  >
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                      completedSteps.has(step.id)
                        ? 'bg-green-500/20 text-green-400'
                        : thinkingStep === step.text
                          ? 'bg-primary/20 text-primary animate-pulse'
                          : 'bg-white/5 text-foreground/20'
                    }`}>
                      {completedSteps.has(step.id) ? '✓' : thinkingStep === step.text ? step.emoji : '○'}
                    </span>
                    <span>{step.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recovery Button */}
          {!loading && !recovery && (
            <button
              onClick={handleRecovery}
              className="w-full py-4 rounded-xl text-sm font-body bg-gradient-to-r from-primary/20 to-green-500/20 text-foreground border border-primary/30 hover:border-primary/50 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
            >
              🌱 Rebuild my week
            </button>
          )}

          {/* Recovery Results */}
          {!loading && recovery && !applied && (
            <div className="space-y-4 animate-fade-in">
              {/* New Confidence */}
              <div className="rounded-xl bg-gradient-to-r from-green-500/20 to-primary/20 border border-green-500/30 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-body text-green-400/70">After Recovery</span>
                  <div className="flex items-center gap-2">
                    <span className="font-display text-2xl text-green-400">{recovery.newConfidence}%</span>
                    <span className="text-xs text-green-400/60">+{recovery.newConfidence - currentConfidence}%</span>
                  </div>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 to-primary transition-all duration-700"
                    style={{ width: `${recovery.newConfidence}%` }}
                  />
                </div>
              </div>

              {/* Summary */}
              <div className="rounded-xl bg-white/5 border border-foreground/10 p-3">
                <p className="text-xs font-body text-foreground/80">{recovery.summary}</p>
              </div>

              {/* Changes */}
              <div className="space-y-2">
                <p className="text-[10px] font-body text-foreground/40 uppercase tracking-widest">Changes</p>
                {recovery.changes.map((change, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-foreground/10"
                  >
                    <span className="text-sm">
                      {change.type === 'move' ? '➡️' : change.type === 'remove' ? '❌' : '📅'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-body text-foreground truncate">{change.taskTitle}</p>
                      <p className="text-[10px] font-body text-foreground/50">{change.reason}</p>
                    </div>
                    <span className="text-[10px] font-body text-foreground/40">
                      {change.fromDate} → {change.toDate || 'removed'}
                    </span>
                  </div>
                ))}
              </div>

              {/* Apply Button */}
              <button
                onClick={applyRecovery}
                className="w-full py-3 rounded-xl text-sm font-body bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 transition-all duration-200 hover:scale-[1.01]"
              >
                ✓ Apply recovery
              </button>
            </div>
          )}

          {/* Applied State */}
          {!loading && recovery && applied && (
            <div className="flex flex-col items-center justify-center py-10 space-y-4 animate-fade-in">
              <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center">
                <span className="text-4xl">✨</span>
              </div>
              <p className="text-foreground/80 text-sm font-body text-center">Week recovered!</p>
              <p className="text-foreground/40 text-xs font-body text-center">Your schedule is now balanced around your priorities.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}