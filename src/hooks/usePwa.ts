import { useCallback, useState, useSyncExternalStore } from 'react';
import {
  InstallPlatform,
  InstallResult,
  applyPwaUpdate,
  dismissInstallBanner,
  dismissUpdateReady,
  getPwaSnapshot,
  isInstallBannerDismissed,
  manualInstallSteps,
  requestInstall,
  subscribePwa,
} from '../utils/pwaInstall';

export interface PwaState {
  installed: boolean;
  platform: InstallPlatform;
  /** The browser offers a one-tap install dialog (Chrome, Edge, Android, Samsung). */
  canNativePrompt: boolean;
  /** Show the floating install banner (native prompt available and not dismissed). */
  canInstall: boolean;
  updateReady: boolean;
  /** Opens the native install dialog; resolves with what happened. */
  install: () => Promise<InstallResult>;
  /** Set after `install()` returned 'manual': steps for this browser. */
  manualSteps: string | null;
  clearManualSteps: () => void;
  applyUpdate: () => void;
  dismissInstall: () => void;
  dismissUpdate: () => void;
}

/** Reads the shared PWA store (see utils/pwaInstall.ts). Every caller sees the same state. */
export function usePwa(): PwaState {
  const snap = useSyncExternalStore(subscribePwa, getPwaSnapshot, getPwaSnapshot);
  const [dismissed, setDismissed] = useState<boolean>(isInstallBannerDismissed);
  const [manualSteps, setManualSteps] = useState<string | null>(null);

  const install = useCallback(async (): Promise<InstallResult> => {
    const result = await requestInstall();
    setManualSteps(result === 'manual' ? manualInstallSteps(getPwaSnapshot().platform) : null);
    return result;
  }, []);

  const dismissInstall = useCallback(() => {
    dismissInstallBanner();
    setDismissed(true);
  }, []);

  return {
    installed: snap.installed,
    platform: snap.platform,
    canNativePrompt: Boolean(snap.prompt),
    canInstall: Boolean(snap.prompt) && !dismissed && !snap.installed,
    updateReady: snap.updateReady,
    install,
    manualSteps,
    clearManualSteps: () => setManualSteps(null),
    applyUpdate: applyPwaUpdate,
    dismissInstall,
    dismissUpdate: dismissUpdateReady,
  };
}
