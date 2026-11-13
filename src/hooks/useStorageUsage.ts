import { useCallback, useEffect, useState } from 'react';

export interface StorageUsage {
  usedBytes: number;
  quotaBytes: number | null;
  percent: number;
  persisted: boolean | null;
}

function byteLength(value: string): number {
  return new Blob([value]).size;
}

export function useStorageUsage(deps: unknown = null): StorageUsage & { refresh: () => void } {
  const [usage, setUsage] = useState<StorageUsage>({
    usedBytes: 0,
    quotaBytes: null,
    percent: 0,
    persisted: null,
  });

  const read = useCallback(async () => {
    let used = 0;
    try {
      for (let i = 0; i < window.localStorage.length; i += 1) {
        const key = window.localStorage.key(i);
        if (!key) continue;
        used += byteLength(key) + byteLength(window.localStorage.getItem(key) ?? '');
      }
    } catch {
      // ignore
    }

    let quota: number | null = null;
    let persisted: boolean | null = null;

    try {
      if (navigator.storage?.estimate) {
        const estimate = await navigator.storage.estimate();
        quota = estimate.quota ?? null;
        if (!used && estimate.usage) used = estimate.usage;
      }
      if (navigator.storage?.persisted) persisted = await navigator.storage.persisted();
    } catch {
      // ignore
    }

    setUsage({
      usedBytes: used,
      quotaBytes: quota,
      percent: quota ? Math.min(100, (used / quota) * 100) : 0,
      persisted,
    });
  }, []);

  useEffect(() => {
    void read();
  }, [read, deps]);

  return { ...usage, refresh: read };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
