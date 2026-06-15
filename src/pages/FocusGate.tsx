import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { usePlanner } from '@/context/PlannerContext';
import { useFocusGate } from '@/context/FocusGateContext';
import { LockedAppCard } from '@/components/focusGate/LockedAppCard';
import { AddAppDialog } from '@/components/focusGate/AddAppDialog';
import { UnlockQuiz } from '@/components/focusGate/UnlockQuiz';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

function formatMs(ms: number) {
  const s = Math.ceil(ms / 1000);
  const m = Math.floor(s / 60); const r = s % 60;
  return `${m}:${String(r).padStart(2, '0')}`;
}

export default function FocusGate() {
  const { tasks, todayDayId } = usePlanner();
  const { state, isUnlocked, cooldownRemainingMs, addApp, removeApp, markUnlocked, markFailed, forceRelock } = useFocusGate();

  const [showAdd, setShowAdd] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [, force] = useState(0);

  // re-render every second to update cooldown / unlock countdown
  useEffect(() => {
    const i = setInterval(() => force(x => x + 1), 1000);
    return () => clearInterval(i);
  }, []);

  const todayTasks = tasks.filter(t => t.date === todayDayId);
  const completed = todayTasks.filter(t => t.completed).length;
  const total = todayTasks.length;
  const allDone = total > 0 && completed === total;
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);

  const onCooldown = cooldownRemainingMs > 0;
  const canStartQuiz = allDone && !onCooldown && !isUnlocked;

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#0a0e1a] via-[#0f1424] to-[#1a1428] text-foreground">
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-sm text-foreground/60 hover:text-foreground">← Back to planner</Link>
        </div>
        <h1 className="font-display text-xl tracking-wide">🔒 Focus Gate</h1>
        <div className="text-xs text-foreground/50">
          Unlocks: {state.totalUnlocks} · Fails: {state.totalFails}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Status banner */}
        <div className={`rounded-2xl border p-6 ${isUnlocked ? 'border-emerald-400/30 bg-emerald-400/5' : 'border-amber-400/30 bg-amber-400/5'}`}>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-2xl font-display">
                {isUnlocked ? '✨ Apps unlocked' : '🔒 Apps locked'}
              </p>
              <p className="text-sm text-foreground/60 mt-1">
                {isUnlocked
                  ? `Free until midnight. Stay mindful.`
                  : 'Finish today\'s tasks, then pass the NEET/JEE assessment to unlock.'}
              </p>
            </div>
            {isUnlocked && (
              <Button variant="outline" size="sm" onClick={forceRelock}>Re-lock now</Button>
            )}
          </div>
        </div>

        {/* Today's progress */}
        <section className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg">Today's checklist</h2>
            <span className="text-sm text-foreground/70">{completed} / {total} done</span>
          </div>
          <Progress value={pct} className="h-2" />
          {total === 0 && (
            <p className="text-xs text-foreground/50 mt-3">No tasks for today yet — add some on the planner first.</p>
          )}
          {total > 0 && !allDone && (
            <ul className="mt-4 space-y-1 max-h-40 overflow-y-auto text-sm">
              {todayTasks.filter(t => !t.completed).map(t => (
                <li key={t.id} className="text-foreground/70 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> {t.title}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Apps grid */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg">Locked Apps</h2>
            <Button size="sm" variant="outline" onClick={() => setShowAdd(true)}>+ Add app</Button>
          </div>
          {state.apps.length === 0 ? (
            <p className="text-sm text-foreground/50 py-8 text-center border border-dashed border-white/10 rounded-xl">
              No apps added yet. Add the ones you want to gate behind your tasks.
            </p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {state.apps.map(app => (
                <LockedAppCard key={app.id} app={app} locked={!isUnlocked} onRemove={() => removeApp(app.id)} />
              ))}
            </div>
          )}
        </section>

        {/* Unlock CTA */}
        <section className="rounded-2xl border border-primary/20 bg-primary/5 p-6 text-center space-y-3">
          <h3 className="font-display text-lg">Unlock Assessment</h3>
          <p className="text-sm text-foreground/60">
            15 questions · 5 Physics + 5 Chemistry + 5 Biology · 60s per question · pass with 10/15
          </p>
          {isUnlocked ? (
            <p className="text-sm text-emerald-300">Already unlocked. Enjoy responsibly.</p>
          ) : onCooldown ? (
            <p className="text-sm text-amber-300">Cooldown: {formatMs(cooldownRemainingMs)} remaining</p>
          ) : !allDone ? (
            <p className="text-sm text-foreground/50">Complete all of today's tasks first ({completed}/{total}).</p>
          ) : null}
          <Button
            size="lg"
            disabled={!canStartQuiz}
            onClick={() => setShowQuiz(true)}
            className="mt-2"
          >
            Start Unlock Assessment
          </Button>
        </section>

        <p className="text-[10px] text-center text-foreground/30 pb-6">
          Honor-system blocker. This is a browser app — it can't disable native phone apps.
        </p>
      </main>

      <AddAppDialog open={showAdd} onOpenChange={setShowAdd} onAdd={addApp} />
      <UnlockQuiz
        open={showQuiz}
        onClose={() => setShowQuiz(false)}
        onPass={() => { setShowQuiz(false); markUnlocked(); }}
        onFail={() => { setShowQuiz(false); markFailed(); }}
      />
    </div>
  );
}
