import { useCallback, useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const INSTALL_DISMISSED_KEY = 'spends_data_install_dismissed';

export type InstallPlatform = 'prompt' | 'ios' | 'android' | 'desktop' | 'installed';

const detectPlatform = (): InstallPlatform => {
  if (typeof navigator === 'undefined') return 'desktop';
  const ua = navigator.userAgent || '';
  if (/iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && 'ontouchend' in document)) return 'ios';
  if (/Android/.test(ua)) return 'android';
  return 'desktop';
};

export interface PwaState {
  canInstall: boolean;
  installed: boolean;
  updateReady: boolean;
  /** True when the browser gave us a real install prompt we can fire. */
  canNativePrompt: boolean;
  platform: InstallPlatform;
  /** Always callable: fires the native prompt, else shows manual instructions. */
  install: () => Promise<void>;
  /** Set when the native prompt was unavailable and we must explain the manual steps. */
  manualSteps: string | null;
  clearManualSteps: () => void;
  applyUpdate: () => void;
  dismissInstall: () => void;
  dismissUpdate: () => void;
}

export function usePwa(): PwaState {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState<boolean>(false);
  const [updateReady, setUpdateReady] = useState(false);
  const [platform, setPlatform] = useState<InstallPlatform>('desktop');
  const [manualSteps, setManualSteps] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState<boolean>(() => {
    try {
      return window.localStorage.getItem(INSTALL_DISMISSED_KEY) === '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const standalone =
      window.matchMedia?.('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setInstalled(Boolean(standalone));
    setPlatform(standalone ? 'installed' : detectPlatform());

    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setPromptEvent(null);
    };
    const onUpdate = () => setUpdateReady(true);

    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    window.addEventListener('spends-data:update-ready', onUpdate);

    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
      window.removeEventListener('spends-data:update-ready', onUpdate);
    };
  }, []);

  // Register the service worker (production builds only, so dev HMR stays clean).
  useEffect(() => {
    if (!('serviceWorker' in navigator) || import.meta.env.DEV) return;

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register(
          `${import.meta.env.BASE_URL}sw.js`,
          { scope: import.meta.env.BASE_URL }
        );

        if (registration.waiting) setUpdateReady(true);

        registration.addEventListener('updatefound', () => {
          const next = registration.installing;
          if (!next) return;
          next.addEventListener('statechange', () => {
            if (next.state === 'installed' && navigator.serviceWorker.controller) {
              setUpdateReady(true);
            }
          });
        });

        // Check for a fresh deploy when the user comes back to the app.
        const check = () => registration.update().catch(() => undefined);
        window.addEventListener('focus', check);
        window.setInterval(check, 60 * 60 * 1000);
      } catch {
        // Offline support is a bonus — never block the app.
      }
    };

    const onControllerChange = () => window.location.reload();
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);
    void register();

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
    };
  }, []);

  const install = useCallback(async () => {
    if (promptEvent) {
      try {
        await promptEvent.prompt();
        const choice = await promptEvent.userChoice;
        if (choice.outcome === 'accepted') setInstalled(true);
      } catch {
        // fall through to the manual instructions below
      }
      setPromptEvent(null);
      return;
    }

    // No native prompt (iOS Safari, Firefox, in-app browsers, already-dismissed…):
    // never dead-end the tap — explain the exact steps for this browser.
    const steps =
      platform === 'ios'
        ? 'Tap the Share button in Safari, then “Add to Home Screen”.'
        : platform === 'android'
        ? 'Open the browser menu (⋮) and tap “Install app” or “Add to Home screen”.'
        : 'Click the install icon in the address bar, or open the browser menu and choose “Install”.';
    setManualSteps(steps);
  }, [promptEvent, platform]);

  const dismissInstall = useCallback(() => {
    setDismissed(true);
    try {
      window.localStorage.setItem(INSTALL_DISMISSED_KEY, '1');
    } catch {
      // ignore
    }
  }, []);

  const applyUpdate = useCallback(() => {
    navigator.serviceWorker?.getRegistration().then((registration) => {
      registration?.waiting?.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    });
  }, []);

  return {
    // Banner still only appears when the browser offered a real prompt.
    canInstall: Boolean(promptEvent) && !dismissed,
    canNativePrompt: Boolean(promptEvent),
    platform,
    manualSteps,
    clearManualSteps: () => setManualSteps(null),
    installed,
    updateReady,
    install,
    applyUpdate,
    dismissInstall,
    dismissUpdate: () => setUpdateReady(false),
  };
}
