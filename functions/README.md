# Background email worker (optional)

Spends Data is a static, offline-first app: by default the weekly email is sent from the
app itself (Gmail compose or EmailJS). If you want the report to arrive **without opening
the app at all**, deploy this tiny worker. It stores one schedule per email in KV and runs
on a cron trigger.

> The worker only stores the schedule (email address, day, hour, timezone) plus the
> transaction snapshot you choose to sync. Your browser copy stays the source of truth.

## Files

- `worker.js` — Cloudflare Worker (cron + `/schedule` endpoint)
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

# 3. Deploy
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
