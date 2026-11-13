import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Check,
  ChevronDown,
  ExternalLink,
  Mail,
  Download,
  Send,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { Transaction } from '../types';
import {
  EmailReportConfig,
  WEEKDAYS,
  emailjsReady,
  isValidEmail,
  saveReportConfig,
} from '../utils/reportConfig';
import {
  RANGE_OPTIONS,
  buildReport,
  openGmailCompose,
  openMailto,
  resolveReportRange,
  sendReportViaEmailJS,
} from '../utils/weeklyReport';

interface ReportSettingsCardProps {
  config: EmailReportConfig;
  onChange: (config: EmailReportConfig) => void;
  transactions: Transaction[];
  onMarkSent: (dateISO: string) => void;
}

type Status = { tone: 'ok' | 'err' | 'info'; message: string } | null;

const Field: React.FC<{
  label: string;
  hint?: string;
  children: React.ReactNode;
}> = ({ label, hint, children }) => (
  <div>
    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
      {label}
    </label>
    {children}
    {hint && <p className="mt-1 text-[10px] font-medium text-slate-400">{hint}</p>}
  </div>
);

export const ReportSettingsCard: React.FC<ReportSettingsCardProps> = React.memo(
  ({ config, onChange, transactions, onMarkSent }) => {
    const [status, setStatus] = useState<Status>(null);
    const [busy, setBusy] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(
      config.delivery === 'emailjs' || emailjsReady(config)
    );

    useEffect(() => {
      saveReportConfig(config);
    }, [config]);

    const range = useMemo(() => resolveReportRange(config), [config]);
    const preview = useMemo(
      () => buildReport(transactions, { fromISO: range.fromISO, toISO: range.toISO }),
      [transactions, range.fromISO, range.toISO]
    );
    const emailOk = isValidEmail(config.email);
    const canSend = emailOk && !busy;

    const patch = (partial: Partial<EmailReportConfig>) => onChange({ ...config, ...partial });

    const handleGmail = () => {
      if (!emailOk) {
        setStatus({ tone: 'err', message: 'Enter a valid Gmail address first.' });
        return;
      }
      openGmailCompose(preview, config.email);
      onMarkSent(preview.toISO);
      setStatus({
        tone: 'ok',
        message: `Gmail draft opened in a new tab — press Send to deliver it to ${config.email}.`,
      });
    };

    const handleEmailJS = async () => {
      if (!emailOk) {
        setStatus({ tone: 'err', message: 'Enter a valid Gmail address first.' });
        return;
      }
      if (!emailjsReady(config)) {
        setStatus({ tone: 'err', message: 'Fill in the EmailJS Service ID, Template ID and Public Key.' });
        return;
      }
      setBusy(true);
      setStatus({ tone: 'info', message: 'Sending weekly report…' });
      try {
        await sendReportViaEmailJS(preview, config.email, config.emailjs);
        onMarkSent(preview.toISO);
        setStatus({ tone: 'ok', message: `Report ${config.email} par bhej diya gaya ✅` });
      } catch (err) {
        setStatus({
          tone: 'err',
          message:
            err instanceof Error
              ? `Send fail: ${err.message}`
              : 'Send failed — check your EmailJS settings.',
        });
      } finally {
        setBusy(false);
      }
    };

    return (
      <section aria-label="Weekly email report" className="panel overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-200/80 px-5 py-4">
          <div className="flex items-start gap-2.5">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <Mail className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Weekly Email Report</h2>
              <p className="mt-0.5 text-xs font-medium text-slate-500">
                Last 7 days of spending, delivered to your Gmail every week.
              </p>
            </div>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={config.enabled}
            onClick={() => patch({ enabled: !config.enabled })}
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold transition ${
              config.enabled
                ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                : 'bg-slate-100 text-slate-500 ring-1 ring-slate-200'
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                config.enabled ? 'bg-emerald-500' : 'bg-slate-400'
              }`}
            />
            {config.enabled ? 'ON' : 'OFF'}
          </button>
        </div>

        <div className={`px-5 py-4 ${config.enabled ? '' : 'opacity-70'}`}>
          {/* Email + schedule */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field
                label="Send to (Gmail)"
                hint="Your data stays in this browser — you send the email yourself."
              >
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    value={config.email}
                    onChange={(e) => patch({ email: e.target.value })}
                    placeholder="yourname@gmail.com"
                    className={`field !pl-8 ${
                      config.email && !emailOk ? '!border-rose-300 !bg-rose-50/40' : ''
                    }`}
                  />
                </div>
              </Field>
              {config.email && !emailOk && (
                <p className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-rose-600">
                  <AlertCircle className="h-3 w-3" />
                  Enter a valid email address
                </p>
              )}
            </div>

            <Field label="Repeat every">
              <select
                value={config.weekday}
                onChange={(e) => patch({ weekday: Number(e.target.value) })}
                className="field"
              >
                {WEEKDAYS.map((d) => (
                  <option key={d.value} value={d.value}>
                    Every {d.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="At (local time)">
              <select
                value={config.hour}
                onChange={(e) => patch({ hour: Number(e.target.value) })}
                className="field"
              >
                {[6, 7, 8, 9, 10, 12, 14, 16, 18, 20, 21, 22].map((h) => (
                  <option key={h} value={h}>
                    {h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          {/* Report period */}
          <div className="mt-4">
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
              Report period
            </p>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
              {RANGE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => patch({ rangeMode: opt.value })}
                  className={`rounded-lg border px-2 py-1.5 text-[11px] font-semibold transition ${
                    config.rangeMode === opt.value
                      ? 'border-indigo-300 bg-indigo-50/70 text-indigo-700 ring-1 ring-indigo-200'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {config.rangeMode === 'custom' && (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                    From
                  </label>
                  <input
                    type="date"
                    value={config.customFrom || range.fromISO}
                    onChange={(e) => patch({ customFrom: e.target.value })}
                    className="field num !py-1.5 text-[11px]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                    To
                  </label>
                  <input
                    type="date"
                    value={config.customTo || range.toISO}
                    onChange={(e) => patch({ customTo: e.target.value })}
                    className="field num !py-1.5 text-[11px]"
                  />
                </div>
              </div>
            )}

            <p className={`mt-1.5 text-[10px] font-semibold ${range.valid ? 'text-slate-400' : 'text-rose-600'}`}>
              {range.valid
                ? `${range.label} · ${range.days} ${range.days === 1 ? 'day' : 'days'} · ${preview.entryCount} entries`
                : '“From” date “To” date se pehle honi chahiye'}
            </p>
          </div>

          {/* Delivery mode */}
          <div className="mt-4">
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
              Delivery
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => patch({ delivery: 'gmail' })}
                className={`rounded-xl border p-3 text-left transition ${
                  config.delivery === 'gmail'
                    ? 'border-indigo-300 bg-indigo-50/60 ring-1 ring-indigo-200'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <span className="flex items-center gap-1.5 text-[12px] font-bold text-slate-900">
                  Gmail draft (0 setup)
                  {config.delivery === 'gmail' && (
                    <Check className="h-3 w-3 text-indigo-600" />
                  )}
                </span>
                <span className="mt-1 block text-[10px] font-medium leading-relaxed text-slate-500">
                  One click opens Gmail compose with the report pre-filled — just press Send.
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  patch({ delivery: 'emailjs' });
                  setShowAdvanced(true);
                }}
                className={`rounded-xl border p-3 text-left transition ${
                  config.delivery === 'emailjs'
                    ? 'border-emerald-300 bg-emerald-50/60 ring-1 ring-emerald-200'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <span className="flex items-center gap-1.5 text-[12px] font-bold text-slate-900">
                  Automatic (EmailJS)
                  {config.delivery === 'emailjs' && (
                    <Check className="h-3 w-3 text-emerald-600" />
                  )}
                </span>
                <span className="mt-1 block text-[10px] font-medium leading-relaxed text-slate-500">
                  With a free EmailJS account the email goes out every week with no clicks.
                </span>
              </button>
            </div>
          </div>

          {/* EmailJS credentials */}
          {(config.delivery === 'emailjs' || showAdvanced) && (
            <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50/70">
              <button
                type="button"
                onClick={() => setShowAdvanced((s) => !s)}
                className="flex w-full items-center justify-between gap-2 px-3 py-2 text-[11px] font-bold text-slate-600"
              >
                <span className="flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3 text-amber-500" />
                  Automatic sending setup {emailjsReady(config) ? '✅' : '(optional)'}
                </span>
                <ChevronDown
                  className={`h-3 w-3 transition ${showAdvanced ? 'rotate-180' : ''}`}
                />
              </button>

              {showAdvanced && (
                <div className="grid grid-cols-1 gap-2 border-t border-slate-200/80 px-3 py-3 sm:grid-cols-3">
                  {(
                    [
                      ['serviceId', 'Service ID', 'service_xxxxxx'],
                      ['templateId', 'Template ID', 'template_xxxxxx'],
                      ['publicKey', 'Public Key', 'xxxxxxxxxxxx'],
                    ] as const
                  ).map(([key, label, placeholder]) => (
                    <div key={key}>
                      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        {label}
                      </label>
                      <input
                        type="text"
                        value={config.emailjs[key]}
                        onChange={(e) =>
                          patch({ emailjs: { ...config.emailjs, [key]: e.target.value } })
                        }
                        placeholder={placeholder}
                        className="field !py-1.5 text-[11px]"
                      />
                    </div>
                  ))}
                  <p className="text-[10px] font-medium leading-relaxed text-slate-500 sm:col-span-3">
                    Template variables:{' '}
                    <code className="rounded bg-white px-1 py-0.5 text-[10px] text-slate-700">
                      to_email, subject, period, money_in, spends, balance, daily_avg,
                      top_category, entries, message, message_text
                    </code>
                    .{' '}
                    <a
                      href="https://dashboard.emailjs.com/sign-up"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-0.5 font-semibold text-indigo-600 hover:underline"
                    >
                      Create a free account
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Preview */}
          <div className="mt-4 rounded-xl border border-slate-200/80 bg-white p-3.5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400">
                Preview · {preview.periodLabel}
              </p>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => {
                    const blob = new Blob([preview.text], { type: 'text/plain;charset=utf-8' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `spends-data-${preview.fromISO}_to_${preview.toISO}.txt`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  }}
                  title="Download report as text"
                  className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                >
                  <Download className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="mt-2 grid grid-cols-3 divide-x divide-slate-200 rounded-lg bg-slate-50/80">
              {[
                { label: 'Money in', value: preview.income, tone: 'text-emerald-600' },
                { label: 'Spends', value: preview.spend, tone: 'text-slate-900' },
                { label: 'Daily avg', value: preview.dailyAvg, tone: 'text-indigo-600' },
              ].map((s) => (
                <div key={s.label} className="px-2.5 py-2">
                  <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">
                    {s.label}
                  </p>
                  <p className={`num mt-0.5 text-[12px] font-bold ${s.tone}`}>
                    ₹{s.value.toLocaleString('en-IN')}
                  </p>
                </div>
              ))}
            </div>

            {/* category split */}
            <ul className="mt-3 space-y-1.5">
              {preview.categories.slice(0, 4).map((c) => (
                <li key={c.label} className="flex items-center gap-2 text-[11px]">
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: c.color }}
                  />
                  <span className="min-w-0 flex-1 truncate font-medium text-slate-600">
                    {c.label}
                  </span>
                  <span className="h-1 w-14 shrink-0 overflow-hidden rounded-full bg-slate-100">
                    <span
                      className="block h-full rounded-full"
                      style={{
                        width: `${Math.max(4, c.percentage)}%`,
                        backgroundColor: c.color,
                      }}
                    />
                  </span>
                  <span className="num w-16 shrink-0 text-right font-bold text-slate-800">
                    ₹{c.amount.toLocaleString('en-IN')}
                  </span>
                </li>
              ))}
              {preview.categories.length === 0 && (
                <li className="text-[11px] font-medium text-slate-400">
                  No spending in this period 🎉
                </li>
              )}
            </ul>

            {/* itemised day-by-day ledger */}
            <div className="mt-3 border-t border-slate-100 pt-2.5">
              <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                How the money was spent · day by day
              </p>

              <div className="mt-1.5 max-h-[260px] overflow-y-auto pr-1">
                {preview.dayGroups.length === 0 && (
                  <p className="py-3 text-center text-[11px] font-medium text-slate-400">
                    No entries in this range.
                  </p>
                )}

                {preview.dayGroups.map((day) => (
                  <div key={day.date} className="mb-1.5">
                    <div className="flex items-center justify-between gap-2 rounded-md bg-slate-100/80 px-2 py-1">
                      <span className="text-[10px] font-bold uppercase tracking-wide text-slate-600">
                        {day.label}
                      </span>
                      <span className="num flex items-center gap-1.5 text-[10px] font-bold">
                        {day.spend > 0 && <span className="text-slate-700">−₹{day.spend.toLocaleString('en-IN')}</span>}
                        {day.income > 0 && (
                          <span className="text-emerald-600">+₹{day.income.toLocaleString('en-IN')}</span>
                        )}
                      </span>
                    </div>

                    <ul className="mt-0.5 divide-y divide-slate-100">
                      {day.items.map((item) => (
                        <li key={item.id} className="flex items-center gap-2 py-1">
                          <span
                            className="h-1.5 w-1.5 shrink-0 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-slate-700">
                            {item.note}
                          </span>
                          <span className="hidden shrink-0 rounded bg-slate-100 px-1 py-px text-[9px] font-bold uppercase text-slate-500 sm:inline">
                            {item.mode}
                          </span>
                          <span
                            className={`num shrink-0 text-[11px] font-bold ${
                              item.type === 'income' ? 'text-emerald-600' : 'text-slate-800'
                            }`}
                          >
                            {item.type === 'income' ? '+' : '−'}₹
                            {item.amount.toLocaleString('en-IN')}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <div className="mt-2 flex items-center justify-between rounded-md bg-slate-900 px-2.5 py-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wide text-slate-300">
                  Total spends · {preview.spendCount}
                </span>
                <span className="num text-[12px] font-bold text-white">
                  ₹{preview.spend.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              disabled={!canSend}
              onClick={handleGmail}
              className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-indigo-600 text-[11px] font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Send className="h-3.5 w-3.5" />
              Send now via Gmail
            </button>

            <button
              type="button"
              disabled={!canSend}
              onClick={handleEmailJS}
              className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white text-[11px] font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {busy ? 'Sending…' : 'Auto-send (EmailJS)'}
              <ArrowRight className="h-3.5 w-3.5" />
            </button>

            {config.email && (
              <button
                type="button"
                onClick={() => openMailto(preview, config.email)}
                className="flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                <Mail className="h-3.5 w-3.5" />
                Mail app
              </button>
            )}
          </div>

          {status && (
            <div
              className={`mt-3 flex items-start gap-2 rounded-lg border px-3 py-2 text-[11px] font-semibold ${
                status.tone === 'ok'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  : status.tone === 'err'
                  ? 'border-rose-200 bg-rose-50 text-rose-700'
                  : 'border-slate-200 bg-slate-50 text-slate-600'
              }`}
            >
              {status.tone === 'ok' ? (
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              ) : status.tone === 'err' ? (
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              ) : (
                <Send className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              )}
              <span>{status.message}</span>
            </div>
          )}

          <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-2.5 text-[10px] font-medium text-slate-400">
            <span>
              {config.lastSentDate
                ? `Last report: ${config.lastSentDate}`
                : 'No report generated yet'}
            </span>
            <button
              type="button"
              onClick={() => {
                patch({
                  email: '',
                  enabled: false,
                  lastSentDate: null,
                  emailjs: { serviceId: '', templateId: '', publicKey: '' },
                });
                setStatus(null);
              }}
              className="flex items-center gap-1 rounded px-1.5 py-0.5 font-semibold text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
            >
              <Trash2 className="h-3 w-3" />
              Clear settings
            </button>
          </div>
        </div>
      </section>
    );
  }
);
ReportSettingsCard.displayName = 'ReportSettingsCard';
