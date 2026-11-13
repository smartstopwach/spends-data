/**
 * Where the installable builds live.
 *
 * The native build is produced by `ci/android-release.yml` (copy it to
 * `.github/workflows/` to run it) and published to a GitHub Release per app
 * version — so the download URL lines up exactly with `APP_VERSION`.
 */
import { APP_VERSION } from '../version';

export const REPO_URL = 'https://github.com/smartstopwach/spends-data';
export const RELEASES_URL = `${REPO_URL}/releases`;
export const RELEASE_TAG = `android-v${APP_VERSION}`;
export const APK_FILE = `spends-data-${APP_VERSION}-debug.apk`;
export const AAB_FILE = `spends-data-${APP_VERSION}-release.aab`;

export const APK_URL = `${REPO_URL}/releases/download/${RELEASE_TAG}/${APK_FILE}`;
export const RELEASE_URL = `${REPO_URL}/releases/tag/${RELEASE_TAG}`;
/** The releases HTML page does not send CORS headers, so a browser cannot read it.
 *  The REST endpoint does, and tells us whether the APK asset really exists. */
export const RELEASE_API_URL = `https://api.github.com/repos/smartstopwach/spends-data/releases/tags/${RELEASE_TAG}`;
export const ANDROID_WORKFLOW_URL = `${REPO_URL}/actions/workflows/android-release.yml`;

export interface DownloadOption {
  id: 'native' | 'pwa';
  title: string;
  subtitle: string;
  bullets: string[];
}

export const DOWNLOAD_OPTIONS: DownloadOption[] = [
  {
    id: 'native',
    title: 'Native Android app',
    subtitle: 'Full app — works offline, reminders fire with the app closed.',
    bullets: ['APK file, ~4 MB', 'Android 8 or newer', 'Updates when a new version ships'],
  },
  {
    id: 'pwa',
    title: 'Install this website',
    subtitle: 'Adds Spends Data to your home screen from the browser. No download.',
    bullets: ['Instant — nothing to download', 'Works offline after first load', 'Same data, same browser'],
  },
];

export type ApkAvailability = 'ready' | 'missing' | 'unknown';

/**
 * Decide what the Download tab should show from the GitHub REST response for the
 * release tag. 404 → no release yet; 2xx → only "ready" when the APK asset is attached;
 * anything else (rate limit, offline, 5xx) → unknown, so we never claim it is missing.
 */
export function apkAvailabilityFromResponse(
  status: number,
  release?: { assets?: Array<{ name: string }> } | null
): ApkAvailability {
  if (status === 404) return 'missing';
  if (status < 200 || status >= 300) return 'unknown';
  const hasApk = (release?.assets ?? []).some((asset) => asset.name === APK_FILE);
  return hasApk ? 'ready' : 'missing';
}
