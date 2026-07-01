import { usePlanner } from '@/context/PlannerContext';
import { useMemo } from 'react';

export function MorningBriefing() {
  const { tasks, todayDayId, confidence, currentWeekDates, enterDeepFocus } = usePlanner();

  const todayTasks = tasks.filter(t => t.date === todayDayId);
  const todayOpen = todayTasks.filter(t => !t.completed);
  const highPriorityOpen = todayOpen.filter(t => t.priority === 'high');
  const focusTask = highPriorityOpen[0] ?? todayOpen[0];

  // Weekly load per day (for energy visual)
  const dayLoads = useMemo(() => currentWeekDates.map(d => {
    const iso = d.toISOString().split('T')[0];
    return tasks.filter(t => t.date === iso && !t.completed).length;
  }), [currentWeekDates, tasks]);
  const maxLoad = Math.max(1, ...dayLoads);
  const todayIndex = currentWeekDates.findIndex(d => d.toISOString().split('T')[0] === todayDayId);

  const cycleLabel = useMemo(() => {
    if (!currentWeekDates.length) return '';
    const s = currentWeekDates[0];
    const e = currentWeekDates[currentWeekDates.length - 1];
    const opts: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric' };
    return `${s.toLocaleDateString('en-US', opts)} — ${e.toLocaleDateString('en-US', opts)}`;
  }, [currentWeekDates]);

  const briefing = focusTask
    ? <>Today is about <em className="italic text-emerald-100">momentum</em>. Your Chief has protected focus for <em className="italic text-foreground">{focusTask.title}</em>{highPriorityOpen.length > 1 ? <>, then {highPriorityOpen.length - 1} more high-priority thread{highPriorityOpen.length > 2 ? 's' : ''}</> : null}.</>
    : todayTasks.length > 0
      ? <>Today's ledger is <em className="italic text-emerald-100">clear</em>. Every task is closed — a rare kind of quiet. Consider resting.</>
      : <>Today is <em className="italic text-emerald-100">unwritten</em>. Ask your Chief to shape it, or drop your goals into any day and let the schedule build itself.</>;

  const openChief = () => window.dispatchEvent(new Event('open-ai-planner'));

  return (
    <section className="relative mb-5 rounded-[28px] overflow-hidden group">
      {/* Layered glass */}
      <div className="absolute inset-0 bg-white/[0.04] backdrop-blur-3xl border border-white/10 rounded-[28px]" />
      <div className="absolute -top-24 -right-16 w-64 h-64 rounded-full bg-emerald-400/10 blur-[80px] pointer-events-none" />
      <div className="absolute -bottom-20 -left-10 w-56 h-56 rounded-full bg-amber-400/10 blur-[80px] pointer-events-none" />

      <div className="relative flex flex-col md:flex-row gap-6 md:gap-10 items-stretch p-6 md:p-8">
        {/* Left: briefing copy */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="font-mono text-[10px] tracking-[0.35em] uppercase text-emerald-300/90">Morning Briefing</span>
              <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-foreground/40 hidden sm:inline">{cycleLabel}</span>
            </div>
            <h2 className="font-editorial font-light italic text-2xl md:text-[28px] leading-[1.2] text-foreground/95 max-w-2xl drop-shadow-md">
              {briefing}
            </h2>
          </div>
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => focusTask ? enterDeepFocus(focusTask.id) : openChief()}
              className="group/btn px-6 py-2.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/20 transition-all flex items-center gap-3 backdrop-blur-md"
            >
              <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-foreground">Enter Flow</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
            </button>
            <button
              onClick={openChief}
              className="px-6 py-2.5 font-mono text-[10px] tracking-[0.25em] uppercase text-foreground/60 hover:text-foreground transition-colors"
            >
              Reshape Day
            </button>
          </div>
        </div>

        {/* Right: energy/load visual */}
        <div className="w-full md:w-72 bg-white/[0.04] rounded-2xl p-5 border border-white/10 backdrop-blur-md flex flex-col">
          <div className="flex justify-between items-center mb-5">
            <span className="font-mono text-[9px] tracking-[0.3em] uppercase text-foreground/50">Week Load</span>
            <span className={`font-mono text-[9px] tracking-[0.2em] uppercase ${
              (confidence?.overall ?? 60) >= 70 ? 'text-emerald-400' :
              (confidence?.overall ?? 60) >= 40 ? 'text-amber-400' : 'text-red-400'
            }`}>
              {confidence ? `${Math.round(confidence.overall)}% Confidence` : 'Steady'}
            </span>
          </div>
          <div className="flex items-end gap-1.5 h-16 flex-1">
            {dayLoads.map((load, i) => {
              const h = Math.max(8, (load / maxLoad) * 100);
              const isToday = i === todayIndex;
              return (
                <div
                  key={i}
                  className={`flex-1 rounded-sm transition-all ${
                    isToday ? 'bg-emerald-400/70 shadow-[0_0_12px_rgba(52,211,153,0.4)]'
                    : load === 0 ? 'bg-white/[0.06]' : 'bg-white/25'
                  }`}
                  style={{ height: `${h}%` }}
                  title={`${load} open`}
                />
              );
            })}
          </div>
          <div className="flex justify-between mt-2 font-mono text-[8px] tracking-widest text-foreground/30 uppercase">
            {['M','T','W','T','F','S','S'].map((d, i) => (
              <span key={i} className={i === todayIndex ? 'text-emerald-300' : ''}>{d}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
