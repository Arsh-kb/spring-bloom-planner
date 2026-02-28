import { useRef } from 'react';
import { usePlanner } from '@/context/PlannerContext';

export function VaultModal({ onClose }: { onClose: () => void }) {
  const { tasks, journal, restoreData, defaultPomodoro, setDefaultPomodoro } = usePlanner();
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        if (json.tasks && json.journal) {
          restoreData(json.tasks, json.journal);
          alert('✨ Planner data restored beautifully from the vault!');
          onClose();
        } else {
          alert('This JSON file does not contain valid Springscape data.');
        }
      } catch (err) {
        alert('Failed to parse the backup file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-8">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-md" onClick={onClose} />

      {/* Glass Vault */}
      <div className="relative z-10 w-full max-w-md glass-panel rounded-xl p-6 text-left">
        <div className="flex items-center justify-between mb-6 border-b border-foreground/10 pb-4">
          <h2 className="font-display text-2xl text-foreground text-nature">The Vault</h2>
          <button onClick={onClose} className="text-foreground/60 hover:text-foreground text-xl">×</button>
        </div>

        <div className="space-y-6">
          {/* Data Backup Section */}
          <section>
            <h3 className="font-body text-sm text-foreground/80 mb-3 uppercase tracking-wider">Data & Backup</h3>
            <div className="flex gap-3">
              <button 
                onClick={handleExport}
                className="flex-1 glass-panel py-2 rounded-md text-xs font-body hover:bg-white/10 transition-colors"
              >
                📥 Export JSON Backup
              </button>
              
              <input 
                type="file" 
                accept=".json" 
                ref={fileInputRef} 
                onChange={handleImport} 
                className="hidden" 
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 glass-panel py-2 rounded-md text-xs font-body hover:bg-white/10 transition-colors text-primary"
              >
                📤 Restore Backup
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2 italic">
              Your data never leaves your device. Back it up before clearing browser cache.
            </p>
          </section>

          {/* Pomodoro Settings */}
          <section className="pt-4 border-t border-foreground/10">
            <h3 className="font-body text-sm text-foreground/80 mb-3 uppercase tracking-wider">Focus Timer</h3>
            <div className="flex items-center justify-between glass-panel p-3 rounded-md">
              <span className="text-xs font-body">Focus Duration (Minutes)</span>
              <input 
                type="number" 
                min="1" 
                max="120" 
                value={defaultPomodoro}
                onChange={(e) => setDefaultPomodoro(Number(e.target.value) || 25)}
                className="w-16 bg-black/20 border border-white/10 rounded px-2 py-1 text-xs text-center focus:outline-none focus:border-primary/50"
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}