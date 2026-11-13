import React from 'react';
import { Bell, X } from 'lucide-react';

interface NotificationPromptProps {
  onAllow: () => Promise<void>;
  onLater: () => void;
}

/**
 * First-run card that asks for notification permission. The browser (or Android)
 * permission dialog only opens from the Allow tap, which is what browsers expect.
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
      <div className="flex w-full max-w-md items-start gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-xl shadow-slate-900/10">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
          <Bell className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-bold text-slate-900">Turn on reminders?</p>
          <p className="mt-0.5 text-[11px] font-medium leading-relaxed text-slate-500">
            A nudge to log spends, your money-left check and the weekly report. You can change this any time in Settings.
          </p>
          <div className="mt-2.5 flex items-center gap-2">
            <button
              type="button"
              onClick={() => void allow()}
              disabled={busy}
              className="rounded-lg bg-indigo-600 px-3.5 py-1.5 text-[11px] font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-60"
            >
              {busy ? 'Opening…' : 'Allow notifications'}
            </button>
            <button
              type="button"
              onClick={onLater}
              className="rounded-lg px-3 py-1.5 text-[11px] font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
            >
              Not now
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={onLater}
          aria-label="Close"
          className="shrink-0 rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};
