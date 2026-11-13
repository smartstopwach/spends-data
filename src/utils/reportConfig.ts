import { ReportRangeMode } from './weeklyReport';

const CONFIG_KEY = 'ghar_ka_hisaab_report_v1';

export type ReportDelivery = 'gmail' | 'emailjs';

export interface EmailReportConfig {
  /** Where the weekly digest should be delivered. */
  email: string;
  enabled: boolean;
  /** 1 = Monday … 7 = Sunday (ISO weekday). */
  weekday: number;
  /** Local hour (0-23) used to decide when the digest becomes due. */
  hour: number;
  delivery: ReportDelivery;
  emailjs: { serviceId: string; templateId: string; publicKey: string };
  /** ISO date of the last digest that was generated / sent. */
  lastSentDate: string | null;
  /** Which period the digest should cover. */
  rangeMode: ReportRangeMode;
  customFrom: string;
  customTo: string;
  /** Optional note appended to the email. */
  footerNote: string;
}

export const DEFAULT_REPORT_CONFIG: EmailReportConfig = {
  email: '',
  enabled: false,
  weekday: 1,
  hour: 9,
  delivery: 'gmail',
  emailjs: { serviceId: '', templateId: '', publicKey: '' },
  lastSentDate: null,
  rangeMode: 'last7',
  customFrom: '',
  customTo: '',
  footerNote: '',
};

export const WEEKDAYS: Array<{ value: number; label: string; short: string }> = [
  { value: 1, label: 'Monday', short: 'Mon' },
  { value: 2, label: 'Tuesday', short: 'Tue' },
  { value: 3, label: 'Wednesday', short: 'Wed' },
  { value: 4, label: 'Thursday', short: 'Thu' },
  { value: 5, label: 'Friday', short: 'Fri' },
  { value: 6, label: 'Saturday', short: 'Sat' },
  { value: 7, label: 'Sunday', short: 'Sun' },
];

export const isValidEmail = (value: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(value.trim());

export function loadReportConfig(): EmailReportConfig {
  try {
    const raw = window.localStorage.getItem(CONFIG_KEY);
    if (!raw) return DEFAULT_REPORT_CONFIG;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return DEFAULT_REPORT_CONFIG;
    return {
      ...DEFAULT_REPORT_CONFIG,
      ...parsed,
      emailjs: { ...DEFAULT_REPORT_CONFIG.emailjs, ...(parsed.emailjs ?? {}) },
    };
  } catch {
    return DEFAULT_REPORT_CONFIG;
  }
}

export function saveReportConfig(config: EmailReportConfig): void {
  try {
    window.localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  } catch {
    // ignore quota errors
  }
}

/** ISO weekday of a `YYYY-MM-DD` date (1 = Monday … 7 = Sunday). */
export function isoWeekday(dateISO: string): number {
  const [y, m, d] = dateISO.split('-').map(Number);
  const day = new Date(y, m - 1, d).getDay(); // 0 = Sunday
  return day === 0 ? 7 : day;
}

/** True when a digest has not been produced yet for this week and the slot has passed. */
export function isReportDue(config: EmailReportConfig, todayISO: string, hour: number): boolean {
  if (!config.enabled || !isValidEmail(config.email)) return false;
  if (config.lastSentDate === todayISO) return false;
  const today = isoWeekday(todayISO);
  if (today !== config.weekday) return false;
  return hour >= config.hour;
}

export function emailjsReady(config: EmailReportConfig): boolean {
  const { serviceId, templateId, publicKey } = config.emailjs;
  return Boolean(serviceId.trim() && templateId.trim() && publicKey.trim());
}
