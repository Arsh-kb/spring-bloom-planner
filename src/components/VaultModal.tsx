import { useRef, useState } from 'react';
import { usePlanner } from '@/context/PlannerContext';
import { Slider } from '@/components/ui/slider';
import { TaskTemplates } from './TaskTemplates';

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
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative z-10 w-full max-w-4xl glass-panel rounded-2xl p-8 text-left max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between mb-6 border-b border-foreground/10 pb-4 flex-shrink-0">
          <h2 className="font-display text-3xl text-foreground/95 text-nature drop-shadow-md">The Vault</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-black/20 text-foreground/60 hover:text-foreground hover:bg-black/40 transition-colors text-xl shadow-inner border border-white/5">×</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 flex-1 overflow-y-auto scrollbar-thin pr-1">
          {/* LEFT COLUMN */}
          <div className="space-y-8 flex flex-col">
            {/* Atmosphere */}
            <section>
              <h3 className="font-body text-xs text-foreground/50 mb-4 uppercase tracking-widest" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>Atmosphere</h3>
              <div className="space-y-6 bg-black/10 border border-white/5 p-5 rounded-xl shadow-inner">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-xs font-body text-foreground/70" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>Warmth</span>
                    <span className="text-xs font-body text-foreground/50">{moodTint.warmth > 0 ? '+' : ''}{moodTint.warmth}</span>
                  </div>
                  <Slider value={[moodTint.warmth]} min={-50} max={50} step={1} onValueChange={([v]) => setMoodTint({ ...moodTint, warmth: v })} className="vault-slider" />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-xs font-body text-foreground/70" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>Contrast</span>
                    <span className="text-xs font-body text-foreground/50">{moodTint.contrast > 0 ? '+' : ''}{moodTint.contrast}</span>
                  </div>
                  <Slider value={[moodTint.contrast]} min={-30} max={30} step={1} onValueChange={([v]) => setMoodTint({ ...moodTint, contrast: v })} className="vault-slider" />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-xs font-body text-foreground/70" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>Depth</span>
                    <span className="text-xs font-body text-foreground/50">{moodTint.depth}%</span>
                  </div>
                  <Slider value={[moodTint.depth]} min={0} max={100} step={1} onValueChange={([v]) => setMoodTint({ ...moodTint, depth: v })} className="vault-slider" />
                </div>
              </div>
            </section>

            {/* Pomodoro */}
            <section>
              <h3 className="font-body text-xs text-foreground/50 mb-3 uppercase tracking-widest" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>Focus Timer</h3>
              <div className="flex items-center justify-between bg-black/10 border border-white/5 p-4 rounded-xl shadow-inner">
                <span className="text-sm font-body text-foreground/90" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>Duration (min)</span>
                <input 
                  type="number" min="1" max="120" 
                  value={defaultPomodoro} 
                  onChange={(e) => setDefaultPomodoro(Number(e.target.value) || 25)} 
                  className="w-16 bg-black/30 border border-white/10 rounded-md px-2 py-1.5 text-sm text-center text-foreground/90 focus:outline-none focus:border-primary/50 shadow-inner transition-colors" 
                />
              </div>
            </section>

            {/* Templates */}
            <TaskTemplates />
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-8 flex flex-col">
            {/* Data Backup */}
            <section className="flex-shrink-0">
              <h3 className="font-body text-xs text-foreground/50 mb-3 uppercase tracking-widest" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>Data & Backup</h3>
              <div className="flex gap-3">
                <button onClick={handleExport} className="flex-1 bg-black/20 border border-white/10 shadow-inner py-2.5 rounded-lg text-xs font-body hover:bg-black/40 hover:border-white/20 transition-all text-foreground/90">📥 Export JSON</button>
                <input type="file" accept=".json" ref={fileInputRef} onChange={handleImport} className="hidden" />
                <button onClick={() => fileInputRef.current?.click()} className="flex-1 bg-primary/10 border border-primary/20 shadow-inner py-2.5 rounded-lg text-xs font-body hover:bg-primary/20 hover:border-primary/30 transition-all text-primary/90">📤 Restore</button>
              </div>
              <p className="text-[11px] text-foreground/40 mt-3 italic" style={{ textShadow: '0 1px 1px rgba(0,0,0,0.4)' }}>Your data never leaves your device.</p>
            </section>

            {/* Time Capsules */}
            {capsuleKeys.length > 0 && (
              <section className="flex flex-col flex-1 overflow-hidden min-h-[150px]">
                <h3 className="font-body text-xs text-foreground/50 mb-4 uppercase tracking-widest flex-shrink-0" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>Time Capsules</h3>
                <div className="space-y-3 overflow-y-auto scrollbar-thin pr-2 pb-2">
                  {capsuleKeys.map(key => {
                    const c = capsules[key];
                    const { range, label } = formatCapsuleDate(key);
                    return (
                      <div key={key} className="bg-black/20 border border-white/5 shadow-inner p-4 rounded-xl hover:bg-black/30 transition-colors">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-body text-foreground/90" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>{range}</p>
                            <p className="text-[11px] text-foreground/40 mt-0.5">{label} · {c.tasks.length} tasks · {c.journal.length} entries</p>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => handleCapsuleExport(key)} className="text-[11px] font-body text-foreground/50 hover:text-foreground/90 transition-colors bg-white/5 px-2 py-1 rounded">Export</button>
                            {confirmRestore === key ? (
                              <button onClick={() => handleCapsuleRestore(key)} className="text-[11px] font-body text-destructive hover:text-destructive/80 transition-colors bg-destructive/10 px-2 py-1 rounded">Confirm?</button>
                            ) : (
                              <button onClick={() => setConfirmRestore(key)} className="text-[11px] font-body text-primary/70 hover:text-primary transition-colors bg-primary/10 px-2 py-1 rounded">Restore</button>
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
    </div>
  );
}
