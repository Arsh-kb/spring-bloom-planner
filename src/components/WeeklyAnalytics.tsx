import { useMemo } from 'react';
import { usePlanner } from '@/context/PlannerContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface WeeklyAnalyticsProps {
  onClose: () => void;
}

const MOOD_COLORS: Record<string, string> = {
  'high-strain': 'hsl(15, 75%, 55%)',
  'reflective': 'hsl(215, 40%, 60%)',
  'routine': 'hsl(38, 15%, 55%)',
  'energizing': 'hsl(80, 55%, 50%)',
  'none': 'hsl(0, 0%, 40%)',
};

const PRIORITY_COLORS: Record<string, string> = {
  high: 'hsl(15, 75%, 55%)',
  medium: 'hsl(38, 70%, 55%)',
  low: 'hsl(140, 40%, 50%)',
};

export function WeeklyAnalytics({ onClose }: WeeklyAnalyticsProps) {
  const { days, tasks, currentWeekDates, focusSessions } = usePlanner();

  const completionData = useMemo(() => {
    return days.map(day => {
      const total = day.tasks.length;
      const done = day.tasks.filter(t => t.completed).length;
      return {
        name: day.short,
        total,
        done,
        rate: total > 0 ? Math.round((done / total) * 100) : 0,
      };
    });
  }, [days]);

  const moodData = useMemo(() => {
    const weekTasks = tasks.filter(t => currentWeekDates.includes(t.date));
    const counts: Record<string, number> = {};
    weekTasks.forEach(t => {
      const m = t.mood || 'none';
      counts[m] = (counts[m] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({
      name: name === 'none' ? 'Unset' : name,
      value,
      color: MOOD_COLORS[name] || MOOD_COLORS.none,
    }));
  }, [tasks, currentWeekDates]);

  const priorityData = useMemo(() => {
    const weekTasks = tasks.filter(t => currentWeekDates.includes(t.date));
    const counts: Record<string, number> = { high: 0, medium: 0, low: 0 };
    weekTasks.forEach(t => { counts[t.priority] = (counts[t.priority] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({
      name,
      value,
      color: PRIORITY_COLORS[name],
    }));
  }, [tasks, currentWeekDates]);

  const timeBlockData = useMemo(() => {
    const weekTasks = tasks.filter(t => currentWeekDates.includes(t.date));
    const blocks = { morning: 0, afternoon: 0, evening: 0, unset: 0 };
    weekTasks.forEach(t => {
      if (t.timeBlock) blocks[t.timeBlock]++;
      else blocks.unset++;
    });
    return [
      { name: '🌅 Morning', value: blocks.morning },
      { name: '☀️ Afternoon', value: blocks.afternoon },
      { name: '🌙 Evening', value: blocks.evening },
      { name: '⏱ Unset', value: blocks.unset },
    ].filter(b => b.value > 0);
  }, [tasks, currentWeekDates]);

  const focusStats = useMemo(() => {
    const weekSessions = focusSessions.filter(s => currentWeekDates.some(d => s.completedAt.startsWith(d)));
    const totalMinutes = Math.round(weekSessions.reduce((sum, s) => sum + s.duration, 0) / 60);
    const avgSwitches = weekSessions.length > 0
      ? (weekSessions.reduce((sum, s) => sum + s.tabSwitches, 0) / weekSessions.length).toFixed(1)
      : '0';
    return { count: weekSessions.length, minutes: totalMinutes, avgSwitches };
  }, [focusSessions, currentWeekDates]);

  const totalTasks = tasks.filter(t => currentWeekDates.includes(t.date)).length;
  const completedTasks = tasks.filter(t => currentWeekDates.includes(t.date) && t.completed).length;
  const overallRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
      <div className="relative z-10 w-full max-w-4xl glass-panel rounded-2xl p-8 max-h-[85vh] overflow-y-auto scrollbar-thin shadow-2xl">
        <div className="flex items-center justify-between mb-6 border-b border-foreground/10 pb-4">
          <h2 className="font-display text-2xl text-foreground/95 text-nature drop-shadow-md">Weekly Insights</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-black/20 text-foreground/60 hover:text-foreground hover:bg-black/40 transition-colors text-xl border border-white/5">×</button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-black/15 border border-white/5 rounded-xl p-4 text-center shadow-inner">
            <p className="text-2xl font-display text-foreground/90">{overallRate}%</p>
            <p className="text-[10px] font-body text-foreground/50 mt-1">Completion Rate</p>
          </div>
          <div className="bg-black/15 border border-white/5 rounded-xl p-4 text-center shadow-inner">
            <p className="text-2xl font-display text-foreground/90">{completedTasks}/{totalTasks}</p>
            <p className="text-[10px] font-body text-foreground/50 mt-1">Tasks Done</p>
          </div>
          <div className="bg-black/15 border border-white/5 rounded-xl p-4 text-center shadow-inner">
            <p className="text-2xl font-display text-foreground/90">{focusStats.count}</p>
            <p className="text-[10px] font-body text-foreground/50 mt-1">Focus Sessions</p>
          </div>
          <div className="bg-black/15 border border-white/5 rounded-xl p-4 text-center shadow-inner">
            <p className="text-2xl font-display text-foreground/90">{focusStats.minutes}m</p>
            <p className="text-[10px] font-body text-foreground/50 mt-1">Focus Time</p>
          </div>
        </div>

        {/* Charts grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Daily completion */}
          <div className="bg-black/10 border border-white/5 rounded-xl p-5 shadow-inner">
            <h3 className="font-body text-xs text-foreground/50 mb-4 uppercase tracking-widest">Daily Completion</h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={completionData}>
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsla(42, 30%, 92%, 0.5)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'hsla(42, 30%, 92%, 0.3)' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: 'hsla(38, 20%, 15%, 0.95)', border: '1px solid hsla(0,0%,100%,0.1)', borderRadius: 8, fontSize: 11 }}
                  labelStyle={{ color: 'hsla(42, 30%, 92%, 0.8)' }}
                />
                <Bar dataKey="done" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} opacity={0.85} />
                <Bar dataKey="total" fill="hsla(0, 0%, 100%, 0.1)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Mood distribution */}
          <div className="bg-black/10 border border-white/5 rounded-xl p-5 shadow-inner">
            <h3 className="font-body text-xs text-foreground/50 mb-4 uppercase tracking-widest">Mood Distribution</h3>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="50%" height={160}>
                <PieChart>
                  <Pie data={moodData} dataKey="value" cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={3}>
                    {moodData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} opacity={0.85} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {moodData.map(m => (
                  <div key={m.name} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: m.color }} />
                    <span className="text-[10px] font-body text-foreground/60">{m.name}</span>
                    <span className="text-[10px] font-body text-foreground/40 ml-auto">{m.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Priority breakdown */}
          <div className="bg-black/10 border border-white/5 rounded-xl p-5 shadow-inner">
            <h3 className="font-body text-xs text-foreground/50 mb-4 uppercase tracking-widest">Priority Breakdown</h3>
            <div className="space-y-3">
              {priorityData.map(p => (
                <div key={p.name} className="flex items-center gap-3">
                  <span className="text-[11px] w-16 font-body text-foreground/60 capitalize">
                    {p.name === 'high' ? '🍒 High' : p.name === 'medium' ? '🌿 Med' : '🍂 Low'}
                  </span>
                  <div className="flex-1 h-3 bg-black/20 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${totalTasks > 0 ? (p.value / totalTasks) * 100 : 0}%`,
                        backgroundColor: p.color,
                        opacity: 0.8,
                      }}
                    />
                  </div>
                  <span className="text-[10px] font-body text-foreground/40 w-6 text-right">{p.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Time block usage */}
          <div className="bg-black/10 border border-white/5 rounded-xl p-5 shadow-inner">
            <h3 className="font-body text-xs text-foreground/50 mb-4 uppercase tracking-widest">Time Block Usage</h3>
            <div className="space-y-3">
              {timeBlockData.map(tb => (
                <div key={tb.name} className="flex items-center gap-3">
                  <span className="text-[11px] w-24 font-body text-foreground/60">{tb.name}</span>
                  <div className="flex-1 h-3 bg-black/20 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary/60 transition-all duration-700"
                      style={{ width: `${totalTasks > 0 ? (tb.value / totalTasks) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-body text-foreground/40 w-6 text-right">{tb.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
