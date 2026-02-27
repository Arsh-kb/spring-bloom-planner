import { useState, useEffect } from 'react';
import sparrow from '@/assets/sparrow.jpg';

export function NatureGuest() {
  const [visible, setVisible] = useState(false);
  const [key, setKey] = useState(0);

  useEffect(() => {
    const scheduleVisit = () => {
      const delay = 30000 + Math.random() * 15000; // 30-45s
      const timeout = setTimeout(() => {
        setKey(k => k + 1);
        setVisible(true);
        // Auto-hide after 10s
        setTimeout(() => {
          setVisible(false);
        }, 10000);
        scheduleVisit();
      }, delay);
      return timeout;
    };

    // First visit after 8-15s
    const firstTimeout = setTimeout(() => {
      setKey(k => k + 1);
      setVisible(true);
      setTimeout(() => setVisible(false), 10000);
    }, 8000 + Math.random() * 7000);

    const recurringTimeout = scheduleVisit();

    return () => {
      clearTimeout(firstTimeout);
      clearTimeout(recurringTimeout);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      key={key}
      className="fixed bottom-6 right-6 z-30 animate-guest-visit pointer-events-none"
    >
      <div className="w-20 h-20 rounded-full overflow-hidden" style={{ boxShadow: 'var(--guest-shadow)' }}>
        <img src={sparrow} alt="A visiting sparrow" className="w-full h-full object-cover" />
      </div>
    </div>
  );
}
