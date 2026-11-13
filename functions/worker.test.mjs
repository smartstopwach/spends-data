import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import worker from './worker.js';

const b64u = (bytes) => Buffer.from(bytes).toString('base64url');

/** In-memory KV with the subset of the API the worker uses. */
function memoryKV() {
  const map = new Map();
  return {
    map,
    async get(key, type) {
      const value = map.get(key);
      if (value === undefined) return null;
      return type === 'json' ? JSON.parse(value) : value;
    },
    async put(key, value) {
      map.set(key, value);
    },
    async delete(key) {
      map.delete(key);
    },
    async list({ prefix }) {
      return { keys: [...map.keys()].filter((k) => k.startsWith(prefix)).map((name) => ({ name })) };
    },
  };
}

async function makeEnv() {
  const pair = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
  const vapid = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
  const vapidJwk = await crypto.subtle.exportKey('jwk', vapid.privateKey);
  const vapidPub = new Uint8Array(await crypto.subtle.exportKey('raw', vapid.publicKey));
  return {
    SPENDS_KV: memoryKV(),
    VAPID_PUBLIC_KEY: b64u(vapidPub),
    VAPID_PRIVATE_KEY: vapidJwk.d,
    VAPID_SUBJECT: 'mailto:test@example.com',
    subscription: {
      endpoint: 'https://push.example.net/send/device-1',
      keys: {
        p256dh: b64u(new Uint8Array(await crypto.subtle.exportKey('raw', pair.publicKey))),
        auth: b64u(crypto.getRandomValues(new Uint8Array(16))),
      },
    },
  };
}

const post = (path, body) =>
  new Request(`https://worker.example.dev${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

/** Runs the cron handler and waits for every waitUntil promise. */
async function runCron(env) {
  const pending = [];
  await worker.scheduled({}, env, { waitUntil: (p) => pending.push(p) });
  await Promise.all(pending);
}

let pushCalls;
let pushStatus;

beforeEach(() => {
  pushCalls = [];
  pushStatus = 201;
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url, init) => {
      if (String(url).startsWith('https://push.example.net/')) {
        pushCalls.push({ url: String(url), headers: init.headers });
        return new Response('', { status: pushStatus });
      }
      return new Response('{}', { status: 200 });
    })
  );
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('worker Web Push endpoints', () => {
  it('serves the public VAPID key', async () => {
    const env = await makeEnv();
    const res = await worker.fetch(new Request('https://w.example.dev/push/key'), env);
    const body = await res.json();
    expect(body).toEqual({ publicKey: env.VAPID_PUBLIC_KEY, configured: true });
  });

  it('rejects subscriptions without an https endpoint', async () => {
    const env = await makeEnv();
    const res = await worker.fetch(
      post('/push/subscribe', { subscription: { endpoint: 'http://x', keys: {} }, prefs: {} }),
      env
    );
    expect(res.status).toBe(400);
  });

  it('stores a subscription, sends a test push, and removes it on unsubscribe', async () => {
    const env = await makeEnv();
    const subRes = await worker.fetch(
      post('/push/subscribe', {
        subscription: env.subscription,
        prefs: { daily: { enabled: true, hour: 21 }, wallet: true, report: false },
        timezone: 'Asia/Kolkata',
      }),
      env
    );
    expect(subRes.status).toBe(200);
    expect(env.SPENDS_KV.map.size).toBe(1);

    const testRes = await worker.fetch(post('/push/test', { endpoint: env.subscription.endpoint }), env);
    expect(testRes.status).toBe(200);
    expect(pushCalls).toHaveLength(1);
    expect(pushCalls[0].headers['Content-Encoding']).toBe('aes128gcm');
    expect(pushCalls[0].headers.Authorization).toMatch(/^vapid t=/);

    await worker.fetch(post('/push/unsubscribe', { endpoint: env.subscription.endpoint }), env);
    expect(env.SPENDS_KV.map.size).toBe(0);
  });

  it('requires the worker token when one is set', async () => {
    const env = await makeEnv();
    env.WORKER_TOKEN = 'secret';
    const res = await worker.fetch(post('/push/unsubscribe', { endpoint: 'https://a.b/c' }), env);
    expect(res.status).toBe(401);
  });
});

describe('worker cron push dispatch', () => {
  it('sends the daily reminder once per local day, at the chosen local hour', async () => {
    const env = await makeEnv();
    await worker.fetch(
      post('/push/subscribe', {
        subscription: env.subscription,
        prefs: { daily: { enabled: true, hour: 21 }, wallet: false, report: false },
        timezone: 'Asia/Kolkata',
      }),
      env
    );

    // 21:00 in Kolkata (UTC+5:30) is 15:30 UTC.
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-13T15:30:00Z'));
    await runCron(env);
    expect(pushCalls).toHaveLength(1);

    // Same local day, same hour: no second push.
    await runCron(env);
    expect(pushCalls).toHaveLength(1);

    // Different hour: nothing.
    vi.setSystemTime(new Date('2026-11-13T16:30:00Z'));
    await runCron(env);
    expect(pushCalls).toHaveLength(1);
  });

  it('sends the report reminder on Tuesday 19:00 local time only', async () => {
    const env = await makeEnv();
    await worker.fetch(
      post('/push/subscribe', {
        subscription: env.subscription,
        prefs: { daily: { enabled: false, hour: 21 }, wallet: false, report: true },
        timezone: 'UTC',
      }),
      env
    );
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-16T19:00:00Z')); // Monday
    await runCron(env);
    expect(pushCalls).toHaveLength(0);
    vi.setSystemTime(new Date('2026-11-17T19:00:00Z')); // Tuesday
    await runCron(env);
    expect(pushCalls).toHaveLength(1);
  });

  it('removes a subscription the push service reports as gone', async () => {
    const env = await makeEnv();
    await worker.fetch(
      post('/push/subscribe', {
        subscription: env.subscription,
        prefs: { daily: { enabled: true, hour: 9 }, wallet: false, report: false },
        timezone: 'UTC',
      }),
      env
    );
    pushStatus = 410;
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-13T09:00:00Z'));
    await runCron(env);
    expect(env.SPENDS_KV.map.size).toBe(0);
  });
});
