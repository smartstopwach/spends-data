import React from 'react';
import { Bell, X } from 'lucide-react';
import { REMINDER_COPY } from '../utils/reminderCopy';

interface NotificationPromptProps {
  onAllow: () => Promise<void>;
  onLater: () => void;
}

/**
 * First-run card that asks for notification permission. The browser (or Android)
 * permission dialog only opens from the Allow tap, which is what browsers expect.
 * The preview shows the evening reminder exactly as the phone will display it.
 */
export const NotificationPrompt: React.FC<NotificationPromptProps> = ({ onAllow, onLater }) => {
  const [busy, setBusy] = React.useState(false);

  const allow = async () => {
    setBusy(true);
    try {
      await onAllow();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-label="Turn on reminders"
      className="fixed inset-x-0 top-[calc(env(safe-area-inset-top,0px)+7.75rem)] z-50 flex justify-center px-3 md:top-20 md:px-4"
    >
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xl shadow-indigo-900/15">
        <div className="flex items-start gap-3 bg-gradient-to-br from-indigo-600 to-violet-600 px-4 pb-3 pt-3.5 text-white">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25">
            <Bell className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-bold leading-tight">Turn on reminders?</p>
            <p className="mt-0.5 text-[11px] font-medium leading-relaxed text-indigo-100">
              A short evening nudge, your money-left check and the weekly report. Change it any time in Settings.
            </p>
          </div>
          <button
            type="button"
            onClick={onLater}
            aria-label="Close"
            className="-mr-1 -mt-1 shrink-0 rounded-md p-1 text-indigo-100 transition hover:bg-white/10 hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* What the phone shows, in the same shape as a real notification. */}
        <div className="px-4 pt-3">
          <div className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-slate-50 p-2.5">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-[11px] font-extrabold text-white">
              ₹
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Spends Data · now</p>
              </div>
              <p className="truncate text-[12px] font-bold text-slate-900">{REMINDER_COPY.daily.title}</p>
              <p className="truncate text-[11px] font-medium text-slate-500">{REMINDER_COPY.daily.body}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 px-4 pb-4 pt-3">
          <button
            type="button"
            onClick={() => void allow()}
            disabled={busy}
            className="flex-1 rounded-xl bg-indigo-600 px-4 py-2.5 text-[12px] font-bold text-white shadow-sm transition hover:bg-indigo-700 active:scale-[0.99] disabled:opacity-60"
          >
            {busy ? 'Opening…' : 'Allow notifications'}
          </button>
          <button
            type="button"
            onClick={onLater}
            className="rounded-xl px-4 py-2.5 text-[12px] font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
};
