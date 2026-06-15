import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onAdd: (app: { name: string; url: string; icon: string }) => void;
}

const EMOJIS = ['📱', '📸', '▶️', '💬', '🐦', '🎮', '🎵', '📺', '🛒', '🌐', '📰', '🎬'];

export function AddAppDialog({ open, onOpenChange, onAdd }: Props) {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [icon, setIcon] = useState('📱');

  const submit = () => {
    if (!name.trim()) return;
    const finalUrl = url.trim() || '#';
    onAdd({ name: name.trim(), url: finalUrl.startsWith('http') ? finalUrl : `https://${finalUrl}`, icon });
    setName(''); setUrl(''); setIcon('📱');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add a favorite app to lock</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-foreground/60 mb-1 block">App name</label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Instagram" />
          </div>
          <div>
            <label className="text-xs text-foreground/60 mb-1 block">URL (optional)</label>
            <Input value={url} onChange={e => setUrl(e.target.value)} placeholder="instagram.com" />
          </div>
          <div>
            <label className="text-xs text-foreground/60 mb-2 block">Icon</label>
            <div className="grid grid-cols-6 gap-2">
              {EMOJIS.map(e => (
                <button
                  key={e}
                  onClick={() => setIcon(e)}
                  className={`text-2xl p-2 rounded-lg border transition-all ${icon === e ? 'border-primary bg-primary/10' : 'border-white/10 hover:border-white/30'}`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
          <Button onClick={submit} className="w-full">Add App</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
