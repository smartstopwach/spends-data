# Building the Spends Data Android APK

The app code, Capacitor project and icons are all finished. The only step that cannot run
here is the Java/Android compile itself (no JDK or Android SDK in this environment, and
package downloads are blocked). Two ways to get the APK — both take a few minutes.

---

## Option 1 — GitHub Actions (recommended, produces a downloadable APK for your phone)

**Setup:** the workflow runs on every push that touches the app. The working copy is
[`ci/android-release.yml`](../ci/android-release.yml). Copy it over
`.github/workflows/android-release.yml` once (GitHub web UI → open the file → pencil icon →
paste → commit). The session's GitHub App is not allowed to change workflow files, which is
why this one step is manual. Then:

1. Open the **Actions** tab → **Build Android app** → **Run workflow**.
2. When it is green, the GitHub Release `android-v<version>` exists and the
   **Download APK** button in the app's Download tab turns into a real download.

**What you get:**

- Artifacts: `spends-data-<version>-debug.apk` and `spends-data-<version>-release.aab`
- A GitHub **Release** tagged `android-v<version>` with both files attached.

**Install on your phone:** open the release on the phone, download the `.apk`, tap it and
allow *install from unknown sources*. That's the real app — home-screen icon, splash screen,
background reminders.

The workflow runs automatically on every push to the app branch after that.

---

## Option 2 — Locally with Android Studio

```bash
npm install
npm run android        # builds web, syncs Capacitor, opens Android Studio
```

In Android Studio: **Build → Build App Bundle(s) / APK(s) → Build APK(s)**.
APK lands in `android/app/build/outputs/apk/debug/`.

For the Play Store bundle:

```bash
npm run android:bundle
# → android/app/build/outputs/bundle/release/app-release.aab
```

Sign it with your upload keystore before uploading (see `docs/APP_RELEASE.md`).

---

## What is already configured

| Item | Value |
| --- | --- |
| App name / ID | Spends Data · `app.spendsdata.tracker` |
| Version | `1.1.0` (code `2`) |
| Icons | adaptive + round, all densities, brand `#4338CA` |
| Splash | brand gradient with rupee mark, all densities |
| Notification icon | `res/drawable/ic_stat_spends.png` |
| Permissions | notifications, exact alarms, boot-complete, vibrate, internet |
| Plugins | local notifications, haptics, share, status bar, splash screen |
| Commands | `npm run android` · `android:apk` · `android:bundle` |

Nothing else is missing — only the signing keys (yours to create) for a Play Store upload.
