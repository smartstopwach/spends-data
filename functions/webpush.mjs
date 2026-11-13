/**
 * Web Push sending for the Spends Data worker, using only Web Crypto and fetch so it
 * runs on Cloudflare Workers and in Node 20+.
 *
 * - VAPID (RFC 8292): an ES256 JWT that identifies the sender to the push service.
 * - Message encryption (RFC 8291 + RFC 8188, aes128gcm): the payload is encrypted for
 *   the browser's subscription keys, so the push service cannot read it.
 */

const enc = new TextEncoder();

export const b64uToBytes = (value) => {
  const padding = '='.repeat((4 - (value.length % 4)) % 4);
  const binary = atob((value + padding).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
};

export const bytesToB64u = (bytes) => {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const concat = (...parts) => {
  const total = parts.reduce((n, part) => n + part.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
};

export async function sha256Hex(text) {
  const digest = await crypto.subtle.digest('SHA-256', enc.encode(text));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function hkdf(salt, ikm, info, length) {
  const key = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info }, key, length * 8);
  return new Uint8Array(bits);
}

/**
 * Encrypts one payload for a push subscription (RFC 8291, aes128gcm).
 * @param {{p256dh: string, auth: string}} keys base64url keys from PushSubscription.toJSON()
 * @param {Uint8Array} plaintext
 * @param {{d: string, x: string, y: string, salt: Uint8Array} | null} [fixed]
 *   Test hook only: a fixed sender key (JWK parts) and salt, used to check RFC 8291 Appendix A.
 * @returns {Promise<Uint8Array>} the request body
 */
export async function encryptPayload(keys, plaintext, fixed = null) {
  const uaPublic = b64uToBytes(keys.p256dh); // 65 bytes, uncompressed P-256 point
  const authSecret = b64uToBytes(keys.auth); // 16 bytes

  // Ephemeral sender key pair for this message (random unless a test fixes it).
  const ephemeral = fixed
    ? {
        privateKey: await crypto.subtle.importKey(
          'jwk',
          { kty: 'EC', crv: 'P-256', x: fixed.x, y: fixed.y, d: fixed.d, ext: true },
          { name: 'ECDH', namedCurve: 'P-256' },
          false,
          ['deriveBits']
        ),
        publicKey: await crypto.subtle.importKey(
          'jwk',
          { kty: 'EC', crv: 'P-256', x: fixed.x, y: fixed.y, ext: true },
          { name: 'ECDH', namedCurve: 'P-256' },
          true,
          []
        ),
      }
    : await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
  const asPublic = new Uint8Array(await crypto.subtle.exportKey('raw', ephemeral.publicKey));

  const uaKey = await crypto.subtle.importKey('raw', uaPublic, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  const ecdhSecret = new Uint8Array(
    await crypto.subtle.deriveBits({ name: 'ECDH', public: uaKey }, ephemeral.privateKey, 256)
  );

  // RFC 8291 section 3.3 / 3.4.
  const keyInfo = concat(enc.encode('WebPush: info\0'), uaPublic, asPublic);
  const ikm = await hkdf(authSecret, ecdhSecret, keyInfo, 32);

  // RFC 8188: per-message salt, content encryption key and nonce.
  const salt = fixed ? fixed.salt : crypto.getRandomValues(new Uint8Array(16));
  const cek = await hkdf(salt, ikm, enc.encode('Content-Encoding: aes128gcm\0'), 16);
  const nonce = await hkdf(salt, ikm, enc.encode('Content-Encoding: nonce\0'), 12);

  // Single record: plaintext, then the 0x02 "last record" delimiter.
  const aesKey = await crypto.subtle.importKey('raw', cek, 'AES-GCM', false, ['encrypt']);
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: nonce, tagLength: 128 },
      aesKey,
      concat(plaintext, new Uint8Array([2]))
    )
  );

  const recordSize = new Uint8Array([0, 0, 16, 0]); // 4096, big-endian
  return concat(salt, recordSize, new Uint8Array([asPublic.length]), asPublic, ciphertext);
}

/**
 * VAPID Authorization header for one push endpoint (RFC 8292).
 * @param {string} endpoint push service URL
 * @param {{VAPID_PUBLIC_KEY: string, VAPID_PRIVATE_KEY: string, VAPID_SUBJECT: string}} env
 */
export async function vapidAuthorization(endpoint, env) {
  const header = bytesToB64u(enc.encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
  const claims = bytesToB64u(
    enc.encode(
      JSON.stringify({
        aud: new URL(endpoint).origin,
        exp: Math.floor(Date.now() / 1000) + 12 * 3600, // must be under 24h
        sub: env.VAPID_SUBJECT,
      })
    )
  );
  const unsigned = `${header}.${claims}`;

  const publicKey = b64uToBytes(env.VAPID_PUBLIC_KEY); // 0x04 || x || y
  const key = await crypto.subtle.importKey(
    'jwk',
    {
      kty: 'EC',
      crv: 'P-256',
      x: bytesToB64u(publicKey.slice(1, 33)),
      y: bytesToB64u(publicKey.slice(33, 65)),
      d: env.VAPID_PRIVATE_KEY,
      ext: true,
    },
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );
  // Web Crypto returns the raw r||s signature, which is the JWS format JWT needs.
  const signature = new Uint8Array(
    await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, enc.encode(unsigned))
  );

  return `vapid t=${unsigned}.${bytesToB64u(signature)}, k=${env.VAPID_PUBLIC_KEY}`;
}

/**
 * Sends one encrypted message to a stored subscription.
 * @returns {Promise<{ok: boolean, status: number}>} 404/410 mean the subscription is gone
 */
export async function sendWebPush(subscription, payload, env) {
  const body = await encryptPayload(subscription.keys, enc.encode(JSON.stringify(payload)));
  const res = await fetch(subscription.endpoint, {
    method: 'POST',
    headers: {
      TTL: '86400',
      'Content-Encoding': 'aes128gcm',
      'Content-Type': 'application/octet-stream',
      Urgency: 'normal',
      Authorization: await vapidAuthorization(subscription.endpoint, env),
    },
    body,
  });
  return { ok: res.ok, status: res.status };
}
