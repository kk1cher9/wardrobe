// Shared helpers for the serverless API (Vercel Node functions). No npm dependencies.
const crypto = require('crypto');

const isProd = !!process.env.VERCEL || process.env.NODE_ENV === 'production';
const KV_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const CERTS_URL = process.env.GOOGLE_CERTS_URL || 'https://www.googleapis.com/oauth2/v3/certs';

const err = (status, code) => Object.assign(new Error(code), { status, code });
const b64u = (v) => Buffer.from(v).toString('base64url');

function send(res, status, obj) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(obj));
}
function body(req) {
  const b = req.body;
  if (b && typeof b === 'object') return b;
  try { return JSON.parse(b || '{}'); } catch { throw err(400, 'bad_json'); }
}

/* ---------- signed session cookie (HMAC-SHA256, HttpOnly) ---------- */
function secret() {
  const s = process.env.SESSION_SECRET;
  if (s && s.length >= 32) return s;
  if (!isProd) return 'dev-only-insecure-secret-change-me-0123456789abcdef';
  throw err(500, 'session_secret_missing');
}
const sign = (v) => crypto.createHmac('sha256', secret()).update(v).digest('base64url');
function makeSession(user) {
  const p = b64u(JSON.stringify({ ...user, exp: Date.now() + 30 * 864e5 }));
  return p + '.' + sign(p);
}
function readSession(req) {
  const m = /(?:^|;\s*)wd_session=([^;]+)/.exec(req.headers.cookie || '');
  if (!m) return null;
  const [p, sig] = m[1].split('.');
  if (!p || !sig) return null;
  let expected;
  try { expected = sign(p); } catch { return null; }
  if (expected.length !== sig.length || !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) return null;
  try {
    const u = JSON.parse(Buffer.from(p, 'base64url').toString());
    return u && u.sub && u.exp > Date.now() ? u : null;
  } catch { return null; }
}
function cookieHeader(req, value, maxAge) {
  const local = /^(localhost|127\.0\.0\.1)(:|$)/.test(req.headers.host || '');
  return `wd_session=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${local ? '' : '; Secure'}`;
}

/* ---------- Google ID-token verification (RS256, JWKS) ---------- */
let certCache = { at: 0, keys: [] };
async function googleKeys(force) {
  if (!force && Date.now() - certCache.at < 3600e3 && certCache.keys.length) return certCache.keys;
  const r = await fetch(CERTS_URL);
  if (!r.ok) throw err(502, 'google_certs_unavailable');
  certCache = { at: Date.now(), keys: (await r.json()).keys || [] };
  return certCache.keys;
}
async function verifyGoogle(idToken, clientId) {
  const parts = String(idToken || '').split('.');
  if (parts.length !== 3) throw err(401, 'bad_token');
  let header, claims;
  try {
    header = JSON.parse(Buffer.from(parts[0], 'base64url').toString());
    claims = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
  } catch { throw err(401, 'bad_token'); }
  if (header.alg !== 'RS256') throw err(401, 'bad_alg');
  let jwk = (await googleKeys(false)).find((k) => k.kid === header.kid);
  if (!jwk) jwk = (await googleKeys(true)).find((k) => k.kid === header.kid);
  if (!jwk) throw err(401, 'unknown_key');
  const valid = crypto.verify('RSA-SHA256', Buffer.from(parts[0] + '.' + parts[1]),
    crypto.createPublicKey({ key: jwk, format: 'jwk' }), Buffer.from(parts[2], 'base64url'));
  if (!valid) throw err(401, 'bad_signature');
  if (!['https://accounts.google.com', 'accounts.google.com'].includes(claims.iss)) throw err(401, 'bad_issuer');
  if (claims.aud !== clientId) throw err(401, 'bad_audience');
  if (!(claims.exp * 1000 > Date.now())) throw err(401, 'token_expired');
  if (!claims.sub || !/^[\w-]{1,64}$/.test(claims.sub)) throw err(401, 'bad_subject');
  if (claims.email && claims.email_verified === false) throw err(401, 'email_not_verified');
  return claims;
}

/* ---------- storage: Upstash/Vercel KV over REST (in-memory only for local dev) ---------- */
const mem = new Map();
/* In-memory emulation of the Redis commands we use (local dev + tests only). Semantics follow Redis/Upstash. */
function memCmd([c, k, ...a]) {
  c = String(c).toUpperCase();
  const typed = (T) => { let x = mem.get(k); if (x === undefined) { x = new T(); mem.set(k, x); } if (!(x instanceof T)) throw err(500, 'wrongtype'); return x; };
  const peek = (T) => { const x = mem.get(k); return x instanceof T ? x : null; };
  const fnum = (v) => { v = String(v); return v === '+inf' || v === 'inf' ? Infinity : v === '-inf' ? -Infinity : Number(v); };
  const bound = (v, lo) => { v = String(v); const ex = v[0] === '('; const n = fnum(ex ? v.slice(1) : v); return { n, ex }; };
  const zsorted = (z, rev) => { const r = [...z.entries()].sort((x, y) => (x[1] - y[1]) || (x[0] < y[0] ? -1 : x[0] > y[0] ? 1 : 0)); return rev ? r.reverse() : r; };
  const withScores = (rows, ws) => (ws ? rows.flatMap(([m, sc]) => [m, String(sc)]) : rows.map((r) => r[0]));
  const rng = (rows, s, e) => { s = Number(s); e = Number(e); const n = rows.length; if (s < 0) s = Math.max(0, n + s); if (e < 0) e = n + e; return rows.slice(s, e + 1); };
  switch (c) {
    case 'GET': { const v = mem.get(k); return typeof v === 'string' ? v : null; }
    case 'MGET': return [k, ...a].map((x) => { const v = mem.get(x); return typeof v === 'string' ? v : null; });
    case 'SET': {
      const opts = a.slice(1).map((x) => String(x).toUpperCase());
      if (opts.includes('NX') && mem.has(k)) return null;
      mem.set(k, String(a[0])); return 'OK';
    }
    case 'DEL': { let n = 0;[k, ...a].forEach((x) => { if (mem.delete(x)) n++; }); return n; }
    case 'EXISTS': return mem.has(k) ? 1 : 0;
    case 'INCR': { const n = (Number(mem.get(k)) || 0) + 1; mem.set(k, String(n)); return n; }
    case 'DECR': { const n = (Number(mem.get(k)) || 0) - 1; mem.set(k, String(n)); return n; }
    case 'EXPIRE': return 1;
    case 'PERSIST': return 1;
    case 'HSET': { const m = typed(Map); let n = 0; for (let i = 0; i < a.length; i += 2) { if (!m.has(String(a[i]))) n++; m.set(String(a[i]), String(a[i + 1])); } return n; }
    case 'HGET': { const m = peek(Map); return m && m.has(String(a[0])) ? m.get(String(a[0])) : null; }
    case 'HDEL': { const m = peek(Map); let n = 0; if (m) a.forEach((f) => { if (m.delete(String(f))) n++; }); return n; }
    case 'HINCRBY': { const m = typed(Map); const n = (Number(m.get(String(a[0]))) || 0) + Number(a[1]); m.set(String(a[0]), String(n)); return n; }
    case 'HEXISTS': { const m = peek(Map); return m && m.has(String(a[0])) ? 1 : 0; }
    case 'HLEN': { const m = peek(Map); return m ? m.size : 0; }
    case 'HMGET': { const m = peek(Map); return a.map((f) => (m && m.has(String(f)) ? m.get(String(f)) : null)); }
    case 'HGETALL': { const m = peek(Map), o = []; if (m) m.forEach((v, f) => o.push(f, v)); return o; }
    case 'SADD': { const s = typed(Set); let n = 0; a.forEach((x) => { x = String(x); if (!s.has(x)) { s.add(x); n++; } }); return n; }
    case 'SREM': { const s = peek(Set); let n = 0; if (s) a.forEach((x) => { if (s.delete(String(x))) n++; }); return n; }
    case 'SISMEMBER': { const s = peek(Set); return s && s.has(String(a[0])) ? 1 : 0; }
    case 'SCARD': { const s = peek(Set); return s ? s.size : 0; }
    case 'SMEMBERS': { const s = peek(Set); return s ? [...s] : []; }
    case 'ZADD': { const z = typed(Map); let n = 0; for (let i = 0; i < a.length; i += 2) { const m = String(a[i + 1]); if (!z.has(m)) n++; z.set(m, Number(a[i])); } return n; }
    case 'ZREM': { const z = peek(Map); let n = 0; if (z) a.forEach((m) => { if (z.delete(String(m))) n++; }); return n; }
    case 'ZSCORE': { const z = peek(Map); return z && z.has(String(a[0])) ? String(z.get(String(a[0]))) : null; }
    case 'ZCARD': { const z = peek(Map); return z ? z.size : 0; }
    case 'ZCOUNT': { const z = peek(Map); if (!z) return 0; const lo = bound(a[0]), hi = bound(a[1]); return [...z.values()].filter((v) => (lo.ex ? v > lo.n : v >= lo.n) && (hi.ex ? v < hi.n : v <= hi.n)).length; }
    case 'ZREVRANGE': case 'ZRANGE': { const z = peek(Map); if (!z) return []; const rows = rng(zsorted(z, c === 'ZREVRANGE'), a[0], a[1]); return withScores(rows, String(a[2] || '').toUpperCase() === 'WITHSCORES'); }
    case 'ZREVRANGEBYSCORE': { // key max min [WITHSCORES] [LIMIT off cnt]
      const z = peek(Map); if (!z) return []; const hi = bound(a[0]), lo = bound(a[1]);
      let rows = zsorted(z, true).filter(([, v]) => (lo.ex ? v > lo.n : v >= lo.n) && (hi.ex ? v < hi.n : v <= hi.n));
      const up = a.map((x) => String(x).toUpperCase()), li = up.indexOf('LIMIT');
      if (li >= 0) rows = rows.slice(Number(a[li + 1]), Number(a[li + 1]) + Number(a[li + 2]));
      return withScores(rows, up.includes('WITHSCORES'));
    }
    case 'ZREMRANGEBYRANK': { const z = peek(Map); if (!z) return 0; const rows = rng(zsorted(z, false), a[0], a[1]); rows.forEach(([m]) => z.delete(m)); return rows.length; }
    default: throw err(500, 'unsupported_command');
  }
}
async function db(...args) {
  if (KV_URL) {
    const r = await fetch(KV_URL, { method: 'POST', headers: { Authorization: 'Bearer ' + KV_TOKEN, 'Content-Type': 'application/json' }, body: JSON.stringify(args) });
    const j = await r.json();
    if (!r.ok || j.error) throw err(502, 'kv_error');
    return j.result;
  }
  if (isProd && !process.env.ALLOW_MEMORY_DB) throw err(503, 'db_not_configured');
  return memCmd(args);
}
// Several commands in ONE round trip (Upstash /pipeline). Returns an array of results in order.
async function dbm(cmds) {
  if (!cmds.length) return [];
  if (KV_URL) {
    const r = await fetch(KV_URL.replace(/\/$/, '') + '/pipeline', { method: 'POST', headers: { Authorization: 'Bearer ' + KV_TOKEN, 'Content-Type': 'application/json' }, body: JSON.stringify(cmds) });
    const j = await r.json();
    if (!r.ok || !Array.isArray(j)) throw err(502, 'kv_error');
    return j.map((x) => { if (x.error) throw err(502, 'kv_error'); return x.result; });
  }
  if (isProd && !process.env.ALLOW_MEMORY_DB) throw err(503, 'db_not_configured');
  return cmds.map((c) => memCmd(c));
}
const syncAvailable = () => !!KV_URL || !isProd || !!process.env.ALLOW_MEMORY_DB;

// per-user quota for paid AI endpoints (protects your API keys/costs)
async function rateLimit(user, name, max, windowSec = 86400) {
  const k = `wd:rl:${name}:${user.sub}:${Math.floor(Date.now() / 1000 / windowSec)}`;
  const n = await db('INCR', k);
  if (n === 1) await db('EXPIRE', k, windowSec + 5);
  if (n > max) throw err(429, 'rate_limited');
  return n;
}

// Account bans: BANNED_NICKS env (comma/space separated nicks). The account is remembered by its id, so changing the nick does not help.
const banNickCache = new Map();
async function isBanned(sub) {
  try {
    if (!sub) return false;
    const nicks = (process.env.BANNED_NICKS || '').split(/[\s,]+/).map((x) => x.trim().toLowerCase().replace(/^@/, '')).filter(Boolean);
    const mk = await db('GET', 'wd:s:ban:' + sub);
    if (mk) { // remembered by account id (a rename does not help) but BANNED_NICKS stays the single switch: remove the nick there and the ban is lifted
      let nick = mk === '1' ? null : String(mk);
      if (!nick) { try { const pr = JSON.parse(await db('GET', 'wd:s:prof:' + sub)); nick = pr && pr.nick; } catch { nick = null; } } // older markers did not store the nick
      if (nick && nicks.includes(nick)) { if (mk === '1') await db('SET', 'wd:s:ban:' + sub, nick); return true; }
      await db('DEL', 'wd:s:ban:' + sub); await db('SREM', 'wd:s:bans', sub); return false;
    }
    for (const n of nicks) {
      let c = banNickCache.get(n);
      if (!c || Date.now() - c.t > 60000) { const v = await db('GET', 'wd:s:nick:' + n); c = { t: Date.now(), sub: v }; if (v) banNickCache.set(n, c); } // unknown nicks are re-checked every time (the account may be created later)
      if (c.sub && c.sub === sub) { await db('SET', 'wd:s:ban:' + sub, n); await db('SADD', 'wd:s:bans', sub); return true; }
    }
  } catch { /* storage not configured: nobody is banned */ }
  return false;
}
async function assertNotBanned(sub) { if (await isBanned(sub)) throw err(403, 'banned'); }

function handler(fn, { auth = true, csrf = true } = {}) {
  return async (req, res) => {
    try {
      if (csrf && req.method !== 'GET' && req.headers['x-requested-with'] !== 'wd') return send(res, 403, { error: 'csrf' });
      const user = readSession(req);
      if (auth && !user) return send(res, 401, { error: 'unauthorized' });
      if (user && req.method !== 'DELETE') await assertNotBanned(user.sub);
      await fn(req, res, user);
    } catch (e) {
      send(res, e.status || 500, { error: e.code || 'server_error' });
    }
  };
}

async function rateRefund(user, name, windowSec = 86400) { // give the call back when OUR provider failed (not the user's fault)
  try { await db('DECR', `wd:rl:${name}:${user.sub}:${Math.floor(Date.now() / 1000 / windowSec)}`); } catch { /* ignore */ }
}

// AI endpoints work WITHOUT Google sign-in. Cost protection: per-identity daily cap (signed-in user id, otherwise hashed IP) + a global daily cap.
const who = (req, user) => user || { sub: 'ip-' + crypto.createHash('sha256').update(String((req.headers && req.headers['x-forwarded-for']) || (req.socket && req.socket.remoteAddress) || 'local').split(',')[0].trim()).digest('hex').slice(0, 16) };
async function aiLimit(req, user, name, max) {
  const id = who(req, user);
  await rateLimit(id, name, max);
  try { await rateLimit({ sub: 'all' }, name + '-g', Number(process.env.AI_GLOBAL_DAILY) || 1000); } catch (e) { await rateRefund(id, name); throw err(429, 'global_limit'); }
  return id;
}

module.exports = { isBanned, assertNotBanned, dbm, who, aiLimit, err, send, body, handler, makeSession, readSession, cookieHeader, verifyGoogle, db, syncAvailable, rateLimit, rateRefund };
