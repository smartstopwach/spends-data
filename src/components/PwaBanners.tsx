import React from 'react';
import { Download, RefreshCw, Sparkles, X } from 'lucide-react';
import { APP_VERSION, CHANGELOG } from '../version';
import { usePwa } from '../hooks/usePwa';

export const PwaBanners: React.FC = () => {
  const {
    canInstall,
    installed,
    updateReady,
    install,
    applyUpdate,
    dismissInstall,
    dismissUpdate,
  } = usePwa();

  const [showWhatsNew, setShowWhatsNew] = React.useState(false);

  React.useEffect(() => {
    try {
      const seen = window.localStorage.getItem('spends_data_seen_version');
      if (seen !== APP_VERSION) setShowWhatsNew(true);
    } catch {
      // ignore
    }
  }, []);

  const closeWhatsNew = () => {
    setShowWhatsNew(false);
    try {
      window.localStorage.setItem('spends_data_seen_version', APP_VERSION);
    } catch {
      // ignore
    }
  };

  const entry = CHANGELOG[0];

  return (
    <>
      {/* Update available */}
      {updateReady && (
        <div className="fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
          <div className="flex w-full max-w-md items-center gap-3 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 shadow-xl shadow-slate-900/10">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <RefreshCw className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-bold text-slate-900">Update available</p>
              <p className="truncate text-[11px] font-medium text-slate-500">
                A new version of Spends Data is ready.
              </p>
            </div>
            <button
              type="button"
              onClick={applyUpdate}
              className="shrink-0 rounded-lg bg-slate-900 px-3 py-1.5 text-[11px] font-bold text-white transition hover:bg-slate-800"
            >
              Restart
            </button>
            <button
              type="button"
              onClick={dismissUpdate}
              aria-label="Dismiss update"
              className="shrink-0 rounded-md p-1 text-slate-400 transition hover:bg-slate-100"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Install prompt */}
      {canInstall && !installed && !updateReady && (
        <div className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-4">
          <div className="flex w-full max-w-md items-center gap-3 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 shadow-xl shadow-slate-900/10">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <Download className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-bold text-slate-900">Install Spends Data</p>
              <p className="truncate text-[11px] font-medium text-slate-500">
                Add to your home screen — works offline.
              </p>
            </div>
            <button
              type="button"
              onClick={install}
              className="shrink-0 rounded-lg bg-indigo-600 px-3 py-1.5 text-[11px] font-bold text-white transition hover:bg-indigo-700"
            >
              Install
            </button>
            <button
              type="button"
              onClick={dismissInstall}
              aria-label="Dismiss install prompt"
              className="shrink-0 rounded-md p-1 text-slate-400 transition hover:bg-slate-100"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* What's new */}
      {showWhatsNew && entry && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 px-3 pb-3 sm:items-center sm:pb-0">
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`What's new in version ${APP_VERSION}`}
            className="w-full max-w-sm overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
          >
            <div className="bg-[linear-gradient(135deg,#1e1b4b,#4338ca)] px-5 py-4 text-white">
              <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-indigo-200">
                <Sparkles className="h-3 w-3" />
                What&apos;s new · v{APP_VERSION}
              </p>
              <h2 className="mt-1.5 text-base font-extrabold tracking-tight">{entry.title}</h2>
              <p className="mt-1 text-[11px] font-medium text-indigo-200">{entry.date}</p>
            </div>

            <ul className="space-y-2 px-5 py-4">
              {entry.items.map((item) => (
                <li key={item} className="flex gap-2 text-[12px] font-medium leading-relaxed text-slate-600">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-indigo-500" />
                  {item}
                </li>
              ))}
            </ul>

            <div className="flex items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/70 px-5 py-3">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Spends Data
              </span>
              <button
                type="button"
                onClick={closeWhatsNew}
                className="rounded-lg bg-slate-900 px-3.5 py-1.5 text-[11px] font-bold text-white transition hover:bg-slate-800"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
