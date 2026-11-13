import { describe, expect, it } from 'vitest';
import { b64uToBytes, bytesToB64u, encryptPayload, vapidAuthorization } from './webpush.mjs';

// RFC 8291 Appendix A intermediate values (the sender key and salt are fixed there).
const UA_PUBLIC = 'BCVxsr7N_eNgVRqvHtD0zTZsEc6-VV-JvLexhqUzORcxaOzi6-AYWXvTBHm4bjyPjs7Vd8pZGH6SRpkNtoIAiw4';
const AS_PUBLIC = 'BP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A8';
const AS_PRIVATE = 'yfWPiYE-n46HLnH0KqZOF1fJJU3MYrct3AELtAQ-oRw';
const AUTH = 'BTBZMqHH6r4Tts7J_aSIgg';
const SALT = 'DGv6ra1nlYgDCS1FRnbzlw';
const PLAINTEXT = 'When I grow up, I want to be a watermelon';
const EXPECTED_HEADER =
  'DGv6ra1nlYgDCS1FRnbzlwAAEABBBP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A8';
const EXPECTED_CIPHERTEXT =
  '8pfeW0KbunFT06SuDKoJH9Ql87S1QUrdirN6GcG7sFz1y1sqLgVi1VhjVkHsUoEsbI_0LpXMuGvnzQ';

describe('web push encryption (RFC 8291 Appendix A)', () => {
  it('matches the reference message byte for byte', async () => {
    const asBytes = b64uToBytes(AS_PUBLIC); // 0x04 || x || y
    expect(asBytes.length).toBe(65);
    const body = await encryptPayload(
      { p256dh: UA_PUBLIC, auth: AUTH },
      new TextEncoder().encode(PLAINTEXT),
      {
        d: AS_PRIVATE,
        x: bytesToB64u(asBytes.slice(1, 33)),
        y: bytesToB64u(asBytes.slice(33, 65)),
        salt: b64uToBytes(SALT),
      }
    );
    // Compare bytes: the 86-byte header is not a multiple of 3, so base64 strings cannot be joined.
    const expected = new Uint8Array([...b64uToBytes(EXPECTED_HEADER), ...b64uToBytes(EXPECTED_CIPHERTEXT)]);
    expect(body.length).toBe(expected.length);
    expect(bytesToB64u(body)).toBe(bytesToB64u(expected));
  });
});

describe('VAPID authorization (RFC 8292)', () => {
  it('signs a verifiable ES256 JWT for the push service origin', async () => {
    const pair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
    const jwk = await crypto.subtle.exportKey('jwk', pair.privateKey);
    const pub = new Uint8Array(await crypto.subtle.exportKey('raw', pair.publicKey));
    const env = {
      VAPID_PUBLIC_KEY: bytesToB64u(pub),
      VAPID_PRIVATE_KEY: jwk.d,
      VAPID_SUBJECT: 'mailto:test@example.com',
    };
    const auth = await vapidAuthorization('https://push.example.net/send/abc', env);
    const match = /^vapid t=([^.]+)\.([^.]+)\.([^,]+), k=(.+)$/.exec(auth);
    expect(match).not.toBeNull();
    const [, header, claims, sig, k] = match;
    expect(k).toBe(env.VAPID_PUBLIC_KEY);
    expect(JSON.parse(new TextDecoder().decode(b64uToBytes(claims)))).toMatchObject({
      aud: 'https://push.example.net',
      sub: 'mailto:test@example.com',
    });
    const verifyKey = await crypto.subtle.importKey('raw', pub, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
    const ok = await crypto.subtle.verify(
      { name: 'ECDSA', hash: 'SHA-256' },
      verifyKey,
      b64uToBytes(sig),
      new TextEncoder().encode(`${header}.${claims}`)
    );
    expect(ok).toBe(true);
  });
});
