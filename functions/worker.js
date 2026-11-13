/**
 * Spends Data — background email worker (Cloudflare Workers + KV + cron).
 * Receives the user's report schedule and sends the digest with EmailJS.
 */

import { bytesToB64u, sha256Hex, sendWebPush } from './webpush.mjs';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/* Reminder timing: keep in sync with src/utils/reminderPlan.ts.
 * The cron runs at the top of every hour, so the 20:30 money-left slot is delivered at 20:00 local. */
const WALLET_SLOT = { weekday: 6, hour: 20 };
const REPORT_SLOT = { weekday: 2, hour: 10 };
const PUSH_PREFIX = 'push:';

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });

const inr = (value) =>
  `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.round(value || 0))}`;

const shortDate = (iso) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });

function buildDigest(payload) {
  const fromISO = payload.fromISO;
  const toISO = payload.toISO;
  const transactions = Array.isArray(payload.transactions) ? payload.transactions : [];
  const windowTx = transactions.filter((tx) => tx.date >= fromISO && tx.date <= toISO);

  let income = 0;
  let spend = 0;
  const categories = new Map();
  const days = new Map();

  for (const tx of windowTx) {
    const day = days.get(tx.date) || { spend: 0, income: 0, items: [] };
    day.items.push(tx);
    if (tx.type === 'income') {
      income += tx.amount;
      day.income += tx.amount;
    } else {
      spend += tx.amount;
      day.spend += tx.amount;
      categories.set(tx.category, (categories.get(tx.category) || 0) + tx.amount);
    }
    days.set(tx.date, day);
  }

  const wallet = transactions.reduce(
    (sum, tx) => sum + (tx.type === 'income' ? tx.amount : -tx.amount),
    0
  );
  const top = [...categories.entries()].sort((a, b) => b[1] - a[1])[0];

  const text = [
    'SPENDS DATA — SPEND REPORT',
    `${shortDate(fromISO)} – ${shortDate(toISO)}`,
    '',
    `Money in : ${inr(income)}`,
    `Spends   : ${inr(spend)}`,
    `Balance  : ${inr(wallet)}`,
    '',
    'HOW THE MONEY WAS SPENT',
    ...[...days.entries()]
      .sort((a, b) => b[0].localeCompare(a[0]))
      .flatMap(([date, day]) => [
        `${shortDate(date)} — spend ${inr(day.spend)}`,
        ...day.items.map(
          (item) => `  ${item.type === 'income' ? '+' : '-'}${inr(item.amount)} ${item.note || ''}`
        ),
      ]),
  ].join('\n');

  const html = `
  <div style="font-family:Inter,Arial,sans-serif;background:#eef1f6;padding:24px 12px">
    <div style="max-width:600px;margin:0 auto;background:#fff;border:1px solid #e3e8ef;border-radius:16px;overflow:hidden">
      <div style="background:linear-gradient(135deg,#1e1b4b,#4338ca);padding:22px 24px;color:#fff">
        <p style="margin:0;font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:#c7d2fe;font-weight:700">Spends Data</p>
        <h1 style="margin:8px 0 0;font-size:20px;font-weight:800">Spend report</h1>
        <p style="margin:6px 0 0;font-size:12px;color:#c7d2fe">${shortDate(
          fromISO
        )} – ${shortDate(toISO)}</p>
      </div>
      <div style="padding:20px 24px">
        <table style="width:100%;border-collapse:collapse;margin-bottom:18px">
          <tr>
            <td style="padding:10px;background:#f8fafc;border-radius:10px;font-size:11px;color:#64748b">Money in<br><strong style="font-size:15px;color:#059669">${inr(
              income
            )}</strong></td>
            <td style="width:8px"></td>
            <td style="padding:10px;background:#f8fafc;border-radius:10px;font-size:11px;color:#64748b">Spends<br><strong style="font-size:15px;color:#0f172a">${inr(
              spend
            )}</strong></td>
            <td style="width:8px"></td>
            <td style="padding:10px;background:#f8fafc;border-radius:10px;font-size:11px;color:#64748b">Balance<br><strong style="font-size:15px;color:#4f46e5">${inr(
              wallet
            )}</strong></td>
          </tr>
        </table>
        <p style="margin:0 0 6px;font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#94a3b8">How the money was spent</p>
        <table style="width:100%;border-collapse:collapse">
          ${[...categories.entries()]
            .sort((a, b) => b[1] - a[1])
            .map(
              ([category, amount]) =>
                `<tr><td style="padding:6px 0;font-size:12px;color:#334155">${category}</td><td style="padding:6px 0;font-size:12px;font-weight:700;text-align:right;color:#0f172a">${inr(
                  amount
                )}</td></tr>`
            )
            .join('')}
        </table>
        <p style="margin:18px 0 6px;font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#94a3b8">Day by day</p>
        <table style="width:100%;border-collapse:collapse">
          ${[...days.entries()]
            .sort((a, b) => b[0].localeCompare(a[0]))
            .map(
              ([date, day]) =>
                `<tr><td style="padding:5px 0;font-size:12px;color:#64748b">${shortDate(
                  date
                )}</td><td style="padding:5px 0;font-size:12px;font-weight:600;text-align:right;color:#0f172a">−${inr(
                  day.spend
                )}</td><td style="padding:5px 0 5px 10px;font-size:12px;text-align:right;color:#059669">${
                  day.income > 0 ? `+${inr(day.income)}` : ''
                }</td></tr>`
            )
            .join('')}
        </table>
        ${
          top
            ? `<p style="margin:16px 0 0;font-size:11px;color:#64748b">Top category: <strong style="color:#0f172a">${top[0]}</strong> · ${inr(
                top[1]
              )}</p>`
            : ''
        }
      </div>
      <div style="padding:12px 24px;border-top:1px solid #eef2f6;font-size:10px;color:#a8b3c2">
        Sent automatically by Spends Data.
      </div>
    </div>
  </div>`;

  return {
    subject: `Spends Data · ${inr(spend)} spent · ${shortDate(fromISO)} – ${shortDate(toISO)}`,
    text,
    html,
    stats: { income, spend, wallet, topCategory: top ? top[0] : '—' },
  };
}

async function sendWithEmailJS(env, toEmail, digest) {
  const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      service_id: env.EMAILJS_SERVICE_ID,
      template_id: env.EMAILJS_TEMPLATE_ID,
      user_id: env.EMAILJS_PUBLIC_KEY,
      template_params: {
        to_email: toEmail,
        subject: digest.subject,
        period: digest.subject,
        money_in: inr(digest.stats.income),
        spends: inr(digest.stats.spend),
        balance: inr(digest.stats.wallet),
        top_category: digest.stats.topCategory,
        message: digest.html,
        message_text: digest.text,
        reply_to: toEmail,
      },
    }),
  });

  if (!res.ok) throw new Error(`EmailJS ${res.status}: ${(await res.text()).slice(0, 160)}`);
}

/** Local date / hour / ISO weekday for a timezone (falls back to UTC). */
function localParts(date, timeZone) {
  let zone = timeZone || 'UTC';
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: zone });
  } catch {
    zone = 'UTC';
  }
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: zone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      hourCycle: 'h23',
      weekday: 'short',
    })
      .formatToParts(date)
      .map((part) => [part.type, part.value])
  );
  const weekdays = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    hour: Number(parts.hour),
    weekday: weekdays[parts.weekday],
  };
}

const isHttps = (value) => typeof value === 'string' && /^https:\/\//.test(value);

function sanitizePrefs(input = {}) {
  const hour = Number(input.daily?.hour);
  return {
    daily: {
      enabled: Boolean(input.daily?.enabled),
      hour: Number.isInteger(hour) && hour >= 0 && hour <= 23 ? hour : 9,
    },
    wallet: Boolean(input.wallet),
    report: Boolean(input.report),
  };
}

async function handleSubscribe(body, env) {
  const sub = body.subscription;
  if (!sub || !isHttps(sub.endpoint) || !sub.keys?.p256dh || !sub.keys?.auth) {
    return json({ error: 'Invalid push subscription' }, 400);
  }
  const key = PUSH_PREFIX + (await sha256Hex(sub.endpoint));
  const existing = await env.SPENDS_KV.get(key, 'json');
  await env.SPENDS_KV.put(
    key,
    JSON.stringify({
      subscription: { endpoint: sub.endpoint, keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth } },
      prefs: sanitizePrefs(body.prefs),
      timezone: typeof body.timezone === 'string' ? body.timezone : 'UTC',
      lastSent: existing?.lastSent ?? { daily: null, wallet: null, report: null },
      updatedAt: new Date().toISOString(),
    })
  );
  return json({ message: 'Background notifications are on for this device.' });
}

async function handleUnsubscribe(body, env) {
  if (!isHttps(body.endpoint)) return json({ error: 'Invalid endpoint' }, 400);
  await env.SPENDS_KV.delete(PUSH_PREFIX + (await sha256Hex(body.endpoint)));
  return json({ message: 'Background notifications are off for this device.' });
}

async function handleTest(body, env) {
  if (!isHttps(body.endpoint)) return json({ error: 'Invalid endpoint' }, 400);
  const key = PUSH_PREFIX + (await sha256Hex(body.endpoint));
  const record = await env.SPENDS_KV.get(key, 'json');
  if (!record) return json({ error: 'Turn on background notifications first.' }, 404);
  const result = await sendWebPush(
    record.subscription,
    { title: 'Spends Data', body: 'Background notifications are working.', tag: 'test', url: './' },
    env
  );
  if (result.status === 404 || result.status === 410) {
    await env.SPENDS_KV.delete(key);
    return json({ error: 'This browser subscription has expired. Turn it on again.' }, 410);
  }
  if (!result.ok) return json({ error: `Push service ${result.status}` }, 502);
  return json({ message: 'Test notification sent. It should arrive in a moment.' });
}

/** Cron: send each device's due reminders once per local day. */
async function dispatchPush(env, now) {
  const list = await env.SPENDS_KV.list({ prefix: PUSH_PREFIX });
  for (const { name } of list.keys) {
    const record = await env.SPENDS_KV.get(name, 'json');
    if (!record) continue;
    const local = localParts(now, record.timezone);

    const due = [];
    if (record.prefs.daily.enabled && local.hour === record.prefs.daily.hour) {
      due.push({ kind: 'daily', payload: { title: "Log today's spends", body: 'Takes 5 seconds — keep your balance accurate.', tag: 'daily', url: './#home' } });
    }
    if (record.prefs.wallet && local.weekday === WALLET_SLOT.weekday && local.hour === WALLET_SLOT.hour) {
      due.push({ kind: 'wallet', payload: { title: 'Check your money left', body: 'Open Spends Data to see how much is left this month.', tag: 'wallet', url: './' } });
    }
    if (record.prefs.report && local.weekday === REPORT_SLOT.weekday && local.hour === REPORT_SLOT.hour) {
      due.push({ kind: 'report', payload: { title: 'Weekly report ready', body: 'Your 7-day spend summary is ready to email.', tag: 'report', url: './#reports' } });
    }

    let changed = false;
    for (const item of due) {
      if (record.lastSent[item.kind] === local.date) continue;
      try {
        const result = await sendWebPush(record.subscription, item.payload, env);
        if (result.status === 404 || result.status === 410) {
          await env.SPENDS_KV.delete(name);
          changed = false;
          break;
        }
        if (result.ok) {
          record.lastSent[item.kind] = local.date;
          changed = true;
        }
      } catch (error) {
        console.error('push failed', error);
      }
    }
    if (changed) await env.SPENDS_KV.put(name, JSON.stringify(record));
  }
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: CORS });

    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '');

    // Public VAPID key: the browser needs it before it can subscribe.
    if (request.method === 'GET' && path.endsWith('/push/key')) {
      return json({ publicKey: env.VAPID_PUBLIC_KEY || null, configured: Boolean(env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY) });
    }
    if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

    if (env.WORKER_TOKEN) {
      const auth = request.headers.get('Authorization') || '';
      if (auth !== `Bearer ${env.WORKER_TOKEN}`) return json({ error: 'Unauthorized' }, 401);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'Invalid JSON' }, 400);
    }

    if (path.endsWith('/push/subscribe') || path.endsWith('/push/unsubscribe') || path.endsWith('/push/test')) {
      if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY || !env.VAPID_SUBJECT) {
        return json({ error: 'Push is not configured on this worker (VAPID keys missing).' }, 503);
      }
      if (path.endsWith('/push/subscribe')) return handleSubscribe(body, env);
      if (path.endsWith('/push/unsubscribe')) return handleUnsubscribe(body, env);
      return handleTest(body, env);
    }

    if (!path.endsWith('/schedule')) return json({ error: 'Not found' }, 404);

    if (!body.email || !/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(body.email)) {
      return json({ error: 'Invalid email' }, 400);
    }

    const key = `schedule:${body.email.toLowerCase()}`;
    await env.SPENDS_KV.put(
      key,
      JSON.stringify({
        email: body.email,
        weekday: Number(body.weekday) || 1,
        hour: Number(body.hour) || 9,
        timezone: body.timezone || 'Asia/Kolkata',
        rangeMode: body.rangeMode || 'last7',
        customFrom: body.customFrom || '',
        customTo: body.customTo || '',
        transactions: body.transactions || [],
        updatedAt: new Date().toISOString(),
        lastSentAt: null,
      })
    );

    return json({
      message: `Background delivery scheduled for ${body.email} (every ${
        ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][(body.weekday || 1) - 1]
      } at ${body.hour || 9}:00).`,
    });
  },

  async scheduled(event, env, ctx) {
    const now = new Date();
    ctx.waitUntil(dispatchPush(env, now));
    ctx.waitUntil(
      (async () => {
        const list = await env.SPENDS_KV.list({ prefix: 'schedule:' });
        for (const { name } of list.keys) {
          const raw = await env.SPENDS_KV.get(name);
          if (!raw) continue;
          const schedule = JSON.parse(raw);

          const local = localParts(now, schedule.timezone);
          if (local.weekday !== schedule.weekday || local.hour !== schedule.hour) continue;
          if (schedule.lastSentAt === local.date) continue;

          const fromDate = new Date(`${local.date}T00:00:00Z`);
          fromDate.setUTCDate(fromDate.getUTCDate() - 6);
          const fromISO = fromDate.toISOString().slice(0, 10);

          const digest = buildDigest({
            fromISO,
            toISO: local.date,
            transactions: schedule.transactions,
          });

          try {
            await sendWithEmailJS(env, schedule.email, digest);
            schedule.lastSentAt = local.date;
            await env.SPENDS_KV.put(name, JSON.stringify(schedule));
          } catch (error) {
            console.error('send failed', error);
          }
        }
      })()
    );
  },
};
