import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { usePlanner } from "@/context/PlannerContext";
import { toast } from "@/hooks/use-toast";
import type { TaskMood, TaskPriority, TimeBlock } from "@/types/planner";

interface ChiefPanelProps {
  open: boolean;
  onClose: () => void;
}

// ============ TYPES ============
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

interface Notification {
  id: string;
  type: "info" | "warning" | "success" | "tip";
  message: string;
  timestamp: number;
}

type Tab = "briefing" | "breakdown" | "schedule" | "report" | "chat" | "decisions";

// ============ THINKING ANIMATION STEPS ============
interface ThinkingStep {
  id: string;
  text: string;
  emoji: string;
}

const thinkingSteps = {
  briefing: [
    { id: "1", text: "Reading your workload", emoji: "📋" },
    { id: "2", text: "Analyzing focus patterns", emoji: "🧠" },
    { id: "3", text: "Checking deadlines", emoji: "⏰" },
    { id: "4", text: "Preparing recommendations", emoji: "✨" },
  ],
  breakdown: [
    { id: "1", text: "Understanding your goal", emoji: "🎯" },
    { id: "2", text: "Breaking into steps", emoji: "✂️" },
    { id: "3", text: "Estimating effort", emoji: "⏱️" },
    { id: "4", text: "Finding focus windows", emoji: "🌅" },
  ],
  schedule: [
    { id: "1", text: "Analyzing workload", emoji: "📊" },
    { id: "2", text: "Finding focus windows", emoji: "🧠" },
    { id: "3", text: "Balancing the week", emoji: "⚖️" },
    { id: "4", text: "Protecting deep work", emoji: "🛡️" },
    { id: "5", text: "Negotiating deadlines", emoji: "🤝" },
    { id: "6", text: "Finalizing schedule", emoji: "📋" },
  ],
  recovery: [
    { id: "1", text: "Analyzing current state", emoji: "🔍" },
    { id: "2", text: "Identifying conflicts", emoji: "⚠️" },
    { id: "3", text: "Protecting priorities", emoji: "🎯" },
    { id: "4", text: "Rebuilding schedule", emoji: "🔨" },
    { id: "5", text: "Finalizing recovery", emoji: "🌱" },
  ],
};

// ============ PROACTIVE NOTIFICATIONS ============
const generateProactiveNotifications = (
  tasks: ReturnType<typeof usePlanner>["tasks"],
  todayDayId: string,
): Notification[] => {
  const notifications: Notification[] = [];
  const today = new Date().toISOString().split("T")[0];

  // Get today's tasks
  const todayTasks = tasks.filter((t) => t.date === todayDayId);
  const incompleteToday = todayTasks.filter((t) => !t.completed);
  const highPriorityToday = incompleteToday.filter(
    (t) => t.priority === "high",
  );
  const completedToday = todayTasks.filter((t) => t.completed);

  // Calculate today's workload
  const totalToday = todayTasks.length;
  const completedCount = completedToday.length;
  const completionRate =
    totalToday > 0 ? (completedCount / totalToday) * 100 : 0;

  // Check for overloaded day
  if (incompleteToday.length >= 5) {
    notifications.push({
      id: "overloaded",
      type: "warning",
      message: `Tuesday is overloaded — ${incompleteToday.length} tasks remaining. Want me to rebalance?`,
      timestamp: Date.now(),
    });
  }

  // Check for high-risk tasks
  if (highPriorityToday.length >= 2) {
    notifications.push({
      id: "high-risk",
      type: "info",
      message: `You have ${highPriorityToday.length} high-priority tasks. Let's prioritize those first.`,
      timestamp: Date.now(),
    });
  }

  // Check for missed tasks
  const missedTasks = tasks.filter((t) => !t.completed && t.date < todayDayId);
  if (missedTasks.length > 0) {
    notifications.push({
      id: "missed",
      type: "tip",
      message: `${missedTasks.length} tasks from earlier days are pending. I can help reschedule them.`,
      timestamp: Date.now(),
    });
  }

  // Low completion rate
  if (completionRate < 30 && totalToday > 0) {
    notifications.push({
      id: "low-progress",
      type: "info",
      message: `Only ${Math.round(completionRate)}% of today done. Let's focus on what matters most.`,
      timestamp: Date.now(),
    });
  }

  // Empty morning
  const morningTasks = incompleteToday.filter((t) => t.timeBlock === "morning");
  if (morningTasks.length === 0 && incompleteToday.length > 0) {
    notifications.push({
      id: "no-morning",
      type: "tip",
      message:
        "No deep work planned for morning — want me to protect a focus block?",
      timestamp: Date.now(),
    });
  }

  return notifications;
};

// ============ GREETINGS BY TIME ============
const getTimeBasedGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

// ============ EMOJI MAPPING ============
const priEmoji: Record<string, string> = {
  high: "🍒",
  medium: "🌿",
  low: "🍂",
};
const blockEmoji: Record<string, string> = {
  morning: "🌅",
  afternoon: "☀️",
  evening: "🌙",
};

export function ChiefPanel({ open, onClose }: ChiefPanelProps) {
  const {
    tasks,
    addTask,
    moveTask,
    updateTaskDetails,
    deleteTask,
    mode,
    currentWeekDates,
    todayDayId,
    days,
    createSnapshot,
    restoreSnapshot,
    snapshots,
    addExplanation,
    explanations,
    focusSessions,
  } = usePlanner();

  // State
  const [tab, setTab] = useState<Tab>("briefing");
  const [loading, setLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [thinkingStep, setThinkingStep] = useState<string>("");
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [briefingDate, setBriefingDate] = useState<string | null>(null);
  const [breakdown, setBreakdown] = useState<Breakdown | null>(null);
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [missionReport, setMissionReport] = useState<MissionReport | null>(
    null,
  );

  const [goalInput, setGoalInput] = useState("");
  const [scheduleInput, setScheduleInput] = useState("");
  const [accepted, setAccepted] = useState<Set<string>>(new Set());
  const [lastAction, setLastAction] = useState<string | null>(null);

  // Chat state
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'ai'; content: string }[]>([]);
  const [chatInput, setChatInput] = useState("");

  // Proactive notifications
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [dismissedNotifications, setDismissedNotifications] = useState<
    Set<string>
  >(new Set());

  // Ref to track briefing fetch attempts per date (prevents infinite loops)
  const briefingFetchRef = useRef<string | null>(null);

  const todayIdx = useMemo(
    () => currentWeekDates.indexOf(todayDayId),
    [currentWeekDates, todayDayId],
  );

  // Generate notifications when panel opens
  useEffect(() => {
    if (open) {
      const newNotifications = generateProactiveNotifications(
        tasks,
        todayDayId,
      );
      const visible = newNotifications.filter(
        (n) => !dismissedNotifications.has(n.id),
      );
      setNotifications(visible);

      // Show toast for first notification if exists
      if (visible.length > 0 && !localStorage.getItem("chief-notified-today")) {
        toast({
          title: "Chief of Staff",
          description: visible[0].message,
        });
        localStorage.setItem("chief-notified-today", "true");
      }
    } else {
      // Reset notification flag when panel closes (allows new notifications next open)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, tasks, todayDayId]);

  // Reset notification flag at midnight
  useEffect(() => {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const msUntilMidnight = midnight.getTime() - now.getTime();

    const timer = setTimeout(() => {
      localStorage.removeItem("chief-notified-today");
    }, msUntilMidnight);

    return () => clearTimeout(timer);
  }, []);

  // Dismiss notification
  const dismissNotification = useCallback((id: string) => {
    setDismissedNotifications((prev) => new Set(prev).add(id));
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // Think animation runner
  const runThinkingAnimation = useCallback(
    (type: keyof typeof thinkingSteps) => {
      const steps = thinkingSteps[type];
      setCompletedSteps(new Set());
      setCurrentStepIndex(0);

      steps.forEach((step, index) => {
        setTimeout(() => {
          setCurrentStepIndex(index);
          setThinkingStep(step.text);
          setCompletedSteps((prev) => new Set(prev).add(step.id));
        }, index * 800);
      });

      return steps.length * 800;
    },
    [],
  );

  // Invoke AI function - wrapped in useCallback for stable identity
  const invoke = useCallback(
    async (action: string, payload: Record<string, unknown>) => {
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke("ai-chief", {
          body: { action, ...payload },
        });
        if (error) throw error;
        if (data?.error) {
          if (data.kind === "rate_limit") {
            toast({
              title: "AI is handling another request",
              description: "Give me just a moment to finish up.",
            });
          } else {
            toast({
              title: "Something unexpected happened",
              description: data.error || "Let me try again.",
              variant: "destructive",
            });
          }
          return null;
        }
        return data;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        toast({
          title: "Connection issue",
          description: "Please check your connection and try again.",
          variant: "destructive",
        });
        return null;
      } finally {
        setLoading(false);
        setThinkingStep("");
        setCompletedSteps(new Set());
        setCurrentStepIndex(0);
      }
    },
    [], // stable forever — only touches stable setters + the stable `toast` import
  );

  // Auto-run morning briefing - ref-guarded to prevent infinite loops
  useEffect(() => {
    if (!open) return;
    if (tab !== "briefing") return;

    // Already have a briefing for today — nothing to do.
    if (briefingDate === todayDayId && briefing) return;

    // We've already attempted a fetch for this date (success OR failure).
    // Don't auto-retry on every render — the user can hit 🔄 to force it.
    if (briefingFetchRef.current === todayDayId) return;

    briefingFetchRef.current = todayDayId;

    let cancelled = false;

    (async () => {
      setLoading(true);
      await runThinkingAnimation("briefing");

      const data = await invoke("briefing", {
        tasks: tasks.map((t) => ({
          id: t.id,
          title: t.title,
          date: t.date,
          completed: t.completed,
          priority: t.priority,
          mood: t.mood,
          timeBlock: t.timeBlock,
        })),
        todayDate: todayDayId,
        mode,
      });

      if (cancelled) return;

      if (data) {
        setBriefing(data.data || data);
        setBriefingDate(todayDayId);
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
    // Only re-run when the panel opens, the tab changes, or the day changes.
    // `tasks`, `mode`, `invoke`, `runThinkingAnimation` are intentionally
    // excluded: `invoke`/`runThinkingAnimation` are now stable refs, and we
    // don't want a tasks/mode edit to silently re-trigger a fetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, tab, todayDayId]);

  // REMOVED: Auto-refresh on task change was causing infinite loop
  // Users can manually refresh using the refresh button in the briefing tab

  const handleBreakdown = async () => {
    if (!goalInput.trim()) return;
    setLoading(true);
    setBreakdown(null);
    setAccepted(new Set());

    await runThinkingAnimation("breakdown");

    const data = await invoke("breakdown", {
      goal: goalInput,
      todayDate: todayDayId,
      weekDates: currentWeekDates,
    });

    if (data) setBreakdown(data.data || data);
    setLoading(false);
  };

  const handleSchedule = async () => {
    if (!scheduleInput.trim()) return;
    setLoading(true);
    createSnapshot("Before AI scheduling");
    setSchedule(null);
    setAccepted(new Set());
    setMissionReport(null);

    await runThinkingAnimation("schedule");

    const data = await invoke("schedule", {
      goals: scheduleInput,
      todayDate: todayDayId,
      weekDates: currentWeekDates,
      existingTasks: tasks
        .filter((t) => currentWeekDates.includes(t.date))
        .map((t) => ({ title: t.title, date: t.date, completed: t.completed })),
    });

    if (data) {
      const scheduleData = (data.data || data) as Schedule;
      setSchedule(scheduleData);
      setLastAction("schedule");

      const reportData = await invoke("mission_report", {
        tasks: tasks
          .filter((t) => currentWeekDates.includes(t.date))
          .map((t) => ({
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
      });

      if (reportData) {
        setMissionReport((reportData.data || reportData) as MissionReport);
      }

      addExplanation({
        action: "reschedule",
        reason: scheduleData?.rationale || "Schedule optimized.",
        confidence: 85,
        model: "gemini-1.5-pro",
      });
    }
    setLoading(false);
  };

  const dateForOffset = (offset: number) => {
    const base = todayIdx >= 0 ? todayIdx : 0;
    const safeOffset = Number(offset) || 0;
    const idx = Math.min(6, Math.max(0, base + safeOffset));
    return currentWeekDates[idx];
  };

  const acceptSubtask = (
    key: string,
    title: string,
    dayOffset: number,
    priority: TaskPriority,
    mood?: TaskMood,
    timeBlock?: TimeBlock,
  ) => {
    const date = dateForOffset(dayOffset);
    if (!date) return;
    addTask(
      date,
      title || "New Task",
      priority || "medium",
      mood,
      timeBlock,
      null,
    );
    setAccepted((prev) => new Set(prev).add(key));
  };

  const acceptAllBreakdown = () => {
    if (!breakdown || !Array.isArray(breakdown.subtasks)) return;
    breakdown.subtasks.forEach((s, i) => {
      const k = `b-${i}`;
      if (accepted.has(k)) return;
      acceptSubtask(k, s.title, s.dayOffset, s.priority, s.mood, s.timeBlock);
    });
  };

  const acceptAllSchedule = () => {
    if (!schedule || !Array.isArray(schedule.assignments)) return;
    schedule.assignments.forEach((a, i) => {
      const k = `s-${i}`;
      if (accepted.has(k)) return;
      acceptSubtask(k, a.title, a.dayOffset, a.priority, a.mood, a.timeBlock);
    });
  };

  // Get current thinking steps
  const currentSteps =
    thinkingSteps[tab as keyof typeof thinkingSteps] || thinkingSteps.briefing;

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" />

      {/* Notification Banner - Proactive AI */}
      {notifications.length > 0 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 animate-slide-down">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/20 border border-primary/30 backdrop-blur-md shadow-lg max-w-md">
            <span className="text-lg">💡</span>
            <p className="text-xs font-body text-foreground flex-1">
              {notifications[0].message}
            </p>
            <button
              onClick={() => dismissNotification(notifications[0].id)}
              className="text-foreground/40 hover:text-foreground text-sm"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div
        className="relative glass-panel bg-black/75 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl w-[92vw] max-w-xl max-h-[85vh] overflow-hidden flex flex-col animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-3 border-b border-foreground/10">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg text-foreground flex items-center gap-2">
              <span className="text-xl">✦</span>
              <span>Chief of Staff</span>
              <span className="text-[10px] font-body italic text-foreground/40">
                powered by Gemini
              </span>
            </h2>
            <button
              onClick={onClose}
              className="text-foreground/50 hover:text-foreground text-sm"
            >
              ✕
            </button>
          </div>
          <div className="flex gap-1 flex-wrap">
            {(["briefing", "breakdown", "schedule", "report", "chat", "decisions"] as Tab[]).map(
              (t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-body capitalize transition-all ${
                    tab === t
                      ? "bg-primary/25 text-foreground ring-1 ring-primary/40"
                      : "text-foreground/50 hover:text-foreground/80 hover:bg-white/5"
                  }`}
                >
                  {t === "briefing"
                    ? "☀ Today"
                    : t === "breakdown"
                      ? "⚡ Break down"
                      : t === "schedule"
                        ? "🗓 Plan week"
                        : t === "report"
                          ? "📊 Report"
                          : t === "chat"
                            ? "💬 Chat"
                            : "🧠 Decisions"}
                </button>
              ),
            )}
            <button
              onClick={() => {
                onClose();
                setTimeout(
                  () => window.dispatchEvent(new Event("open-recovery")),
                  100,
                );
              }}
              className="px-3 py-1.5 rounded-full text-[11px] font-body text-green-400/70 hover:text-green-400 hover:bg-green-500/10 transition-all"
            >
              🌱 Recover
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {/* ENHANCED THINKING ANIMATION - only show for non-chat tabs */}
          {loading && tab !== "chat" && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              {/* Animated brain icon */}
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
                  <span className="text-3xl">🧠</span>
                </div>
                {/* Pulsing rings */}
                <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping" />
              </div>

              {/* Steps with checkmarks */}
              <div className="space-y-2 w-full max-w-xs">
                {currentSteps.map((step, index) => {
                  const isCompleted = completedSteps.has(step.id);
                  const isCurrent = index === currentStepIndex && !isCompleted;
                  const isPending = !isCompleted && !isCurrent;

                  return (
                    <div
                      key={step.id}
                      className={`flex items-center gap-3 text-xs font-body transition-all duration-300 ${
                        isCompleted
                          ? "text-green-400"
                          : isCurrent
                            ? "text-foreground"
                            : "text-foreground/30"
                      }`}
                    >
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                          isCompleted
                            ? "bg-green-500/20 text-green-400"
                            : isCurrent
                              ? "bg-primary/20 text-primary animate-pulse"
                              : "bg-white/5 text-foreground/20"
                        }`}
                      >
                        {isCompleted ? "✓" : isCurrent ? step.emoji : "○"}
                      </span>
                      <span className={isPending ? "opacity-30" : ""}>
                        {step.text}
                      </span>
                      {isCurrent && (
                        <span className="ml-auto text-primary animate-pulse">
                          ...
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* BRIEFING - Enhanced with weather-like greeting */}
          {tab === "briefing" && !loading && briefing && (
            <div className="space-y-4 animate-fade-in">
              {/* Weather-like greeting card */}
              <div className="rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-green-500/10 border border-primary/20 p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-2xl mb-1">☀️</p>
                    <p className="font-display text-xl text-foreground leading-tight">
                      {getTimeBasedGreeting()}. Here's your mission for today.
                    </p>
                    <p className="text-xs font-body text-foreground/60 mt-2">
                      {tasks.length} tasks tracked
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <button
                      onClick={() => {
                        setBriefing(null);
                        setBriefingDate(null);
                        briefingFetchRef.current = null; // allow the effect to fetch again
                      }}
                      className="text-[10px] text-foreground/40 hover:text-foreground/70 transition-colors"
                      title="Refresh briefing"
                    >
                      🔄
                    </button>
                    <div className="text-right">
                      <p className="font-display text-3xl text-foreground">
                        {Math.round(Number(briefing?.confidence) || 0)}%
                      </p>
                      <p className="text-[10px] font-body text-foreground/40">
                        confidence
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-white/5 border border-foreground/10 p-3">
                  <p className="text-[9px] font-body text-foreground/40 uppercase tracking-widest">
                    Workload
                  </p>
                  <p className="font-display text-lg text-foreground mt-0.5">
                    {(Number(briefing?.workloadHours) || 0).toFixed(1)}h
                  </p>
                </div>
                <div className="rounded-xl bg-white/5 border border-foreground/10 p-3">
                  <p className="text-[9px] font-body text-foreground/40 uppercase tracking-widest">
                    Deep Work
                  </p>
                  <p className="font-display text-lg text-foreground mt-0.5">
                    {briefing?.bestFocusWindow || "Flexible"}
                  </p>
                </div>
              </div>

              {/* Top Risk */}
              <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs">⚠️</span>
                  <p className="text-[10px] font-body text-red-400/70 uppercase tracking-widest">
                    Top Risk
                  </p>
                </div>
                <p className="text-xs font-body text-foreground/90">
                  {briefing?.topRisk || "None identified."}
                </p>
              </div>

              {/* Recommendation */}
              <div className="rounded-xl bg-primary/10 border border-primary/20 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs">💡</span>
                  <p className="text-[10px] font-body text-primary/70 uppercase tracking-widest">
                    Recommendation
                  </p>
                </div>
                <p className="text-sm font-body text-foreground leading-relaxed">
                  {briefing?.recommendation || "Proceed with your priorities."}
                </p>
              </div>
            </div>
          )}

          {tab === "briefing" && !loading && !briefing && (
            <div className="flex flex-col items-center justify-center py-10 space-y-4 animate-fade-in">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                <span className="text-4xl">☀️</span>
              </div>
              <p className="text-foreground/80 text-sm font-body text-center">
                Welcome back.
              </p>
              <p className="text-foreground/40 text-xs font-body text-center">
                Click "Today" to receive your morning briefing.
              </p>
            </div>
          )}

          {/* BREAKDOWN */}
          {tab === "breakdown" && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  value={goalInput}
                  onChange={(e) => setGoalInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleBreakdown()}
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
                    <p className="text-xs font-body text-foreground/90">
                      {breakdown?.summary || "Goal Breakdown"}
                    </p>
                    <p className="text-[10px] font-body text-foreground/50 mt-1">
                      ≈ {Number(breakdown?.estimatedHours) || 0}h total
                    </p>
                  </div>
                  {(breakdown?.subtasks || []).map((s, i) => {
                    const k = `b-${i}`;
                    const date = dateForOffset(Number(s.dayOffset) || 0);
                    const day = days.find((d) => d.id === date);
                    return (
                      <div
                        key={k}
                        className={`flex items-start gap-3 p-3 rounded-xl border ${accepted.has(k) ? "bg-primary/10 border-primary/20 opacity-60" : "bg-white/5 border-foreground/10"}`}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-body text-foreground">
                            {s.title || "Task"}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5 text-[10px] text-foreground/50">
                            <span>{priEmoji[s.priority || "medium"]}</span>
                            {s.timeBlock && (
                              <span>{blockEmoji[s.timeBlock]}</span>
                            )}
                            <span>{Number(s.estimatedMinutes) || 0}m</span>
                            <span>
                              · {day?.short ?? `+${Number(s.dayOffset) || 0}d`}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() =>
                            acceptSubtask(
                              k,
                              s.title,
                              s.dayOffset,
                              s.priority,
                              s.mood,
                              s.timeBlock,
                            )
                          }
                          disabled={accepted.has(k)}
                          className={`px-3 py-1 rounded-lg text-[10px] font-body ${accepted.has(k) ? "text-primary/60 bg-primary/5" : "text-foreground/70 bg-white/10 hover:bg-primary/20 hover:text-foreground"}`}
                        >
                          {accepted.has(k) ? "✓ Added" : "Accept"}
                        </button>
                      </div>
                    );
                  })}
                  {(breakdown?.subtasks || []).some(
                    (_, i) => !accepted.has(`b-${i}`),
                  ) && (
                    <button
                      onClick={acceptAllBreakdown}
                      className="w-full py-2 rounded-lg text-xs font-body bg-primary/15 text-foreground/80 hover:bg-primary/25 border border-primary/15 transition-all duration-200 hover:scale-[1.01]"
                    >
                      Accept all
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* SCHEDULE */}
          {tab === "schedule" && (
            <div className="space-y-3">
              <textarea
                value={scheduleInput}
                onChange={(e) => setScheduleInput(e.target.value)}
                placeholder={
                  "List your goals for the week, one per line.\nExam Friday\nWorkout\nAssignments\n…"
                }
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
                    <p className="text-[10px] font-body text-primary/70 uppercase tracking-widest mb-1">
                      Why this plan
                    </p>
                    <p className="text-xs font-body text-foreground/90 leading-relaxed">
                      {schedule?.rationale ||
                        "Balanced workflow distributed across the week."}
                    </p>
                  </div>
                  {(schedule?.assignments || []).map((a, i) => {
                    const k = `s-${i}`;
                    const date = dateForOffset(Number(a.dayOffset) || 0);
                    const day = days.find((d) => d.id === date);
                    return (
                      <div
                        key={k}
                        className={`flex items-start gap-3 p-3 rounded-xl border ${accepted.has(k) ? "bg-primary/10 border-primary/20 opacity-60" : "bg-white/5 border-foreground/10"}`}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-body text-foreground">
                            {a.title || "Task"}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5 text-[10px] text-foreground/50">
                            <span>{priEmoji[a.priority || "medium"]}</span>
                            {a.timeBlock && (
                              <span>{blockEmoji[a.timeBlock]}</span>
                            )}
                            <span>
                              · {day?.name ?? `+${Number(a.dayOffset) || 0}d`}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() =>
                            acceptSubtask(
                              k,
                              a.title,
                              a.dayOffset,
                              a.priority,
                              a.mood,
                              a.timeBlock,
                            )
                          }
                          disabled={accepted.has(k)}
                          className={`px-3 py-1 rounded-lg text-[10px] font-body ${accepted.has(k) ? "text-primary/60 bg-primary/5" : "text-foreground/70 bg-white/10 hover:bg-primary/20 hover:text-foreground"}`}
                        >
                          {accepted.has(k) ? "✓" : "Add"}
                        </button>
                      </div>
                    );
                  })}
                  {(schedule?.assignments || []).some(
                    (_, i) => !accepted.has(`s-${i}`),
                  ) && (
                    <button
                      onClick={acceptAllSchedule}
                      className="w-full py-2 rounded-lg text-xs font-body bg-primary/15 text-foreground/80 hover:bg-primary/25 border border-primary/15 transition-all duration-200 hover:scale-[1.01]"
                    >
                      Apply entire plan
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* MISSION REPORT */}
          {tab === "report" && missionReport && (
            <div className="space-y-3 animate-fade-in">
              <div className="rounded-xl bg-gradient-to-br from-primary/20 to-green-500/10 border border-primary/20 p-4">
                <h3 className="text-xs font-body text-primary/70 uppercase tracking-widest mb-3">
                  Mission Report
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <Stat
                    label="Completion"
                    value={`${Math.round(Number(missionReport?.completionProbability) || 0)}%`}
                  />
                  <Stat
                    label="Deep Work"
                    value={`${(Number(missionReport?.deepWorkHours) || 0).toFixed(1)}h`}
                  />
                  <Stat
                    label="Recovery"
                    value={`${(Number(missionReport?.recoveryTime) || 0).toFixed(1)}h`}
                  />
                  <Stat
                    label="High Risk"
                    value={String(Number(missionReport?.highRiskTasks) || 0)}
                    small
                  />
                </div>
              </div>
              <div className="rounded-xl bg-white/5 border border-foreground/10 p-3">
                <p className="text-[10px] font-body text-foreground/40 uppercase tracking-widest mb-2">
                  Strategy
                </p>
                <p className="text-xs font-body text-foreground/80 leading-relaxed">
                  {missionReport?.schedulingStrategy || "Standard tracking."}
                </p>
              </div>
              {Number(missionReport?.protectedFocusBlocks) > 0 && (
                <div className="flex items-center gap-2 text-xs text-green-400">
                  <span>✓</span>
                  <span>
                    {missionReport.protectedFocusBlocks} focus blocks protected
                  </span>
                </div>
              )}
            </div>
          )}

          {tab === "report" && !missionReport && (
            <div className="flex flex-col items-center justify-center py-10 space-y-4 animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-3xl">📊</span>
              </div>
              <p className="text-foreground/60 text-xs font-body text-center">
                Your mission report will appear here.
              </p>
              <p className="text-foreground/40 text-[10px] font-body text-center">
                Plan your week to see the strategy breakdown.
              </p>
            </div>
          )}

          {/* CHAT TAB */}
          {tab === "chat" && (
            <div className="space-y-3 animate-fade-in h-[300px] flex flex-col">
              {/* Inline chat loading indicator */}
              {chatLoading && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20 text-xs font-body text-foreground/70">
                  <span className="animate-pulse">🧠</span>
                  <span>Thinking...</span>
                </div>
              )}
              <div className="flex-1 overflow-y-auto space-y-2 min-h-[200px]">
                {chatMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center space-y-2">
                    <span className="text-3xl">💬</span>
                    <p className="text-xs font-body text-foreground/60">
                      Chat with your AI Chief
                    </p>
                    <p className="text-[10px] font-body text-foreground/40">
                      Ask questions, get advice, or discuss your tasks
                    </p>
                  </div>
                ) : (
                  chatMessages.map((msg, i) => (
                    <div
                      key={i}
                      className={`p-2 rounded-lg text-xs font-body ${
                        msg.role === "user"
                          ? "bg-primary/10 border border-primary/20 ml-4"
                          : "bg-white/5 border border-foreground/10 mr-4"
                      }`}
                    >
                      {msg.content}
                    </div>
                  ))
                )}
              </div>
              <div className="flex gap-2">
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && chatInput.trim()) {
                      // Add user message
                      const userMsg = chatInput.trim();
                      setChatMessages(prev => [...prev, { role: "user", content: userMsg }]);
                      setChatInput("");

                      // Generate AI response and handle actions
                      (async () => {
                        setChatLoading(true);
                        try {
                          const data = await invoke("chat", {
                            message: userMsg,
                            tasks: tasks.slice(0, 15).map(t => ({ id: t.id, title: t.title, completed: t.completed, date: t.date, priority: t.priority })),
                            todayDate: todayDayId,
                            weekDates: currentWeekDates,
                          });

                          // Debug: log what we received
                          console.log("Chat response data:", data);

                          // Unwrap the { data, source, fallback, timestamp } envelope
                          const payload = data?.data || data;

                          console.log("Chat payload:", payload);

                          // Handle action if present
                          if (payload?.action && payload.action.type !== "none") {
                            const { action } = payload;
                            if (action.type === "add" && action.taskTitle) {
                              addTask(todayDayId, action.taskTitle, action.newPriority || "medium", undefined, undefined, null);
                              setChatMessages(prev => [...prev, { role: "ai", content: payload.response || `Added "${action.taskTitle}" to your today.` }]);
                            } else if ((action.type === "move" || action.type === "reschedule") && action.taskTitle && action.targetDate) {
                              const taskToMove = tasks.find(t => t.title.toLowerCase().includes(action.taskTitle.toLowerCase()));
                              if (taskToMove) {
                                moveTask(taskToMove.id, action.targetDate);
                                setChatMessages(prev => [...prev, { role: "ai", content: payload.response || `Rescheduled "${action.taskTitle}" to ${action.targetDate}.` }]);
                              } else {
                                setChatMessages(prev => [...prev, { role: "ai", content: payload.response || "I couldn't find that task." }]);
                              }
                            } else if (action.type === "priority" && action.taskTitle && action.newPriority) {
                              const taskToUpdate = tasks.find(t => t.title.toLowerCase().includes(action.taskTitle.toLowerCase()));
                              if (taskToUpdate) {
                                updateTaskDetails(taskToUpdate.id, { priority: action.newPriority });
                                setChatMessages(prev => [...prev, { role: "ai", content: payload.response || `Updated priority for "${action.taskTitle}" to ${action.newPriority}.` }]);
                              } else {
                                setChatMessages(prev => [...prev, { role: "ai", content: payload.response || "I couldn't find that task." }]);
                              }
                            } else if (action.type === "delete" && action.taskTitle) {
                              const taskToDelete = tasks.find(t => t.title.toLowerCase().includes(action.taskTitle.toLowerCase()));
                              if (taskToDelete) {
                                deleteTask(taskToDelete.id);
                                setChatMessages(prev => [...prev, { role: "ai", content: payload.response || `Deleted "${action.taskTitle}".` }]);
                              } else {
                                setChatMessages(prev => [...prev, { role: "ai", content: payload.response || "I couldn't find that task." }]);
                              }
                            } else {
                              setChatMessages(prev => [...prev, { role: "ai", content: payload.response || "I understand. How can I help?" }]);
                            }
                          } else if (payload?.response) {
                            setChatMessages(prev => [...prev, { role: "ai", content: payload.response }]);
                          } else {
                            setChatMessages(prev => [...prev, { role: "ai", content: "I understand. Tell me more about what you'd like to accomplish." }]);
                          }
                        } catch (error) {
                          console.error("Chat error:", error);
                          setChatMessages(prev => [...prev, { role: "ai", content: "Sorry, something went wrong. Please try again." }]);
                        } finally {
                          setChatLoading(false);
                        }
                      })();
                    }
                  }}
                  placeholder="Type a message..."
                  className="flex-1 bg-white/5 border border-foreground/15 rounded-lg px-3 py-2 text-xs font-body text-foreground placeholder:text-foreground/30 outline-none focus:border-primary/40"
                />
              </div>
            </div>
          )}

          {/* DECISIONS TAB - Decision Replay */}
          {tab === "decisions" && (
            <div className="space-y-3 animate-fade-in">
              <div className="rounded-xl bg-gradient-to-br from-primary/20 to-green-500/10 border border-primary/20 p-4">
                <h3 className="text-xs font-body text-primary/70 uppercase tracking-widest mb-3">
                  🧠 Decision Replay
                </h3>
                <p className="text-xs font-body text-foreground/70 mb-3">
                  See how AI has helped manage your week
                </p>
              </div>

              {explanations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 space-y-3">
                  <span className="text-3xl">🧠</span>
                  <p className="text-foreground/60 text-xs font-body text-center">
                    No decisions recorded yet
                  </p>
                  <p className="text-foreground/40 text-[10px] font-body text-center">
                    Use AI features to see decision history
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {explanations.slice(-10).reverse().map((exp, i) => (
                    <div
                      key={exp.id || i}
                      className="rounded-lg bg-white/5 border border-foreground/10 p-3"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-body text-primary/70">
                          {(() => {
                            switch (exp.action) {
                              case "move":
                                return "📅";
                              case "recovery":
                                return "⚡";
                              case "split":
                                return "✂️";
                              case "priority_change":
                                return "🎯";
                              case "reflection":
                                return "✨";
                              case "risk_warning":
                                return "⚠️";
                              default:
                                return "✨";
                            }
                          })()} {exp.action}
                        </span>
                        <span className="text-[9px] font-body text-foreground/40">
                          {exp.model}
                        </span>
                      </div>
                      <p className="text-xs font-body text-foreground/80">
                        {exp.reason}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[9px] text-foreground/50">
                          Confidence: {exp.confidence}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
                    toast({
                      title: "Undone",
                      description: lastSnapshot.description,
                    });
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

function Stat({
  label,
  value,
  small,
}: {
  label: string;
  value: string;
  small?: boolean;
}) {
  return (
    <div className="rounded-xl bg-white/5 border border-foreground/10 p-3">
      <p className="text-[9px] font-body text-foreground/40 uppercase tracking-widest">
        {label}
      </p>
      <p
        className={`font-display text-foreground mt-0.5 ${small ? "text-xs leading-snug" : "text-base"}`}
      >
        {value}
      </p>
    </div>
  );
}
