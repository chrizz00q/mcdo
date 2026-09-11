import { useEffect, useRef } from 'react';
import type { ReminderSettings } from '../types';

export function useDailyReminder(reminder: ReminderSettings, appName: string) {
  const lastFiredRef = useRef<string | null>(null);

  useEffect(() => {
    if (!reminder.enabled) return;

    const check = () => {
      const now = new Date();
      const hhmm = now.toTimeString().slice(0, 5);
      const today = now.toDateString();
      const fireKey = `${today} ${hhmm}`;

      if (hhmm === reminder.time && lastFiredRef.current !== fireKey) {
        lastFiredRef.current = fireKey;
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(`${appName} reminder`, {
            body: "Don't forget to log today's work hours.",
          });
        }
      }
    };

    const interval = setInterval(check, 20_000);
    check();
    return () => clearInterval(interval);
  }, [reminder.enabled, reminder.time, appName]);
}
