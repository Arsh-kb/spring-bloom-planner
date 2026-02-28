import { useRef, useState } from 'react';
import { usePlanner } from '@/context/PlannerContext';
import { Slider } from '@/components/ui/slider';

export function VaultModal({ onClose }: { onClose: () => void }) {
  const { tasks, journal, restoreData, defaultPomodoro, setDefaultPomodoro, moodTint, setMoodTint, capsules } = usePlanner();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [confirmRestore, setConfirmRestore] = useState<string | null>(null);

  const handleExport = () => {
    const data = { tasks, journal };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `springscape-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (json.tasks && json.journal) { restoreData(json.tasks, json.journal); onClose(); }
        else alert('Invalid Springscape data.');
      } catch { alert('Failed to parse backup.'); }
    };
    reader.readAsText(file);
  };

  const handleCapsuleRestore = (key: string) => {
    const capsule = capsules[key];
    if (!capsule) return;
    restoreData(capsule.tasks, capsule.journal);
    setConfirmRestore(null);
  };

  const handleCapsuleExport = (key: string) => {
    const capsule = capsules[key];
    if (!capsule) return;
    const blob = new Blob([JSON.stringify(capsule, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `springscape-capsule-${key}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const capsuleKeys = Object.keys(capsules).sort().reverse();

  const formatCapsuleDate = (mondayStr: string) => {
    const monday = new Date(mondayStr);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const weeksAgo = Math.round((Date.now() - monday.getTime()) / (7 * 86400000));
    const label = weeksAgo === 1 ? '1 week ago' : `${weeksAgo} weeks ago`;
    return { range: `${fmt(monday)} — ${fmt(sunday)}`, label };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-8">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-md" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md glass-panel rounded-xl p-6 text-left max-h-[85vh] overflow-y-auto scrollbar-thin">
        <div className="flex items-center justify-between mb-6 border-b border-foreground/10 pb-4">
          <h2 className="font-display text-2xl text-foreground text-nature">The Vault</h2>
          <button onClick={onClose} className="text-foreground/60 hover:text-foreground text-xl">×</button>
        </div>

        <div className="space-y-6">
          {/* Data Backup */}
          <section>
            <h3 className="font-body text-sm text-foreground/80 mb-3 uppercase tracking-wider">Data & Backup</h3>
            <div className="flex gap-3">
              <button onClick={handleExport} className="flex-1 glass-panel py-2 rounded-md text-xs font-body hover:bg-white/10 transition-colors">📥 Export JSON</button>
              <input type="file" accept=".json" ref={fileInputRef} onChange={handleImport} className="hidden" />
              <button onClick={() => fileInputRef.current?.click()} className="flex-1 glass-panel py-2 rounded-md text-xs font-body hover:bg-white/10 transition-colors text-primary">📤 Restore</button>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2 italic">Your data never leaves your device.</p>
          </section>

          {/* Pomodoro */}
          <section className="pt-4 border-t border-foreground/10">
            <h3 className="font-body text-sm text-foreground/80 mb-3 uppercase tracking-wider">Focus Timer</h3>
            <div className="flex items-center justify-between glass-panel p-3 rounded-md">
              <span className="text-xs font-body">Duration (min)</span>
              <input type="number" min="1" max="120" value={defaultPomodoro} onChange={(e) => setDefaultPomodoro(Number(e.target.value) || 25)} className="w-16 bg-black/20 border border-white/10 rounded px-2 py-1 text-xs text-center focus:outline-none focus:border-primary/50" />
            </div>
          </section>

          {/* Atmosphere / Mood Tint */}
          <section className="pt-4 border-t border-foreground/10">
            <h3 className="font-body text-sm text-foreground/80 mb-3 uppercase tracking-wider">Atmosphere</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-[10px] font-body text-foreground/60">Warmth</span>
                  <span className="text-[10px] font-body text-foreground/40">{moodTint.warmth > 0 ? '+' : ''}{moodTint.warmth}</span>
                </div>
                <Slider value={[moodTint.warmth]} min={-50} max={50} step={1} onValueChange={([v]) => setMoodTint({ ...moodTint, warmth: v })} className="vault-slider" />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-[10px] font-body text-foreground/60">Contrast</span>
                  <span className="text-[10px] font-body text-foreground/40">{moodTint.contrast > 0 ? '+' : ''}{moodTint.contrast}</span>
                </div>
                <Slider value={[moodTint.contrast]} min={-30} max={30} step={1} onValueChange={([v]) => setMoodTint({ ...moodTint, contrast: v })} className="vault-slider" />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-[10px] font-body text-foreground/60">Depth</span>
                  <span className="text-[10px] font-body text-foreground/40">{moodTint.depth}%</span>
                </div>
                <Slider value={[moodTint.depth]} min={0} max={100} step={1} onValueChange={([v]) => setMoodTint({ ...moodTint, depth: v })} className="vault-slider" />
              </div>
            </div>
          </section>

          {/* Time Capsules */}
          {capsuleKeys.length > 0 && (
            <section className="pt-4 border-t border-foreground/10">
              <h3 className="font-body text-sm text-foreground/80 mb-3 uppercase tracking-wider">Time Capsules</h3>
              <div className="space-y-2">
                {capsuleKeys.map(key => {
                  const c = capsules[key];
                  const { range, label } = formatCapsuleDate(key);
                  return (
                    <div key={key} className="glass-panel p-3 rounded-md">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-body text-foreground/80">{range}</p>
                          <p className="text-[10px] text-muted-foreground">{label} · {c.tasks.length} tasks · {c.journal.length} entries</p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleCapsuleExport(key)} className="text-[10px] text-foreground/50 hover:text-foreground/80 transition-colors">Export</button>
                          {confirmRestore === key ? (
                            <button onClick={() => handleCapsuleRestore(key)} className="text-[10px] text-destructive hover:text-destructive/80 transition-colors">Confirm?</button>
                          ) : (
                            <button onClick={() => setConfirmRestore(key)} className="text-[10px] text-primary/60 hover:text-primary transition-colors">Restore</button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
