import { useEffect, useMemo, useState } from 'react';
import { pickQuizQuestions, type Question } from '@/data/neetJeeQuestions';
import { Button } from '@/components/ui/button';

interface Props {
  open: boolean;
  onClose: () => void;
  onPass: () => void;
  onFail: () => void;
  perSubject?: number;
  passThreshold?: number; // out of total
  secondsPerQuestion?: number;
}

export function UnlockQuiz({
  open, onClose, onPass, onFail,
  perSubject = 5,
  passThreshold = 10,
  secondsPerQuestion = 60,
}: Props) {
  const questions = useMemo<Question[]>(() => (open ? pickQuizQuestions(perSubject) : []), [open, perSubject]);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(secondsPerQuestion);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!open) return;
    setIdx(0); setAnswers([]); setTimeLeft(secondsPerQuestion); setDone(false);
  }, [open, secondsPerQuestion]);

  useEffect(() => {
    if (!open || done) return;
    if (timeLeft <= 0) { advance(-1); return; }
    const t = setTimeout(() => setTimeLeft(s => s - 1), 1000);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, open, done]);

  if (!open) return null;
  const q = questions[idx];
  const total = questions.length;

  function advance(choice: number) {
    const next = [...answers, choice];
    setAnswers(next);
    if (idx + 1 >= total) {
      finish(next);
    } else {
      setIdx(idx + 1);
      setTimeLeft(secondsPerQuestion);
    }
  }

  function finish(final: number[]) {
    setDone(true);
    const score = final.reduce((acc, ans, i) => acc + (ans === questions[i].correctIndex ? 1 : 0), 0);
    setTimeout(() => {
      if (score >= passThreshold) onPass();
      else onFail();
    }, 2200);
  }

  const score = answers.reduce((acc, ans, i) => acc + (ans === questions[i]?.correctIndex ? 1 : 0), 0);

  return (
    <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-card border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        {!done ? (
          <>
            <div className="h-1.5 bg-black/40">
              <div className="h-full bg-primary transition-all" style={{ width: `${((idx + 1) / total) * 100}%` }} />
            </div>
            <div className="p-6 space-y-5">
              <div className="flex items-center justify-between text-xs font-body text-foreground/60">
                <span className="uppercase tracking-widest">{q.subject} · {q.exam}</span>
                <span>Q {idx + 1} / {total}</span>
                <span className={timeLeft <= 10 ? 'text-destructive font-semibold' : ''}>⏱ {timeLeft}s</span>
              </div>
              <h3 className="font-display text-xl text-foreground leading-snug">{q.question}</h3>
              <div className="space-y-2">
                {q.options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => advance(i)}
                    className="w-full text-left px-4 py-3 rounded-xl border border-white/10 bg-black/20 hover:bg-primary/10 hover:border-primary/40 transition-all font-body text-sm text-foreground/90"
                  >
                    <span className="text-foreground/40 mr-3">{String.fromCharCode(65 + i)}.</span>
                    {opt}
                  </button>
                ))}
              </div>
              <div className="flex justify-between items-center pt-2">
                <button onClick={onClose} className="text-xs text-foreground/40 hover:text-foreground/70">Abandon quiz</button>
                <span className="text-xs text-foreground/40">Score so far: {score}</span>
              </div>
            </div>
          </>
        ) : (
          <div className="p-10 text-center space-y-4">
            <div className="text-6xl">{score >= passThreshold ? '🎉' : '💔'}</div>
            <h2 className="font-display text-3xl text-foreground">
              {score >= passThreshold ? 'Apps Unlocked!' : 'Not quite.'}
            </h2>
            <p className="text-foreground/70">
              You scored <span className="text-primary font-semibold">{score} / {total}</span>
              {' '}(need {passThreshold} to pass)
            </p>
            <p className="text-xs text-foreground/40">
              {score >= passThreshold ? 'Unlocked until midnight.' : 'Take a 2-minute cooldown, then try again.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
