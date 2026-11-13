# Spends Data — Personal Expense Tracker

A clean, fast, easy-to-use web app to record **money coming in (+)** and **daily spends (−)**, keep a running balance and email yourself a weekly or custom-range spend report.

## Features

- **Money In (+)**: home allowance, gift, stipend or refund added straight to the wallet.
- **Spends (−) with inline math**: type `40 + 25 + 60` in the amount box and it calculates `= ₹125` live.
- **Recent entries ledger**: day-wise grouping with per-day totals, tabs (All activity / Spends / Money in), search, newest↔oldest sort and one-click delete.
- **Monthly trend chart**: smooth gradient area chart with hover tooltips, budget pace line and a Money-in toggle.
- **Weekly email report**: pick your Gmail, choose the day/time, and get an itemised report (summary, category split, day-by-day entries). One click opens Gmail compose, or configure EmailJS for fully automatic sending.
- **Custom date ranges**: last 7 days, last 14 days, this month or any from → to dates.
- **Data ownership**: everything stays in your browser's localStorage — no login, no server. Export CSV or a JSON backup any time.
- **Static and fast**: pure frontend, hashed assets, works on GitHub Pages.

## Local development

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # vitest suite
npm run build    # builds dist/ and syncs index.html + hashed assets to the repo root
```

## Deploy

Pushing to the deployed branch rebuilds the site automatically. The build writes a prebuilt `index.html` plus content-hashed `assets/` at the repo root so it runs on legacy GitHub Pages without any server.

## Android app

Spends Data also ships as a real Android app (Capacitor wrapper in `android/`) with
home-screen icon, splash screen and OS-level scheduled reminders that fire even when the
app is closed.

```bash
npm run build:mobile    # web build + cap sync
npm run android         # open in Android Studio
```

To get an installable APK without a local Android SDK, follow
[`docs/BUILD_APK.md`](docs/BUILD_APK.md) — it builds through GitHub Actions in a couple of
minutes and publishes the APK to a GitHub Release.
