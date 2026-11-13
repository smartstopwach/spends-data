# Spends Data — Android release guide (Capacitor)

Spends Data is now a **two-target app** from one codebase:

| Target | What it is | Where it ships |
| --- | --- | --- |
| **Web / PWA** | Installable, offline, auto-updating | `https://smartstopwach.github.io/spends-data/` |
| **Android app** | Real APK/AAB wrapped with Capacitor, OS-level scheduled notifications | Google Play Store |

The Android project lives in `android/` and is already generated and configured.

## Project configuration

| Setting | Value |
| --- | --- |
| App name | Spends Data |
| Application ID | `app.spendsdata.tracker` |
| Version name / code | `1.1.0` / `2` (`android/app/build.gradle`) |
| Web dir | `dist` (`capacitor.config.ts`) |
| Icons | `res/mipmap-*` generated from `public/icon-512.png` (adaptive, background `#4338CA`) |
| Splash | `res/drawable-*/splash.png` brand gradient with the rupee mark |
| Notification icon | `res/drawable/ic_stat_spends.png` |

### Permissions declared

```
POST_NOTIFICATIONS      # Android 13+ notification permission
SCHEDULE_EXACT_ALARM    # fire reminders at the chosen time
USE_EXACT_ALARM
RECEIVE_BOOT_COMPLETED  # re-arm reminders after a reboot
VIBRATE
INTERNET
```

## Everyday workflow

```bash
npm run android:apk      # build web → sync → assembleDebug APK
npm run android:bundle   # build web → sync → signed release AAB
npm run android          # build web → sync → open Android Studio
```

Output APK: `android/app/build/outputs/apk/debug/app-debug.apk`
Output AAB: `android/app/build/outputs/bundle/release/app-release.aab`

### First-run prerequisites

- JDK 17 and Android Studio (or the Android SDK + `ANDROID_HOME`).
- `android/local.properties` with `sdk.dir=/path/to/Android/sdk` (created by Android Studio).

## Signing a release build

```bash
keytool -genkey -v -keystore spends-data-release.jks \
  -keyalg RSA -keysize 2048 -validity 10000 -alias spendsdata
```

Create `android/keystore.properties` (never commit it — it is git-ignored):

```properties
storeFile=../spends-data-release.jks
storePassword=********
keyAlias=spendsdata
keyPassword=********
```

Then in `android/app/build.gradle` add a `signingConfigs.release` block referencing those
properties and apply it to `buildTypes.release`. Build the bundle with
`npm run android:bundle`.

## What the native build adds over the PWA

- **Background reminders** — `@capacitor/local-notifications` schedules repeating
  notifications *inside the OS*, so they arrive even when the app is closed or the phone
  restarts. The app mirrors its notification settings into native scheduling automatically
  (`src/hooks/useNotifications.ts` → `scheduleNativeReminders`).
- **Native haptics** — `@capacitor/haptics` impact feedback instead of `navigator.vibrate`.
- **Native share sheet** — `@capacitor/share`.
- **Status bar + splash** styling matched to the brand (`@capacitor/status-bar`,
  `@capacitor/splash-screen`).
- Offline-first behaviour still comes from the bundled `dist/` inside the app.

## Play Console checklist

- [ ] App name: **Spends Data**
- [ ] Short description: `Track spends, money in and balance — offline, no account.`
- [ ] Full description: inline math amounts, day-wise history, category breakdown,
      weekly email reports, offline support, data stays on device
- [ ] Data safety: **no data collected**, no data shared, no trackers
- [ ] Notifications declared as *optional* (daily reminder, budget alert, report reminder)
- [ ] Privacy policy URL
- [ ] Content rating: Finance / Productivity utility
- [ ] Upload to **Internal testing** first → Production rollout
- [ ] Screenshots from a phone (portrait) + the 512×512 icon from `public/icon-512.png`

## Releasing an update

1. Bump `APP_VERSION` in `src/version.ts` + changelog entry (web "What's new" sheet).
2. Bump `VERSION` in `public/sw.js` (cache busting).
3. Bump `versionCode` **and** `versionName` in `android/app/build.gradle`.
4. `npm run build` and push for the web/PWA release.
5. `npm run android:bundle` and upload the new `.aab` to Play Console.
