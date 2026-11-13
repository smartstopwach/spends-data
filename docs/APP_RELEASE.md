# Shipping Spends Data as an installable app

Spends Data ships as a **Progressive Web App** first (instant install from the browser,
no store review), and the same `dist/` bundle can be wrapped with **Capacitor** for a
Google Play Store release.

## 1. Web / PWA release (what GitHub Pages already serves)

```bash
npm run build   # writes dist/ + syncs index.html, assets/, manifest, icons and sw.js to the repo root
```

What the build produces:

| File | Purpose |
| --- | --- |
| `index.html` + `assets/app-<hash>.js/css` | Hashed, cache-busted app bundle |
| `manifest.webmanifest` | Install metadata, icons, shortcuts |
| `sw.js` | Offline shell, asset caching, instant update flow |
| `icon-192.png`, `icon-512.png` | Standard app icons |
| `maskable-192/512.png` | Adaptive (Android) icons |
| `apple-touch-icon.png` | iOS home-screen icon |

Install flow: open the site → browser shows **Install Spends Data** → the app opens
full-screen with no address bar and works offline. A new deploy triggers the in-app
**Update available → Restart** banner (`src/hooks/usePwa.ts`).

### Releasing a new version

1. Bump `APP_VERSION` in `src/version.ts` and add a changelog entry (this powers the
   "What's new" sheet shown once per version).
2. Bump `VERSION` inside `public/sw.js` so old caches are purged.
3. Bump `version` in `package.json`.
4. `npm run build` and push — the service worker picks the update up automatically.

## 2. Google Play Store release (Capacitor)

One-time setup:

```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap add android
```

Every release:

```bash
npm run build          # rebuilds dist/
npx cap sync android   # copies dist/ into the Android project
npx cap open android   # opens Android Studio
```

In Android Studio:

- **Application ID**: `app.spendsdata.tracker` (already set in `capacitor.config.ts`)
- **Version code / name**: `versionCode` must increase on every upload, `versionName`
  should match `APP_VERSION` (e.g. `1.1.0`).
- **Signing**: *Build → Generate Signed Bundle / APK* → create an upload keystore,
  then build an **Android App Bundle (.aab)**.
- **Store listing assets**: use `public/icon-512.png` for the store icon, and capture
  phone screenshots from the running app.

Play Console checklist:

- [ ] App name: **Spends Data**
- [ ] Short description: `Track spends, money in and balance — offline, no account.`
- [ ] Full description: highlights inline math, transactions history, weekly email
      reports, offline PWA, data stored on device
- [ ] Data safety form: **no data collected or shared**; data stays in local storage
- [ ] Privacy policy URL (a short static page is enough)
- [ ] Content rating questionnaire → Finance / Productivity utility
- [ ] Internal testing track first, then production rollout

## 3. Notes

- Everything runs client-side: no backend, no accounts, no analytics calls.
- Weekly email reports use either Gmail compose (manual send) or EmailJS (automatic),
  configured by the user inside the app.
- localStorage keys are versioned (`spends_data_*`, `ghar_ka_hisaab_*`) so existing
  installs keep their data.
