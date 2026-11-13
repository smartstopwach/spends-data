import React, { useState } from 'react';
import { Check, Download, MonitorDown, Smartphone, WifiOff } from 'lucide-react';
import { ANDROID_APK_URL, RELEASES_URL } from '../utils/appDownload';
import { manualInstallSteps } from '../utils/pwaInstall';
import type { PwaState } from '../hooks/usePwa';

interface DownloadPageProps {
  pwa: Pick<PwaState, 'install' | 'installed' | 'canNativePrompt' | 'platform'>;
}

type InstallPhase = 'idle' | 'working' | 'dismissed' | 'manual';

const BENEFITS = [
  { icon: MonitorDown, text: 'Opens full screen from your home screen or app list' },
  { icon: WifiOff, text: 'Works offline after the first visit' },
  { icon: Smartphone, text: 'Same data as this browser, no account or app store' },
];

/**
 * Download tab. One button installs Spends Data as an app (PWA) through the
 * browser's own install dialog. Where that dialog is not available (iPhone,
 * Firefox), the exact steps for that device are shown instead.
 */
export const DownloadPage: React.FC<DownloadPageProps> = ({ pwa }) => {
  const [phase, setPhase] = useState<InstallPhase>('idle');
  const [message, setMessage] = useState<string | null>(null);

  const onDownload = async () => {
    setPhase('working');
    setMessage(null);
    const result = await pwa.install();
    if (result === 'installed') {
      setPhase('idle');
      setMessage('Spends Data is installed. Open it from your home screen or app list.');
    } else if (result === 'dismissed') {
      setPhase('dismissed');
      setMessage('Install was cancelled. Tap Download app again whenever you like.');
    } else {
      setPhase('manual');
    }
  };

  const showSteps = !pwa.installed && (phase === 'manual' || (!pwa.canNativePrompt && pwa.platform !== 'installed'));

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-3 sm:mb-4">
        <h1 className="flex items-center gap-2 text-base font-bold tracking-tight text-slate-900 sm:text-xl">
          <Download className="h-4 w-4 text-indigo-500" />
          Download app
        </h1>
        <p className="mt-1 text-[11px] font-medium text-slate-500 sm:text-[12px]">
          Install Spends Data on your phone or computer, or get the Android app. Same data, same offline behaviour.
        </p>
      </div>

      <section className="panel overflow-hidden border-indigo-200">
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:p-5">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-lg font-extrabold text-white shadow-sm">
            ₹
          </span>

          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-bold text-slate-900">Spends Data app</h2>
            <p className="mt-0.5 text-[11px] font-medium text-slate-500">Free · no sign-up · about 1 MB</p>

            <ul className="mt-3 space-y-1.5">
              {BENEFITS.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-2 text-[11.5px] font-medium text-slate-600">
                  <Icon className="h-3.5 w-3.5 shrink-0 text-indigo-500" />
                  {text}
                </li>
              ))}
            </ul>

            <div className="mt-4">
              {pwa.installed ? (
                <div className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-50 text-[13px] font-bold text-emerald-700 sm:w-auto sm:px-8">
                  <Check className="h-4 w-4" />
                  Installed on this device
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => void onDownload()}
                  disabled={phase === 'working'}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 text-[14px] font-bold text-white shadow-sm transition hover:bg-indigo-700 active:scale-[0.99] disabled:opacity-70 sm:w-auto sm:px-8"
                >
                  <Download className="h-4 w-4" />
                  {phase === 'working' ? 'Opening install…' : 'Download app'}
                </button>
              )}

              {message && (
                <p className="mt-2.5 text-[11.5px] font-semibold text-slate-600" role="status">
                  {message}
                </p>
              )}

              {showSteps && (
                <div className="mt-3 rounded-lg bg-indigo-50 px-3 py-2.5 text-[11.5px] font-semibold leading-relaxed text-indigo-800">
                  <p className="mb-0.5 text-[10px] font-bold uppercase tracking-wide text-indigo-500">
                    How to install
                  </p>
                  {manualInstallSteps(pwa.platform)}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="panel mt-3 overflow-hidden sm:mt-4">
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:p-5">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-sm">
            <Smartphone className="h-6 w-6" />
          </span>

          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-bold text-slate-900">Android app (APK)</h2>
            <p className="mt-0.5 text-[11px] font-medium text-slate-500">
              Native Android build · reminders work with the app closed
            </p>
            <p className="mt-2.5 text-[11.5px] font-medium leading-relaxed text-slate-600">
              Download the APK, open it on your phone and allow installs from this source.
            </p>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <a
                href={ANDROID_APK_URL}
                download="spends-data.apk"
                className="flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 text-[14px] font-bold text-white shadow-sm transition hover:bg-emerald-700 active:scale-[0.99] sm:px-8"
              >
                <Download className="h-4 w-4" />
                Download APK
              </a>
              <a
                href={RELEASES_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-[12px] font-semibold text-slate-700 hover:bg-slate-50"
              >
                All releases
              </a>
            </div>
            <p className="mt-2.5 text-[10.5px] font-medium text-slate-400">
              If the file is not there yet, the first Android build has not been published. Check back after it finishes.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
