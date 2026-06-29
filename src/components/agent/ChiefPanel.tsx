import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { usePlanner } from '@/context/PlannerContext';
import { toast } from '@/hooks/use-toast';
import type { TaskMood, TaskPriority, TimeBlock } from '@/types/planner';

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

type Tab = 'briefing' | 'breakdown' | 'schedule';

const priEmoji: Record<string, string> = { high: '🍒', medium: '🌿', low: '🍂' };
const blockEmoji: Record<string, string> = { morning: '🌅', afternoon: '☀️', evening: '🌙' };

export function ChiefPanel({ open, onClose }: ChiefPanelProps) {
  const { tasks, addTask, mode, currentWeekDates, todayDayId, days } = usePlanner();
  const [tab, setTab] = useState<Tab>('briefing');
  const [loading, setLoading] = useState(false);
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [briefingDate, setBriefingDate] = useState<string | null>(null);
  const [breakdown, setBreakdown] = useState<Breakdown | null>(null);
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [goalInput, setGoalInput] = useState('');
  const [scheduleInput, setScheduleInput] = useState('');
  const [accepted, setAccepted] = useState<Set<string>>(new Set());

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
          toast({ title: 'AI credits exhausted', description: 'Add credits in workspace settings.', variant: 'destructive' });
        } else if (data.kind === 'rate_limit') {
          toast({ title: 'AI is busy', description: 'Try again in a moment.' });
        } else {
          toast({ title: 'AI error', description: data.error, variant: 'destructive' });
        }
        return null;
      }
      return data;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      toast({ title: 'AI request failed', description: msg, variant: 'destructive' });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Auto-run morning briefing once per day when panel opens
  useEffect(() => {
    if (!open) return;
    if (tab !== 'briefing') return;
    if (briefingDate === todayDayId && briefing) return;
    (async () => {
      const data = await invoke('briefing', {
        tasks: tasks.map(t => ({ id: t.id, title: t.title, date: t.date, completed: t.completed, priority: t.priority, mood: t.mood, timeBlock: t.timeBlock })),
        todayDate: todayDayId,
        mode,
      });
      if (data) {
        setBriefing(data as Briefing);
        setBriefingDate(todayDayId);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, tab, todayDayId]);

  const handleBreakdown = async () => {
    if (!goalInput.trim()) return;
    setBreakdown(null);
    setAccepted(new Set());
    const data = await invoke('breakdown', {
      goal: goalInput,
      todayDate: todayDayId,
      weekDates: currentWeekDates,
    });
    if (data) setBreakdown(data as Breakdown);
  };

  const handleSchedule = async () => {
    if (!scheduleInput.trim()) return;
    setSchedule(null);
    setAccepted(new Set());
    const data = await invoke('schedule', {
      goals: scheduleInput,
      todayDate: todayDayId,
      weekDates: currentWeekDates,
      existingTasks: tasks.filter(t => currentWeekDates.includes(t.date)).map(t => ({ title: t.title, date: t.date, completed: t.completed })),
    });
    if (data) setSchedule(data as Schedule);
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
            {(['briefing', 'breakdown', 'schedule'] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-body capitalize transition-all ${
                  tab === t ? 'bg-primary/25 text-foreground ring-1 ring-primary/40' : 'text-foreground/50 hover:text-foreground/80 hover:bg-white/5'
                }`}
              >
                {t === 'briefing' ? '☀ Today' : t === 'breakdown' ? '⚡ Break down' : '🗓 Plan week'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {loading && (
            <div className="flex items-center justify-center py-10">
              <span className="text-foreground/50 text-xs font-body animate-pulse">Gemini is thinking…</span>
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
            <p className="text-foreground/40 text-xs font-body text-center py-8 italic">Open to receive today's briefing.</p>
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
                  className="px-4 py-2 rounded-lg text-xs font-body bg-primary/20 text-foreground hover:bg-primary/30 disabled:opacity-40 border border-primary/20"
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
                    <button onClick={acceptAllBreakdown} className="w-full py-2 rounded-lg text-xs font-body bg-primary/15 text-foreground/80 hover:bg-primary/25 border border-primary/15">
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
                className="w-full py-2 rounded-lg text-xs font-body bg-primary/20 text-foreground hover:bg-primary/30 disabled:opacity-40 border border-primary/20"
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
                    <button onClick={acceptAllSchedule} className="w-full py-2 rounded-lg text-xs font-body bg-primary/15 text-foreground/80 hover:bg-primary/25 border border-primary/15">
                      Apply entire plan
                    </button>
                  )}
                </div>
              )}
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
