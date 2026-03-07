import { useState } from 'react';
import { usePlanner } from '@/context/PlannerContext';
import { generateSuggestions, getQuickPrompts } from '@/lib/aiPlanner';
import type { TaskMood } from '@/types/planner';

const moodDots: Record<string, string> = {
  routine: 'hsla(38, 15%, 55%, 0.6)',
  reflective: 'hsla(215, 40%, 60%, 0.9)',
  'high-strain': 'hsla(15, 75%, 55%, 0.9)',
  energizing: 'hsla(80, 55%, 50%, 0.9)',
};

const priorityEmoji: Record<string, string> = { high: '🍒', medium: '🌿', low: '🍂' };
const timeBlockEmoji: Record<string, string> = { morning: '🌅', afternoon: '☀️', evening: '🌙' };

interface AIPlannerPanelProps {
  open: boolean;
  onClose: () => void;
}

export function AIPlannerPanel({ open, onClose }: AIPlannerPanelProps) {
  const { mode, days, addTask, tasks } = usePlanner();
  const [prompt, setPrompt] = useState('');
  const [targetDayIdx, setTargetDayIdx] = useState(0);
  const [suggestions, setSuggestions] = useState<ReturnType<typeof generateSuggestions>>([]);
  const [accepted, setAccepted] = useState<Set<number>>(new Set());
  const [generating, setGenerating] = useState(false);

  const quickPrompts = getQuickPrompts(mode);

  const handleGenerate = (text?: string) => {
    const input = text || prompt;
    if (!input.trim()) return;
    setGenerating(true);
    setAccepted(new Set());
    // Simulate brief "thinking" delay
    setTimeout(() => {
      const existingForDay = tasks.filter(t => t.date === days[targetDayIdx]?.id);
      const results = generateSuggestions(input, mode, targetDayIdx, existingForDay, 5);
      setSuggestions(results);
      setGenerating(false);
    }, 400 + Math.random() * 300);
  };

  const handleAccept = (idx: number) => {
    const s = suggestions[idx];
    if (!s || accepted.has(idx)) return;
    const day = days[s.dayIndex];
    if (!day) return;
    addTask(day.id, s.title, s.priority, s.mood, s.timeBlock, null);
    setAccepted(prev => new Set(prev).add(idx));
  };

  const handleAcceptAll = () => {
    suggestions.forEach((s, i) => {
      if (accepted.has(i)) return;
      const day = days[s.dayIndex];
      if (!day) return;
      addTask(day.id, s.title, s.priority, s.mood, s.timeBlock, null);
    });
    setAccepted(new Set(suggestions.map((_, i) => i)));
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative glass-panel bg-black/70 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl w-[90vw] max-w-lg max-h-[80vh] overflow-hidden flex flex-col animate-scale-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-3 border-b border-foreground/10">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg text-foreground flex items-center gap-2">
              <span className="text-xl">🤖</span> AI Planner
            </h2>
            <button onClick={onClose} className="text-foreground/50 hover:text-foreground text-sm transition-colors">✕</button>
          </div>

          {/* Day selector */}
          <div className="flex gap-1 mb-3 overflow-x-auto pb-1">
            {days.map((day, i) => (
              <button
                key={day.id}
                onClick={() => setTargetDayIdx(i)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-body whitespace-nowrap transition-all ${
                  i === targetDayIdx
                    ? 'bg-primary/20 text-foreground ring-1 ring-primary/40'
                    : 'text-foreground/50 hover:text-foreground/70 hover:bg-white/5'
                }`}
              >
                {day.short}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleGenerate()}
              placeholder="Describe your goal... e.g. 'productive morning'"
              className="flex-1 bg-white/5 border border-foreground/15 rounded-lg px-3 py-2 text-xs font-body text-foreground placeholder:text-foreground/30 outline-none focus:border-primary/40 transition-colors"
            />
            <button
              onClick={() => handleGenerate()}
              disabled={generating || !prompt.trim()}
              className="px-4 py-2 rounded-lg text-xs font-body bg-primary/20 text-foreground hover:bg-primary/30 transition-colors disabled:opacity-40 border border-primary/20"
            >
              {generating ? '✦' : 'Plan'}
            </button>
          </div>

          {/* Quick prompts */}
          <div className="flex gap-1.5 mt-2 flex-wrap">
            {quickPrompts.map(qp => (
              <button
                key={qp}
                onClick={() => { setPrompt(qp); handleGenerate(qp); }}
                className="text-[10px] font-body text-foreground/40 hover:text-foreground/70 bg-white/5 hover:bg-white/10 px-2 py-0.5 rounded-full transition-colors"
              >
                {qp}
              </button>
            ))}
          </div>
        </div>

        {/* Suggestions */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2">
          {generating && (
            <div className="flex items-center justify-center py-8">
              <span className="text-foreground/40 text-xs font-body animate-pulse">Thinking...</span>
            </div>
          )}

          {!generating && suggestions.length === 0 && (
            <p className="text-foreground/30 text-xs font-body text-center py-8 italic">
              Type a goal or pick a quick prompt to generate task suggestions
            </p>
          )}

          {!generating && suggestions.map((s, i) => (
            <div
              key={i}
              className={`flex items-start gap-3 p-3 rounded-xl transition-all ${
                accepted.has(i)
                  ? 'bg-primary/10 border border-primary/20 opacity-60'
                  : 'bg-white/5 border border-foreground/10 hover:border-foreground/20'
              }`}
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs font-body text-foreground leading-snug">{s.title}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[11px]">{priorityEmoji[s.priority]}</span>
                  {s.mood && (
                    <span
                      className="w-[6px] h-[6px] rounded-full"
                      style={{ backgroundColor: moodDots[s.mood], boxShadow: `0 0 4px ${moodDots[s.mood]}` }}
                    />
                  )}
                  {s.timeBlock && <span className="text-[10px]">{timeBlockEmoji[s.timeBlock]}</span>}
                  <span className="text-[9px] font-body text-foreground/30">{days[s.dayIndex]?.short}</span>
                </div>
              </div>
              <button
                onClick={() => handleAccept(i)}
                disabled={accepted.has(i)}
                className={`flex-shrink-0 px-3 py-1 rounded-lg text-[10px] font-body transition-all ${
                  accepted.has(i)
                    ? 'text-primary/50 bg-primary/5'
                    : 'text-foreground/70 bg-white/10 hover:bg-primary/20 hover:text-foreground'
                }`}
              >
                {accepted.has(i) ? '✓ Added' : 'Accept'}
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        {!generating && suggestions.length > 0 && accepted.size < suggestions.length && (
          <div className="px-5 py-3 border-t border-foreground/10">
            <button
              onClick={handleAcceptAll}
              className="w-full py-2 rounded-lg text-xs font-body bg-primary/15 text-foreground/80 hover:bg-primary/25 hover:text-foreground transition-colors border border-primary/15"
            >
              Accept All ({suggestions.length - accepted.size} remaining)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
