# Background email worker (optional)

Spends Data is a static, offline-first app: by default the weekly email is sent from the
app itself (Gmail compose or EmailJS). If you want the report to arrive **without opening
the app at all**, deploy this tiny worker. It stores one schedule per email in KV and runs
on a cron trigger.

> The worker only stores the schedule (email address, day, hour, timezone) plus the
> transaction snapshot you choose to sync. Your browser copy stays the source of truth.

## Files

- `worker.js` — Cloudflare Worker (cron + `/schedule` and `/push/*` endpoints)
- `webpush.mjs` — Web Push sender (VAPID + RFC 8291 encryption, Web Crypto only)
- `webpush.test.mjs` — checks the encryption against the RFC 8291 test vector
- `wrangler.toml` — configuration

## Deploy (about 2 minutes, free tier)

```bash
npm i -g wrangler
wrangler login

# 1. KV namespace for schedules
wrangler kv namespace create SPENDS_KV
# copy the returned id into wrangler.toml

# 2. Secrets used to send mail through EmailJS
wrangler secret put EMAILJS_SERVICE_ID
wrangler secret put EMAILJS_TEMPLATE_ID
wrangler secret put EMAILJS_PUBLIC_KEY
wrangler secret put WORKER_TOKEN      # optional shared secret

# 3. Web Push keys (see "Web Push" below)
wrangler secret put VAPID_PUBLIC_KEY
wrangler secret put VAPID_PRIVATE_KEY
wrangler secret put VAPID_SUBJECT     # e.g. mailto:you@example.com

# 4. Deploy
wrangler deploy
```

You get a URL like `https://spends-data-email.<account>.workers.dev`.

## Connect the app

1. Open **Reports** in Spends Data.
2. Fill in *Send to (Gmail)* and the day/time.
3. Paste the worker URL under **Background delivery** and press **Sync schedule**.

From then on the cron trigger checks every hour and emails the digest at the chosen day
and hour, whether or not the app is open. Turn it off by syncing with the schedule
disabled or deleting the KV key.

## EmailJS template variables

The worker posts the same variables the in-app sender uses:

```
to_email, subject, period, money_in, spends, balance, daily_avg,
top_category, entries, message, message_text, reply_to
```

Set `message` as the HTML body field in your EmailJS template.

## Web Push (background notifications)

The installed app can get reminders while it is closed. The browser subscribes with the
worker's VAPID public key, and the worker sends the reminder on the cron trigger.

Generate the keys once (Node 20+, nothing to install):

```bash
node -e "const c=require('crypto');const {publicKey:p,privateKey:v}=c.generateKeyPairSync('ec',{namedCurve:'P-256'});const j=p.export({format:'jwk'});console.log('VAPID_PUBLIC_KEY='+Buffer.concat([Buffer.from([4]),Buffer.from(j.x,'base64url'),Buffer.from(j.y,'base64url')]).toString('base64url'));console.log('VAPID_PRIVATE_KEY='+v.export({format:'jwk'}).d)"
```

Put the two values into `wrangler secret put` (step 3 above). Keep the private key secret.

Endpoints (JSON bodies; `Authorization: Bearer <WORKER_TOKEN>` when a token is set):

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/push/key` | Public VAPID key the browser needs before subscribing |
| POST | `/push/subscribe` | Save or update a device subscription and its reminder preferences |
| POST | `/push/unsubscribe` | Remove a device |
| POST | `/push/test` | Send one test notification to a device |

Reminders the cron sends once per local day, at the device's timezone:

- daily logging nudge at the chosen hour
- money-left alert, Saturday 20:30 (delivered in the 20:00 hour, because the cron runs hourly)
- weekly report reminder, Tuesday 10:00

Subscriptions are stored in KV under `push:<sha256 of endpoint>`. Dead subscriptions (HTTP 404/410 from the
push service) are removed automatically.

Limits: iPhone needs the app added to the Home Screen first. Browsers may delay pushes to save battery.
