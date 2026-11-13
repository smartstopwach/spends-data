/**
 * Single source of truth for "Download / install this app as a PWA" and for
 * service-worker updates.
 *
 * - `initPwa()` runs once before React mounts, so the browser's
 *   `beforeinstallprompt` event is never missed.
 * - One service-worker registration for the whole app (the old hook registered
 *   it once per component).
 * - `runInstall()` is a pure function, so the install outcome is unit-tested.
 */

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export type InstallPlatform = 'ios' | 'android' | 'desktop' | 'installed';

/** installed: now on the home screen · dismissed: user closed the native dialog ·
 *  manual: no native prompt in this browser, show the steps instead. */
export type InstallResult = 'installed' | 'dismissed' | 'manual';

export const INSTALL_DISMISSED_KEY = 'spends_data_install_dismissed';

/* ── Pure helpers ─────────────────────────────────────────────── */

export function detectPlatform(userAgent: string, maxTouchPoints = 0): Exclude<InstallPlatform, 'installed'> {
  if (/iPad|iPhone|iPod/.test(userAgent) || (/Macintosh/.test(userAgent) && maxTouchPoints > 1)) {
    return 'ios';
  }
  if (/Android/.test(userAgent)) return 'android';
  return 'desktop';
}

export function manualInstallSteps(platform: InstallPlatform): string {
  switch (platform) {
    case 'ios':
      return 'On iPhone or iPad: open this page in Safari, tap the Share button, then “Add to Home Screen”.';
    case 'android':
      return 'Tap the browser menu (⋮) and choose “Install app” or “Add to Home screen”.';
    case 'installed':
      return 'Spends Data is already installed. Open it from your home screen.';
    default:
      return 'Click the install icon (⊕) in the address bar, or open the browser menu and choose “Install Spends Data”.';
  }
}

/** Calls the browser's native install dialog. Never throws. */
export async function runInstall(prompt: BeforeInstallPromptEvent | null): Promise<InstallResult> {
  if (!prompt) return 'manual';
  try {
    await prompt.prompt();
    const choice = await prompt.userChoice;
    return choice.outcome === 'accepted' ? 'installed' : 'dismissed';
  } catch {
    // A deferred prompt can only be used once; the caller falls back to manual steps.
    return 'manual';
  }
}

/* ── Store ────────────────────────────────────────────────────── */

export interface PwaSnapshot {
  platform: InstallPlatform;
  installed: boolean;
  prompt: BeforeInstallPromptEvent | null;
  updateReady: boolean;
}

let snapshot: PwaSnapshot = {
  platform: 'desktop',
  installed: false,
  prompt: null,
  updateReady: false,
};

const listeners = new Set<() => void>();

function setSnapshot(patch: Partial<PwaSnapshot>): void {
  snapshot = { ...snapshot, ...patch };
  listeners.forEach((listener) => listener());
}

export function subscribePwa(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getPwaSnapshot(): PwaSnapshot {
  return snapshot;
}

function isStandalone(): boolean {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches === true ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

let initialized = false;

/** Call once at startup, before React renders. Safe to call twice. */
export function initPwa(): void {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;

  const installed = isStandalone();
  setSnapshot({
    installed,
    platform: installed ? 'installed' : detectPlatform(navigator.userAgent || '', navigator.maxTouchPoints || 0),
  });

  window.addEventListener('beforeinstallprompt', (event) => {
    // Keep the event so our own button can trigger the install dialog later.
    event.preventDefault();
    setSnapshot({ prompt: event as BeforeInstallPromptEvent });
  });

  window.addEventListener('appinstalled', () => {
    setSnapshot({ installed: true, platform: 'installed', prompt: null });
  });

  window.matchMedia?.('(display-mode: standalone)').addEventListener?.('change', (event) => {
    if (event.matches) setSnapshot({ installed: true, platform: 'installed', prompt: null });
  });

  // Production only, so dev HMR stays clean.
  if ('serviceWorker' in navigator && !import.meta.env.DEV) {
    void registerServiceWorker();
  }
}

/** Triggers the native install dialog, or reports that manual steps are needed. */
export async function requestInstall(): Promise<InstallResult> {
  if (snapshot.installed) return 'installed';
  const { prompt } = snapshot;
  if (prompt) setSnapshot({ prompt: null });
  const result = await runInstall(prompt);
  if (result === 'installed') setSnapshot({ installed: true, platform: 'installed' });
  return result;
}

export function dismissInstallBanner(): void {
  try {
    window.localStorage.setItem(INSTALL_DISMISSED_KEY, '1');
  } catch {
    // ignore
  }
}

export function isInstallBannerDismissed(): boolean {
  try {
    return window.localStorage.getItem(INSTALL_DISMISSED_KEY) === '1';
  } catch {
    return false;
  }
}

export function dismissUpdateReady(): void {
  setSnapshot({ updateReady: false });
}

export function applyPwaUpdate(): void {
  navigator.serviceWorker
    ?.getRegistration()
    .then((registration) => {
      registration?.waiting?.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    })
    .catch(() => window.location.reload());
}

async function registerServiceWorker(): Promise<void> {
  const container = navigator.serviceWorker;

  // Reload once the new worker takes control, so the page runs the fresh build.
  container.addEventListener('controllerchange', () => window.location.reload());

  try {
    const base = import.meta.env.BASE_URL;
    const registration = await container.register(`${base}sw.js`, { scope: base });

    if (registration.waiting) setSnapshot({ updateReady: true });

    registration.addEventListener('updatefound', () => {
      const next = registration.installing;
      if (!next) return;
      next.addEventListener('statechange', () => {
        if (next.state === 'installed' && container.controller) setSnapshot({ updateReady: true });
      });
    });

    // Check for a fresh deploy when the user comes back, and hourly.
    const check = () => {
      void registration.update().catch(() => undefined);
    };
    window.addEventListener('focus', check);
    window.setInterval(check, 60 * 60 * 1000);
  } catch {
    // Offline support is a bonus, never block the app.
  }
}
