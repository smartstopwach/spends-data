# Building the Spends Data Android APK

The app code, Capacitor project and icons are all finished. The only step that cannot run
here is the Java/Android compile itself (no JDK or Android SDK in this environment, and
package downloads are blocked). Two ways to get the APK — both take a few minutes.

---

## Option 1 — GitHub Actions (recommended, produces a downloadable APK for your phone)

**One-time setup (2 minutes):**

1. Create the folder `.github/workflows/` in the repo (GitHub website → **Add file → Create
   new file** → type `.github/workflows/android-release.yml`).
2. Paste the contents of [`ci/android-release.yml`](../ci/android-release.yml) and commit.
   > The GitHub App used by this session is not allowed to create workflow files, which is
   > why the file lives in `ci/` for you to move. Any owner/maintainer can do it in the UI.
3. Open the **Actions** tab → **Build Android app** → **Run workflow**.

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
