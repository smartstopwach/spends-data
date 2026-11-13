import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Bell,
  Check,
  Download,
  HardDrive,
  Lock,
  Share2,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Trash2,
  Upload,
  Vibrate,
} from 'lucide-react';
import { NotificationSettings, vibrate } from '../utils/notifications';
import { formatBytes, StorageUsage } from '../hooks/useStorageUsage';
import { formatINR } from '../utils/mathAndFormat';

interface SettingsCardProps {
  storage: StorageUsage;
  notifications: {
    settings: NotificationSettings;
    permission: NotificationPermission | 'unsupported';
    supported: boolean;
    onChange: (next: NotificationSettings) => void;
    onRequestPermission: () => Promise<NotificationPermission | 'unsupported'>;
    onTest: () => Promise<void>;
    preview: {
      title: string;
      body: string;
      tag: string;
      actions?: Array<{ action: string; title: string }>;
    } | null;
  };
  transactionCount: number;
  installed: boolean;
  canInstall: boolean;
  onInstall: () => void;
  installHint?: string | null;
  /** Inline monthly budget editor (no hard-coded default anywhere). */
  monthlyBudget: number;
  onSaveBudget: (amount: number) => void;
  onExportCsv: () => void;
  onExportBackup: () => void;
  onImportBackup: (raw: string) => { ok: boolean; message: string };
  onPersistStorage: () => Promise<boolean>;
  onShareSummary: () => void;
  onResetAll: () => void;
  nativeApp?: boolean;
  onScheduleNativeReminders?: (enabled: boolean) => Promise<boolean>;
}

const Row: React.FC<{
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}> = ({ title, subtitle, children }) => (
  <div className="flex items-center justify-between gap-2 py-2.5 sm:gap-3">
    <div className="min-w-0">
      <p className="text-[12px] font-semibold text-slate-900">{title}</p>
      {subtitle && (
        <p className="mt-0.5 text-[11px] font-medium leading-relaxed text-slate-500">{subtitle}</p>
      )}
    </div>
    <div className="shrink-0">{children}</div>
  </div>
);

const Toggle: React.FC<{ on: boolean; onClick: () => void; label: string }> = ({
  on,
  onClick,
  label,
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={on}
    aria-label={label}
    onClick={() => {
      vibrate();
      onClick();
    }}
    className={`relative h-5 w-9 rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 ${on ? 'bg-indigo-600' : 'bg-slate-300'}`}
  >
    <span
      className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${
        on ? 'left-[18px]' : 'left-0.5'
      }`}
    />
  </button>
);

export const SettingsCard: React.FC<SettingsCardProps> = ({
  storage,
  notifications,
  transactionCount,
  installed,
  canInstall,
  onInstall,
  installHint = null,
  monthlyBudget,
  onSaveBudget,
  onExportCsv,
  onExportBackup,
  onImportBackup,
  onPersistStorage,
  onShareSummary,
  onResetAll,
  nativeApp = false,
  onScheduleNativeReminders,
}) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [persistMessage, setPersistMessage] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [budgetDraft, setBudgetDraft] = useState<string>(
    monthlyBudget > 0 ? String(monthlyBudget) : ''
  );
  const [budgetSaved, setBudgetSaved] = useState(false);

  useEffect(() => {
    setBudgetDraft(monthlyBudget > 0 ? String(monthlyBudget) : '');
  }, [monthlyBudget]);

  const saveBudget = () => {
    const amount = Math.max(0, Math.round(Number(budgetDraft) || 0));
    onSaveBudget(amount);
    setBudgetDraft(amount > 0 ? String(amount) : '');
    setBudgetSaved(true);
    window.setTimeout(() => setBudgetSaved(false), 1800);
  };

  const { settings, permission, supported, onChange, onRequestPermission, onTest } = notifications;

  const handleEnableNotifications = async () => {
    vibrate();
    if (!supported) return;
    const result = await onRequestPermission();
    if (result === 'granted') {
      onChange({ ...settings, enabled: true });
      await onTest();
    }
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {/* Notifications */}
      <section className="panel p-5">
        <div className="flex items-start gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <Bell className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Notifications</h2>
            <p className="mt-0.5 text-[11px] font-medium text-slate-500">
              Reminders on your device — like any other app.
            </p>
          </div>
        </div>

        <div className="mt-3 divide-y divide-slate-100">
          <Row
            title="Enable notifications"
            subtitle={
              !supported
                ? 'This browser does not support notifications.'
                : permission === 'denied'
                ? 'Blocked — allow notifications for this site in your browser settings.'
                : 'Daily nudge, budget alert and weekly report reminder.'
            }
          >
            <Toggle
              label="Enable notifications"
              on={settings.enabled && permission === 'granted'}
              onClick={() => {
                if (settings.enabled) onChange({ ...settings, enabled: false });
                else void handleEnableNotifications();
              }}
            />
          </Row>

          {nativeApp && (
            <Row
              title="Background reminders"
              subtitle="Scheduled inside Android — they arrive even when the app is closed."
            >
              <button
                type="button"
                onClick={async () => {
                  const ok = await onScheduleNativeReminders?.(settings.enabled);
                  setImportMessage(
                    ok
                      ? 'Background reminders scheduled on this device'
                      : 'Could not schedule reminders — check notification permission'
                  );
                }}
                className="rounded-lg bg-slate-900 px-2.5 py-1.5 text-[11px] font-bold text-white transition hover:bg-slate-800"
              >
                Apply
              </button>
            </Row>
          )}

          <Row title="Daily logging reminder" subtitle={`At ${settings.reminderHour}:00 if nothing added`}>
            <Toggle
              label="Daily reminder"
              on={settings.dailyReminder}
              onClick={() => onChange({ ...settings, dailyReminder: !settings.dailyReminder })}
            />
          </Row>

          <Row title="Reminder time">
            <select
              value={settings.reminderHour}
              onChange={(e) => onChange({ ...settings, reminderHour: Number(e.target.value) })}
              className="field !w-auto !py-1 text-[11px]"
              aria-label="Reminder time"
            >
              {[8, 12, 17, 19, 20, 21, 22, 23].map((h) => (
                <option key={h} value={h}>
                  {h > 12 ? `${h - 12} PM` : h === 12 ? '12 PM' : `${h} AM`}
                </option>
              ))}
            </select>
          </Row>

          <Row title="Budget alert" subtitle="Warns when 90% of the monthly budget is used">
            <Toggle
              label="Budget alerts"
              on={settings.budgetAlerts}
              onClick={() => onChange({ ...settings, budgetAlerts: !settings.budgetAlerts })}
            />
          </Row>

          <Row title="Weekly report reminder">
            <Toggle
              label="Report reminder"
              on={settings.reportReminder}
              onClick={() => onChange({ ...settings, reportReminder: !settings.reportReminder })}
            />
          </Row>

          <Row title="Streak celebration" subtitle="A nudge that keeps your logging streak alive">
            <Toggle
              label="Streak celebration"
              on={settings.streakCelebration}
              onClick={() =>
                onChange({ ...settings, streakCelebration: !settings.streakCelebration })
              }
            />
          </Row>

          <Row title="Weekly insight" subtitle="Top category and biggest spend highlights">
            <Toggle
              label="Weekly insight"
              on={settings.weeklyInsight}
              onClick={() => onChange({ ...settings, weeklyInsight: !settings.weeklyInsight })}
            />
          </Row>

          <Row title="Action buttons" subtitle="“Add spend” and “Review” inside the notification">
            <Toggle
              label="Rich actions"
              on={settings.richActions}
              onClick={() => onChange({ ...settings, richActions: !settings.richActions })}
            />
          </Row>
        </div>

        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => void onTest()}
            disabled={permission !== 'granted'}
            className="flex-1 rounded-lg border border-slate-200 bg-white py-1.5 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
          >
            Send test notification
          </button>
          <button
            type="button"
            onClick={() => vibrate([10, 40, 10])}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50"
            title="Test haptics"
          >
            <Vibrate className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Live notification preview — looks like the real OS banner */}
        {notifications.preview && (
          <div className="mt-4">
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
              Live preview · updates with your numbers
            </p>
            <div className="rounded-2xl bg-[linear-gradient(135deg,#0f172a,#1e293b)] p-2.5 shadow-lg shadow-slate-900/20">
              <div className="flex items-start gap-2.5 rounded-xl bg-white/95 px-3 py-2.5">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[linear-gradient(135deg,#312E81,#4F46E5)] text-[13px] font-extrabold text-white">
                  ₹
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                      Spends Data
                    </p>
                    <span className="shrink-0 text-[9px] font-medium text-slate-400">now</span>
                  </div>
                  <p className="mt-0.5 truncate text-[12px] font-bold text-slate-900">
                    {notifications.preview.title}
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-[11px] font-medium leading-snug text-slate-600">
                    {notifications.preview.body}
                  </p>

                  {settings.richActions && notifications.preview.actions && (
                    <div className="mt-2 flex gap-1.5">
                      {notifications.preview.actions.slice(0, 2).map((action) => (
                        <span
                          key={action.action}
                          className="rounded-md bg-indigo-50 px-2 py-1 text-[10px] font-bold text-indigo-700"
                        >
                          {action.title}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Storage */}
      <section className="panel p-5">
        <div className="flex items-start gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <HardDrive className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Storage</h2>
            <p className="mt-0.5 text-[11px] font-medium text-slate-500">
              Everything is saved on this device only.
            </p>
          </div>
        </div>

        <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
          <div className="flex items-baseline justify-between">
            <span className="text-[11px] font-semibold text-slate-600">
              {formatBytes(storage.usedBytes)} used
            </span>
            <span className="num text-[10px] font-medium text-slate-400">
              {storage.quotaBytes ? `of ${formatBytes(storage.quotaBytes)} available` : 'local only'}
            </span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${Math.max(2, Math.min(100, storage.percent))}%` }}
            />
          </div>
          <p className="num mt-2 text-[10px] font-medium text-slate-500">
            {transactionCount} transactions ·{' '}
            {storage.persisted ? 'protected from auto-cleanup' : 'may be cleared by the browser'}
          </p>
        </div>

        <div className="mt-3 divide-y divide-slate-100">
          <Row title="Keep data safe" subtitle="Ask the browser never to clear this app's data">
            <button
              type="button"
              onClick={async () => {
                const ok = await onPersistStorage();
                setPersistMessage(ok ? 'Storage protected' : 'Browser declined the request');
              }}
              className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <ShieldCheck className="h-3 w-3 text-emerald-500" />
              {storage.persisted ? 'Protected' : 'Protect'}
            </button>
          </Row>

          <Row title="Export CSV" subtitle="Open in Excel or Google Sheets">
            <button
              type="button"
              onClick={onExportCsv}
              disabled={transactionCount === 0}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
            >
              <Download className="mr-1 inline h-3 w-3" />
              CSV
            </button>
          </Row>

          <Row title="Backup file" subtitle="Full JSON backup of transactions and settings">
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={onExportBackup}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <Download className="mr-1 inline h-3 w-3" />
                Save
              </button>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <Upload className="mr-1 inline h-3 w-3" />
                Restore
              </button>
            </div>
          </Row>

          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const text = await file.text();
              const result = onImportBackup(text);
              setImportMessage(result.message);
              e.target.value = '';
            }}
          />

          <Row title="Delete all data" subtitle="Cannot be undone — export a backup first">
            {confirmReset ? (
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    onResetAll();
                    setConfirmReset(false);
                  }}
                  className="rounded-lg bg-rose-600 px-2.5 py-1.5 text-[11px] font-bold text-white transition hover:bg-rose-700"
                >
                  Confirm
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmReset(false)}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-600"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-[11px] font-semibold text-rose-600 transition hover:bg-rose-100"
              >
                <Trash2 className="mr-1 inline h-3 w-3" />
                Delete
              </button>
            )}
          </Row>
        </div>

        {(importMessage || persistMessage) && (
          <p className="mt-2 flex items-start gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[10px] font-semibold text-slate-600">
            <Check className="mt-0.5 h-3 w-3 shrink-0 text-emerald-500" />
            {importMessage || persistMessage}
          </p>
        )}
      </section>

      {/* App */}
      <section className="panel p-5">
        <div className="flex items-start gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
            <Smartphone className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">App</h2>
            <p className="mt-0.5 text-[11px] font-medium text-slate-500">
              Install and share Spends Data.
            </p>
          </div>
        </div>

        <div className="mt-3 divide-y divide-slate-100">
          <Row
            title={installed ? 'Installed on this device' : 'Install app'}
            subtitle={
              installed
                ? 'Opens full screen and works offline.'
                : canInstall
                ? 'Add to your home screen for an app-like experience.'
                : 'Tap Install and follow the step shown — works in every browser.'
            }
          >
            {installed ? (
              <span className="flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-[11px] font-bold text-emerald-700">
                <Check className="h-3 w-3" />
                Installed
              </span>
            ) : (
              <button
                type="button"
                onClick={onInstall}
                className="rounded-lg bg-indigo-600 px-2.5 py-1.5 text-[11px] font-bold text-white transition hover:bg-indigo-700"
              >
                Install
              </button>
            )}
          </Row>

          {installHint && !installed && (
            <p className="pb-2 text-[11px] font-semibold leading-relaxed text-indigo-700">
              {installHint}
            </p>
          )}

          <Row
            title="Monthly budget"
            subtitle={
              monthlyBudget > 0
                ? `Pace line and usage bar use ${formatINR(monthlyBudget)} per month.`
                : 'Not set — no pace line or usage bar. Add a limit only if you want one.'
            }
          >
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                inputMode="numeric"
                min={0}
                step={100}
                value={budgetDraft}
                onChange={(e) => setBudgetDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveBudget();
                }}
                placeholder="0"
                aria-label="Monthly budget"
                className="w-20 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-right text-[12px] font-semibold text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
              <button
                type="button"
                onClick={saveBudget}
                className="rounded-lg bg-slate-900 px-2.5 py-1.5 text-[11px] font-bold text-white transition hover:bg-slate-800"
              >
                {budgetSaved ? 'Saved' : 'Save'}
              </button>
            </div>
          </Row>

          <Row title="Share summary" subtitle="Send this week's numbers to a friend or family">
            <button
              type="button"
              onClick={onShareSummary}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <Share2 className="mr-1 inline h-3 w-3" />
              Share
            </button>
          </Row>
        </div>
      </section>

      {/* Privacy */}
      <section className="panel p-5">
        <div className="flex items-start gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
            <Lock className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Privacy</h2>
            <p className="mt-0.5 text-[11px] font-medium text-slate-500">
              No account, no tracking, no server.
            </p>
          </div>
        </div>

        <ul className="mt-3 space-y-2 text-[11px] font-medium leading-relaxed text-slate-600">
          <li className="flex gap-2">
            <Check className="mt-0.5 h-3 w-3 shrink-0 text-emerald-500" />
            Transactions are stored in this browser's local storage.
          </li>
          <li className="flex gap-2">
            <Check className="mt-0.5 h-3 w-3 shrink-0 text-emerald-500" />
            Nothing is uploaded unless you export, share or email a report.
          </li>
          <li className="flex gap-2">
            <Check className="mt-0.5 h-3 w-3 shrink-0 text-emerald-500" />
            Uninstalling the app or clearing site data removes everything.
          </li>
        </ul>

        <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-2">
          <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-amber-600" />
          <p className="text-[10px] font-semibold leading-relaxed text-amber-800">
            Local-only storage means no cloud sync. Export a backup regularly if this device
            matters to you.
          </p>
        </div>

        <button
          type="button"
          onClick={onShareSummary}
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-slate-900 py-2 text-[11px] font-bold text-white transition hover:bg-slate-800"
        >
          <Sparkles className="h-3 w-3 text-amber-300" />
          Share weekly summary
        </button>
      </section>
    </div>
  );
};
