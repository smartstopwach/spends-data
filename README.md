# Spends Data — Personal Expense Tracker

A clean, fast, easy-to-use web app to record **money coming in (+)** and **daily spends (−)**, keep a running balance and email yourself a weekly or custom-range spend report.

## Features

- **Money In (+)**: home allowance, gift, stipend or refund added straight to the wallet.
- **Spends (−) with inline math**: type `40 + 25 + 60` in the amount box and it calculates `= ₹125` live.
- **Recent entries ledger**: day-wise grouping with per-day totals, tabs (All activity / Spends / Money in), search, newest↔oldest sort and one-click delete.
- **Monthly trend chart**: smooth gradient area chart with hover tooltips plus Spends / Money in / Savings toggles.
- **Weekly email report**: pick your Gmail, choose the day/time, and get an itemised report (summary, category split, day-by-day entries). One click opens Gmail compose, or configure EmailJS for fully automatic sending.
- **Custom date ranges**: last 7 days, last 14 days, this month or any from → to dates.
- **Data ownership**: everything stays in your browser's localStorage — no login, no server. Export CSV or a JSON backup any time.
- **Installable app**: the Download tab installs Spends Data on your phone or computer with one tap. It opens full screen and works offline after the first visit.
- **Background notifications**: daily logging, money-left and weekly report reminders still arrive when the app is closed — via Web Push in the installed app, and via OS-level scheduling in the Android app.
- **Android APK**: built by the *Build Android app* GitHub workflow (see `docs/BUILD_APK.md`).
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

## Background notifications

- **Installed app (PWA)**: Settings → Notifications → *Background notifications* → **Turn on**. Works in Chrome, Edge and Android browsers. On iPhone, add Spends Data to the Home Screen first (iOS 16.4+). It needs the worker from the next section.
- **Android app**: reminders are scheduled by Android itself. *Phone reminders (Android)* → **Re-schedule** keeps them in sync with Settings.

Both use the same schedule: evening daily reminder at your chosen hour (default 8 PM), money-left alert Saturday 8:30 PM, weekly report reminder Tuesday 7 PM.

## Background email (optional)

By default the weekly report is sent from the app (Gmail compose or EmailJS). For delivery
while the app is closed, deploy the tiny Cloudflare Worker in [`functions/`](functions/README.md)
and paste its URL in **Reports → Background delivery → Sync schedule**. The worker runs
hourly on a cron trigger and emails the digest at your chosen day/time. The same worker
also delivers Web Push notifications — see [`functions/README.md`](functions/README.md#web-push-background-notifications).
