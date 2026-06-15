import React, { createContext, useContext, useCallback, useMemo } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';

export interface FavoriteApp {
  id: string;
  name: string;
  url: string;
  icon: string; // emoji
}

interface GateState {
  apps: FavoriteApp[];
  unlockedUntil: string | null;
  lastFailedAt: string | null;
  totalUnlocks: number;
  totalFails: number;
}

const DEFAULT_APPS: FavoriteApp[] = [
  { id: 'a1', name: 'Instagram', url: 'https://instagram.com', icon: '📸' },
  { id: 'a2', name: 'YouTube', url: 'https://youtube.com', icon: '▶️' },
  { id: 'a3', name: 'WhatsApp', url: 'https://web.whatsapp.com', icon: '💬' },
  { id: 'a4', name: 'Twitter / X', url: 'https://x.com', icon: '🐦' },
];

const DEFAULT_STATE: GateState = {
  apps: DEFAULT_APPS,
  unlockedUntil: null,
  lastFailedAt: null,
  totalUnlocks: 0,
  totalFails: 0,
};

export const COOLDOWN_MS = 2 * 60 * 1000; // 2 minutes

interface Ctx {
  state: GateState;
  isUnlocked: boolean;
  cooldownRemainingMs: number;
  addApp: (app: Omit<FavoriteApp, 'id'>) => void;
  removeApp: (id: string) => void;
  markUnlocked: () => void;
  markFailed: () => void;
  forceRelock: () => void;
}

const FocusGateContext = createContext<Ctx | null>(null);

export function FocusGateProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useLocalStorage<GateState>('springscape-focus-gate', DEFAULT_STATE);

  const isUnlocked = useMemo(() => {
    if (!state.unlockedUntil) return false;
    return new Date(state.unlockedUntil).getTime() > Date.now();
  }, [state.unlockedUntil]);

  const cooldownRemainingMs = useMemo(() => {
    if (!state.lastFailedAt) return 0;
    const elapsed = Date.now() - new Date(state.lastFailedAt).getTime();
    return Math.max(0, COOLDOWN_MS - elapsed);
  }, [state.lastFailedAt]);

  const addApp = useCallback((app: Omit<FavoriteApp, 'id'>) => {
    setState(prev => ({ ...prev, apps: [...prev.apps, { ...app, id: `a${Date.now()}` }] }));
  }, [setState]);

  const removeApp = useCallback((id: string) => {
    setState(prev => ({ ...prev, apps: prev.apps.filter(a => a.id !== id) }));
  }, [setState]);

  const markUnlocked = useCallback(() => {
    const midnight = new Date();
    midnight.setHours(23, 59, 59, 999);
    setState(prev => ({
      ...prev,
      unlockedUntil: midnight.toISOString(),
      lastFailedAt: null,
      totalUnlocks: prev.totalUnlocks + 1,
    }));
  }, [setState]);

  const markFailed = useCallback(() => {
    setState(prev => ({ ...prev, lastFailedAt: new Date().toISOString(), totalFails: prev.totalFails + 1 }));
  }, [setState]);

  const forceRelock = useCallback(() => {
    setState(prev => ({ ...prev, unlockedUntil: null }));
  }, [setState]);

  return (
    <FocusGateContext.Provider value={{ state, isUnlocked, cooldownRemainingMs, addApp, removeApp, markUnlocked, markFailed, forceRelock }}>
      {children}
    </FocusGateContext.Provider>
  );
}

export function useFocusGate() {
  const ctx = useContext(FocusGateContext);
  if (!ctx) throw new Error('useFocusGate must be used within FocusGateProvider');
  return ctx;
}
