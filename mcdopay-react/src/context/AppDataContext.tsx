import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';
import type { AppSettings, DayEntry, EntryMap } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { STORAGE_KEYS, clearAllStorage } from '../utils/storage';

const DEFAULT_SETTINGS: AppSettings = {
  appName: 'Mcdopay',
  hourlyRate: 65,
  theme: 'dark',
  reminder: { enabled: false, time: '20:00' },
};

interface AppDataContextValue {
  entries: EntryMap;
  saveEntry: (entry: DayEntry) => void;
  removeEntry: (dateKey: string) => void;
  settings: AppSettings;
  updateSettings: (updater: Partial<AppSettings> | ((prev: AppSettings) => AppSettings)) => void;
  resetAllData: () => void;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useLocalStorage<EntryMap>(STORAGE_KEYS.entries, {});
  const [settings, setSettings] = useLocalStorage<AppSettings>(STORAGE_KEYS.settings, DEFAULT_SETTINGS);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme);
  }, [settings.theme]);

  useEffect(() => {
    document.title = `${settings.appName} — Work Hours & Salary Tracker`;
  }, [settings.appName]);

  const saveEntry = (entry: DayEntry) => {
    setEntries((prev) => ({ ...prev, [entry.date]: entry }));
  };

  const removeEntry = (key: string) => {
    setEntries((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const updateSettings = (
    updater: Partial<AppSettings> | ((prev: AppSettings) => AppSettings),
  ) => {
    setSettings((prev) =>
      typeof updater === 'function' ? updater(prev) : { ...prev, ...updater },
    );
  };

  const resetAllData = () => {
    clearAllStorage();
    setEntries({});
    setSettings(DEFAULT_SETTINGS);
  };

  const value = useMemo(
    () => ({ entries, saveEntry, removeEntry, settings, updateSettings, resetAllData }),
    [entries, settings],
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData must be used within AppDataProvider');
  return ctx;
}
