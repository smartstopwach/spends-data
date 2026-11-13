import { Report, ReportRange, buildReport } from './weeklyReport';
import { getTodayISO } from './mathAndFormat';
import { Transaction } from '../types';

/**
 * Optional background email delivery.
 *
 * Truly unattended email (app closed, phone asleep) needs something outside the
 * browser. This module talks to a tiny Cloudflare Worker (see
 * `functions/README.md`) that builds the same digest and posts it to EmailJS on a
 * cron schedule. When no endpoint is configured everything falls back to the
 * in-app send flow, so the app keeps working without any server.
 */
export interface RemoteReportSettings {
  endpoint: string;
  token: string;
  enabled: boolean;
  lastSyncedAt: string | null;
}

export const DEFAULT_REMOTE_REPORT: RemoteReportSettings = {
  endpoint: '',
  token: '',
  enabled: false,
  lastSyncedAt: null,
};

const STORAGE_KEY = 'spends_data_remote_report_v1';

export function loadRemoteReportSettings(): RemoteReportSettings {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_REMOTE_REPORT;
    return { ...DEFAULT_REMOTE_REPORT, ...(JSON.parse(raw) ?? {}) };
  } catch {
    return DEFAULT_REMOTE_REPORT;
  }
}

export function saveRemoteReportSettings(settings: RemoteReportSettings): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

export function isValidEndpoint(value: string): boolean {
  return /^https:\/\/[a-z0-9-.]+\.[a-z]{2,}(\/.*)?$/i.test(value.trim());
}

/** Sends the latest snapshot + schedule so the worker can email it on time. */
export async function pushReportSchedule(
  settings: RemoteReportSettings,
  payload: {
    email: string;
    weekday: number;
    hour: number;
    rangeMode: string;
    customFrom: string;
    customTo: string;
    transactions: Transaction[];
  }
): Promise<{ ok: boolean; message: string }> {
  if (!isValidEndpoint(settings.endpoint)) {
    return { ok: false, message: 'Enter a valid https endpoint.' };
  }
  try {
    const res = await fetch(`${settings.endpoint.replace(/\/$/, '')}/schedule`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(settings.token ? { Authorization: `Bearer ${settings.token}` } : {}),
      },
      body: JSON.stringify({
        ...payload,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        installedAt: new Date().toISOString(),
      }),
    });
    if (!res.ok) {
      const detail = await res.text();
      return { ok: false, message: `Worker ${res.status}: ${detail.slice(0, 120)}` };
    }
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    return { ok: true, message: body.message ?? 'Background delivery scheduled.' };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? `Could not reach the worker: ${error.message}`
          : 'Could not reach the worker.',
    };
  }
}

/** Generates the digest locally — used by the manual send flow. */
export function localReport(transactions: Transaction[], range: ReportRange): Report {
  return buildReport(transactions, range);
}

export function lastSevenDays(): ReportRange {
  const toISO = getTodayISO();
  const [y, m, d] = toISO.split('-').map(Number);
  const from = new Date(y, m - 1, d - 6);
  const fromISO = `${from.getFullYear()}-${String(from.getMonth() + 1).padStart(2, '0')}-${String(
    from.getDate()
  ).padStart(2, '0')}`;
  return { fromISO, toISO };
}
