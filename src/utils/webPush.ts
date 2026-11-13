import { NotificationSettings, notificationsSupported } from './notifications';
import { isValidEndpoint, loadRemoteReportSettings } from './remoteReports';

/**
 * Background notifications for the installed PWA (Web Push).
 *
 * The browser creates a push subscription with the worker's VAPID public key and
 * hands it to the worker, which sends reminders even when the app is closed. The
 * worker is the same Cloudflare Worker used for background email (functions/README.md),
 * so it is configured once under Reports -> Background delivery.
 */

export interface PushPrefs {
  daily: { enabled: boolean; hour: number };
  wallet: boolean;
  report: boolean;
}

export interface WebPushState {
  supported: boolean;
  subscribed: boolean;
  endpointReady: boolean;
}

const STORAGE_KEY = 'spends_data_web_push_v1';

interface StoredPush {
  enabled: boolean;
  endpoint: string;
}

const loadStored = (): StoredPush => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const defaults: StoredPush = { enabled: false, endpoint: '' };
    return raw ? { ...defaults, ...(JSON.parse(raw) as Partial<StoredPush>) } : defaults;
  } catch {
    return { enabled: false, endpoint: '' };
  }
};

const saveStored = (value: StoredPush) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // ignore
  }
};

export const webPushSupported = (): boolean =>
  typeof window !== 'undefined' &&
  'serviceWorker' in navigator &&
  'PushManager' in window &&
  notificationsSupported();

/** Worker base URL and token, from the Reports -> Background delivery settings. */
export function workerConfig(): { endpoint: string; token: string; ready: boolean } {
  const remote = loadRemoteReportSettings();
  const endpoint = remote.endpoint.trim().replace(/\/$/, '');
  return { endpoint, token: remote.token, ready: isValidEndpoint(endpoint) };
}

export const pushPrefsFrom = (settings: NotificationSettings): PushPrefs => ({
  daily: { enabled: settings.enabled && settings.dailyReminder, hour: settings.reminderHour },
  wallet: settings.enabled && settings.walletAlerts,
  report: settings.enabled && settings.reportReminder,
});

const authHeaders = (token: string): Record<string, string> => ({
  'Content-Type': 'application/json',
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

async function readMessage(res: Response): Promise<string> {
  const body = (await res.json().catch(() => ({}))) as { message?: string; error?: string };
  return body.message ?? body.error ?? `Worker ${res.status}`;
}

/** Base64url VAPID public key to the Uint8Array that PushManager expects. */
function urlBase64ToUint8Array(value: string): Uint8Array {
  const padding = '='.repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  return Uint8Array.from(raw, (char) => char.charCodeAt(0));
}

export async function currentSubscription(): Promise<PushSubscription | null> {
  if (!webPushSupported()) return null;
  const registration = await navigator.serviceWorker.ready;
  return registration.pushManager.getSubscription();
}

export async function getWebPushState(): Promise<WebPushState> {
  const config = workerConfig();
  const subscribed = (await currentSubscription().catch(() => null)) !== null;
  return { supported: webPushSupported(), subscribed, endpointReady: config.ready };
}

/**
 * Turns background notifications on: asks for permission, subscribes the browser and
 * registers the subscription and reminder preferences with the worker.
 */
export async function enableWebPush(prefs: PushPrefs): Promise<{ ok: boolean; message: string }> {
  if (!webPushSupported()) {
    return { ok: false, message: 'This browser cannot receive background notifications.' };
  }
  const config = workerConfig();
  if (!config.ready) {
    return { ok: false, message: 'Add the worker URL under Reports → Background delivery first.' };
  }

  const permission =
    Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
  if (permission !== 'granted') {
    return { ok: false, message: 'Allow notifications for this site in your browser settings.' };
  }

  try {
    const keyRes = await fetch(`${config.endpoint}/push/key`);
    const keyBody = (await keyRes.json().catch(() => ({}))) as { publicKey?: string | null };
    if (!keyRes.ok || !keyBody.publicKey) {
      return { ok: false, message: 'The worker has no push keys yet. See functions/README.md (VAPID).' };
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription =
      (await registration.pushManager.getSubscription()) ??
      (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(keyBody.publicKey) as BufferSource,
      }));

    const message = await syncSubscription(subscription, prefs, config);
    saveStored({ enabled: true, endpoint: config.endpoint });
    return message;
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? `Could not turn on: ${error.message}` : 'Could not turn on background notifications.',
    };
  }
}

async function syncSubscription(
  subscription: PushSubscription,
  prefs: PushPrefs,
  config: { endpoint: string; token: string }
): Promise<{ ok: boolean; message: string }> {
  const res = await fetch(`${config.endpoint}/push/subscribe`, {
    method: 'POST',
    headers: authHeaders(config.token),
    body: JSON.stringify({
      subscription: subscription.toJSON(),
      prefs,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    }),
  });
  const message = await readMessage(res);
  return { ok: res.ok, message };
}

/** Re-sends the current reminder preferences so the worker follows the in-app settings. */
export async function syncWebPushPrefs(settings: NotificationSettings): Promise<void> {
  const stored = loadStored();
  if (!stored.enabled || !webPushSupported()) return;
  const config = workerConfig();
  if (!config.ready) return;
  try {
    const subscription = await currentSubscription();
    if (!subscription) return;
    await syncSubscription(subscription, pushPrefsFrom(settings), config);
  } catch {
    // offline or worker unreachable: the next change retries
  }
}

export async function disableWebPush(): Promise<{ ok: boolean; message: string }> {
  const config = workerConfig();
  const stored = loadStored();
  const endpoint = config.ready ? config.endpoint : stored.endpoint;
  try {
    const subscription = await currentSubscription();
    if (subscription) {
      const url = subscription.endpoint;
      await subscription.unsubscribe();
      if (endpoint) {
        await fetch(`${endpoint}/push/unsubscribe`, {
          method: 'POST',
          headers: authHeaders(config.token),
          body: JSON.stringify({ endpoint: url }),
        }).catch(() => undefined);
      }
    }
    saveStored({ enabled: false, endpoint: stored.endpoint });
    return { ok: true, message: 'Background notifications are off on this device.' };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'Could not turn off background notifications.',
    };
  }
}

/** Asks the worker to push one test notification to this device. */
export async function sendWebPushTest(): Promise<{ ok: boolean; message: string }> {
  const config = workerConfig();
  if (!config.ready) return { ok: false, message: 'Add the worker URL under Reports → Background delivery first.' };
  const subscription = await currentSubscription().catch(() => null);
  if (!subscription) return { ok: false, message: 'Turn on background notifications first.' };
  try {
    const res = await fetch(`${config.endpoint}/push/test`, {
      method: 'POST',
      headers: authHeaders(config.token),
      body: JSON.stringify({ endpoint: subscription.endpoint }),
    });
    return { ok: res.ok, message: await readMessage(res) };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : 'Could not reach the worker.' };
  }
}
