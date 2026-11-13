import { useCallback, useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const INSTALL_DISMISSED_KEY = 'spends_data_install_dismissed';

export interface PwaState {
  canInstall: boolean;
  installed: boolean;
  updateReady: boolean;
  install: () => Promise<void>;
  applyUpdate: () => void;
  dismissInstall: () => void;
  dismissUpdate: () => void;
}

export function usePwa(): PwaState {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState<boolean>(false);
  const [updateReady, setUpdateReady] = useState(false);
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
    if (!promptEvent) return;
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    if (choice.outcome === 'accepted') setInstalled(true);
    setPromptEvent(null);
  }, [promptEvent]);

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
    canInstall: Boolean(promptEvent) && !dismissed,
    installed,
    updateReady,
    install,
    applyUpdate,
    dismissInstall,
    dismissUpdate: () => setUpdateReady(false),
  };
}
