import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { usePlanner } from '@/context/PlannerContext';
import { toast } from '@/hooks/use-toast';
import type { TaskMood, TaskPriority, TimeBlock, MissionReport } from '@/types/planner';

interface ChiefPanelProps {
  open: boolean;
  onClose: () => void;
}

interface Briefing {
  greeting: string;
  workloadHours: number;
  bestFocusWindow: string;
  topRisk: string;
  recommendation: string;
  confidence: number;
}

interface Subtask {
  title: string;
  estimatedMinutes: number;
  priority: TaskPriority;
  mood?: TaskMood;
  timeBlock?: TimeBlock;
  dayOffset: number;
}

interface Breakdown {
  summary: string;
  estimatedHours: number;
  subtasks: Subtask[];
}

interface ScheduleAssignment {
  title: string;
  dayOffset: number;
  priority: TaskPriority;
  mood?: TaskMood;
  timeBlock?: TimeBlock;
}

interface Schedule {
  rationale: string;
  assignments: ScheduleAssignment[];
}

interface MissionReport {
  completionProbability: number;
  deepWorkHours: number;
  recoveryTime: number;
  highRiskTasks: number;
  protectedFocusBlocks: number;
  schedulingStrategy: string;
}

type Tab = 'briefing' | 'breakdown' | 'schedule' | 'report';

// AI Thinking messages for personality
const thinkingMessages = {
  briefing: [
    { text: "Reading your workload...", delay: 0 },
    { text: "Analyzing focus patterns...", delay: 800 },
    { text: "Preparing recommendations...", delay: 1600 },
  ],
  breakdown: [
    { text: "Understanding your goal...", delay: 0 },
    { text: "Breaking into actionable steps...", delay: 600 },
    { text: "Estimating effort...", delay: 1200 },
  ],
  schedule: [
    { text: "Reading your workload...", delay: 0 },
    { text: "Finding focus windows...", delay: 800 },
    { text: "Balancing the week...", delay: 1600 },
    { text: "Protecting breaks...", delay: 2400 },
  ],
  recovery: [
    { text: "Analyzing current state...", delay: 0 },
    { text: "Identifying conflicts...", delay: 700 },
    { text: "Rebuilding the schedule...", delay: 1400 },
  ],
};

// Premium AI messages
const aiMessages = {
  scheduleGenerated: "I reorganized your week to protect your highest-priority goals.",
  taskMoved: "I noticed today became overloaded, so I shifted this to when you'll have better focus.",
  recoveryComplete: "I've rebuilt your schedule to be realistic while preserving important deadlines.",
  briefingReady: "Here's your morning overview.",
};

const priEmoji: Record<string, string> = { high: '🍒', medium: '🌿', low: '🍂' };
const blockEmoji: Record<string, string> = { morning: '🌅', afternoon: '☀️', evening: '🌙' };

export function ChiefPanel({ open, onClose }: ChiefPanelProps) {
  const { tasks, addTask, mode, currentWeekDates, todayDayId, days, createSnapshot, restoreSnapshot, snapshots, addExplanation, focusSessions } = usePlanner();
  const [tab, setTab] = useState<Tab>('briefing');
  const [loading, setLoading] = useState(false);
  const [thinkingMessage, setThinkingMessage] = useState('');
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [briefingDate, setBriefingDate] = useState<string | null>(null);
  const [breakdown, setBreakdown] = useState<Breakdown | null>(null);
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [missionReport, setMissionReport] = useState<MissionReport | null>(null);
  const [goalInput, setGoalInput] = useState('');
  const [scheduleInput, setScheduleInput] = useState('');
  const [accepted, setAccepted] = useState<Set<string>>(new Set());
  const [lastAction, setLastAction] = useState<string | null>(null);

  const todayIdx = useMemo(() => currentWeekDates.indexOf(todayDayId), [currentWeekDates, todayDayId]);

  const invoke = async (action: string, payload: Record<string, unknown>) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-chief', {
        body: { action, ...payload },
      });
      if (error) throw error;
      if (data?.error) {
        if (data.kind === 'credit_exhausted') {
          toast({ title: 'AI at capacity', description: 'Please add credits in workspace settings to continue.', variant: 'destructive' });
        } else if (data.kind === 'rate_limit') {
          toast({ title: 'AI is handling another request', description: 'Give me just a moment to finish up.' });
        } else {
          toast({ title: 'Something unexpected happened', description: 'Let me try again.', variant: 'destructive' });
        }
        return null;
      }
      return data;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      toast({ title: 'Connection issue', description: 'Please check your connection and try again.', variant: 'destructive' });
      return null;
    } finally {
      setLoading(false);
      setThinkingMessage('');
    }
  };

  // Auto-run morning briefing once per day when panel opens
  useEffect(() => {
    if (!open) return;
    if (tab !== 'briefing') return;
    if (briefingDate === todayDayId && briefing) return;
    (async () => {
      setLoading(true);
      // Thinking animation
      for (const msg of thinkingMessages.briefing) {
        await new Promise(r => setTimeout(r, msg.delay));
        setThinkingMessage(msg.text);
      }
      const data = await invoke('briefing', {
        tasks: tasks.map(t => ({ id: t.id, title: t.title, date: t.date, completed: t.completed, priority: t.priority, mood: t.mood, timeBlock: t.timeBlock })),
        todayDate: todayDayId,
        mode,
      });
      if (data) {
        setBriefing(data as Briefing);
        setBriefingDate(todayDayId);
        setThinkingMessage('');
      }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, tab, todayDayId]);

  const handleBreakdown = async () => {
    if (!goalInput.trim()) return;
    setLoading(true);
    setBreakdown(null);
    setAccepted(new Set());
    // Thinking animation
    for (const msg of thinkingMessages.breakdown) {
      await new Promise(r => setTimeout(r, msg.delay));
      setThinkingMessage(msg.text);
    }
    const data = await invoke('breakdown', {
      goal: goalInput,
      todayDate: todayDayId,
      weekDates: currentWeekDates,
    });
    if (data) setBreakdown(data as Breakdown);
    setLoading(false);
    setThinkingMessage('');
  };

  const handleSchedule = async () => {
    if (!scheduleInput.trim()) return;
    setLoading(true);
    createSnapshot('Before AI scheduling');
    setSchedule(null);
    setAccepted(new Set());
    setMissionReport(null);
    // Thinking animation
    for (const msg of thinkingMessages.schedule) {
      await new Promise(r => setTimeout(r, msg.delay));
      setThinkingMessage(msg.text);
    }
    const data = await invoke('schedule', {
      goals: scheduleInput,
      todayDate: todayDayId,
      weekDates: currentWeekDates,
      existingTasks: tasks.filter(t => currentWeekDates.includes(t.date)).map(t => ({ title: t.title, date: t.date, completed: t.completed })),
    });
    if (data) {
      const scheduleData = data as Schedule;
      setSchedule(scheduleData);
      setLastAction('schedule');

      // Also get mission report
      const reportData = await invoke('mission_report', {
        tasks: tasks.filter(t => currentWeekDates.includes(t.date)).map(t => ({ id: t.id, title: t.title, date: t.date, completed: t.completed, priority: t.priority, timeBlock: t.timeBlock })),
        todayDate: todayDayId,
        weekDates: currentWeekDates,
        focusSessions,
      });
      if (reportData) {
        setMissionReport(reportData as MissionReport);
      }

      // Add explanation
      addExplanation({
        action: 'reschedule',
        reason: scheduleData.rationale,
        confidence: 85,
        model: 'gemini-2.5-pro',
      });
    }
    setLoading(false);
    setThinkingMessage('');
  };

  const dateForOffset = (offset: number) => {
    const base = todayIdx >= 0 ? todayIdx : 0;
    const idx = Math.min(6, Math.max(0, base + offset));
    return currentWeekDates[idx];
  };

  const acceptSubtask = (key: string, title: string, dayOffset: number, priority: TaskPriority, mood?: TaskMood, timeBlock?: TimeBlock) => {
    const date = dateForOffset(dayOffset);
    if (!date) return;
    addTask(date, title, priority, mood, timeBlock, null);
    setAccepted(prev => new Set(prev).add(key));
  };

  const acceptAllBreakdown = () => {
    if (!breakdown) return;
    breakdown.subtasks.forEach((s, i) => {
      const k = `b-${i}`;
      if (accepted.has(k)) return;
      acceptSubtask(k, s.title, s.dayOffset, s.priority, s.mood, s.timeBlock);
    });
  };

  const acceptAllSchedule = () => {
    if (!schedule) return;
    schedule.assignments.forEach((a, i) => {
      const k = `s-${i}`;
      if (accepted.has(k)) return;
      acceptSubtask(k, a.title, a.dayOffset, a.priority, a.mood, a.timeBlock);
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" />
      <div
        className="relative glass-panel bg-black/75 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl w-[92vw] max-w-xl max-h-[85vh] overflow-hidden flex flex-col animate-scale-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-3 border-b border-foreground/10">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg text-foreground flex items-center gap-2">
              <span className="text-xl">✦</span>
              <span>Chief of Staff</span>
              <span className="text-[10px] font-body italic text-foreground/40">powered by Gemini</span>
            </h2>
            <button onClick={onClose} className="text-foreground/50 hover:text-foreground text-sm">✕</button>
          </div>
          <div className="flex gap-1">
            {(['briefing', 'breakdown', 'schedule', 'report'] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-body capitalize transition-all ${
                  tab === t ? 'bg-primary/25 text-foreground ring-1 ring-primary/40' : 'text-foreground/50 hover:text-foreground/80 hover:bg-white/5'
                }`}
              >
                {t === 'briefing' ? '☀ Today' : t === 'breakdown' ? '⚡ Break down' : t === 'schedule' ? '🗓 Plan week' : '📊 Report'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {loading && (
            <div className="flex flex-col items-center justify-center py-10 space-y-4">
              {/* Animated thinking dots */}
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <p className="text-foreground/60 text-xs font-body animate-pulse">
                {thinkingMessage || 'Analyzing...'}
              </p>
            </div>
          )}

          {/* BRIEFING */}
          {tab === 'briefing' && !loading && briefing && (
            <div className="space-y-3 animate-fade-in">
              <p className="font-display text-base text-foreground leading-snug">{briefing.greeting}</p>
              <div className="grid grid-cols-2 gap-2">
                <Stat label="Workload" value={`${briefing.workloadHours.toFixed(1)}h`} />
                <Stat label="Confidence" value={`${Math.round(briefing.confidence)}%`} />
                <Stat label="Deep work" value={briefing.bestFocusWindow} />
                <Stat label="Top risk" value={briefing.topRisk} small />
              </div>
              <div className="rounded-xl bg-primary/10 border border-primary/20 p-3">
                <p className="text-[10px] font-body text-primary/70 uppercase tracking-widest mb-1">Recommendation</p>
                <p className="text-xs font-body text-foreground/90 leading-relaxed">{briefing.recommendation}</p>
              </div>
            </div>
          )}
          {tab === 'briefing' && !loading && !briefing && (
            <div className="flex flex-col items-center justify-center py-10 space-y-4 animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-3xl">☀️</span>
              </div>
              <p className="text-foreground/60 text-xs font-body text-center">Welcome back. Let's start your day.</p>
              <p className="text-foreground/40 text-[10px] font-body text-center">Click "Today" to receive your morning briefing.</p>
            </div>
          )}

          {/* BREAKDOWN */}
          {tab === 'breakdown' && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  value={goalInput}
                  onChange={e => setGoalInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleBreakdown()}
                  placeholder='e.g. "Build Lumira landing page"'
                  className="flex-1 bg-white/5 border border-foreground/15 rounded-lg px-3 py-2 text-xs font-body text-foreground placeholder:text-foreground/30 outline-none focus:border-primary/40"
                />
                <button
                  onClick={handleBreakdown}
                  disabled={loading || !goalInput.trim()}
                  className="px-4 py-2 rounded-lg text-xs font-body bg-primary/20 text-foreground hover:bg-primary/30 disabled:opacity-40 disabled:cursor-not-allowed border border-primary/20 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                >
                  Break down
                </button>
              </div>
              {!loading && breakdown && (
                <div className="space-y-2 animate-fade-in">
                  <div className="rounded-xl bg-white/5 border border-foreground/10 p-3">
                    <p className="text-xs font-body text-foreground/90">{breakdown.summary}</p>
                    <p className="text-[10px] font-body text-foreground/50 mt-1">≈ {breakdown.estimatedHours}h total</p>
                  </div>
                  {breakdown.subtasks.map((s, i) => {
                    const k = `b-${i}`;
                    const date = dateForOffset(s.dayOffset);
                    const day = days.find(d => d.id === date);
                    return (
                      <div key={k} className={`flex items-start gap-3 p-3 rounded-xl border ${accepted.has(k) ? 'bg-primary/10 border-primary/20 opacity-60' : 'bg-white/5 border-foreground/10'}`}>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-body text-foreground">{s.title}</p>
                          <div className="flex items-center gap-2 mt-1.5 text-[10px] text-foreground/50">
                            <span>{priEmoji[s.priority]}</span>
                            {s.timeBlock && <span>{blockEmoji[s.timeBlock]}</span>}
                            <span>{s.estimatedMinutes}m</span>
                            <span>· {day?.short ?? `+${s.dayOffset}d`}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => acceptSubtask(k, s.title, s.dayOffset, s.priority, s.mood, s.timeBlock)}
                          disabled={accepted.has(k)}
                          className={`px-3 py-1 rounded-lg text-[10px] font-body ${accepted.has(k) ? 'text-primary/60 bg-primary/5' : 'text-foreground/70 bg-white/10 hover:bg-primary/20 hover:text-foreground'}`}
                        >
                          {accepted.has(k) ? '✓ Added' : 'Accept'}
                        </button>
                      </div>
                    );
                  })}
                  {breakdown.subtasks.some((_, i) => !accepted.has(`b-${i}`)) && (
                    <button onClick={acceptAllBreakdown} className="w-full py-2 rounded-lg text-xs font-body bg-primary/15 text-foreground/80 hover:bg-primary/25 border border-primary/15 transition-all duration-200 hover:scale-[1.01]">
                      Accept all
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* SCHEDULE */}
          {tab === 'schedule' && (
            <div className="space-y-3">
              <textarea
                value={scheduleInput}
                onChange={e => setScheduleInput(e.target.value)}
                placeholder={'List the goals for the week, one per line.\nExam Friday\nWorkout\nAssignments\n…'}
                rows={4}
                className="w-full bg-white/5 border border-foreground/15 rounded-lg px-3 py-2 text-xs font-body text-foreground placeholder:text-foreground/30 outline-none focus:border-primary/40 resize-none"
              />
              <button
                onClick={handleSchedule}
                disabled={loading || !scheduleInput.trim()}
                className="w-full py-2 rounded-lg text-xs font-body bg-primary/20 text-foreground hover:bg-primary/30 disabled:opacity-40 disabled:cursor-not-allowed border border-primary/20 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
              >
                Plan my week
              </button>
              {!loading && schedule && (
                <div className="space-y-2 animate-fade-in">
                  <div className="rounded-xl bg-primary/10 border border-primary/20 p-3">
                    <p className="text-[10px] font-body text-primary/70 uppercase tracking-widest mb-1">Why this plan</p>
                    <p className="text-xs font-body text-foreground/90 leading-relaxed">{schedule.rationale}</p>
                  </div>
                  {schedule.assignments.map((a, i) => {
                    const k = `s-${i}`;
                    const date = dateForOffset(a.dayOffset);
                    const day = days.find(d => d.id === date);
                    return (
                      <div key={k} className={`flex items-start gap-3 p-3 rounded-xl border ${accepted.has(k) ? 'bg-primary/10 border-primary/20 opacity-60' : 'bg-white/5 border-foreground/10'}`}>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-body text-foreground">{a.title}</p>
                          <div className="flex items-center gap-2 mt-1.5 text-[10px] text-foreground/50">
                            <span>{priEmoji[a.priority]}</span>
                            {a.timeBlock && <span>{blockEmoji[a.timeBlock]}</span>}
                            <span>· {day?.name ?? `+${a.dayOffset}d`}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => acceptSubtask(k, a.title, a.dayOffset, a.priority, a.mood, a.timeBlock)}
                          disabled={accepted.has(k)}
                          className={`px-3 py-1 rounded-lg text-[10px] font-body ${accepted.has(k) ? 'text-primary/60 bg-primary/5' : 'text-foreground/70 bg-white/10 hover:bg-primary/20 hover:text-foreground'}`}
                        >
                          {accepted.has(k) ? '✓' : 'Add'}
                        </button>
                      </div>
                    );
                  })}
                  {schedule.assignments.some((_, i) => !accepted.has(`s-${i}`)) && (
                    <button onClick={acceptAllSchedule} className="w-full py-2 rounded-lg text-xs font-body bg-primary/15 text-foreground/80 hover:bg-primary/25 border border-primary/15 transition-all duration-200 hover:scale-[1.01]">
                      Apply entire plan
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* MISSION REPORT */}
          {tab === 'report' && missionReport && (
            <div className="space-y-3 animate-fade-in">
              <div className="rounded-xl bg-gradient-to-br from-primary/20 to-green-500/10 border border-primary/20 p-4">
                <h3 className="text-xs font-body text-primary/70 uppercase tracking-widest mb-3">Mission Report</h3>
                <div className="grid grid-cols-2 gap-3">
                  <Stat label="Completion" value={`${Math.round(missionReport.completionProbability)}%`} />
                  <Stat label="Deep Work" value={`${missionReport.deepWorkHours}h`} />
                  <Stat label="Recovery" value={`${missionReport.recoveryTime}h`} />
                  <Stat label="High Risk" value={String(missionReport.highRiskTasks)} small />
                </div>
              </div>
              <div className="rounded-xl bg-white/5 border border-foreground/10 p-3">
                <p className="text-[10px] font-body text-foreground/40 uppercase tracking-widest mb-2">Strategy</p>
                <p className="text-xs font-body text-foreground/80 leading-relaxed">{missionReport.schedulingStrategy}</p>
              </div>
              {missionReport.protectedFocusBlocks > 0 && (
                <div className="flex items-center gap-2 text-xs text-green-400">
                  <span>✓</span>
                  <span>{missionReport.protectedFocusBlocks} focus blocks protected</span>
                </div>
              )}
            </div>
          )}
          {tab === 'report' && !missionReport && (
            <div className="flex flex-col items-center justify-center py-10 space-y-4 animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-3xl">📊</span>
              </div>
              <p className="text-foreground/60 text-xs font-body text-center">Your mission report will appear here.</p>
              <p className="text-foreground/40 text-[10px] font-body text-center">Plan your week to see the strategy breakdown.</p>
            </div>
          )}

          {/* Undo Button */}
          {lastAction && snapshots.length > 0 && (
            <div className="pt-3 border-t border-foreground/10 mt-3">
              <button
                onClick={() => {
                  const lastSnapshot = snapshots[snapshots.length - 1];
                  if (lastSnapshot) {
                    restoreSnapshot(lastSnapshot.id);
                    setLastAction(null);
                    toast({ title: 'Undone', description: lastSnapshot.description });
                  }
                }}
                className="w-full py-2 rounded-lg text-xs font-body bg-destructive/10 text-destructive/80 hover:bg-destructive/20 border border-destructive/20"
              >
                ↩ Undo last AI action
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, small }: { label: string; value: string; small?: boolean }) {
  return (
    <div className="rounded-xl bg-white/5 border border-foreground/10 p-3">
      <p className="text-[9px] font-body text-foreground/40 uppercase tracking-widest">{label}</p>
      <p className={`font-display text-foreground mt-0.5 ${small ? 'text-xs leading-snug' : 'text-base'}`}>{value}</p>
    </div>
  );
}
