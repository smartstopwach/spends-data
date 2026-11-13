import React, { useEffect, useState } from 'react';
import { Check, Clock, Download, MonitorDown, Smartphone, X } from 'lucide-react';
import { PwaState } from '../hooks/usePwa';
import { APK_URL, DOWNLOAD_OPTIONS, RELEASES_URL, RELEASE_URL } from '../utils/downloads';

interface DownloadAppSheetProps {
  open: boolean;
  onClose: () => void;
  pwa: Pick<PwaState, 'install' | 'installed' | 'platform' | 'manualSteps'>;
}

type ApkState = 'checking' | 'ready' | 'missing';

/**
 * One entry point ("Download app") → two clear choices: the native Android
 * build, or installing this site as a PWA. The native option downloads the real
 * APK when the release exists, and falls back to the release page when it does
 * not — it never dead-ends on instructions alone.
 */
export const DownloadAppSheet: React.FC<DownloadAppSheetProps> = ({ open, onClose, pwa }) => {
  const [apk, setApk] = useState<ApkState>('checking');

  useEffect(() => {
    if (!open) return;
    let alive = true;
    setApk('checking');
    fetch(RELEASE_URL, { method: 'HEAD' })
      .then((res) => {
        if (alive) setApk(res.ok ? 'ready' : 'missing');
      })
      .catch(() => {
        if (alive) setApk('missing');
      });
    return () => {
      alive = false;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fade-in fixed inset-0 z-[60] flex items-end justify-center bg-slate-900/50 px-3 pb-3 sm:items-center sm:pb-0"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="download-title"
        className="sheet-enter max-h-[88vh] w-full max-w-md overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-2 border-b border-slate-200/80 px-5 py-4">
          <div>
            <h2 id="download-title" className="text-sm font-bold text-slate-900">
              Get the app
            </h2>
            <p className="mt-0.5 text-[11px] font-medium text-slate-500">
              Pick how you want Spends Data on your device.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-2.5 p-4">
          {/* Native */}
          <div className="rounded-xl border border-slate-200 p-3.5">
            <div className="flex items-start gap-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <Smartphone className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[12.5px] font-bold text-slate-900">
                  {DOWNLOAD_OPTIONS[0].title}
                </p>
                <p className="mt-0.5 text-[11px] font-medium leading-relaxed text-slate-500">
                  {DOWNLOAD_OPTIONS[0].subtitle}
                </p>
              </div>
            </div>

            <ul className="mt-2.5 space-y-1 pl-0.5">
              {DOWNLOAD_OPTIONS[0].bullets.map((b) => (
                <li key={b} className="flex items-center gap-1.5 text-[11px] font-medium text-slate-600">
                  <Check className="h-3 w-3 shrink-0 text-emerald-500" />
                  {b}
                </li>
              ))}
            </ul>

            {apk === 'ready' ? (
              <a
                href={APK_URL}
                className="mt-3 flex h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-indigo-600 text-[12px] font-bold text-white transition hover:bg-indigo-700"
              >
                <Download className="h-3.5 w-3.5" />
                Download APK
              </a>
            ) : (
              <div
                aria-disabled="true"
                className="mt-3 flex h-10 w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-300 bg-slate-50 text-[12px] font-bold text-slate-500"
              >
                <Clock className="h-3.5 w-3.5" />
                {apk === 'checking' ? 'Checking build…' : 'Android build not published yet'}
              </div>
            )}

            <p className="mt-2 text-[10.5px] font-medium leading-relaxed text-slate-400">
              {apk === 'ready' ? (
                <>After download, tap the file and allow “install from unknown sources”.</>
              ) : (
                <>
                  The Android build is not on the releases page yet. Until it is,
                  installing the website below gives you the same app — offline, full screen,
                  reminders included.
                </>
              )}
            </p>
          </div>

          {/* PWA */}
          <div className="rounded-xl border border-slate-200 p-3.5">
            <div className="flex items-start gap-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <MonitorDown className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[12.5px] font-bold text-slate-900">{DOWNLOAD_OPTIONS[1].title}</p>
                <p className="mt-0.5 text-[11px] font-medium leading-relaxed text-slate-500">
                  {DOWNLOAD_OPTIONS[1].subtitle}
                </p>
              </div>
            </div>

            <ul className="mt-2.5 space-y-1 pl-0.5">
              {DOWNLOAD_OPTIONS[1].bullets.map((b) => (
                <li key={b} className="flex items-center gap-1.5 text-[11px] font-medium text-slate-600">
                  <Check className="h-3 w-3 shrink-0 text-indigo-500" />
                  {b}
                </li>
              ))}
            </ul>

            {pwa.installed ? (
              <div className="mt-3 flex h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-50 text-[12px] font-bold text-emerald-700">
                <Check className="h-3.5 w-3.5" />
                Already installed
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  void pwa.install();
                }}
                className="mt-3 flex h-10 w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white text-[12px] font-bold text-slate-800 transition hover:bg-slate-50"
              >
                <MonitorDown className="h-3.5 w-3.5" />
                Install website
              </button>
            )}

            {pwa.manualSteps && (
              <p className="mt-2 rounded-lg bg-indigo-50 px-2.5 py-2 text-[10.5px] font-semibold leading-relaxed text-indigo-800">
                {pwa.manualSteps}
              </p>
            )}
          </div>
        </div>

        <div className="border-t border-slate-100 bg-slate-50/70 px-4 py-2.5">
          <a
            href={RELEASES_URL}
            target="_blank"
            rel="noreferrer"
            className="text-[10.5px] font-semibold text-slate-500 underline-offset-2 hover:text-slate-800 hover:underline"
          >
            All releases &amp; changelog
          </a>
        </div>
      </div>
    </div>
  );
};
