import React from 'react';
import { ArrowRight, Check, Clock, Download, MonitorDown, Smartphone } from 'lucide-react';
import { APP_VERSION } from '../version';
import {
  ANDROID_WORKFLOW_URL,
  APK_URL,
  apkAvailabilityFromResponse,
  RELEASE_API_URL,
  RELEASE_TAG,
  RELEASE_URL,
  RELEASES_URL,
} from '../utils/downloads';
import { PwaState } from '../hooks/usePwa';

interface DownloadPageProps {
  pwa: Pick<PwaState, 'install' | 'installed' | 'manualSteps'>;
}

type ApkState = 'checking' | 'ready' | 'missing' | 'unknown';

/**
 * Standalone "Download" tab: the only place a user needs to go to put Spends
 * Data on a device. Native APK first, website install second, and the state of
 * the build is always shown honestly.
 */
export const DownloadPage: React.FC<DownloadPageProps> = ({ pwa }) => {
  const [apk, setApk] = React.useState<ApkState>('checking');

  React.useEffect(() => {
    let alive = true;
    fetch(RELEASE_API_URL, { headers: { Accept: 'application/vnd.github+json' } })
      .then(async (res) => {
        const release = res.ok ? await res.json().catch(() => null) : null;
        if (alive) setApk(apkAvailabilityFromResponse(res.status, release));
      })
      .catch(() => {
        if (alive) setApk('unknown');
      });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-3 sm:mb-4">
        <h1 className="flex items-center gap-2 text-base font-bold tracking-tight text-slate-900 sm:text-xl">
          <Download className="h-4 w-4 text-indigo-500" />
          Download app
        </h1>
        <p className="mt-1 text-[11px] font-medium text-slate-500 sm:text-[12px]">
          Spends Data on your phone — same data, same offline behaviour.
        </p>
      </div>

      {/* ── Native Android ─────────────────────────────────────────── */}
      <section className="panel overflow-hidden">
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:p-5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <Smartphone className="h-5 w-5" />
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900">Android app (APK)</h2>
              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                v{APP_VERSION}
              </span>
            </div>
            <p className="mt-1 text-[11.5px] font-medium leading-relaxed text-slate-500">
              The full app in your app drawer. Works offline and reminders fire even when the app
              is closed.
            </p>

            <ul className="mt-2.5 grid gap-1.5 sm:grid-cols-2">
              {[
                'Android 8 or newer',
                'No account, no sign-up',
                'Updates as `android-v' + APP_VERSION + '`',
                'Installs in one tap',
              ].map((f) => (
                <li
                  key={f}
                  className="flex items-center gap-1.5 text-[11px] font-medium text-slate-600"
                >
                  <Check className="h-3 w-3 shrink-0 text-emerald-500" />
                  {f}
                </li>
              ))}
            </ul>

            <div className="mt-3.5">
              {apk === 'missing' ? (
                <div className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 text-[12px] font-bold text-slate-500 sm:w-auto sm:px-6">
                  <Clock className="h-4 w-4" />
                  Build not published yet
                </div>
              ) : (
                <a
                  href={APK_URL}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 text-[13px] font-bold text-white transition hover:bg-indigo-700 active:scale-[0.99] sm:w-auto sm:px-6"
                >
                  <Download className="h-4 w-4" />
                  {apk === 'checking' ? 'Checking build…' : 'Download APK'}
                </a>
              )}

              <p className="mt-2 text-[10.5px] font-medium leading-relaxed text-slate-400">
                {apk === 'missing' ? (
                  <>
                    The APK is not on the releases page yet. Run the{' '}
                    <a
                      href={ANDROID_WORKFLOW_URL}
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold text-indigo-600 underline"
                    >
                      Build Android app
                    </a>{' '}
                    workflow from the Actions tab, then this button turns into a real download.
                  </>
                ) : (
                  <>Tap the downloaded file, then allow “install from unknown sources”.</>
                )}
              </p>

              <a
                href={RELEASE_URL}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-block text-[11px] font-semibold text-indigo-600 underline"
              >
                Open {RELEASE_TAG} on GitHub
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── PWA ────────────────────────────────────────────────────── */}
      <section className="panel mt-3 overflow-hidden sm:mt-4">
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:p-5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <MonitorDown className="h-5 w-5" />
          </span>

          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-bold text-slate-900">Install this website</h2>
            <p className="mt-1 text-[11.5px] font-medium leading-relaxed text-slate-500">
              Adds Spends Data to your home screen straight from the browser. Nothing to download,
              works offline after the first load.
            </p>

            {pwa.installed ? (
              <div className="mt-3.5 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-50 text-[12px] font-bold text-emerald-700 sm:w-auto sm:px-6">
                <Check className="h-4 w-4" />
                Already installed
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  void pwa.install();
                }}
                className="mt-3.5 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-[13px] font-bold text-slate-800 transition hover:bg-slate-50 active:scale-[0.99] sm:w-auto sm:px-6"
              >
                <MonitorDown className="h-4 w-4" />
                Install website
              </button>
            )}

            {pwa.manualSteps && (
              <p className="mt-2 rounded-lg bg-indigo-50 px-2.5 py-2 text-[11px] font-semibold leading-relaxed text-indigo-800">
                {pwa.manualSteps}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ── Releases ───────────────────────────────────────────────── */}
      <a
        href={RELEASES_URL}
        target="_blank"
        rel="noreferrer"
        className="panel mt-3 flex items-center justify-between gap-3 p-4 transition hover:bg-slate-50 sm:mt-4"
      >
        <div className="min-w-0">
          <p className="text-[12px] font-bold text-slate-900">All releases</p>
          <p className="mt-0.5 truncate text-[11px] font-medium text-slate-500">
            Every build, including <span className="num">{RELEASE_TAG}</span>
          </p>
        </div>
        <ArrowRight className="h-4 w-4 shrink-0 text-slate-400" />
      </a>
    </div>
  );
};
