import { useEffect, useState } from 'react';
import { getTodayISO } from '../utils/mathAndFormat';

/**
 * Keeps the current local date in sync so date inputs roll over automatically
 * after midnight, and on tab focus / visibility changes.
 */
export function useTodayISO(): string {
  const [today, setToday] = useState<string>(() => getTodayISO());

  useEffect(() => {
    const check = () => {
      const next = getTodayISO();
      setToday((prev) => (prev === next ? prev : next));
    };

    const interval = window.setInterval(check, 30_000);
    window.addEventListener('focus', check);
    document.addEventListener('visibilitychange', check);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', check);
      document.removeEventListener('visibilitychange', check);
    };
  }, []);

  return today;
}
