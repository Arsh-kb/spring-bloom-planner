import type { FavoriteApp } from '@/context/FocusGateContext';

interface Props {
  app: FavoriteApp;
  locked: boolean;
  onRemove: () => void;
}

export function LockedAppCard({ app, locked, onRemove }: Props) {
  const content = (
    <div className={`relative aspect-square rounded-2xl border border-white/10 bg-black/30 backdrop-blur-md flex flex-col items-center justify-center gap-2 p-4 transition-all overflow-hidden ${
      locked ? 'grayscale opacity-60' : 'hover:scale-105 hover:border-primary/50 cursor-pointer'
    }`}>
      <span className="text-4xl drop-shadow-lg">{app.icon}</span>
      <span className="text-xs font-body text-foreground/80 text-center truncate w-full">{app.name}</span>
      {locked && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
          <span className="text-3xl drop-shadow-2xl">🔒</span>
        </div>
      )}
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRemove(); }}
        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/40 hover:bg-destructive/60 text-foreground/60 hover:text-foreground text-[10px] flex items-center justify-center transition-colors"
        title="Remove app"
      >
        ×
      </button>
    </div>
  );

  if (locked) return content;
  return <a href={app.url} target="_blank" rel="noreferrer">{content}</a>;
}
