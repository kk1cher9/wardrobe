// Minimal Web Push (RFC 8030 + VAPID RFC 8292 + aes128gcm payload encryption RFC 8291) with no dependencies.
// Configure with VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY (base64url, see README). Without them everything here is a no-op.
const crypto = require('crypto');

const b64u = (b) => Buffer.from(b).toString('base64url');
const unb64u = (s) => Buffer.from(String(s), 'base64url');
const enabled = () => !!(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
const publicKey = () => process.env.VAPID_PUBLIC_KEY || null;

function vapidJwt(aud, subject) {
  const pub = unb64u(process.env.VAPID_PUBLIC_KEY), d = process.env.VAPID_PRIVATE_KEY;
  const key = crypto.createPrivateKey({ key: { kty: 'EC', crv: 'P-256', d, x: b64u(pub.subarray(1, 33)), y: b64u(pub.subarray(33, 65)) }, format: 'jwk' });
  const head = b64u(JSON.stringify({ typ: 'JWT', alg: 'ES256' })), claims = b64u(JSON.stringify({ aud, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: subject }));
  const sig = crypto.sign('sha256', Buffer.from(head + '.' + claims), { key, dsaEncoding: 'ieee-p1363' });
  return head + '.' + claims + '.' + b64u(sig);
}

// RFC 8291 §3.4 — `opts.asPrivate/asSalt` exist only so tests can use fixed values
function encrypt(plain, uaPublicB64, authB64, opts) {
  opts = opts || {};
  const uaPub = unb64u(uaPublicB64), auth = unb64u(authB64);
  const ecdh = crypto.createECDH('prime256v1');
  if (opts.asPrivate) ecdh.setPrivateKey(unb64u(opts.asPrivate)); else ecdh.generateKeys();
  const asPub = ecdh.getPublicKey(), secret = ecdh.computeSecret(uaPub);
  const salt = opts.asSalt ? unb64u(opts.asSalt) : crypto.randomBytes(16);
  const prk = Buffer.from(crypto.hkdfSync('sha256', secret, auth, Buffer.concat([Buffer.from('WebPush: info\0'), uaPub, asPub]), 32));
  const cek = Buffer.from(crypto.hkdfSync('sha256', prk, salt, Buffer.from('Content-Encoding: aes128gcm\0'), 16));
  const nonce = Buffer.from(crypto.hkdfSync('sha256', prk, salt, Buffer.from('Content-Encoding: nonce\0'), 12));
  const cipher = crypto.createCipheriv('aes-128-gcm', cek, nonce);
  const ct = Buffer.concat([cipher.update(Buffer.concat([Buffer.from(plain), Buffer.from([2])])), cipher.final(), cipher.getAuthTag()]);
  const rs = Buffer.alloc(4); rs.writeUInt32BE(4096);
  return Buffer.concat([salt, rs, Buffer.from([asPub.length]), asPub, ct]);
}

async function send(sub, payload, req) {
  if (!enabled() || !sub || !sub.endpoint || !sub.keys) return null;
  try {
    const u = new URL(sub.endpoint);
    const host = req && req.headers && (req.headers['x-forwarded-host'] || req.headers.host);
    const subject = process.env.VAPID_SUBJECT || (host ? 'https://' + String(host).split(',')[0].trim() : 'mailto:admin@example.com');
    const body = encrypt(JSON.stringify(payload), sub.keys.p256dh, sub.keys.auth);
    const r = await fetch(sub.endpoint, { method: 'POST', body, headers: { Authorization: 'vapid t=' + vapidJwt(u.origin, subject) + ', k=' + publicKey(), 'Content-Encoding': 'aes128gcm', 'Content-Type': 'application/octet-stream', TTL: '86400', Urgency: 'high' } });
    return { status: r.status, gone: r.status === 404 || r.status === 410 };
  } catch (e) { return { status: 0, gone: false }; }
}

module.exports = { enabled, publicKey, send, encrypt, vapidJwt };
