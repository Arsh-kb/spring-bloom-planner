import { useEffect, useState, useCallback } from 'react';
import { usePlanner } from '@/context/PlannerContext';

export function useKeyboardShortcuts(
  onOpenJournal: () => void,
  onOpenDeepFocus: () => void,
) {
  const { setMode, toggleZenMode, setWeekOffset } = usePlanner();
  const [showCheatSheet, setShowCheatSheet] = useState(false);

  const handler = useCallback((e: KeyboardEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;

    switch (e.key.toLowerCase()) {
      case 'j': onOpenJournal(); break;
      case 'z': toggleZenMode(); break;
      case 'd': onOpenDeepFocus(); break;
      case '1': setMode('sun'); break;
      case '2': setMode('shade'); break;
      case '3': setMode('cave'); break;
      case '4': setMode('exam'); break;
      case 'arrowleft': setWeekOffset(w => w - 1); break;
      case 'arrowright': setWeekOffset(w => w + 1); break;
      case '?': e.preventDefault(); setShowCheatSheet(prev => !prev); break;
    }
  }, [onOpenJournal, onOpenDeepFocus, toggleZenMode, setMode, setWeekOffset]);

  useEffect(() => {
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handler]);

  return { showCheatSheet, setShowCheatSheet };
}

const shortcuts = [
  { key: 'J', desc: 'Open Journal' },
  { key: 'Z', desc: 'Toggle Zen Mode' },
  { key: 'D', desc: 'Deep Focus' },
  { key: '1-4', desc: 'Switch Lighting' },
  { key: '← →', desc: 'Navigate Weeks' },
  { key: '?', desc: 'Toggle this sheet' },
];

export function KeyboardCheatSheet({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative z-10 glass-panel rounded-2xl p-6 max-w-xs w-full space-y-3"
        style={{ boxShadow: '0 16px 48px rgba(0,0,0,0.5)' }}
        onClick={e => e.stopPropagation()}
      >
        <h3 className="font-display text-sm text-foreground/80 text-nature">Keyboard Shortcuts</h3>
        <div className="space-y-2">
          {shortcuts.map(s => (
            <div key={s.key} className="flex items-center justify-between">
              <span className="text-xs font-body text-foreground/60">{s.desc}</span>
              <kbd className="bg-black/20 border border-foreground/10 rounded px-2 py-0.5 text-[10px] font-body text-foreground/80 shadow-inner">{s.key}</kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}