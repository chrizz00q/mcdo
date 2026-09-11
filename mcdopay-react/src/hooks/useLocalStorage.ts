import { useCallback, useState } from 'react';
import { readStorage, writeStorage } from '../utils/storage';

export function useLocalStorage<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(() => readStorage<T>(key, fallback));

  const update = useCallback(
    (updater: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const next =
          typeof updater === 'function' ? (updater as (prev: T) => T)(prev) : updater;
        writeStorage(key, next);
        return next;
      });
    },
    [key],
  );

  return [value, update] as const;
}
